import { ChatEmbed, useAppApi } from '@kirocrew/app-sdk'
import { Btn, Card, CardTitle, ContentSkeleton, EmptyState, Input, PageHeader, SegmentedControl } from '@kirocrew/app-sdk/ui'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { AddProject } from './AddProject'
import { AgentsView } from './Agents'
import { FIND_AGENTS_MESSAGE, showAgentOnLayer, toggleAgentsLayer } from './agentRows'
import type { DraftError, LayerFocus } from './agentRows'
import './chrome'
import { Erd } from './Erd'
import type { Density } from './Erd'
import { plainError } from './errors'
import { ExploreView } from './Explore'
import type { Tab } from './Explore'
import { Findings } from './Findings'
import { columnsFor, SHOW_CHAT, SHOW_LIST } from './fit'
import { Inspector } from './Inspector'
import { Layers, Showing } from './Layers'
import { PlanBoard, PlanHint } from './Plan'
import { useProjectMenu } from './ProjectMenu'
import {
  chatSlotName,
  hasSideList,
  readChatStarted,
  readListOpen,
  readView,
  slotHasMessages,
  statusOf,
  statusView,
  writeChatStarted,
  writeListOpen,
  writeView,
} from './projects'
import type { BuildRead, Project, View } from './projects'
import { RiskView } from './Risk'
import { StatusChip } from './StatusChip'
import { SystemMap } from './SystemMap'
import { TAB_PANEL_ID, Tabs } from './Tabs'
import { ThemePicker, ThemeScope } from './Theme'
import type { TabItem } from './Tabs'
import { WorktreesView } from './Worktrees'
import { BASE, useActiveRepo, useLive, useNode, useOverview, useProposal, useVersioned } from './model'
import type { AgentDraftState, AgentRow, AgentSettings, AgentState, ExploreData, Finding, Graph, NodeInfo, Overlap, Plan, PlanStatus, Proposal, ProposalRow, Risk, SavedView, SystemGraph, WorktreeState } from './model'
import { graphOnly, overlapsOn, tablesAtWork, withProposal } from './overlay'
import { MUTED, SystemTree, TableList } from './parts'

const GAP = 12
const CHECK_WORKTREES_MS = 20000
const CHECK_EXPLORE_MS = 8000
/** A draft the Design chat saves shows up within this long. */
const CHECK_AGENT_DRAFT_MS = 8000
const RESULT_MS = 4000
const DENSITIES: { key: Density; label: string }[] = [
  { key: 'names', label: 'Names' },
  { key: 'keys', label: 'Keys' },
  { key: 'columns', label: 'Columns' },
]
const COLUMN: CSSProperties = { display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0, overflow: 'hidden', padding: 12 }

const VIEW_TABS: { value: View; label: string; counts?: string }[] = [
  { value: 'map', label: 'Map' },
  { value: 'data', label: 'Data model' },
  { value: 'plan', label: 'Plan', counts: 'unfinished plans' },
  { value: 'risk', label: 'Risk', counts: 'hot and untested modules' },
  { value: 'worktrees', label: 'Worktrees', counts: 'worktree collisions' },
  { value: 'findings', label: 'Findings', counts: 'findings' },
  { value: 'agents', label: 'Agents', counts: 'agents' },
  { value: 'explore', label: 'Explore', counts: 'draft proposals' },
]

/**
 * This project's own chat, pointed at its folder. Every open chat sits in the person's session
 * list, so it opens on its first message, or on load once it has been used.
 */
function useDesignSlot(repo: string | null, repoKey: string) {
  const api = useAppApi()
  const [opened, setOpened] = useState<{ repoKey: string; slot: string } | null>(null)
  const [unused, setUnused] = useState<string | null>(null)
  const [opening, setOpening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const slot = opened?.repoKey === repoKey ? opened.slot : null

  const open = useCallback(async () => {
    const created = await api.post<{ key: string }>('/api/chat/slots', { name: chatSlotName(repoKey) })
    await api.post(`/api/chat/slots/${encodeURIComponent(created.key)}/project`, { project: repo })
    setOpened({ repoKey, slot: created.key })
    return created.key
  }, [api, repo, repoKey])

  useEffect(() => {
    if (!repo) return
    let live = true
    setError(null)
    const used = async () => {
      if (readChatStarted(localStorage, repoKey)) return true
      // A chat used from another browser counts too. A refusal just means none to reopen.
      return slotHasMessages(await api.get<unknown>('/api/chat/slots').catch(() => []), repoKey)
    }
    used()
      .then(async (found) => {
        if (!live) return
        if (found) await open()
        else setUnused(repoKey)
      })
      .catch((caught: unknown) => {
        if (live) setError(plainError(caught, 'open the design chat'))
      })
    return () => {
      live = false
    }
  }, [api, open, repo, repoKey])

  const send = useCallback(
    (message: string) => {
      setOpening(true)
      setError(null)
      const deliver = async () => {
        const target = slot ?? (await open())
        writeChatStarted(localStorage, repoKey)
        await api.post('/api/chat?ws=1', { message, slot: target, agent: '' })
      }
      deliver()
        .catch((caught: unknown) => setError(plainError(caught, 'send that to the design chat')))
        .finally(() => setOpening(false))
    },
    [api, open, repoKey, slot],
  )

  return { slot, error, send, opening, canAsk: repo !== null, startable: unused === repoKey && slot === null }
}

/** The chat's box before the chat exists. Typed text stays if the send fails. */
function ChatStarter({ disabled, onSend }: { disabled: boolean; onSend: (message: string) => void }) {
  const [text, setText] = useState('')
  return (
    <form
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}
      onSubmit={(event) => {
        event.preventDefault()
        if (text.trim()) onSend(text.trim())
      }}
    >
      <Input
        aria-label="Ask about the system"
        placeholder="Ask about the system"
        value={text}
        disabled={disabled}
        onChange={(event) => setText(event.target.value)}
        style={{ width: '100%', boxSizing: 'border-box' }}
      />
    </form>
  )
}

/** Fill the window below this element, whatever the host page around it does. */
function useFillHeight() {
  const ref = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | undefined>(undefined)
  const [width, setWidth] = useState(1400)

  useLayoutEffect(() => {
    const measure = () => {
      const box = ref.current?.getBoundingClientRect()
      setHeight(Math.max(420, window.innerHeight - (box?.top ?? 0) - 16))
      if (box) setWidth(box.width)
    }
    measure()
    const watcher = new ResizeObserver(measure)
    if (ref.current) watcher.observe(ref.current)
    window.addEventListener('resize', measure)
    return () => {
      watcher.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  return { ref, height, width }
}

function Notice({ children, onDismiss }: { children: ReactNode; onDismiss?: () => void }) {
  return (
    <div className="sm-notice" role="alert" data-testid="notice">
      <span style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{children}</span>
      {onDismiss && <Btn onClick={onDismiss}>Dismiss</Btn>}
    </div>
  )
}

/** Says why the data model is empty, so it never reads as a broken page. */
function NoTables({ read }: { read?: BuildRead }) {
  const unread = read?.unread ?? []
  return (
    <EmptyState
      testId="no-tables"
      icon={<Mark />}
      title="No tables found"
      subtitle="System Map reads Postgres migrations and SQLite schemas, from .sql files or from code."
      action={
        unread.length > 0 && (
          <div style={{ ...MUTED, fontSize: 13, textAlign: 'center' }}>
            {unread.map((item) => (
              <div key={item.what}>
                Found, but not read: {item.what}
                {item.where ? ` (${item.where})` : ''}
              </div>
            ))}
          </div>
        )
      }
    />
  )
}

function Mark() {
  return (
    <svg width="40" height="40" viewBox="0 0 64 64" fill="currentColor" aria-hidden="true">
      <rect x="10" y="10" width="44" height="12" rx="3" />
      <rect x="10" y="26" width="20" height="12" rx="3" />
      <rect x="34" y="26" width="20" height="12" rx="3" />
      <rect x="10" y="42" width="12" height="12" rx="3" />
      <rect x="26" y="42" width="12" height="12" rx="3" />
      <rect x="42" y="42" width="12" height="12" rx="3" />
    </svg>
  )
}

function FirstRun({ onBuilt }: { onBuilt: (key: string) => void }) {
  const [adding, setAdding] = useState(false)
  return (
    <>
      <PageHeader title="System Map" actions={<ThemePicker />} />
      <div className="sm-page">
        <EmptyState
          testId="first-run"
          icon={<Mark />}
          title="See your system in one place"
          subtitle="Add a project to map its code, data model, risk and plans."
          action={
            <Btn primary onClick={() => setAdding(true)}>
              Add project
            </Btn>
          }
        />
      </div>
      <AddProject open={adding} projects={[]} onClose={() => setAdding(false)} onBuilt={onBuilt} />
    </>
  )
}

export default function SystemMapApp() {
  return (
    <ThemeScope style={{ minHeight: '100%' }}>
      <SystemMapPage />
    </ThemeScope>
  )
}

function SystemMapPage() {
  const { repos, active, loaded, choose, reload } = useActiveRepo()

  if (!loaded) {
    return (
      <>
        <PageHeader title="System Map" actions={<ThemePicker />} />
        <div className="sm-page">
          <ContentSkeleton rows={6} />
        </div>
      </>
    )
  }
  if (!active) return <FirstRun onBuilt={choose} />
  // Everything held on the page belongs to one project, so a new project starts clean.
  return <ProjectPage key={active} repo={active} projects={repos} choose={choose} reload={reload} />
}

function ProjectPage({
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
  const api = useAppApi()
  const { overview, error, refresh } = useOverview(repo)
  const version = overview?.manifest.version
  const [tick, setTick] = useState(0)
  const stamp = version ? `${version}:${tick}` : undefined
  const graphLoad = useVersioned<Graph>('/graph', repo, stamp)
  const systemLoad = useVersioned<SystemGraph>('/system', repo, stamp)
  const planLoad = useVersioned<{ plans: Plan[] }>('/plan', repo, stamp)
  const findingLoad = useVersioned<{ findings: Finding[] }>('/findings', repo, stamp)
  const riskLoad = useVersioned<Risk>('/risk', repo, stamp)
  // A region tag changes no version, so saving one moves the tick, as everything else here does.
  const agentLoad = useVersioned<AgentState>('/agents', repo, stamp)
  const agentState = agentLoad.value
  const hasAgents = (agentState?.agents.length ?? 0) > 0
  const graph = graphLoad.value
  const system = systemLoad.value
  const planList = planLoad.value
  const findingList = findingLoad.value
  const risk = riskLoad.value
  const plans = useMemo(() => planList?.plans ?? [], [planList])
  const findings = useMemo(() => findingList?.findings ?? [], [findingList])
  const live = useLive<WorktreeState>('/worktrees', repo, CHECK_WORKTREES_MS)
  const worktrees = live.value
  const explore = useLive<ExploreData>('/explore', repo, CHECK_EXPLORE_MS)
  const agentDraft = useLive<AgentDraftState>('/agents/draft', repo, CHECK_AGENT_DRAFT_MS)
  const [tab, setTab] = useState<Tab>('whatif')
  const [openProposal, setOpenProposal] = useState<string | null>(null)
  const [proposalTick, setProposalTick] = useState(0)
  const proposal = useProposal(openProposal, repo, proposalTick)
  const [drawn, setDrawn] = useState(false)
  const [savedView, setSavedView] = useState<SavedView | null>(null)
  const [view, setViewState] = useState<View>(() => readView(localStorage, repo))
  const [selected, setSelected] = useState<string | null>(null)
  const [focus, setFocus] = useState<string | null>(null)
  const [showPlans, setShowPlans] = useState(true)
  const [showRisk, setShowRisk] = useState(false)
  const [showWork, setShowWork] = useState(true)
  const [showAgents, setShowAgents] = useState(false)
  /** Where the map was when the Agents layer went on. */
  const beforeAgents = useRef<string | null>(null)
  const [savingAgents, setSavingAgents] = useState(false)
  const [agentError, setAgentError] = useState<string | null>(null)
  const [draftError, setDraftError] = useState<DraftError | null>(null)
  const [coverageError, setCoverageError] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  const [density, setDensity] = useState<Density>('names')
  const [listOpen, setListOpen] = useState(() => readListOpen(localStorage))
  const listToggle = useRef<HTMLButtonElement>(null)
  const listToggled = useRef(false)
  const [rebuilding, setRebuilding] = useState(false)
  const [rebuilt, setRebuilt] = useState<string | null>(null)
  const { ref, height, width } = useFillHeight()
  const missing = overview?.freshness.missing === true
  const chat = useDesignSlot(overview && !missing ? overview.manifest.repo : null, repo)

  const setView = useCallback(
    (next: View) => {
      writeView(localStorage, repo, next)
      setViewState(next)
    },
    [repo],
  )

  // The button you pressed is gone, so keyboard focus moves to the one that replaced it.
  useEffect(() => {
    if (listToggled.current) listToggle.current?.focus()
    listToggled.current = false
  }, [listOpen])

  useEffect(() => {
    if (!rebuilt) return
    const timer = window.setTimeout(() => setRebuilt(null), RESULT_MS)
    return () => window.clearTimeout(timer)
  }, [rebuilt])

  // The map inspects a single thing, not a whole area or group.
  const picked = view === 'map' ? (focus && !/^(area|group):/.test(focus) ? focus : null) : view === 'data' ? selected : null
  // A proposed part doesn't exist yet, so there is nothing to look up.
  const inspected = drawn && proposal?.diff.added.some((row) => row.id === picked) ? null : picked
  const node = useNode<NodeInfo>(inspected, repo, stamp)

  const flagged = useMemo(() => {
    const counts = new Map<string, number>()
    for (const finding of findings) {
      if (finding.severity !== 'info') counts.set(finding.node, (counts.get(finding.node) ?? 0) + 1)
    }
    return counts
  }, [findings])

  const atWork = useMemo(() => tablesAtWork(worktrees), [worktrees])
  const unbuilt = plans.filter((plan) => plan.status === 'planned' || plan.status === 'partial').length
  const collisions = (worktrees?.counts.high ?? 0) + (worktrees?.counts.medium ?? 0)
  const hotUntested = risk?.modules.filter((row) => row.hot && row.untested).length ?? 0
  const drafts = explore.value?.proposals.filter((row) => row.status === 'draft').length ?? 0
  const viewCounts: Partial<Record<View, number>> = { findings: findings.length, plan: unbuilt, risk: hotUntested, worktrees: collisions, explore: drafts, agents: agentState?.agents.length }
  const overlaid: Proposal | null = drawn ? proposal : null
  const shownSystem = useMemo(() => (system ? withProposal(system, overlaid) : null), [system, overlaid])
  const shownGraph = useMemo(() => {
    const base = overlaid?.graph ?? graph
    return base && savedView?.level === 'data' ? graphOnly(base, savedView.resolved) : base
  }, [graph, overlaid, savedView])

  const rebuild = async () => {
    setRebuilding(true)
    setRebuilt(null)
    setFailure(null)
    try {
      const reply = await api.post<{ unchanged?: boolean }>(`${BASE}/build`, { repo })
      await refresh()
      await reload()
      setRebuilt(reply.unchanged ? 'No changes' : 'Rebuilt')
    } catch (caught) {
      setFailure(plainError(caught, 'rebuild this project'))
    } finally {
      setRebuilding(false)
    }
  }

  /** Run a change, and say so plainly if it fails. */
  const attempt = async (doing: string, change: () => Promise<unknown>) => {
    setFailure(null)
    try {
      await change()
    } catch (caught) {
      setFailure(plainError(caught, doing))
    }
  }

  const askNode = () => {
    if (node) chat.send(`Use the system-map tools. Look at ${node.id} and tell me what to watch out for.`)
  }
  const askFinding = (finding: Finding) => {
    chat.send(`Use the system-map tools. Check finding ${finding.id} on ${finding.node}, read its evidence, and propose a fix.`)
  }
  const askPlan = (plan: Plan) => {
    chat.send(`Use the system-map tools. Look at ${plan.id}, say what is left to build, and propose the next step.`)
  }
  const askRisk = (id: string) => {
    chat.send(`Use the system-map tools. Look at ${id} and its risk. Say what is most likely to break, and which tests would help most.`)
  }
  const askAgent = (row: AgentRow) => {
    chat.send(`Use the system-map tools. Read ${row.id} with the \`agents\` tool. Say what it does on its own, where it waits for a person, and what to watch out for.`)
  }
  const askOverlap = (row: Overlap) => {
    chat.send(`Use the system-map tools. Worktrees ${row.a} and ${row.b} overlap. Check \`worktrees\`, say what will collide, and how to avoid it.`)
  }
  const runCoverage = () => {
    chat.send("Run this repo's tests with coverage, in a scratch copy so the repo does not change. Then load the report with the system-map `coverage` tool, giving the commit it ran on.")
  }
  const loadCoverage = async () => {
    setCoverageError(null)
    try {
      await api.post(`${BASE}/coverage`, { repo })
      setTick((value) => value + 1)
    } catch (caught) {
      setCoverageError(plainError(caught, 'load the coverage report'))
    }
  }
  const drawProposal = (level: 'map' | 'data') => {
    setDrawn(true)
    setSavedView(null)
    setFocus(null)
    // In a diagram of every table, one new table is too small to read, so open on it.
    const first = [...(proposal?.diff.added ?? []), ...(proposal?.diff.changed ?? [])].find((row) => row.id.startsWith('table:'))
    setSelected(level === 'data' ? (first?.id ?? null) : null)
    setView(level)
  }
  const setProposalStatus = (id: string, status: ProposalRow['status']) =>
    attempt('change this proposal', async () => {
      await api.post(`${BASE}/proposal-status`, { repo, id, status })
      setProposalTick((value) => value + 1)
      await explore.refresh()
    })
  const deleteIntent = (kind: 'proposals' | 'use_cases' | 'views', id: string) =>
    attempt('delete this', async () => {
      await api.post(`${BASE}/intent-delete`, { repo, kind, id })
      if (kind === 'proposals') {
        setOpenProposal(null)
        setDrawn(false)
      }
      await explore.refresh()
    })
  const openSavedView = (saved: SavedView) => {
    // A saved view draws only what it names, so the Agents layer goes off and forgets where it was.
    // App wiring has no test here: the backlog lists it for a check by Sync.
    applyLayer({ on: false, focus: null, before: null })
    setSavedView(saved)
    setShowRisk(saved.overlays.risk)
    setShowWork(saved.overlays.worktrees)
    setShowPlans(saved.overlays.plans)
    setOpenProposal(saved.proposal)
    setDrawn(saved.proposal !== null)
    setFocus(null)
    setSelected(null)
    setView(saved.level)
  }
  const clearOverlays = () => {
    setDrawn(false)
    setSavedView(null)
    // What was selected may have been proposed, and today it doesn't exist.
    setSelected(null)
    setFocus(null)
  }
  const setPlanStatus = (id: string, status: PlanStatus | null) =>
    attempt('change this plan', async () => {
      await api.post(`${BASE}/plan-status`, { repo, id, status })
      setTick((value) => value + 1)
    })
  /** Saving rebuilds, so the new version reloads every view. The tick covers a change that needs none. */
  const saveAgentSettings = async (settings: AgentSettings): Promise<boolean> => {
    setSavingAgents(true)
    setAgentError(null)
    try {
      await api.post(`${BASE}/agents/settings`, { repo, settings })
      await refresh()
      setTick((value) => value + 1)
      // A draft's changed marks compare it with the saved settings, so read it again now.
      await agentDraft.refresh()
      return true
    } catch (caught) {
      setAgentError(plainError(caught, 'save the agent settings'))
      return false
    } finally {
      setSavingAgents(false)
    }
  }
  /** Use the Design chat's draft, which saves and rebuilds as the form does, or drop it. */
  const actOnDraft = async (action: 'use' | 'drop', id: string): Promise<boolean> => {
    setSavingAgents(true)
    setDraftError(null)
    let failed: string | null = null
    try {
      await api.post(`${BASE}/agents/draft`, { repo, action, id })
      if (action === 'use') {
        await refresh()
        setTick((value) => value + 1)
      }
      return true
    } catch (caught) {
      failed = plainError(caught, action === 'use' ? 'use the draft' : 'drop the draft')
      return false
    } finally {
      setSavingAgents(false)
      const now = await agentDraft.refresh()
      // The error belongs to the draft now on screen: the same one, or the newer one it was refused for.
      if (failed) setDraftError({ id: now?.draft?.id ?? null, text: failed })
    }
  }
  /** A region changes no version, so the tick reloads the map, the agents, the findings and the inspector. */
  const saveRegion = async (id: string, region: string | null): Promise<string | null> => {
    try {
      await api.post(`${BASE}/regions`, { repo, id, region })
      setTick((value) => value + 1)
      return null
    } catch (caught) {
      return plainError(caught, 'save the region')
    }
  }

  const showTable = (id: string) => {
    setView('data')
    setSelected(id)
  }
  const showOnMap = (id: string) => {
    setView('map')
    setFocus(id)
  }
  const applyLayer = (next: LayerFocus) => {
    setShowAgents(next.on)
    setFocus(next.focus)
    beforeAgents.current = next.before
  }
  /** An agent lives on the Agents layer, so showing one turns the layer on. */
  const showAgent = (id: string) => {
    setSavedView(null)
    setView('map')
    applyLayer(showAgentOnLayer({ on: showAgents, focus, before: beforeAgents.current }, id, view === 'map'))
  }
  /** Turning the layer off goes back to where you were before it was on. */
  const toggleAgents = () => {
    const next = toggleAgentsLayer({ on: showAgents, focus, before: beforeAgents.current })
    if (next.closeSavedView) setSavedView(null)
    applyLayer(next)
  }
  /** From the inspector, stay on the view you are on where you can. */
  const openLink = (id: string) => {
    if (view === 'data' && id.startsWith('table:')) setSelected(id)
    else showOnMap(id)
  }
  /** From a list, a table opens in the data model and anything else on the map. */
  const openNode = (id: string) => {
    if (id.startsWith('table:')) showTable(id)
    else showOnMap(id)
  }

  const toggleList = () => {
    listToggled.current = true
    writeListOpen(localStorage, !listOpen)
    setListOpen(!listOpen)
  }

  const listed = hasSideList(view)
  const listShown = listed && listOpen
  const listName = view === 'map' ? 'modules' : 'tables'
  const showList =
    listed && !listOpen && width >= SHOW_LIST ? (
      <button ref={listToggle} type="button" className="sm-plain sm-layers sm-show-list" onClick={toggleList}>
        Show {listName}
      </button>
    ) : null
  const showing = overlaid?.title ?? savedView?.title
  const banner = showing ? <Showing title={showing} onBack={clearOverlays} /> : null
  // A zero says nothing, so it doesn't earn a badge.
  const tabs: TabItem<View>[] = VIEW_TABS.map((item) => ({ ...item, count: viewCounts[item.value] || undefined }))
  const fresh = overview?.freshness
  const status = fresh ? statusView(statusOf(fresh), fresh.commits_behind, fresh.ref) : null
  const changed = fresh?.changed_inputs?.length ?? 0

  const mapTools = (
    <>
      <div className="sm-tool-row">
        {showList}
        <Layers
          layers={[
            PlanHint(unbuilt, showPlans, () => setShowPlans((value) => !value)),
            { key: 'risk', label: 'Risk', on: showRisk, title: 'Mark hot and untested code on the map', onToggle: () => setShowRisk((value) => !value) },
            { key: 'work', label: 'Worktrees', on: showWork, title: 'Show what each worktree is changing', onToggle: () => setShowWork((value) => !value) },
            {
              key: 'agents',
              label: 'Agents',
              on: showAgents && hasAgents,
              disabled: !hasAgents,
              title: hasAgents ? 'Show the agents: what starts each one, who it hands work to, and the models it uses' : 'No agents yet. Point System Map at them in the Agents tab.',
              onToggle: toggleAgents,
            },
          ]}
        />
      </div>
      {banner}
    </>
  )
  const dataTools = (
    <>
      <div className="sm-tool-row">
        {showList}
        <SegmentedControl
          ariaLabel="How much of each table to show"
          layoutId="system-map-density"
          collapse={false}
          segments={DENSITIES}
          value={density}
          onChange={(key) => setDensity(key as Density)}
        />
      </div>
      {banner}
    </>
  )

  const ready: Record<View, boolean> = {
    map: shownSystem !== null,
    data: Boolean(shownGraph),
    plan: planList !== null,
    risk: risk !== null,
    worktrees: worktrees !== null,
    findings: findingList !== null,
    agents: agentState !== null,
    explore: explore.value !== null,
  }
  const stuck: Record<View, boolean> = {
    map: systemLoad.failed,
    data: graphLoad.failed,
    plan: planLoad.failed,
    risk: riskLoad.failed,
    worktrees: live.failed,
    findings: findingLoad.failed,
    agents: agentLoad.failed,
    explore: explore.failed,
  }
  const retryView = () => {
    setTick((value) => value + 1)
    void live.refresh()
    void explore.refresh()
  }

  const projectMenu = useProjectMenu({ projects, activeKey: repo, onPick: choose, onReload: () => void reload() })

  const title = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0, maxWidth: '100%' }}>
      <span style={{ whiteSpace: 'nowrap' }}>System Map</span>
      <span aria-hidden="true" style={{ ...MUTED, fontWeight: 400 }}>
        /
      </span>
      {projectMenu.menu}
    </span>
  )

  return (
    <>
      {projectMenu.dialogs}
      <PageHeader
        title={title}
        actions={
          <>
            <ThemePicker />
            {overview && status && (
              <StatusChip
                status={status}
                detail={fresh?.stale ? `${changed} schema ${changed === 1 ? 'file' : 'files'} changed on ${fresh.ref}` : undefined}
                commit={overview.manifest.commit}
                builtAt={overview.manifest.built_at}
                read={overview.manifest.read}
                setAside={overview.set_aside}
                busy={rebuilding}
                result={rebuilt}
                onRebuild={() => void rebuild()}
              />
            )}
          </>
        }
      />
      <div ref={ref} className="sm-page" style={{ height, display: 'flex', flexDirection: 'column', gap: GAP, minHeight: 0 }}>
        {error && !overview && (
          <Notice>
            {error} <Btn onClick={() => void refresh()}>Try again</Btn>
          </Notice>
        )}
        {!overview && !error && <ContentSkeleton rows={6} />}
        {failure && <Notice onDismiss={() => setFailure(null)}>{failure}</Notice>}
        {missing && overview && (
          <Notice>
            The folder for this project is gone: <span className="sm-mono">{overview.manifest.repo}</span>. You can still read the last model. To go on, move the folder back, or
            remove the project from the project menu.
          </Notice>
        )}
        {overview && (
          <>
            <Tabs items={tabs} value={view} onChange={setView} label="System Map views" />
            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: 'grid',
                gap: GAP,
                gridTemplateColumns: columnsFor(width, listShown),
                gridTemplateRows: 'minmax(0, 1fr)',
              }}
            >
              {listShown && width >= SHOW_LIST && (
                <Card style={COLUMN} data-testid="side-list">
                  <div className="sm-list-head">
                    <CardTitle>{view === 'map' ? 'Modules' : 'Tables'}</CardTitle>
                    <button ref={listToggle} type="button" className="sm-plain sm-hide-list" aria-label={`Hide ${listName}`} onClick={toggleList}>
                      Hide
                    </button>
                  </div>
                  {view === 'map' ? (
                    <SystemTree nodes={system?.nodes ?? []} focus={focus} onSelect={showOnMap} />
                  ) : (
                    <TableList tables={overview.tables} selected={selected} flagged={flagged} working={atWork} onSelect={showTable} />
                  )}
                </Card>
              )}
              <Card
                style={{ ...COLUMN, padding: 0, position: 'relative' }}
                data-testid="canvas"
                id={TAB_PANEL_ID}
                role="tabpanel"
                aria-labelledby={`system-map-tab-${view}`}
              >
                {!ready[view] && !stuck[view] && <ContentSkeleton rows={6} />}
                {!ready[view] && stuck[view] && (
                  <div style={{ padding: 12 }}>
                    <Notice>
                      Couldn't load this view. <Btn onClick={retryView}>Try again</Btn>
                    </Notice>
                  </div>
                )}
                {view === 'map' && shownSystem && (
                  <SystemMap
                    system={shownSystem}
                    focus={focus}
                    tables={overview.manifest.counts.tables}
                    showPlans={showPlans}
                    inspecting={inspected !== null}
                    risk={showRisk ? risk : null}
                    worktrees={showWork ? worktrees : null}
                    only={savedView?.level === 'map' ? savedView.resolved : null}
                    layout={savedView?.layout ?? 'left-right'}
                    agents={showAgents && hasAgents}
                    tools={mapTools}
                    onFocus={(id) => {
                      setSavedView(null)
                      setFocus(id)
                    }}
                    onOpenTables={() => setView('data')}
                  />
                )}
                {view === 'data' && overview.tables.length === 0 && !drawn && <NoTables read={overview.manifest.read} />}
                {view === 'data' && shownGraph && (overview.tables.length > 0 || drawn) && (
                  <Erd graph={shownGraph} selected={selected} flagged={flagged} working={atWork} density={density} tools={dataTools} onSelect={setSelected} />
                )}
                {view === 'explore' && explore.value && (
                  <ExploreView
                    data={explore.value}
                    proposal={proposal}
                    shownProposal={drawn ? openProposal : null}
                    canAsk={chat.canAsk}
                    tab={tab}
                    onTab={setTab}
                    onSend={chat.send}
                    onOpenProposal={setOpenProposal}
                    onDrawProposal={drawProposal}
                    onStatus={(id, value) => void setProposalStatus(id, value)}
                    onDelete={(kind, id) => void deleteIntent(kind, id)}
                    onOpenView={openSavedView}
                    onNode={openNode}
                  />
                )}
                {view === 'plan' && planList && <PlanBoard plans={plans} onShow={showOnMap} onAsk={askPlan} onStatus={(id, value) => void setPlanStatus(id, value)} />}
                {view === 'risk' && risk && (
                  <RiskView
                    risk={risk}
                    canAsk={chat.canAsk}
                    error={coverageError}
                    onShow={showOnMap}
                    onAsk={askRisk}
                    onLoad={() => void loadCoverage()}
                    onRun={runCoverage}
                  />
                )}
                {view === 'worktrees' && worktrees && (
                  <WorktreesView state={worktrees} checkedAt={live.checkedAt} canAsk={chat.canAsk} onShow={openNode} onAsk={askOverlap} />
                )}
                {view === 'findings' && findingList && (
                  <Findings
                    findings={findings}
                    noSchema={overview.tables.length === 0}
                    onShow={(id) => (id.startsWith('agent:') ? showAgent(id) : showTable(id))}
                    onAsk={askFinding}
                  />
                )}
                {view === 'agents' && agentState && (
                  <AgentsView
                    state={agentState}
                    draft={agentDraft.value}
                    canAsk={chat.canAsk}
                    saving={savingAgents}
                    error={agentError}
                    draftError={draftError}
                    onShow={showAgent}
                    onAsk={askAgent}
                    onSave={saveAgentSettings}
                    onFind={() => chat.send(FIND_AGENTS_MESSAGE)}
                    onDraft={actOnDraft}
                  />
                )}
                {node && inspected && (
                  <Inspector
                    node={node}
                    work={worktrees?.by_node[inspected] ?? []}
                    overlaps={overlapsOn(inspected, worktrees)}
                    canAsk={chat.canAsk}
                    onAsk={askNode}
                    onAskFinding={askFinding}
                    onOpen={(id) => (id.startsWith('agent:') ? showAgent(id) : openLink(id))}
                    onClose={() => (view === 'data' ? setSelected(null) : setFocus(null))}
                    onRegion={saveRegion}
                  />
                )}
              </Card>
              <Card style={width >= SHOW_CHAT ? COLUMN : { display: 'none' }}>
                <CardTitle>Design chat</CardTitle>
                {chat.error && <p style={{ fontSize: 13 }}>{chat.error}</p>}
                {missing && <p style={{ ...MUTED, fontSize: 13 }}>Chat needs this project's folder.</p>}
                <div style={{ position: 'relative', flex: 1, minHeight: 0 }} data-testid="chat">
                  {chat.slot && (
                    <div style={{ position: 'absolute', inset: 0 }}>
                      <ChatEmbed slotKey={chat.slot} frameless startAtBottom placeholder="Ask about the system" />
                    </div>
                  )}
                  {chat.startable && <ChatStarter disabled={chat.opening} onSend={chat.send} />}
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </>
  )
}
