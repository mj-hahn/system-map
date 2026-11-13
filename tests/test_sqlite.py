"""Read SQLite projects, wherever a small app keeps its schema."""
import json
import random
import sqlite3
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from core import explore, findings, store  # noqa: E402
from core.extractors import extractor_for, postgres, sqlite  # noqa: E402
from core.sources import open_source, package_dependencies  # noqa: E402
from tests.helpers import commit_all, git  # noqa: E402

DRIVER = '{"dependencies": {"next": "16.0.0", "better-sqlite3": "13.0.0"}}'
SCHEMA = """
CREATE TABLE hosts (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE
);

CREATE TABLE listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  host_id INTEGER NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  price REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'live'))
);

CREATE INDEX listings_price_idx ON listings (price);

CREATE TABLE bookings (
  listing_id INTEGER NOT NULL,
  day TEXT NOT NULL,
  note TEXT,
  PRIMARY KEY (listing_id, day),
  FOREIGN KEY (listing_id) REFERENCES listings(id)
) WITHOUT ROWID;
"""


class Repo(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.base = Path(tmp.name).resolve()
        self.root = self.base / "repo"
        self.root.mkdir()
        self.write("package.json", DRIVER)

    def write(self, name: str, text: str = "") -> Path:
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text)
        return path

    def read(self) -> dict:
        return sqlite.extract(open_source(self.root))

    def tables(self) -> list[str]:
        return sorted(node["name"] for node in self.read()["nodes"])

    def table(self, name: str) -> dict:
        return next(node for node in self.read()["nodes"] if node["name"] == name)

    def constraint(self, table: str, kind: str) -> list[dict]:
        return [row for row in self.table(table)["constraints"] if row["kind"] == kind]


class PackageManifest(Repo):
    def test_non_object_manifest_has_no_dependencies(self):
        for value in ([], "not an object", 42, None):
            with self.subTest(value=value):
                self.write("package.json", json.dumps(value))
                self.assertEqual(package_dependencies(open_source(self.root)), {"runtime": set(), "dev": set()})

    def test_malformed_dependency_groups_are_ignored_independently(self):
        self.write("package.json", json.dumps({
            "dependencies": ["better-sqlite3"],
            "devDependencies": {"sqlite3": "5.1.7"},
        }))
        self.assertEqual(package_dependencies(open_source(self.root)), {"runtime": set(), "dev": {"sqlite3"}})

        self.write("package.json", json.dumps({
            "dependencies": {"better-sqlite3": "13.0.0"},
            "devDependencies": 42,
        }))
        self.assertEqual(package_dependencies(open_source(self.root)), {"runtime": {"better-sqlite3"}, "dev": set()})

    def test_build_can_still_detect_a_sqlite_file(self):
        self.write("package.json", "[]")
        self.write("prisma/schema.prisma", 'datasource db {\n  provider = "sqlite"\n}\n')
        self.assertIs(extractor_for(open_source(self.root)), sqlite)


class ReadingASchema(Repo):
    def setUp(self):
        super().setUp()
        self.write("db/schema.sql", SCHEMA)

    def test_it_finds_every_table(self):
        self.assertEqual(self.tables(), ["bookings", "hosts", "listings"])

    def test_tables_live_in_main(self):
        table = self.table("hosts")
        self.assertEqual(table["id"], "table:main.hosts")
        self.assertEqual(table["schema"], "main")

    def test_columns_read_as_sqlite_says(self):
        columns = {row["name"]: row for row in self.table("listings")["columns"]}
        self.assertEqual(columns["slug"]["type"], "TEXT")
        self.assertFalse(columns["slug"]["nullable"])
        self.assertEqual(columns["status"]["default"], "'draft'")
        self.assertTrue(columns["id"]["identity"])
        self.assertTrue(self.table("bookings")["columns"][2]["nullable"])

    def test_keys_read_as_sqlite_says(self):
        self.assertEqual(self.constraint("bookings", "primary_key")[0]["columns"], ["listing_id", "day"])
        self.assertEqual(self.constraint("hosts", "unique")[0]["columns"], ["email"])

    def test_foreign_keys_read_as_sqlite_says(self):
        key = self.constraint("listings", "foreign_key")[0]
        self.assertEqual(key["references"], "main.hosts")
        self.assertEqual(key["reference_columns"], ["id"])
        self.assertEqual(key["on_delete"], "cascade")

    def test_indexes_and_checks_are_read(self):
        self.assertEqual(self.table("listings")["indexes"][0]["columns"], ["price"])
        check = self.constraint("listings", "check")[0]
        self.assertEqual(check["columns"], ["status"])
        self.assertIn("IN ('draft', 'live')", check["expression"])

    def test_every_fact_cites_its_line(self):
        table = self.table("listings")
        self.assertEqual(table["source"], "db/schema.sql:8")
        slug = next(row for row in table["columns"] if row["name"] == "slug")
        self.assertEqual(slug["source"], "db/schema.sql:11")
        self.assertEqual(table["indexes"][0]["source"], "db/schema.sql:16")

    def test_nothing_was_left_unread(self):
        stats = self.read()["stats"]
        self.assertEqual(stats["statements_unknown"], 0)
        self.assertEqual(stats["statements_applied"], 4)


class WhereTheSchemaLives(Repo):
    TABLE = "CREATE TABLE notes (id INTEGER PRIMARY KEY, body TEXT);\n"

    def test_any_sql_file_can_hold_it(self):
        for path in ("schema.sql", "sql/schema.sql", "database/init.sql", "src/db/tables.sql", "lib/db/create.sql", "data/setup.sql"):
            with self.subTest(path):
                target = self.write(path, self.TABLE)
                self.assertEqual(self.tables(), ["notes"])
                target.unlink()

    def test_migrations_run_in_order(self):
        self.write("migrations/002_add.sql", "ALTER TABLE notes ADD COLUMN title TEXT;\n")
        self.write("migrations/001_init.sql", self.TABLE)
        self.assertEqual([row["name"] for row in self.table("notes")["columns"]], ["id", "body", "title"])

    def test_a_schema_file_runs_before_migrations(self):
        self.write("db/migrations/002.sql", "ALTER TABLE notes ADD COLUMN title TEXT;\n")
        self.write("db/schema.sql", self.TABLE)
        self.assertEqual(len(self.table("notes")["columns"]), 3)

    def test_a_table_dropped_later_is_gone(self):
        self.write("migrations/001.sql", self.TABLE + "CREATE TABLE old (id INTEGER);\n")
        self.write("migrations/002.sql", "DROP TABLE old;\n")
        self.assertEqual(self.tables(), ["notes"])

    def test_a_column_added_later_cites_that_file(self):
        self.write("migrations/001.sql", self.TABLE)
        self.write("migrations/002.sql", "\nALTER TABLE notes ADD COLUMN title TEXT;\n")
        title = next(row for row in self.table("notes")["columns"] if row["name"] == "title")
        self.assertEqual(title["source"], "migrations/002.sql:2")

    def test_prisma_migrations_are_plain_sql(self):
        self.write("package.json", '{"dependencies": {"@prisma/client": "6.0.0"}}')
        self.write("prisma/schema.prisma", 'datasource db {\n  provider = "sqlite"\n  url = "file:./dev.db"\n}\n')
        self.write("prisma/migrations/20260101000000_init/migration.sql", 'CREATE TABLE "Note" (\n  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT\n);\n')
        source = open_source(self.root)
        self.assertIs(extractor_for(source), sqlite)
        self.assertEqual(self.tables(), ["Note"])

    def test_drizzle_migrations_are_plain_sql(self):
        self.write("drizzle/0000_first.sql", "CREATE TABLE `notes` (\n\t`id` integer PRIMARY KEY NOT NULL\n);\n--> statement-breakpoint\nCREATE TABLE `tags` (\n\t`id` integer PRIMARY KEY NOT NULL\n);\n")
        self.assertEqual(self.tables(), ["notes", "tags"])

    def test_a_schema_inside_code_is_read(self):
        self.write(
            "lib/db.ts",
            'import Database from "better-sqlite3"\nconst db = new Database("app.db")\ndb.exec(`\n  CREATE TABLE IF NOT EXISTS notes (\n    id INTEGER PRIMARY KEY,\n    body TEXT\n  );\n  CREATE TABLE IF NOT EXISTS tags (id INTEGER PRIMARY KEY);\n`)\n',
        )
        self.assertEqual(self.tables(), ["notes", "tags"])
        self.assertTrue(self.table("notes")["source"].startswith("lib/db.ts:"))

    def test_a_schema_in_a_plain_string_is_read(self):
        self.write("lib/db.ts", 'db.prepare("CREATE TABLE notes (id INTEGER PRIMARY KEY)").run()\n')
        self.assertEqual(self.tables(), ["notes"])

    def test_a_schema_in_a_test_doesnt_count(self):
        self.write("lib/db.test.ts", 'db.exec("CREATE TABLE fake (id INTEGER)")\n')
        self.write("tests/fixture.sql", "CREATE TABLE fake2 (id INTEGER);\n")
        self.assertEqual(self.tables(), [])

    def test_seed_data_isnt_needed(self):
        self.write("db/schema.sql", self.TABLE)
        self.write("db/seed.sql", "INSERT INTO notes VALUES (1, 'x');\n")
        self.assertEqual(self.tables(), ["notes"])

    def test_a_file_can_name_a_table_a_later_file_makes(self):
        self.write("a.sql", "CREATE INDEX later_idx ON zebra (id);\n")
        self.write("z.sql", "CREATE TABLE zebra (id INTEGER);\n")
        self.assertEqual(self.table("zebra")["indexes"][0]["name"], "later_idx")


class AwkwardSql(Repo):
    def test_a_trigger_body_stays_whole(self):
        self.write("schema.sql", "CREATE TABLE a (id INTEGER PRIMARY KEY, n INTEGER);\nCREATE TRIGGER t AFTER UPDATE OF n ON a BEGIN\n  UPDATE a SET n = 0;\n  UPDATE a SET n = 1;\nEND;\nCREATE TABLE b (id INTEGER);\n")
        self.assertEqual(self.tables(), ["a", "b"])
        trigger = self.table("a")["triggers"][0]
        self.assertEqual((trigger["timing"], trigger["events"], trigger["columns"]), ("after", ["update"], ["n"]))

    def test_two_statements_on_one_line_both_run(self):
        self.write("schema.sql", "CREATE TABLE a (id INTEGER); CREATE TABLE b (id INTEGER);\n")
        self.assertEqual(self.tables(), ["a", "b"])

    def test_a_broken_statement_doesnt_stop_the_rest(self):
        self.write("schema.sql", "CREATE TABLE a (id INTEGER);\nCREATE TABLE ( oops;\nCREATE TABLE b (id INTEGER);\n")
        result = self.read()
        self.assertEqual(sorted(node["name"] for node in result["nodes"]), ["a", "b"])
        self.assertEqual(result["stats"]["statements_unknown"], 1)

    def test_postgres_sql_is_counted_as_unread_not_fatal(self):
        self.write("schema.sql", "CREATE TYPE mood AS ENUM ('a');\nCREATE TABLE b (id INTEGER);\n")
        result = self.read()
        self.assertEqual([node["name"] for node in result["nodes"]], ["b"])
        self.assertEqual(result["stats"]["statements_unknown"], 1)

    def test_views_are_not_tables(self):
        self.write("schema.sql", "CREATE TABLE a (id INTEGER);\nCREATE VIEW v AS SELECT * FROM a;\n")
        self.assertEqual(self.tables(), ["a"])

    def test_quoted_names_read(self):
        self.write("schema.sql", 'CREATE TABLE "my table" ("the id" INTEGER PRIMARY KEY);\n')
        self.assertEqual(self.table("my table")["columns"][0]["name"], "the id")

    def test_a_foreign_key_to_a_missing_table_is_outside(self):
        self.write("schema.sql", "CREATE TABLE a (id INTEGER, b_id INTEGER REFERENCES ghosts(id));\n")
        self.assertEqual([row["name"] for row in self.read()["externals"]], ["ghosts"])

    def test_full_text_search_tables_dont_flood_the_model(self):
        self.write("schema.sql", "CREATE VIRTUAL TABLE docs USING fts5(body);\nCREATE TABLE a (id INTEGER);\n")
        self.assertEqual(self.tables(), ["a", "docs"])

    def test_an_empty_folder_of_sql_is_fine(self):
        self.write("schema.sql", "-- nothing here yet\n")
        self.assertEqual(self.tables(), [])


class RepoSqlIsOnlyData(Repo):
    def test_attaching_a_file_is_refused(self):
        target = self.base / "stolen.db"
        self.write("schema.sql", f"CREATE TABLE a (id INTEGER);\nATTACH DATABASE '{target}' AS other;\nCREATE TABLE other.x (id INTEGER);\n")
        self.assertEqual(self.tables(), ["a"])
        self.assertFalse(target.exists())

    def test_vacuum_into_a_file_never_runs(self):
        target = self.base / "copy.db"
        self.write("schema.sql", f"CREATE TABLE a (id INTEGER);\nVACUUM INTO '{target}';\n")
        self.assertEqual(self.tables(), ["a"])
        self.assertFalse(target.exists())

    def test_a_statement_that_never_ends_is_stopped(self):
        endless = "CREATE TABLE forever AS WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n) SELECT i FROM n;\n"
        self.write("schema.sql", "CREATE TABLE a (id INTEGER);\n" + endless)
        original = sqlite.TIME_LIMIT_SECONDS
        sqlite.TIME_LIMIT_SECONDS = 0.2
        self.addCleanup(setattr, sqlite, "TIME_LIMIT_SECONDS", original)
        self.assertEqual(self.tables(), ["a"])

    def test_the_repo_is_not_written(self):
        self.write("schema.sql", SCHEMA)
        before = sorted(path.name for path in self.root.rglob("*"))
        self.read()
        self.assertEqual(sorted(path.name for path in self.root.rglob("*")), before)


class WhichEngine(Repo):
    def engine(self):
        extractor = extractor_for(open_source(self.root))
        return extractor.ENGINE if extractor else None

    def test_a_shipped_driver_means_sqlite(self):
        for driver in ("better-sqlite3", "sqlite3", "@libsql/client", "libsql"):
            with self.subTest(driver):
                self.write("package.json", json.dumps({"dependencies": {driver: "1.0.0"}}))
                self.assertEqual(self.engine(), "sqlite")

    def test_node_and_bun_built_ins_mean_sqlite(self):
        self.write("package.json", "{}")
        for name in ("node:sqlite", "bun:sqlite"):
            with self.subTest(name):
                self.write("lib/db.ts", f'import {{ x }} from "{name}"\n')
                self.assertEqual(self.engine(), "sqlite")

    def test_a_database_file_in_the_repo_means_sqlite(self):
        self.write("package.json", "{}")
        self.write("data/app.db", "x")
        self.assertEqual(self.engine(), "sqlite")

    def test_a_dev_only_driver_leaves_postgres_alone(self):
        self.write("package.json", '{"devDependencies": {"better-sqlite3": "13.0.0"}}')
        self.write("migrations/001.sql", "CREATE TABLE a (id uuid PRIMARY KEY);\n")
        self.assertEqual(self.engine(), "postgres")

    def test_supabase_is_postgres_whatever_else_is_installed(self):
        self.write("supabase/migrations/001.sql", "CREATE TABLE a (id uuid PRIMARY KEY);\n")
        self.assertEqual(self.engine(), "postgres")

    def test_no_database_at_all_is_none(self):
        self.write("package.json", '{"dependencies": {"next": "16.0.0"}}')
        self.write("lib/a.ts", "export const x = 1\n")
        self.assertIsNone(self.engine())


class RulesOnSqlite(Repo):
    def titles(self) -> list[str]:
        self.write("db/schema.sql", SCHEMA)
        nodes = self.read()["nodes"]
        return [row["check"] for row in findings.find(nodes, set())]

    def test_row_level_security_never_comes_up(self):
        self.assertFalse([check for check in self.titles() if "rls" in check])

    def test_rules_that_hold_on_sqlite_still_run(self):
        self.assertIn("fk_no_index", self.titles())


class InTheWholeModel(Repo):
    def setUp(self):
        super().setUp()
        self.write("db/schema.sql", SCHEMA)
        self.write("tsconfig.json", '{"compilerOptions": {"paths": {"@/*": ["./*"]}}}')
        self.write("lib/db.ts", "export const db = {}\n")
        self.write("lib/listings.ts", 'import { db } from "@/lib/db"\nexport const all = () => db.prepare("SELECT * FROM listings").all()\n')
        self.write("app/page.tsx", 'import { all } from "@/lib/listings"\nexport default function Page() { return all() }\n')
        git(self.root, "init", "-q")
        commit_all(self.root, "first")
        self.data = self.base / "data"
        self.manifest = store.build(self.root, self.data)
        self.target = self.data / "repos" / self.manifest["repo_key"]

    def system(self) -> dict:
        return store.load_system(self.target)

    def test_the_manifest_names_the_engine(self):
        self.assertEqual(self.manifest["engine"], "sqlite")
        self.assertEqual(self.manifest["counts"]["tables"], 3)

    def test_code_links_to_the_tables_it_queries(self):
        edges = {(edge["source"], edge["target"], edge["kind"]) for edge in self.system()["edges"]}
        self.assertIn(("module:lib", "table:main.listings", "uses_table"), edges)

    def test_routes_link_to_what_they_render(self):
        edges = {(edge["source"], edge["target"], edge["kind"]) for edge in self.system()["edges"]}
        self.assertIn(("route:/", "module:lib", "renders"), edges)

    def test_the_diagram_makes_no_claim_about_row_level_security(self):
        self.assertTrue(all(table["rls"] is None for table in store.graph(self.target)["tables"]))

    def test_the_routes_folder_is_saved(self):
        self.assertEqual(self.system()["routes_dir"], "app")

    def test_changing_the_schema_makes_the_model_stale(self):
        self.write("db/schema.sql", SCHEMA + "\nCREATE TABLE extra (id INTEGER);\n")
        commit_all(self.root, "more")
        fresh = store.freshness(self.target)
        self.assertTrue(fresh["stale"])
        self.assertEqual(fresh["changed_inputs"], ["db/schema.sql"])

    def test_a_worktree_shows_only_the_table_it_changes(self):
        worktree = self.base / "feature"
        git(self.root, "worktree", "add", "-q", "-b", "feature", str(worktree))
        path = worktree / "db" / "schema.sql"
        path.write_text(path.read_text().replace("name TEXT NOT NULL,", "name TEXT NOT NULL,\n  phone TEXT,"))
        state = store.worktree_state(self.target)
        row = next(item for item in state["worktrees"] if item["path"] == str(worktree))
        self.assertEqual(row["tables_schema"], ["table:main.hosts"])

    def test_a_proposal_shows_its_diff_without_limits(self):
        change = {"op": "add_table", "table": "reviews", "columns": [{"name": "id", "type": "integer"}]}
        reply = explore.save_proposal(self.target, "Reviews", "why", [change], dry_run=True)
        self.assertFalse(reply["limits_checked"])
        self.assertEqual(reply["limits"], [])
        self.assertEqual(reply["sql"], [])
        self.assertEqual([row["id"] for row in reply["diff"]["added"]], ["table:main.reviews"])

    def test_a_proposal_on_a_known_table_changes_that_table(self):
        change = {"op": "add_column", "table": "listings", "column": {"name": "pets", "type": "integer"}}
        reply = explore.save_proposal(self.target, "Pets", "why", [change], dry_run=True)
        self.assertEqual([row["id"] for row in reply["diff"]["changed"]], ["table:main.listings"])

    def test_postgres_projects_keep_their_limits(self):
        repo = self.base / "pg"
        (repo / "migrations").mkdir(parents=True)
        (repo / "migrations" / "001.sql").write_text("CREATE TABLE a (id uuid PRIMARY KEY);\n")
        target = self.data / "repos" / store.build(repo, self.data)["repo_key"]
        reply = explore.save_proposal(target, "Drop", "why", [{"op": "drop_table", "table": "a"}], dry_run=True)
        self.assertTrue(reply["limits_checked"])
        self.assertTrue(reply["sql"])
        self.assertEqual(store.table_index(target)[0]["id"], "table:public.a")


class ProjectWithoutGit(Repo):
    def setUp(self):
        super().setUp()
        self.write("db/schema.sql", SCHEMA)
        self.write("app/page.tsx", "export default function Page() { return null }\n")
        self.write(".next/server/huge.js", "x")
        self.data = self.base / "data"
        self.manifest = store.build(self.root, self.data)
        self.target = self.data / "repos" / self.manifest["repo_key"]

    def test_a_folder_with_no_git_builds(self):
        self.assertIsNone(self.manifest["commit"])
        self.assertEqual(self.manifest["counts"]["tables"], 3)

    def test_a_folder_with_no_git_passes_the_check(self):
        self.assertEqual(store.check_folder(self.root), self.root)

    def test_build_output_is_not_read(self):
        self.assertNotIn(".next/server/huge.js", open_source(self.root).blobs)

    def test_it_lists_as_a_project(self):
        row = store.project_rows(self.data)[0]
        self.assertEqual(row["status"], "current")
        self.assertEqual(row["tables"], 3)

    def test_editing_a_file_marks_it_out_of_date(self):
        self.write("db/schema.sql", SCHEMA + "\nCREATE TABLE extra (id INTEGER);\n")
        self.assertEqual(store.project_rows(self.data)[0]["status"], "stale")

    def test_worktrees_and_risk_are_empty_not_broken(self):
        self.assertEqual(store.worktree_state(self.target)["overlaps"], [])
        self.assertIn("modules", store.load_risk(self.target))


class AgainstRealSqlite(unittest.TestCase):
    """Generate tables, then hold what the model says to SQLite's own pragmas."""

    TYPES = ("INTEGER", "TEXT", "REAL", "BLOB", "NUMERIC", "VARCHAR(40)", "DATETIME", "BOOLEAN", "")
    DEFAULTS = (None, "0", "'x'", "NULL", "CURRENT_TIMESTAMP", "(1 + 1)")
    ACTIONS = ("CASCADE", "SET NULL", "RESTRICT", "NO ACTION", "SET DEFAULT")

    def column(self, rng: random.Random, name: str) -> str:
        parts = [f'"{name}"', rng.choice(self.TYPES)]
        if rng.random() < 0.4:
            parts.append("NOT NULL")
        default = rng.choice(self.DEFAULTS)
        if default:
            parts.append(f"DEFAULT {default}")
        if rng.random() < 0.15:
            parts.append("UNIQUE")
        return " ".join(part for part in parts if part)

    def table(self, rng: random.Random, number: int) -> str:
        names = [f"c{index}" for index in range(rng.randint(2, 8))]
        lines = [self.column(rng, name) for name in names]
        key = rng.sample(names, rng.randint(1, min(2, len(names))))
        lines.append(f"PRIMARY KEY ({', '.join(key)})")
        if number and rng.random() < 0.6:
            other = rng.randrange(number)
            lines.append(f"FOREIGN KEY (c0) REFERENCES t{other} (c0) ON DELETE {rng.choice(self.ACTIONS)} ON UPDATE {rng.choice(self.ACTIONS)}")
        statement = f"CREATE TABLE t{number} (\n  " + ",\n  ".join(lines) + "\n);\n"
        if rng.random() < 0.5:
            statement += f"CREATE INDEX t{number}_i ON t{number} ({rng.choice(names)});\n"
        return statement

    def test_five_hundred_generated_tables_match(self):
        rng = random.Random(6)
        text = "".join(self.table(rng, number) for number in range(500))
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / "package.json").write_text(DRIVER)
            (root / "schema.sql").write_text(text)
            result = sqlite.extract(open_source(root))
        self.assertEqual(result["stats"]["statements_unknown"], 0)
        self.assertEqual(len(result["nodes"]), 500)
        truth = sqlite3.connect(":memory:")
        truth.executescript(text)
        self.assertEqual(sqlite.differences(result["nodes"], truth), [])


class TheVerifyCommand(unittest.TestCase):
    def test_it_reports_no_differences(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / "package.json").write_text(DRIVER)
            (root / "schema.sql").write_text(SCHEMA)
            done = subprocess.run(
                [sys.executable, "-m", "core", "verify-sqlite", str(root)],
                cwd=ROOT,
                capture_output=True,
                text=True,
                timeout=20,
            )
        self.assertEqual(done.returncode, 0, done.stdout + done.stderr)
        self.assertIn("0 differences", done.stdout)


if __name__ == "__main__":
    unittest.main()
