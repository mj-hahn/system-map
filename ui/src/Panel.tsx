import { Btn, ContentSkeleton } from '@kirocrew/app-sdk/ui'
import { useState } from 'react'
import { useProjectMenu } from './ProjectMenu'
import { countOf, statusOf, statusView } from './projects'
import type { Project } from './projects'
import { useActiveRepo, useLive, useNode, useOverview } from './model'
import type { WorktreeState } from './model'
import { tablesAtWork } from './overlay'
import { ThemeScope } from './Theme'
import { MUTED, NodeDetail, SeverityBadge, TableList } from './parts'

const CHECK_EVERY_MS = 30000
const NOTE = { padding: 12, fontSize: 13 }

function PanelBody({
  repo,
  projects,
  choose,
  reload,
}: {
  repo: string
  projects: Project[]
  choose: (key: string) => void
  reload: () => Promise<void>
}) {
  const { overview, error } = useOverview(repo)
  const [selected, setSelected] = useState<string | null>(null)
  const node = useNode(selected, repo)
  const worktrees = useLive<WorktreeState>('/worktrees', repo, CHECK_EVERY_MS).value
  const collisions = (worktrees?.overlaps ?? []).filter((row) => row.severity === 'high' || row.severity === 'medium')
  const fresh = overview?.freshness
  const status = fresh ? statusView(statusOf(fresh), fresh.commits_behind, fresh.ref) : null
  const projectMenu = useProjectMenu({ projects, activeKey: repo, compact: true, onPick: choose, onReload: () => void reload() })

  return (
    <div style={{ padding: 12, height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {projectMenu.menu}
      {projectMenu.dialogs}
      {error && !overview && <p style={{ fontSize: 13 }}>{error}</p>}
      {!overview && !error && <ContentSkeleton rows={6} />}
      {overview && (
        <>
          <p style={{ ...MUTED, fontSize: 13, margin: '4px 0 8px' }} data-testid="panel-summary">
            {countOf(overview.tables.length, 'table')}
            {overview.manifest.commit ? ` at ${overview.manifest.commit.slice(0, 7)}` : ''}. {status?.label}
          </p>
          {collisions.map((row) => (
            <p
              key={`${row.a}|${row.b}`}
              data-testid="panel-collision"
              style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 13, margin: '0 0 8px', overflowWrap: 'anywhere' }}
            >
              <SeverityBadge severity={row.severity} />
              <span>{row.summary}</span>
            </p>
          ))}
          {node ? (
            <div style={{ overflowY: 'auto', minHeight: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Btn onClick={() => setSelected(null)}>Back</Btn>
                <span style={{ fontWeight: 600 }}>{node.name}</span>
              </div>
              <NodeDetail node={node} />
            </div>
          ) : (
            <TableList tables={overview.tables} selected={selected} working={tablesAtWork(worktrees)} onSelect={setSelected} />
          )}
        </>
      )}
    </div>
  )
}

/** The chat side-panel tab: the same model as the page, in one narrow column. */
export default function SystemMapPanel() {
  return (
    <ThemeScope style={{ height: '100%' }}>
      <PanelContent />
    </ThemeScope>
  )
}

function PanelContent() {
  const { active, loaded, repos, choose, reload } = useActiveRepo()

  if (!loaded) return <ContentSkeleton rows={6} />
  if (!active) return <p style={NOTE}>No projects yet. Open System Map from Apps to add one.</p>
  return <PanelBody key={active} repo={active} projects={repos} choose={choose} reload={reload} />
}
