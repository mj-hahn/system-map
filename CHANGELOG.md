# Changelog

What changed in each release of System Map. Each release has a git tag, `v<version>`, on the
commit that set the version in `app.json`. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- `CONTRIBUTING.md`: claim an issue, and wait to be assigned, before opening a pull request for it.
  It also covers tests, checks and disclosing AI tools. The README and the developer guide link to it.

### Changed
- The developer guide (code layout, checks, running the page without Kiro Crew, and proving each
  reader against the real tool) moved from the README to `docs/development.md`. The README keeps a
  short pointer and the two check commands.

## [0.12.2] - 2026-11-09

### Security
- Actions only a person should take now need Kiro Crew's signed principal claim to say a person in
  the dashboard sent them (`backend.signedPrincipal`), not an agent or tool calling through the
  gateway. This covers the Intent layer (agent settings, service regions, plan status, using or
  dropping an agent draft, accepting or dropping a proposal, deleting an intent item), building a
  folder by path, removing a project, setting the default folder, the folder window, and browsing
  or listing folders. Those answer 403. Reading the built models, rebuilding a listed project and
  loading coverage are unchanged, and `ui/dev` still counts as the person.

### Added
- The status menu and the overview name each language the repo has but System Map doesn't read,
  such as "3 Python files it doesn't read (core/)". A Python or Java repo no longer maps as nearly
  empty with nothing said. A repo with nothing System Map can read is refused with the same words,
  so the error says why.
- CI on every pull request, push to `main` and once a day. It runs every Python test against the
  oldest Kiro Crew the app supports (`minKiroCrewVersion`) and the newest release, and fails on any
  skipped test (`python3 tests/strict.py`). It also runs the UI tests, typecheck and build, and fails if
  `ui/dist` is not the committed build.
- Tests that sign requests with Kiro Crew's own signing code and check System Map's test signatures
  with Kiro Crew's own checks, so the two can't drift apart.
- The store page links to the source code, the issue tracker and this changelog (`links`).
- The README shows CI, version, Kiro Crew and license badges, and links to its main sections.

### Changed
- The author is now `mj-hahn`, and the source lives at
  [github.com/mj-hahn/system-map](https://github.com/mj-hahn/system-map).
- The app now says it needs Kiro Crew 0.12.0 or newer (`minKiroCrewVersion`). 0.12.0 is the first
  release with `backend.signedPrincipal`; 0.11.2 has the v2 proxy signature and panel tabs but not
  that.

### Fixed
- Every git call now runs with `GIT_OPTIONAL_LOCKS=0` and no file-system monitor, so reading a repo
  never refreshes its `.git/index` or takes `index.lock`, and the worktree poll cannot collide with
  your own git commands.
- A coverage report with a bad lcov line gets a 400 that names the line, instead of a dropped
  connection. Any other unexpected error in the backend answers 500 with a short message and logs
  the traceback.
- A saved file System Map can't read (plan status, agent settings, regions, coverage, notes,
  proposals, use cases, views, the agent draft) no longer breaks whole views. It is moved, unchanged,
  to `unreadable/` in the project's data folder, the rest loads, and the status menu says where it went.

## [0.12.1] - 2026-11-08

### Fixed
- The Agents layer wraps a crowded rank into columns or rows, so a module that starts many agents
  on one model no longer shrinks the map until no card reads.
- An agent found from an agent SDK shows the SDK on its map card (`OpenAI Agents`, `Mastra`,
  `Claude Agent SDK`) instead of "0 jobs".

## [0.12.0] - 2026-11-08

### Added
- **Agents from SDKs.** Agents declared with the OpenAI Agents SDK, Mastra or the Claude Agent
  SDK show in the Agents tab with no settings, when the root `package.json` lists the SDK. Each has
  its name, what starts it, who it hands work to (OpenAI Agents) and its model. The detail says
  which package it came from, with a line. A listed or marked agent with the same name wins.
- `python3 -m core verify-sdk <repo> <truth.json>` compares those agents and hand-offs with the
  TypeScript compiler's answer from `scripts/sdk_truth.mjs`. Agents in test files, or outside the
  code root, are listed under `skipped` and don't fail the check.

### Changed
- A project that uses `@ai-sdk/openai` or `@ai-sdk/anthropic` now shows that service, even with no
  agent SDK. `@openai/agents` and `@anthropic-ai/claude-agent-sdk` map to the same two services.

### Fixed
- `scripts/sdk_truth.mjs` no longer runs out of memory on a package as large as Mastra's own
  `packages/core`, and it reads an agent whose config is written `{ … } as any` (or `satisfies`),
  which it used to list as unreadable. `verify-sdk` says plainly when the truth file is empty or
  not valid JSON, instead of printing a traceback.
- An agent SDK name that a function or block declares again (a parameter, a destructured
  `Agent`, or `const Agent = class {}`) is no longer taken for the SDK's. A `new Agent`, `query`,
  `run` or `handoff` call there adds no agent, start or hand-off.

## [0.11.0] - 2026-11-07

### Added
- **Hand-off calls**, a new agent setting. It names the functions whose first argument names the
  agent to start, as in `queueAgent("mail", id)`. Such a call starts the agent from plain code, or
  is a hand-off from an agent's own code. Find my agents can draft it.

### Fixed
- A name passed as a hand-off key's value or a hand-off call's argument uses only a constant in
  scope there. A parameter no longer takes the value of a constant in another function.
- A call written `name?.()` counts, for hand-off, model and asks-you calls.
- A file with many such calls reads quickly. Each call now reads only the code near it.
- The review round on Find my agents:
  - **Mark as agent** on a form opened from a draft saves the draft as edited. It used to save the
    old settings and drop the draft.
  - A draft the chat saves while you use another is kept.
  - A draft goes stale on a project with no git when its code changes and the model is rebuilt.
  - An open settings form shows the new values after **Use these**.
  - A failed use or drop shows its error only on the draft it came back with.
  - Using or dropping a draft needs its id.
  - The draft's changed marks update as soon as you save settings.
  - Why **Find my agents** is off shows beside it, not only on hover.

## [0.10.0] - 2026-11-07

### Security
- The backend refuses every call the gateway didn't sign, except `/health`. It checks the
  gateway's `X-KiroCrew-Proxy` signature, and the replay-proof v2 signature whenever one is sent.
  With no app secret it refuses everything. `ui/dev` opts out with `SYSTEM_MAP_UNSIGNED=1`, which
  a backend that Kiro Crew starts ignores.

### Fixed
- The MCP tools check each call's arguments against the tool's schema and say what to fix. A
  wrong type no longer ends the tool server for every session, and a fault no tool expected is
  reported as an internal error.
- The backend refuses a bad `Content-Length`, a body over 1 MiB, and a body that isn't a JSON
  object, with words instead of a dropped connection.
- A build no longer holds up the page's reads. Writes still take turns.
- A folder of only tests says how many test files it holds, on its Map card and in the side list,
  instead of "0 files, 0 lines". One file or line reads as one.
- Worktree cards show each path from `~`, so a screen doesn't name the user.
- The Agents layer is laid out top down when that reads bigger, so its cards stay readable on a
  squarer canvas. Lines meet cards at their top and bottom in any top-down picture.
- The review rounds on the Agents tab and layer after 0.9.0: agent reader faults, the Agents view's
  should-fix findings, turning the Agents layer off goes back to where you were, and opening a
  saved view turns the layer off.

### Added
- Find my agents. The Design chat reads your code and drafts the agent settings, with the lines it
  read them from. You see what they find, then use them, edit them first, or drop them. Only a
  person uses or drops a draft.
- The `draft_agents` MCP tool. It keeps a draft for a person, or tries one with `dry_run`, and never
  changes the saved settings.
- Contract tests for the store listing and the host: the manifest against the host's own parser,
  and each built bundle against what the host page provides.
- This changelog, and tags for every release.
- Store art and copy: a hero and a detail banner, three screenshots, each in light and dark, and
  eight highlights.

### Changed
- The MCP server reports the app's version, read from `app.json`.
- The README now covers installing from the store with the trust step, what you need, the first
  run, each view, where data lives and what the app asks for, and troubleshooting. The proof
  recipes moved under Development.

## [0.9.0] - 2026-11-04

### Added
- The Agents tab. Point System Map at your list of agents, and it shows what starts each one, who
  it hands work to, which models it uses, and where it waits for a person.
- The Agents layer on the Map, with each region's models in a dashed band.
- Regions for services and a home region for the project. An agent whose model runs elsewhere
  becomes a finding, with the line that calls it.
- The `agents` MCP tool.

## [0.8.1] - 2026-11-02

0.8.0 was never released.

### Added
- Drizzle schemas for SQLite are read as text, never run, and held to `drizzle-kit`.
- Add project lists projects with no git.

## [0.7.1] - 2026-11-01

### Fixed
- The Design chat opens on its first message, so an unused project leaves no empty session.

## [0.7.0] - 2026-11-01

### Added
- Pick a project from your default folder. System Map finds the workspaces in a folder and keeps
  a default.
- Browse opens the computer's own folder window.

### Fixed
- A click on a project row reaches it.
- The side list shows only where it steers the canvas.

## [0.6.0] - 2026-11-01

### Added
- Next.js and SQLite projects. Routes are held to `next build`, and SQL in strings to the
  TypeScript compiler.
- Each build says what it read, and small projects show properly.

## [0.5.0] - 2026-11-01

### Added
- Projects. The backend manages them, the header is built around one open project, and agent
  tools find their own.
- The Explore view: what-ifs, use cases and saved views.
- Plain error messages, and a guard against stale replies.
- The app icon.

## [0.4.0] - 2026-11-01

### Added
- The Risk and Worktrees views, also shown on the Map.
- What-ifs are checked against the model and real Postgres.

## [0.3.0] - 2026-11-01

### Added
- Hot, untested code, and where worktrees collide, found from git and a trial merge.

## [0.2.0] - 2026-11-01

### Added
- The Map and Plan views: modules, routes, jobs, services and plans.

## [0.1.0] - 2026-11-01

### Added
- The Data model view: a diagram, findings and a full-height chat, proved against real Postgres.
- The page can build a project's first model.

## [0.0.1] - 2026-11-01

### Added
- The first spike: model files, MCP tools, the backend and the app page.
