import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeResult, ThemeSetArgs } from 'claude-code'

import type { ThemeChoice } from '../types'
import { postcardFor, sceneFor } from './scenes'
import { THEMES, accentOf, detect, folderName, parseAuto, themeById, tintFor } from './themes'

const PLUGIN = 'session-themes'
// The theme picker: a pane that starts as a widget in the desktop app's
// session rail, and opens out to the theme buttons.
const PANE = 'look'
const PANE_TITLE = 'Look'

const active = atom({ plugin: 'session-themes', key: 'active' } as const, 'none')
const detected = atom({ plugin: 'session-themes', key: 'detected' } as const, 'none')
const folder = atom({ plugin: 'session-themes', key: 'folder' } as const, '')

const NEUTRAL = '#8a8f98'

const usage =
  'Use /look <name> with one of: ' +
  THEMES.map(one => one.id).join(', ') +
  ", plain (the app's own look), or auto (this project's own look). /look alone opens the picker."

// A chat with no theme still sets a look: the app's own page color and colors.
// The app keeps the last look it was sent, so a chat that set none would
// show the previous chat's theme.
const PLAIN_LOOK: ThemeSetArgs = { backdrop: { color: 'surface-0' } }

/** True for a hand-made theme or a project's automatic look. */
const hasScene = (id: ThemeChoice): boolean => themeById(id) !== undefined || parseAuto(id) !== undefined

/** What the look is called: the theme's name, the project's for its own color, or plain. */
function describe(id: ThemeChoice): string {
  return themeById(id)?.label ?? (parseAuto(id) !== undefined ? 'Own color' : 'Plain')
}

// Draws a theme id, or the plain look for `none` and `plain`.
async function paint($: EngineInterface, id: ThemeChoice): Promise<ThemeResult> {
  if (hasScene(id)) {
    // The conversation panel is solid, so no scene shows behind the words; its
    // color carries a very faint tint of the theme's hue (tintFor in themes.ts).
    const colors = tintFor(id)
    return $.theme.set({
      backdrop: { scene: id, glass: { blur: 0, opacity: 1 } },
      ...(colors === undefined ? {} : { colors }),
    })
  }
  return $.theme.set(PLAIN_LOOK)
}

// Opens the picker full size, wherever it is now: a widget, closed, or not yet open.
// Closing first makes the open a fresh one, which the app shows expanded.
async function showPicker($: EngineInterface): Promise<string> {
  // Asking for it undoes an earlier X in this chat.
  await $.store.delete(`dismissed:${await $.session.id()}`)
  await $.ui.close({ id: PANE }).catch(() => undefined)
  const opened = await $.ui.open({ id: PANE, title: PANE_TITLE, focus: true })
  return opened.isPlaced ? 'The theme picker is open beside the chat.' : `The theme picker couldn't open here: ${opened.reason}`
}

// The small widget in the session rail, unless the person closed it in this chat.
async function openWidget($: EngineInterface): Promise<void> {
  if ((await $.store.get(`dismissed:${await $.session.id()}`)) === true) {
    return
  }
  void $.ui.open({ id: PANE, title: PANE_TITLE, placement: 'widget' })
}

async function choose($: EngineInterface, wanted: string): Promise<string> {
  const sessionId = await $.session.id()
  let id: ThemeChoice
  if (wanted === 'auto') {
    await $.store.delete(`choice:${sessionId}`)
    id = await read($, detected)
  } else {
    id = wanted
    await $.store.set(`choice:${sessionId}`, id)
  }
  const result = await paint($, id)
  await update($, active, () => id)
  const name =
    themeById(id)?.label ??
    (parseAuto(id) !== undefined ? "this project's own look" : id === 'none' ? 'no theme' : "the app's own look")
  if (!result.isDrawn && hasScene(id)) {
    return `This session is set to ${name}, but nothing is drawn here: ${result.reason}`
  }
  return `This session now uses ${name}.`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const root = await $.session.root()
    const found = detect(root)
    const stored = await $.store.get(`choice:${await $.session.id()}`)
    const id = typeof stored === 'string' ? stored : found

    await update($, detected, () => found)
    await update($, folder, () => folderName(root))
    await update($, active, () => id)
    await paint($, id)

    // /theme is Claude Code's own command, so this one is /look. A refused
    // registration must not stop the theme from being drawn.
    await $.command
      .register({
        name: 'look',
        description: "Switch this session's look (a theme name, plain, or auto)",
        argumentHint: '[name]',
      })
      .catch(() => undefined)

    // Only where the desktop app draws (a terminal would open the pane full
    // size), and not in a chat where the person closed it.
    if ((await $.session.surfaces()).includes('desktop')) {
      await openWidget($)
    }

    return next(e)
  })

  // The desktop app attaching after the session started (opening the app, or
  // switching to this chat) gets the widget too.
  on('session.attach', async ($, e, next) => {
    if (e.surface === 'desktop') {
      await openWidget($)
    }
    return next(e)
  })

  // The person's X closes the picker for this chat: it stays closed, also
  // when they come back to the chat, until they run /look.
  on('ui.close', async ($, e, next) => {
    if (e.id === PANE && e.origin.kind === 'person') {
      await $.store.set(`dismissed:${await $.session.id()}`, true)
    }
    return next(e)
  })

  on('command.run', { command: 'look' }, async ($, e) => {
    const wanted = e.args.trim().toLowerCase()
    if (wanted === '') {
      return { text: `${await showPicker($)} ${usage}` }
    }
    const match = THEMES.find(one => one.id === wanted || one.label.toLowerCase().startsWith(wanted))
    if (match !== undefined) {
      return { text: await choose($, match.id) }
    }
    if (wanted === 'plain' || wanted === 'auto') {
      return { text: await choose($, wanted) }
    }
    return { text: `No theme named "${wanted}". ${usage}` }
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.props.plugin !== PLUGIN || (e.surface !== 'desktop' && e.surface !== 'mobile')) {
      return next(e)
    }
    const scene = sceneFor(e.props.scene)
    if (scene === undefined) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)
    return <Svg source={scene} alt={`${themeById(e.props.scene)?.label ?? 'Project'} backdrop`} isInteractive />
  })

  // The picker. As a widget in the session rail it only reads at a glance
  // (clicks may not reach a widget); opened out, it holds the theme buttons.
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const elements = $.ui.resolve(e)
    const { Box, Button, Text } = elements
    const id = await read($, active)
    const where = await read($, folder)
    const theme = themeById(id)
    const color = accentOf(id) ?? NEUTRAL
    const name = theme?.label ?? where

    // The chat's scene as a postcard, so the look shows beside the chat even when
    // panes leave no margin for the backdrop. The terminal draws no SVG.
    const scene = postcardFor(id)
    const postcard = (height: number) =>
      scene !== undefined && 'Svg' in elements ? (
        <elements.Svg source={scene} alt={`${name} scene`} height={height} isInteractive />
      ) : null

    const header = (
      <Box flexDirection="row" alignItems="center" gap={1}>
        <Text color={color} size="heading">
          ●
        </Text>
        <Text bold weight="bold" size="heading">
          {name}
        </Text>
      </Box>
    )

    if (e.props.placement === 'widget') {
      return (
        <Box flexDirection="column" gap={1}>
          {postcard(72)}
          {header}
          <Text dimColor size="footnote">
            {theme !== undefined && theme.label.toLowerCase() !== where.toLowerCase() ? `${where} · ` : ''}
            {describe(id)}
          </Text>
        </Box>
      )
    }

    // The look the folder picks, which the Auto button returns to.
    const home = await read($, detected)
    const option = (key: string, label: string, isOn: boolean, pick: string) => (
      <Button
        key={key}
        label={label}
        variant={isOn ? 'primary' : 'secondary'}
        onPress={async () => {
          await choose($, pick)
        }}
      />
    )

    return (
      <Box flexDirection="column" gap={1}>
        {postcard(180)}
        {header}
        <Text dimColor>{where}</Text>
        <Box flexDirection="column" gap={1}>
          {THEMES.map(one => option(`set-${one.id}`, one.label, one.id === id, one.id))}
          {option('set-auto', parseAuto(home) !== undefined ? 'Own color' : 'Auto (project)', id === home, 'auto')}
          {option('set-plain', 'Plain', id === 'plain', 'plain')}
        </Box>
      </Box>
    )
  })
}
