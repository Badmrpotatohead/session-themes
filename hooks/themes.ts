import type { ThemeColors } from 'claude-code'

import { FOLDER_THEMES } from './config'
import { makeColors } from './make-colors.js'

export type Theme = {
  id: string
  /** The name the picker shows. */
  label: string
  /** The dot color, and the hue of the faint tint behind the chat. */
  accent: string
}

/** The hand-drawn themes, each with its own animated scene in scenes.ts. */
export const THEMES: Theme[] = [
  { id: 'paper', label: 'Paper', accent: '#c0612b' },
  { id: 'lanterns', label: 'Lanterns', accent: '#e0962e' },
  { id: 'alchemy', label: 'Alchemy', accent: '#2f9e74' },
  { id: 'space', label: 'Space', accent: '#3f9cff' },
  { id: 'aurora', label: 'Aurora', accent: '#aa66ee' },
  { id: 'music', label: 'Music', accent: '#d9b25f' },
  { id: 'dawn', label: 'Dawn', accent: '#f0607e' },
  { id: 'studio', label: 'Studio', accent: '#2fa59d' },
]

export function themeById(id: string): Theme | undefined {
  return THEMES.find(one => one.id === id)
}

// ---- Paths --------------------------------------------------------------

function parts(path: string): string[] {
  return path.split(/[\\/]+/).filter(part => part !== '')
}

// Folders that hold projects rather than being one, skipped when naming a project.
const CONTAINERS = new Set([
  'projects', 'code', 'dev', 'src', 'source', 'repos', 'git', 'github', 'documents', 'desktop', 'downloads',
  'workspace', 'work', 'onedrive', 'appdata', 'local', 'temp', 'tmp',
])

/**
 * The project folder of a path: the first folder under the drive, the home
 * folder and any container folders (Projects, Code, ...). `undefined` for a
 * drive or the home folder itself.
 */
function topFolder(root: string): string | undefined {
  const all = parts(root)
  let i = 0
  if (/^[a-z]:$/i.test(all[0] ?? '')) {
    i += 1
  }
  const at = (n: number) => (all[n] ?? '').toLowerCase()
  if (at(i) === 'users' || at(i) === 'home') {
    i += 2
  }
  while (i < all.length && CONTAINERS.has(at(i))) {
    i += 1
  }
  return all[i]
}

// ---- The automatic look -------------------------------------------------

// A project without a theme of its own gets a look from its folder name: a hue
// and one of four patterns, the same for that name every time.
const PATTERNS = 4

function hash(text: string): number {
  let h = 0x811c9dc5
  for (const char of text.toLowerCase()) {
    h ^= char.codePointAt(0) ?? 0
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h
}

/** The scene id of a name's automatic look, such as `auto-212-3`. */
export function autoId(name: string): string {
  const h = hash(name)
  return `auto-${h % 360}-${(h >>> 9) % PATTERNS}`
}

export function parseAuto(id: string): { hue: number; pattern: number } | undefined {
  const match = /^auto-(\d{1,3})-(\d)$/.exec(id)
  if (match === null) {
    return undefined
  }
  return { hue: Number(match[1]) % 360, pattern: Number(match[2]) % PATTERNS }
}

/** A hue at a saturation and lightness, as #rrggbb. */
export function hsl(hue: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l)
  const f = (n: number): string => {
    const k = (n + hue / 30) % 12
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

/** The dot color of a theme id, hand-drawn or automatic. */
export function accentOf(id: string): string | undefined {
  const theme = themeById(id)
  if (theme !== undefined) {
    return theme.accent
  }
  const auto = parseAuto(id)
  return auto === undefined ? undefined : hsl(auto.hue, 0.62, 0.55)
}

// ---- Detection ----------------------------------------------------------

/**
 * The look a folder points to: a theme from FOLDER_THEMES in config.ts, matched
 * against any part of the path (deepest first); else the automatic look of its
 * project folder; else `none` (a drive or the home folder).
 */
export function detect(root: string): string {
  const all = parts(root)
  for (let i = all.length - 1; i >= 0; i -= 1) {
    const found = FOLDER_THEMES.find(rule => rule.folder.test(all[i] ?? ''))
    if (found !== undefined && themeById(found.theme) !== undefined) {
      return found.theme
    }
  }
  const name = topFolder(root)
  return name === undefined ? 'none' : autoId(name)
}

/** The name the picker shows: the project folder, else the path's last part. */
export function folderName(root: string): string {
  return topFolder(root) ?? parts(root).at(-1) ?? root
}

// ---- The faint tint -----------------------------------------------------

/** A #rrggbb color's hue, 0 to 359. */
function hueOf(hex: string): number {
  const v = parseInt(hex.slice(1), 16)
  const r = ((v >> 16) & 255) / 255
  const g = ((v >> 8) & 255) / 255
  const b = (v & 255) / 255
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  if (d === 0) {
    return 0
  }
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return Math.round(h * 60 + 360) % 360
}

/** The hue a look tints the app with: its accent's. */
export function hueFor(id: string): number | undefined {
  const theme = themeById(id)
  if (theme !== undefined) {
    return hueOf(theme.accent)
  }
  return parseAuto(id)?.hue
}

const tintCache = new Map<number, { colors: ThemeColors; problems: string[] }>()

/**
 * The app's backgrounds in one hue, very faintly: the grays keep their
 * lightness and gain a little of the hue; text stays nearly neutral, and
 * buttons and links keep the app's own colors.
 */
export function tintOf(hue: number): { colors: ThemeColors; problems: string[] } {
  const cached = tintCache.get(hue)
  if (cached !== undefined) {
    return cached
  }
  const made = makeColors({
    label: `Tint ${hue}`,
    id: `session-themes-tint-${hue}`,
    light: {
      gray: {
        anchors: {
          'surface-0': hsl(hue, 0.28, 0.955),
          'surface-1': hsl(hue, 0.26, 0.97),
          'surface-2': hsl(hue, 0.24, 0.985),
          'text-primary': hsl(hue, 0.1, 0.13),
          'text-secondary': hsl(hue, 0.08, 0.3),
          'text-muted': hsl(hue, 0.06, 0.4),
        },
      },
    },
    dark: {
      gray: {
        anchors: {
          'surface-0': hsl(hue, 0.18, 0.1),
          'surface-1': hsl(hue, 0.16, 0.125),
          'surface-2': hsl(hue, 0.14, 0.15),
          'surface-3': hsl(hue, 0.12, 0.17),
          'text-primary': hsl(hue, 0.06, 0.93),
          'text-secondary': hsl(hue, 0.05, 0.78),
          'text-muted': hsl(hue, 0.04, 0.64),
        },
      },
    },
  })
  const tint = { colors: made.theme, problems: made.problems }
  tintCache.set(hue, tint)
  return tint
}

/** The colors a look tints the app with, or none for a plain look. */
export function tintFor(id: string): ThemeColors | undefined {
  const hue = hueFor(id)
  return hue === undefined ? undefined : tintOf(hue).colors
}
