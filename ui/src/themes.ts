// Themes change System Map's colours. Each sets the host's own colour variables, which every view
// and the host's own controls already read, so nothing else needs to know a theme exists. Light
// or dark follows the host.

export type ThemeId = 'host' | 'blueprint' | 'paper' | 'contrast'
export type Mode = 'light' | 'dark'
type Colours = Record<string, string>

export interface Theme {
  id: ThemeId
  name: string
}

export const DEFAULT_THEME: ThemeId = 'host'

export const THEMES: Theme[] = [
  { id: 'host', name: 'Kiro Crew' },
  { id: 'blueprint', name: 'Blueprint' },
  { id: 'paper', name: 'Paper' },
  { id: 'contrast', name: 'High contrast' },
]

/** What each theme picks. Everything else the host reads is worked out from these. */
interface Palette {
  bg: string
  elevated: string
  hover: string
  card: string
  text: string
  strong: string
  muted: string
  border: string
  borderStrong: string
  accent: string
  accentFg: string
  danger: string
  warn: string
  warnText: string
  ok: string
  info: string
}

const PALETTES: Record<Exclude<ThemeId, 'host'>, Record<Mode, Palette>> = {
  blueprint: {
    light: {
      bg: '#eef3f9', elevated: '#ffffff', hover: '#e1eaf4', card: '#f8fbfe',
      text: '#0f2742', strong: '#071a30', muted: '#455d79', border: '#c9d7e6', borderStrong: '#8aa3be',
      accent: '#1d5fa8', accentFg: '#ffffff',
      danger: '#b42318', warn: '#b54708', warnText: '#8f4405', ok: '#10663e', info: '#1d5fa8',
    },
    dark: {
      bg: '#0c1d33', elevated: '#13294a', hover: '#1a3358', card: '#102440',
      text: '#e6eef8', strong: '#ffffff', muted: '#a3b8d0', border: '#24406a', borderStrong: '#4d6d96',
      accent: '#7dbdff', accentFg: '#06182c',
      danger: '#ff8a80', warn: '#f5b14c', warnText: '#f5b14c', ok: '#5fd39a', info: '#7dbdff',
    },
  },
  paper: {
    light: {
      bg: '#f6f1e7', elevated: '#fffdf8', hover: '#ede5d6', card: '#fffaf0',
      text: '#2b2118', strong: '#1a120b', muted: '#64564a', border: '#e0d5c1', borderStrong: '#a8977d',
      accent: '#9c3d27', accentFg: '#ffffff',
      danger: '#a61b1b', warn: '#a85d00', warnText: '#8a4b00', ok: '#386024', info: '#2f5d7c',
    },
    dark: {
      bg: '#1f1a15', elevated: '#2a231c', hover: '#332a21', card: '#262019',
      text: '#efe6d8', strong: '#fffaf0', muted: '#b8a994', border: '#3e3428', borderStrong: '#6e604e',
      accent: '#eb9a7d', accentFg: '#23120b',
      danger: '#f28b82', warn: '#e3a857', warnText: '#e3a857', ok: '#9cc47e', info: '#8fb8d6',
    },
  },
  contrast: {
    light: {
      bg: '#ffffff', elevated: '#ffffff', hover: '#ececec', card: '#ffffff',
      text: '#000000', strong: '#000000', muted: '#333333', border: '#595959', borderStrong: '#000000',
      accent: '#0040c1', accentFg: '#ffffff',
      danger: '#b00000', warn: '#8a4500', warnText: '#7a3d00', ok: '#005a1f', info: '#0040c1',
    },
    dark: {
      bg: '#000000', elevated: '#0d0d0d', hover: '#1f1f1f', card: '#000000',
      text: '#ffffff', strong: '#ffffff', muted: '#d0d0d0', border: '#a6a6a6', borderStrong: '#ffffff',
      accent: '#ffd60a', accentFg: '#000000',
      danger: '#ff6b6b', warn: '#ffb020', warnText: '#ffb020', ok: '#4ade80', info: '#7cc4ff',
    },
  },
}

function channels(hex: string): [number, number, number] {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error(`A palette colour must be #rrggbb, not ${hex}`)
  return [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16)) as [number, number, number]
}

/** A #rrggbb colour at some opacity. */
export function tint(hex: string, alpha: number): string {
  const [r, g, b] = channels(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** `hex` moved part of the way toward `toward`, as #rrggbb. */
function mix(hex: string, toward: string, amount: number): string {
  const end = channels(toward)
  return `#${channels(hex)
    .map((channel, at) => Math.round(channel + (end[at] - channel) * amount).toString(16).padStart(2, '0'))
    .join('')}`
}

/** Every colour variable the page, its host controls and the embedded chat read. */
function colours(p: Palette, mode: Mode): Colours {
  // Text on a solid status colour: light colours in dark mode, dark ones in light mode.
  const onSolid = mode === 'light' ? '#ffffff' : '#000000'
  return {
    '--bg': p.bg, '--bg-accent': p.hover, '--bg-elevated': p.elevated, '--bg-hover': p.hover,
    '--card': p.card, '--card-fg': p.text, '--panel': p.bg, '--panel-strong': p.elevated, '--chrome': p.bg,
    '--text': p.text, '--text-strong': p.strong, '--muted': p.muted, '--muted-strong': p.muted, '--muted-fg': onSolid,
    '--border': p.border, '--border-strong': p.borderStrong, '--border-hover': p.borderStrong,
    // Hover moves away from the background: darker on light, lighter on dark.
    '--accent': p.accent, '--accent-fg': p.accentFg, '--accent-hover': mix(p.accent, mode === 'light' ? '#000000' : '#ffffff', 0.15),
    '--accent-subtle': tint(p.accent, 0.16), '--accent-glow': tint(p.accent, 0.3), '--ring': p.accent,
    '--aim': p.accent, '--aim-fg': p.accentFg, '--aim-subtle': tint(p.accent, 0.16),
    '--ok': p.ok, '--ok-fg': onSolid, '--ok-subtle': tint(p.ok, 0.14), '--ok-text': p.ok,
    '--warn': p.warn, '--warn-fg': onSolid, '--warn-subtle': tint(p.warn, 0.14), '--warn-text': p.warnText,
    '--danger': p.danger, '--danger-fg': onSolid, '--danger-subtle': tint(p.danger, 0.14), '--danger-text': p.danger,
    '--info': p.info, '--info-fg': onSolid, '--info-text': p.info,
    '--glass-tint-ultrathin': tint(p.bg, 0.3), '--glass-tint-thin': tint(p.bg, 0.4), '--glass-tint-regular': tint(p.bg, 0.5),
    '--glass-tint-thick': tint(p.bg, 0.6), '--glass-tint-ultrathick': tint(p.bg, 0.8),
  }
}

/** The variables a theme sets, or null for Kiro Crew, which leaves the host's own. */
export function themeStyle(id: ThemeId, mode: Mode): Colours | null {
  return id === 'host' ? null : colours(PALETTES[id][mode], mode)
}

/** Background, accent and text, for the menu. Kiro Crew's come from the host, so it has none here. */
export function swatchOf(id: ThemeId, mode: Mode): [string, string, string] | null {
  const style = themeStyle(id, mode)
  return style && [style['--bg'], style['--accent'], style['--text']]
}

type Store = Pick<Storage, 'getItem' | 'setItem'>

export const THEME_KEY = 'system-map.theme'

/** Anything unknown, or storage the browser blocks, reads as Kiro Crew. */
export function readTheme(store: Store): ThemeId {
  try {
    const saved = store.getItem(THEME_KEY)
    return THEMES.find((theme) => theme.id === saved)?.id ?? DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

export function writeTheme(store: Store, id: ThemeId): void {
  try {
    store.setItem(THEME_KEY, id)
  } catch {
    // Nothing to keep it in. The choice still holds for this visit.
  }
}

/**
 * The one current theme for a document. The page and the panel tab can share a document, so a
 * pick reaches every subscriber. A blocked store keeps the pick in memory for this visit.
 */
export function themeChoice(store: Store | null) {
  let current = store ? readTheme(store) : DEFAULT_THEME
  const listeners = new Set<() => void>()
  const tell = () => listeners.forEach((listener) => listener())
  return {
    get: (): ThemeId => current,
    set(id: ThemeId) {
      current = id
      if (store) writeTheme(store, id)
      tell()
    },
    /** Another document changed storage. A null key means it was cleared. */
    heard(key: string | null) {
      if (key !== null && key !== THEME_KEY) return
      current = store ? readTheme(store) : DEFAULT_THEME
      tell()
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
