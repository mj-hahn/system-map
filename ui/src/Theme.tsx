import { useTheme } from '@kirocrew/app-sdk'
import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Chevron, Dropdown, MenuList } from './Menu'
import { readTheme, THEME_KEY, THEMES, themeStyle, writeTheme } from './themes'
import type { Theme, ThemeId } from './themes'

// The page and the panel tab can be open in one document, so a pick reaches both at once.
// Another document hears of it through the `storage` event.
const listeners = new Set<(id: ThemeId) => void>()

function store(): Pick<Storage, 'getItem' | 'setItem'> | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function saved(): ThemeId {
  const local = store()
  return local ? readTheme(local) : 'host'
}

/** The person's theme, and a way to change it everywhere System Map shows. */
export function useThemeChoice(): [ThemeId, (id: ThemeId) => void] {
  const [id, setId] = useState<ThemeId>(saved)

  useEffect(() => {
    listeners.add(setId)
    const elsewhere = (event: StorageEvent) => {
      if (event.key === null || event.key === THEME_KEY) setId(saved())
    }
    window.addEventListener('storage', elsewhere)
    return () => {
      listeners.delete(setId)
      window.removeEventListener('storage', elsewhere)
    }
  }, [])

  const choose = (next: ThemeId) => {
    const local = store()
    if (local) writeTheme(local, next)
    listeners.forEach((listener) => listener(next))
  }
  return [id, choose]
}

/** Sets the theme's colours on System Map's own root. Kiro Crew sets none, so it looks as before. */
export function ThemeScope({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  const [id] = useThemeChoice()
  const { mode } = useTheme()
  const colours = themeStyle(id, mode)
  const look: CSSProperties = colours ? { ...colours, background: 'var(--bg)', color: 'var(--text)' } : {}
  return (
    <div data-theme={id} style={{ display: 'flow-root', boxSizing: 'border-box', ...style, ...look }}>
      {children}
    </div>
  )
}

function Swatch({ theme }: { theme: Theme }) {
  return (
    <span className="sm-swatch" aria-hidden="true">
      {theme.swatch.map((colour) => (
        <i key={colour} style={{ background: colour }} />
      ))}
    </span>
  )
}

/** The header chip that picks a theme. */
export function ThemePicker() {
  const [id, choose] = useThemeChoice()
  const current = THEMES.find((theme) => theme.id === id) ?? THEMES[0]
  return (
    <Dropdown
      width={230}
      align="right"
      popup="menu"
      label="Theme"
      trigger={(props) => (
        <button type="button" className="sm-plain sm-chip" data-testid="theme-chip" aria-label={`Theme: ${current.name}`} {...props}>
          <Swatch theme={current} />
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
              <Swatch theme={theme} />
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
