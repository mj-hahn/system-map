# System Map

[![CI](https://github.com/mj-hahn/system-map/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/mj-hahn/system-map/actions/workflows/ci.yml)
[![Version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fmj-hahn%2Fsystem-map%2Fmain%2Fapp.json&query=%24.version&label=version&color=007ec6)](CHANGELOG.md)
[![Kiro Crew](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fmj-hahn%2Fsystem-map%2Fmain%2Fapp.json&query=%24.minKiroCrewVersion&label=Kiro%20Crew&prefix=%E2%89%A5%20&color=8a2be2)](https://github.com/kirodotdev/KiroCrew)
[![License](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fmj-hahn%2Fsystem-map%2Fmain%2Fapp.json&query=%24.license&label=license&color=007ec6)](LICENSE)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/hero-dark.png">
  <img src="assets/hero-light.png" alt="System Map: a system's layers drawn as blocks on a blueprint grid, beside the name and the line Your system, read from your repo">
</picture>

**A live map of your system: its parts, its data, its plans and its agents, read from your repo.**

[Install](#install) · [First run](#first-run) · [How to use it](#how-to-use-it) ·
[FAQ](#troubleshooting--faq) · [Changelog](CHANGELOG.md)

System Map is an app for [Kiro Crew](https://github.com/kirodotdev/KiroCrew), the open-source
personal AI agent.

Status: early. The model format may change, and the app upgrades it when it starts.

## What it is

System Map adds a **System Map** page to Kiro Crew, and a tab in the chat side panel. It builds one
model of a project from its repo's main branch: the modules and how they link, every table and
foreign key, what your specs promise, where code is risky, what each worktree is changing, and
which agents you run. Every view reads that model, and so can your agents, through small MCP tool
calls instead of the whole thing.

It only reads your repo. It never writes to it, never runs your code, and never runs your tests.

## The problem it solves

A design chat goes stale the moment the code moves, and the design itself is spread across chats,
docs, specs and branches. An agent asked about the system either reads the whole repo, which fills
its context, or guesses.

System Map keeps one model, rebuilt from the repo, that a person can look at and an agent can query
in slices. Each number in it is held to the tool that owns it: the TypeScript compiler, real
Postgres, real SQLite, `next build`, git.

## Top 3 use cases

### 1. Get your bearings in a repo

You open a project you haven't seen in weeks, or one someone handed you. The **Map** shows it at
three levels: areas, the modules in an area, then one module with what it touches. **Data model**
draws every table and foreign key. **Findings** lists rule checks, such as a table without row level
security, each with its file and line.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/screenshots/data-model-dark.png">
  <img src="assets/screenshots/data-model-light.png" alt="The Data model tab for a made-up bookshop: seven tables with their columns and foreign keys, a list of tables on the left with their finding counts, and the Design chat on the right">
</picture>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/screenshots/findings-dark.png">
  <img src="assets/screenshots/findings-light.png" alt="The Findings tab: tables with no row level security and foreign keys with no index, each with its migration file and line">
</picture>

### 2. Know what a change could hurt before you make it

**Risk** ranks code that changes often, has many paths and few tests, worst first. **Worktrees**
shows what each worktree is changing, live, and where two of them conflict, from a real trial merge.
**Explore** lets you describe a change, and the Design chat drafts a proposal: a diff against today,
what Postgres will refuse, and what breaks. Nothing touches your repo.

### 3. See what your agents do, and where their models run

Point the **Agents** tab at the list of your agents, or press **Find my agents** and the Design
chat drafts that for you to check. It shows what starts each one, who it hands
work to, which models it calls, and where it waits for a person. Set where each service runs and a
home region, and any agent whose model runs elsewhere becomes a finding, with the line that calls it.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/screenshots/agents-dark.png">
  <img src="assets/screenshots/agents-light.png" alt="The Agents tab: four agents with what starts each, their model and whether it asks you first, and the Restock agent's detail, from its nightly job to its hand-off to the Buyer">
</picture>

<sub>Screenshots show a made-up bookshop, taken from `ui/dev`, the stand-in host described in
[docs/development.md](docs/development.md#run-the-page-without-kiro-crew). In Kiro Crew the page
sits inside the dashboard.</sub>

## Install

**From the Kiro Crew App Store**, once it is listed there:

1. Open **Apps → Discover** in the left sidebar.
2. Search for **System Map** and choose **Install**.
3. Kiro Crew asks you to trust the app to run its own code. System Map needs that: its backend and
   its agent tools are small Python programs that read your repos and run git. Trust gives them the
   same access Kiro Crew has. If you are happy with that, trust it. You can take it back later in
   **Settings → Security → Third-party apps**. If Kiro Crew refuses with `app_execution_denied`
   instead of asking, set `agent.apps_allow_third_party` to `true` in its config.
4. Enable the app, then restart Kiro Crew once (`kirocrew restart`), so new sessions get its agent
   tools. A restart stops any work running in your sessions.

**From a local clone:**

```bash
(cd ui && npm install && npm run build)
kirocrew app install "$PWD"
kirocrew app enable system-map
kirocrew restart
```

What you need:

- Kiro Crew on a Mac or Linux computer. WSL counts as Linux.
- `python3` on the `PATH`. Everything runs on its standard library. It is tested on Python 3.12.
- `git` 2.38 or later, for trial merges in **Worktrees**. With an older git, a merge reads as
  unknown.
- To pick a folder with **Browse**: macOS, `zenity` or `kdialog` on a Linux desktop, or Windows
  through WSL.
- No account, key or network.

## First run

Open **System Map** from **Apps** in the sidebar. With no project yet, it asks you to add one.
Choose **Add project**, pick a folder from your default folder or **Browse** for one, and the app
builds its first model. That takes seconds for a small project, longer for a big one.

The project menu in the header adds, switches and removes projects. One is open at a time, and
each keeps its own view and Design chat.

## How to use it

Each tab reads the same model.

- **Map.** Areas, then modules, then one module with what it touches. Links come from real imports
  and table calls. The **Risk**, **Worktrees** and **Agents** layers draw those views on the map.
- **Data model.** Every table and foreign key. Click a table to see only it and its neighbors.
- **Plan.** What your specs promise and what does not exist yet. Each status shows its evidence,
  and you can override any status.
- **Risk.** Code that changes often, has many paths and few tests, worst first. It works from
  imports alone. **Load report** adds a coverage report for real numbers, and **Run tests in chat**
  asks the Design chat to make one in a scratch copy. The app never runs your tests itself.
- **Worktrees.** What each worktree is changing, and where two of them conflict. Two worktrees on
  one table raise a warning.
- **Findings.** Rule checks, each with its file and line.
- **Agents.** Open **Agent settings** and name the file that lists your agents, or the modules to
  treat as agents, and the names your code uses for model calls, hand-offs and asks-you calls. The
  app never guesses: an agent comes from the list you name or a module you mark. **Show on map**
  finds an agent on the Agents layer.
  - **Find my agents:** the Design chat reads your code and drafts the settings, with the lines it
    read them from. You see what they find, then use them, edit them first, or drop them.
- **Explore.**
  - **What if:** describe a change, and the Design chat drafts a proposal. You get a diff against
    today, what Postgres will refuse, what breaks, draft SQL, and which use case gaps it closes.
  - **Use cases:** map what someone needs to do to its routes, tables and tests.
  - **Views:** ask for a picture in chat, and the app draws and keeps it.
- **Design chat.** A chat beside the map, and an Ask button on everything.
- **Side panel.** Open **System Map** in a chat's side panel to browse the same model there.
- **Agent tools.** Any session can read the model through MCP tools, starting with `overview`.
  Tools that read are approved for you. Tools that write, such as `note` and `propose`, ask first.

### What it reads

| Part | Read from |
|---|---|
| Postgres | Migrations in `supabase/migrations`, `db/migrations` or `migrations` |
| SQLite | Any `.sql` file, including what Prisma and Drizzle generate, `CREATE TABLE` inside code, or a Drizzle schema in TypeScript. Real SQLite reads it, in memory |
| Routes | Next.js App Router and Pages Router, TanStack and Remix file routes |
| Code | TypeScript and JavaScript, with `paths` and `baseUrl` from `tsconfig.json` or `jsconfig.json` |
| Jobs | `cron.schedule` calls in SQL |
| Plans | `docs/specs`, `docs/plans`, `specs`, and a `BRIEF`, `PLAN`, `ROADMAP`, `PRD`, `SPEC` or `TODO` file at the top of the repo |
| Agents | Agents declared with the OpenAI Agents SDK (`@openai/agents`), Mastra (`@mastra/core`) or the Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`), with no settings, when the root `package.json` lists the SDK. Hand-offs between OpenAI Agents come from `handoffs`. And the exported list you name in the Agents tab, or modules you mark, or a draft from the Design chat that you use. Hand-offs, model calls and calls that ask a person are found by the names you give there. A hand-off is a property, as in `{ agent: "mail" }`, or a call whose first argument names the agent, as in `queueAgent("mail", id)`. Jobs start an agent when their `cron.schedule` command, or the SQL function it calls, names it |
| History | Git history and worktrees. Coverage reports from Vitest, Jest or anything that writes lcov |

A project needs no git history, though Risk has no churn without it, and there are no worktrees.
Add project lists git repos and any folder with a `package.json`. Use a full path for anything else.

Each build records what it read, and the status menu shows it. If a build finds something it can't
read, it names it: a Prisma schema with no SQL migrations, a Drizzle schema for anything but
SQLite, any part of a Drizzle schema that only running it could answer, MySQL, MongoDB, or a
Next.js app in a subfolder.

A Drizzle schema is read as text and never run. SQL files win where a project has both, since they
are what the database ran. Code links to Drizzle tables either way.

### Coverage reports

Run your tests yourself, then press **Load report** on the Risk view, or use the `coverage` tool.
Without a report, Risk still shows which tests reach each file. With Vitest, list every source file
in `coverage.include`, or a file no test loads will be missing from the report. System Map counts a
missing file as 0%.

## Settings & data

- **Where data lives.** In the app's own data folder, `$KIROCREW_HOME/apps/system-map/data`
  (`~/.kiro/crew/apps/system-map/data` by default). `SYSTEM_MAP_DATA` points it somewhere else.
- **What it keeps.** Each project's model, with its last 5 versions. Your own input sits beside it
  and survives rebuilds: plan status overrides, agent settings, service regions, proposals, use
  cases, saved views and notes, and the coverage report you loaded.
- **What it never does.** Write to your repo, run your code, or make a network call of its own.
  The Design chat is an ordinary Kiro Crew chat, so it talks to your model as any chat does.
- **What an agent can and can't do through the backend.** The backend asks the gateway who is
  calling (`backend.signedPrincipal`). A caller that isn't a person in the dashboard, such as an
  agent or tool, can read the built models, rebuild a project already listed, and load a coverage
  report. It can't set anything in the Intent layer: agent settings, a service's region, a plan's
  status, using or dropping an agent draft, or accepting or dropping a proposal. It also can't build
  a folder it names, remove a project, set the default folder, browse or list folders, or open the
  folder window. Those answer 403.
- **Removing a project** deletes its app data for good. It never touches the repo.
- **Uninstalling** keeps the data folder. `kirocrew app uninstall system-map --purge-data` deletes
  it too, and can't be undone.
- **Permissions it asks for.** `/apps/system-map/api` for its own backend; `/api/chat` and
  `/api/chat/slots` to open each project's Design chat; `/api/recent-projects` to suggest a default
  folder, which it skips if refused; and `storage`, since it keeps that data folder.

## Troubleshooting / FAQ

**Agent sessions don't have the System Map tools.** After a first install, restart Kiro Crew
(`kirocrew restart`). A new session alone doesn't help: the gateway only adds the tools to the agent
spec when it boots. Tools appear as `mcp__system-map_system-map__<tool>`.

**The page says a request did not come through Kiro Crew.** The backend only answers calls the
gateway signs with the app's secret. Something called it directly, or the gateway has no secret for
the app. Sync or reinstall the app, then restart Kiro Crew.

**The page can't reach the backend.** The backend runs only once you trust the app. Check
**Settings → Security → Third-party apps**, then reload the page.

**Browse does nothing.** On Linux the folder window needs a desktop and `zenity` or `kdialog`.
Without one, type the full path instead.

**My latest changes don't show.** A git repo is read at its main branch's last commit, so
uncommitted work and other branches don't show. **Worktrees** shows what each worktree is
changing.

**A build says it couldn't read part of the project.** Some stacks aren't read yet, and the build
names each one rather than guessing. The status menu lists what it read.

**Worktree merges show as unknown.** Trial merges need git 2.38 or later.

**I updated the app, but nothing changed.** In **Apps → Library**, open System Map's details and
choose **Sync**, then reload the page. A new tool reaches new sessions only.

## Development

The code layout, the checks, running the page without Kiro Crew, and how to prove each reader
against the real tool are in [docs/development.md](docs/development.md). The checks in short:

```bash
python3 tests/strict.py
(cd ui && npm test && npm run typecheck && npm run build)
```

To fix an issue, read [CONTRIBUTING.md](CONTRIBUTING.md) first: claim the issue before you start.

## License

Apache-2.0
