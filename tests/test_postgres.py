import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from core.extractors.postgres import mask_sql, replay, statements_of  # noqa: E402
from core.sources import TreeSource  # noqa: E402
from helpers import write_migration  # noqa: E402


class Case(unittest.TestCase):
    def schema(self, *migrations: str):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        repo = Path(tmp.name)
        for number, sql in enumerate(migrations):
            write_migration(repo, f"{number:03}.sql", sql)
        return replay(TreeSource(repo))


class MigrationOrder(unittest.TestCase):
    def replay_named(self, migrations: dict[str, str]):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        repo = Path(tmp.name)
        for name, sql in migrations.items():
            write_migration(repo, name, sql)
        return replay(TreeSource(repo))

    def test_plain_numbered_migrations_sort_numerically(self):
        schema = self.replay_named(
            {
                "1_init.sql": "CREATE TABLE users (id int);",
                "2_add_legacy.sql": "ALTER TABLE users ADD COLUMN legacy text;",
                "10_drop_legacy.sql": "ALTER TABLE users DROP COLUMN legacy;",
            }
        )
        self.assertEqual(list(schema.tables["public.users"].columns), ["id"])

    def test_timestamped_migrations_keep_chronological_order(self):
        schema = self.replay_named(
            {
                "20260102000000_drop_legacy.sql": "ALTER TABLE users DROP COLUMN legacy;",
                "20260101000000_init.sql": "CREATE TABLE users (id int, legacy text);",
            }
        )
        self.assertEqual(list(schema.tables["public.users"].columns), ["id"])


class Splitting(unittest.TestCase):
    def test_masking_keeps_every_offset_and_line(self):
        sql = "select 1; -- x\n$$ a\nb $$;\nselect 'a;b';"
        clean, mask = mask_sql(sql)
        self.assertEqual(len(clean), len(sql))
        self.assertEqual(len(mask), len(sql))
        self.assertEqual(mask.count("\n"), sql.count("\n"))

    def test_a_semicolon_in_a_string_or_body_does_not_split(self):
        found = statements_of("select 'a;b';\nselect $$c;d$$;\nselect 3;")
        self.assertEqual([s.line for s in found], [1, 2, 3])


class Tables(Case):
    def test_comments_and_function_bodies_are_not_schema(self):
        schema = self.schema(
            "-- CREATE TABLE ghost (id int);\nCREATE TABLE a (id int);\n"
            "CREATE FUNCTION f() RETURNS void LANGUAGE sql AS $$ CREATE TABLE ghost2 (id int); $$;"
        )
        self.assertEqual(list(schema.tables), ["public.a"])

    def test_column_detail(self):
        table = self.schema(
            "CREATE TABLE a (\n id uuid PRIMARY KEY,\n name text NOT NULL UNIQUE,\n note text DEFAULT 'a; b',\n"
            " size numeric(10, 2) CHECK (size > 0)\n);"
        ).tables["public.a"]
        self.assertEqual(list(table.columns), ["id", "name", "note", "size"])
        self.assertFalse(table.columns["id"]["nullable"])
        self.assertFalse(table.columns["name"]["nullable"])
        self.assertEqual(table.columns["note"]["default"], "'a; b'")
        self.assertEqual(table.columns["size"]["type"], "numeric(10, 2)")
        self.assertEqual(table.columns["name"]["source"], "supabase/migrations/000.sql:3")

    def test_create_if_not_exists_keeps_the_first_table(self):
        schema = self.schema("CREATE TABLE a (id int);", "CREATE TABLE IF NOT EXISTS a (other int);")
        self.assertEqual(list(schema.tables["public.a"].columns), ["id"])

    def test_a_dropped_table_is_gone(self):
        schema = self.schema("CREATE TABLE a (id int);", "DROP TABLE IF EXISTS public.a;")
        self.assertEqual(schema.tables, {})

    def test_rename_table_moves_foreign_keys_too(self):
        schema = self.schema(
            "CREATE TABLE a (id int PRIMARY KEY);\nCREATE TABLE b (a_id int REFERENCES a(id));",
            "ALTER TABLE a RENAME TO c;",
        )
        self.assertIn("public.c", schema.tables)
        self.assertEqual(schema.tables["public.b"].constraints[0]["references"], "public.c")


class Alters(Case):
    def test_later_migrations_apply(self):
        table = self.schema(
            "CREATE TABLE a (id int, old text, keep text);",
            "ALTER TABLE a ADD COLUMN team uuid, DROP COLUMN old, ALTER COLUMN keep SET NOT NULL;",
            "ALTER TABLE a ALTER COLUMN team TYPE text USING team::text;",
        ).tables["public.a"]
        self.assertEqual(list(table.columns), ["id", "keep", "team"])
        self.assertFalse(table.columns["keep"]["nullable"])
        self.assertEqual(table.columns["team"]["type"], "text")

    def test_add_column_if_not_exists_keeps_the_first_column(self):
        table = self.schema("CREATE TABLE a (b int);", "ALTER TABLE a ADD COLUMN IF NOT EXISTS b text;").tables["public.a"]
        self.assertEqual(table.columns["b"]["type"], "int")

    def test_set_default_keeps_a_string_value(self):
        table = self.schema("CREATE TABLE a (b text);", "ALTER TABLE a ALTER COLUMN b SET DEFAULT 'x';").tables["public.a"]
        self.assertEqual(table.columns["b"]["default"], "'x'")

    def test_rename_column_follows_constraints_and_indexes(self):
        table = self.schema(
            "CREATE TABLE a (x int UNIQUE);\nCREATE INDEX a_x ON a (x);",
            "ALTER TABLE a RENAME COLUMN x TO y;",
        ).tables["public.a"]
        self.assertEqual(table.constraints[0]["columns"], ["y"])
        self.assertEqual(table.indexes["a_x"]["columns"], ["y"])

    def test_drop_constraint_by_default_name(self):
        table = self.schema("CREATE TABLE a (x int UNIQUE);", "ALTER TABLE a DROP CONSTRAINT a_x_key;").tables["public.a"]
        self.assertEqual(table.constraints, [])

    def test_dropping_a_column_drops_its_index(self):
        table = self.schema(
            "CREATE TABLE a (x int, y int);\nCREATE INDEX a_x ON a (x);", "ALTER TABLE a DROP COLUMN x;"
        ).tables["public.a"]
        self.assertEqual(table.indexes, {})


class Checks(Case):
    def test_a_check_on_one_column_takes_that_name(self):
        table = self.schema("CREATE TABLE a (x int, y int, CHECK (x > 0));").tables["public.a"]
        self.assertEqual(table.constraints[0]["name"], "a_x_check")

    def test_a_column_check_on_two_columns_takes_the_table_name(self):
        table = self.schema("CREATE TABLE a (x int, y int CHECK (x < y));").tables["public.a"]
        self.assertEqual(table.constraints[0]["name"], "a_check")

    def test_words_in_a_string_do_not_count_as_columns(self):
        table = self.schema("CREATE TABLE a (x text, y text CHECK (y IN ('x', 'z')));").tables["public.a"]
        self.assertEqual(table.constraints[0]["name"], "a_y_check")

    def test_second_unnamed_check_gets_a_number(self):
        table = self.schema("CREATE TABLE a (x int, y int, CHECK (x < y), CHECK (y < x));").tables["public.a"]
        self.assertEqual([c["name"] for c in table.constraints], ["a_check", "a_check1"])


class Keys(Case):
    def test_a_table_level_primary_key_makes_columns_not_null(self):
        table = self.schema("CREATE TABLE a (x int, y int, z int, PRIMARY KEY (x, y));").tables["public.a"]
        self.assertEqual([c["nullable"] for c in table.columns.values()], [False, False, True])

    def test_an_identity_column_is_not_null_and_has_no_default(self):
        table = self.schema("CREATE TABLE a (x bigint GENERATED ALWAYS AS IDENTITY);").tables["public.a"]
        self.assertFalse(table.columns["x"]["nullable"])
        self.assertTrue(table.columns["x"]["identity"])
        self.assertFalse(table.columns["x"]["generated"])

    def test_foreign_keys_and_delete_rules(self):
        table = self.schema(
            "CREATE TABLE p (id int PRIMARY KEY);\n"
            "CREATE TABLE c (a int REFERENCES p(id) ON DELETE CASCADE, b int REFERENCES p ON DELETE SET NULL, d int,"
            " FOREIGN KEY (d) REFERENCES p (id));"
        ).tables["public.c"]
        rules = {c["columns"][0]: c["on_delete"] for c in table.constraints}
        self.assertEqual(rules, {"a": "cascade", "b": "set null", "d": "no action"})
        self.assertEqual(table.constraints[1]["reference_columns"], ["id"])

    def test_every_constraint_has_a_postgres_name(self):
        table = self.schema(
            "CREATE TABLE a (id int PRIMARY KEY, x int UNIQUE, y int, z int, UNIQUE (y, z));"
        ).tables["public.a"]
        self.assertEqual({c["name"] for c in table.constraints}, {"a_pkey", "a_x_key", "a_y_z_key"})


class IndexesAndPolicies(Case):
    def test_indexes_replay(self):
        table = self.schema(
            "CREATE TABLE a (x int, y int);\n"
            "CREATE UNIQUE INDEX IF NOT EXISTS a_one ON public.a (x) WHERE y > 0;\n"
            "CREATE INDEX a_two ON a USING btree (x DESC, lower(y::text));\n"
            "CREATE INDEX a_three ON a (y);",
            "DROP INDEX IF EXISTS public.a_three;",
        ).tables["public.a"]
        self.assertEqual(sorted(table.indexes), ["a_one", "a_two"])
        self.assertTrue(table.indexes["a_one"]["unique"])
        self.assertTrue(table.indexes["a_one"]["partial"])
        self.assertEqual(table.indexes["a_two"]["columns"], ["x", "lower(y::text)"])

    def test_policies_replay(self):
        table = self.schema(
            'CREATE TABLE a (id int);\nALTER TABLE a ENABLE ROW LEVEL SECURITY;\n'
            'CREATE POLICY "read it" ON a FOR SELECT TO authenticated, anon USING (id > 0);\n'
            'CREATE POLICY gone ON a FOR DELETE USING (true);\nCREATE POLICY old ON a USING (true);',
            'DROP POLICY IF EXISTS gone ON a;\nALTER POLICY old ON a RENAME TO new;',
        ).tables["public.a"]
        self.assertTrue(table.rls)
        self.assertEqual(sorted(table.policies), ["new", "read it"])
        self.assertEqual(table.policies["read it"]["command"], "select")
        self.assertEqual(table.policies["read it"]["roles"], ["anon", "authenticated"])
        self.assertEqual(table.policies["read it"]["using"], "id > 0")
        self.assertEqual(table.policies["new"]["roles"], ["public"])

    def test_triggers_replay(self):
        table = self.schema(
            "CREATE TABLE a (id int);\n"
            "CREATE TRIGGER t1 BEFORE INSERT OR UPDATE ON a FOR EACH ROW EXECUTE FUNCTION public.f();\n"
            "CREATE TRIGGER t2 AFTER DELETE ON a FOR EACH ROW EXECUTE PROCEDURE g();",
            "DROP TRIGGER IF EXISTS t2 ON a;",
        ).tables["public.a"]
        self.assertEqual(list(table.triggers), ["t1"])
        self.assertEqual(table.triggers["t1"]["events"], ["insert", "update"])
        self.assertEqual(table.triggers["t1"]["timing"], "before")
        self.assertEqual(table.triggers["t1"]["function"], "public.f")


class DoBlocks(Case):
    def test_guarded_ddl_is_replayed_with_its_real_line(self):
        table = self.schema(
            "CREATE TABLE a (id int, role text);\n"
            "DO $$\nBEGIN\n  IF NOT EXISTS (SELECT 1) THEN\n"
            "    ALTER TABLE a ADD CONSTRAINT a_role CHECK (role IN ('x'));\n"
            "    ALTER TABLE a ADD COLUMN late int;\n  END IF;\nEND $$;"
        ).tables["public.a"]
        self.assertIn("a_role", [c["name"] for c in table.constraints])
        self.assertEqual(table.columns["late"]["source"], "supabase/migrations/000.sql:6")

    def test_exception_guard_is_replayed(self):
        table = self.schema(
            "CREATE TABLE a (id int);\n"
            "DO $$ BEGIN ALTER TABLE a ADD COLUMN x int; EXCEPTION WHEN duplicate_column THEN NULL; END $$;"
        ).tables["public.a"]
        self.assertIn("x", table.columns)

    def test_dynamic_sql_is_counted_not_guessed(self):
        schema = self.schema("DO $$ BEGIN EXECUTE 'CREATE TABLE ghost (id int)'; END $$;")
        self.assertEqual(schema.tables, {})
        self.assertEqual(schema.unknown["do block with dynamic sql"], 1)


class Accounting(Case):
    def test_enums_replay(self):
        schema = self.schema("CREATE TYPE public.mood AS ENUM ('a', 'b');", "ALTER TYPE mood ADD VALUE IF NOT EXISTS 'c';")
        self.assertEqual(schema.types["public.mood"]["labels"], ["a", "b", "c"])

    def test_unknown_statements_are_counted_by_shape(self):
        schema = self.schema("CREATE AGGREGATE x (int) (sfunc = f, stype = int);", "GRANT SELECT ON a TO b;")
        self.assertEqual(schema.unknown["create aggregate x"], 1)
        self.assertEqual(schema.ignored, 1)

    def test_policy_on_an_outside_table_is_counted(self):
        schema = self.schema('CREATE POLICY p ON storage.objects USING (true);')
        self.assertEqual(schema.unknown["policy outside the model"], 1)


if __name__ == "__main__":
    unittest.main()
