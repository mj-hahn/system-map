import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DEFAULT_THEME, readTheme, swatchOf, themeChoice, THEMES, themeStyle, writeTheme } from '../src/themes.ts'

function memory(start: Record<string, string> = {}) {
  const values = new Map(Object.entries(start))
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => void values.set(key, value) }
}

const blocked = {
  getItem: (): string | null => {
    throw new Error('blocked')
  },
  setItem: () => {
    throw new Error('blocked')
  },
}

type Rgb = [number, number, number]

/** A #rrggbb or rgba() colour, laid over `under` when it is see-through. */
function solid(colour: string, under?: Rgb): Rgb {
  if (colour.startsWith('#')) return [1, 3, 5].map((at) => parseInt(colour.slice(at, at + 2), 16)) as Rgb
  const [r, g, b, a] = colour.match(/[\d.]+/g)!.map(Number)
  assert.ok(under, `${colour} needs something under it`)
  return [r, g, b].map((channel, at) => channel * a + under[at] * (1 - a)) as Rgb
}

/** WCAG relative luminance. */
function luminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map((value) => {
    const channel = value / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: Rgb, b: Rgb): number {
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
  assert.equal(readTheme(blocked), 'host')
  assert.doesNotThrow(() => writeTheme(blocked, 'paper'))
})

test('Kiro Crew sets no colours of its own, and has no swatch of its own, in light or dark', () => {
  for (const mode of ['light', 'dark'] as const) {
    assert.equal(themeStyle('host', mode), null)
    assert.equal(swatchOf('host', mode), null)
  }
})

test('the menu offers four themes, Kiro Crew first', () => {
  assert.deepEqual(
    THEMES.map((theme) => theme.name),
    ['Kiro Crew', 'Blueprint', 'Paper', 'High contrast'],
  )
})

const OWN = THEMES.filter((theme) => theme.id !== 'host')
const MODES = ['light', 'dark'] as const

/** What the host's own buttons, badges, focus rings and chat read, beyond the page's own. */
const HOST_CONTROLS = [
  '--accent-hover', '--accent-glow', '--ring', '--aim', '--aim-subtle', '--ok-subtle', '--ok-text',
  '--danger-subtle', '--danger-text', '--warn-subtle', '--panel', '--chrome', '--muted-fg', '--glass-tint-regular',
]

test('every theme sets the same variables in light and dark, the host controls included, and the dark one is dark', () => {
  const names = Object.keys(themeStyle('blueprint', 'light')!).sort()
  for (const name of ['--bg', '--card', '--text', '--muted', '--border', '--accent', '--warn-text', ...HOST_CONTROLS]) {
    assert.ok(names.includes(name), name)
  }
  for (const theme of OWN) {
    for (const mode of MODES) assert.deepEqual(Object.keys(themeStyle(theme.id, mode)!).sort(), names, `${theme.id} ${mode}`)
    assert.ok(luminance(solid(themeStyle(theme.id, 'dark')!['--bg'])) < 0.1, `${theme.id} dark background is dark`)
    assert.ok(luminance(solid(themeStyle(theme.id, 'light')!['--bg'])) > 0.6, `${theme.id} light background is light`)
  }
})

test('the swatch shows the background, accent and text of the mode in use', () => {
  for (const theme of OWN) {
    for (const mode of MODES) {
      const style = themeStyle(theme.id, mode)!
      assert.deepEqual(swatchOf(theme.id, mode), [style['--bg'], style['--accent'], style['--text']])
    }
  }
})

test('text and status colours read at 4.5:1 on every background, card and selected row', () => {
  for (const theme of OWN) {
    for (const mode of MODES) {
      const style = themeStyle(theme.id, mode)!
      const grounds: [string, Rgb][] = []
      for (const name of ['--bg', '--card', '--bg-elevated', '--bg-hover']) grounds.push([name, solid(style[name])])
      // A selected row's tint replaces the hover colour, so it only ever sits on a surface.
      for (const name of ['--bg', '--card', '--bg-elevated']) {
        grounds.push([`--accent-subtle on ${name}`, solid(style['--accent-subtle'], solid(style[name]))])
      }
      for (const [where, ground] of grounds) {
        for (const ink of ['--text', '--muted', '--accent', '--danger-text', '--warn-text', '--ok-text', '--info-text']) {
          const ratio = contrast(solid(style[ink]), ground)
          assert.ok(ratio >= 4.5, `${theme.id} ${mode}: ${ink} on ${where} is ${ratio.toFixed(2)}:1`)
        }
      }
      for (const [ink, fill] of [
        ['--accent-fg', '--accent'],
        ['--accent-fg', '--accent-hover'],
        ['--aim-fg', '--aim'],
        ['--danger-fg', '--danger'],
        ['--ok-fg', '--ok'],
      ]) {
        const ratio = contrast(solid(style[ink]), solid(style[fill]))
        assert.ok(ratio >= 4.5, `${theme.id} ${mode}: ${ink} on ${fill} is ${ratio.toFixed(2)}:1`)
      }
    }
  }
})

test('a pick reaches every subscriber and is kept in the store', () => {
  const store = memory()
  const choice = themeChoice(store)
  let page = 0
  let panel = 0
  const stopPage = choice.subscribe(() => page++)
  choice.subscribe(() => panel++)
  choice.set('paper')
  assert.equal(choice.get(), 'paper')
  assert.equal(readTheme(store), 'paper')
  assert.deepEqual([page, panel], [1, 1])
  stopPage()
  choice.set('contrast')
  assert.deepEqual([page, panel], [1, 2])
})

test('a change from another document is heard, and other keys are not', () => {
  const store = memory()
  const choice = themeChoice(store)
  let told = 0
  choice.subscribe(() => told++)
  store.setItem('system-map.view.app-1', 'risk')
  choice.heard('system-map.view.app-1')
  assert.equal(told, 0)
  store.setItem('system-map.theme', 'blueprint')
  choice.heard('system-map.theme')
  assert.equal(choice.get(), 'blueprint')
  assert.equal(told, 1)
})

test('with storage blocked, a pick still holds for this visit, for anything that reads it later', () => {
  const choice = themeChoice(blocked)
  choice.set('paper')
  assert.equal(choice.get(), 'paper')
  assert.equal(themeChoice(null).get(), 'host')
})
