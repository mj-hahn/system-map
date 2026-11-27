// Themes change System Map's colours. Each sets the host's own colour variables, which every view
// already reads, so nothing else needs to know a theme exists. Light or dark follows the host.

export type ThemeId = 'host' | 'blueprint' | 'paper' | 'contrast'
export type Mode = 'light' | 'dark'
type Colours = Record<string, string>

export interface Theme {
  id: ThemeId
  name: string
  /** Background, accent and text, for the menu. */
  swatch: [string, string, string]
}

export const DEFAULT_THEME: ThemeId = 'host'

export const THEMES: Theme[] = [
  { id: 'host', name: 'Kiro Crew', swatch: ['#fafafa', '#2f7d5c', '#18181b'] },
  { id: 'blueprint', name: 'Blueprint', swatch: ['#eef3f9', '#1d5fa8', '#0f2742'] },
  { id: 'paper', name: 'Paper', swatch: ['#f6f1e7', '#9c3d27', '#2b2118'] },
  { id: 'contrast', name: 'High contrast', swatch: ['#ffffff', '#0040c1', '#000000'] },
]

const COLOURS: Record<Exclude<ThemeId, 'host'>, Record<Mode, Colours>> = {
  blueprint: {
    light: {
      '--bg': '#eef3f9', '--bg-elevated': '#ffffff', '--bg-hover': '#e1eaf4', '--card': '#f8fbfe',
      '--text': '#0f2742', '--text-strong': '#071a30', '--muted': '#4a6380',
      '--border': '#c9d7e6', '--border-strong': '#8aa3be',
      '--accent': '#1d5fa8', '--accent-fg': '#ffffff', '--accent-subtle': 'rgba(29, 95, 168, 0.16)',
      '--danger': '#b42318', '--warn': '#b54708', '--warn-text': '#9a4a06', '--ok': '#157347', '--info': '#1d5fa8',
    },
    dark: {
      '--bg': '#0c1d33', '--bg-elevated': '#13294a', '--bg-hover': '#1a3358', '--card': '#102440',
      '--text': '#e6eef8', '--text-strong': '#ffffff', '--muted': '#9db3cc',
      '--border': '#24406a', '--border-strong': '#4d6d96',
      '--accent': '#6cb4ff', '--accent-fg': '#06182c', '--accent-subtle': 'rgba(108, 180, 255, 0.2)',
      '--danger': '#ff8a80', '--warn': '#f5b14c', '--warn-text': '#f5b14c', '--ok': '#5fd39a', '--info': '#6cb4ff',
    },
  },
  paper: {
    light: {
      '--bg': '#f6f1e7', '--bg-elevated': '#fffdf8', '--bg-hover': '#ede5d6', '--card': '#fffaf0',
      '--text': '#2b2118', '--text-strong': '#1a120b', '--muted': '#6b5d4d',
      '--border': '#e0d5c1', '--border-strong': '#a8977d',
      '--accent': '#9c3d27', '--accent-fg': '#ffffff', '--accent-subtle': 'rgba(156, 61, 39, 0.14)',
      '--danger': '#a61b1b', '--warn': '#a85d00', '--warn-text': '#8a4b00', '--ok': '#3f6b2a', '--info': '#2f5d7c',
    },
    dark: {
      '--bg': '#1f1a15', '--bg-elevated': '#2a231c', '--bg-hover': '#332a21', '--card': '#262019',
      '--text': '#efe6d8', '--text-strong': '#fffaf0', '--muted': '#b3a48f',
      '--border': '#3e3428', '--border-strong': '#6e604e',
      '--accent': '#e0896b', '--accent-fg': '#23120b', '--accent-subtle': 'rgba(224, 137, 107, 0.2)',
      '--danger': '#f28b82', '--warn': '#e3a857', '--warn-text': '#e3a857', '--ok': '#9cc47e', '--info': '#8fb8d6',
    },
  },
  contrast: {
    light: {
      '--bg': '#ffffff', '--bg-elevated': '#ffffff', '--bg-hover': '#ececec', '--card': '#ffffff',
      '--text': '#000000', '--text-strong': '#000000', '--muted': '#333333',
      '--border': '#595959', '--border-strong': '#000000',
      '--accent': '#0040c1', '--accent-fg': '#ffffff', '--accent-subtle': 'rgba(0, 64, 193, 0.16)',
      '--danger': '#b00000', '--warn': '#8a4500', '--warn-text': '#7a3d00', '--ok': '#005a1f', '--info': '#0040c1',
    },
    dark: {
      '--bg': '#000000', '--bg-elevated': '#0d0d0d', '--bg-hover': '#1f1f1f', '--card': '#000000',
      '--text': '#ffffff', '--text-strong': '#ffffff', '--muted': '#d0d0d0',
      '--border': '#a6a6a6', '--border-strong': '#ffffff',
      '--accent': '#ffd60a', '--accent-fg': '#000000', '--accent-subtle': 'rgba(255, 214, 10, 0.22)',
      '--danger': '#ff6b6b', '--warn': '#ffb020', '--warn-text': '#ffb020', '--ok': '#4ade80', '--info': '#7cc4ff',
    },
  },
}

/** The variables a theme sets, or null for Kiro Crew, which leaves the host's own. */
export function themeStyle(id: ThemeId, mode: Mode): Colours | null {
  return id === 'host' ? null : COLOURS[id][mode]
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

/** A blocked store keeps the choice for this visit only. */
export function writeTheme(store: Store, id: ThemeId): void {
  try {
    store.setItem(THEME_KEY, id)
  } catch {
    // Nothing to keep it in.
  }
}
