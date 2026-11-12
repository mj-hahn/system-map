"""Where extractors read a repo from.

A model describes the main branch, so `GitSource` reads files at a ref and never
depends on what a checkout has open. `TreeSource` covers a folder with no git.
"""
from __future__ import annotations

import hashlib
import json
import os
import subprocess
from functools import cached_property
from pathlib import Path, PurePosixPath


def git_command(repo_root: Path, *args: str) -> list[str]:
    """A git command line that starts no file-system monitor daemon."""
    return ["git", "-c", "core.fsmonitor=false", "-C", str(repo_root), *args]


def git_env(env: dict | None = None) -> dict:
    """The environment for every git call. `GIT_OPTIONAL_LOCKS=0` stops `git status`
    and friends from refreshing `.git/index` or taking `index.lock` in the user's repo."""
    return {**(os.environ if env is None else env), "GIT_OPTIONAL_LOCKS": "0"}


def git(repo_root: Path, *args: str) -> str | None:
    try:
        done = subprocess.run(
            git_command(repo_root, *args),
            capture_output=True,
            text=True,
            timeout=20,
            check=True,
            env=git_env(),
        )
    except (OSError, subprocess.SubprocessError):
        return None
    return done.stdout.strip()


def run_git(repo_root: Path, *args: str, env: dict | None = None, timeout: int = 120) -> subprocess.CompletedProcess | None:
    """Run git and keep its exact output and exit code. None means it could not run."""
    try:
        return subprocess.run(
            git_command(repo_root, *args),
            capture_output=True,
            text=True,
            errors="replace",
            timeout=timeout,
            env=git_env(env),
        )
    except (OSError, subprocess.SubprocessError):
        return None


def canonical_root(path: Path) -> Path:
    """Map a repo folder or any of its worktrees to the main checkout."""
    path = path.expanduser().resolve()
    common = git(path, "rev-parse", "--path-format=absolute", "--git-common-dir")
    if not common:
        return path
    common_dir = Path(common)
    return common_dir.parent if common_dir.name == ".git" else path


def default_ref(repo_root: Path) -> str | None:
    """Pick the repo's main branch, or None when the folder is not a git repo."""
    head = git(repo_root, "symbolic-ref", "--short", "refs/remotes/origin/HEAD")
    if head:
        return head
    for candidate in ("origin/main", "origin/master", "main", "master", "HEAD"):
        if git(repo_root, "rev-parse", "--verify", "--quiet", candidate):
            return candidate
    return None


class GitSource:
    def __init__(self, repo_root: Path, ref: str):
        self.root = repo_root
        self.ref = ref
        self.commit = git(repo_root, "rev-parse", ref)
        if not self.commit:
            raise ValueError(f"cannot resolve {ref!r} in {repo_root}")
        self._blobs: dict[str, str] | None = None

    @property
    def blobs(self) -> dict[str, str]:
        """Every file at the ref, mapped to its content id."""
        if self._blobs is None:
            listing = git(self.root, "ls-tree", "-r", "--full-tree", self.commit) or ""
            self._blobs = {}
            for line in listing.splitlines():
                meta, path = line.split("\t", 1)
                parts = meta.split()
                if parts[1] == "blob":
                    self._blobs[path] = parts[2]
        return self._blobs

    def list_files(self, prefix: str = "", suffixes: tuple[str, ...] = ()) -> list[str]:
        return sorted(
            path
            for path in self.blobs
            if path.startswith(prefix) and (not suffixes or path.endswith(suffixes))
        )

    def read_many(self, paths: list[str]) -> dict[str, str]:
        """Read many files in one git process."""
        if not paths:
            return {}
        request = "".join(f"{self.commit}:{path}\n" for path in paths).encode()
        done = subprocess.run(
            git_command(self.root, "cat-file", "--batch"),
            input=request,
            capture_output=True,
            timeout=120,
            check=True,
            env=git_env(),
        )
        out, at, found = done.stdout, 0, {}
        for path in paths:
            end = out.index(b"\n", at)
            header = out[at:end].split()
            at = end + 1
            if header[-1] == b"missing":
                continue
            size = int(header[2])
            found[path] = out[at : at + size].decode("utf-8", "replace")
            at += size + 1
        return found


#: Folders that hold no source, and can hold hundreds of thousands of files.
TREE_SKIP = {
    ".git", "node_modules", ".next", ".turbo", ".vercel", "dist", "build", "coverage", ".cache",
    ".venv", "venv", ".tox", "__pycache__", "site-packages",
}


class TreeSource:
    """A plain folder: for a repo with no git, and for tests."""

    def __init__(self, root: Path):
        self.root = root.resolve()
        self.ref = "working tree"
        self.commit = None

    @cached_property
    def blobs(self) -> dict[str, str]:
        found = {}
        for folder, names, files in os.walk(self.root):
            names[:] = [name for name in names if name not in TREE_SKIP]
            for name in files:
                path = Path(folder) / name
                found[PurePosixPath(path.relative_to(self.root)).as_posix()] = hashlib.sha1(path.read_bytes()).hexdigest()
        return found

    def list_files(self, prefix: str = "", suffixes: tuple[str, ...] = ()) -> list[str]:
        return sorted(
            path
            for path in self.blobs
            if path.startswith(prefix) and (not suffixes or path.endswith(suffixes))
        )

    def read_many(self, paths: list[str]) -> dict[str, str]:
        return {path: (self.root / path).read_text(encoding="utf-8", errors="replace") for path in paths}


def is_migration(path: str) -> bool:
    """A SQL file in a `migrations` folder, at the top of the repo or below it."""
    return path.startswith("migrations/") or "/migrations/" in path


def package_dependencies(source) -> dict[str, set[str]]:
    """What package.json asks for, split into what ships and what is only for development."""
    if "package.json" not in source.blobs:
        return {"runtime": set(), "dev": set()}
    try:
        data = json.loads(source.read_many(["package.json"])["package.json"])
    except (KeyError, ValueError):
        return {"runtime": set(), "dev": set()}
    if not isinstance(data, dict):
        return {"runtime": set(), "dev": set()}
    runtime = data.get("dependencies")
    dev = data.get("devDependencies")
    return {
        "runtime": set(runtime) if isinstance(runtime, dict) else set(),
        "dev": set(dev) if isinstance(dev, dict) else set(),
    }


def open_source(repo_root: Path, ref: str | None = None) -> GitSource | TreeSource:
    resolved = ref or default_ref(repo_root)
    return GitSource(repo_root, resolved) if resolved else TreeSource(repo_root)
