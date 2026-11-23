# session-themes

A Claude Code mod that gives each chat its own look, so you can tell your sessions apart at a glance and stop pasting into the wrong one.

Each chat picks its look from its project folder:

- **A faint animated backdrop** in the margins beside the conversation.
- **A very light tint** of the look's color behind the chat. The text stays neutral.
- **A Look widget in the session rail** (the column beside the chat) showing the project's name, its color and a small postcard of its scene. Open it out to switch looks.

Every project gets an automatic look from its folder name: a color and one of four patterns (soft glows, rolling waves, pulsing dots, slow rings), the same for that folder every time. Eight hand-drawn themes are included as well: Paper, Lanterns, Alchemy, Space, Aurora, Music, Dawn and Studio. Chats in a drive or home folder, and chats set to Plain, keep the app's own look.

The look shows in the Claude desktop app and the mobile app. The terminal draws no backdrop.

## Install

At the prompt of a terminal session:

```
/plugin install session-themes --marketplace Badmrpotatohead/session-themes
```

Answer `y` to add the marketplace, then pick a scope (the user scope makes it load in every session).

From a shell:

```
claude plugin install session-themes --marketplace Badmrpotatohead/session-themes
```

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with `Badmrpotatohead/session-themes`, then Add plugin.

Tested with Claude Code 2.1.330.

## Use

- The Look widget opens in the session rail of each desktop chat. Expand it to pick a theme, **Own color / Auto** (back to the folder's look) or **Plain**.
- `/look` opens the picker. `/look lanterns`, `/look plain` or `/look auto` switch directly.
- A chat keeps its pick, including after you resume it.
- Close the picker with its X and it stays closed in that chat until you run `/look`.

## Give your own projects a hand-drawn theme

Edit `hooks/config.ts` and map folder names to themes:

```ts
export const FOLDER_THEMES = [
  { folder: /^my-game/i, theme: 'lanterns' },
  { folder: /^(api|backend)$/i, theme: 'space' },
]
```

An installed plugin is a cached copy, so for your own changes fork this repository and install from your fork, or run a local copy with `claude --plugin-dir <folder>`.

## How it works

The mod sets the chat's look with `$.theme.set` when a session starts: a scene drawn as an SVG behind a solid conversation panel, plus a tint built from the look's hue. A chat with no look still sets a plain one, because the app keeps the last look it was sent. The picker is a pane opened as a widget. Tests are in `tests/`; run them with `claude plugin test`.

## License

MIT, for everything except `hooks/make-colors.js` and `hooks/make-colors.d.ts`: those are the color helper from Claude Code's mod-authoring kit, included unchanged as its instructions direct.
