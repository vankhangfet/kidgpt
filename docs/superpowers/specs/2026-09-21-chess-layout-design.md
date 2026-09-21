# Chess Layout Redesign — Design Spec

Date: 2026-09-21
Status: Approved (layout option C chosen via visual mockups)

## Goal

Rework the chess game layout so that:

- Captured pieces sit in a vertical strip hugging the **right edge of the board**
  (top aligned with the first rank) — "góc phải trên".
- Action buttons (hint, undo, new game, sound, back) form a **thin vertical icon rail
  hugging the left edge of the board**.
- The move log stays **below the board** and is restyled as a numbered, two-column
  (you | bot) list.
- The board grows slightly (460px → 500px max) on desktop.

Chosen layout: **Option C — "Hai dải viền ôm sát bàn cờ"** (two flanking strips),
implemented with plain Flexbox (approach 1). Mobile collapses to: captures strip
(above board) → board → log → horizontal button row with labels.

## Current State

- `public/games/chess/ui.js` builds a single centered column inside `.game-body`:
  `say` bubble → `chess-wrap` (`chess-pos` board + `trays` + `chess-log`) →
  `game-actions` button row.
- Trays are two horizontal rows under the board; hidden until first capture;
  capped at 15 pieces (`renderTrays()`, ui.js:78-88).
- Log is a wrapping flex of bare spans (`♟ e2→e4 ×e5`), 120px scroll box
  (games.css:277-281). Moves are appended in `afterMove()` and removed one by one
  on undo.
- Buttons: New, Undo, Hint, Back, Sound — all text pills in `.game-actions`
  (ui.js:330-405).

## New DOM Structure (built in `renderChess()`)

```
body (.game-body)
├─ say (.game-say)                     unchanged
└─ wrap (.chess-wrap)
   ├─ row (.chess-row)                 NEW — flex row on desktop
   │  ├─ railL (.chess-rail.rail-btns) NEW — icon-only buttons
   │  │   hintBtn, undoBtn, newBtn, soundBtn, backBtn
   │  ├─ pos (.chess-pos)              unchanged inside (board + fx)
   │  └─ railR (.chess-rail.rail-caps) NEW — captured pieces, vertical
   │      trayW (chYouTook), trayB (chBotTook)
   └─ log (.chess-log)                 restyled, below the board
```

- `.game-actions` is no longer used by chess (CSS stays for other games).
- Rail button order (wireframe-approved): 💡 Hint → ↶ Undo → ♔ New → 🔊 Sound →
  ⬅ Back (back last).
- Icon-only buttons keep existing i18n keys as `aria-label` + `title`:
  `chHint`, `chUndo`, `chNewGame`, `soundOn`/`soundOff`, `gameBack`.
  No new i18n keys. Undo icon is the text glyph `↶`; Back reuses `BACK_ARROW`
  from `dom.js` (distinct from undo).
- Button variants keep their colors: hint = amber, new = teal primary,
  sound/back/undo = neutral; new `.gbtn.rail` class makes them square,
  icon-centered, min 44px tap target.

## Captured Pieces Rail (right)

- `railR`: white card, vertical column, top-aligned with the board top,
  width ~76px.
- Each tray: tiny 8px label (`chYouTook` / `chBotTook`) + pieces stacked
  vertically, wrapping into a second column past 8 pieces (cap stays 15).
- Color convention unchanged: pieces you captured render dark (`#3c3a36`),
  pieces the bot captured render grey (`#8d97ad`).
- Whole rail hidden (`display:none`) while no captures exist.
- Reuses `traysFromMoves()` from `fx.js` unchanged.

## Move Log (below board)

- One row per full move: `1. ♙ e2→e4 | ♞ g8→f6`.
  - Move number: light/muted.
  - Your move column: bold, dark text. Bot move column: muted grey.
  - Capture marker `×♛` kept from current `describeMove()` text format.
- White card, border, rounded; `max-height: 150px`; auto-scrolls to the newest
  move after each append.
- Implementation:
  - `moves[]` records gain `pt` (moving piece type) so text can be rebuilt
    without the pre-move state: `moves.push({ mv, mover, capT, pt })`.
  - New pure helper `logRows(moves)` in `public/games/chess/fx.js` returns
    `[{ n, w, b }]` where `w`/`b` are `{ txt, cap }` (text + capture flag);
    rows with only a human move have `b: null`.
  - `renderLog()` in ui.js rebuilds the whole list from `moves[]` after every
    move / undo / new game and scrolls to bottom. Replaces the current
    append-on-move / remove-on-undo logic.

## Responsive

- **Desktop (≥620px)**: `.chess-row { display: flex }` → `[railL | pos | railR]`;
  board `max-width` 460px → 500px (`.chess-pos` matches).
- **Mobile (<620px)**: `.chess-row { display: contents }` + `order` on the
  flex-column `.chess-wrap` yields: captures strip (horizontal, above board) →
  board → log → horizontal button row **with text labels** (like today).
  Tray/rail card styling moves onto `trayW`/`trayB` themselves on mobile so it
  survives `display: contents` on `railR`.

## Files Changed

| File | Change |
|---|---|
| `public/games/chess/ui.js` | new DOM assembly, icon rail buttons + a11y attrs, `renderLog()`, store `pt` in `moves[]`, drop `.game-actions` usage |
| `public/games/games.css` | chess section: `.chess-row`, `.chess-rail`, `.gbtn.rail`, vertical trays, restyled `.chess-log`, 620px media query, board 500px |
| `public/games/chess/fx.js` | add pure `logRows(moves)` helper |
| `test/games-chess-fx.test.js` | `logRows` tests: pairing you/bot, half row after human move, capture flag + numbering, behavior after undo-shaped inputs |

Unchanged: `engine.js`, `bot.js`, `sfx.js`, i18n keys, `games-i18n.test.js`,
`.game-actions` CSS, other games. Existing animations (glide, hint arrow, ghost
capture, confetti) keep working because `chess-pos`/`chess-fx` internals are
untouched.

## Testing

1. Unit (vitest): `logRows()` — empty moves; single human move → one row with
   `b: null`; human+bot pair in one row; numbering increments per pair;
   capture text contains `×` + victim glyph; 3 half-moves → 2 rows.
2. Existing suites stay green: `games-engine`, `games-bot`, `games-chess-fx`,
   `games-i18n`.
3. Visual check: headless Edge screenshots at 1280px and 390px widths —
   verify rail order, tray hiding when empty, log row pairing, mobile
   re-stacking order (caps → board → log → buttons).

## Out of Scope

- Material advantage score (+n) on the capture rail.
- Persistence of game state across language toggle (existing behavior:
  re-open resets the game).
- Any change to other games' layouts or shared hub styling.
