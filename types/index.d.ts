/** A theme's id, `plain` (the app's own look, chosen), or `none` (no project matched). */
export type ThemeChoice = string

declare module 'claude-code' {
  interface PluginState {
    'session-themes': {
      /** The theme drawn now. */
      active: ThemeChoice
      /** The theme the session's folder points to. */
      detected: ThemeChoice
      /** The session's project name, as shown in the picker. */
      folder: string
      /** The look every chat in this project shares, or '' for automatic. */
      projectLook: ThemeChoice
    }
  }
}
