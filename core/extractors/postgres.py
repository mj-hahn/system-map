"""Replay Postgres migrations into a schema, and record where each fact came from.

Migrations run in file order, so a later `ALTER` or drop changes what an earlier file
said. Every statement is either applied, knowingly ignored, or counted in `unknown` by
its first words, so a reader can see exactly what was left out.
"""
from __future__ import annotations

import re
from collections import Counter
from dataclasses import dataclass, field

ENGINE = "postgres"
MIGRATION_DIRS = ("supabase/migrations/", "db/migrations/", "migrations/")
IDENT = r'(?:"[^"]+"|[A-Za-z_][\w$]*)'
QUALIFIED = rf"(?:{IDENT}\s*\.\s*)?{IDENT}"
#: Statements that shape data or privileges, not structure.
IGNORED = re.compile(
    r"^(grant|revoke|comment\s+on|create\s+extension|alter\s+extension|create\s+schema|"
    r"create\s+(or\s+replace\s+)?(function|procedure)|drop\s+(function|procedure)|"
    r"alter\s+(function|procedure|default\s+privileges|publication|role|schema)|"
    r"create\s+role|set|reset|begin|commit|start\s+transaction|insert|update|delete|"
    r"select|with|notify|analyze|vacuum|truncate)\b",
    re.I,
)


TYPE_ALIASES = {
    "int": "integer",
    "int4": "integer",
    "int8": "bigint",
    "int2": "smallint",
    "bool": "boolean",
    "timestamptz": "timestamp with time zone",
    "timestamp": "timestamp without time zone",
    "timetz": "time with time zone",
    "time": "time without time zone",
    "varchar": "character varying",
    "decimal": "numeric",
    "float8": "double precision",
    "float4": "real",
    "serial": "integer",
    "bigserial": "bigint",
}


def normal_type(text: str) -> str:
    value = " ".join(text.lower().replace('"', "").split())
    value = value.replace("public.", "").replace("extensions.", "")
    value = re.sub(r"\s*,\s*", ",", value)
    array = value.endswith("[]")
    base = value[:-2] if array else value
    match = re.fullmatch(r"([a-z0-9_ ]+?)\s*(\(.*\))?", base)
    if match:
        base = TYPE_ALIASES.get(match.group(1), match.group(1)) + (match.group(2) or "")
    return base + ("[]" if array else "")


def bare(name: str) -> str:
    """Drop the schema and quotes from a name: public."Users" -> Users."""
    return re.split(r"\s*\.\s*(?=[^.]*$)", name)[-1].strip('"')


def schema_of(name: str) -> str:
    parts = re.split(r"\s*\.\s*(?=[^.]*$)", name)
    return parts[0].strip('"') if len(parts) > 1 else "public"


def qualified(name: str) -> str:
    return f"{schema_of(name)}.{bare(name)}"


def mask_sql(sql: str) -> tuple[str, str]:
    """Return (clean, mask), two strings the same length as `sql`.

    `clean` has comments blanked. `mask` also has string and dollar-quoted bodies
    blanked, so keywords can be matched safely. An offset in one is valid in the other,
    and newlines survive, so an offset still maps to the right line.
    """
    clean: list[str] = []
    mask: list[str] = []

    def keep(segment: str) -> None:
        clean.append(segment)
        mask.append(segment)

    def blank(segment: str) -> str:
        return "".join("\n" if c == "\n" else " " for c in segment)

    i, n = 0, len(sql)
    while i < n:
        c = sql[i]
        if sql.startswith("--", i):
            end = sql.find("\n", i)
            end = n if end == -1 else end
            keep(blank(sql[i:end]))
            i = end
        elif sql.startswith("/*", i):
            end = sql.find("*/", i + 2)
            end = n if end == -1 else end + 2
            keep(blank(sql[i:end]))
            i = end
        elif c == "'":
            j = i + 1
            while j < n:
                if sql[j] == "'":
                    if j + 1 < n and sql[j + 1] == "'":
                        j += 2
                        continue
                    break
                j += 1
            segment = sql[i : j + 1]
            clean.append(segment)
            mask.append(blank(segment))
            i = j + 1
        elif c == '"':
            end = sql.find('"', i + 1)
            end = n if end == -1 else end + 1
            keep(sql[i:end])
            i = end
        elif c == "$":
            match = re.match(r"\$[A-Za-z_]*\$", sql[i:])
            if match:
                tag = match.group(0)
                end = sql.find(tag, i + len(tag))
                end = n if end == -1 else end + len(tag)
                segment = sql[i:end]
                clean.append(segment)
                mask.append(blank(segment))
                i = end
            else:
                keep(c)
                i += 1
        else:
            keep(c)
            i += 1
    return "".join(clean), "".join(mask)


@dataclass
class Stmt:
    path: str
    line: int
    raw: str
    mask: str

    def at(self, offset: int) -> str:
        """The `path:line` of an offset in this statement."""
        skip = len(self.mask[offset:]) - len(self.mask[offset:].lstrip())
        return f"{self.path}:{self.line + self.mask.count(chr(10), 0, offset + skip)}"


def statements_of(sql: str, path: str = "") -> list[Stmt]:
    """Split a file into statements."""
    clean, mask = mask_sql(sql)
    found: list[Stmt] = []
    start, depth = 0, 0
    for i, c in enumerate(mask):
        if c == "(":
            depth += 1
        elif c == ")":
            depth -= 1
        elif c == ";" and depth == 0:
            found.extend(_stmt(clean, mask, start, i, path))
            start = i + 1
    found.extend(_stmt(clean, mask, start, len(mask), path))
    return found


def _stmt(clean: str, mask: str, start: int, end: int, path: str) -> list[Stmt]:
    body = mask[start:end]
    stripped = body.lstrip()
    if not stripped.strip() and not clean[start:end].strip():
        return []
    if not stripped:
        return []
    offset = start + len(body) - len(stripped)
    return [Stmt(path, mask.count("\n", 0, offset) + 1, clean[offset:end], mask[offset:end])]


def split_top_level(mask: str, start: int = 0, end: int | None = None) -> list[tuple[int, int]]:
    """Split on commas outside parentheses. Returns (start, end) offsets."""
    end = len(mask) if end is None else end
    parts: list[tuple[int, int]] = []
    depth, begin = 0, start
    for i in range(start, end):
        c = mask[i]
        if c == "(":
            depth += 1
        elif c == ")":
            depth -= 1
        elif c == "," and depth == 0:
            parts.append((begin, i))
            begin = i + 1
    parts.append((begin, end))
    return [(a, b) for a, b in parts if mask[a:b].strip()]


def matching_paren(mask: str, open_at: int) -> int:
    depth = 0
    for i in range(open_at, len(mask)):
        if mask[i] == "(":
            depth += 1
        elif mask[i] == ")":
            depth -= 1
            if depth == 0:
                return i
    return -1


def _names(text: str) -> list[str]:
    return [bare(part.strip().split()[0]) for part in text.split(",") if part.strip()]


TABLE_CLAUSE = re.compile(
    rf"^\s*(?:constraint\s+({IDENT})\s+)?(primary\s+key|foreign\s+key|unique|check|exclude)\b", re.I
)
REFERENCES = re.compile(rf"\breferences\s+({QUALIFIED})(?:\s*\(([^)]*)\))?", re.I)
DELETE_RULE = re.compile(r"\bon\s+delete\s+(cascade|set\s+null|set\s+default|restrict|no\s+action)", re.I)
UPDATE_RULE = re.compile(r"\bon\s+update\s+(cascade|set\s+null|set\s+default|restrict|no\s+action)", re.I)
TYPE_STOP = re.compile(
    r"\b(primary\s+key|not\s+null|null|unique|references|default|check|generated|constraint|collate)\b",
    re.I,
)
AFTER_DEFAULT = re.compile(
    r"\b(primary\s+key|not\s+null|null|unique|references|check|generated|constraint|collate)\b", re.I
)


@dataclass
class Table:
    name: str
    schema: str
    source: str
    columns: dict[str, dict] = field(default_factory=dict)
    constraints: list[dict] = field(default_factory=list)
    indexes: dict[str, dict] = field(default_factory=dict)
    policies: dict[str, dict] = field(default_factory=dict)
    triggers: dict[str, dict] = field(default_factory=dict)
    rls: bool = False
    rls_source: str | None = None

    @property
    def key(self) -> str:
        return f"{self.schema}.{self.name}"

    def unique_name(self, base: str) -> str:
        taken = {c.get("name") for c in self.constraints}
        if base not in taken:
            return base
        number = 1
        while f"{base}{number}" in taken:
            number += 1
        return f"{base}{number}"

    def to_shard(self) -> dict:
        return {
            "id": f"table:{self.key}",
            "kind": "table",
            "status": "built",
            "layer": "facts",
            "name": self.name,
            "schema": self.schema,
            "source": self.source,
            "evidence": [self.source],
            "rls": self.rls,
            "rls_source": self.rls_source,
            "columns": list(self.columns.values()),
            "constraints": self.constraints,
            "indexes": list(self.indexes.values()),
            "policies": list(self.policies.values()),
            "triggers": list(self.triggers.values()),
        }


@dataclass
class Schema:
    tables: dict[str, Table] = field(default_factory=dict)
    types: dict[str, dict] = field(default_factory=dict)
    applied: int = 0
    ignored: int = 0
    unknown: Counter = field(default_factory=Counter)
    usage: list[str] = field(default_factory=list)

    def table(self, name: str) -> Table | None:
        return self.tables.get(qualified(name))

    def finish(self) -> None:
        """Fill in what Postgres implies: a foreign key with no columns targets the key."""
        for table in self.tables.values():
            for constraint in table.constraints:
                if constraint["kind"] != "foreign_key" or constraint["reference_columns"]:
                    continue
                target = self.tables.get(constraint["references"])
                primary = next(
                    (c for c in (target.constraints if target else []) if c["kind"] == "primary_key"), None
                )
                if primary:
                    constraint["reference_columns"] = list(primary["columns"])


def _foreign_key(table: Table, name: str | None, columns: list[str], text: str, source: str) -> dict:
    ref = REFERENCES.search(text)
    delete = DELETE_RULE.search(text)
    update = UPDATE_RULE.search(text)
    return {
        "name": name or table.unique_name(f"{table.name}_{'_'.join(columns)}_fkey"),
        "kind": "foreign_key",
        "columns": columns,
        "references": qualified(ref.group(1)),
        "reference_columns": _names(ref.group(2) or ""),
        "on_delete": " ".join(delete.group(1).lower().split()) if delete else "no action",
        "on_update": " ".join(update.group(1).lower().split()) if update else "no action",
        "source": source,
    }


def _check(table: Table, stmt: Stmt, start: int, end: int, source: str, given: str | None = None) -> dict:
    """Build a check, named the way Postgres names it.

    An unnamed check takes its column's name only when its expression uses exactly one
    column, wherever it was written. So this needs every column to be known first.
    """
    used = [c for c in table.columns if re.search(rf"\b{re.escape(c)}\b", stmt.mask[start:end])]
    base = f"{table.name}_{used[0]}_check" if len(used) == 1 else f"{table.name}_check"
    return {
        "name": given or table.unique_name(base),
        "kind": "check",
        "columns": used if len(used) == 1 else [],
        "expression": " ".join(stmt.raw[start:end].split()),
        "source": source,
    }


def _parse_clause(table: Table, stmt: Stmt, start: int, end: int) -> dict | None:
    """Read a table-level constraint, or return None if this is not one."""
    text = stmt.mask[start:end]
    match = TABLE_CLAUSE.match(text)
    if not match:
        return None
    source = stmt.at(start)
    given = bare(match.group(1)) if match.group(1) else None
    kind = " ".join(match.group(2).lower().split()).replace(" ", "_")
    open_at = text.find("(", match.end())
    if kind == "check":
        close_at = matching_paren(text, open_at)
        return _check(table, stmt, start + open_at + 1, start + close_at, source, given)
    close_at = matching_paren(text, open_at) if open_at >= 0 else -1
    columns = _names(text[open_at + 1 : close_at]) if close_at >= 0 else []
    if kind == "foreign_key":
        return _foreign_key(table, given, columns, text, source)
    if kind == "primary_key":
        for name in columns:
            if name in table.columns:
                table.columns[name]["nullable"] = False
    base = f"{table.name}_pkey" if kind == "primary_key" else f"{table.name}_{'_'.join(columns)}_key"
    return {"name": given or table.unique_name(base), "kind": kind, "columns": columns, "source": source}


def _parse_column(table: Table, stmt: Stmt, start: int, end: int, pending: list[tuple[int, int, str]]) -> None:
    """Add a column. Its checks go on `pending`, to be built once all columns exist."""
    text = stmt.mask[start:end]
    match = re.match(rf"\s*({IDENT})\s+", text)
    name = bare(match.group(1))
    source = stmt.at(start)
    body = start + match.end()
    rest = stmt.mask[body:end]
    stop = TYPE_STOP.search(rest)
    identity = bool(re.search(r"\bgenerated\s+(always|by\s+default)\s+as\s+identity\b", rest, re.I))
    column = {
        "name": name,
        "type": " ".join(rest[: stop.start() if stop else len(rest)].split()),
        "nullable": not identity and not re.search(r"\b(not\s+null|primary\s+key)\b", rest, re.I),
        "default": None,
        "generated": bool(re.search(r"\bgenerated\s+always\s+as\s*\(", rest, re.I)),
        "identity": identity,
        "source": source,
    }
    default = re.search(r"\bdefault\b", rest, re.I)
    if default:
        tail = rest[default.end() :]
        stop_at = _top_level_search(AFTER_DEFAULT, tail)
        column["default"] = " ".join(
            stmt.raw[body + default.end() : body + default.end() + (stop_at if stop_at >= 0 else len(tail))].split()
        )
    table.columns[name] = column

    if re.search(r"\bprimary\s+key\b", rest, re.I):
        table.constraints.append(
            {"name": table.unique_name(f"{table.name}_pkey"), "kind": "primary_key", "columns": [name], "source": source}
        )
    if re.search(r"\bunique\b", rest, re.I):
        table.constraints.append(
            {"name": table.unique_name(f"{table.name}_{name}_key"), "kind": "unique", "columns": [name], "source": source}
        )
    for check in re.finditer(r"\bcheck\s*\(", rest, re.I):
        open_at = check.end() - 1
        close_at = matching_paren(rest, open_at)
        pending.append((body + open_at + 1, body + close_at, source))
    if REFERENCES.search(rest):
        table.constraints.append(_foreign_key(table, None, [name], rest, source))


def _top_level_search(pattern: re.Pattern, text: str) -> int:
    depth = 0
    for i, c in enumerate(text):
        if c == "(":
            depth += 1
        elif c == ")":
            depth -= 1
        elif depth == 0 and pattern.match(text, i):
            return i
    return -1


def _create_table(schema: Schema, stmt: Stmt, match: re.Match) -> None:
    key = qualified(match.group(1))
    if key in schema.tables:
        return
    table = Table(name=bare(match.group(1)), schema=schema_of(match.group(1)), source=stmt.at(match.start(1)))
    open_at = match.end() - 1
    close_at = matching_paren(stmt.mask, open_at)
    parts = split_top_level(stmt.mask, open_at + 1, close_at)
    clauses = []
    pending: list[tuple[int, int, str]] = []
    for start, end in parts:
        if TABLE_CLAUSE.match(stmt.mask[start:end]):
            clauses.append((start, end))
        elif not re.match(r"\s*like\b", stmt.mask[start:end], re.I):
            _parse_column(table, stmt, start, end, pending)
    for start, end, source in pending:
        table.constraints.append(_check(table, stmt, start, end, source))
    for start, end in clauses:
        table.constraints.append(_parse_clause(table, stmt, start, end))
    schema.tables[key] = table


def _drop_column(table: Table, name: str) -> None:
    table.columns.pop(name, None)
    table.constraints = [c for c in table.constraints if name not in c.get("columns", [])]
    table.indexes = {k: v for k, v in table.indexes.items() if name not in v["columns"]}


def _rename_column(table: Table, old: str, new: str) -> None:
    table.columns = {(new if k == old else k): v for k, v in table.columns.items()}
    if new in table.columns:
        table.columns[new]["name"] = new
    swap = lambda names: [new if n == old else n for n in names]  # noqa: E731
    for constraint in table.constraints:
        constraint["columns"] = swap(constraint.get("columns", []))
    for index in table.indexes.values():
        index["columns"] = swap(index["columns"])


def _alter_table(schema: Schema, stmt: Stmt, match: re.Match) -> None:
    name, body = match.group(1), match.start(2)
    table = schema.table(name)
    rename = re.match(rf"\s*rename\s+to\s+({IDENT})", stmt.mask[body:], re.I)
    if table is None:
        schema.unknown["alter table outside the model"] += 1
        return
    if rename:
        del schema.tables[table.key]
        old_key, table.name = table.key, bare(rename.group(1))
        schema.tables[table.key] = table
        for other in schema.tables.values():
            for constraint in other.constraints:
                if constraint.get("references") == old_key:
                    constraint["references"] = table.key
        return
    for start, end in split_top_level(stmt.mask, body):
        _alter_action(schema, table, stmt, start, end)


def _alter_action(schema: Schema, table: Table, stmt: Stmt, start: int, end: int) -> None:
    text = stmt.mask[start:end]
    lowered = " ".join(text.lower().split())
    source = stmt.at(start)
    if lowered.startswith("enable row level security"):
        table.rls, table.rls_source = True, source
    elif lowered.startswith("disable row level security"):
        table.rls, table.rls_source = False, source
    elif lowered.startswith(("force row level", "no force row level", "owner to", "replica identity")):
        schema.ignored += 1
    elif lowered.startswith("validate constraint"):
        schema.ignored += 1
    elif lowered.startswith("rename column") or re.match(rf"rename\s+{IDENT}\s+to\b", lowered):
        found = re.search(rf"rename\s+(?:column\s+)?({IDENT})\s+to\s+({IDENT})", text, re.I)
        _rename_column(table, bare(found.group(1)), bare(found.group(2)))
    elif lowered.startswith("rename constraint"):
        found = re.search(rf"rename\s+constraint\s+({IDENT})\s+to\s+({IDENT})", text, re.I)
        for constraint in table.constraints:
            if constraint["name"] == bare(found.group(1)):
                constraint["name"] = bare(found.group(2))
    elif lowered.startswith("drop constraint"):
        found = re.search(rf"drop\s+constraint\s+(?:if\s+exists\s+)?({IDENT})", text, re.I)
        table.constraints = [c for c in table.constraints if c["name"] != bare(found.group(1))]
    elif lowered.startswith("drop"):
        found = re.search(rf"drop\s+(?:column\s+)?(?:if\s+exists\s+)?({IDENT})", text, re.I)
        _drop_column(table, bare(found.group(1)))
    elif lowered.startswith("alter"):
        _alter_column(table, stmt, start, end)
    elif lowered.startswith("add"):
        _add_action(table, stmt, start, end)
    else:
        schema.unknown[f"alter table {' '.join(lowered.split()[:2])}"] += 1


def _add_action(table: Table, stmt: Stmt, start: int, end: int) -> None:
    prefix = re.match(r"\s*add\s+", stmt.mask[start:end], re.I)
    inner = start + prefix.end()
    if TABLE_CLAUSE.match(stmt.mask[inner:end]):
        table.constraints.append(_parse_clause(table, stmt, inner, end))
        return
    column = re.match(r"\s*(column\s+)?(if\s+not\s+exists\s+)?", stmt.mask[inner:end], re.I)
    begin = inner + column.end()
    name = re.match(rf"({IDENT})", stmt.mask[begin:end])
    if column.group(2) and name and bare(name.group(1)) in table.columns:
        return
    pending: list[tuple[int, int, str]] = []
    _parse_column(table, stmt, begin, end, pending)
    table.columns[bare(name.group(1))]["source"] = stmt.at(start)
    for check_start, check_end, source in pending:
        table.constraints.append(_check(table, stmt, check_start, check_end, source))


def _alter_column(table: Table, stmt: Stmt, start: int, end: int) -> None:
    text = stmt.mask[start:end]
    found = re.match(rf"\s*alter\s+(?:column\s+)?({IDENT})\s+(.*)$", text, re.I | re.S)
    column = table.columns.get(bare(found.group(1)))
    if column is None:
        return
    action = " ".join(found.group(2).lower().split())
    if action.startswith("set not null"):
        column["nullable"] = False
    elif action.startswith("drop not null"):
        column["nullable"] = True
    elif action.startswith("drop default"):
        column["default"] = None
    elif action.startswith("set default"):
        # Read the prefix from the raw text: in the mask a default string is blank space.
        raw = stmt.raw[start + found.start(2) : end]
        column["default"] = " ".join(raw[re.match(r"\s*set\s+default\s*", raw, re.I).end() :].split())
    elif action.startswith(("type", "set data type")):
        kind = re.sub(r"^(set\s+data\s+)?type\s+", "", found.group(2).strip(), flags=re.I)
        column["type"] = " ".join(re.split(r"\b(using|collate)\b", kind, maxsplit=1, flags=re.I)[0].split())


CREATE_TABLE = re.compile(rf"^create\s+(?:unlogged\s+)?table\s+(?:if\s+not\s+exists\s+)?({QUALIFIED})\s*\(", re.I)
DROP_TABLE = re.compile(rf"^drop\s+table\s+(?:if\s+exists\s+)?({QUALIFIED})", re.I)
ALTER_TABLE = re.compile(rf"^alter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?({QUALIFIED})\s+(.*)$", re.I | re.S)
CREATE_INDEX = re.compile(
    rf"^create\s+(unique\s+)?index\s+(?:concurrently\s+)?(if\s+not\s+exists\s+)?({IDENT})\s+on\s+"
    rf"(?:only\s+)?({QUALIFIED})(?:\s+using\s+\w+)?\s*\(",
    re.I,
)
DROP_INDEX = re.compile(rf"^drop\s+index\s+(?:concurrently\s+)?(?:if\s+exists\s+)?({QUALIFIED})", re.I)
CREATE_POLICY = re.compile(rf"^create\s+policy\s+({IDENT})\s+on\s+({QUALIFIED})", re.I)
DROP_POLICY = re.compile(rf"^drop\s+policy\s+(?:if\s+exists\s+)?({IDENT})\s+on\s+({QUALIFIED})", re.I)
ALTER_POLICY = re.compile(rf"^alter\s+policy\s+({IDENT})\s+on\s+({QUALIFIED})(.*)$", re.I | re.S)
CREATE_TRIGGER = re.compile(
    rf"^create\s+(?:or\s+replace\s+)?(?:constraint\s+)?trigger\s+({IDENT})\s+(before|after|instead\s+of)\s+"
    rf"(.*?)\s+on\s+({QUALIFIED})(.*)$",
    re.I | re.S,
)
DROP_TRIGGER = re.compile(rf"^drop\s+trigger\s+(?:if\s+exists\s+)?({IDENT})\s+on\s+({QUALIFIED})", re.I)
CREATE_ENUM = re.compile(rf"^create\s+type\s+({QUALIFIED})\s+as\s+enum\s*\(", re.I)
ADD_ENUM_VALUE = re.compile(rf"^alter\s+type\s+({QUALIFIED})\s+add\s+value\b", re.I)
DO_BLOCK = re.compile(r"^do\b", re.I)


def _create_index(schema: Schema, stmt: Stmt, match: re.Match) -> None:
    table = schema.table(match.group(4))
    if table is None:
        schema.unknown["index outside the model"] += 1
        return
    name = bare(match.group(3))
    if match.group(2) and name in table.indexes:
        return
    open_at = match.end() - 1
    close_at = matching_paren(stmt.mask, open_at)
    parts = split_top_level(stmt.mask, open_at + 1, close_at)
    columns = []
    for start, end in parts:
        piece = stmt.raw[start:end].strip()
        columns.append(bare(piece.split()[0]) if re.match(rf"^{IDENT}(\s|$)", piece) else piece)
    where = re.search(r"\bwhere\b", stmt.mask[close_at:], re.I)
    table.indexes[name] = {
        "name": name,
        "unique": bool(match.group(1)),
        "columns": columns,
        "partial": bool(where),
        "source": stmt.at(0),
    }


def _clause_after(stmt: Stmt, word: str) -> str | None:
    found = re.search(rf"\b{word}\s*\(", stmt.mask, re.I)
    if not found:
        return None
    open_at = found.end() - 1
    return " ".join(stmt.raw[open_at + 1 : matching_paren(stmt.mask, open_at)].split())


def _create_policy(schema: Schema, stmt: Stmt, match: re.Match) -> None:
    table = schema.table(match.group(2))
    if table is None:
        schema.unknown["policy outside the model"] += 1
        return
    command = re.search(r"\bfor\s+(all|select|insert|update|delete)\b", stmt.mask, re.I)
    roles = re.search(r"\bto\s+(.*?)(?=\busing\b|\bwith\s+check\b|$)", stmt.mask[match.end() :], re.I | re.S)
    name = bare(match.group(1))
    table.policies[name] = {
        "name": name,
        "command": command.group(1).lower() if command else "all",
        "roles": sorted(r.strip().strip('"') for r in roles.group(1).split(",")) if roles else ["public"],
        "using": _clause_after(stmt, "using"),
        "with_check": _clause_after(stmt, r"with\s+check"),
        "source": stmt.at(0),
    }
    schema.usage.append(stmt.raw)


def _create_trigger(schema: Schema, stmt: Stmt, match: re.Match) -> None:
    table = schema.table(match.group(4))
    if table is None:
        schema.unknown["trigger outside the model"] += 1
        return
    function = re.search(rf"\bexecute\s+(?:function|procedure)\s+({QUALIFIED})", match.group(5), re.I)
    name = bare(match.group(1))
    update_of = re.search(r"\bupdate\s+of\s+(.*?)(?:\s+or\s+|$)", match.group(3), re.I | re.S)
    when = re.search(r"\bwhen\s*\((.*)\)\s*execute\b", match.group(5), re.I | re.S)
    table.triggers[name] = {
        "name": name,
        "timing": " ".join(match.group(2).lower().split()),
        "events": sorted(e.split()[0].lower() for e in re.split(r"\s+or\s+", match.group(3), flags=re.I)),
        "function": qualified(function.group(1)) if function else None,
        # Postgres ties a trigger to these columns, so it stops them being dropped or retyped.
        "columns": [bare(item) for item in update_of.group(1).split(",")] if update_of else [],
        "when": when.group(1).strip() if when else None,
        "source": stmt.at(0),
    }


def _apply(schema: Schema, stmt: Stmt) -> None:
    mask = stmt.mask

    if match := CREATE_TABLE.match(mask):
        _create_table(schema, stmt, match)
    elif match := DROP_TABLE.match(mask):
        schema.tables.pop(qualified(match.group(1)), None)
    elif match := ALTER_TABLE.match(mask):
        _alter_table(schema, stmt, match)
    elif match := CREATE_INDEX.match(mask):
        _create_index(schema, stmt, match)
    elif match := DROP_INDEX.match(mask):
        name = bare(match.group(1))
        for table in schema.tables.values():
            table.indexes.pop(name, None)
    elif match := CREATE_POLICY.match(mask):
        _create_policy(schema, stmt, match)
    elif match := DROP_POLICY.match(mask):
        table = schema.table(match.group(2))
        if table:
            table.policies.pop(bare(match.group(1)), None)
    elif match := ALTER_POLICY.match(mask):
        table = schema.table(match.group(2))
        rename = re.search(rf"rename\s+to\s+({IDENT})", match.group(3), re.I)
        if table and rename and bare(match.group(1)) in table.policies:
            policy = table.policies.pop(bare(match.group(1)))
            policy["name"] = bare(rename.group(1))
            table.policies[policy["name"]] = policy
    elif match := CREATE_TRIGGER.match(mask):
        _create_trigger(schema, stmt, match)
    elif match := DROP_TRIGGER.match(mask):
        table = schema.table(match.group(2))
        if table:
            table.triggers.pop(bare(match.group(1)), None)
    elif match := CREATE_ENUM.match(mask):
        labels = re.findall(r"'((?:[^']|'')*)'", stmt.raw[match.end() :])
        schema.types[qualified(match.group(1))] = {
            "name": qualified(match.group(1)),
            "labels": labels,
            "source": stmt.at(0),
        }
    elif match := ADD_ENUM_VALUE.match(mask):
        kind = schema.types.get(qualified(match.group(1)))
        label = re.search(r"'((?:[^']|'')*)'", stmt.raw[match.end() :])
        if kind and label and label.group(1) not in kind["labels"]:
            kind["labels"].append(label.group(1))
    elif DO_BLOCK.match(mask):
        _do_block(schema, stmt)
        return
    elif IGNORED.match(mask):
        schema.ignored += 1
        if re.match(r"create\s+(or\s+replace\s+)?(function|procedure)", mask, re.I):
            schema.usage.append(stmt.raw)
        return
    else:
        schema.unknown[" ".join(mask.lower().split()[:3])] += 1
        return
    schema.applied += 1


def _do_statements(stmt: Stmt) -> list[Stmt] | None:
    """The plain DDL inside a `DO` body, taking every guarded branch as run.

    Migrations use `IF NOT EXISTS (...) THEN ALTER TABLE ...` to stay safe to re-run, so
    block keywords become statement breaks.
    """
    body = re.search(r"\$([A-Za-z_]*)\$(.*)\$\1\$", stmt.raw, re.S)
    if not body:
        return None
    line = stmt.line + stmt.raw.count("\n", 0, body.start(2))
    breaks = re.sub(r"\b(begin|then|else|loop)\b", lambda m: ";" + " " * (len(m.group(0)) - 1), body.group(2), flags=re.I)
    found = []
    for inner in statements_of(breaks, stmt.path):
        inner.line += line - 1
        if re.match(r"(create|alter|drop)\s", inner.mask, re.I):
            found.append(inner)
    return found


def _do_block(schema: Schema, stmt: Stmt) -> None:
    """Replay a `DO` body. Dynamic `EXECUTE` strings stay unread and are counted, since
    only a real database can say what they do."""
    inner = _do_statements(stmt)
    if inner is None:
        schema.unknown["do block"] += 1
        return
    code = re.search(r"\$([A-Za-z_]*)\$(.*)\$\1\$", stmt.raw, re.S).group(2)
    schema.usage.append(code)
    if re.search(r"\bexecute\s+(?!function\b|procedure\b)", code, re.I):
        schema.unknown["do block with dynamic sql"] += 1
    for item in inner:
        _apply(schema, item)
    schema.applied += 1


#: Each statement that changes a table, and which group of its pattern names that table.
TABLE_CHANGES = (
    (CREATE_TABLE, 1),
    (DROP_TABLE, 1),
    (ALTER_TABLE, 1),
    (CREATE_INDEX, 4),
    (CREATE_POLICY, 2),
    (DROP_POLICY, 2),
    (ALTER_POLICY, 2),
    (CREATE_TRIGGER, 4),
    (DROP_TRIGGER, 2),
)


def tables_changed(sql: str, path: str = "") -> set[str]:
    """Every table one SQL file changes, as `schema.name`. Used to spot two changes meeting."""
    found: set[str] = set()

    def visit(stmt: Stmt) -> None:
        for pattern, group in TABLE_CHANGES:
            if match := pattern.match(stmt.mask):
                found.add(qualified(match.group(group)))
                return
        if DO_BLOCK.match(stmt.mask):
            for inner in _do_statements(stmt) or []:
                visit(inner)

    for stmt in statements_of(sql, path):
        visit(stmt)
    return found


def detect(source) -> bool:
    return bool(_migration_files(source))


def inputs(source) -> dict[str, str]:
    """The files the Facts come from, by content id."""
    return {path: source.blobs[path] for path in _migration_files(source)}


def _natural_sort_key(path: str) -> tuple[tuple[int, int | str], ...]:
    """Sort digit runs numerically while keeping the surrounding filename text ordered."""
    return tuple(
        (1, int(part)) if part.isdigit() else (0, part.casefold())
        for part in re.split(r"(\d+)", path)
    )


def _migration_files(source) -> list[str]:
    for directory in MIGRATION_DIRS:
        files = source.list_files(directory, (".sql",))
        direct = [f for f in files if "/" not in f[len(directory) :]]
        if direct:
            return sorted(direct, key=_natural_sort_key)
    return []


def replay(source) -> Schema:
    files = _migration_files(source)
    contents = source.read_many(files)
    schema = Schema()
    for path in files:
        for stmt in statements_of(contents[path], path):
            _apply(schema, stmt)
    schema.finish()
    return schema


def externals_of(schema: Schema) -> list[dict]:
    """Tables that foreign keys reach but the migrations never create."""
    found: dict[str, dict] = {}
    for table in schema.tables.values():
        for constraint in table.constraints:
            target = constraint.get("references")
            if target and target not in schema.tables and target not in found:
                found[target] = {
                    "id": f"table:{target}",
                    "kind": "table",
                    "status": "external",
                    "layer": "facts",
                    "name": bare(target),
                    "schema": schema_of(target),
                    "evidence": [constraint["source"]],
                }
    return list(found.values())


def extract(source) -> dict:
    schema = replay(source)
    files = _migration_files(source)
    return {
        "engine": ENGINE,
        "nodes": [table.to_shard() for table in schema.tables.values()],
        "externals": externals_of(schema),
        "types": list(schema.types.values()),
        "stats": {
            "statements_applied": schema.applied,
            "statements_ignored": schema.ignored,
            "statements_unknown": sum(schema.unknown.values()),
            "unknown": dict(schema.unknown.most_common()),
            "files": len(files),
        },
        "inputs": inputs(source),
        "usage_text": "\n".join(schema.usage),
    }
