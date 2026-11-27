# Backlog

What's left, written so another agent can pick it up cold. Nothing here is started.

## Before you start

- Work from `main`, on version 0.12.2. Each change goes on its own branch, with a PR into
  `main`. The remote, `origin`, is the public GitHub repo `mj-hahn/system-map`. `main` only
  merges once CI's `checks` job passes.
- Run the checks in [development.md](development.md#checks). All pass on `main`: 1056 Python tests
  and 119 UI tests, with none skipped.
- Agents can't log in to the dashboard. `ui/dev` stands in for the host, so a person has to
  press Sync and look. Say what has and hasn't been seen for real.
- Look at screenshots before you commit UI. Checks have passed while pictures showed faults.
- Hold every number to the tool that owns it: the compiler, real Postgres, real SQLite, a real
  `next build`, git. Prefer a sweep over a hand-written fixture.
- Read each check's own exit code. A pipe to `tail` has hidden failures here.
- Host rules are in `docs/platform-notes.md`. Only names in the host's vendor stubs may be
  imported, and any other name fails the whole app at load.
- No personal, employer or private project names in this repo or its history. Anything that
  needs one goes in `.local/`, which git ignores.

## Check in the real dashboard

| Check | How | Why it is open |
|---|---|---|
| Project picker | Sync, then click another project in the header menu | Fixed in `8126792`, proven only in `ui/dev` |
| Show button | Press Hide on Map or Data model, then Show modules or Show tables | Hide was seen for real, Show was not |
| Folder window on a Mac and Linux | Press Browse on each | Only WSL has run for real. The others are stubbed |
| Design chat opens on its first message | Sync, open a project with no chat, leave, and look for no New Session. Then send a message | Proven only in `ui/dev`, whose chat is a stand-in |
| Agents after review | Sync. Turn the Agents layer on and off from an open area. With it on, open a saved view from Explore: the button must go off. Pick a filter whose count is 0, and look at a disabled Agents button on a project with no agents | The tab, layer, Show on map, regions, bands and region findings were seen for real, in the light theme. The review fixes since `3ceff3e` were not. The saved-view rule lives in App wiring, which no test loads |
| Agents from SDKs | Sync. Build a project that lists `@openai/agents` in its root `package.json`. Open the Agents tab with no settings: the agents show, the detail says "From @openai/agents" with a line, and a hand-off reads in Starts from and Then. Turn on the Agents layer on the Map. Look in light and dark | Seen only in `ui/dev`, in both themes, on an official OpenAI Agents example. Long agent names wrap inside the narrow Then column |
| Agents in the side panel and dark theme | Open the panel tab on an agent, and switch the theme | Not looked at yet |
| Themes | Sync. Pick each theme from the Theme chip, in light and dark. Look at the whole page, Add project, Manage projects and the panel tab, then reload | Seen only in `ui/dev`. A host dialog that draws outside the page, or padding the host puts around it, may keep Kiro Crew's colours |
| Find my agents | Sync. On a project with no agent settings, press Find my agents and approve `draft_agents` in the chat. The card must show within 8 seconds. Try Edit first then Cancel, Edit first then save, Drop, and Use these. Press Find my agents again while a card shows, and check that Use these on the old card is refused. On a project with no agents, try Edit first then Mark as agent. Set Hand-off calls in the form and check what starts each agent. Look in light and dark | Its routes, tool and skill were proven on a real project by 3 runs of a fresh agent through the MCP server. In `ui/dev`, in both themes: the card, Use these refused for a newer draft with the message on the new card, and an open settings form taking the new values after Use these. Mark as agent from a draft and the disabled button's reason were not looked at |

## Small fixes

| Fix | Where | Done when |
|---|---|---|
| Singular wording: "0 of 1 files", "1 of 1 worktrees have changes" | `ui/src/Risk.tsx:42`, `ui/src/Worktrees.tsx:183` | One thing reads as one, with a test |
| Table list labels: "at work" is vague, and two numbers have no heading | `TableList` in `ui/src/parts.tsx` | Someone new can read a row without hovering |
| Scope document is out of date | KiroCrew artifact `system-map-app-scope` | It says slices 0 to 6, and drops the done risk and store items |

The numbers in a table row are findings, then columns. Hovering shows that, and nothing else does.

## Planned features

From the scope document. Each needs a short spec first, kept as an artifact like
`system-map-slice-6-spec`.

| ID | Feature | Priority | Note |
|---|---|---|---|
| A3 | Decisions attached to nodes | Soon | Intent layer, so it survives rebuilds |
| A4 | Export decisions and proposals as files | Soon | The app never writes them to a repo itself |
| C6 | Sub-agents get ids and paths, write results to files and return a path | Soon | See `docs/context-management.md` |
| M6 | Scheduled refresh | Later | Crons and `permissions.spawn` are in the SDK, not tried |
| E6 | Agents propose Intent edits for you to accept | Later | Drafts work for proposals only. Only a person may accept |
| G2 | Agents from SDKs: Claude Agent SDK, OpenAI Agents, LangGraph, Mastra | Soon | Phase 1 done: OpenAI Agents, Mastra and the Claude Agent SDK, proven with `verify-sdk` (spec `2026-11-08-sdk-agents`). Left: LangGraph and the Python SDKs, asks-you from approval hooks, agent subclasses, and the limits below |
| G3 | Evals and guardrails beside each agent | Later | No sign in code says what is an eval or a budget yet. Cut from slice 7 |

## Store listing

| Step | Note |
|---|---|
| Make the repo public | `main` exists and holds every slice. Do the publish check below first. Keep `ui/dist` committed |
| Publish check of all git history | Scan every commit and message, not just the tip. The first copy of the slice 7 spec named a private project, in `a0fdf04` and the commits after it until task 7 |
| Listing request | An issue on the Kiro Crew repo. A maintainer writes the catalog entry |

## Known limits

These are named on screen, not hidden. Each is a choice, not a bug.

| Limit | Where | Note |
|---|---|---|
| Uncommitted work doesn't show | `GitSource` in `core/sources.py` | A git repo is read at the main branch's last commit, and requirement M7 says so. Reading a checkout needs a spec. `TreeSource` already reads folders with no git |
| Prisma with no SQL migrations gives no tables | `_unread` in `core/read.py` | Its schema isn't SQL, so it needs its own reader. Hold it to the tool's generated SQL, as `scripts/sweep_drizzle.py` does |
| Drizzle for Postgres or MySQL gives no tables | `core/extractors/drizzle.py` | Only `sqliteTable` is read. Its calls don't link either, and the build names the gap |
| Drizzle schema built by running code | `unread` in `core/extractors/drizzle.py` | Loops, `sqliteTableCreator`, custom column types and defaults from variables are named by file and line, never guessed |
| A repo with SQL files and a Drizzle schema | `replay_source` in `core/extractors/sqlite.py` | SQL gives the tables, even if the schema has moved on. Drizzle still gives the code links |
| Drizzle `with: { guest: true }` adds no link | `drizzle_uses` in `core/extractors/typescript.py` | Only calls that name a table count, on both sides of the compiler check |
| A parameter named like an imported table | `drizzle_names` in `core/extractors/typescript.py` | Text can't see scopes, so `function f(users) { Array.from(users) }` links. `ts_truth.mjs` catches it |
| Worktrees and Drizzle schema edits | `tables_at` in `core/extractors/drizzle.py` | Deleting a whole `sqliteTable`, or editing a helper a table spreads, marks no table. The shared file still shows |
| Stored or virtual generated columns | `table_shard` in `core/extractors/sqlite.py` | The model only says a column is generated, for every kind of schema |
| Monorepos | `_unread` in `core/read.py` | A Next.js app in a subfolder is named, not read |
| MySQL and MongoDB | `core/extractors/` | Each needs its own module behind the boundary |
| Limits on what-ifs are Postgres only | `limits_apply` in `core/explore.py` | They are proven against real Postgres. SQLite needs its own sweep |
| SQL built from pieces at runtime | `sql_uses` in `core/extractors/typescript.py` | Only SQL seen as one whole string links to its tables |
| Agents need settings | `settings_of` in `core/agents.py` | With none, there are no agents, only suggestions and Find my agents. Agents from the three TypeScript SDKs need none |
| An agent named in a later argument | `_hand_offs` in `core/agents.py` | A hand-off call reads only its first argument, so `run(job, "mail")` starts nothing. Nor does a name held in a variable, a cast such as `"mail" as Name` or `satisfies Name`, or one in brackets |
| A call written as page text | `ts.mask_code` | JSX text is not masked, so `<p>Run queueAgent("mail", id).</p>` reads as a call to a hand-off, model or asks-you name |
| Asks you from SQL | `asks_you` in `core/agents.py` | An agent that runs in the database and leaves a person a task through a SQL function is not marked. Only calls in an agent's own code count |
| A model called through a passed-in object | `_calls` in `core/agents.py` | It links to every model the project uses, since text can't tell which one is passed in |
| An agent that shares its file with others | `_regions` in `core/agents.py` | It gets its own object and the files its names are imported from. A handler written in that same file, outside the object, is not read |
| Asks you, or only tells you | `asks_you` in `core/agents.py` | A call to an asks-you name counts either way. Telling the two apart needs the call's arguments |
| A job that starts an agent two calls deep | `find` in `core/agents.py` | Only the job's command and the one SQL function it calls are read |
| LangGraph and Python agent SDKs | `core/sdk_agents.py` | Only the OpenAI Agents, Mastra and Claude Agent SDKs for TypeScript are read |
| SDK listed only in a sub-package | `core/sdk_agents.py` | A reader runs only when the root `package.json` lists the SDK, so a project that lists it only in a workspace package gives no SDK agents. Seen on a whole monorepo of official examples |
| Asks you from SDK approval hooks | `core/sdk_agents.py` | An SDK agent never shows as asking you, since its approval hooks are not read |
| Agent subclasses | `core/sdk_agents.py` | `RealtimeAgent`, `SandboxAgent` and other classes that extend an SDK's `Agent` are not read |
| An agent exported, then imported | `core/sdk_agents.py` | An `export default` agent is not followed by import. A Mastra agent renamed in a re-export, `export { agent as weather }`, shows no start from `weather.generate(…)` |
| `Runner.run` and `mastra.getAgent("name")` | `core/sdk_agents.py` | Only `run(agent, …)`, `agent.generate` and `agent.stream` start an agent, so other ways in show no start |
| Imports from `@openai/agents-core` | `core/sdk_agents.py` | Only `@openai/agents` is read. A project that imports `Agent` from the core package gives no agents |
| A hand-off list held in a variable | `core/sdk_agents.py` | A `handoffs` list that is a variable, or a `handoff(...)` variable imported from another file, is not followed. A `const x = handoff(agent)` in scope, listed in `handoffs`, is |
| Claude subagents in `.claude/agents/*.md` | `core/sdk_agents.py` | Only the keys of `options.agents` in code are read, not subagents defined as files |
| SDK imports through CommonJS `require` | `core/sdk_agents.py` | Only `import` statements are read, so an agent in a file that gets `Agent` with `require("@openai/agents")` is missed. Seen in a `.cjs` integration test of the OpenAI SDK |
| Agents in test files, or outside the code root | `core/sdk_agents.py` | Skipped on purpose. `verify-sdk` lists them under `skipped`: 3 in test files and 1 outside `src/` in the official examples |

## Screen walks

The walks that drive `ui/dev` name private projects, so they stay out of git, in `.local/walks/`.
Its README says how to run them. Bringing them in needs public fixtures in place of those
projects, and a `playwright-core` that isn't tied to one machine. Until then, the stand-in host
in `ui/dev` is the only part of them in this repo.
