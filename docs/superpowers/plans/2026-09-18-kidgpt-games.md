# Sparkle Games (hub + 4 game, gồm cờ vua) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm menu "Trò chơi" trên subject rail dẫn tới game hub với 4 game client-side: Treasure Number, Word Quest, Puzzle Detective và Cờ vua (đấu bot + gợi ý).

**Architecture:** SPA view switch — nút Games trên rail ẩn `<section class="chat">`, hiện `<section id="gamesView">`. Mọi game là ES module thuần trong `public/games/`, không gọi API, tiến trình lưu localStorage theo profile. Engine cờ vua tự viết dạng pure functions + bot tìm 2 ply.

**Tech Stack:** Vanilla JS ES modules (không build step), CSS thuần theo design system hiện có (oklch, Baloo 2/Nunito), Vitest (node env).

**Spec:** `docs/superpowers/specs/2026-09-18-kidgpt-games-design.md`

**Lưu ý chạy lệnh:** mọi lệnh `git`/`npx` chạy từ repo root `C:\Working\FY26\DE\kidgpt`. Test chạy bằng `npx vitest run <file>` (không watch). Không sửa bất kỳ file nào trong `api/`.

---

### Task 1: Nút Games trên rail + view switch + i18n + tokens

**Files:**
- Modify: `public/styles.css` (thêm 2 token màu ở `:root` + fallback ở block `@supports`, thêm 2 rule rail)
- Modify: `public/index.html:39` (thêm `id="chatView"`), chèn section gamesView + link games.css
- Modify: `public/i18n.js` (thêm chuỗi UI games vào `STRINGS.vi` và `STRINGS.en`)
- Modify: `public/app.js` (icon `I.games`, nút rail, `setView`/`toggleGames`, games chip trong welcome, refresh ngôn ngữ)
- Test: `test/games-i18n.test.js` (create)

- [ ] **Step 1: Viết test thất bại**

Tạo `test/games-i18n.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { t, SUBJECTS } from '../public/i18n.js';

const SHARED = [
  'gamesLabel', 'gamesSay', 'gameGo', 'gameBack', 'gameReset', 'gemsLabel',
  'wqCast', 'dgCase', 'dgAccuse', 'dgNextCase',
  'chIntro', 'chNewGame', 'chUndo', 'chHint', 'chCheck', 'chCapture', 'chAte',
  'chWin', 'chLose', 'chDraw', 'chStats',
];

describe('games i18n keys', () => {
  it('has shared game ui strings in both languages', () => {
    for (const key of SHARED) {
      expect(typeof t('vi', key)).toBe('string');
      expect(typeof t('en', key)).toBe('string');
    }
    for (let i = 1; i <= 3; i++) {
      expect(t('vi', 'trLv' + i)).toBeTruthy();
      expect(t('en', 'trLv' + i)).toBeTruthy();
    }
    for (let i = 1; i <= 5; i++) {
      expect(t('vi', 'trNode' + i)).toBeTruthy();
      expect(t('en', 'trNode' + i)).toBeTruthy();
      expect(t('vi', 'wqZone' + i)).toBeTruthy();
      expect(t('en', 'wqZone' + i)).toBeTruthy();
    }
  });
  it('keeps games out of chat subjects (api contract)', () => {
    expect(SUBJECTS).not.toContain('games');
  });
});
```

- [ ] **Step 2: Chạy test xác nhận fail**

Run: `npx vitest run test/games-i18n.test.js`
Expected: FAIL — `typeof t('vi','gamesLabel')` là `'undefined'`.

- [ ] **Step 3: Thêm chuỗi i18n**

Trong `public/i18n.js`, thêm vào cuối object `STRINGS.vi` (trước dấu `}` đóng của `vi`, ngay sau key `fallbackPlan`):

```js
    gamesLabel: 'Trò chơi',
    gamesSay: 'Giờ chơi! 🎉 Chọn một game — mình ở bên cạnh, giúp bạn <strong>tự nghĩ ra</strong> đáp án nhé!',
    gameGo: 'Chơi',
    gameBack: 'Chọn game khác',
    gameReset: 'Xóa tiến trình',
    gemsLabel: 'Kim cương',
    trLv1: 'Nhà thám hiểm nhỏ',
    trLv2: 'Thợ săn kho báu',
    trLv3: 'Vua thám hiểm',
    trNode1: 'Đảo', trNode2: 'Rừng', trNode3: 'Cổng ma', trNode4: 'Hang cướp biển', trNode5: 'Kho báu',
    wqZone1: 'Vườn từ', wqZone2: 'Ngôi làng câu', wqZone3: 'Lâu đài ngữ pháp', wqZone4: 'Tháp thời gian', wqZone5: 'Vương quốc chuyện',
    wqCast: 'Niệm chú thuật',
    dgCase: 'Vụ án', dgAccuse: 'Tố cáo', dgNextCase: 'Vụ án kế tiếp',
    chIntro: 'Bạn cầm quân Trắng ♔ — chạm một quân để xem các nước đi. Cần giúp cứ bấm Gợi ý nhé!',
    chNewGame: 'Ván mới', chUndo: 'Đi lại', chHint: 'Gợi ý nước đi',
    chCheck: 'Cẩn thận — Vua của bạn đang bị chiếu! Hãy tìm cách cứu Vua.',
    chCapture: 'Tuyệt! Bạn ăn {name} — {n} điểm!',
    chAte: 'Ối, Sparkle Bot ăn {name} của bạn. Cứ bình tĩnh nhé!',
    chWin: 'Chiếu hết! Bạn thắng 🎉 Quá đỉnh!',
    chLose: 'Bot thắng ván này — không sao cả, thử lại nhé. Bạn làm được!',
    chDraw: 'Hết nước đi — ván hòa! Giỏi lắm!',
    chStats: 'Thắng {w} · Thua {l}',
```

Thêm vào cuối object `STRINGS.en` (sau `fallbackPlan` của `en`):

```js
    gamesLabel: 'Games',
    gamesSay: 'Playtime! 🎉 Pick a game — I\'ll be right beside you, helping you <strong>think it through</strong>!',
    gameGo: 'Play',
    gameBack: 'Choose another game',
    gameReset: 'Reset progress',
    gemsLabel: 'Gems',
    trLv1: 'Little Explorer',
    trLv2: 'Treasure Hunter',
    trLv3: 'Master Explorer',
    trNode1: 'Island', trNode2: 'Jungle', trNode3: 'Magic Gate', trNode4: 'Pirate Cave', trNode5: 'Treasure',
    wqZone1: 'Word Garden', wqZone2: 'Sentence Village', wqZone3: 'Grammar Castle', wqZone4: 'Time Tower', wqZone5: 'Story Kingdom',
    wqCast: 'Cast the spell',
    dgCase: 'Case', dgAccuse: 'Accuse', dgNextCase: 'Next mystery',
    chIntro: 'You play White ♔ — tap a piece to see its moves. Ask for a hint any time!',
    chNewGame: 'New game', chUndo: 'Undo', chHint: 'Hint',
    chCheck: 'Careful — your King is in check! Find a way to save it.',
    chCapture: 'Nice! You captured a {name} — {n} points!',
    chAte: 'Ouch, Sparkle Bot captured your {name}. Stay calm!',
    chWin: 'Checkmate! You won 🎉 Amazing!',
    chLose: 'The bot won this one — that\'s okay, try again. You can do it!',
    chDraw: 'No moves left — it\'s a draw! Well played!',
    chStats: 'Won {w} · Lost {l}',
```

- [ ] **Step 4: Chạy test xác nhận pass**

Run: `npx vitest run test/games-i18n.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Thêm token màu + style rail trong `public/styles.css`**

Ở `:root`, sau dòng `--english: oklch(60% 0.12 300);` thêm:

```css
  /* games */
  --games: oklch(60% 0.15 300);
  --chess: oklch(56% 0.12 155);
```

Trong block `@supports not (color: oklch(50% 0.1 200))` thêm vào cuối danh sách: `--games: #8a46d8; --chess: #2b9d6b;`

Sau dòng `.subject[data-subject="english"] .ic { color: var(--english); }` (khoảng dòng 189) thêm:

```css
.subject[data-subject="games"] .ic { color: var(--games); }
```

Và sau rule `.subject[data-subject="english"][aria-pressed="true"]` (khoảng dòng 200) thêm:

```css
.subject[data-subject="games"][aria-pressed="true"] { color: var(--games); background: #f6eefd; background: color-mix(in oklch,#fff 86%, var(--games)); }
```

- [ ] **Step 6: Sửa `public/index.html`**

Dòng 11, sau `<link rel="stylesheet" href="styles.css" />` thêm:

```html
  <link rel="stylesheet" href="games.css" />
```

Dòng 39, đổi `<section class="chat" aria-label="Chat với Sparkle">` thành:

```html
      <section class="chat" id="chatView" aria-label="Chat với Sparkle">
```

Sau thẻ đóng `</section>` của chat (trước `</div>` đóng `.main`, dòng 52-53), chèn:

```html
      <section class="games" id="gamesView" aria-label="Trò chơi" hidden></section>
```

- [ ] **Step 7: Sửa `public/app.js`**

7a. Thêm icon vào object `I` (sau dòng `curio:`):

```js
  games: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="8" width="20" height="10" rx="5"/><path d="M7 11v4M5 13h4"/><circle cx="15.5" cy="12" r=".9" fill="currentColor" stroke="none"/><circle cx="18.5" cy="14" r=".9" fill="currentColor" stroke="none"/></svg>',
```

7b. Thêm import ở đầu (sau dòng 5):

```js
import { showGames, hideGames, refreshGames } from './games/hub.js';
```

7c. Thêm 2 hàm sau `renderSuggests` (trước `applyLang`):

```js
function setView(games) {
  $('#chatView').hidden = games;
  $('#gamesView').hidden = !games;
  const gb = $('#rail .subject[data-subject="games"]');
  if (gb) gb.setAttribute('aria-pressed', String(games));
  if (games) {
    highlightSubject(null);
    showGames(currentProfile ? currentProfile.id : 'guest', lang);
  } else {
    hideGames();
  }
}

function toggleGames() { setView($('#gamesView').hidden); }
```

7d. Trong `renderRail()`, sau vòng `for (const s of SUBJECTS) {...}` (trước `}` đóng hàm), thêm:

```js
  const gbtn = document.createElement('button');
  gbtn.className = 'subject';
  gbtn.dataset.subject = 'games';
  gbtn.type = 'button';
  gbtn.setAttribute('aria-pressed', 'false');
  gbtn.innerHTML = '<span class="ic" aria-hidden="true">' + I.games + '</span><span class="label">' + esc(t(lang, 'gamesLabel')) + '</span>';
  gbtn.addEventListener('click', toggleGames);
  rail.appendChild(gbtn);
```

7e. Trong `welcome()`, sau vòng `for (const s of SUBJECTS) {...}` bên trong callback của `addMsg`, thêm:

```js
    const gc = document.createElement('button');
    gc.className = 'chip';
    gc.type = 'button';
    gc.innerHTML = I.games + esc(t(lang, 'gamesLabel'));
    gc.addEventListener('click', () => setView(true));
    chips.appendChild(gc);
```

7f. Trong `applyLang()`, thêm dòng cuối (sau `renderSuggests(forcedSubject);`):

```js
  refreshGames(lang);
```

Lưu ý: `public/games/hub.js` chưa tồn tại — tạo file tạm sau đó ở Task 3. Để app không crash giữa Task 1 và Task 3, **Task 1 commit sau khi đã tạo stub `public/games/hub.js`** (Step 8).

- [ ] **Step 8: Tạo stub `public/games/hub.js` để app chạy được**

```js
// Stub — hub thật ở Task 3.
export function showGames() {}
export function hideGames() {}
export function refreshGames() {}
```

- [ ] **Step 9: Kiểm tra app chạy không lỗi**

Run: `npx vitest run`
Expected: toàn bộ PASS (13 file cũ + games-i18n mới).

- [ ] **Step 10: Commit**

```bash
git add public/styles.css public/index.html public/i18n.js public/app.js public/games/hub.js test/games-i18n.test.js
git commit -m "feat: add games rail button, view switch and i18n strings"
```

---

### Task 2: `games/dom.js` + `games/progress.js` (localStorage wrapper)

**Files:**
- Create: `public/games/dom.js`
- Create: `public/games/progress.js`
- Test: `test/games-progress.test.js` (create)

- [ ] **Step 1: Viết test thất bại**

Tạo `test/games-progress.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { loadProgress, saveProgress, clearProgress } from '../public/games/progress.js';

describe('game progress storage', () => {
  const store = new Map();
  beforeEach(() => {
    store.clear();
    globalThis.localStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    };
  });

  it('returns null when nothing saved', () => {
    expect(loadProgress('p1', 'chess')).toBeNull();
  });

  it('saves and loads json per profile+game', () => {
    saveProgress('p1', 'chess', { won: 1, lost: 2 });
    expect(loadProgress('p1', 'chess')).toEqual({ won: 1, lost: 2 });
    expect(loadProgress('p2', 'chess')).toBeNull();
    expect(loadProgress('p1', 'treasure')).toBeNull();
  });

  it('clears saved progress', () => {
    saveProgress('p1', 'chess', { won: 1 });
    clearProgress('p1', 'chess');
    expect(loadProgress('p1', 'chess')).toBeNull();
  });

  it('falls back to in-memory when localStorage throws (private mode)', () => {
    globalThis.localStorage = {
      getItem() { throw new Error('denied'); },
      setItem() { throw new Error('denied'); },
      removeItem() { throw new Error('denied'); },
    };
    saveProgress('p1', 'chess', { won: 3 });
    expect(loadProgress('p1', 'chess')).toEqual({ won: 3 });
    clearProgress('p1', 'chess');
    expect(loadProgress('p1', 'chess')).toBeNull();
  });
});
```

- [ ] **Step 2: Chạy test xác nhận fail**

Run: `npx vitest run test/games-progress.test.js`
Expected: FAIL — Cannot find module `../public/games/progress.js`.

- [ ] **Step 3: Tạo `public/games/dom.js`**

```js
// Helper DOM nhỏ dùng chung cho các game module.
export const SPARK_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/><circle cx="12" cy="12" r="3.2"/></svg>';

export function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}

export function sayBubble(textHtml, kind) {
  const cls = 'game-say' + (kind ? ' ' + kind : '');
  return '<div class="' + cls + '"><div class="gs-av">' + SPARK_ICON + '</div><div class="gs-text">' + textHtml + '</div></div>';
}
```

- [ ] **Step 4: Tạo `public/games/progress.js`**

```js
// Tiến trình game theo profile — localStorage, fallback in-memory khi
// private mode throw. Key: kidgpt-games:<profileId>:<game>
const mem = new Map();

function key(profileId, game) {
  return 'kidgpt-games:' + profileId + ':' + game;
}

export function loadProgress(profileId, game) {
  const k = key(profileId, game);
  try {
    const raw = localStorage.getItem(k);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* private mode — rơi về mem */ }
  return mem.has(k) ? mem.get(k) : null;
}

export function saveProgress(profileId, game, data) {
  const k = key(profileId, game);
  mem.set(k, data);
  try { localStorage.setItem(k, JSON.stringify(data)); } catch (e) { /* bỏ qua */ }
}

export function clearProgress(profileId, game) {
  const k = key(profileId, game);
  mem.delete(k);
  try { localStorage.removeItem(k); } catch (e) { /* bỏ qua */ }
}
```

- [ ] **Step 5: Chạy test xác nhận pass**

Run: `npx vitest run test/games-progress.test.js`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add public/games/dom.js public/games/progress.js test/games-progress.test.js
git commit -m "feat: add games dom helpers and localStorage progress wrapper"
```

---

### Task 3: `games.css` (khung game) + `hub.js` (game hub + panel wrapper)

**Files:**
- Create: `public/games/games.css`
- Modify: `public/games/hub.js` (thay stub)

Không có unit test (thuần UI) — xác minh bằng mắt ở Step 4.

- [ ] **Step 1: Tạo `public/games/games.css`**

```css
/* Sparkle Games — port từ mock/game-mockup.html + bàn cờ */
:root {
  --treasure-sea: oklch(62% 0.12 220);
  --gold: oklch(80% 0.15 85);
  --gem: oklch(66% 0.15 180);
  --magic: oklch(58% 0.16 300);
  --magic-soft: oklch(95% 0.04 300);
  --sepia: oklch(55% 0.08 60);
  --sepia-soft: oklch(94% 0.04 70);
}
@supports not (color: oklch(50% 0.1 200)) {
  :root {
    --treasure-sea: #3a76ad; --gold: #e8c35a; --gem: #2aa5a0;
    --magic: #8a3cc0; --magic-soft: #f3e6fb; --sepia: #7a5c33; --sepia-soft: #f2e9d9;
  }
}

#gamesView {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
}
#gamesView[hidden] { display: none; }

.games-inner {
  width: 100%;
  max-width: 780px;
  margin-inline: auto;
  padding: clamp(14px, 3vw, 26px);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.games-topbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.games-topbar .gt-note {
  font-family: var(--font-display); font-weight: 700; font-size: 14px;
  color: var(--muted); margin-left: auto;
}

.gback {
  border: 2px solid var(--border); background: var(--surface); color: var(--fg);
  border-radius: var(--radius-pill); padding: 9px 16px; min-height: 44px;
  font-family: var(--font-display); font-weight: 700; font-size: 14px;
  cursor: pointer; display: inline-flex; align-items: center; gap: 7px;
}
.gback:hover { border-color: var(--tutor); color: var(--tutor); }
.gback svg { width: 16px; height: 16px; }

/* ---- game hub cards ---- */
.game-hub { display: grid; gap: 12px; }
@media (min-width: 620px) { .game-hub { grid-template-columns: repeat(2, 1fr); } }
.game-card {
  text-align: left; border: 2px solid var(--border); background: var(--surface);
  border-radius: var(--radius-lg); padding: 16px; cursor: pointer;
  display: flex; flex-direction: column; gap: 8px;
  box-shadow: var(--shadow-sm); font-family: var(--font-body); color: var(--fg);
  transition: transform .14s ease, border-color .14s, box-shadow .14s;
}
.game-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); border-color: currentColor; }
.game-card .gc-badge {
  width: 52px; height: 52px; border-radius: 16px; flex: none;
  display: grid; place-items: center; font-size: 30px; line-height: 1;
}
.game-card.treasure   { color: #2f6fb0; color: var(--treasure-sea); }
.game-card.treasure .gc-badge { background: #dcebf7; background: color-mix(in oklch, #fff 82%, var(--treasure-sea)); }
.game-card.wordquest  { color: #8a3cc0; color: var(--magic); }
.game-card.wordquest .gc-badge { background: #f3e6fb; background: var(--magic-soft); }
.game-card.detective  { color: #7a5c33; color: var(--sepia); }
.game-card.detective .gc-badge { background: #f2e9d9; background: var(--sepia-soft); }
.game-card.chessgame  { color: #2b8f5e; color: var(--chess); }
.game-card.chessgame .gc-badge { background: #ddf0e5; background: color-mix(in oklch, #fff 84%, var(--chess)); }
.game-card .gc-title { font-family: var(--font-display); font-weight: 800; font-size: 18px; color: var(--fg); }
.game-card .gc-desc { font-size: 14px; color: var(--muted); line-height: 1.4; }
.game-card .gc-go {
  margin-top: auto; align-self: flex-start; font-family: var(--font-display);
  font-weight: 700; font-size: 13px; display: inline-flex; align-items: center; gap: 6px;
}
.game-card .gc-go svg { width: 15px; height: 15px; }

/* ---- game panel ---- */
.game {
  width: 100%; border-radius: var(--radius-lg); border: 2px solid var(--border);
  background: var(--surface); box-shadow: var(--shadow-md); overflow: hidden;
}
.game-top { display: flex; align-items: center; gap: 12px; padding: 14px 18px; color: #fff; }
.game.treasure  .game-top { background: #3a76ad; background: linear-gradient(120deg, var(--treasure-sea), oklch(58% 0.13 200)); }
.game.wordquest .game-top { background: #7d35b5; background: linear-gradient(120deg, var(--magic), oklch(52% 0.16 320)); }
.game.detective .game-top { background: #6f5330; background: linear-gradient(120deg, var(--sepia), oklch(45% 0.07 50)); }
.game.chessgame .game-top { background: #2f8f60; background: linear-gradient(120deg, var(--chess), oklch(50% 0.1 170)); }
.game-top .gt-emoji { font-size: 26px; line-height: 1; }
.game-top .gt-title { font-family: var(--font-display); font-weight: 800; font-size: 18px; }
.game-top .gt-sub { font-size: 12.5px; opacity: .9; font-weight: 700; }
.game-top .gt-score {
  margin-left: auto; display: inline-flex; align-items: center; gap: 8px;
  background: rgba(255,255,255,.2); border-radius: var(--radius-pill); padding: 6px 12px;
  font-family: var(--font-display); font-weight: 800; font-size: 14px; white-space: nowrap;
}
.game-body { padding: 18px; display: grid; gap: 14px; }

/* ---- shared chrome ---- */
.game-say {
  display: grid; grid-template-columns: 34px 1fr; gap: 10px; align-items: start;
  background: #ddf2f1; background: var(--tutor-soft); border-radius: var(--radius); padding: 12px 14px;
}
.game-say .gs-av {
  width: 34px; height: 34px; border-radius: 50%; background: #fff; color: var(--tutor);
  display: grid; place-items: center;
}
.game-say .gs-av svg { width: 20px; height: 20px; }
.game-say .gs-text { font-size: 15px; line-height: 1.5; }
.game-say .gs-text strong { font-weight: 800; }
.game-say.warn { background: #faf0d7; background: var(--warn-soft); }
.game-say.win  { background: #ddf3e6; background: var(--success-soft); }

.opt-row { display: flex; flex-wrap: wrap; gap: 10px; }
.opt {
  min-width: 60px; min-height: 52px; padding: 8px 18px; border-radius: 16px;
  border: 2px solid var(--border); background: var(--surface);
  font-family: var(--font-display); font-weight: 800; font-size: 20px; color: var(--fg);
  cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  transition: transform .12s, border-color .12s, background .12s;
}
.opt:hover:not(:disabled) { transform: translateY(-2px); border-color: var(--treasure-sea); }
.opt.right { border-color: var(--success); background: var(--success-soft); color: oklch(42% 0.12 150); }
.opt.wrong { border-color: var(--warn); background: var(--warn-soft); }
.opt.reason { font-size: 15px; min-width: 0; text-align: left; justify-content: flex-start; flex: 1 1 100%; }

.game-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.gbtn {
  border: 2px solid var(--border); background: var(--surface); color: var(--fg);
  border-radius: var(--radius-pill); padding: 9px 16px; min-height: 44px;
  font-family: var(--font-display); font-weight: 700; font-size: 14px; cursor: pointer;
  display: inline-flex; align-items: center; gap: 7px;
  transition: transform .12s, border-color .12s, background .12s;
}
.gbtn:hover { transform: translateY(-1px); }
.gbtn.primary { background: var(--tutor); color: #fff; border-color: var(--tutor); }
.gbtn.hint { background: var(--warn-soft); border-color: color-mix(in oklch, #fff 55%, var(--warn)); color: oklch(52% 0.13 60); }
.gbtn.ghost { color: var(--muted); font-size: 12.5px; padding: 6px 12px; min-height: 34px; }

.level-row { display: flex; gap: 8px; flex-wrap: wrap; }
.level-pill {
  font-family: var(--font-display); font-weight: 700; font-size: 12px;
  padding: 5px 12px; border-radius: var(--radius-pill);
  background: var(--bg-2); color: var(--muted); border: 2px solid transparent;
}
.level-pill.active {
  background: color-mix(in oklch, #fff 80%, var(--treasure-sea));
  color: var(--treasure-sea); border-color: var(--treasure-sea);
}
.level-pill.magic.active {
  background: color-mix(in oklch, #fff 80%, var(--magic));
  color: var(--magic); border-color: var(--magic);
}
.level-pill.locked { opacity: .5; }

/* ---- treasure map ---- */
.treasure-map {
  position: relative; border-radius: var(--radius); padding: 16px; overflow: hidden;
  background:
    radial-gradient(120px 90px at 82% 26%, rgba(255,255,255,.35), transparent 70%),
    linear-gradient(180deg, oklch(78% 0.09 210), oklch(70% 0.11 220));
}
.tm-path { display: flex; align-items: center; justify-content: space-between; gap: 4px; position: relative; }
.tm-node { flex: 1; min-width: 0; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 4px; z-index: 1; }
.tm-node .tm-dot {
  width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center;
  font-size: 24px; line-height: 1; background: rgba(255,255,255,.75);
  border: 3px solid rgba(255,255,255,.9); box-shadow: var(--shadow-sm);
}
.tm-node .tm-label { font-family: var(--font-display); font-weight: 800; font-size: 11px; color: oklch(32% 0.06 240); }
.tm-node.done .tm-dot { background: var(--success-soft); border-color: var(--success); }
.tm-node.current .tm-dot { background: var(--gold, #e8c35a); border-color: #fff; transform: scale(1.14); }
.tm-node.locked .tm-dot { opacity: .55; filter: grayscale(.4); }
.tm-line {
  position: absolute; top: 23px; left: 8%; right: 8%; height: 4px; z-index: 0; opacity: .7;
  background: repeating-linear-gradient(90deg, #fff 0 8px, transparent 8px 16px);
}
.gem-tray { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.gem-tray .gt-cap { font-family: var(--font-display); font-weight: 800; font-size: 14px; color: var(--muted); }
.gems { display: flex; gap: 4px; flex-wrap: wrap; }
.gem {
  width: 20px; height: 20px; border-radius: 4px 4px 6px 6px;
  background: linear-gradient(160deg, color-mix(in oklch, #fff 45%, var(--gem, #2aa5a0)), var(--gem, #2aa5a0));
  box-shadow: inset 0 -3px 0 oklch(45% 0.12 190 / .5);
}
.gem.ghost { background: transparent; box-shadow: inset 0 0 0 2px var(--border); }

/* ---- word quest ---- */
.wq-scene { background: radial-gradient(200px 120px at 20% 0%, var(--magic-soft), transparent 70%), var(--bg); border-radius: var(--radius); padding: 14px; }
.wq-slots {
  display: flex; flex-wrap: wrap; gap: 8px; min-height: 62px; padding: 10px;
  border-radius: var(--radius); border: 2px dashed color-mix(in oklch, #fff 40%, var(--magic));
  background: color-mix(in oklch, #fff 70%, var(--magic-soft));
}
.wq-slot {
  min-width: 64px; min-height: 48px; padding: 6px; border-radius: 12px;
  border: 2px dashed color-mix(in oklch, #fff 55%, var(--magic));
  display: grid; place-items: center; background: rgba(255,255,255,.6); cursor: pointer;
}
.wq-slot.filled { border-style: solid; }
.wq-bank { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; min-height: 52px; }
.word-card {
  padding: 0 16px; min-height: 48px; border-radius: 14px;
  display: inline-flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-weight: 800; font-size: 20px;
  background: linear-gradient(170deg, #fff, color-mix(in oklch, #fff 78%, var(--magic)));
  color: oklch(38% 0.14 300); border: 2px solid color-mix(in oklch, #fff 55%, var(--magic));
  box-shadow: var(--shadow-sm); cursor: pointer; user-select: none;
}
.word-card.selected { outline: 3px solid var(--magic); transform: translateY(-2px); }
.word-card.locked { cursor: default; opacity: .85; }
.wq-crystal { display: grid; place-items: center; min-height: 90px; }
.wq-crystal svg { width: 100px; height: auto; transition: transform .4s ease; }
.wq-crystal.stage-1 svg { transform: scale(.55); }
.wq-crystal.stage-2 svg { transform: scale(.75); }
.wq-crystal.stage-3 svg { transform: scale(.9); }
.wq-crystal.stage-4 svg { transform: scale(1.05); }

/* ---- detective ---- */
.suspects { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
.suspect {
  flex: 1 1 90px; max-width: 130px; text-align: center; border: 2px solid var(--border);
  border-radius: var(--radius); padding: 12px 8px; background: var(--surface); cursor: default;
}
.suspect.pickable { cursor: pointer; }
.suspect.pickable:hover { transform: translateY(-3px); border-color: var(--sepia); }
.suspect .sp-face { font-size: 40px; line-height: 1; }
.suspect .sp-name { font-family: var(--font-display); font-weight: 800; font-size: 14px; margin-top: 4px; }
.suspect.accused { border-color: var(--sepia); background: var(--sepia-soft); }
.suspect.culprit { border-color: var(--success); background: var(--success-soft); }
.suspect.cleared { opacity: .5; }
.clue-list { display: grid; gap: 8px; }
.clue {
  display: grid; grid-template-columns: 34px 1fr; gap: 10px; align-items: start;
  border: 2px solid var(--border); border-radius: var(--radius); padding: 10px 12px;
  background: var(--sepia-soft);
}
.clue .cl-face { font-size: 24px; line-height: 1; }
.clue .cl-text { font-size: 14.5px; line-height: 1.45; }
.clue .cl-text .cl-who { font-family: var(--font-display); font-weight: 800; }
.clue.flag { border-color: var(--warn); }

/* ---- chess ---- */
.chess-wrap { display: grid; gap: 14px; }
.chessboard {
  display: grid; grid-template-columns: repeat(8, 1fr);
  width: 100%; max-width: 460px; aspect-ratio: 1; margin-inline: auto;
  border-radius: 12px; overflow: hidden; border: 3px solid var(--chess);
  box-shadow: var(--shadow-md);
}
.chessboard.over { filter: saturate(.7); }
.sq {
  position: relative; border: 0; padding: 0; cursor: pointer;
  display: grid; place-items: center; font-size: clamp(22px, 5.5vw, 40px); line-height: 1;
}
.sq.light { background: #f0d9b5; }
.sq.dark  { background: #b58863; }
.sq .pc { pointer-events: none; }
.sq .pc.w { color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,.55); }
.sq .pc.b { color: #24211d; text-shadow: 0 1px 1px rgba(255,255,255,.25); }
.sq.sel { outline: 3px solid var(--chess); outline-offset: -3px; }
.sq.dest::after {
  content: ''; position: absolute; width: 26%; height: 26%; border-radius: 50%;
  background: rgba(30, 120, 70, .55);
}
.sq.dest.cap::after {
  width: 86%; height: 86%; background: transparent; border: 4px solid rgba(200, 60, 50, .8);
}
.sq.chk { background: #e06a55 !important; }
.sq.hintmark { outline: 3px solid var(--gold, #e8c35a); outline-offset: -3px; }
.chess-log {
  max-height: 120px; overflow-y: auto; font-family: var(--font-display);
  font-weight: 700; font-size: 14px; color: var(--muted);
  display: flex; flex-wrap: wrap; gap: 6px 14px;
}
```

- [ ] **Step 2: Thay `public/games/hub.js` bằng hub thật**

```js
import { el, sayBubble } from './dom.js';
import { esc } from '../util.js';
import { t } from '../i18n.js';
import { renderTreasure } from './treasure.js';
import { renderWordQuest } from './wordquest.js';
import { renderDetective } from './detective.js';
import { renderChess } from './chess/ui.js';

const BACK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>';
const GO_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

const GAMES = [
  {
    id: 'treasure', cls: 'treasure', emoji: '🗺️',
    title: { vi: 'Kho báu số học', en: 'Treasure Number' },
    desc: {
      vi: 'Giải toán để mở Kho báu thất truyền — vượt 5 chặng, lấp đầy khay kim cương!',
      en: 'Solve math to unlock the Lost Treasure — cross 5 checkpoints and fill your gem tray!',
    },
    render: renderTreasure,
  },
  {
    id: 'wordquest', cls: 'wordquest', emoji: '📚',
    title: { vi: 'Hành trình chữ', en: 'Word Quest' },
    desc: {
      vi: 'Sắp các thẻ chữ về đúng thứ tự để niệm chú thuật và nuôi lớn tinh thể phép thuật.',
      en: 'Put the mixed-up words back in order to cast the spell and grow your magic crystal.',
    },
    render: renderWordQuest,
  },
  {
    id: 'detective', cls: 'detective', emoji: '🕵️',
    title: { vi: 'Thám tử nhỏ', en: 'Puzzle Detective' },
    desc: {
      vi: 'Đọc manh mối, suy luận từng bước cùng Sparkle và tự tay phá 3 vụ án.',
      en: 'Read the clues, reason step by step with Sparkle, and crack all 3 cases yourself.',
    },
    render: renderDetective,
  },
  {
    id: 'chess', cls: 'chessgame', emoji: '♟️',
    title: { vi: 'Cờ vua cùng Sparkle', en: 'Chess with Sparkle' },
    desc: {
      vi: 'Đấu với Sparkle Bot — chạm quân xem nước đi hợp lệ, cần gợi ý cứ bấm!',
      en: 'Play the Sparkle Bot — tap a piece to see its moves, ask for a hint any time!',
    },
    render: renderChess,
  },
];

let current = null; // 'hub' | gameId
let ctx = null;     // { profileId, lang }

export function showGames(profileId, lang) {
  ctx = { profileId, lang };
  current = 'hub';
  renderHub();
}

export function hideGames() {
  const v = document.getElementById('gamesView');
  if (v) v.innerHTML = '';
  current = null;
}

export function refreshGames(lang) {
  if (!ctx || !current) return;
  ctx.lang = lang;
  if (current === 'hub') renderHub();
  else openGame(current);
}

function view() { return document.getElementById('gamesView'); }

function topbar() {
  const bar = el('div', 'games-topbar');
  const back = el('button', 'gback', BACK_SVG + esc(t(ctx.lang, 'gameBackChat')));
  back.type = 'button';
  back.addEventListener('click', () => {
    const chat = document.getElementById('chatView');
    if (chat) {
      document.getElementById('gamesView').hidden = true;
      chat.hidden = false;
      const gb = document.querySelector('#rail .subject[data-subject="games"]');
      if (gb) gb.setAttribute('aria-pressed', 'false');
    }
  });
  bar.appendChild(back);
  return bar;
}

function renderHub() {
  const v = view();
  v.innerHTML = '';
  const inner = el('div', 'games-inner');
  inner.appendChild(topbar());
  inner.insertAdjacentHTML('beforeend', sayBubble(t(ctx.lang, 'gamesSay')));
  const hub = el('div', 'game-hub');
  for (const g of GAMES) {
    const card = el('button', 'game-card ' + g.cls);
    card.type = 'button';
    card.innerHTML =
      '<span class="gc-badge">' + g.emoji + '</span>' +
      '<div class="gc-title">' + esc(g.title[ctx.lang]) + '</div>' +
      '<div class="gc-desc">' + esc(g.desc[ctx.lang]) + '</div>' +
      '<span class="gc-go">' + esc(t(ctx.lang, 'gameGo')) + ' ' + GO_SVG + '</span>';
    card.addEventListener('click', () => openGame(g.id));
    hub.appendChild(card);
  }
  inner.appendChild(hub);
  v.appendChild(inner);
}

function openGame(id) {
  const g = GAMES.find((x) => x.id === id);
  if (!g) return;
  current = id;
  const v = view();
  v.innerHTML = '';
  const inner = el('div', 'games-inner');
  inner.appendChild(topbar());
  const panel = el('div', 'game ' + g.cls);
  const top = el('div', 'game-top',
    '<span class="gt-emoji">' + g.emoji + '</span>' +
    '<span><div class="gt-title">' + esc(g.title[ctx.lang]) + '</div></span>');
  const body = el('div', 'game-body');
  panel.appendChild(top);
  panel.appendChild(body);
  inner.appendChild(panel);
  v.appendChild(inner);
  g.render(body, {
    lang: ctx.lang,
    profileId: ctx.profileId,
    top,
    back: () => { current = 'hub'; renderHub(); },
  });
}
```

Chú ý: `gameBackChat` là key i18n mới — thêm vào Task 1 đã commit? **Chưa** — thêm ngay ở Step 2b dưới đây.

- [ ] **Step 2b: Thêm key `gameBackChat` vào `public/i18n.js`**

`STRINGS.vi`: `gameBackChat: 'Quay lại học với Sparkle',` (đặt cạnh `gameBack`)
`STRINGS.en`: `gameBackChat: 'Back to learning with Sparkle',`
Cập nhật mảng `SHARED` trong `test/games-i18n.test.js` thêm `'gameBackChat',`.

Vì hub.js import các module game chưa tồn tại (treasure.js...), tạo **stub tạm** cho 4 module ở Step 2c để app không crash — các task sau thay bằng bản thật.

- [ ] **Step 2c: Tạo stub cho 4 game module**

`public/games/treasure.js`:
```js
export function renderTreasure() {}
```
`public/games/wordquest.js`:
```js
export function renderWordQuest() {}
```
`public/games/detective.js`:
```js
export function renderDetective() {}
```
`public/games/chess/ui.js`:
```js
export function renderChess() {}
```

- [ ] **Step 3: Chạy toàn bộ test**

Run: `npx vitest run`
Expected: PASS hết (kể cả games-i18n với key mới).

- [ ] **Step 4: Kiểm tra thủ công**

Run: `npx vercel dev` → mở app, đăng nhập, chọn profile → bấm nút **Trò chơi** trên rail:
- Hub hiện 4 card đúng màu, bấm Back quay lại chat, state chat còn nguyên
- Đổi ngôn ngữ (EN/VI) khi đang ở hub → text hub đổi
- Bấm card bất kỳ → panel game rỗng (stub) + topbar Back về hub

- [ ] **Step 5: Commit**

```bash
git add public/games/games.css public/games/hub.js public/games/treasure.js public/games/wordquest.js public/games/detective.js public/games/chess/ui.js public/i18n.js test/games-i18n.test.js
git commit -m "feat: add games css chrome and hub with 4 game cards"
```

---

### Task 4: Treasure Number — bộ sinh câu hỏi (pure) + tests

**Files:**
- Modify: `public/games/treasure.js` (thay stub bằng phần logic thuần; render UI ở Task 5)
- Test: `test/games-treasure.test.js` (create)

- [ ] **Step 1: Viết test thất bại**

Tạo `test/games-treasure.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { TREASURE_LEVELS, makeQuestion, makeOptions, hintFor } from '../public/games/treasure.js';

describe('treasure question generator', () => {
  it('has 3 levels, lv3 has all 4 ops', () => {
    expect(TREASURE_LEVELS).toHaveLength(3);
    expect(TREASURE_LEVELS[2].ops).toEqual(expect.arrayContaining(['add', 'sub', 'mul', 'div']));
  });

  it('level 1 stays within 0..20', () => {
    for (let i = 0; i < 200; i++) {
      const q = makeQuestion(1);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThanOrEqual(20);
    }
  });

  it('level 2 stays within 0..100', () => {
    for (let i = 0; i < 200; i++) {
      const q = makeQuestion(2);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThanOrEqual(100);
    }
  });

  it('level 3 division is exact, multiplication = a*b', () => {
    for (let i = 0; i < 200; i++) {
      const q = makeQuestion(3);
      if (q.op === 'div') expect(q.a % q.b).toBe(0);
      if (q.op === 'mul') expect(q.answer).toBe(q.a * q.b);
    }
  });

  it('every question has exactly 3 distinct options including the answer, all >= 0', () => {
    for (let lv = 1; lv <= 3; lv++) {
      for (let i = 0; i < 100; i++) {
        const q = makeQuestion(lv);
        expect(q.options).toHaveLength(3);
        expect(new Set(q.options).size).toBe(3);
        expect(q.options).toContain(q.answer);
        for (const o of q.options) expect(o).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('makeOptions builds distractors without the answer duplicated', () => {
    const opts = makeOptions(12, 'sub', 20, 8);
    expect(opts).toHaveLength(3);
    expect(new Set(opts).size).toBe(3);
    expect(opts).toContain(12);
  });

  it('hintFor fills operands for both langs and steps', () => {
    const q = { op: 'add', a: 6, b: 6, answer: 12 };
    expect(hintFor(q, 0, 'vi')).toContain('6');
    expect(hintFor(q, 1, 'en')).toContain('6');
  });
});
```

- [ ] **Step 2: Chạy test xác nhận fail**

Run: `npx vitest run test/games-treasure.test.js`
Expected: FAIL — `renderTreasure` stub không export `makeQuestion`.

- [ ] **Step 3: Viết phần logic thuần trong `public/games/treasure.js`**

Giữ nguyên dòng `export function renderTreasure() {}` ở cuối (Task 5 thay bằng UI thật). Thêm vào trước nó:

```js
export const TREASURE_LEVELS = [
  { id: 1, ops: ['add', 'sub'] },
  { id: 2, ops: ['add', 'sub'] },
  { id: 3, ops: ['add', 'sub', 'mul', 'div'] },
];
export const NODE_EMOJIS = ['🏝️', '🌴', '🔐', '🏴‍☠️', '💎'];
export const QUESTIONS_PER_NODE = 3;
export const GEMS_PER_LEVEL = 15;

const OP_SYM = { add: '+', sub: '−', mul: '×', div: '÷' };

const HINTS = {
  add: {
    vi: ['Gộp {a} và {b} lại với nhau — đếm thử nhé!', 'Đếm tiếp từ {a}: thêm {b} bước nữa thôi.'],
    en: ['Put {a} and {b} together — try counting!', 'Count on from {a}: just {b} more steps.'],
  },
  sub: {
    vi: ['Bớt {b} khỏi {a} — còn lại bao nhiêu?', 'Đếm lùi từ {a} đúng {b} bước nhé.'],
    en: ['Take {b} away from {a} — how many are left?', 'Count back from {a} exactly {b} steps.'],
  },
  mul: {
    vi: ['{a} nhóm, mỗi nhóm {b} — cộng dồn thử xem!', 'Nhẩm bảng nhân rồi: {a} nhân {b} bằng mấy nhỉ?'],
    en: ['{a} groups of {b} — try adding them up!', 'Times tables: what is {a} times {b}?'],
  },
  div: {
    vi: ['Chia đều {a} vào {b} nhóm — mỗi nhóm mấy?', 'Nhẩm bảng nhân: {b} nhân mấy thì bằng {a}?'],
    en: ['Share {a} into {b} equal groups — how many each?', 'Times tables: {b} times what makes {a}?'],
  },
};

function ri(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }

export function makeQuestion(levelId) {
  const lv = TREASURE_LEVELS[levelId - 1];
  const op = lv.ops[ri(0, lv.ops.length - 1)];
  let a, b, answer;
  if (op === 'add') {
    if (levelId === 1) { a = ri(2, 10); b = ri(2, Math.min(10, 20 - a)); }
    else { a = ri(11, 80); b = ri(11, Math.min(19, 100 - a)); }
    answer = a + b;
  } else if (op === 'sub') {
    if (levelId === 1) { a = ri(5, 20); b = ri(1, a - 1); }
    else { a = ri(25, 100); b = ri(11, a - 11); }
    answer = a - b;
  } else if (op === 'mul') {
    a = ri(2, 9); b = ri(2, 9); answer = a * b;
  } else {
    b = ri(2, 9); answer = ri(2, 9); a = b * answer;
  }
  return { op, a, b, answer, options: makeOptions(answer, op, a, b) };
}

export function makeOptions(answer, op, a, b) {
  const cands = [answer + 1, answer - 1, op === 'sub' ? a + b : Math.abs(a - b), answer + 10, answer - 10, answer + 2];
  const opts = [answer];
  for (const c of cands) {
    if (opts.length >= 3) break;
    if (c >= 0 && !opts.includes(c)) opts.push(c);
  }
  while (opts.length < 3) opts.push(answer + opts.length + 3);
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return opts;
}

export function hintFor(q, step, lang) {
  const pair = HINTS[q.op][lang] || HINTS[q.op].vi;
  const tpl = pair[Math.min(step, pair.length - 1)];
  return tpl.replace('{a}', q.a).replace('{b}', q.b);
}

export function questionPrompt(q, lang, nodeName) {
  const sym = OP_SYM[q.op];
  if (lang === 'en') return '🧩 <strong>' + esc(nodeName) + '</strong><br>The code is: <strong>' + q.a + ' ' + sym + ' ' + q.b + '</strong>. What is it?';
  return '🧩 <strong>' + esc(nodeName) + '</strong><br>Cổng cần mã: <strong>' + q.a + ' ' + sym + ' ' + q.b + '</strong>. Mã số là bao nhiêu?';
}
```

Cần `import { esc } from '../util.js';` ở đầu file.

- [ ] **Step 4: Chạy test xác nhận pass**

Run: `npx vitest run test/games-treasure.test.js`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add public/games/treasure.js test/games-treasure.test.js
git commit -m "feat: treasure number question generator with hint ladder"
```

---

### Task 5: Treasure Number — UI (bản đồ, gem, luồng hint)

**Files:**
- Modify: `public/games/treasure.js` (thay `renderTreasure` stub bằng UI thật)

Không thêm unit test (UI) — Task 4 đã test logic. Kiểm tra thủ công ở Step 3.

- [ ] **Step 1: Thay `export function renderTreasure() {}` bằng implementation**

```js
export function renderTreasure(body, ctx) {
  const L = ctx.lang;
  let save = loadProgress(ctx.profileId, 'treasure') ||
    { level: 1, maxLevel: 1, node: 0, qIdx: 0, gems: 0, total: 0 };
  let q = null;
  let wrong = 0;

  const score = el('span', 'gt-score', '💎 ' + save.total);
  ctx.top.appendChild(score);

  const levelRow = el('div', 'level-row');
  const mapEl = el('div', 'treasure-map');
  const tray = el('div', 'gem-tray');
  const say = el('div', 'game-say');
  const opts = el('div', 'opt-row');
  const actions = el('div', 'game-actions');

  function persist() {
    saveProgress(ctx.profileId, 'treasure', save);
    score.textContent = '💎 ' + save.total;
  }

  function drawLevels() {
    levelRow.innerHTML = '';
    TREASURE_LEVELS.forEach((lv) => {
      const pill = el('span', 'level-pill' + (lv.id === save.level ? ' active' : ''));
      pill.textContent = 'Lv ' + lv.id + ' · ' + t(L, 'trLv' + lv.id);
      if (lv.id > save.maxLevel) pill.classList.add('locked');
      else if (lv.id !== save.level) {
        pill.style.cursor = 'pointer';
        pill.title = t(L, 'gameGo');
        pill.addEventListener('click', () => {
          save.level = lv.id; save.node = 0; save.qIdx = 0; save.gems = 0;
          persist(); draw(); newQ();
        });
      }
      levelRow.appendChild(pill);
    });
  }

  function drawMap() {
    mapEl.innerHTML = '';
    const path = el('div', 'tm-path');
    path.appendChild(el('div', 'tm-line'));
    NODE_EMOJIS.forEach((e, i) => {
      const cls = i < save.node ? ' done' : i === save.node ? ' current' : ' locked';
      path.appendChild(el('div', 'tm-node' + cls,
        '<div class="tm-dot">' + e + '</div><div class="tm-label">' + esc(t(L, 'trNode' + (i + 1))) + '</div>'));
    });
    mapEl.appendChild(path);
  }

  function drawTray() {
    tray.innerHTML = '<span class="gt-cap">' + esc(t(L, 'gemsLabel')) + ' · ' + save.gems + '/' + GEMS_PER_LEVEL + '</span>';
    const gems = el('div', 'gems');
    for (let i = 0; i < GEMS_PER_LEVEL; i++) gems.appendChild(el('span', 'gem' + (i < save.gems ? '' : ' ghost')));
    tray.appendChild(gems);
  }

  function sayMsg(html, kind) {
    say.className = 'game-say' + (kind ? ' ' + kind : '');
    say.innerHTML = '<div class="gs-av">' + SPARK_ICON + '</div><div class="gs-text">' + html + '</div>';
  }

  function draw() { drawLevels(); drawMap(); drawTray(); }

  function newQ() {
    wrong = 0;
    q = makeQuestion(save.level);
    sayMsg(questionPrompt(q, L, t(L, 'trNode' + (save.node + 1))));
    drawOpts();
  }

  function drawOpts() {
    opts.innerHTML = '';
    q.options.forEach((v) => {
      const b = el('button', 'opt', esc(String(v)));
      b.type = 'button';
      b.addEventListener('click', () => onPick(b, v));
      opts.appendChild(b);
    });
  }

  function cheer() {
    const list = STRINGS[L].cheers;
    return list[Math.floor(Math.random() * list.length)];
  }

  function onPick(btn, v) {
    if (v === q.answer) {
      btn.classList.add('right');
      opts.querySelectorAll('button').forEach((x) => { x.disabled = true; });
      save.gems += 1;
      save.total += 1;
      save.qIdx += 1;
      persist();
      if (save.qIdx >= QUESTIONS_PER_NODE) {
        save.node += 1;
        save.qIdx = 0;
        if (save.node >= NODE_EMOJIS.length) levelDone();
        else nodeDone();
      } else {
        sayMsg('✨ <strong>' + esc(cheer()) + '</strong>', 'win');
        setTimeout(newQ, 700);
      }
      persist();
      drawMap();
      drawTray();
    } else {
      btn.classList.add('wrong');
      wrong += 1;
      sayMsg('💡 ' + esc(hintFor(q, Math.min(wrong, 2) - 1, L)), 'warn');
    }
  }

  function nodeDone() {
    draw();
    sayMsg('🎉 <strong>' + esc(t(L, 'trNode' + save.node)) + '</strong> — ' +
      (L === 'en' ? 'checkpoint cleared! On we go!' : 'qua chặng rồi, tiến tiếp nào!'), 'win');
    setTimeout(newQ, 900);
  }

  function levelDone() {
    if (save.level < TREASURE_LEVELS.length) {
      save.maxLevel = Math.max(save.maxLevel, save.level + 1);
      save.level += 1;
      save.node = 0; save.qIdx = 0; save.gems = 0;
      persist(); draw();
      sayMsg('🏆 <strong>' + esc(t(L, 'trLv' + save.level)) + '</strong> — ' +
        (L === 'en' ? 'level complete! A new island map unlocks!' : 'hoàn thành cấp độ! Mở bản đồ mới!'), 'win');
      setTimeout(newQ, 1100);
    } else {
      save.node = 0; save.qIdx = 0; save.gems = 0;
      persist(); draw();
      sayMsg('🏴‍☠️💎 <strong>' + (L === 'en' ? 'The Lost Treasure is YOURS!' : 'Kho báu thất truyền là của bạn!') +
        '</strong> ' + (L === 'en' ? 'Play this level again or collect more gems!' : 'Chơi lại cấp này hoặc gom thêm kim cương nhé!'), 'win');
      setTimeout(newQ, 1100);
    }
  }

  const hintBtn = el('button', 'gbtn hint', '💡 ' + esc(t(L, 'needHint')));
  hintBtn.type = 'button';
  hintBtn.addEventListener('click', () => {
    if (!q) return;
    sayMsg('💡 ' + esc(hintFor(q, 0, L)), 'warn');
  });

  const resetBtn = el('button', 'gbtn ghost', esc(t(L, 'gameReset')));
  resetBtn.type = 'button';
  resetBtn.addEventListener('click', () => {
    clearProgress(ctx.profileId, 'treasure');
    save = { level: 1, maxLevel: 1, node: 0, qIdx: 0, gems: 0, total: 0 };
    persist(); draw(); newQ();
  });

  const backBtn = el('button', 'gbtn', BACK_ARROW + esc(t(L, 'gameBack')));
  backBtn.type = 'button';
  backBtn.addEventListener('click', ctx.back);

  actions.appendChild(hintBtn);
  actions.appendChild(backBtn);
  actions.appendChild(resetBtn);

  body.appendChild(levelRow);
  body.appendChild(mapEl);
  body.appendChild(tray);
  body.appendChild(say);
  body.appendChild(opts);
  body.appendChild(actions);

  draw();
  newQ();
}
```

Cập nhật imports đầu file `treasure.js`:

```js
import { el, SPARK_ICON } from './dom.js';
import { esc } from '../util.js';
import { t, STRINGS } from '../i18n.js';
import { loadProgress, saveProgress, clearProgress } from './progress.js';
```

Và thêm hằng dùng chung (đặt trong `dom.js` để các game khác dùng lại):

```js
export const BACK_ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>';
```

(sửa import thành `import { el, SPARK_ICON, BACK_ARROW } from './dom.js';`)

- [ ] **Step 2: Chạy toàn bộ test**

Run: `npx vitest run`
Expected: PASS hết (không test nào import UI mới).

- [ ] **Step 3: Kiểm tra thủ công**

`npx vercel dev` → Trò chơi → Kho báu số học:
- Bản đồ 5 chặng, node hiện tại scale vàng, khay 15 gem có ghost
- Trả lời sai → bong bóng warn với hint 1, sai tiếp → hint 2, không bao giờ lộ đáp án
- Trả lời đúng 3 câu → qua chặng; hết 5 chặng → mở Lv2, gem reset, tổng gem giữ nguyên
- Nút "Xóa tiến trình" reset về Lv1; nút "Chọn game khác" về hub; reload trang giữ tiến trình

- [ ] **Step 4: Commit**

```bash
git add public/games/treasure.js public/games/dom.js
git commit -m "feat: treasure number game ui with map, gems and hint ladder"
```

---

### Task 6: Word Quest — dữ liệu + hàm trộn (pure) + tests

**Files:**
- Create: `public/games/content.js`
- Modify: `public/games/wordquest.js` (thay stub bằng pure logic; UI ở Task 7)
- Test: `test/games-wordquest.test.js` (create)

- [ ] **Step 1: Viết test thất bại**

Tạo `test/games-wordquest.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { WQ_SENTENCES, DETECTIVE_CASES } from '../public/games/content.js';
import { shuffleWords } from '../public/games/wordquest.js';

describe('word quest content', () => {
  it('has 20 sentences: 4 per zone, 5 zones, all bilingual', () => {
    expect(WQ_SENTENCES).toHaveLength(20);
    for (let z = 1; z <= 5; z++) {
      const inZone = WQ_SENTENCES.filter((s) => s.zone === z);
      expect(inZone).toHaveLength(4);
      for (const s of inZone) {
        expect(Array.isArray(s.words)).toBe(true);
        expect(s.words.length).toBeGreaterThanOrEqual(3);
        expect(s.words.length).toBeLessThanOrEqual(7);
        expect(typeof s.vi).toBe('string');
        expect(typeof s.en).toBe('string');
      }
    }
  });

  it('zone 1 sentences have 3 words, zone 5 have 7', () => {
    expect(WQ_SENTENCES.filter((s) => s.zone === 1).every((s) => s.words.length === 3)).toBe(true);
    expect(WQ_SENTENCES.filter((s) => s.zone === 5).every((s) => s.words.length === 7)).toBe(true);
  });
});

describe('shuffleWords', () => {
  it('never returns the original order (>= 2 words)', () => {
    for (let i = 0; i < 100; i++) {
      expect(shuffleWords(['The', 'dog', 'runs'])).not.toEqual(['The', 'dog', 'runs']);
      expect(shuffleWords(['a', 'b'])).not.toEqual(['a', 'b']);
    }
  });

  it('keeps the same multiset of words', () => {
    const words = ['We', 'go', 'to', 'school', 'today'];
    const out = shuffleWords(words);
    expect(out.slice().sort()).toEqual(words.slice().sort());
  });

  it('does not mutate input', () => {
    const words = ['a', 'b', 'c'];
    shuffleWords(words);
    expect(words).toEqual(['a', 'b', 'c']);
  });
});

describe('detective content shape (shared file)', () => {
  it('has 3 consistent cases', () => {
    expect(DETECTIVE_CASES).toHaveLength(3);
    for (const c of DETECTIVE_CASES) {
      expect(c.suspects).toHaveLength(3);
      expect(c.clues.length).toBeGreaterThanOrEqual(3);
      expect(c.culprit).toBeGreaterThanOrEqual(0);
      expect(c.culprit).toBeLessThan(c.suspects.length);
      expect(c.steps.length).toBeGreaterThanOrEqual(2);
      for (const st of c.steps) {
        const correct = st.options.filter((o) => o.correct).length;
        expect(correct).toBe(1);
        expect(st.options.length).toBeGreaterThanOrEqual(2);
      }
    }
  });
});
```

- [ ] **Step 2: Chạy test xác nhận fail**

Run: `npx vitest run test/games-wordquest.test.js`
Expected: FAIL — Cannot find module `../public/games/content.js`.

- [ ] **Step 3: Tạo `public/games/content.js`**

```js
// Nội dung tĩnh cho Word Quest + Puzzle Detective (song ngữ vi/en).
// Treasure sinh câu hỏi bằng code (xem treasure.js).

export const WQ_SENTENCES = [
  // Zone 1 · 3 từ
  { zone: 1, words: ['The', 'cat', 'sleeps'], vi: 'Con mèo ngủ.', en: 'The cat sleeps.' },
  { zone: 1, words: ['I', 'like', 'dogs'], vi: 'Tớ thích chó.', en: 'I like dogs.' },
  { zone: 1, words: ['We', 'play', 'ball'], vi: 'Chúng tớ chơi bóng.', en: 'We play ball.' },
  { zone: 1, words: ['She', 'is', 'happy'], vi: 'Cô bé vui.', en: 'She is happy.' },
  // Zone 2 · 4 từ
  { zone: 2, words: ['The', 'dog', 'is', 'running'], vi: 'Con chó đang chạy.', en: 'The dog is running.' },
  { zone: 2, words: ['My', 'mom', 'reads', 'books'], vi: 'Mẹ tớ đọc sách.', en: 'My mom reads books.' },
  { zone: 2, words: ['The', 'sun', 'is', 'bright'], vi: 'Mặt trời thật sáng.', en: 'The sun is bright.' },
  { zone: 2, words: ['He', 'has', 'two', 'cats'], vi: 'Cậu ấy có hai con mèo.', en: 'He has two cats.' },
  // Zone 3 · 5 từ
  { zone: 3, words: ['We', 'go', 'to', 'school', 'today'], vi: 'Hôm nay chúng tớ đi học.', en: 'We go to school today.' },
  { zone: 3, words: ['The', 'bird', 'sings', 'a', 'song'], vi: 'Chim hót một bài hát.', en: 'The bird sings a song.' },
  { zone: 3, words: ['I', 'can', 'see', 'the', 'moon'], vi: 'Tớ thấy mặt trăng.', en: 'I can see the moon.' },
  { zone: 3, words: ['She', 'drinks', 'milk', 'every', 'morning'], vi: 'Cô bé uống sữa mỗi sáng.', en: 'She drinks milk every morning.' },
  // Zone 4 · 6 từ
  { zone: 4, words: ['Yesterday', 'we', 'played', 'in', 'the', 'park'], vi: 'Hôm qua chúng tớ chơi trong công viên.', en: 'Yesterday we played in the park.' },
  { zone: 4, words: ['My', 'brother', 'wants', 'a', 'new', 'bicycle'], vi: 'Em trai tớ muốn một chiếc xe đạp mới.', en: 'My brother wants a new bicycle.' },
  { zone: 4, words: ['The', 'little', 'fish', 'swims', 'very', 'fast'], vi: 'Con cá nhỏ bơi rất nhanh.', en: 'The little fish swims very fast.' },
  { zone: 4, words: ['They', 'are', 'eating', 'ice', 'cream', 'now'], vi: 'Các bạn ấy đang ăn kem.', en: 'They are eating ice cream now.' },
  // Zone 5 · 7 từ
  { zone: 5, words: ['Every', 'morning', 'the', 'rooster', 'crows', 'very', 'loudly'], vi: 'Mỗi sáng gà trống gáy rất to.', en: 'Every morning the rooster crows very loudly.' },
  { zone: 5, words: ['My', 'best', 'friend', 'always', 'shares', 'her', 'toys'], vi: 'Bạn thân của tớ luôn chia sẻ đồ chơi.', en: 'My best friend always shares her toys.' },
  { zone: 5, words: ['We', 'watched', 'a', 'funny', 'movie', 'last', 'night'], vi: 'Tối qua chúng tớ xem một phim hài.', en: 'We watched a funny movie last night.' },
  { zone: 5, words: ['The', 'old', 'turtle', 'walks', 'to', 'the', 'pond'], vi: 'Con rùa già chậm rãi đi về phía cái ao.', en: 'The old turtle walks to the pond.' },
];

export const DETECTIVE_CASES = [
  {
    id: 'cookie',
    emoji: '🍪',
    title: { vi: 'Bánh quy mất tích', en: 'The Missing Cookie' },
    intro: {
      vi: 'Ai đó đã lấy miếng bánh quy cuối cùng trong bếp! Đọc từng manh mối rồi giúp mình <strong>suy luận</strong> nhé — mình không nói thủ phạm đâu, mình cùng tìm ra!',
      en: 'Someone took the last cookie from the kitchen! Read each clue and help me <strong>reason</strong> — I won\'t tell you who, we\'ll figure it out together!',
    },
    suspects: [
      { emoji: '🐶', name: 'Max' },
      { emoji: '🐱', name: 'Luna' },
      { emoji: '🐰', name: 'Bunny' },
    ],
    clues: [
      { who: 0, text: { vi: '“Tớ chơi ngoài sân suốt lúc đó.”', en: '"I was playing outside the whole time."' } },
      { who: 1, flag: true, text: { vi: '“Tớ thấy Bunny ở trong bếp.”', en: '"I saw Bunny in the kitchen."' } },
      { who: 2, flag: true, text: { vi: '“Tớ không hề vào bếp.”', en: '"I never went into the kitchen."' } },
    ],
    steps: [
      {
        q: { vi: 'Hai manh mối cuối đang mâu thuẫn nhau. Điều đó nói lên điều gì?', en: 'The last two clues disagree. What does that tell us?' },
        options: [
          { text: { vi: 'Hai chuyện không thể đồng thời đúng — có ai đó chưa nói thật', en: "Both can't be true — someone isn't telling the truth" }, correct: true },
          { text: { vi: 'Cả hai đều đúng', en: 'They both must be true' } },
          { text: { vi: 'Không nói lên điều gì cả', en: 'It tells us nothing' } },
        ],
        hint: { vi: 'Luna nói thấy Bunny ở bếp, còn Bunny nói không vào bếp — so hai câu này xem.', en: 'Luna says she saw Bunny in the kitchen, but Bunny says he never went in — compare the two.' },
      },
      {
        q: { vi: 'Nếu Luna nói thật, ai đã vào bếp?', en: 'If Luna is telling the truth, who was in the kitchen?' },
        options: [
          { text: { vi: 'Bunny', en: 'Bunny' }, correct: true },
          { text: { vi: 'Max', en: 'Max' } },
          { text: { vi: 'Không ai cả', en: 'Nobody' } },
        ],
        hint: { vi: 'Manh mối của Luna chỉ tên một bạn thôi đó.', en: "Luna's clue names just one friend." },
      },
    ],
    culprit: 2,
    nudge: { vi: 'Đọc lại lời của Bunny — nó mâu thuẫn với lời của ai nhỉ?', en: 'Read Bunny\'s words again — whose story do they clash with?' },
    closing: {
      vi: '🎉 <strong>Phá án thành công!</strong> Nhân chứng thấy Bunny ở bếp, còn Bunny lại chối — thủ phạm chính là <strong>Bunny</strong>! Bạn đã tự suy luận ra hết, thám tử!',
      en: '🎉 <strong>Case closed!</strong> A witness saw Bunny there, but Bunny denied it — the culprit is <strong>Bunny</strong>. You reasoned it all out yourself, detective!',
    },
  },
  {
    id: 'vase',
    emoji: '🏺',
    title: { vi: 'Lọ hoa vỡ', en: 'The Broken Vase' },
    intro: {
      vi: 'Chiếc lọ hoa bên cửa sổ bị vỡ vụn! Ba bạn nhỏ đều nói chuyện mình. Cùng mình soi từng manh mối nhé!',
      en: 'The vase by the window is broken into pieces! All three friends told their story. Let\'s look at every clue!',
    },
    suspects: [
      { emoji: '🐈', name: 'Miu' },
      { emoji: '🐕', name: 'Lu' },
      { emoji: '🐦', name: 'Cu' },
    ],
    clues: [
      { who: 1, text: { vi: '“Lúc đó tớ đang đi dạo cùng bố — bố tớ xác nhận đó!”', en: '"I was out on a walk with dad — he confirms it!"' } },
      { who: 0, text: { vi: '“Tớ ngủ trên ghế sofa suốt buổi, Lu có thể làm chứng.”', en: '"I was asleep on the sofa the whole time, Lu can confirm."' } },
      { who: 2, flag: true, text: { vi: '“Lông vũ nhỏ nằm ngay cạnh mảnh lọ hoa…”', en: '"A small feather lies right next to the vase pieces…"' } },
    ],
    steps: [
      {
        q: { vi: 'Lu đi cùng bố, Miu ngủ trên sofa. Ai còn lại khả nghi nhất?', en: 'Lu was with dad, Miu was asleep. Who is left as a suspect?' },
        options: [
          { text: { vi: 'Cu', en: 'Cu' }, correct: true },
          { text: { vi: 'Lu', en: 'Lu' } },
          { text: { vi: 'Miu', en: 'Miu' } },
        ],
        hint: { vi: 'Hai bạn đã có người chứng kiến — còn ai chưa có bằng chứng ngoài?', en: 'Two friends have witnesses — who is left without an alibi?' },
      },
      {
        q: { vi: 'Sợi lông vũ cạnh lọ hoa gợi ý thủ phạm là ai?', en: 'What does the feather by the vase hint at?' },
        options: [
          { text: { vi: 'Một con chim — rất có thể là Cu', en: 'A bird — very likely Cu' }, correct: true },
          { text: { vi: 'Một con mèo', en: 'A cat' } },
          { text: { vi: 'Không gợi ý gì', en: 'It hints at nothing' } },
        ],
        hint: { vi: 'Loại nào trong ba bạn có lông vũ nhỉ?', en: 'Which of the three friends has feathers?' },
      },
    ],
    culprit: 2,
    nudge: { vi: 'Suy nghĩ xem ai trong ba bạn để lại lông vũ?', en: 'Think — which of the three leaves feathers behind?' },
    closing: {
      vi: '🎉 <strong>Phá án thành công!</strong> Miu có người ngủ làm chứng, Lu đi cùng bố, còn <strong>Cu</strong> — bạn để lại lông vũ ngay hiện trường! Thám tử giỏi!',
      en: '🎉 <strong>Case closed!</strong> Miu was asleep, Lu was with dad, and <strong>Cu</strong> — the feather gave it away! Great detecting!',
    },
  },
  {
    id: 'teddy',
    emoji: '🧸',
    title: { vi: 'Gấu bông biến mất', en: 'The Missing Teddy' },
    intro: {
      vi: 'Gấu bông của Noka biến mất sau bữa trưa! Hoá ra có bạn cầm đi giấu. Tìm manh mối nào!',
      en: 'Noka\'s teddy bear vanished after lunch! Someone hid it. Let\'s hunt for clues!',
    },
    suspects: [
      { emoji: '👦', name: 'Tí' },
      { emoji: '👧', name: 'Noka' },
      { emoji: '🤖', name: 'Bee' },
    ],
    clues: [
      { who: 0, text: { vi: '“Tớ tập bóng đá ở sân trường cả buổi — huấn luyện viên biết điều đó.”', en: '"I was at soccer practice all afternoon — the coach knows."' } },
      { who: 2, text: { vi: '“Tớ đứng yên trong tủ sách từ 12h đến 14h, pin của tớ chưa sạc nên không di chuyển được.”', en: '"I stood still on the bookshelf from 12 to 2 — my battery was dead so I couldn\'t move."' } },
      { who: 1, flag: true, text: { vi: 'Dưới gầm giường có dấu chân đất nhỏ dẫn từ vườn vào phòng… và đất dính trên đôi giày màu hồng.', en: 'Small muddy footprints lead from the garden into the room… and there is mud on a pair of pink shoes.' } },
    ],
    steps: [
      {
        q: { vi: 'Tí có huấn luyện viên làm chứng, Bee hết pin không di chuyển được. Ai còn khả nghi?', en: 'Tí has the coach as a witness, Bee couldn\'t move. Who is left?' },
        options: [
          { text: { vi: 'Noka', en: 'Noka' }, correct: true },
          { text: { vi: 'Tí', en: 'Tí' } },
          { text: { vi: 'Bee', en: 'Bee' } },
        ],
        hint: { vi: 'Hai bạn kia có lý do rất chắc chắn — còn bạn nào thì chưa?', en: 'Two friends have solid alibis — who doesn\'t?' },
      },
      {
        q: { vi: 'Dấu chân đất và đôi giày hồng nói lên điều gì?', en: 'What do the muddy prints and the pink shoes tell us?' },
        options: [
          { text: { vi: 'Ai đi giày hồng đã từ vườn vào phòng — và giấu gấu ở đó', en: 'Whoever wore the pink shoes came in from the garden — and hid the teddy there' }, correct: true },
          { text: { vi: 'Gấu bông tự đi được', en: 'The teddy walked by itself' } },
          { text: { vi: 'Không nói lên gì', en: 'Nothing at all' } },
        ],
        hint: { vi: 'Trong ba bạn, ai hay mang giày màu hồng nhỉ?', en: 'Which of the three often wears pink shoes?' },
      },
    ],
    culprit: 1,
    nudge: { vi: 'Đôi giày màu hồng là của ai trong ba bạn?', en: 'Whose are the pink shoes among the three?' },
    closing: {
      vi: '🎉 <strong>Phá án thành công!</strong> <strong>Noka</strong> tự giấu gấu bông để chơi trốn tìm! Dấu chân đất và giày hồng đã tố chuyện. Thám tử xuất sắc!',
      en: '🎉 <strong>Case closed!</strong> <strong>Noka</strong> hid her own teddy to play a hiding game! The muddy prints and pink shoes gave it away. Excellent detecting!',
    },
  },
];
```

- [ ] **Step 4: Thêm pure logic vào `public/games/wordquest.js`** (giữ `renderWordQuest` stub ở cuối)

```js
import { WQ_SENTENCES } from './content.js';

export function shuffleWords(words) {
  if (words.length < 2) return words.slice();
  let out;
  do {
    out = words.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
  } while (out.every((w, i) => w === words[i]));
  return out;
}

export function sentencesInZone(zone) {
  return WQ_SENTENCES.filter((s) => s.zone === zone);
}

export function firstWrongSlot(placed, target) {
  for (let i = 0; i < target.length; i++) {
    if (placed[i] !== target[i]) return i;
  }
  return -1;
}
```

- [ ] **Step 5: Chạy test xác nhận pass**

Run: `npx vitest run test/games-wordquest.test.js`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add public/games/content.js public/games/wordquest.js test/games-wordquest.test.js
git commit -m "feat: word quest sentence bank, shuffle and detective case data"
```

---

### Task 7: Word Quest — UI (tap-then-tap, kiểm tra, tinh thể)

**Files:**
- Modify: `public/games/wordquest.js` (thay `renderWordQuest` stub)

- [ ] **Step 1: Thay stub bằng implementation**

Imports đầu file bổ sung:

```js
import { el, SPARK_ICON, BACK_ARROW } from './dom.js';
import { esc } from '../util.js';
import { t } from '../i18n.js';
import { loadProgress, saveProgress, clearProgress } from './progress.js';
```

Thay `export function renderWordQuest() {}` bằng:

```js
const CRYSTAL_SVG = '<svg viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
  + '<defs><linearGradient id="wqcry" x1="0" y1="0" x2="1" y2="1">'
  + '<stop offset="0" stop-color="oklch(78% 0.12 300)"/><stop offset="1" stop-color="oklch(52% 0.18 320)"/>'
  + '</linearGradient></defs>'
  + '<polygon points="60,8 96,52 76,142 44,142 24,52" fill="url(#wqcry)" stroke="#fff" stroke-width="2.5"/>'
  + '<polygon points="60,8 76,142 60,120" fill="#fff" opacity="0.25"/>'
  + '<polygon points="24,52 60,8 60,120" fill="#fff" opacity="0.14"/>'
  + '<path d="M60 8 24 52M60 8 96 52M24 52 60 120M96 52 60 120" stroke="#fff" stroke-width="1.2" opacity="0.5"/></svg>';

export function renderWordQuest(body, ctx) {
  const L = ctx.lang;
  let save = loadProgress(ctx.profileId, 'wordquest') || { zone: 1, maxZone: 1, stage: 0, done: 0 };
  let sentence = null;   // câu hiện tại
  let bank = [];         // thẻ: [{word, used}] — mỗi thẻ là 1 instance từ
  let placed = [];       // slot → index trong bank (null = trống)
  let selected = null;   // index trong bank đang chọn

  const score = el('span', 'gt-score', '🔮 ' + save.done);
  ctx.top.appendChild(score);

  const levelRow = el('div', 'level-row');
  const say = el('div', 'game-say');
  const scene = el('div', 'wq-scene');
  const slotsEl = el('div', 'wq-slots');
  const bankEl = el('div', 'wq-bank');
  const crystal = el('div', 'wq-crystal stage-' + save.stage, CRYSTAL_SVG);
  const actions = el('div', 'game-actions');

  function persist() {
    saveProgress(ctx.profileId, 'wordquest', save);
    score.textContent = '🔮 ' + save.done;
  }

  function sayMsg(html, kind) {
    say.className = 'game-say' + (kind ? ' ' + kind : '');
    say.innerHTML = '<div class="gs-av">' + SPARK_ICON + '</div><div class="gs-text">' + html + '</div>';
  }

  function drawLevels() {
    levelRow.innerHTML = '';
    for (let z = 1; z <= 5; z++) {
      const pill = el('span', 'level-pill magic' + (z === save.zone ? ' active' : ''));
      pill.textContent = t(L, 'wqZone' + z);
      if (z > save.maxZone) pill.classList.add('locked');
      levelRow.appendChild(pill);
    }
  }

  function newSentence() {
    const list = sentencesInZone(save.zone);
    sentence = list[save.stage];
    bank = shuffleWords(sentence.words).map((w) => ({ word: w, used: false }));
    placed = sentence.words.map(() => null);
    selected = null;
    crystal.className = 'wq-crystal stage-' + save.stage;
    sayMsg(L === 'en'
      ? '🧙‍♀️ The Magic Book lost its words! Tap a word card, then tap a slot to place it in the <strong>right order</strong>.'
      : '🧙‍♀️ Quyển sách phép thuật làm rơi tung từ! Chạm một thẻ chữ, rồi chạm ô trống để xếp vào <strong>đúng thứ tự</strong> nhé.');
    drawScene();
  }

  function drawScene() {
    slotsEl.innerHTML = '';
    bankEl.innerHTML = '';
    placed.forEach((bi, i) => {
      const slot = el('div', 'wq-slot' + (bi !== null ? ' filled' : ''));
      if (bi !== null) slot.appendChild(el('span', 'word-card', esc(bank[bi].word)));
      slot.addEventListener('click', (e) => {
        if (bi === null) return;   // ô trống: listener đặt thẻ (phía dưới) xử lý
        e.stopPropagation();       // ô đã xếp: trả thẻ về bank
        bank[bi].used = false;
        placed[i] = null;
        drawScene();
      });
      slotsEl.appendChild(slot);
    });
    bank.forEach((b, i) => {
      if (b.used) return;
      const card = el('button', 'word-card' + (selected === i ? ' selected' : ''));
      card.type = 'button';
      card.textContent = b.word;
      card.addEventListener('click', () => {
        selected = selected === i ? null : i;
        drawScene();
      });
      bankEl.appendChild(card);
    });
  }

  // đặt thẻ đang chọn vào ô trống được chạm (tap-then-tap)
  slotsEl.addEventListener('click', (e) => {
    if (selected === null) return;
    const slotEls = Array.prototype.slice.call(slotsEl.children);
    const idx = slotEls.indexOf(e.target.closest('.wq-slot'));
    if (idx < 0 || placed[idx] !== null) return;
    placed[idx] = selected;
    bank[selected].used = true;
    selected = null;
    drawScene();
  });

  function cast() {
    if (placed.some((bi) => bi === null)) {
      sayMsg(L === 'en'
        ? '🪄 There is an empty slot — read the words out loud and find the missing one!'
        : '🪄 Còn ô trống kìa — đọc to các từ đã xếp xem còn thiếu từ nào!', 'warn');
      return;
    }
    const words = placed.map((bi) => (bi === null ? null : bank[bi].word));
    const wrongAt = firstWrongSlot(words, sentence.words);
    if (wrongAt >= 0) {
      sayMsg(L === 'en'
        ? '🪄 Hmm, slot ' + (wrongAt + 1) + ' sounds odd. Say it out loud — which word should come <strong>before</strong> it?'
        : '🪄 Hình như ô thứ ' + (wrongAt + 1) + ' nghe chưa thuận tai. Đọc to thử xem — từ nào nên đứng <strong>trước</strong> nhỉ?', 'warn');
      return;
    }
    // đúng!
    save.stage += 1;
    save.done += 1;
    if (save.stage >= sentencesInZone(save.zone).length) {
      save.stage = 0;
      save.zone += 1;
      save.maxZone = Math.max(save.maxZone, Math.min(save.zone, 5));
    }
    persist();
    drawLevels();
    crystal.className = 'wq-crystal stage-' + Math.max(save.stage, 1);
    sayMsg('✨ <strong>' + (L === 'en' ? 'Magic spell activated!' : 'Chú thuật đã khởi động!') + '</strong> '
      + esc(sentence.en) + ' 🔮 ' + (L === 'en' ? 'Your crystal grows!' : 'Tinh thể của bạn lớn thêm!'), 'win');
    slotsEl.querySelectorAll('.word-card').forEach((c) => c.classList.add('locked'));
    setTimeout(() => {
      if (save.zone > 5) {
        save.zone = 5; save.stage = 0; persist();
        sayMsg('👑 ' + (L === 'en' ? 'Story Kingdom complete! You are the Word Wizard!' : 'Hoàn thành Vương quốc chuyện! Bạn là Pháp sư chữ nghĩa!'), 'win');
        save.zone = 1; save.stage = 0; save.maxZone = 5; persist();
      }
      newSentence();
    }, 900);
  }

  const castBtn = el('button', 'gbtn primary', '✨ ' + esc(t(L, 'wqCast')));
  castBtn.type = 'button';
  castBtn.addEventListener('click', cast);

  const hintBtn = el('button', 'gbtn hint', '💡 ' + esc(t(L, 'needHint')));
  hintBtn.type = 'button';
  hintBtn.addEventListener('click', () => {
    sayMsg(L === 'en'
      ? '💡 This sentence means: <strong>' + esc(sentence.vi) + '</strong> — now find the first word!'
      : '💡 Câu này nghĩa là: <strong>' + esc(sentence.vi) + '</strong> — thử tìm từ đầu tiên nhé!', 'warn');
  });

  const resetBtn = el('button', 'gbtn ghost', esc(t(L, 'gameReset')));
  resetBtn.type = 'button';
  resetBtn.addEventListener('click', () => {
    clearProgress(ctx.profileId, 'wordquest');
    save = { zone: 1, maxZone: 1, stage: 0, done: 0 };
    persist(); drawLevels(); newSentence();
  });

  const backBtn = el('button', 'gbtn', BACK_ARROW + esc(t(L, 'gameBack')));
  backBtn.type = 'button';
  backBtn.addEventListener('click', ctx.back);

  actions.appendChild(castBtn);
  actions.appendChild(hintBtn);
  actions.appendChild(backBtn);
  actions.appendChild(resetBtn);

  scene.appendChild(slotsEl);
  scene.appendChild(bankEl);

  body.appendChild(levelRow);
  body.appendChild(say);
  body.appendChild(scene);
  body.appendChild(crystal);
  body.appendChild(actions);

  drawLevels();
  newSentence();
}
```

Chú ý: `placed` lưu **index trong bank** (không phải chữ) để xử lý đúng câu có từ trùng lặp (vd "the" xuất hiện 2 lần). Listener trả thẻ dùng `e.stopPropagation()` để không rơi vào listener đặt thẻ của `slotsEl`.

- [ ] **Step 2: Chạy toàn bộ test**

Run: `npx vitest run`
Expected: PASS hết.

- [ ] **Step 3: Kiểm tra thủ công**

`npx vercel dev` → Trò chơi → Hành trình chữ:
- Thẻ hiện trộn không đúng thứ tự; chạm thẻ (sáng viền tím) → chạm ô → thẻ vào ô
- Chạm thẻ đã xếp → quay về bank; xếp đủ → "Niệm chú thuật"
- Sai thứ tự → gợi ý chỉ ô sai đầu tiên, không tự sửa; đúng → tinh thể lớn thêm, câu mới
- Nút gợi ý hiện nghĩa tiếng Việt của câu; qua hết 4 câu vùng → mở vùng kế

- [ ] **Step 4: Commit**

```bash
git add public/games/wordquest.js
git commit -m "feat: word quest game ui with tap-to-place and crystal growth"
```

---

### Task 8: Puzzle Detective — UI (manh mối → suy luận → tố cáo)

**Files:**
- Modify: `public/games/detective.js` (thay stub)

- [ ] **Step 1: Thay stub bằng implementation**

```js
import { el, SPARK_ICON, BACK_ARROW } from './dom.js';
import { esc } from '../util.js';
import { t } from '../i18n.js';
import { loadProgress, saveProgress, clearProgress } from './progress.js';
import { DETECTIVE_CASES } from './content.js';

export function renderDetective(body, ctx) {
  const L = ctx.lang;
  let save = loadProgress(ctx.profileId, 'detective') || { caseIdx: 0, solved: 0 };
  let stepIdx = 0;
  let canAccuse = false;
  let finished = false;

  const c = () => DETECTIVE_CASES[Math.min(save.caseIdx, DETECTIVE_CASES.length - 1)];

  const score = el('span', 'gt-score', '🔎 ' + t(L, 'dgCase') + ' ' + Math.min(save.caseIdx + 1, 3) + '/3');
  ctx.top.appendChild(score);

  const say = el('div', 'game-say');
  const suspectsEl = el('div', 'suspects');
  const clueList = el('div', 'clue-list');
  const stepBox = el('div');       // chứa câu hỏi suy luận + options
  const actions = el('div', 'game-actions');

  function persist() {
    saveProgress(ctx.profileId, 'detective', save);
    score.textContent = '🔎 ' + t(L, 'dgCase') + ' ' + Math.min(save.caseIdx + 1, 3) + '/3';
  }

  function sayMsg(html, kind) {
    say.className = 'game-say' + (kind ? ' ' + kind : '');
    say.innerHTML = '<div class="gs-av">' + SPARK_ICON + '</div><div class="gs-text">' + html + '</div>';
  }

  function drawSuspects(pickable, accusedIdx, resultCls) {
    suspectsEl.innerHTML = '';
    c().suspects.forEach((s, i) => {
      let cls = 'suspect';
      if (pickable) cls += ' pickable';
      if (resultCls === 'win' && i === c().culprit) cls += ' culprit';
      if (resultCls === 'win' && i !== c().culprit) cls += ' cleared';
      if (resultCls === 'wrong' && i === accusedIdx) cls += ' accused';
      const elx = el('div', cls, '<div class="sp-face">' + s.emoji + '</div><div class="sp-name">' + esc(s.name) + '</div>');
      if (pickable) elx.addEventListener('click', () => accuse(i));
      suspectsEl.appendChild(elx);
    });
  }

  function drawClues() {
    clueList.innerHTML = '';
    c().clues.forEach((cl) => {
      const s = c().suspects[cl.who];
      clueList.appendChild(el('div', 'clue' + (cl.flag ? ' flag' : ''),
        '<div class="cl-face">' + s.emoji + '</div><div class="cl-text"><span class="cl-who">' + esc(s.name) + ':</span> ' + esc(cl.text[L]) + '</div>'));
    });
  }

  function drawStep() {
    stepBox.innerHTML = '';
    if (stepIdx >= c().steps.length) { openAccuse(); return; }
    const st = c().steps[stepIdx];
    sayMsg('<strong>' + (L === 'en' ? 'Step ' : 'Bước ') + (stepIdx + 1) + '.</strong> ' + esc(st.q[L]));
    const row = el('div', 'opt-row');
    st.options.forEach((o) => {
      const b = el('button', 'opt reason', esc(o.text[L]));
      b.type = 'button';
      b.addEventListener('click', () => {
        if (o.correct) {
          b.classList.add('right');
          row.querySelectorAll('button').forEach((x) => { x.disabled = true; });
          stepIdx += 1;
          setTimeout(drawStep, 600);
        } else {
          b.classList.add('wrong');
          sayMsg('💡 ' + esc(st.hint[L]), 'warn');
        }
      });
      row.appendChild(b);
    });
    stepBox.appendChild(row);
  }

  function openAccuse() {
    canAccuse = true;
    stepBox.innerHTML = '';
    drawSuspects(true);
    sayMsg('🕵️ ' + (L === 'en'
      ? "You've reasoned it through. Now make your call — <strong>who did it?</strong> Tap a suspect to accuse."
      : 'Bạn đã suy luận xong rồi. Giờ ra quyết định — <strong>ai là thủ phạm?</strong> Chạm vào một nghi phạm để tố cáo.'));
  }

  function accuse(i) {
    if (!canAccuse || finished) return;
    if (i === c().culprit) {
      finished = true;
      drawSuspects(false, i, 'win');
      sayMsg(c().closing[L], 'win');
      save.solved += 1;
      const next = el('button', 'gbtn primary', '➜ ' + esc(t(L, 'dgNextCase')));
      next.type = 'button';
      next.addEventListener('click', () => {
        save.caseIdx += 1;
        if (save.caseIdx >= DETECTIVE_CASES.length) {
          save.caseIdx = 0;
          persist();
          sayMsg('🎖️ ' + (L === 'en'
            ? 'All 3 cases closed — you are a Chief Detective! The case files start over whenever you want.'
            : 'Cả 3 vụ án đều đã phá xong — bạn là Thám tử trưởng! Hồ sơ sẽ mở lại bất cứ lúc nào bạn muốn.'), 'win');
          setTimeout(() => { restartCase(); }, 1200);
          return;
        }
        persist();
        restartCase();
      });
      stepBox.innerHTML = '';
      stepBox.appendChild(next);
      persist();
    } else {
      drawSuspects(true, i, 'wrong');
      sayMsg('🤔 ' + esc(c().nudge[L]), 'warn');
      setTimeout(() => drawSuspects(true), 900);
    }
  }

  function restartCase() {
    stepIdx = 0;
    canAccuse = false;
    finished = false;
    init();
  }

  function init() {
    sayMsg('🔎 <strong>' + esc(c().title[L]) + '</strong><br>' + c().intro[L]);
    drawSuspects(false);
    drawClues();
    drawStep();
  }

  const resetBtn = el('button', 'gbtn ghost', esc(t(L, 'gameReset')));
  resetBtn.type = 'button';
  resetBtn.addEventListener('click', () => {
    clearProgress(ctx.profileId, 'detective');
    save = { caseIdx: 0, solved: 0 };
    persist();
    restartCase();
  });

  const backBtn = el('button', 'gbtn', BACK_ARROW + esc(t(L, 'gameBack')));
  backBtn.type = 'button';
  backBtn.addEventListener('click', ctx.back);

  actions.appendChild(backBtn);
  actions.appendChild(resetBtn);

  body.appendChild(say);
  body.appendChild(suspectsEl);
  body.appendChild(clueList);
  body.appendChild(stepBox);
  body.appendChild(actions);

  init();
}
```

- [ ] **Step 2: Chạy toàn bộ test**

Run: `npx vitest run`
Expected: PASS hết.

- [ ] **Step 3: Kiểm tra thủ công**

`npx vercel dev` → Trò chơi → Thám tử nhỏ:
- Vụ 1 (bánh quy): hiện 3 nghi phạm + 3 manh mối (2 manh mối viền vàng = mấu chốt)
- Trả lời sai câu suy luận → hint, đúng → bước kế; hết bước → được phép tố cáo
- Tố sai (Max/Luna) → chỉ lại manh mối, không lộ thủ phạm; tố đúng (Bunny) → case closed + vụ kế
- Qua 3 vụ → thông báo Thám tử trưởng, quay về vụ 1; reload giữ tiến trình

- [ ] **Step 4: Commit**

```bash
git add public/games/detective.js
git commit -m "feat: puzzle detective game ui with clue reasoning flow"
```

---

### Task 9: Chess engine — phần 1: state, tấn công, nước đi thô + tests

**Files:**
- Create: `public/games/chess/engine.js`
- Test: `test/games-engine.test.js` (create)

Quy ước ô: index 0–63, 0 = a8 (góc trên trái), 63 = h1; `row = floor(sq/8)` (0 = rank 8), `col = sq % 8` (0 = file a). e1 = 60, e8 = 4.

- [ ] **Step 1: Viết test thất bại**

Tạo `test/games-engine.test.js`:

```js
import { describe, it, expect } from 'vitest';
import {
  initialState, customState, squareName, squareIndex,
  isAttacked, pseudoMoves,
} from '../../public/games/chess/engine.js';

describe('squares', () => {
  it('maps names and indices both ways', () => {
    expect(squareName(0)).toBe('a8');
    expect(squareName(63)).toBe('h1');
    expect(squareIndex('e1')).toBe(60);
    expect(squareIndex('e8')).toBe(4);
    expect(squareName(squareIndex('d4'))).toBe('d4');
  });
});

describe('initial state', () => {
  it('has 32 pieces, white to move', () => {
    const s = initialState();
    expect(s.turn).toBe('w');
    expect(s.board.filter(Boolean)).toHaveLength(32);
    expect(s.board[squareIndex('e1')]).toEqual({ t: 'k', c: 'w' });
    expect(s.board[squareIndex('d8')]).toEqual({ t: 'q', c: 'b' });
  });
});

describe('isAttacked', () => {
  it('detects pawn attacks', () => {
    const s = customState([['e4', 'p', 'w'], ['d5', 'p', 'b']]);
    // tốt đen d5 tấn công e4 (đen ăn xuống)
    expect(isAttacked(s.board, squareIndex('e4'), 'b')).toBe(true);
    expect(isAttacked(s.board, squareIndex('e4'), 'w')).toBe(false);
  });

  it('detects sliding attacks blocked by pieces', () => {
    let s = customState([['a8', 'r', 'b'], ['h1', 'k', 'w']]);
    expect(isAttacked(s.board, squareIndex('a1'), 'b')).toBe(true);
    s = customState([['a8', 'r', 'b'], ['a4', 'p', 'w'], ['h1', 'k', 'w']]);
    expect(isAttacked(s.board, squareIndex('a1'), 'b')).toBe(false);
  });
});

describe('pseudoMoves', () => {
  it('knight on b1 in the initial position can go to a3 and c3 only', () => {
    const s = initialState();
    const mvs = pseudoMoves(s, squareIndex('b1')).map((m) => squareName(m.to)).sort();
    expect(mvs).toEqual(['a3', 'c3']);
  });

  it('pawn can double-push from start, single-push after', () => {
    const s = initialState();
    let mvs = pseudoMoves(s, squareIndex('e2')).map((m) => squareName(m.to)).sort();
    expect(mvs).toEqual(['e3', 'e4']);
    const s2 = customState([['e4', 'p', 'w'], ['h1', 'k', 'w'], ['h8', 'k', 'b']]);
    mvs = pseudoMoves(s2, squareIndex('e4')).map((m) => squareName(m.to));
    expect(mvs).toEqual(['e5']);
  });

  it('pawn captures diagonally and via en-passant flag', () => {
    const s = customState(
      [['e5', 'p', 'w'], ['d5', 'p', 'b'], ['h1', 'k', 'w'], ['h8', 'k', 'b']],
      'w', undefined, squareIndex('d6'));
    const mvs = pseudoMoves(s, squareIndex('e5'));
    const tos = mvs.map((m) => squareName(m.to));
    expect(tos).toContain('d6');
    expect(mvs.find((m) => squareName(m.to) === 'd6').flag).toBe('ep');
  });

  it('king can castle when path is clear and rights remain', () => {
    const s = customState(
      [['e1', 'k', 'w'], ['h1', 'r', 'w'], ['a1', 'r', 'w'], ['e8', 'k', 'b']],
      'w', { wk: true, wq: true, bk: false, bq: false });
    const mvs = pseudoMoves(s, squareIndex('e1')).map((m) => m.to);
    expect(mvs).toContain(62); // g1
    expect(mvs).toContain(58); // c1
  });

  it('cannot castle through an attacked square', () => {
    const s = customState(
      [['e1', 'k', 'w'], ['h1', 'r', 'w'], ['f8', 'r', 'b'], ['e8', 'k', 'b']],
      'w', { wk: true, wq: false, bk: false, bq: false });
    const mvs = pseudoMoves(s, squareIndex('e1')).map((m) => m.to);
    expect(mvs).not.toContain(62); // f1 bị xe f8 kiểm soát
  });
});
```

- [ ] **Step 2: Chạy test xác nhận fail**

Run: `npx vitest run test/games-engine.test.js`
Expected: FAIL — Cannot find module `engine.js`.

- [ ] **Step 3: Tạo `public/games/chess/engine.js`** (phần 1; Task 10 bổ sung applyMove/legalMoves/status)

```js
// Bộ luật cờ vua thu gọn cho trẻ — pure functions, KHÔNG mutate state đầu vào.
// Hỗ trợ: đi/ăn quân, nhập thành 2 phía, bắt tốt qua đường (en passant),
// phong cấp (tự động thành Hậu), chiếu / chiếu hết / hết nước (hòa).
// Bỏ qua (cố ý, cho gọn): luật 50 nước, lặp 3 lần, underpromotion.
//
// Quy ước ô: index 0..63, 0 = a8 (trên trái), 63 = h1 (dưới phải).
// row = Math.floor(sq / 8)  (row 0 = rank 8), col = sq % 8 (col 0 = file a).

const FILES = 'abcdefgh';

export function squareName(sq) {
  return FILES[sq % 8] + (8 - Math.floor(sq / 8));
}

export function squareIndex(name) {
  const file = FILES.indexOf(name[0]);
  const rank = Number(name[1]);
  return (8 - rank) * 8 + file;
}

const START_ROWS = [
  ['a8', 'r', 'b'], ['b8', 'n', 'b'], ['c8', 'b', 'b'], ['d8', 'q', 'b'],
  ['e8', 'k', 'b'], ['f8', 'b', 'b'], ['g8', 'n', 'b'], ['h8', 'r', 'b'],
  ['a7', 'p', 'b'], ['b7', 'p', 'b'], ['c7', 'p', 'b'], ['d7', 'p', 'b'],
  ['e7', 'p', 'b'], ['f7', 'p', 'b'], ['g7', 'p', 'b'], ['h7', 'p', 'b'],
  ['a2', 'p', 'w'], ['b2', 'p', 'w'], ['c2', 'p', 'w'], ['d2', 'p', 'w'],
  ['e2', 'p', 'w'], ['f2', 'p', 'w'], ['g2', 'p', 'w'], ['h2', 'p', 'w'],
  ['a1', 'r', 'w'], ['b1', 'n', 'w'], ['c1', 'b', 'w'], ['d1', 'q', 'w'],
  ['e1', 'k', 'w'], ['f1', 'b', 'w'], ['g1', 'n', 'w'], ['h1', 'r', 'w'],
];

export function customState(entries, turn = 'w', castling, ep = -1) {
  const board = new Array(64).fill(null);
  for (const [sq, t, c] of entries) board[squareIndex(sq)] = { t, c };
  return {
    board,
    turn,
    castling: castling || { wk: true, wq: true, bk: true, bq: true },
    ep,
  };
}

export function initialState() {
  return customState(START_ROWS, 'w', { wk: true, wq: true, bk: true, bq: true }, -1);
}

function clone(s) {
  return {
    board: s.board.map((p) => (p ? { t: p.t, c: p.c } : null)),
    turn: s.turn,
    castling: { ...s.castling },
    ep: s.ep,
  };
}

const KNIGHT_D = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const KING_D = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const BISHOP_D = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const ROOK_D = [[-1, 0], [1, 0], [0, -1], [0, 1]];

function rc(sq) { return [Math.floor(sq / 8), sq % 8]; }
function inB(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

// Ô sq có bị phe `by` tấn công không (chỉ nhìn bàn, không xét nước đi)
export function isAttacked(board, sq, by) {
  const [r, c] = rc(sq);
  // tốt: tốt trắng ở (r+1, c±1) tấn công ô (r,c); tốt đen ở (r-1, c±1)
  const pr = by === 'w' ? r + 1 : r - 1;
  for (const dc of [-1, 1]) {
    const cc = c + dc;
    if (inB(pr, cc)) {
      const p = board[pr * 8 + cc];
      if (p && p.c === by && p.t === 'p') return true;
    }
  }
  for (const [dr, dc] of KNIGHT_D) {
    const rr = r + dr, cc = c + dc;
    if (!inB(rr, cc)) continue;
    const p = board[rr * 8 + cc];
    if (p && p.c === by && p.t === 'n') return true;
  }
  for (const [dr, dc] of KING_D) {
    const rr = r + dr, cc = c + dc;
    if (!inB(rr, cc)) continue;
    const p = board[rr * 8 + cc];
    if (p && p.c === by && p.t === 'k') return true;
  }
  for (const [dr, dc] of BISHOP_D) {
    let rr = r + dr, cc = c + dc;
    while (inB(rr, cc)) {
      const p = board[rr * 8 + cc];
      if (p) {
        if (p.c === by && (p.t === 'b' || p.t === 'q')) return true;
        break;
      }
      rr += dr; cc += dc;
    }
  }
  for (const [dr, dc] of ROOK_D) {
    let rr = r + dr, cc = c + dc;
    while (inB(rr, cc)) {
      const p = board[rr * 8 + cc];
      if (p) {
        if (p.c === by && (p.t === 'r' || p.t === 'q')) return true;
        break;
      }
      rr += dr; cc += dc;
    }
  }
  return false;
}

export function findKing(board, side) {
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (p && p.t === 'k' && p.c === side) return i;
  }
  return -1;
}

// Nước đi thô (chưa lọc vua bị lộ)
export function pseudoMoves(s, from) {
  const p = s.board[from];
  if (!p || p.c !== s.turn) return [];
  const out = [];
  const [r, c] = rc(from);
  const add = (rr, cc, flag) => {
    if (!inB(rr, cc)) return;
    const target = s.board[rr * 8 + cc];
    if (target && target.c === p.c) return;
    out.push({ from, to: rr * 8 + cc, flag: flag || null });
  };
  if (p.t === 'p') {
    const dir = p.c === 'w' ? -1 : 1;
    const startRow = p.c === 'w' ? 6 : 1;
    const rr = r + dir;
    if (inB(rr, c) && !s.board[rr * 8 + c]) {
      out.push({ from, to: rr * 8 + c, flag: null });
      const rr2 = r + 2 * dir;
      if (r === startRow && !s.board[rr2 * 8 + c]) out.push({ from, to: rr2 * 8 + c, flag: 'double' });
    }
    for (const dc of [-1, 1]) {
      const cc = c + dc;
      if (!inB(rr, cc)) continue;
      const idx = rr * 8 + cc;
      const target = s.board[idx];
      if (target && target.c !== p.c) out.push({ from, to: idx, flag: null });
      else if (idx === s.ep && !target) out.push({ from, to: idx, flag: 'ep' });
    }
  } else if (p.t === 'n' || p.t === 'k') {
    for (const [dr, dc] of (p.t === 'n' ? KNIGHT_D : KING_D)) add(r + dr, c + dc);
    if (p.t === 'k') {
      const home = p.c === 'w' ? 60 : 4;
      const enemy = p.c === 'w' ? 'b' : 'w';
      if (from === home && !isAttacked(s.board, home, enemy)) {
        const ks = p.c === 'w' ? s.castling.wk : s.castling.bk;
        const qs = p.c === 'w' ? s.castling.wq : s.castling.bq;
        if (ks && !s.board[home + 1] && !s.board[home + 2]
          && !isAttacked(s.board, home + 1, enemy) && !isAttacked(s.board, home + 2, enemy)) {
          out.push({ from, to: home + 2, flag: 'castle' });
        }
        if (qs && !s.board[home - 1] && !s.board[home - 2] && !s.board[home - 3]
          && !isAttacked(s.board, home - 1, enemy) && !isAttacked(s.board, home - 2, enemy)) {
          out.push({ from, to: home - 2, flag: 'castle' });
        }
      }
    }
  } else {
    const dirs = p.t === 'b' ? BISHOP_D : p.t === 'r' ? ROOK_D : BISHOP_D.concat(ROOK_D);
    for (const [dr, dc] of dirs) {
      let rr = r + dr, cc = c + dc;
      while (inB(rr, cc)) {
        const target = s.board[rr * 8 + cc];
        if (target && target.c === p.c) break;
        out.push({ from, to: rr * 8 + cc, flag: null });
        if (target) break;
        rr += dr; cc += dc;
      }
    }
  }
  return out;
}
```

- [ ] **Step 4: Chạy test xác nhận pass**

Run: `npx vitest run test/games-engine.test.js`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add public/games/chess/engine.js test/games-engine.test.js
git commit -m "feat: chess engine state, attack detection and pseudo moves"
```

---

### Task 10: Chess engine — phần 2: applyMove, legalMoves, status + tests

**Files:**
- Modify: `public/games/chess/engine.js` (thêm vào cuối)
- Modify: `test/games-engine.test.js` (thêm describe mới)

- [ ] **Step 1: Thêm test thất bại** (append vào `test/games-engine.test.js`; bổ sung import)

Sửa dòng import thành:

```js
import {
  initialState, customState, squareName, squareIndex,
  isAttacked, pseudoMoves,
  applyMove, legalMoves, allLegalMoves, inCheck, status,
} from '../../public/games/chess/engine.js';
```

Append:

```js
describe('applyMove', () => {
  it('moves a piece and flips the turn without mutating input', () => {
    const s = initialState();
    const e2 = squareIndex('e2'), e4 = squareIndex('e4');
    const n = applyMove(s, { from: e2, to: e4, flag: 'double' });
    expect(n.board[e2]).toBeNull();
    expect(n.board[e4]).toEqual({ t: 'p', c: 'w' });
    expect(n.turn).toBe('b');
    expect(n.ep).toBe(squareIndex('e3'));
    expect(s.board[e2]).toEqual({ t: 'p', c: 'w' }); // input không đổi
    expect(s.turn).toBe('w');
  });

  it('castles king and rook together', () => {
    const s = customState(
      [['e1', 'k', 'w'], ['h1', 'r', 'w'], ['e8', 'k', 'b']],
      'w', { wk: true, wq: false, bk: false, bq: false });
    const n = applyMove(s, { from: 60, to: 62, flag: 'castle' });
    expect(n.board[squareIndex('g1')].t).toBe('k');
    expect(n.board[squareIndex('f1')].t).toBe('r');
    expect(n.board[squareIndex('e1')]).toBeNull();
    expect(n.board[squareIndex('h1')]).toBeNull();
    expect(n.castling.wk).toBe(false);
  });

  it('captures en passant and removes the passed pawn', () => {
    const s = customState(
      [['e5', 'p', 'w'], ['d5', 'p', 'b'], ['h1', 'k', 'w'], ['h8', 'k', 'b']],
      'w', undefined, squareIndex('d6'));
    const n = applyMove(s, { from: squareIndex('e5'), to: squareIndex('d6'), flag: 'ep' });
    expect(n.board[squareIndex('d6')]).toEqual({ t: 'p', c: 'w' });
    expect(n.board[squareIndex('d5')]).toBeNull(); // tốt đen bị bắt qua đường
    expect(n.board[squareIndex('e5')]).toBeNull();
  });

  it('auto-promotes pawn to queen', () => {
    const s = customState([['a7', 'p', 'w'], ['h1', 'k', 'w'], ['h8', 'k', 'b']]);
    const n = applyMove(s, { from: squareIndex('a7'), to: squareIndex('a8'), flag: null });
    expect(n.board[squareIndex('a8')]).toEqual({ t: 'q', c: 'w' });
  });
});

describe('legalMoves and check', () => {
  it('initial position has exactly 20 legal moves', () => {
    expect(allLegalMoves(initialState())).toHaveLength(20);
  });

  it('a pinned knight cannot move', () => {
    const s = customState(
      [['e1', 'k', 'w'], ['e3', 'n', 'w'], ['e8', 'r', 'b']],
      'w', { wk: false, wq: false, bk: false, bq: false });
    expect(legalMoves(s, squareIndex('e3'))).toHaveLength(0);
  });

  it('king in check cannot step along the checking line, but can step off it', () => {
    const s = customState(
      [['e1', 'k', 'w'], ['e8', 'r', 'b'], ['h8', 'k', 'b'], ['g2', 'p', 'w']],
      'w', { wk: false, wq: false, bk: false, bq: false });
    const tos = legalMoves(s, squareIndex('e1')).map((m) => squareName(m.to));
    expect(tos).not.toContain('e2'); // vẫn nằm trên cột e — xe vẫn chiếu
    expect(tos).toContain('f2');     // bước ra khỏi cột e thì thoát
  });
});

describe('status', () => {
  it("fool's mate is checkmate", () => {
    let s = initialState();
    const mv = (a, b, flag) => { s = applyMove(s, { from: squareIndex(a), to: squareIndex(b), flag: flag || null }); };
    mv('f2', 'f3', 'double');
    mv('e7', 'e5', 'double');
    mv('g2', 'g4', 'double');
    mv('d8', 'h4');
    expect(inCheck(s, 'w')).toBe(true);
    expect(status(s)).toBe('checkmate');
  });

  it('detects stalemate', () => {
    const s = customState(
      [['g6', 'k', 'w'], ['f7', 'q', 'w'], ['h8', 'k', 'b']],
      'b', { wk: false, wq: false, bk: false, bq: false });
    expect(status(s)).toBe('stalemate');
  });

  it('reports check when attacked but with escapes', () => {
    const s = customState(
      [['e1', 'k', 'w'], ['e8', 'r', 'b'], ['h8', 'k', 'b'], ['g2', 'p', 'w']],
      'w', { wk: false, wq: false, bk: false, bq: false });
    expect(inCheck(s, 'w')).toBe(true);
    expect(status(s)).toBe('check');
  });
});
```

- [ ] **Step 2: Chạy test xác nhận fail**

Run: `npx vitest run test/games-engine.test.js`
Expected: FAIL — `applyMove` không export.

- [ ] **Step 3: Thêm vào cuối `public/games/chess/engine.js`**

```js
export function applyMove(s, m) {
  const n = clone(s);
  const p = n.board[m.from];
  n.board[m.from] = null;
  const lastRow = p.c === 'w' ? 0 : 7;
  if (p.t === 'p' && Math.floor(m.to / 8) === lastRow) n.board[m.to] = { t: 'q', c: p.c };
  else n.board[m.to] = p;
  if (m.flag === 'ep') {
    const cap = m.to + (p.c === 'w' ? 8 : -8);
    n.board[cap] = null;
  }
  if (m.flag === 'castle') {
    const home = p.c === 'w' ? 60 : 4;
    if (m.to === home + 2) { n.board[home + 1] = n.board[home + 3]; n.board[home + 3] = null; }
    else { n.board[home - 1] = n.board[home - 3]; n.board[home - 3] = null; }
  }
  n.ep = m.flag === 'double' ? (m.from + m.to) / 2 : -1;
  if (p.t === 'k') {
    if (p.c === 'w') { n.castling.wk = false; n.castling.wq = false; }
    else { n.castling.bk = false; n.castling.bq = false; }
  }
  for (const sq of [56, 63, 0, 7]) {
    if (m.from === sq || m.to === sq) {
      if (sq === 56) n.castling.wq = false;
      if (sq === 63) n.castling.wk = false;
      if (sq === 0) n.castling.bq = false;
      if (sq === 7) n.castling.bk = false;
    }
  }
  n.turn = s.turn === 'w' ? 'b' : 'w';
  return n;
}

export function inCheck(s, side) {
  const k = findKing(s.board, side);
  return k >= 0 && isAttacked(s.board, k, side === 'w' ? 'b' : 'w');
}

export function legalMoves(s, from) {
  return pseudoMoves(s, from).filter((m) => !inCheck(applyMove(s, m), s.turn));
}

export function allLegalMoves(s) {
  const out = [];
  for (let i = 0; i < 64; i++) {
    const p = s.board[i];
    if (p && p.c === s.turn) out.push(...legalMoves(s, i));
  }
  return out;
}

export function status(s) {
  if (allLegalMoves(s).length === 0) return inCheck(s, s.turn) ? 'checkmate' : 'stalemate';
  return inCheck(s, s.turn) ? 'check' : 'playing';
}
```

- [ ] **Step 4: Chạy test xác nhận pass**

Run: `npx vitest run test/games-engine.test.js`
Expected: PASS (19 tests).

- [ ] **Step 5: Commit**

```bash
git add public/games/chess/engine.js test/games-engine.test.js
git commit -m "feat: chess engine apply move, legality, check and mate detection"
```

---

### Task 11: Chess bot (2 ply + nhiễu) + hint + tests

**Files:**
- Create: `public/games/chess/bot.js`
- Test: `test/games-bot.test.js` (create)

- [ ] **Step 1: Viết test thất bại**

Tạo `test/games-bot.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { customState, squareIndex, applyMove, status } from '../../public/games/chess/engine.js';
import { chooseMove, suggestMove } from '../../public/games/chess/bot.js';

describe('sparkle bot', () => {
  it('captures a hanging queen', () => {
    // Hậu trắng d5 không được bảo vệ; xe đen d8 ăn được
    const s = customState(
      [['e1', 'k', 'w'], ['d5', 'q', 'w'], ['e8', 'k', 'b'], ['d8', 'r', 'b']],
      'b', { wk: false, wq: false, bk: false, bq: false });
    const mv = chooseMove(s);
    expect(mv).not.toBeNull();
    expect(mv.to).toBe(squareIndex('d5'));
  });

  it('suggestMove finds mate in one', () => {
    // Trắng: Vb6 + Hc7; Đen: Va8 → Hc7-b7 là chiếu hết
    const s = customState(
      [['b6', 'k', 'w'], ['c7', 'q', 'w'], ['a8', 'k', 'b']],
      'w', { wk: false, wq: false, bk: false, bq: false });
    const mv = suggestMove(s);
    expect(mv).not.toBeNull();
    expect(mv.from).toBe(squareIndex('c7'));
    expect(status(applyMove(s, mv))).toBe('checkmate');
  });

  it('returns null when no moves', () => {
    const s = customState(
      [['g6', 'k', 'w'], ['f7', 'q', 'w'], ['h8', 'k', 'b']],
      'b', { wk: false, wq: false, bk: false, bq: false });
    expect(chooseMove(s)).toBeNull(); // stalemate
  });
});
```

- [ ] **Step 2: Chạy test xác nhận fail**

Run: `npx vitest run test/games-bot.test.js`
Expected: FAIL — Cannot find module `bot.js`.

- [ ] **Step 3: Tạo `public/games/chess/bot.js`**

```js
// Sparkle Bot — tìm 2 ply (mình đi + nước đáp trả tốt nhất của đối thủ),
// đánh giá chỉ theo lực quân + nhiễu ngẫu nhiên nhỏ để dễ chơi và không lặp.
import { allLegalMoves, applyMove, inCheck } from './engine.js';

const VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

function material(s) {
  let m = 0;
  for (const p of s.board) if (p) m += (p.c === 'w' ? 1 : -1) * VAL[p.t];
  return m;
}

// điểm tốt nhất cho phe `s.turn` nhìn `depth` ply phía trước
function bestScore(s, depth) {
  const moves = allLegalMoves(s);
  if (moves.length === 0) return inCheck(s, s.turn) ? -999 : 0;
  if (depth === 0) {
    const m = material(s);
    return s.turn === 'w' ? m : -m;
  }
  let best = -Infinity;
  for (const mv of moves) {
    const v = -bestScore(applyMove(s, mv), depth - 1);
    if (v > best) best = v;
  }
  return best;
}

// Nước đi của bot (phe `s.turn`) — có nhiễu ngẫu nhiên
export function chooseMove(s) {
  const moves = allLegalMoves(s);
  if (moves.length === 0) return null;
  let best = null;
  let bestV = -Infinity;
  for (const mv of moves) {
    const v = -bestScore(applyMove(s, mv), 1) + Math.random() * 0.5;
    if (v > bestV) { bestV = v; best = mv; }
  }
  return best;
}

// Gợi ý cho người (phe `s.turn`) — deterministic, không nhiễu
export function suggestMove(s) {
  const moves = allLegalMoves(s);
  if (moves.length === 0) return null;
  let best = null;
  let bestV = -Infinity;
  for (const mv of moves) {
    const v = -bestScore(applyMove(s, mv), 1);
    if (v > bestV) { bestV = v; best = mv; }
  }
  return best;
}
```

- [ ] **Step 4: Chạy test xác nhận pass**

Run: `npx vitest run test/games-bot.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add public/games/chess/bot.js test/games-bot.test.js
git commit -m "feat: chess bot with 2-ply search and deterministic hints"
```

---

### Task 12: Chess — UI (bàn cờ, highlight, gợi ý, undo, log)

**Files:**
- Modify: `public/games/chess/ui.js` (thay stub)

- [ ] **Step 1: Thay stub bằng implementation**

```js
import { el, SPARK_ICON, BACK_ARROW } from '../dom.js';
import { esc } from '../../util.js';
import { t } from '../../i18n.js';
import { loadProgress, saveProgress } from '../progress.js';
import {
  initialState, applyMove, legalMoves, status, inCheck, findKing,
  squareName,
} from './engine.js';
import { chooseMove, suggestMove } from './bot.js';

const GLYPH = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' };
const NAME = {
  vi: { p: 'Tốt', n: 'Mã', b: 'Tượng', r: 'Xe', q: 'Hậu', k: 'Vua' },
  en: { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King' },
};
const VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

export function renderChess(body, ctx) {
  const L = ctx.lang;
  let stats = loadProgress(ctx.profileId, 'chess') || { won: 0, lost: 0 };
  let states = [initialState()];
  let selected = null;      // ô đang chọn
  let targets = [];         // [{from,to,flag}] hợp lệ từ ô chọn
  let hintMove = null;
  let over = false;
  let busyBot = false;

  const score = el('span', 'gt-score', t(L, 'chStats').replace('{w}', stats.won).replace('{l}', stats.lost));
  ctx.top.appendChild(score);

  const say = el('div', 'game-say');
  const wrap = el('div', 'chess-wrap');
  const boardEl = el('div', 'chessboard');
  boardEl.setAttribute('role', 'grid');
  const logEl = el('div', 'chess-log');
  const actions = el('div', 'game-actions');

  function cur() { return states[states.length - 1]; }

  function persist() {
    saveProgress(ctx.profileId, 'chess', stats);
    score.textContent = t(L, 'chStats').replace('{w}', stats.won).replace('{l}', stats.lost);
  }

  function sayMsg(html, kind) {
    say.className = 'game-say' + (kind ? ' ' + kind : '');
    say.innerHTML = '<div class="gs-av">' + SPARK_ICON + '</div><div class="gs-text">' + html + '</div>';
  }

  function describeMove(stBefore, m) {
    const p = stBefore.board[m.from];
    const captured = stBefore.board[m.to] || m.flag === 'ep';
    const capName = m.flag === 'ep' ? (L === 'en' ? 'pawn' : 'Tốt') : (stBefore.board[m.to] ? NAME[L][stBefore.board[m.to].t] : null);
    let txt = GLYPH[p.t] + ' ' + squareName(m.from) + '→' + squareName(m.to);
    if (captured) txt += ' ×' + GLYPH[m.flag === 'ep' ? 'p' : stBefore.board[m.to].t];
    return { txt, capName, capVal: capName ? VAL[m.flag === 'ep' ? 'p' : stBefore.board[m.to].t] : 0 };
  }

  function draw() {
    const st = cur();
    boardEl.innerHTML = '';
    boardEl.classList.toggle('over', over);
    const chkSq = inCheck(st, st.turn) ? findKing(st.board, st.turn) : -1;
    for (let sq = 0; sq < 64; sq++) {
      const r = Math.floor(sq / 8), c = sq % 8;
      const b = el('button', 'sq ' + ((r + c) % 2 === 0 ? 'light' : 'dark'));
      b.type = 'button';
      const p = st.board[sq];
      if (p) {
        b.appendChild(el('span', 'pc ' + p.c, GLYPH[p.t]));
        b.setAttribute('aria-label', NAME[L][p.t] + ' ' + (p.c === 'w' ? (L === 'en' ? 'white' : 'trắng') : (L === 'en' ? 'black' : 'đen')) + ' ' + squareName(sq));
      } else {
        b.setAttribute('aria-label', squareName(sq));
      }
      if (selected === sq) b.classList.add('sel');
      if (targets.some((m) => m.to === sq)) {
        b.classList.add('dest');
        if (st.board[sq] || sq === st.ep) b.classList.add('cap');
      }
      if (sq === chkSq) b.classList.add('chk');
      if (hintMove && (sq === hintMove.from || sq === hintMove.to)) b.classList.add('hintmark');
      b.addEventListener('click', () => onSquare(sq));
      boardEl.appendChild(b);
    }
  }

  function onSquare(sq) {
    if (over || busyBot) return;
    const st = cur();
    if (selected !== null) {
      const mv = targets.find((m) => m.to === sq);
      if (mv) { humanMove(mv); return; }
    }
    const p = st.board[sq];
    if (p && p.c === 'w') {
      selected = sq;
      targets = legalMoves(st, sq);
      hintMove = null;
    } else {
      selected = null;
      targets = [];
    }
    draw();
  }

  function afterMove(stBefore, m) {
    const info = describeMove(stBefore, m);
    logEl.appendChild(el('span', '', esc(info.txt)));
    const st = cur();
    const s = status(st);
    if (s === 'checkmate') { finish(stBefore.turn); return true; }
    if (s === 'stalemate') { finish(null); return true; }
    if (stBefore.board[m.to] || m.flag === 'ep') {
      const who = stBefore.turn === 'w' ? 'chCapture' : 'chAte';
      sayMsg(t(L, who).replace('{name}', esc(info.capName)).replace('{n}', info.capVal), stBefore.turn === 'w' ? 'win' : 'warn');
    } else if (s === 'check') {
      sayMsg(esc(t(L, 'chCheck')), 'warn');
    }
    return false;
  }

  function humanMove(mv) {
    const stBefore = cur();
    states.push(applyMove(stBefore, mv));
    selected = null; targets = []; hintMove = null;
    draw();
    if (afterMove(stBefore, mv)) return;
    busyBot = true;
    setTimeout(botMove, 450);
  }

  function botMove() {
    const stBefore = cur();
    const mv = chooseMove(stBefore);
    if (!mv) { busyBot = false; finish(null); return; }
    states.push(applyMove(stBefore, mv));
    draw();
    busyBot = false;
    afterMove(stBefore, mv);
  }

  function finish(winnerSide) {
    over = true;
    draw();
    if (winnerSide === null) {
      sayMsg('🤝 <strong>' + esc(t(L, 'chDraw')) + '</strong>', 'win');
    } else if (winnerSide === 'w') {
      stats.won += 1;
      sayMsg('🏆 <strong>' + esc(t(L, 'chWin')) + '</strong>', 'win');
    } else {
      stats.lost += 1;
      sayMsg('💛 ' + esc(t(L, 'chLose')), 'warn');
    }
    persist();
  }

  function newGame() {
    states = [initialState()];
    selected = null; targets = []; hintMove = null; over = false; busyBot = false;
    logEl.innerHTML = '';
    sayMsg(esc(t(L, 'chIntro')));
    draw();
  }

  const newBtn = el('button', 'gbtn primary', '♔ ' + esc(t(L, 'chNewGame')));
  newBtn.type = 'button';
  newBtn.addEventListener('click', newGame);

  const undoBtn = el('button', 'gbtn', BACK_ARROW + esc(t(L, 'chUndo')));
  undoBtn.type = 'button';
  undoBtn.addEventListener('click', () => {
    if (busyBot) return;
    // bỏ nước bot + nước người (2 ply), tối thiểu giữ bàn đầu
    if (states.length >= 3) states.pop();
    if (states.length >= 2) states.pop();
    over = false; selected = null; targets = []; hintMove = null;
    draw();
    if (logEl.lastChild) logEl.removeChild(logEl.lastChild);
    if (logEl.lastChild) logEl.removeChild(logEl.lastChild);
  });

  const hintBtn = el('button', 'gbtn hint', '💡 ' + esc(t(L, 'chHint')));
  hintBtn.type = 'button';
  hintBtn.addEventListener('click', () => {
    if (over || busyBot || cur().turn !== 'w') return;
    const mv = suggestMove(cur());
    if (!mv) return;
    hintMove = mv;
    const p = cur().board[mv.from];
    sayMsg(L === 'en'
      ? '💡 Try moving your <strong>' + esc(NAME.en[p.t]) + '</strong> from ' + squareName(mv.from) + ' to ' + squareName(mv.to) + '.'
      : '💡 Thử đưa <strong>' + esc(NAME.vi[p.t]) + '</strong> từ ' + squareName(mv.from) + ' sang ' + squareName(mv.to) + ' nhé.', 'warn');
    draw();
  });

  const backBtn = el('button', 'gbtn', BACK_ARROW + esc(t(L, 'gameBack')));
  backBtn.type = 'button';
  backBtn.addEventListener('click', ctx.back);

  actions.appendChild(newBtn);
  actions.appendChild(undoBtn);
  actions.appendChild(hintBtn);
  actions.appendChild(backBtn);

  wrap.appendChild(boardEl);
  wrap.appendChild(logEl);

  body.appendChild(say);
  body.appendChild(wrap);
  body.appendChild(actions);

  sayMsg(esc(t(L, 'chIntro')));
  draw();
}
```

- [ ] **Step 2: Chạy toàn bộ test**

Run: `npx vitest run`
Expected: PASS hết (20 file test).

- [ ] **Step 3: Kiểm tra thủ công**

`npx vercel dev` → Trò chơi → Cờ vua cùng Sparkle:
- Bàn 8×8 quân Unicode, trắng dưới (ô 56..63 = rank 1); chạm tốt e2 → 2 chấm e3/e4
- Đi e4 → bot đen tự đi sau ~0.5s; log ghi nước ("♟ e7→e5")
- Ăn quân → bong bóng nói tên + giá trị quân; bị chiếu → ô vua đỏ + cảnh báo
- Gợi ý → viền vàng from/to + lời giải thích; Đi lại → rollback 2 nước
- Thua bằng fool's mate cho bot (f3, g4) → bot ăn chiếu hết, đếm Thua +1
- Ván mới reset bàn, giữ thống kê; reload giữ W/L

- [ ] **Step 4: Commit**

```bash
git add public/games/chess/ui.js
git commit -m "feat: chess game ui with highlights, hints, undo and move log"
```

---

### Task 13: Tổng kết — docs smoke checklist + chạy sạch toàn bộ

**Files:**
- Modify: `docs/smoke-checklist.md` (thêm mục Games)

- [ ] **Step 1: Thêm section Games vào `docs/smoke-checklist.md`** (cuối file)

```markdown
## Games (Sparkle Games)

- [ ] Rail có nút "Trò chơi"/"Games" (biệt lập với 5 subject) — bấm mở hub, Back quay lại chat, state chat nguyên vẹn
- [ ] Hub 4 card đúng màu (xanh/tím/nâu/lục); đổi ngôn ngữ tại hub/hot game → text cập nhật
- [ ] Treasure: sai 2 lần hiện 2 mức hint, không lộ đáp án; qua chặng mở node kế; hết level mở level mới; tổng gem giữ qua reload
- [ ] Word Quest: tap thẻ → tap ô; sai thứ tự chỉ ô sai đầu; đúng → tinh thể lớn; hết 4 câu mở vùng mới
- [ ] Detective: trả lời đúng hết bước mới được tố; tố sai được nudge không lộ thủ phạm; 3 vụ tuần tự
- [ ] Chess: chấm highlight nước hợp lệ; nhập thành + phong cấp tự hậu hoạt động; Gợi ý/Đi lại/Ván mới; W/L lưu qua reload
- [ ] Private mode (block localStorage): game vẫn chơi, không crash console
```

- [ ] **Step 2: Chạy sạch toàn bộ test**

Run: `npx vitest run`
Expected: PASS — 20 file test, 0 fail.

- [ ] **Step 3: Kiểm tra CSP không đổi**

Soát `vercel.json`: không thêm domain nào (games chỉ dùng self assets + font Google đã có). Không cần chỉnh.

- [ ] **Step 4: Commit**

```bash
git add docs/smoke-checklist.md
git commit -m "docs: add games section to smoke checklist"
```

---

## Ghi chú tự-review kế hoạch (đã sửa tại chỗ)

1. **Spec coverage:** hub (T3), rail+switch (T1), progress (T2), treasure gen+UI (T4/T5), wordquest data+UI (T6/T7), detective (T6 data + T8 UI), chess engine/bot/UI (T9–T12), docs (T13). Đủ 100% spec sections 2–7.
2. **File `public/games/dom.js`** là bổ sung nhỏ ngoài sơ đồ spec (helper el/BACK_ARROW/SPARK_ICON dùng chung 4 game) — tránh lặp code, không đổi kiến trúc.
3. **Type consistency:** `render*(body, ctx)` với `ctx = {lang, profileId, top, back}` thống nhất ở hub và mọi game; engine exports khớp giữa test và implement (`applyMove(s, m)`, `legalMoves(s, from)`, `status(s)`).
4. **Các lỗi tự bắt & sửa trong bản nháp:** (a) games.css dùng `var(--treasure-sea)`… mà token chưa định nghĩa → đã thêm `:root` riêng trong games.css; (b) câu turtle zone 5 dùng `.slice(0,7)` làm gãy câu → thay bằng câu 7 từ thật; (c) Word Quest: `placed` đổi từ "chữ" sang "index trong bank" để đúng với câu có từ trùng + `stopPropagation` khi trả thẻ; (d) Task 10 bỏ test placeholder rác, thay bằng test vua-đang-bị-chiếu thật; (e) Task 12 `classList.add('dest cap')` (chuỗi có dấu cách — không hợp lệ) tách thành 2 lệnh riêng.

