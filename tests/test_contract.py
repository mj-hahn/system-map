"""Contracts with the host and the App Store, so a bad listing or a bad import fails here, not at load.

The store rules come from the App Kit's publishing guide (sections 2 to 4 and the section 14
review checklist). The host tests use an installed Kiro Crew when one can be found, and skip
when none can.
"""
import ast
import json
import os
import re
import shutil
import struct
import subprocess
import sys
import unittest
from functools import lru_cache
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
MANIFEST = json.loads((ROOT / "app.json").read_text())

#: Section 3: Discover scans the categories in this order, and the first with a matching tag wins.
CATEGORIES = [
    ("On-call & Ops", {"oncall", "operations", "monitoring", "tickets", "pipelines"}),
    ("Research & Writing", {"research", "writing", "docs"}),
    ("Designer Tools", {"ux", "critique", "usability", "heuristic-evaluation", "designer-tools"}),
    (
        "Developer Tools",
        {"developer-tools", "code-review", "git", "github", "dev", "worktrees", "pods", "issue-triage", "code-quality", "open-source", "performance"},
    ),
    (
        "Agents & Automation",
        {"agents", "automation", "workflows", "orchestration", "autonomy", "autonudge", "execution", "collaboration", "visualization"},
    ),
    ("Productivity", {"productivity", "tasks", "inbox", "slack", "email", "outlook", "files", "explorer", "aggregation", "reports", "team"}),
]
#: Section 2: names the host keeps for itself, plus the Windows device stems.
RESERVED = {"system", "library", "registry", "registries", "blob", "install", "register", "con", "prn", "aux", "nul"} | {
    f"{stem}{n}" for stem in ("com", "lpt") for n in range(1, 10)
}
SEMVER = re.compile(r"\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?")
#: Python code the app runs. None of it may import Kiro Crew: the app has to load on its own.
PYTHON_DIRS = ("core", "backend", "mcp_server", "scripts")


def category(tags: list[str]) -> str:
    for name, picks in CATEGORIES:
        if picks & set(tags):
            return name
    return "Other"


def png_header(path: Path) -> tuple[int, int, int]:
    """Width, height and colour type, read from the PNG's IHDR chunk."""
    head = path.read_bytes()[:26]
    if head[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"{path} is not a PNG")
    width, height, _depth, colour = struct.unpack(">IIBB", head[16:26])
    return width, height, colour


def resource_paths() -> list[Path]:
    """Every file or folder the manifest points at, as written in it."""
    ui = MANIFEST.get("ui", {})
    paths = [Path(p) for p in MANIFEST.get("skills", []) + MANIFEST.get("agents", []) + MANIFEST.get("sops", [])]
    paths += [Path("ui") / ui["entry"]] if ui.get("entry") else []
    paths += [Path("ui") / tab["entry"] for tab in MANIFEST.get("contributes", {}).get("panelTabs", [])]
    paths += [Path(MANIFEST["backend"]["entryPoint"])] if MANIFEST.get("backend") else []
    paths += [Path(server["args"][0]) for server in MANIFEST.get("mcpServers", {}).values() if server.get("args")]
    return paths


class StoreListing(unittest.TestCase):
    def test_the_name_and_version_are_valid(self):
        self.assertRegex(MANIFEST["name"], r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
        self.assertNotIn(MANIFEST["name"], RESERVED)
        self.assertTrue(SEMVER.fullmatch(MANIFEST["version"]), MANIFEST["version"])

    def test_the_manifest_names_the_oldest_kiro_crew_it_needs(self):
        # 0.12.0 added `backend.signedPrincipal`, which the backend's person-only routes rely on.
        self.assertTrue(MANIFEST["backend"]["signedPrincipal"])
        self.assertEqual(MANIFEST["minKiroCrewVersion"], "0.12.0")

    def test_the_required_fields_are_filled(self):
        for key in ("name", "version", "displayName", "description"):
            with self.subTest(key=key):
                self.assertTrue(str(MANIFEST.get(key, "")).strip())

    def test_the_description_is_plain_text(self):
        self.assertNotRegex(MANIFEST["description"], r"[`*_#<>\[\]]")

    def test_the_highlights_are_a_short_plain_list(self):
        highlights = MANIFEST.get("highlights", [])
        self.assertTrue(5 <= len(highlights) <= 8, len(highlights))
        for line in highlights:
            with self.subTest(line=line):
                self.assertNotRegex(line, r"[`*_#<>\[\]]")
                self.assertLessEqual(len(line), 100)

    def test_the_tags_are_lowercase_and_land_in_developer_tools(self):
        tags = MANIFEST["tags"]
        self.assertEqual(tags, [tag.lower() for tag in tags])
        self.assertEqual(category(tags), "Developer Tools")

    def test_the_icon_is_a_square_opaque_512_png(self):
        width, height, colour = png_header(ROOT / MANIFEST["iconPath"])
        self.assertEqual((width, height), (512, 512))
        self.assertIn(colour, (0, 2), "colour types 0 and 2 have no alpha channel")

    def test_the_hero_art_is_png_at_the_store_shapes(self):
        shapes = {"heroImage": (16, 9), "heroImageDark": (16, 9), "heroImageDetail": (25, 6), "heroImageDetailDark": (25, 6)}
        for field, (wide, high) in shapes.items():
            with self.subTest(field=field):
                path = ROOT / MANIFEST[field]
                width, height, _colour = png_header(path)
                self.assertEqual(width * high, height * wide, f"{width}x{height} is not {wide}:{high}")
                self.assertGreaterEqual(width, 1200)
                self.assertLess(path.stat().st_size, 8 * 1024 * 1024, "the store never serves art over 8 MiB")

    def test_the_screenshots_are_landscape_pngs_in_both_themes(self):
        light, dark = MANIFEST.get("screenshots", []), MANIFEST.get("screenshotsDark", [])
        self.assertGreaterEqual(len(light), 1, "the store needs at least one screenshot")
        self.assertEqual(len(dark), len(light), "each screenshot has a dark copy")
        for name in light + dark:
            with self.subTest(name=name):
                path = ROOT / name
                width, height, _colour = png_header(path)
                self.assertGreater(width, height)
                self.assertGreaterEqual(width, 1200)
                self.assertLess(path.stat().st_size, 8 * 1024 * 1024, "the store never serves art over 8 MiB")

    def test_resource_paths_stay_inside_the_app_and_exist(self):
        for path in resource_paths():
            with self.subTest(path=str(path)):
                self.assertFalse(path.is_absolute())
                self.assertNotIn("..", path.parts)
                self.assertTrue((ROOT / path).exists())

    def test_each_skill_has_frontmatter_with_a_name_and_description(self):
        for folder in MANIFEST.get("skills", []):
            text = (ROOT / folder / "SKILL.md").read_text()
            front = re.match(r"---\n(.*?)\n---\n", text, re.S)
            self.assertIsNotNone(front, folder)
            self.assertRegex(front.group(1), r"(?m)^name: \S")
            self.assertRegex(front.group(1), r"(?m)^description: \S")

    def test_each_api_permission_is_used_by_the_page(self):
        source = "\n".join(path.read_text() for path in (ROOT / "ui" / "src").rglob("*.ts*"))
        for prefix in MANIFEST["permissions"]["api"]:
            with self.subTest(prefix=prefix):
                self.assertIn(f"'{prefix}", source)

    def test_auto_approved_tools_only_read(self):
        # draft_agents only keeps a draft, but like propose it asks first, as its spec says.
        writers = {"coverage", "propose", "use_case", "save_view", "note", "build", "draft_agents"}
        approved = set(MANIFEST["mcpServers"]["system-map"]["autoApprove"])
        self.assertEqual(approved & writers, set())

    def test_the_readme_has_the_sections_a_user_needs(self):
        text = (ROOT / "README.md").read_text()
        headings = re.findall(r"^## (.+)$", text, re.M)
        for wanted in ("What it is", "The problem it solves", "Top 3 use cases", "Install", "First run", "How to use it", "Settings & data", "Troubleshooting / FAQ", "Development", "License"):
            with self.subTest(heading=wanted):
                self.assertIn(wanted, headings)
        self.assertIn("agent.apps_allow_third_party", text)
        self.assertIn("Settings → Security → Third-party apps", text)

    def test_the_readmes_local_links_and_images_exist(self):
        text = (ROOT / "README.md").read_text()
        targets = re.findall(r"\]\(([^)#\s]+)\)", text) + re.findall(r'(?:src|srcset)="([^"]+)"', text)
        for target in targets:
            if re.match(r"[a-z]+:", target):
                continue
            with self.subTest(target=target):
                self.assertTrue((ROOT / target).exists())

    def test_the_readmes_jump_links_land_on_a_heading(self):
        text = (ROOT / "README.md").read_text()
        anchors = re.findall(r"\]\(#([^)]+)\)", text)
        self.assertGreaterEqual(len(anchors), 4)
        for anchor in anchors:
            with self.subTest(anchor=anchor):
                self.assertIn(anchor, heading_anchors(text))

    def test_links_between_the_docs_land_on_a_file_and_a_heading(self):
        for doc in ("README.md", "docs/development.md", "docs/backlog.md", "CONTRIBUTING.md", "CLAUDE.md"):
            text = (ROOT / doc).read_text()
            for target, anchor in re.findall(r"\]\(([^)#\s:]*)(?:#([^)\s]+))?\)", text):
                path = (ROOT / doc).parent / target if target else ROOT / doc
                with self.subTest(doc=doc, target=target, anchor=anchor):
                    self.assertTrue(path.exists())
                    if anchor:
                        self.assertIn(anchor, heading_anchors(path.read_text()))

    def test_the_readmes_live_badges_read_fields_the_manifest_has(self):
        text = (ROOT / "README.md").read_text()
        fields = re.findall(r"query=%24\.(\w+)", text)
        self.assertEqual(sorted(fields), ["license", "minKiroCrewVersion", "version"])
        for field in fields:
            with self.subTest(field=field):
                self.assertIn(field, MANIFEST)

    def test_the_store_links_follow_the_hosts_rules(self):
        # Kiro Crew drops any link past the sixth, and any that breaks a rule, with only a log line.
        links = MANIFEST["links"]
        self.assertLessEqual(len(links), 6)
        for link in links:
            with self.subTest(link=link.get("label")):
                self.assertEqual(set(link), {"label", "url"})
                self.assertTrue(1 <= len(link["label"]) <= 40)
                self.assertLessEqual(len(link["url"]), 2048)
                parts = urlparse(link["url"])
                self.assertEqual(parts.scheme, "https")
                self.assertIsNone(parts.username)
                self.assertIn(parts.port, (None, 443))

    def test_the_ui_bundle_is_committed(self):
        try:
            subprocess.run(
                ["git", "-C", str(ROOT), "ls-files", "--error-unmatch", "ui/dist/index.mjs", "ui/dist/panel.mjs"],
                check=True,
                capture_output=True,
            )
        except (OSError, subprocess.CalledProcessError) as error:
            if not (ROOT / ".git").exists():
                self.skipTest("not a git checkout")
            self.fail(f"ui/dist is not committed: {error}")


def heading_anchors(text: str) -> set[str]:
    """GitHub's anchor for each heading: lower case, punctuation dropped, each space a hyphen."""
    return {re.sub(r"[^\w\- ]", "", heading.strip().lower()).replace(" ", "-") for heading in re.findall(r"^#+ (.+)$", text, re.M)}


def released() -> list[str]:
    """The released versions in CHANGELOG.md, top first."""
    text = (ROOT / "CHANGELOG.md").read_text()
    return re.findall(r"^## \[(\d[^\]]*)\] - \d{4}-\d{2}-\d{2}$", text, re.M)


def git(*args: str) -> str:
    return subprocess.run(["git", "-C", str(ROOT), *args], check=True, capture_output=True, text=True).stdout


class Versions(unittest.TestCase):
    """One version, kept in app.json: the tools server, the changelog and the tags all agree with it."""

    def test_the_tools_server_reports_the_app_version(self):
        from mcp_server import server

        reply = server.handle(json.dumps({"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}}))
        self.assertEqual(reply["result"]["serverInfo"]["version"], MANIFEST["version"])

    def test_the_changelog_puts_this_version_first_and_runs_newest_first(self):
        versions = released()
        self.assertEqual(versions[0], MANIFEST["version"])
        numbers = [tuple(int(part) for part in version.split("-")[0].split(".")) for version in versions]
        self.assertEqual(numbers, sorted(set(numbers), reverse=True))
        self.assertIn("## [Unreleased]", (ROOT / "CHANGELOG.md").read_text())

    def test_each_tagged_release_is_in_the_changelog_and_set_in_its_app_json(self):
        if not (ROOT / ".git").exists():
            self.skipTest("not a git checkout")
        tags = git("tag", "--list", "v*").split()
        if not tags:
            self.skipTest("this checkout has no release tags")
        # The release being made now is the one version allowed to have no tag yet: the tag goes on
        # its commit once that commit is on main.
        expected = {f"v{version}" for version in released()}
        self.assertLessEqual(set(tags), expected)
        self.assertLessEqual(expected - set(tags), {f"v{MANIFEST['version']}"})
        for tag in tags:
            with self.subTest(tag=tag):
                self.assertEqual(json.loads(git("show", f"{tag}:app.json"))["version"], tag[1:])


class NoHostImports(unittest.TestCase):
    def test_python_code_imports_nothing_from_kiro_crew(self):
        for folder in PYTHON_DIRS:
            for path in (ROOT / folder).rglob("*.py"):
                tree = ast.parse(path.read_text(), str(path))
                for node in ast.walk(tree):
                    names = []
                    if isinstance(node, ast.Import):
                        names = [alias.name for alias in node.names]
                    elif isinstance(node, ast.ImportFrom) and node.module and node.level == 0:
                        names = [node.module]
                    for name in names:
                        with self.subTest(file=str(path.relative_to(ROOT)), module=name):
                            self.assertNotIn(name.split(".")[0], {"kiro_crew", "mesh_claw"})


@lru_cache(maxsize=None)
def host_python() -> str | None:
    """A Python that imports Kiro Crew: this one, `KIROCREW_PYTHON`, or the one the `kirocrew` launcher names."""
    candidates = [sys.executable, os.environ.get("KIROCREW_PYTHON")]
    launcher = shutil.which("kirocrew")
    if launcher:
        first = Path(launcher).read_bytes()[:300].split(b"\n")[0]
        if first.startswith(b"#!") and first[2:].strip():
            candidates.append(first[2:].decode(errors="ignore").split()[0])
    for python in filter(None, candidates):
        try:
            if subprocess.run([python, "-c", "import kiro_crew"], capture_output=True, timeout=60).returncode == 0:
                return python
        except (OSError, subprocess.TimeoutExpired):
            continue
    return None


def host_run(code: str, *args: str) -> str:
    python = host_python()
    if python is None:
        raise unittest.SkipTest("no installed Kiro Crew to check against")
    done = subprocess.run([python, "-c", code, *args], capture_output=True, text=True, timeout=120)
    if done.returncode:
        raise AssertionError(done.stderr)
    return done.stdout


class HostManifest(unittest.TestCase):
    def test_the_hosts_own_parser_finds_no_errors(self):
        code = (
            "import json, sys\n"
            "from pathlib import Path\n"
            "from kiro_crew.apps.manifest import AppManifest\n"
            "root = Path(sys.argv[1])\n"
            "print(json.dumps(AppManifest.from_json_file(root / 'app.json').validate(root)))\n"
        )
        self.assertEqual(json.loads(host_run(code, str(ROOT))), [])

    def test_the_hosts_parser_does_refuse_a_broken_copy(self):
        code = (
            "import json, sys\n"
            "from pathlib import Path\n"
            "from kiro_crew.apps.manifest import AppManifest\n"
            "root = Path(sys.argv[1])\n"
            "data = {**json.loads((root / 'app.json').read_text()), 'name': 'System Map', 'version': 'one'}\n"
            "print(json.dumps(AppManifest.from_dict(data).validate(root)))\n"
        )
        self.assertGreaterEqual(len(json.loads(host_run(code, str(ROOT)))), 1)


def exported(stub: Path) -> set[str]:
    """The names a host vendor stub re-exports, from its one `export const { ... } = m` line."""
    body = re.search(r"export const \{(.*?)\} = m", stub.read_text(), re.S)
    if body is None:
        raise AssertionError(f"{stub} no longer has one export list")
    return {item.strip() for item in re.sub(r"//.*", "", body.group(1)).split(",") if item.strip()}


def import_problems(text: str, mapped: dict, provided: dict[str, set[str]]) -> list[str]:
    """What a built bundle imports that the host page would not give it."""
    problems = []
    for names, source in re.findall(r'import\s*\{([^}]*)\}\s*from\s*"([^"]+)"', text):
        if source.startswith("."):
            continue
        if source not in mapped:
            problems.append(f"{source} is not in the host's import map")
        wanted = {item.split(" as ")[0].strip() for item in names.split(",") if item.strip()}
        problems += [f"{name} is not exported by {source}" for name in sorted(wanted - provided.get(source, wanted))]
    return problems


class HostImports(unittest.TestCase):
    """The built page may import only what the host page provides. Anything else fails the whole app at load."""

    @classmethod
    def setUpClass(cls):
        dist = Path(host_run("import kiro_crew, pathlib; print(pathlib.Path(kiro_crew.__file__).parent)").strip()) / "static" / "dist"
        importmap = re.search(r'<script type="importmap"[^>]*>(.*?)</script>', (dist / "index.html").read_text(), re.S)
        if importmap is None:
            raise AssertionError("the host page has no import map")
        cls.mapped = json.loads(importmap.group(1))["imports"]
        ui = exported(dist / "vendor" / "kirocrew-ui.mjs")
        cls.provided = {"@kirocrew/app-sdk": exported(dist / "vendor" / "kirocrew-app-sdk.mjs"), "@kirocrew/ui": ui, "@kirocrew/app-sdk/ui": ui}

    def test_the_bundles_import_only_what_the_host_provides(self):
        dist = ROOT / "ui" / "dist"
        bundles = sorted(dist.rglob("*.mjs"))
        self.assertLessEqual({dist / "index.mjs", dist / "panel.mjs"}, set(bundles))
        for bundle in bundles:
            with self.subTest(bundle=str(bundle.relative_to(dist))):
                self.assertEqual(import_problems(bundle.read_text(), self.mapped, self.provided), [])

    def test_a_name_the_host_lacks_is_caught(self):
        text = 'import { useAppApi, NotAHostName } from "@kirocrew/app-sdk";\nimport { x } from "left-pad";\n'
        self.assertEqual(
            import_problems(text, self.mapped, self.provided),
            ["NotAHostName is not exported by @kirocrew/app-sdk", "left-pad is not in the host's import map"],
        )


if __name__ == "__main__":
    unittest.main()
