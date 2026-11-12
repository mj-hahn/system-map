import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "tests"))

from core import store, system, verify  # noqa: E402
from core.extractors import plans  # noqa: E402
from core.sources import GitSource, TreeSource  # noqa: E402
from helpers import commit_all, git, write_migration  # noqa: E402

TYPESCRIPT = ROOT / "ui" / "node_modules" / "typescript"

BUILT_SPEC = """# Billing (job) - DESIGN 1

**Names:** migration `20260101000000_base` and `src/billing/run.ts`, tested in `src/billing/run.test.ts`.
"""
PLANNED_SPEC = """# Mail (agent)

Add `src/mail/send.ts`, `src/mail/read.ts`, `src/mail/sort.ts`, `src/mail/queue.ts` and `src/billing/run.ts`.
"""


def write(root: Path, name: str, text: str) -> None:
    path = root / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)


class Fixture(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.base = Path(tmp.name)
        self.repo = self.base / "repo"
        self.repo.mkdir()
        git(self.repo, "init", "-q", "-b", "main")
        write_migration(
            self.repo,
            "20260101000000_base.sql",
            "CREATE TABLE public.invoices (id uuid PRIMARY KEY);\n"
            "DO $$ BEGIN PERFORM cron.schedule('bill', '0 1 * * *', 'x'); END $$;\n"
            "DO $$ BEGIN PERFORM cron.schedule('poke', '* * * * *', format('call /api/poke')); END $$;\n",
        )
        write(self.repo, "supabase/tests/a.sql", "SELECT cron.schedule('in-a-test', '* * * * *', 'x');")
        write(self.repo, "src/billing/run.ts", 'import { A } from "@anthropic-ai/sdk"\ndb.from("invoices").insert({})')
        write(self.repo, "src/billing/run.test.ts", "export {}")
        write(self.repo, "src/routes/api.poke.ts", 'import "../billing/run"')
        write(self.repo, "docs/specs/billing.md", BUILT_SPEC)
        write(self.repo, "docs/specs/mail.md", PLANNED_SPEC)
        write(self.repo, "docs/specs/README.md", "# Index\n`src/nope.ts`")
        commit_all(self.repo)
        self.data = self.base / "data"
        self.manifest = store.build(self.repo, self.data)
        self.target = store.repo_dir(self.repo, self.data)
        self.joined = store.load_system(self.target)
        self.nodes = {n["id"]: n for n in self.joined["nodes"]}


class Joined(Fixture):
    def test_every_kind_is_present(self):
        kinds = {n["kind"] for n in self.joined["nodes"]}
        self.assertEqual(kinds, {"area", "module", "route", "job", "service", "plan"})

    def test_every_node_has_status_layer_and_evidence(self):
        for node in self.joined["nodes"]:
            self.assertIn("status", node, node["id"])
            self.assertEqual(node["layer"], "facts", node["id"])
            self.assertTrue(node["evidence"], node["id"])

    def test_jobs_come_from_cron_and_skip_tests(self):
        self.assertEqual(self.nodes["job:bill"]["schedule"], "0 1 * * *")
        self.assertNotIn("job:in-a-test", self.nodes)

    def test_a_job_links_to_the_route_it_calls(self):
        self.assertIn(
            ("job:poke", "route:/api/poke"),
            {(e["source"], e["target"]) for e in self.joined["edges"] if e["kind"] == "calls"},
        )

    def test_a_table_use_carries_read_or_write(self):
        edge = next(e for e in self.joined["edges"] if e["kind"] == "uses_table")
        self.assertEqual((edge["target"], edge["access"]), ("table:public.invoices", "write"))

    def test_counts_reach_the_manifest(self):
        self.assertEqual(self.manifest["counts"]["system"]["job"], 2)

    def test_a_repo_with_code_but_no_sql_still_builds(self):
        plain = self.base / "plain"
        write(plain, "src/a/one.ts", "export const a = 1")
        manifest = store.build(plain, self.data)
        self.assertEqual(manifest["counts"]["tables"], 0)
        self.assertEqual(manifest["counts"]["system"]["module"], 1)

    def test_a_repo_with_nothing_to_read_is_refused(self):
        empty = self.base / "empty"
        empty.mkdir()
        (empty / "notes.txt").write_text("x")
        with self.assertRaises(ValueError):
            store.build(empty, self.data)


class Plans(Fixture):
    def test_the_index_file_is_not_a_plan(self):
        self.assertNotIn("plan:README", self.nodes)

    def test_status_comes_from_what_exists(self):
        self.assertEqual(self.nodes["plan:billing"]["status"], "built")
        self.assertEqual(self.nodes["plan:mail"]["status"], "planned")
        self.assertEqual(self.nodes["plan:mail"]["status_source"], "derived")

    def test_missing_claims_are_listed(self):
        missing = [c["claim"] for c in self.nodes["plan:mail"]["claims"] if not c["found"]]
        self.assertEqual(len(missing), 4)
        self.assertIn("src/mail/send.ts", missing)

    def test_a_plan_links_to_modules_that_exist(self):
        links = {e["target"] for e in self.joined["edges"] if e["source"] == "plan:mail"}
        self.assertEqual(links, {"module:src/billing"})

    def test_plans_list_worst_first(self):
        self.assertEqual([p["id"] for p in store.plan_items(self.target)], ["plan:mail", "plan:billing"])

    def test_filter_by_status(self):
        self.assertEqual([p["id"] for p in store.plan_items(self.target, "built")], ["plan:billing"])

    def test_same_name_plans_in_different_folders_stay_apart(self):
        write(self.repo, "docs/specs/auth/design.md", PLANNED_SPEC)
        write(self.repo, "docs/specs/billing/design.md", PLANNED_SPEC)
        commit_all(self.repo)
        store.build(self.repo, self.data)
        joined = store.load_system(store.repo_dir(self.repo, self.data))
        ids = {n["id"] for n in joined["nodes"] if n["kind"] == "plan"}
        self.assertIn("plan:auth/design", ids)
        self.assertIn("plan:billing/design", ids)

    def test_overview_names_what_is_not_built(self):
        text = (store.current(self.target) / "overview.md").read_text()
        self.assertIn("Not fully built: plan:mail (planned)", text)
        self.assertIn("src/billing", text)


class Derive(unittest.TestCase):
    def claims(self, found, missing):
        return [{"found": True}] * found + [{"found": False}] * missing

    def test_thresholds(self):
        cases = [((10, 0), "built"), ((9, 2), "built"), ((7, 3), "partial"), ((5, 5), "partial"), ((4, 6), "planned"), ((0, 5), "planned")]
        for (found, missing), expected in cases:
            self.assertEqual(plans.derive_status(self.claims(found, missing)), expected, (found, missing))

    def test_too_little_to_judge(self):
        self.assertEqual(plans.derive_status(self.claims(1, 1)), "unclear")

    def test_a_declared_status_wins(self):
        self.assertEqual(plans.declared_status("---\nstatus: done\n---\n# X"), "built")
        self.assertEqual(plans.declared_status("---\nstatus: draft\n---\n# X"), "planned")
        self.assertIsNone(plans.declared_status("# X"))

    def test_titles_drop_their_suffix(self):
        self.assertEqual(plans.title_of("# Inbox (agent) — DESIGN 6ar — after x", "a.md"), "Inbox (agent)")
        self.assertEqual(plans.title_of("no heading", "docs/specs/a.md"), "a")

    def test_words_in_backticks_are_not_claims(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        root = Path(tmp.name)
        write(root, "src/a.ts", "x")
        index = plans.Index(TreeSource(root))
        for token in ("inbox.reply/1", "triage.sort/2", "npm run x", "some_name", "agent_jobs.agent", "a/b"):
            self.assertIsNone(index.match(token), token)

    def test_a_path_under_a_known_root_is_a_claim(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        root = Path(tmp.name)
        write(root, "src/a/b.ts", "x")
        index = plans.Index(TreeSource(root))
        self.assertEqual(index.match("src/a/b.ts"), (True, "src/a/b.ts"))
        self.assertEqual(index.match("src/a/"), (True, "src/a"))
        self.assertEqual(index.match("src/a/c.ts"), (False, "src/a/c.ts"))
        self.assertEqual(index.match("a/b.ts"), (True, "src/a/b.ts"))


class Overrides(Fixture):
    def test_your_status_wins_and_keeps_the_derived_one(self):
        store.set_plan_status(self.target, "plan:mail", "built")
        plan = next(n for n in store.load_system(self.target)["nodes"] if n["id"] == "plan:mail")
        self.assertEqual((plan["status"], plan["status_source"], plan["derived_status"]), ("built", "you", "planned"))

    def test_it_survives_a_rebuild(self):
        store.set_plan_status(self.target, "plan:mail", "built")
        write_migration(self.repo, "20260102000000_more.sql", "CREATE TABLE t (id int PRIMARY KEY);")
        commit_all(self.repo)
        store.build(self.repo, self.data)
        plan = next(p for p in store.plan_items(self.target) if p["id"] == "plan:mail")
        self.assertEqual(plan["status_source"], "you")

    def test_clearing_returns_to_derived(self):
        store.set_plan_status(self.target, "plan:mail", "built")
        store.set_plan_status(self.target, "plan:mail", None)
        self.assertEqual(store.plan_items(self.target, "planned")[0]["status_source"], "derived")

    def test_it_never_touches_the_repo(self):
        store.set_plan_status(self.target, "plan:mail", "built")
        self.assertEqual(git(self.repo, "status", "--porcelain"), "")

    def test_only_plans_and_known_statuses(self):
        with self.assertRaises(KeyError):
            store.set_plan_status(self.target, "module:src/billing", "built")
        with self.assertRaises(ValueError):
            store.set_plan_status(self.target, "plan:mail", "nearly")


class Reading(Fixture):
    def test_node_works_for_every_kind(self):
        for node_id in ("module:src/billing", "area:src/billing", "route:/api/poke", "job:poke", "service:anthropic", "plan:mail", "table:public.invoices"):
            self.assertEqual(store.load_node(self.target, node_id)["id"], node_id)

    def test_a_table_shows_who_uses_it(self):
        links = store.load_node(self.target, "table:public.invoices")["links"]
        self.assertEqual(links["in_uses_table"][0]["node"], "module:src/billing")

    def test_a_module_shows_links_both_ways(self):
        links = store.load_node(self.target, "module:src/billing")["links"]
        self.assertIn("out_uses_table", links)
        self.assertIn("in_renders", links)
        self.assertIn("in_touches", links)

    def test_neighbors_work_for_any_kind(self):
        self.assertIn("out_touches", store.neighbors(self.target, "plan:mail")["links"])

    def test_search_finds_every_kind(self):
        ids = [hit["id"] for hit in store.search(self.target, "bill")]
        self.assertIn("job:bill", ids)
        self.assertIn("module:src/billing", ids)
        self.assertIn("plan:billing", ids)

    def test_an_unknown_node_is_refused(self):
        with self.assertRaises(KeyError):
            store.load_node(self.target, "module:nope")

    def test_a_note_can_land_on_any_kind(self):
        store.add_note(self.target, "plan:mail", "Check this.", ["docs/specs/mail.md"])
        self.assertEqual(store.load_node(self.target, "plan:mail")["reads"][0]["text"], "Check this.")


class Freshness(Fixture):
    def test_a_code_commit_moves_the_map_not_the_schema(self):
        write(self.repo, "src/billing/run.ts", "export const x = 2")
        commit_all(self.repo)
        fresh = store.freshness(self.target)
        self.assertTrue(fresh["map_stale"])
        self.assertFalse(fresh["stale"])

    def test_a_new_spec_moves_the_map(self):
        write(self.repo, "docs/specs/next.md", "# Next")
        commit_all(self.repo)
        self.assertTrue(store.freshness(self.target)["map_stale"])

    def test_an_unrelated_commit_moves_neither(self):
        write(self.repo, "NOTES.txt", "x")
        commit_all(self.repo)
        fresh = store.freshness(self.target)
        self.assertFalse(fresh["map_stale"])
        self.assertFalse(fresh["stale"])


class Verifier(unittest.TestCase):
    """A check that cannot fail proves nothing, so prove these can."""

    def test_an_extra_or_missing_import_is_reported(self):
        diffs = verify.compare_imports({"a.ts": ["b.ts", "c.ts"]}, {"a.ts": ["b.ts", "d.ts"]})
        self.assertEqual([(d["only_in"], d["item"]) for d in diffs], [("model", "c.ts"), ("compiler", "d.ts")])

    def test_a_file_only_one_side_read_is_reported(self):
        self.assertEqual(len(verify.compare_imports({}, {"a.ts": ["b.ts"]})), 1)

    def test_a_wrong_table_access_is_reported(self):
        model = {"a.ts": [{"table": "t", "access": "read"}]}
        truth = {"a.ts": [{"table": "t", "access": "write"}]}
        self.assertEqual(len(verify.compare_table_calls(model, truth)), 1)

    def test_route_tree_paths_are_read(self):
        text = "export interface FileRoutesByFullPath {\n  '/': typeof A\n  '/clients/': typeof B\n  '/a/$b': typeof C\n}\n"
        self.assertEqual(verify.route_tree_paths(text), {"/", "/clients", "/a/$b"})

    def test_a_route_only_in_the_tree_is_reported(self):
        diffs = verify.compare_routes([{"kind": "route", "path": "/a"}], {"/a", "/b"})
        self.assertEqual(diffs[0]["item"], "/b")


HARD_FILES = {
    "tsconfig.json": '{\n  // Comments are allowed here.\n  "compilerOptions": {\n    "baseUrl": ".",\n    "paths": {"@/*": ["./src/*"]},\n  },\n}\n',
    "src/plain.ts": "export const plain = 1\nexport type Plain = number\n",
    "src/other.tsx": "export const Other = () => <div className=\"a\">import x from './ghost'</div>\n",
    "src/lib/index.ts": "export * from '../plain'\nexport { Other } from '@/other'\nexport type { Plain } from '../plain'\n",
    "src/lib/deep/thing.ts": "import { plain } from '../../plain'\nimport type { Plain } from '@/plain'\nexport const v: Plain = plain\n",
    "src/uses.tsx": """import React from 'react'
import { plain } from './plain'
import * as lib from './lib'
import { v } from '@/lib/deep/thing.js'
import data from './data.json'
import './style.css'
// import { ghost } from './ghost'
/* import { ghost2 } from './ghost2' */
const s = "import { ghost3 } from './ghost3'"
const t = `import { ghost4 } from './ghost4' ${plain}`
const r = /['"]/
const lazy = () => import('./lazy')
const c = require('./plain')

export function use(db: any, supa: any) {
  db.from('users').select('*')
  db.from("orders").insert({})
  db
    .from('orders')
    .update({ a: 1 })
    .eq('id', 1)
  db.from('items').delete()
  supa.storage.from('bucket').upload('x')
  supa.storage
    .from('bucket2')
    .list()
  return [React, lib, v, data, s, t, r, lazy, c]
}
""",
    "src/lazy.ts": "export default 1\n",
    "src/data.json": "{}\n",
    "src/style.css": "a {}\n",
    "src/uses.test.ts": "import { plain } from './plain'\nimport { use } from './uses'\ndb.from('ignored').select()\n",
}


@unittest.skipUnless(TYPESCRIPT.exists(), "needs ui/node_modules; run npm install in ui")
class Compiler(unittest.TestCase):
    def test_the_reader_matches_the_real_compiler(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            repo = base / "r"
            repo.mkdir()
            git(repo, "init", "-q", "-b", "main")
            for name, text in HARD_FILES.items():
                write(repo, name, text)
            commit_all(repo)
            truth_path = base / "truth.json"
            done = subprocess.run(
                ["node", str(ROOT / "scripts" / "ts_truth.mjs"), str(repo), str(truth_path)],
                capture_output=True,
                text=True,
                env=os.environ,
                timeout=60,
            )
            self.assertEqual(done.returncode, 0, done.stderr)
            truth = json.loads(truth_path.read_text())
            found = system.build(GitSource(repo, "main"), [])
            self.assertEqual(verify.compare_imports(found["imports"], truth["imports"]), [])
            self.assertEqual(verify.compare_table_calls(found["table_calls"], truth["tableCalls"]), [])


if __name__ == "__main__":
    unittest.main()
