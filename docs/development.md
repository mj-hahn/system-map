# Development

How System Map is built, how to check it, and how to hold each reader to the tool that owns the
facts. Run every command from the repo root. For what the app does and how to install it, see the
[README](../README.md).

| Path | Job |
|---|---|
| `core/` | The model and extractors. Imports nothing from Kiro Crew. |
| `core/extractors/` | One module per stack. Each reads a repo into Facts. |
| `mcp_server/` | Tools that agents use. Stdlib only. |
| `backend/` | HTTP API for the dashboard pages. Stdlib only. |
| `ui/` | The app page and the chat side panel tab. |
| `skills/system-map/` | How agents should read and write the model. |
| `scripts/` | Replay migrations and try proposals on a throwaway Postgres, and hold the readers to the compiler and to `drizzle-kit`. |
| `docs/` | Context rules, platform notes and the backlog. |

Host rules learned while building it are in [platform-notes.md](platform-notes.md), and what's left
is in [backlog.md](backlog.md). Releases are in [CHANGELOG.md](../CHANGELOG.md). How to claim an
issue and open a pull request is in [CONTRIBUTING.md](../CONTRIBUTING.md).

## Checks

```bash
python3 -m unittest discover -s tests
python3 tests/strict.py
(cd ui && npm test && npm run typecheck && npm run build)
```

`tests/strict.py` runs the same tests but fails on any skip, and prints each skipped test with its
reason. CI runs every PR against the oldest supported and the newest Kiro Crew.

The replay test needs Postgres server binaries. Set `PGBIN` if they are not in
`/usr/lib/postgresql/16/bin`. The compiler test needs `npm install` in `ui`. The host contract tests
need an installed Kiro Crew, found through the `kirocrew` launcher or `KIROCREW_PYTHON`. Each skips
itself when its tool is missing.

## Run the page without Kiro Crew

`ui/dev` stands in for the host, so you can see and screenshot the page on its own:

```bash
SYSTEM_MAP_DATA=/tmp/model python3 -m core build <repo>
SYSTEM_MAP_DATA=/tmp/model PORT=9191 SYSTEM_MAP_UNSIGNED=1 python3 backend/server.py &
(cd ui && npm run dev)
```

Open <http://127.0.0.1:5199>. Add `?theme=dark` or `?view=panel`.

The backend refuses any call the gateway didn't sign, except `/health`. `ui/dev` can't sign, so
`SYSTEM_MAP_UNSIGNED=1` lets it in. A backend that Kiro Crew starts ignores that flag.

## Prove a model against real Postgres

Replay a repo's migrations on a throwaway server, then compare it with the model:

```bash
scripts/replay_catalog.sh <repo> origin/main supabase/migrations /tmp/replay [bootstrap.sql]
python3 -m core build <repo>
python3 -m core verify <repo> /tmp/replay/catalog.json
```

`bootstrap.sql` is a repo path for anything the migrations expect to exist, such as a stub of
Supabase's `auth` schema. The server listens on a socket only, and stops when the script ends.

## Prove a SQLite model

Load the schema into a separate real SQLite, then compare every table with its pragmas:

```bash
python3 -m core verify-sqlite <repo>
```

## Prove a Drizzle model

Have the tool write its SQL in a copy of the project, then compare that with the reader. Use
`generate`, because `export` ignores `casing`:

```bash
(cd <copy> && npx drizzle-kit generate --name proof)
python3 -m core verify-drizzle <repo> <copy>/drizzle/0000_proof.sql
```

To try every form the reader knows against the real tool, give the sweep any `node_modules` with
`drizzle-kit` and `drizzle-orm` installed. The same seed gives the same schemas:

```bash
scripts/sweep_drizzle.py <node_modules> /tmp/sweep [rounds] [tables] [seed]
```

## Prove routes against Next.js

Run `next build` in a copy of the app, then compare the routes Next wrote down:

```bash
python3 -m core verify-routes <repo> <copy>/.next/app-path-routes-manifest.json <copy>/.next/server/pages-manifest.json
```

## Prove a model against the TypeScript compiler

Ask the real compiler what a checkout imports and which tables it calls, then compare. This also
checks routes against TanStack's generated route tree:

```bash
node scripts/ts_truth.mjs <checkout> /tmp/truth.json
python3 -m core verify-code <repo> /tmp/truth.json
```

## Prove the SDK agent readers

Ask the real compiler which agents a project declares with an agent SDK, then compare. Install
the SDKs the project uses, and TypeScript, in a scratch folder above or beside it, so its
`node_modules` resolve:

```bash
node scripts/sdk_truth.mjs <project> > truth.json
python3 -m core verify-sdk <project> truth.json
```

An agent the compiler finds in a test file, or outside the code root, is listed under `skipped`
and is not a difference. Any other difference exits non-zero.

## Prove risk against real tools

Compare each number with the tool that owns it: paths with the compiler, commits with git's log,
and coverage with the test runner's own summary:

```bash
python3 -m core coverage <repo> <report> [commit]
python3 -m core verify-risk <repo> /tmp/truth.json <coverage-summary.json>
```

Paths are counted from text, so screen copy can fool them a little. They must stay within 0.5% of
the compiler.

## Prove limits against real Postgres

The rules that say what Postgres will refuse are a floor. When one says refused, Postgres refuses.
When they stay silent, Postgres may still refuse for a reason the model does not hold, such as a
function that takes a table's row.

Run one proposal on a throwaway server, with one file of changes as JSON:

```bash
python3 -m core proposal-sql changes.json /tmp/changes
scripts/try_proposal.sh <repo> origin/main supabase/migrations /tmp/try /tmp/changes [bootstrap.sql]
python3 -m core verify-proposal <repo> changes.json /tmp/try/results.json
```

Or hold every rule to a whole schema. This tries a drop, three new types and both null rules on
every column, and a drop on every table. It fails only if a rule says refused and Postgres accepts:

```bash
scripts/sweep_limits.py <repo> origin/main supabase/migrations /tmp/sweep [bootstrap.sql]
```
