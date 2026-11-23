// Which folders get which hand-drawn theme. Every other project gets an
// automatic look from its folder name, so this list can stay empty.
//
// `folder` is matched against each part of the session's folder path, deepest
// first; `theme` is one of: paper, lanterns, alchemy, space, aurora, music,
// dawn, studio (see THEMES in themes.ts).
//
// Example:
//   { folder: /^my-game/i, theme: 'lanterns' },
//   { folder: /^(api|backend)$/i, theme: 'space' },

export const FOLDER_THEMES: { folder: RegExp; theme: string }[] = []
