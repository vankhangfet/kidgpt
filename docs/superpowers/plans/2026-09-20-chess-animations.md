# Chess Animations (hiệu ứng + âm thanh cờ vua) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm hiệu ứng sinh động cho game cờ vua: trượt quân FLIP, ghost/khay quân bị bắt, mũi tên gợi ý lấp lánh, highlight nước vừa đi + chiếu nhấp nháy, "Sparkle đang nghĩ…", pháo giấy/trái tim, và âm thanh WebAudio với nút bật/tắt.

**Architecture:** Lớp trình bày đặt trên code hiện có, không đổi engine/bot. Module thuần mới `chess/fx.js` (toán FLIP, hình học mũi tên, spec pháo giấy, khay quân bị bắt) + `chess/sfx.js` (WebAudio synth + mute). `ui.js` wrap bàn cờ trong container định vị để overlay (mũi tên/ghost/pháo giấy) không bị `draw()` xóa. CSS keyframes trong `games.css`, tắt toàn bộ qua `prefers-reduced-motion`.

**Tech Stack:** Vanilla JS ES modules, CSS keyframes, WebAudio (không file/nhetwork), Vitest node env.

**Spec:** `docs/superpowers/specs/2026-09-20-chess-animations-design.md`

**Lưu ý:** mọi lệnh chạy từ repo root. Test: `npx vitest run <file>`. Không đổi `api/`, engine, bot. Suite hiện tại: 201/201 (19 files).

---

### Task 1: `chess/fx.js` — helpers thuần + tests

**Files:**
- Create: `public/games/chess/fx.js`
- Test: `test/games-chess-fx.test.js` (create)

- [ ] **Step 1: Viết test thất bại**

Tạo `test/games-chess-fx.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import {
  glideDelta, arrowPct, arrowHead, confettiSpec, traysFromMoves, prefersReducedMotion,
} from '../public/games/chess/fx.js';

describe('glideDelta', () => {
  it('returns offset from destination back to source (FLIP translate)', () => {
    const from = { left: 0, top: 300, width: 50, height: 50 };
    const to = { left: 300, top: 300, width: 50, height: 50 };
    expect(glideDelta(from, to)).toEqual({ dx: -300, dy: 0 });
    const from2 = { left: 300, top: 0, width: 50, height: 50 };
    const to2 = { left: 300, top: 350, width: 50, height: 50 };
    expect(glideDelta(from2, to2)).toEqual({ dx: 0, dy: -350 });
  });
});

describe('arrowPct', () => {
  const board = { left: 0, top: 0, width: 400, height: 400 };
  it('converts square centers to board % and shrinks by pad', () => {
    const from = { left: 0, top: 300, width: 50, height: 50 };    // center (25,350)
    const to = { left: 300, top: 300, width: 50, height: 50 };    // center (325,350)
    expect(arrowPct(board, from, to, 14)).toEqual({ x1: 20.25, y1: 87.5, x2: 63.25, y2: 87.5 });
  });
  it('stays within 0..100 for a long diagonal', () => {
    const from = { left: 0, top: 0, width: 50, height: 50 };
    const to = { left: 350, top: 350, width: 50, height: 50 };
    const g = arrowPct(board, from, to, 10);
    for (const v of [g.x1, g.y1, g.x2, g.y2]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});

describe('arrowHead', () => {
  it('points right for a horizontal arrow', () => {
    expect(arrowHead(10, 50, 60, 50)).toBe('64,50 58,47.5 58,52.5');
  });
  it('points down for a vertical arrow', () => {
    const pts = arrowHead(50, 10, 50, 60).split(' ').map((p) => p.split(',').map(Number));
    expect(pts[0][0]).toBeCloseTo(50);
    expect(pts[0][1]).toBeCloseTo(64);
  });
});

describe('confettiSpec', () => {
  it('builds 24 pieces with deterministic values from a seeded rng', () => {
    const spec = confettiSpec(() => 0.5);
    expect(spec).toHaveLength(24);
    for (const p of spec) {
      expect(p.left).toBe(50);
      expect(p.delay).toBe(150);
      expect(p.duration).toBeGreaterThanOrEqual(1100);
      expect(p.duration).toBeLessThanOrEqual(1600);
      expect(p.rotate).toBe(180);
      expect(p.color).toMatch(/^#/);
    }
  });
});

describe('traysFromMoves', () => {
  it('splits captures by mover, skipping quiet moves', () => {
    const moves = [
      { mover: 'w', capT: 'q' },
      { mover: 'b', capT: null },
      { mover: 'b', capT: 'p' },
      { mover: 'w', capT: 'p' },
    ];
    expect(traysFromMoves(moves)).toEqual({ byW: ['q', 'p'], byB: ['p'] });
  });
  it('empty moves give empty trays', () => {
    expect(traysFromMoves([])).toEqual({ byW: [], byB: [] });
  });
});

describe('prefersReducedMotion', () => {
  it('reads matchMedia when present', () => {
    expect(prefersReducedMotion({ matchMedia: () => ({ matches: true }) })).toBe(true);
    expect(prefersReducedMotion({ matchMedia: () => ({ matches: false }) })).toBe(false);
  });
  it('defaults to false without matchMedia', () => {
    expect(prefersReducedMotion({})).toBe(false);
    expect(prefersReducedMotion(null)).toBe(false);
  });
});
```

- [ ] **Step 2: Chạy test xác nhận fail**

Run: `npx vitest run test/games-chess-fx.test.js`
Expected: FAIL — Cannot find module `../public/games/chess/fx.js`.

- [ ] **Step 3: Tạo `public/games/chess/fx.js`**

```js
// Hiệu ứng cờ vua — hàm thuần, test được (không chạm DOM).

// FLIP: quân mới ở ô đích cần dịch về vị trí ô nguồn rồi transition về 0
export function glideDelta(fromRect, toRect) {
  return { dx: fromRect.left - toRect.left, dy: fromRect.top - toRect.top };
}

// Toạ độ % (SVG viewBox 0 0 100 100) cho mũi tên ô nguồn → ô đích, lùi padPct
// hai đầu để không chạm tâm quân và chừa chỗ đầu mũi tên.
export function arrowPct(boardRect, fromRect, toRect, padPct) {
  const pct = (rect) => ({
    x: ((rect.left + rect.width / 2 - boardRect.left) / boardRect.width) * 100,
    y: ((rect.top + rect.height / 2 - boardRect.top) / boardRect.height) * 100,
  });
  const a = pct(fromRect);
  const b = pct(toRect);
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const p = padPct || 14;
  const ux = (b.x - a.x) / len;
  const uy = (b.y - a.y) / len;
  return {
    x1: a.x + ux * p,
    y1: a.y + uy * p,
    x2: b.x - ux * (p + 4),
    y2: b.y - uy * (p + 4),
  };
}

// Tam giác đầu mũi tên (polygon points) tại (x2,y2) hướng theo mũi tên
export function arrowHead(x1, y1, x2, y2) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const hx = Math.cos(ang);
  const hy = Math.sin(ang);
  const px = -hy;
  const py = hx;
  const tip = (x2 + hx * 4).toFixed(1).replace(/\.0$/, '') + ',' + (y2 + hy * 4).toFixed(1).replace(/\.0$/, '');
  const b1 = (x2 - hx * 2 + px * 2.5).toFixed(1).replace(/\.0$/, '') + ',' + (y2 - hy * 2 + py * 2.5).toFixed(1).replace(/\.0$/, '');
  const b2 = (x2 - hx * 2 - px * 2.5).toFixed(1).replace(/\.0$/, '') + ',' + (y2 - hy * 2 - py * 2.5).toFixed(1).replace(/\.0$/, '');
  return tip + ' ' + b1 + ' ' + b2;
}

export const CONFETTI_COLORS = ['#ef6a4e', '#30a5a2', '#e8bf59', '#5a5fd1', '#e05a92', '#37b86b'];

// 24 mảnh pháo giấy; rand cho phép seed để test (mặc định Math.random)
export function confettiSpec(rand) {
  const r = typeof rand === 'function' ? rand : Math.random;
  const out = [];
  for (let i = 0; i < 24; i++) {
    out.push({
      left: Math.round(r() * 100),
      delay: Math.round(r() * 300),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rotate: Math.round(r() * 360),
      duration: 1100 + Math.round(r() * 500),
    });
  }
  return out;
}

// moves: [{mover:'w'|'b', capT: loại quân bị ăn | null}] theo thứ tự
export function traysFromMoves(moves) {
  const byW = [];
  const byB = [];
  for (const m of moves) {
    if (m.capT) (m.mover === 'w' ? byW : byB).push(m.capT);
  }
  return { byW, byB };
}

export function prefersReducedMotion(win) {
  try {
    const w = win || window;
    return !!(w && w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (e) {
    return false;
  }
}
```

- [ ] **Step 4: Chạy test xác nhận pass**

Run: `npx vitest run test/games-chess-fx.test.js`
Expected: PASS (10 tests).

- [ ] **Step 5: Commit**

```bash
git add public/games/chess/fx.js test/games-chess-fx.test.js
git commit -m "feat: chess fx helpers for glide, arrows, confetti and trays"
```

---

### Task 2: `chess/sfx.js` — âm thanh WebAudio + tests

**Files:**
- Create: `public/games/chess/sfx.js`
- Test: `test/games-chess-fx.test.js` (append describe `sfx`)

- [ ] **Step 1: Append test thất bại** (cuối `test/games-chess-fx.test.js`)

```js
import { playSfx, isSoundOn, setSoundOn } from '../public/games/chess/sfx.js';

describe('sfx', () => {
  const store = new Map();
  beforeEach(() => {
    store.clear();
    globalThis.localStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    };
  });

  it('defaults to on and toggles persistently', () => {
    expect(isSoundOn()).toBe(true);
    setSoundOn(false);
    expect(isSoundOn()).toBe(false);
    setSoundOn(true);
    expect(isSoundOn()).toBe(true);
  });

  it('is silent and never throws without AudioContext', () => {
    const AC = globalThis.AudioContext;
    delete globalThis.AudioContext;
    delete globalThis.webkitAudioContext;
    expect(() => playSfx('move')).not.toThrow();
    globalThis.AudioContext = AC;
  });

  it('drives oscillators when a context exists', () => {
    let started = 0;
    class FakeGain {
      constructor() { this.gain = { setValueAtTime() {}, exponentialRampToValueAtTime() {} }; }
      connect() {}
    }
    class FakeOsc {
      constructor() { this.type = ''; this.frequency = { value: 0 }; }
      connect() {}
      start() { started += 1; }
      stop() {}
    }
    globalThis.AudioContext = class {
      constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; }
      createOscillator() { return new FakeOsc(); }
      createGain() { return new FakeGain(); }
    };
    playSfx('move');
    expect(started).toBe(1);
    playSfx('win');
    expect(started).toBe(4); // arpeggio 3 nốt
    playSfx('nope');
    expect(started).toBe(4); // hiệu ứng lạ → bỏ qua
  });

  it('muted sound plays nothing', () => {
    let started = 0;
    class FakeGain {
      constructor() { this.gain = { setValueAtTime() {}, exponentialRampToValueAtTime() {} }; }
      connect() {}
    }
    class FakeOsc {
      constructor() { this.type = ''; this.frequency = { value: 0 }; }
      connect() {}
      start() { started += 1; }
      stop() {}
    }
    globalThis.AudioContext = class {
      constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; }
      createOscillator() { return new FakeOsc(); }
      createGain() { return new FakeGain(); }
    };
    setSoundOn(false);
    playSfx('move');
    expect(started).toBe(0);
    setSoundOn(true);
  });
});
```

- [ ] **Step 2: Chạy test xác nhận fail**

Run: `npx vitest run test/games-chess-fx.test.js`
Expected: FAIL — Cannot find module `../public/games/chess/sfx.js`.

- [ ] **Step 3: Tạo `public/games/chess/sfx.js`**

```js
// Âm thanh cờ vua — WebAudio synth: không file, không network, an toàn CSP.
// AudioContext lazy: tạo ở lần phát đầu sau cử chỉ người dùng (autoplay policy);
// không có context thì im lặng bỏ qua.
const KEY = 'kidgpt-games:chess:sound';

let ctx = null;

function ac() {
  const AC = (typeof globalThis !== 'undefined' && (globalThis.AudioContext || globalThis.webkitAudioContext)) || null;
  if (!AC) { ctx = null; return null; }
  if (!ctx) {
    try { ctx = new AC(); } catch (e) { ctx = null; return null; }
  }
  if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
    try { ctx.resume().catch(() => {}); } catch (e) { /* bỏ qua */ }
  }
  return ctx;
}

function beep(c, freq, start, dur, type, vol) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type || 'sine';
  o.frequency.value = freq;
  const t0 = c.currentTime + start;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

const SFX = {
  move: (c) => beep(c, 220, 0, 0.07, 'triangle', 0.15),
  capture: (c) => { beep(c, 330, 0, 0.09, 'square', 0.07); beep(c, 180, 0.07, 0.11, 'square', 0.07); },
  check: (c) => { beep(c, 660, 0, 0.08, 'sine', 0.1); beep(c, 660, 0.12, 0.08, 'sine', 0.1); },
  win: (c) => { [523, 659, 784].forEach((f, i) => beep(c, f, i * 0.12, 0.16, 'sine', 0.12)); },
  lose: (c) => beep(c, 196, 0, 0.4, 'sine', 0.1),
  hint: (c) => { beep(c, 880, 0, 0.07, 'sine', 0.1); beep(c, 1175, 0.08, 0.1, 'sine', 0.1); },
};

export function playSfx(name) {
  if (!isSoundOn()) return;
  const fn = SFX[name];
  if (!fn) return;
  const c = ac();
  if (!c) return;
  try { fn(c); } catch (e) { /* trình duyệt chặn âm — bỏ qua */ }
}

export function isSoundOn() {
  try {
    const v = (typeof localStorage !== 'undefined') && localStorage.getItem(KEY);
    return v !== 'off';
  } catch (e) {
    return true;
  }
}

export function setSoundOn(on) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch (e) { /* private mode */ }
}
```

- [ ] **Step 4: Chạy test xác nhận pass**

Run: `npx vitest run test/games-chess-fx.test.js`
Expected: PASS (14 tests).

- [ ] **Step 5: Commit**

```bash
git add public/games/chess/sfx.js test/games-chess-fx.test.js
git commit -m "feat: webaudio sfx synth for chess with persisted mute"
```

---

### Task 3: CSS keyframes + i18n keys

**Files:**
- Modify: `public/games/games.css` (append section chess fx)
- Modify: `public/i18n.js` (thêm keys)
- Modify: `test/games-i18n.test.js` (mở rộng SHARED)

- [ ] **Step 1: Thêm keys i18n**

`public/i18n.js` — VI block (cạnh các key ch* hiện có):

```js
    chThinking: 'Sparkle đang nghĩ',
    chYourTurn: 'Đến lượt bạn nhé!',
    chYouTook: 'Quân bạn ăn',
    chBotTook: 'Bot ăn',
    soundOn: 'Bật âm thanh',
    soundOff: 'Tắt âm thanh',
```

EN block:

```js
    chThinking: 'Sparkle is thinking',
    chYourTurn: 'Your turn!',
    chYouTook: 'You captured',
    chBotTook: 'Bot captured',
    soundOn: 'Sound on',
    soundOff: 'Sound off',
```

`test/games-i18n.test.js` — thêm vào mảng SHARED: `'chThinking', 'chYourTurn', 'chYouTook', 'chBotTook', 'soundOn', 'soundOff',`

- [ ] **Step 2: Append vào cuối `public/games/games.css`**

```css
/* ---- chess fx (animations) ---- */
.chess-pos { position: relative; width: 100%; max-width: 460px; margin-inline: auto; }
.chess-fx {
  position: absolute; inset: 0; pointer-events: none; overflow: hidden;
  border-radius: 9px; font-size: clamp(22px, 5.5vw, 40px); z-index: 2;
}

/* FLIP glide */
.pc { transition: transform .22s ease-out; }

/* nước vừa đi */
.sq.last::before { content: ''; position: absolute; inset: 0; background: rgba(232, 195, 90, .3); }

/* vua bị chiếu nhấp nháy rồi giữ đỏ */
@keyframes chk-pulse {
  0%, 100% { box-shadow: inset 0 0 0 999px rgba(224, 106, 85, .85); }
  50% { box-shadow: inset 0 0 0 999px rgba(224, 106, 85, .3); }
}
.sq.chk { background: #e06a55; animation: chk-pulse .3s ease-in-out 3; }

/* ghost quân bị ăn */
@keyframes capture-pop {
  0% { transform: scale(1) rotate(0deg); opacity: .95; }
  100% { transform: scale(1.7) rotate(14deg); opacity: 0; }
}
.ghost-cap {
  position: absolute; display: grid; place-items: center;
  animation: capture-pop .3s ease-out forwards;
}
.ghost-cap .pc.w { color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,.55); }
.ghost-cap .pc.b { color: #24211d; text-shadow: 0 1px 1px rgba(255,255,255,.25); }

/* mũi tên gợi ý */
.chess-fx svg { width: 100%; height: 100%; }
.hint-arrow-line {
  stroke: var(--gold, #e8c35a); stroke-width: 2.6; stroke-linecap: round;
  stroke-dasharray: 6 5; fill: none; filter: drop-shadow(0 0 2px rgba(232,195,90,.8));
  animation: dash-run .6s linear infinite;
}
@keyframes dash-run { to { stroke-dashoffset: -11; } }
.hint-arrow-head { fill: var(--gold, #e8c35a); filter: drop-shadow(0 0 2px rgba(232,195,90,.8)); }
@keyframes hint-target {
  0%, 100% { box-shadow: inset 0 0 0 3px var(--gold, #e8c35a); }
  50% { box-shadow: inset 0 0 0 6px rgba(232, 195, 90, .55); }
}
.sq.hintmark { animation: hint-target .8s ease-in-out infinite; }

/* bong bóng đang nghĩ (tái dùng .thinking của app) */
.gs-text .thinking { display: inline-flex; gap: 4px; margin-left: 8px; vertical-align: middle; }
.gs-text .thinking span {
  width: 7px; height: 7px; border-radius: 50%; background: var(--tutor);
  animation: think-bounce 1s ease-in-out infinite;
}
.gs-text .thinking span:nth-child(2) { animation-delay: .15s; }
.gs-text .thinking span:nth-child(3) { animation-delay: .3s; }
@keyframes think-bounce {
  0%, 100% { transform: translateY(0); opacity: .5; }
  50% { transform: translateY(-4px); opacity: 1; }
}

/* khay quân bị bắt */
.trays { display: grid; gap: 4px; max-width: 460px; margin-inline: auto; width: 100%; }
.tray {
  display: flex; align-items: center; gap: 8px; min-height: 30px;
  font-size: clamp(18px, 4vw, 26px); line-height: 1;
}
.tray .t-label { font-family: var(--font-display); font-weight: 700; font-size: 12px; color: var(--muted); white-space: nowrap; }
.tray .t-pcs { letter-spacing: 2px; }
.tray .t-pcs.w { color: #8d97ad; }
.tray .t-pcs.b { color: #3c3a36; }

/* pháo giấy + trái tim */
@keyframes confetti-fall {
  0% { transform: translateY(-4%) rotate(0deg); opacity: 1; }
  100% { transform: translateY(115%) rotate(540deg); opacity: 0; }
}
.confetti-bit {
  position: absolute; top: -4%; width: 8px; height: 12px; border-radius: 2px;
  animation: confetti-fall linear forwards;
}
@keyframes heart-fall {
  0% { transform: translateY(-4%) scale(1); opacity: .95; }
  100% { transform: translateY(118%) scale(.8); opacity: 0; }
}
.heart-bit { position: absolute; top: -6%; font-size: 18px; animation: heart-fall 1.6s ease-in forwards; }

/* quân thắng nhảy nhẹ */
@keyframes win-bounce {
  0%, 100% { transform: translateY(0); }
  40% { transform: translateY(-16%); }
}
.chessboard.celebrate .pc.w { animation: win-bounce .5s ease-in-out 2; }

/* tôn trọng người nhạy cảm chuyển động */
@media (prefers-reduced-motion: reduce) {
  .pc { transition: none; }
  .sq.chk, .sq.hintmark, .chessboard.celebrate .pc.w,
  .confetti-bit, .heart-bit, .ghost-cap { animation: none; }
  .hint-arrow-line { animation: none; }
}
```

- [ ] **Step 3: Chạy test**

Run: `npx vitest run`
Expected: PASS — 20 files, 215/215 (201 + 10 fx + 4 sfx; i18n SHARED mở rộng không thêm test mới, chỉ key).

- [ ] **Step 4: Commit**

```bash
git add public/games/games.css public/i18n.js test/games-i18n.test.js
git commit -m "feat: chess animation keyframes, thinking dots, trays and fx i18n"
```

---

### Task 4: `chess/ui.js` — wire toàn bộ hiệu ứng

**Files:**
- Modify: `public/games/chess/ui.js`
- Modify: `docs/smoke-checklist.md` (1 dòng mới)

Không test unit mới (DOM); verify bằng suite xanh + checklist thủ công.

- [ ] **Step 1: Sửa `public/games/chess/ui.js`**

1a. Imports — thêm vào khối import hiện có:

```js
import { glideDelta, arrowPct, arrowHead, confettiSpec, traysFromMoves, prefersReducedMotion } from './fx.js';
import { playSfx, isSoundOn, setSoundOn } from './sfx.js';
```

1b. Thay đoạn dựng DOM `wrap.appendChild(boardEl); wrap.appendChild(logEl);` bằng:

```js
const posEl = el('div', 'chess-pos');
const fxEl = el('div', 'chess-fx');
posEl.appendChild(boardEl);
posEl.appendChild(fxEl);

const traysEl = el('div', 'trays');
const trayW = el('div', 'tray');
const trayB = el('div', 'tray');

wrap.appendChild(posEl);
wrap.appendChild(traysEl);
wrap.appendChild(logEl);
```

(Khai báo `posEl/fxEl/traysEl/trayW/trayB` ở cùng khu khai báo `boardEl`/`logEl` hiện có — chuyển 3 dòng `wrap.appendChild` cũ thành khối trên.)

1c. Thêm state (cạnh `let botTimer = null;`):

```js
  let moves = [];      // [{mv, mover, capT}] — song song với states
  let lastMove = null; // mv của nước vừa đi (highlight)
  let fxTimer = null;  // dọn pháo giấy/trái tim
```

1d. Thêm helpers (sau `clearBotTimer`):

```js
  function clearFxTimer() {
    if (fxTimer) { clearTimeout(fxTimer); fxTimer = null; }
  }

  function clearFx() {
    clearFxTimer();
    fxEl.innerHTML = '';
  }

  function playAndClearFx(ms) {
    fxTimer = setTimeout(() => {
      if (fxEl.isConnected) fxEl.innerHTML = '';
      fxTimer = null;
    }, ms);
  }

  function renderTrays() {
    const { byW, byB } = traysFromMoves(moves);
    trayW.innerHTML = byW.length
      ? '<span class="t-label">' + esc(t(L, 'chYouTook')) + '</span><span class="t-pcs b">' + byW.map((tp) => GLYPH[tp]).join('') + '</span>'
      : '';
    trayB.innerHTML = byB.length
      ? '<span class="t-label">' + esc(t(L, 'chBotTook')) + '</span><span class="t-pcs w">' + byB.map((tp) => GLYPH[tp]).join('') + '</span>'
      : '';
  }
```

(Trẻ cầm trắng: quân trẻ ăn là quân ĐEN → class `t-pcs b` cho trayW; bot ăn quân trắng → `t-pcs w` cho trayB.)

1e. FLIP glide + ghost + last-move trong `draw()`: thêm tham số và logic —
Sửa signature `function draw()` giữ nguyên nhưng sau vòng tạo 64 nút, thêm:

```js
    if (lastMove) {
      if (boardEl.children[lastMove.from]) boardEl.children[lastMove.from].classList.add('last');
      if (boardEl.children[lastMove.to]) boardEl.children[lastMove.to].classList.add('last');
    }
```

Thêm hàm mới (ngoài draw):

```js
  function applyGlide(move, victimType) {
    if (prefersReducedMotion()) return;
    const bFrom = boardEl.children[move.from];
    const bTo = boardEl.children[move.to];
    if (!bFrom || !bTo) return;
    const piece = bTo.querySelector('.pc');
    if (piece) {
      const d = glideDelta(bFrom.getBoundingClientRect(), bTo.getBoundingClientRect());
      if (d.dx || d.dy) {
        piece.style.transition = 'none';
        piece.style.transform = 'translate(' + d.dx + 'px,' + d.dy + 'px)';
        void piece.offsetWidth; // ép reflow rồi thả transition
        piece.style.transition = '';
        piece.style.transform = '';
      }
    }
    if (move.flag === 'castle') {
      const rookFrom = move.to + 1 > move.from ? move.from + 3 : move.from - 4;
      const rookTo = move.to + 1 > move.from ? move.from + 1 : move.from - 1;
      const rookEl = boardEl.children[rookTo] && boardEl.children[rookTo].querySelector('.pc');
      const rookFromEl = boardEl.children[rookFrom];
      if (rookEl && rookFromEl) {
        const d = glideDelta(rookFromEl.getBoundingClientRect(), boardEl.children[rookTo].getBoundingClientRect());
        if (d.dx || d.dy) {
          rookEl.style.transition = 'none';
          rookEl.style.transform = 'translate(' + d.dx + 'px,' + d.dy + 'px)';
          void rookEl.offsetWidth;
          rookEl.style.transition = '';
          rookEl.style.transform = '';
        }
      }
    }
    if (victimType) {
      const r = Math.floor(move.to / 8), c = move.to % 8;
      // sau applyMove, cur().turn là phe ĐỐI PHƯƠNG của người vừa đi —
      // quân bị ăn cùng phe với cur().turn nên ghost nhận class tương ứng
      const ghost = el('div', 'ghost-cap',
        '<span class="pc ' + (cur().turn === 'w' ? 'w' : 'b') + '">' + GLYPH[victimType] + '</span>');
      ghost.style.left = (c * 12.5) + '%';
      ghost.style.top = (r * 12.5) + '%';
      ghost.style.width = '12.5%';
      ghost.style.height = '12.5%';
      fxEl.appendChild(ghost);
      playAndClearFx(400);
    }
  }
```

1f. `describeMove` — trả thêm `victim` (loại quân bị ăn hoặc null). Sửa object return thành:

```js
    return {
      txt,
      capName: captured ? NAME[L][victim] : null,
      capVal: captured ? VAL[victim] : 0,
      victim: victim,
    };
```

1g. `afterMove` — record move, sounds, last-move, your-turn bubble. Thay đầu hàm:

```js
  function afterMove(stBefore, m) {
    const info = describeMove(stBefore, m);
    logEl.appendChild(el('span', '', esc(info.txt)));
    moves.push({ mv: m, mover: stBefore.turn, capT: info.victim });
    lastMove = m;
    renderTrays();
    playSfx(info.victim ? 'capture' : 'move');
    const st = cur();
    const s = status(st);
    if (s === 'checkmate') { finish(stBefore.turn); return true; }
    if (s === 'stalemate') { finish(null); return true; }
    if (info.capName) {
      const who = stBefore.turn === 'w' ? 'chCapture' : 'chAte';
      sayMsg(esc(t(L, who).replace('{name}', info.capName).replace('{n}', info.capVal)), stBefore.turn === 'w' ? 'win' : 'warn');
    } else if (s === 'check') {
      playSfx('check');
      sayMsg(esc(t(L, 'chCheck')), 'warn');
    } else if (stBefore.turn === 'b') {
      sayMsg(esc(t(L, 'chYourTurn')));
    }
    return false;
  }
```

1h. `humanMove` — glide + thinking + clear hint arrow. Thay thân:

```js
  function humanMove(mv) {
    const stBefore = cur();
    states.push(applyMove(stBefore, mv));
    selected = null; targets = []; hintMove = null;
    fxEl.innerHTML = '';
    draw();
    applyGlide(mv, lastMoveVictim(mv, stBefore));
    if (afterMove(stBefore, mv)) return;
    sayThinking();
    busyBot = true;
    botTimer = setTimeout(botMove, 450);
  }
```

Cần helper victim (describeMove cần stBefore; applyGlide nhận victimType):

```js
  function lastMoveVictim(mv, stBefore) {
    const isEp = mv.flag === 'ep';
    return isEp ? 'p' : (stBefore.board[mv.to] ? stBefore.board[mv.to].t : null);
  }
```

Và thinking bubble:

```js
  function sayThinking() {
    say.className = 'game-say';
    say.innerHTML = '<div class="gs-av">' + SPARK_ICON + '</div><div class="gs-text">' +
      esc(t(L, 'chThinking')) +
      ' <span class="thinking"><span></span><span></span><span></span></span></div>';
  }
```

1i. `botMove` — glide + ghost, thay thân:

```js
  function botMove() {
    botTimer = null;
    if (!boardEl.isConnected) return; // game đã bị tháo khỏi DOM — bỏ nước bot trễ
    const stBefore = cur();
    const mv = chooseMove(stBefore);
    if (!mv) { busyBot = false; finish(null); return; }
    states.push(applyMove(stBefore, mv));
    draw();
    applyGlide(mv, lastMoveVictim(mv, stBefore));
    busyBot = false;
    afterMove(stBefore, mv);
  }
```

(Giữ nguyên dòng isConnected guard hiện có — chỉ thêm draw→glide.)

1j. `finish` — celebrate + sounds. Thay thân:

```js
  function finish(winnerSide) {
    over = true;
    busyBot = false;
    clearBotTimer();
    draw();
    if (winnerSide === null) {
      sayMsg('🤝 <strong>' + esc(t(L, 'chDraw')) + '</strong>', 'win');
    } else if (winnerSide === 'w') {
      stats.won += 1;
      playSfx('win');
      sayMsg('🏆 <strong>' + esc(t(L, 'chWin')) + '</strong>', 'win');
      celebrate();
    } else {
      stats.lost += 1;
      playSfx('lose');
      sayMsg('💛 ' + esc(t(L, 'chLose')), 'warn');
      dropHearts();
    }
    persist();
  }

  function celebrate() {
    if (prefersReducedMotion()) return;
    boardEl.classList.add('celebrate');
    for (const p of confettiSpec()) {
      const bit = el('div', 'confetti-bit');
      bit.style.left = p.left + '%';
      bit.style.background = p.color;
      bit.style.animationDelay = p.delay + 'ms';
      bit.style.animationDuration = p.duration + 'ms';
      bit.style.transform = 'rotate(' + p.rotate + 'deg)';
      fxEl.appendChild(bit);
    }
    playAndClearFx(2000);
  }

  function dropHearts() {
    if (prefersReducedMotion()) return;
    for (let i = 0; i < 6; i++) {
      const h = el('div', 'heart-bit', '💛');
      h.style.left = (10 + i * 15) + '%';
      h.style.animationDelay = (i * 120) + 'ms';
      fxEl.appendChild(h);
    }
    playAndClearFx(2200);
  }
```

(Thanh chắn `playSfx('win')` đã gọi trong afterMove khi chiếu hết — celebrate không phát lại.)

1k. Hint — mũi tên + ping. Thay listener của `hintBtn`:

```js
  hintBtn.addEventListener('click', () => {
    if (over || busyBot || cur().turn !== 'w') return;
    const mv = suggestMove(cur());
    if (!mv) return;
    hintMove = mv;
    playSfx('hint');
    draw();
    drawHintArrow(mv);
    const p = cur().board[mv.from];
    sayMsg(L === 'en'
      ? '💡 Try moving your <strong>' + esc(NAME.en[p.t]) + '</strong> from ' + squareName(mv.from) + ' to ' + squareName(mv.to) + '.'
      : '💡 Thử đưa <strong>' + esc(NAME.vi[p.t]) + '</strong> từ ' + squareName(mv.from) + ' sang ' + squareName(mv.to) + ' nhé.', 'warn');
  });

  function drawHintArrow(mv) {
    if (prefersReducedMotion()) return;
    const bRect = boardEl.getBoundingClientRect();
    const fromR = boardEl.children[mv.from].getBoundingClientRect();
    const toR = boardEl.children[mv.to].getBoundingClientRect();
    const g = arrowPct(bRect, fromR, toR, 14);
    const head = arrowHead(g.x1, g.y1, g.x2, g.y2);
    fxEl.innerHTML =
      '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
      '<polyline class="hint-arrow-line" points="' + g.x1 + ',' + g.y1 + ' ' + g.x2 + ',' + g.y2 + '"/>' +
      '<polygon class="hint-arrow-head" points="' + head + '"/></svg>';
  }
```

1l. `onSquare` — xoá mũi tên khi chạm bàn: đầu hàm (sau guard busy/over) thêm `fxEl.innerHTML = '';` (chỉ xoá layer, hintMove vẫn giữ đến khi chọn/đi).

1m. Undo — đồng bộ moves/lastMove/trays/fx. Thay listener undo:

```js
  undoBtn.addEventListener('click', () => {
    if (busyBot) return;
    clearBotTimer();
    clearFx();
    let popped = 0;
    while (states.length > 1 && (popped === 0 || states[states.length - 1].turn !== 'w')) {
      states.pop();
      if (moves.length) moves.pop();
      popped += 1;
    }
    lastMove = moves.length ? moves[moves.length - 1].mv : null;
    over = false; selected = null; targets = []; hintMove = null;
    boardEl.classList.remove('celebrate');
    renderTrays();
    draw();
    for (let i = 0; i < popped; i++) {
      if (logEl.lastChild) logEl.removeChild(logEl.lastChild);
    }
  });
```

1n. `newGame` — reset mọi thứ fx:

```js
  function newGame() {
    clearBotTimer();
    clearFx();
    states = [initialState()];
    moves = [];
    lastMove = null;
    selected = null; targets = []; hintMove = null; over = false; busyBot = false;
    boardEl.classList.remove('celebrate');
    logEl.innerHTML = '';
    renderTrays();
    sayMsg(esc(t(L, 'chIntro')));
    draw();
  }
```

1o. Back button — thêm clearFx: `backBtn.addEventListener('click', () => { clearBotTimer(); clearFx(); ctx.back(); });`

1p. Nút âm thanh — thêm cạnh các nút hiện có:

```js
  const soundBtn = el('button', 'gbtn ghost', isSoundOn() ? '🔊' : '🔇');
  soundBtn.type = 'button';
  soundBtn.setAttribute('aria-label', t(L, isSoundOn() ? 'soundOn' : 'soundOff'));
  soundBtn.addEventListener('click', () => {
    const on = !isSoundOn();
    setSoundOn(on);
    soundBtn.textContent = on ? '🔊' : '🔇';
    soundBtn.setAttribute('aria-label', t(L, on ? 'soundOn' : 'soundOff'));
    if (on) playSfx('hint');
  });
```

và `actions.appendChild(soundBtn);` sau `actions.appendChild(backBtn);`.

1q. Cuối `renderChess` (khởi tạo): sau `sayMsg(...); draw();` thêm `renderTrays();`.

- [ ] **Step 2: Chạy toàn bộ test + smoke**

Run: `npx vitest run`
Expected: PASS — 20 files, 215/215.
Run: `node --input-type=module -e "await import('./public/games/hub.js'); console.log('ok')"`
Expected: `ok`.

- [ ] **Step 3: Kiểm tra thủ công** (`npx vercel dev` → Trò chơi → Cờ vua)
- Đi e2→e4: quân TRƯỢT mượt; bong bóng "Sparkle đang nghĩ…" 3 chấm nhảy; bot trả nước có glide + 2 ô `.last` vàng nhạt; tiếng "tách"
- Ăn quân: ghost phóng-to-mờ tại ô đích + tiếng 2 tông; khay "Quân bạn ăn" xuất glyph
- Bị chiếu: ô vua nhấp nháy đỏ 3 nhịp + beep
- Gợi ý: mũi tên vàng đứt chạy + ô đích nhấp nháy + ping; chạm bàn → mũi tên biến mất
- Thắng: pháo giấy rơi + quân trắng nhảy + arpeggio; thua: trái tim vàng + tông trầm
- 🔊/🔇 tắt/mở tiếng, reload giữ nguyên; Đi lại sau khi thắng: khay/last-move đúng, không confetti sót
- OS bật reduce-motion: không glide, không pháo giấy, không nhấp nháy

- [ ] **Step 4: Thêm 1 dòng vào `docs/smoke-checklist.md` (mục Chess)**

```markdown
- [ ] Chess animations: quân trượt mượt khi đi, ghost + khay quân bị ăn, mũi tên gợi ý lấp lánh, ô nước vừa đi vàng nhạt, vua chiếu nhấp nháy, "đang nghĩ…" 3 chấm, pháo giấy khi thắng; 🔊/🔇 hoạt động qua reload
```

- [ ] **Step 5: Commit**

```bash
git add public/games/chess/ui.js docs/smoke-checklist.md
git commit -m "feat: wire chess glide, capture fx, hint arrow, thinking and celebrations"
```

---

## Ghi chú tự-review kế hoạch (đã sửa tại chỗ)

1. **Spec coverage:** §2.1 glide (T4 applyGlide + .pc transition T3), §2.2 ghost+trays (T3 CSS + T4), §2.3 last/chk (T3 CSS + T4 draw), §2.4 arrow (T1 arrowPct/arrowHead + T3 CSS + T4), §2.5 thinking (T3 CSS + T4 sayThinking), §2.6 confetti/hearts (T1 confettiSpec + T3 CSS + T4), §3 sfx + mute (T2 + nút T4), §5 reduced-motion (T1 fn + T3 media + T4 checks), §6 tests (T1/T2). Đủ.
2. **Type consistency:** `moves` entry `{mv, mover, capT}` nhất quán giữa afterMove (push) / undo (pop) / traysFromMoves; `describeMove` return thêm `victim` — mọi caller cũ (log) không đổi.
3. **Lưu ý castle-rook glide:** xác định rook from/to bằng so sánh `move.to > move.from` (king-side to = from+2 > from; queen-side to = from−2 < from) — rookFrom = from±3/−4, rookTo = from±1/−1, khớp engine.
4. **undo sau khi thắng:** boardEl mất class celebrate → quân không nhảy sót; confetti đã dọn qua clearFx.
