# Chess Layout Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the chess game into the approved "option C" layout — icon rail left of the board, vertical captured-pieces rail right of the board, numbered two-column move log below the board, horizontal re-stacking under 620px.

**Architecture:** Pure helper `logRows()` added to `fx.js` (unit-tested, rebuilds log rows from the `moves[]` array). `ui.js` restructures its DOM assembly into `.chess-row [railL | pos | railR]` with icon-only rail buttons (labels kept in DOM, hidden on desktop). All styling lives in the chess section of `games.css` with a 620px media query using `display: contents` + `order` for mobile re-stacking. Engine/bot/sfx untouched.

**Tech Stack:** Vanilla ES modules, CSS (flexbox), Vitest. Spec: `docs/superpowers/specs/2026-09-21-chess-layout-design.md`.

**Conventions you must know:**
- `el(tag, cls, html)` (public/games/dom.js) sets **innerHTML**, not textContent — always `esc()` dynamic text passed to it (`esc` from `public/util.js`).
- Board square indices: 0 = a8 (top-left), +1 per file, +8 per rank down; e2 = 52, e4 = 36, g8 = 6, f6 = 21, d5 = 27, a7 = 8, a6 = 16.
- `squareName(sq)` (engine.js) returns algebraic names for the indices above.
- i18n resolver: `t(lang, key)` from `public/i18n.js`; lang is `'vi'` or `'en'`.
- Project is ESM (`"type": "module"`), so `node --check <file>` validates syntax without executing.
- Commit style: conventional commits (`feat:`, `test:`, `fix:`) with a body line, in English.

---

### Task 1: `logRows()` pure helper + `GLYPH` in fx.js (TDD)

**Files:**
- Modify: `public/games/chess/fx.js`
- Test: `test/games-chess-fx.test.js`

- [ ] **Step 1: Write the failing tests**

In `test/games-chess-fx.test.js`, extend the fx.js import (line 2-4) to include `logRows`:

```js
import {
  glideDelta, arrowPct, arrowHead, confettiSpec, traysFromMoves, prefersReducedMotion, logRows,
} from '../public/games/chess/fx.js';
```

Add this describe block after the `traysFromMoves` block (after line 98):

```js
describe('logRows', () => {
  const M = (mover, pt, from, to, capT = null) => ({ mv: { from, to }, mover, pt, capT });
  it('empty moves give no rows', () => {
    expect(logRows([])).toEqual([]);
  });
  it('pairs human move and bot reply in one numbered row', () => {
    const rows = logRows([M('w', 'p', 52, 36), M('b', 'n', 6, 21)]);
    expect(rows).toEqual([
      { n: 1, w: { txt: '♟ e2→e4', cap: false }, b: { txt: '♞ g8→f6', cap: false } },
    ]);
  });
  it('leaves b null after only the human move', () => {
    const rows = logRows([M('w', 'p', 52, 36)]);
    expect(rows).toHaveLength(1);
    expect(rows[0].n).toBe(1);
    expect(rows[0].w.txt).toBe('♟ e2→e4');
    expect(rows[0].b).toBeNull();
  });
  it('numbers each pair and flags captures', () => {
    const rows = logRows([
      M('w', 'p', 52, 36), M('b', 'n', 6, 21),
      M('w', 'p', 36, 27, 'n'),
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[1].n).toBe(2);
    expect(rows[1].w).toEqual({ txt: '♟ e4→d5 ×♞', cap: true });
    expect(rows[1].b).toBeNull();
  });
  it('bot-first move opens a row with w null (defensive)', () => {
    const rows = logRows([M('b', 'p', 8, 16)]);
    expect(rows).toEqual([
      { n: 1, w: null, b: { txt: '♟ a7→a6', cap: false } },
    ]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run test/games-chess-fx.test.js`
Expected: FAIL — `logRows` is not exported (import error or undefined function).

- [ ] **Step 3: Implement in fx.js**

In `public/games/chess/fx.js`, add an import right after the header comment (line 1), and the new exports after `traysFromMoves` (after line 73):

```js
import { squareName } from './engine.js';
```

```js
export const GLYPH = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' };

// Dựng hàng log từ moves[]: mỗi vòng đi = 1 hàng {n, w, b};
// w/b = {txt, cap}; b null khi bot chưa đáp, w null chỉ khi bot đi trước (phòng thủ).
export function logRows(moves) {
  const rows = [];
  for (const m of moves) {
    const txt = GLYPH[m.pt] + ' ' + squareName(m.mv.from) + '→' + squareName(m.mv.to)
      + (m.capT ? ' ×' + GLYPH[m.capT] : '');
    const cell = { txt, cap: !!m.capT };
    if (m.mover === 'w') {
      rows.push({ n: rows.length + 1, w: cell, b: null });
    } else if (rows.length) {
      rows[rows.length - 1].b = cell;
    } else {
      rows.push({ n: 1, w: null, b: cell });
    }
  }
  return rows;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run test/games-chess-fx.test.js`
Expected: PASS (all suites in the file).

- [ ] **Step 5: Commit**

```bash
git add public/games/chess/fx.js test/games-chess-fx.test.js
git commit -m "feat: add logRows helper and shared GLYPH to chess fx module"
```

---

### Task 2: ui.js — store `pt`, rebuild log with `renderLog()`

**Files:**
- Modify: `public/games/chess/ui.js`

- [ ] **Step 1: Switch GLYPH to the fx.js export**

In `public/games/chess/ui.js`, change line 10 import and delete the local GLYPH (line 13):

```js
import { glideDelta, arrowPct, arrowHead, confettiSpec, traysFromMoves, prefersReducedMotion, logRows, GLYPH } from './fx.js';
```

Delete: `const GLYPH = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' };`

- [ ] **Step 2: Store the moving piece type in `moves[]`**

In `describeMove()` (ui.js:95-108), add `pt` to the returned object:

```js
    return {
      txt,
      pt: p.t,
      capName: captured ? NAME[L][victim] : null,
      capVal: captured ? VAL[victim] : 0,
      victim: victim,
    };
```

In `afterMove()` (ui.js:212-214), change the push and replace the log append:

```js
  function afterMove(stBefore, m, info) {
    moves.push({ mv: m, mover: stBefore.turn, capT: info.victim, pt: info.pt });
    renderLog();
```

(delete the old `logEl.appendChild(el('span', '', esc(info.txt)));` line)

- [ ] **Step 3: Add `renderLog()`**

Add next to `renderTrays()` (after ui.js:88):

```js
  function renderLog() {
    logEl.innerHTML = '';
    for (const r of logRows(moves)) {
      logEl.appendChild(el('div', 'log-row',
        '<span class="log-n">' + r.n + '.</span>' +
        '<span class="log-w">' + (r.w ? esc(r.w.txt) : '') + '</span>' +
        '<span class="log-b">' + (r.b ? esc(r.b.txt) : '') + '</span>'));
    }
    logEl.scrollTop = logEl.scrollHeight;
  }
```

- [ ] **Step 4: Use it in undo and new game**

In the undo handler (ui.js:351-353), replace the child-removal loop:

```js
    renderLog();
```

(deletes: `for (let i = 0; i < popped; i++) { if (logEl.lastChild) logEl.removeChild(logEl.lastChild); }`)

In `newGame()` (ui.js:324), replace `logEl.innerHTML = '';` with:

```js
    renderLog();
```

(it must come after `moves = [];` — it already does in the existing order)

- [ ] **Step 5: Syntax check and full test suite**

Run: `node --check public/games/chess/ui.js`
Expected: no output (success).

Run: `npx vitest run`
Expected: all existing suites PASS (ui.js is not unit-tested; nothing may regress).

- [ ] **Step 6: Commit**

```bash
git add public/games/chess/ui.js
git commit -m "feat: rebuild chess move log from moves[] via renderLog"
```

---

### Task 3: ui.js — flanking-rails DOM + icon-only buttons

**Files:**
- Modify: `public/games/chess/ui.js`

- [ ] **Step 1: Update container declarations**

Replace ui.js:37-48 with:

```js
  const say = el('div', 'game-say');
  const wrap = el('div', 'chess-wrap');
  const row = el('div', 'chess-row');
  const railL = el('div', 'chess-rail rail-btns');
  const railR = el('div', 'chess-rail rail-caps');
  const boardEl = el('div', 'chessboard');
  boardEl.setAttribute('role', 'grid');
  boardEl.setAttribute('aria-label', L === 'en' ? 'Chess board' : 'Bàn cờ');
  const logEl = el('div', 'chess-log');
  const posEl = el('div', 'chess-pos');
  const fxEl = el('div', 'chess-fx');
  const trayW = el('div', 'tray');
  const trayB = el('div', 'tray');
```

(`traysEl` and `actions` are gone — nothing else references them after this task.)

- [ ] **Step 2: Hide the whole right rail when nothing is captured**

In `renderTrays()` (ui.js:86-87), keep the per-tray hides and add:

```js
    trayW.style.display = byW.length ? '' : 'none';
    trayB.style.display = byB.length ? '' : 'none';
    railR.style.display = (byW.length || byB.length) ? '' : 'none';
```

- [ ] **Step 3: Replace the five buttons with icon rail buttons**

Add a factory before the button definitions (was ui.js:330):

```js
  function railBtn(variant, iconHtml, label) {
    const b = el('button', 'gbtn rail' + (variant ? ' ' + variant : ''));
    b.type = 'button';
    b.title = label;
    b.setAttribute('aria-label', label);
    b.innerHTML = '<span class="bi" aria-hidden="true">' + iconHtml + '</span>' +
      '<span class="lbl">' + esc(label) + '</span>';
    return b;
  }
```

Replace the button creations (keep every existing click-handler body exactly as it is, only the creation lines change):

```js
  const hintBtn = railBtn('hint', '💡', t(L, 'chHint'));
  const undoBtn = railBtn('', '↶', t(L, 'chUndo'));
  const newBtn = railBtn('primary', '♔', t(L, 'chNewGame'));
  const backBtn = railBtn('', BACK_ARROW, t(L, 'gameBack'));
  const soundBtn = railBtn('ghost', isSoundOn() ? '🔊' : '🔇', t(L, isSoundOn() ? 'soundOn' : 'soundOff'));
```

In the sound toggle handler, replace the `soundBtn.textContent = ...` line (textContent would wipe the `.lbl` span) with:

```js
    soundBtn.querySelector('.bi').textContent = on ? '🔊' : '🔇';
    soundBtn.title = t(L, on ? 'soundOn' : 'soundOff');
```

(the `setAttribute('aria-label', ...)` line already there stays)

- [ ] **Step 4: Reassemble the mount tree**

Replace ui.js:401-417 (the actions appends and the old assembly) with:

```js
  railL.append(hintBtn, undoBtn, newBtn, soundBtn, backBtn);
  posEl.appendChild(boardEl);
  posEl.appendChild(fxEl);
  railR.append(trayW, trayB);
  row.append(railL, posEl, railR);
  wrap.appendChild(row);
  wrap.appendChild(logEl);

  body.appendChild(say);
  body.appendChild(wrap);
```

- [ ] **Step 5: Syntax check + tests**

Run: `node --check public/games/chess/ui.js` → no output.
Run: `npx vitest run` → all PASS.

- [ ] **Step 6: Commit**

```bash
git add public/games/chess/ui.js
git commit -m "feat: chess flanking rails DOM with icon-only buttons"
```

---

### Task 4: games.css — desktop layout

**Files:**
- Modify: `public/games/games.css` (chess section, lines 248-281 and 344-353)

- [ ] **Step 1: Update wrap/row/board rules**

Replace `.chess-wrap` (line 249) and `.chessboard` (250-257) max-width, and add row/rail rules:

```css
.chess-wrap { display: flex; flex-direction: column; gap: 14px; }
.chess-row { display: flex; gap: 12px; justify-content: center; align-items: flex-start; }
.chess-rail { display: flex; flex: 0 0 auto; }
.rail-btns { flex-direction: column; gap: 8px; }
.rail-caps {
  flex-direction: column; gap: 8px;
  background: var(--surface); border: 2px solid var(--border);
  border-radius: var(--radius); padding: 8px 7px; width: 78px;
}
.chessboard {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  grid-template-rows: repeat(8, minmax(0, 1fr));
  width: 100%; max-width: 500px; aspect-ratio: 1; margin-inline: auto;
  border-radius: 12px; overflow: hidden; border: 3px solid var(--chess);
  box-shadow: var(--shadow-md);
}
```

- [ ] **Step 2: Board wrapper sizing**

Replace `.chess-pos` (line 284):

```css
.chess-pos { position: relative; flex: 0 1 500px; }
```

- [ ] **Step 3: Replace the log styles**

Replace `.chess-log` (lines 277-281) with:

```css
.chess-log {
  width: 100%; max-width: 620px; margin-inline: auto;
  background: var(--surface); border: 2px solid var(--border); border-radius: var(--radius);
  padding: 8px 14px; max-height: 150px; overflow-y: auto;
  font-family: var(--font-display); font-size: 14px;
  display: flex; flex-direction: column; gap: 2px;
}
.chess-log:empty { display: none; }
.log-row { display: grid; grid-template-columns: 2.4em 1fr 1fr; gap: 10px; align-items: baseline; }
.log-n { color: var(--muted); font-weight: 600; font-size: 12.5px; }
.log-w { color: var(--fg); font-weight: 800; }
.log-b { color: var(--muted); font-weight: 700; }
```

- [ ] **Step 4: Rail button styles + vertical trays**

Add after the `.gbtn.ghost` rule (line 142):

```css
.gbtn.rail { flex-direction: column; gap: 3px; padding: 8px 10px; min-width: 46px; }
.gbtn.rail.ghost { padding: 8px 10px; min-height: 44px; font-size: 14px; }
.gbtn.rail .bi { display: grid; place-items: center; font-size: 18px; line-height: 1; }
.gbtn.rail .bi svg { width: 18px; height: 18px; }
.gbtn.rail .lbl { display: none; font-size: 10.5px; }
```

Replace the `.trays`/`.tray` block (lines 344-353) with:

```css
/* khay quân bị bắt — dải dọc phải bàn cờ */
.tray { display: flex; flex-direction: column; align-items: center; gap: 3px; }
.tray .t-label {
  font-family: var(--font-display); font-weight: 700; font-size: 9px;
  color: var(--muted); line-height: 1.2; text-align: center;
}
.tray .t-pcs {
  display: flex; flex-direction: column; flex-wrap: wrap; align-content: center;
  max-height: 212px; font-size: clamp(18px, 2.4vw, 24px); line-height: 1.1;
}
.tray .t-pcs.w { color: #8d97ad; }
.tray .t-pcs.b { color: #3c3a36; }
.rail-caps .tray + .tray { border-top: 2px dashed var(--border); padding-top: 8px; }
```

- [ ] **Step 5: Commit**

```bash
git add public/games/games.css
git commit -m "feat: chess desktop layout with flanking rails and numbered log"
```

---

### Task 5: games.css — mobile re-stacking (<620px)

**Files:**
- Modify: `public/games/games.css` (chess section, before the `prefers-reduced-motion` block at line 379)

- [ ] **Step 1: Add the media query**

```css
/* mobile: xếp lại — quân bị ăn → bàn cờ → log → hàng nút có chữ */
@media (max-width: 619px) {
  .chess-row { display: contents; }
  .rail-caps {
    order: -1; flex-direction: row; align-items: center; gap: 10px;
    width: auto; padding: 6px 10px;
  }
  .chess-pos { order: 0; flex: none; width: 100%; max-width: 460px; margin-inline: auto; }
  .chess-log { order: 1; }
  .rail-btns { order: 2; flex-direction: row; flex-wrap: wrap; justify-content: center; gap: 8px; }
  .gbtn.rail { flex-direction: row; gap: 6px; padding: 9px 14px; min-width: 0; }
  .gbtn.rail .lbl { display: inline; }
  .tray { flex-direction: row; align-items: center; gap: 6px; }
  .tray .t-pcs { flex-direction: row; max-height: none; flex-wrap: wrap; letter-spacing: 2px; }
  .rail-caps .tray + .tray { border-top: 0; padding-top: 0; border-left: 2px dashed var(--border); padding-left: 10px; }
}
```

- [ ] **Step 2: Commit**

```bash
git add public/games/games.css
git commit -m "feat: chess mobile re-stacking under 620px"
```

---

### Task 6: Visual verification and fixes

**Files:**
- Create (temporary, delete before commit): `public/repro-chess.html`
- Modify if fixes needed: `public/games/games.css`, `public/games/chess/ui.js`

- [ ] **Step 1: Serve the app root**

Run (background): `python -m http.server 8613 --directory public`

- [ ] **Step 2: Create the repro page**

`public/repro-chess.html`:

```html
<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="/styles.css">
<link rel="stylesheet" href="/games/games.css">
</head>
<body>
<div class="game-body" id="body"></div>
<script type="module">
import { renderChess } from '/games/chess/ui.js';
const top = document.createElement('div');
renderChess(document.getElementById('body'), { lang: 'vi', profileId: 'repro', top, back () {} });
// chơi 1.e4 để có dữ liệu log; bot tự đáp sau 450ms
const sq = (n) => document.querySelectorAll('.chessboard .sq')[n];
setTimeout(() => { sq(52).click(); setTimeout(() => sq(36).click(), 80); }, 150);
</script>
</body>
</html>
```

- [ ] **Step 3: Screenshot desktop and mobile**

```bash
E="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
[ -x "$E" ] || E="/c/Program Files/Microsoft/Edge/Application/msedge.exe"
mkdir -p /tmp/chess-layout
"$E" --headless=new --disable-gpu --window-size=1280,900 --virtual-time-budget=4000 --screenshot="/tmp/chess-layout/desktop.png" "http://localhost:8613/repro-chess.html"
"$E" --headless=new --disable-gpu --window-size=390,800 --virtual-time-budget=4000 --screenshot="/tmp/chess-layout/mobile.png" "http://localhost:8613/repro-chess.html"
```

Read both PNGs and verify:
- Desktop: icon rail left (💡 ↶ ♔ 🔊 ⬅, no text), board center ~500px, log card below with row `1. ♟ e2→e4 …`, say bubble on top.
- Mobile: order = board (caps rail hidden — no captures yet) → log → button row **with text labels**.

- [ ] **Step 4: DOM structure check**

```bash
"$E" --headless=new --disable-gpu --window-size=1280,900 --virtual-time-budget=4000 --dump-dom "http://localhost:8613/repro-chess.html"
```

Verify in output: `.chess-row` contains `.rail-btns`, `.chess-pos`, `.rail-caps`; `.rail-btns` has 5 `button.gbtn.rail`; no `.game-actions`; no `.trays` element.

- [ ] **Step 5: Check the capture rail with sample content**

Append a second script tag to `repro-chess.html` (module scripts run in document order, but the scripted move at ~230ms and the bot reply at ~680ms call `renderTrays()` which would wipe the preview — so inject after them):

```html
<script type="module">
// CSS preview: markup identical to renderTrays() output, để soi dải quân bị ăn
setTimeout(() => {
  const rail = document.querySelector('.rail-caps');
  rail.style.display = '';
  rail.children[0].innerHTML = '<span class="t-label">BẠN ĐÃ ĂN</span><span class="t-pcs b">♟♟♞♝♜</span>';
  rail.children[1].innerHTML = '<span class="t-label">BOT ĐÃ ĂN</span><span class="t-pcs w">♙♗</span>';
}, 800);
</script>
```

(With `--virtual-time-budget=4000` the 800ms timer fires before the screenshot.)

Re-take both screenshots and verify: right rail shows both trays vertically with the dashed divider; on mobile it becomes a horizontal strip above the board.

- [ ] **Step 6: Fix any visual issues found**

Iterate on `games.css` (spacing, tray wrap height, log width) — re-screenshot after each change. Keep changes within the chess section.

- [ ] **Step 7: Clean up and commit fixes**

```bash
rm public/repro-chess.html
git add public/games/games.css public/games/chess/ui.js
git commit -m "fix: polish chess rail layout from visual review"
```

(Skip commit if no fixes were needed.)

---

### Task 7: Full suite + wrap-up

**Files:** none new.

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: all suites PASS (`games-engine`, `games-bot`, `games-chess-fx` incl. `logRows`, `games-i18n`, plus any others present).

- [ ] **Step 2: Verify no stray files**

Run: `git status`
Expected: clean tree (repro deleted, all tasks committed).

- [ ] **Step 3: Stop the HTTP server**

Kill the background `python -m http.server 8613` process.
