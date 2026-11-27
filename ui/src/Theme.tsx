import { useTheme } from '@kirocrew/app-sdk'
import { useSyncExternalStore } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Chevron, Dropdown, MenuList } from './Menu'
import { swatchOf, themeChoice, THEMES, themeStyle } from './themes'
import type { Mode, ThemeId } from './themes'

function store(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

let shared: ReturnType<typeof themeChoice> | null = null

/** Made on first use, not at import, so it reads storage as it is when the page first draws. */
function choice() {
  if (!shared) {
    const made = themeChoice(store())
    window.addEventListener('storage', (event) => made.heard(event.key))
    shared = made
  }
  return shared
}

/** The person's theme, and a way to change it everywhere System Map shows. */
export function useThemeChoice(): [ThemeId, (id: ThemeId) => void] {
  const { subscribe, get, set } = choice()
  return [useSyncExternalStore(subscribe, get), set]
}

/** Sets the theme's colours on System Map's own root. Kiro Crew sets none, so it looks as before. */
export function ThemeScope({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  const [id] = useThemeChoice()
  const { mode } = useTheme()
  const colours = themeStyle(id, mode)
  const look: CSSProperties = colours ? { ...colours, background: 'var(--bg)', color: 'var(--text)' } : {}
  return (
    <div data-sm-theme={id} style={{ display: 'flow-root', boxSizing: 'border-box', ...style, ...look }}>
      {children}
    </div>
  )
}

/** Kiro Crew's swatch is whatever the host draws, so it reads the host's own values. */
function hostSwatch(): string[] {
  const root = getComputedStyle(document.documentElement)
  return ['--bg', '--accent', '--text'].map((name) => root.getPropertyValue(name).trim() || 'transparent')
}

function Swatch({ id, mode }: { id: ThemeId; mode: Mode }) {
  const colours = swatchOf(id, mode) ?? hostSwatch()
  return (
    <span className="sm-swatch" aria-hidden="true">
      {colours.map((colour, at) => (
        <i key={at} style={{ background: colour }} />
      ))}
    </span>
  )
}

/** The header chip that picks a theme. */
export function ThemePicker() {
  const [id, choose] = useThemeChoice()
  const { mode } = useTheme()
  const current = THEMES.find((theme) => theme.id === id) ?? THEMES[0]
  return (
    <Dropdown
      width={230}
      align="right"
      popup="menu"
      label="Theme"
      trigger={(props) => (
        <button type="button" className="sm-plain sm-chip" data-testid="theme-chip" aria-label={`Theme: ${current.name}`} {...props}>
          <Swatch id={current.id} mode={mode} />
          Theme
          <Chevron />
        </button>
      )}
    >
      {(close) => (
        <MenuList label="Theme">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              role="menuitemradio"
              aria-checked={theme.id === id}
              className="sm-plain sm-row"
              onClick={() => {
                choose(theme.id)
                close()
              }}
            >
              <Swatch id={theme.id} mode={mode} />
              <span className="sm-ellipsis">{theme.name}</span>
              {theme.id === id && (
                <span className="sm-check" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          ))}
        </MenuList>
      )}
    </Dropdown>
  )
}
