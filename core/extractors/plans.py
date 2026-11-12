"""Read plans from spec files, and work out how much of each exists.

A spec names what it will create: paths, migrations, tests. Looking those names up at
the model's commit proves how far the work got, with no judgement call. The result is a
derived status that shows its evidence. A `status:` line in the spec, or a person's
override, always beats it.
"""
from __future__ import annotations

import re

PLAN_DIRS = ("docs/specs/", "docs/plans/", "specs/")
#: Planning files at the top of a repo, such as a product brief.
ROOT_PLANS = re.compile(r"^(brief|plan|roadmap|prd|spec|todo)\.md$", re.I)
INDEX_FILES = re.compile(r"(^|/)(readme|index|template)\.md$", re.I)
CLAIM = re.compile(r"`([^`\n]+)`")
MIGRATION_NAME = re.compile(r"\d{14}_\w+")
PATCH_NAME = re.compile(r"\d{4}-\d{2}-\d{2}-[\w-]+\.sql")
PATH_LIKE = re.compile(r"[\w.\-]+(/[\w.\-$\[\]]+)+/?")
FILE_LIKE = re.compile(r"[\w.\-]+\.(ts|tsx|js|jsx|mjs|sql|py|json|md|yml|yaml)")
FRONT_MATTER = re.compile(r"\A---\n(.*?)\n---\n", re.S)

#: Share of named things that may be missing, for each derived status.
BUILT_BELOW = 0.2
PLANNED_FROM = 0.6
MIN_CLAIMS = 3

DECLARED = {
    "done": "built",
    "built": "built",
    "complete": "built",
    "shipped": "built",
    "in-progress": "partial",
    "building": "partial",
    "partial": "partial",
    "draft": "planned",
    "approved": "planned",
    "planned": "planned",
    "todo": "planned",
}


def plan_files(source) -> list[str]:
    found = []
    for directory in PLAN_DIRS:
        found += [f for f in source.list_files(directory, (".md",)) if not INDEX_FILES.search(f)]
    return found + [f for f in source.list_files("", (".md",)) if ROOT_PLANS.match(f)]


def inputs(source) -> dict[str, str]:
    return {path: source.blobs[path] for path in plan_files(source)}


def declared_status(text: str) -> str | None:
    front = FRONT_MATTER.match(text)
    if not front:
        return None
    match = re.search(r"^status:\s*([\w-]+)", front.group(1), re.M)
    return DECLARED.get(match.group(1).lower()) if match else None


def title_of(text: str, path: str) -> str:
    match = re.search(r"^#\s+(.+)$", text, re.M)
    if not match:
        return path.rsplit("/", 1)[-1].removesuffix(".md")
    return re.split(r"\s+[—–-]\s+", match.group(1).strip())[0]


class Index:
    """What exists at the commit, for looking claims up."""

    def __init__(self, source):
        # Sorted, so a name two files share picks the same file on every build.
        self.files = dict.fromkeys(sorted(source.list_files()))
        self.dirs = dict.fromkeys(sorted({"/".join(f.split("/")[:i]) for f in self.files for i in range(1, f.count("/") + 1)}))
        self.roots = {path.split("/")[0] for path in self.files}
        self.names = {f.rsplit("/", 1)[-1] for f in self.files}
        self.stems = {name.rsplit(".", 1)[0] for name in self.names}

    def match(self, token: str) -> tuple[bool, str] | None:
        """Is this token a thing the repo should hold? Returns (found, where), or None."""
        token = token.strip().rstrip("/")
        if MIGRATION_NAME.fullmatch(token):
            return token in self.stems, next((f for f in self.files if f.endswith(f"/{token}.sql")), "")
        if PATCH_NAME.fullmatch(token):
            return token in self.names, next((f for f in self.files if f.endswith(f"/{token}")), "")
        if PATH_LIKE.fullmatch(token):
            head = token.split("/")[0]
            if head in self.roots:
                return token in self.files or token in self.dirs, token
            # A path below a root, such as `agents/book.ts`, may be named from a parent.
            where = next((f for f in self.files if f.endswith(f"/{token}")), "") or next(
                (d for d in self.dirs if d.endswith(f"/{token}")), ""
            )
            if where:
                return True, where
            return (False, token) if FILE_LIKE.fullmatch(token.rsplit("/", 1)[-1]) else None
        if FILE_LIKE.fullmatch(token):
            if token in self.files:
                return True, token
            return token in self.names, next((f for f in self.files if f.endswith(f"/{token}")), token)
        return None


def claims_of(text: str, path: str, index: Index) -> list[dict]:
    found: dict[str, dict] = {}
    for number, line in enumerate(text.splitlines(), 1):
        for token in CLAIM.findall(line):
            clean = token.strip().rstrip("/")
            if clean in found or clean == path:
                continue
            verdict = index.match(clean)
            if verdict:
                exists, where = verdict
                found[clean] = {"claim": clean, "found": exists, "where": where, "source": f"{path}:{number}"}
    return list(found.values())


def derive_status(claims: list[dict]) -> str:
    if len(claims) < MIN_CLAIMS:
        return "unclear"
    missing = sum(1 for claim in claims if not claim["found"]) / len(claims)
    if missing < BUILT_BELOW:
        return "built"
    return "planned" if missing >= PLANNED_FROM else "partial"


def plan_id(path: str) -> str:
    """A plan's id is its path below its plans folder, so same-named plans stay apart."""
    for directory in PLAN_DIRS:
        if path.startswith(directory):
            return "plan:" + path[len(directory):].removesuffix(".md")
    return "plan:" + path.rsplit("/", 1)[-1].removesuffix(".md")


def extract(source) -> list[dict]:
    index = Index(source)
    paths = plan_files(source)
    contents = source.read_many(paths)
    plans = []
    for path in paths:
        text = contents.get(path, "")
        claims = claims_of(text, path, index)
        declared = declared_status(text)
        plans.append(
            {
                "id": plan_id(path),
                "kind": "plan",
                "layer": "facts",
                "name": title_of(text, path),
                "path": path,
                "status": declared or derive_status(claims),
                "status_source": "declared" if declared else "derived",
                "found": sum(1 for claim in claims if claim["found"]),
                "missing": sum(1 for claim in claims if not claim["found"]),
                "claims": claims,
                "evidence": [f"{path}:1"],
            }
        )
    return plans
