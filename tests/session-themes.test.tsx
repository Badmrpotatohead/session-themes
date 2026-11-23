import { expect, test } from 'claude-code/testing'
import type { On } from 'claude-code'

// How /look is typed at the prompt.
const typed = (args: string) =>
  ({ command: 'look', args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 100 } }) as const

const PANE = (placement: 'dock' | 'widget') =>
  ({
    plugin: 'session-themes',
    component: 'Pane',
    requestId: 'look',
    props: {
      title: 'Look',
      isFocused: false,
      bodyColumns: 40,
      placement,
      scroll: { offset: 0, bodyRows: 30 },
      view: {},
    },
  }) as const

// Stands in for the engine: a session in the given folder, in the desktop app,
// with a store seeded from `stored`. Theme sets go to `sets`, pane opens to `opens`.
function engine(
  on: On,
  root: string,
  sets: unknown[],
  isRegisterRefused = false,
  opens: unknown[] = [],
  stored: Record<string, unknown> = {},
) {
  const store = new Map<string, unknown>(Object.entries(stored))
  on('session.surfaces', () => ({ value: ['desktop'] }))
  on('ui.open', (_, e) => {
    opens.push(e)
    return { value: { isPlaced: true } }
  })
  on('ui.close', () => ({ value: undefined }))
  on('command.register', () => {
    if (isRegisterRefused) {
      throw new Error('"/look" refused')
    }
    return { value: { command: 'look' } }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.root', () => ({ value: root }))
  on('session.id', () => ({ value: 'test-session' }))
  on('store.get', (_, e) => ({ value: store.get(e.key) }))
  on('store.set', (_, e) => {
    store.set(e.key, e.value)
    return { value: undefined }
  })
  on('store.delete', (_, e) => {
    store.delete(e.key)
    return { value: undefined }
  })
  on('theme.set', (_, e) => {
    sets.push(e)
    return { value: { isDrawn: true, requestId: 'r1' } }
  })
}

test('a project folder gets its own automatic look, the same every time, on every surface', async ($, on) => {
  const sets: unknown[] = []
  engine(on, 'C:\\Users\\alex\\Projects\\my-app', sets)
  await $.session.start({ cwd: 'C:\\Users\\alex\\Projects\\my-app', surface: 'desktop', isInteractive: true })
  await $.session.start({ cwd: 'C:\\Users\\alex\\Projects\\my-app', surface: 'desktop', isInteractive: true })

  expect(JSON.stringify(sets[0])).toMatch(/"scene":"auto-\d+-\d"/)
  expect(JSON.stringify(sets[1])).toBe(JSON.stringify(sets[0]))
  // No scene behind the words: a solid panel, tinted faintly in the look's hue.
  expect(JSON.stringify(sets[0])).toContain('"glass":{"blur":0,"opacity":1}')
  expect(JSON.stringify(sets[0])).toContain('"colors"')

  for (const surface of ['terminal', 'desktop', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...PANE('widget'), surface })
    expect((await ui.find({ type: 'Text', text: /^my-app$/ }))?.text).toBe('my-app')
    await ui.unmount()
  }
})

test('a macOS or Linux project path names the project too', async ($, on) => {
  const sets: unknown[] = []
  engine(on, '/Users/sam/code/weather-bot/.worktrees/a', sets)
  await $.session.start({ cwd: '/Users/sam/code/weather-bot', surface: 'desktop', isInteractive: true })

  expect(JSON.stringify(sets[0])).toMatch(/"scene":"auto-\d+-\d"/)
  const ui = await $.ui.mount({ ...PANE('widget'), surface: 'desktop' })
  expect((await ui.find({ type: 'Text', text: /^weather-bot$/ }))?.text).toBe('weather-bot')
  await ui.unmount()
})

test('a drive or home folder sets the plain look, with no tint', async ($, on) => {
  const sets: unknown[] = []
  engine(on, '/home/sam', sets)
  await $.session.start({ cwd: '/home/sam', surface: 'desktop', isInteractive: true })

  // So switching to this chat resets the look instead of keeping the last chat's.
  expect(sets.length).toBe(1)
  expect(JSON.stringify(sets[0])).toContain('"color":"surface-0"')
  expect(JSON.stringify(sets[0])).not.toContain('"colors"')
})

test('nothing is drawn above the prompt', async ($, on) => {
  engine(on, 'D:/my-app', [])
  await $.session.start({ cwd: 'D:/my-app', surface: 'desktop', isInteractive: true })

  const band = await $.ui.mount({
    plugin: 'session-themes',
    component: 'AbovePrompt',
    surface: 'desktop',
    props: {
      hasSurvey: false,
      isCollapsed: false,
      isWorking: false,
      maxRows: 12,
      bodyColumns: 100,
      scroll: { offset: 0, bodyRows: 12 },
      view: {},
    },
  })
  expect(await band.find({ type: 'Text', text: /my-app/i })).toBeUndefined()
  await band.unmount()
})

test('the picker opens as a widget in the desktop app; /look opens it full size', async ($, on) => {
  const opens: unknown[] = []
  engine(on, 'D:/my-app', [], false, opens)
  await $.session.start({ cwd: 'D:/my-app', surface: 'desktop', isInteractive: true })

  expect(opens.length).toBe(1)
  expect(JSON.stringify(opens[0])).toContain('"placement":"widget"')

  // The widget reads at a glance: the project's name, no buttons.
  const widget = await $.ui.mount({ ...PANE('widget'), surface: 'desktop' })
  expect(await widget.find({ type: 'Button' })).toBeUndefined()
  await widget.unmount()

  const answer = await $.command.run(typed(''))
  expect(answer.text).toContain('picker is open')
  expect(opens.length).toBe(2)
  expect(JSON.stringify(opens[1])).not.toContain('widget')
  expect(JSON.stringify(opens[1])).toContain('"focus":true')
})

test('the picker buttons switch to a hand-drawn theme, and auto goes back to the folder', async ($, on) => {
  const sets: unknown[] = []
  engine(on, 'D:/my-app', sets)
  await $.session.start({ cwd: 'D:/my-app', surface: 'desktop', isInteractive: true })
  const own = JSON.stringify(sets[0])

  const pane = await $.ui.mount({ ...PANE('dock'), surface: 'desktop' })
  await pane.press({ key: 'set-lanterns' })
  expect(JSON.stringify(sets.at(-1))).toContain('"scene":"lanterns"')
  expect((await pane.find({ type: 'Text', text: /^Lanterns$/ }))?.text).toBe('Lanterns')

  await pane.press({ key: 'set-auto' })
  expect(JSON.stringify(sets.at(-1))).toBe(own)
  await pane.unmount()
})

test('/look switches by name, and a chat keeps its pick when it starts again', async ($, on) => {
  const sets: unknown[] = []
  engine(on, 'D:/my-app', sets)
  await $.session.start({ cwd: 'D:/my-app', surface: 'desktop', isInteractive: true })

  const answer = await $.command.run(typed('alchemy'))
  expect(answer.text).toContain('Alchemy')

  const nope = await $.command.run(typed('zelda'))
  expect(nope.text).toContain('No theme named')

  // A resume or reload runs session.start again: the pick stays.
  await $.session.start({ cwd: 'D:/my-app', surface: 'desktop', isInteractive: true })
  expect(JSON.stringify(sets.at(-1))).toContain('"scene":"alchemy"')

  const plain = await $.command.run(typed('plain'))
  expect(plain.text).toContain("app's own look")
  expect(JSON.stringify(sets.at(-1))).toContain('"color":"surface-0"')
})

test('a refused /look registration still draws the look', async ($, on) => {
  const sets: unknown[] = []
  engine(on, 'D:/my-app', sets, true)
  await $.session.start({ cwd: 'D:/my-app', surface: 'desktop', isInteractive: true })

  expect(JSON.stringify(sets.at(-1))).toMatch(/"scene":"auto-\d+-\d"/)
})

test('a picker the person closed stays closed in that chat until /look', async ($, on) => {
  const opens: unknown[] = []
  engine(on, 'D:/my-app', [], false, opens, { 'dismissed:test-session': true })
  await $.session.start({ cwd: 'D:/my-app', surface: 'desktop', isInteractive: true })
  expect(opens.length).toBe(0)

  // /look brings it back and forgets the close.
  await $.command.run(typed(''))
  expect(opens.length).toBe(1)

  await $.session.start({ cwd: 'D:/my-app', surface: 'desktop', isInteractive: true })
  expect(opens.length).toBe(2)
  expect(JSON.stringify(opens[1])).toContain('"placement":"widget"')
})
