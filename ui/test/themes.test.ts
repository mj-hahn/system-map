import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DEFAULT_THEME, readTheme, THEMES, themeStyle, writeTheme } from '../src/themes.ts'

function memory(start: Record<string, string> = {}) {
  const values = new Map(Object.entries(start))
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => void values.set(key, value) }
}

/** WCAG relative luminance of a #rrggbb colour. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((at) => {
    const channel = parseInt(hex.slice(at, at + 2), 16) / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

test('with nothing saved, or something unknown saved, the theme is Kiro Crew', () => {
  assert.equal(DEFAULT_THEME, 'host')
  assert.equal(readTheme(memory()), 'host')
  assert.equal(readTheme(memory({ 'system-map.theme': 'neon' })), 'host')
  assert.equal(readTheme(memory({ 'system-map.theme': '' })), 'host')
})

test('a saved theme reads back', () => {
  const store = memory()
  for (const theme of THEMES) {
    writeTheme(store, theme.id)
    assert.equal(readTheme(store), theme.id)
  }
})

test('a store that throws reads as Kiro Crew and a write to it is dropped', () => {
  const broken = {
    getItem: () => {
      throw new Error('blocked')
    },
    setItem: () => {
      throw new Error('blocked')
    },
  }
  assert.equal(readTheme(broken), 'host')
  assert.doesNotThrow(() => writeTheme(broken, 'paper'))
})

test('Kiro Crew sets no colours of its own, in light or dark', () => {
  assert.equal(themeStyle('host', 'light'), null)
  assert.equal(themeStyle('host', 'dark'), null)
})

test('the menu offers four themes, Kiro Crew first, each with a name and a swatch', () => {
  assert.deepEqual(
    THEMES.map((theme) => theme.name),
    ['Kiro Crew', 'Blueprint', 'Paper', 'High contrast'],
  )
  for (const theme of THEMES) assert.equal(theme.swatch.length, 3)
})

const OWN = THEMES.filter((theme) => theme.id !== 'host')

test('every theme sets the same variables in light and dark, and the dark one is dark', () => {
  const names = Object.keys(themeStyle('blueprint', 'light')!).sort()
  assert.ok(names.includes('--bg') && names.includes('--accent') && names.includes('--warn-text'))
  for (const theme of OWN) {
    for (const mode of ['light', 'dark'] as const) {
      const style = themeStyle(theme.id, mode)!
      assert.deepEqual(Object.keys(style).sort(), names, `${theme.id} ${mode}`)
    }
    assert.ok(luminance(themeStyle(theme.id, 'dark')!['--bg']) < 0.1, `${theme.id} dark background is dark`)
    assert.ok(luminance(themeStyle(theme.id, 'light')!['--bg']) > 0.6, `${theme.id} light background is light`)
  }
})

test('text, muted text, accent, danger and warnings read at 4.5:1 on every background and card', () => {
  for (const theme of OWN) {
    for (const mode of ['light', 'dark'] as const) {
      const style = themeStyle(theme.id, mode)!
      for (const ground of ['--bg', '--card', '--bg-elevated']) {
        for (const ink of ['--text', '--muted', '--accent', '--danger', '--warn-text', '--ok']) {
          const ratio = contrast(style[ink], style[ground])
          assert.ok(ratio >= 4.5, `${theme.id} ${mode}: ${ink} on ${ground} is ${ratio.toFixed(2)}:1`)
        }
      }
      const button = contrast(style['--accent-fg'], style['--accent'])
      assert.ok(button >= 4.5, `${theme.id} ${mode}: button text on accent is ${button.toFixed(2)}:1`)
    }
  }
})
