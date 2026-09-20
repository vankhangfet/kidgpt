# Gate Redesign (đăng nhập + hồ sơ theo authen-mock) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm mới cả 3 màn gate theo `mock/authen-mock.html`: split-card đăng nhập (world panel + Google panel), picker/manager nâng cấp cùng ngôn ngữ, nền dots bay — không đổi logic auth.

**Architecture:** Art SVG tách vào `public/gate-art.js` (chuỗi thuần, mọi class đặt tiền tố `g-` để không đụng style app). Section gate trong `styles.css` được thay toàn bộ (một chủ sở hữu). `gate.js` thêm wrapper `.g-screens` + lớp `.g-dots` bền qua các lần re-render; renderLogin viết lại theo mockup với Google button 3 state thật.

**Tech Stack:** Vanilla JS ES modules, CSS thuần (token oklch mở rộng), i18n vi/en, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-20-gate-redesign-design.md` · **Mockup (nguồn copy nguyên văn):** `mock/authen-mock.html`

**Lưu ý:** mọi lệnh từ repo root. Suite hiện tại: 218/218 (20 files). Không đụng `api/`, `games/`, engine.

---

### Task 1: `public/gate-art.js` — art SVG + tests

**Files:**
- Create: `public/gate-art.js`
- Test: `test/gate-art.test.js` (create)

- [ ] **Step 1: Viết test thất bại**

Tạo `test/gate-art.test.js`:

```js
import { describe, it, expect } from 'vitest';
import {
  starSvg, cloudSvg, HILLS, SPARKLE_MASCOT, HERO_BADGE, HERO_BADGE_SAD,
  BUDDY_ROBOT, BUDDY_OWL, GOOGLE_ICON, SPINNER, BRAND_MARK,
  ICON_SHIELD, ICON_CHECK, ICON_LOCK, ICON_NOTE, ICON_GAMES, ICON_PERSON, ICON_BOOK, ICON_ATOM,
} from '../public/gate-art.js';

describe('gate art', () => {
  it('scene helpers embed class and viewBox', () => {
    expect(starSvg('s2')).toContain('g-star s2');
    expect(starSvg('s2')).toContain('viewBox="0 0 24 24"');
    expect(cloudSvg('c1')).toContain('g-cloud c1');
    expect(cloudSvg('c1')).toContain('viewBox="0 0 64 28"');
  });

  it('mascots and icons are non-empty svg strings', () => {
    const all = [HILLS, SPARKLE_MASCOT, HERO_BADGE, HERO_BADGE_SAD, BUDDY_ROBOT, BUDDY_OWL,
      GOOGLE_ICON, SPINNER, BRAND_MARK, ICON_SHIELD, ICON_CHECK, ICON_LOCK,
      ICON_NOTE, ICON_GAMES, ICON_PERSON, ICON_BOOK, ICON_ATOM];
    for (const s of all) {
      expect(typeof s).toBe('string');
      expect(s.startsWith('<svg')).toBe(true);
      expect(s.length).toBeGreaterThan(40);
      expect(s.endsWith('</svg>')).toBe(true);
    }
  });

  it('sad badge flips the smile', () => {
    expect(HERO_BADGE).toContain('c2.4 3');
    expect(HERO_BADGE_SAD).toContain('c2.4 -3');
  });

  it('mascots carry their animation classes', () => {
    expect(SPARKLE_MASCOT).toContain('class="g-sparkle"');
    expect(HERO_BADGE).toContain('class="g-badge"');
    expect(BUDDY_ROBOT).toContain('b-left');
    expect(BUDDY_OWL).toContain('b-right');
  });
});
```

- [ ] **Step 2: Chạy test xác nhận fail**

Run: `npx vitest run test/gate-art.test.js`
Expected: FAIL — Cannot find module `../public/gate-art.js`.

- [ ] **Step 3: Tạo `public/gate-art.js`**

Nguồn đường dẫn SVG: copy NGUYÊN VĂN từ `mock/authen-mock.html` (đã commit, tham chiếu theo số dòng dưới), chỉ đổi `class` và bọc trong hằng:

```js
// Nghệ thuật SVG cho màn gate — port nguyên văn từ mock/authen-mock.html.
// Mọi class đặt tiền tố g- để không đụng style của app chính.

// mock dòng 278 (star) / 282 (cloud)
export function starSvg(cls) {
  return '<svg class="g-star ' + cls + '" viewBox="0 0 24 24"><path d="M12 1c.7 4.5 2.5 6.3 7 7-4.5.7-6.3 2.5-7 7-.7-4.5-2.5-6.3-7-7 4.5-.7 6.3-2.5 7-7Z"/></svg>';
}
export function cloudSvg(cls) {
  return '<svg class="g-cloud ' + cls + '" viewBox="0 0 64 28"><path d="M16 26a10 10 0 0 1 .6-19.9A13 13 0 0 1 42 8a9 9 0 0 1 5 17H16Z"/></svg>';
}

// mock dòng 286-291
export const HILLS = '<svg class="g-hills" viewBox="0 0 600 240" preserveAspectRatio="none">'
  + '<path d="M0 150 Q120 90 260 140 T600 120 V240 H0 Z" fill="oklch(72% 0.13 150 / .95)"/>'
  + '<path d="M0 190 Q160 130 320 180 T600 170 V240 H0 Z" fill="oklch(66% 0.12 172 / .95)"/>'
  + '<ellipse cx="120" cy="230" rx="30" ry="14" fill="oklch(60% 0.11 160 / .6)"/>'
  + '<ellipse cx="480" cy="234" rx="36" ry="16" fill="oklch(58% 0.11 168 / .6)"/></svg>';

// mock dòng 339-355
export const SPARKLE_MASCOT = '<svg class="g-sparkle" viewBox="0 0 132 132" role="img" aria-label="Sparkle">'
  + '<defs><radialGradient id="gbody" cx="42%" cy="34%" r="72%">'
  + '<stop offset="0%" stop-color="#ffe79a"/><stop offset="55%" stop-color="#ffcf5c"/><stop offset="100%" stop-color="#ff9f43"/>'
  + '</radialGradient></defs>'
  + '<path d="M66 8c6 30 22 42 52 52-30 10-46 22-52 52-6-30-22-42-52-52 30-10 46-22 52-52Z"'
  + ' fill="url(#gbody)" stroke="#f79021" stroke-width="2.5" stroke-linejoin="round"/>'
  + '<ellipse cx="66" cy="64" rx="27" ry="24" fill="#fff" opacity=".95"/>'
  + '<circle cx="56" cy="61" r="4.6" fill="#2b2352"/><circle cx="76" cy="61" r="4.6" fill="#2b2352"/>'
  + '<circle cx="57.6" cy="59.4" r="1.5" fill="#fff"/><circle cx="77.6" cy="59.4" r="1.5" fill="#fff"/>'
  + '<circle cx="49" cy="70" r="4.6" fill="#ff9aa0" opacity=".7"/><circle cx="83" cy="70" r="4.6" fill="#ff9aa0" opacity=".7"/>'
  + '<path d="M58 71c3 4 13 4 16 0" fill="none" stroke="#2b2352" stroke-width="3" stroke-linecap="round"/></svg>';

// mock dòng 383-395 (miệng cười 'c2.4 3'); SAD đổi thành 'c2.4 -3' và y 51→55
export const HERO_BADGE = '<svg class="g-badge" viewBox="0 0 96 96" role="img" aria-label="Sparkle">'
  + '<defs><radialGradient id="ghero" cx="42%" cy="34%" r="72%">'
  + '<stop offset="0%" stop-color="#ffe79a"/><stop offset="55%" stop-color="#ffcf5c"/><stop offset="100%" stop-color="#ff9f43"/>'
  + '</radialGradient></defs>'
  + '<path d="M48 8c4.4 21.6 15.6 30 38 34-22.4 7.2-33 16-38 38-4.4-21.6-15.6-30-38-34 22.4-7.2 33-16 38-38Z"'
  + ' fill="url(#ghero)" stroke="#f79021" stroke-width="2" stroke-linejoin="round"/>'
  + '<ellipse cx="48" cy="46" rx="20" ry="18" fill="#fff" opacity=".95"/>'
  + '<circle cx="41" cy="44" r="3.4" fill="#2b2352"/><circle cx="56" cy="44" r="3.4" fill="#2b2352"/>'
  + '<circle cx="36" cy="51" r="3.4" fill="#ff9aa0" opacity=".7"/><circle cx="61" cy="51" r="3.4" fill="#ff9aa0" opacity=".7"/>'
  + '<path d="M42 51c2.4 3 9.6 3 12 0" fill="none" stroke="#2b2352" stroke-width="2.4" stroke-linecap="round"/></svg>';

export const HERO_BADGE_SAD = HERO_BADGE
  .replace('M42 51c2.4 3 9.6 3 12 0', 'M42 55c2.4 -3 9.6 -3 12 0');

// mock dòng 321-328
export const BUDDY_ROBOT = '<svg class="g-buddy b-left" viewBox="0 0 64 64" aria-hidden="true">'
  + '<rect x="14" y="20" width="36" height="30" rx="12" fill="#7fd7e6" stroke="#3fa9bd" stroke-width="2"/>'
  + '<line x1="32" y1="12" x2="32" y2="20" stroke="#3fa9bd" stroke-width="2.4"/>'
  + '<circle cx="32" cy="10" r="4" fill="#ffd76b"/>'
  + '<circle cx="25" cy="34" r="4" fill="#2b2352"/><circle cx="39" cy="34" r="4" fill="#2b2352"/>'
  + '<circle cx="26.2" cy="32.6" r="1.3" fill="#fff"/><circle cx="40.2" cy="32.6" r="1.3" fill="#fff"/>'
  + '<path d="M26 42c3 3 9 3 12 0" fill="none" stroke="#2b2352" stroke-width="2.4" stroke-linecap="round"/></svg>';

// mock dòng 330-336
export const BUDDY_OWL = '<svg class="g-buddy b-right" viewBox="0 0 64 64" aria-hidden="true">'
  + '<path d="M32 14c11 0 18 8 18 20s-8 18-18 18-18-6-18-18 7-20 18-20Z" fill="#c79ce8" stroke="#9b6fd0" stroke-width="2"/>'
  + '<path d="M18 18c0-4 4-6 7-4M46 18c0-4-4-6-7-4" stroke="#9b6fd0" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
  + '<circle cx="25" cy="33" r="7" fill="#fff"/><circle cx="39" cy="33" r="7" fill="#fff"/>'
  + '<circle cx="25" cy="33" r="3.4" fill="#2b2352"/><circle cx="39" cy="33" r="3.4" fill="#2b2352"/>'
  + '<path d="M29 41l3 3 3-3Z" fill="#ffb347"/></svg>';

// mock dòng 296-299 (brand-mark), bỏ width/height cứng
export const BRAND_MARK = '<svg viewBox="0 0 24 24" fill="none">'
  + '<path d="M12 2.5c.5 3.2 1.8 4.5 5 5-3.2.5-4.5 1.8-5 5-.5-3.2-1.8-4.5-5-5 3.2-.5 4.5-1.8 5-5Z" fill="#ffd76b"/>'
  + '<path d="M18.5 13c.28 1.6.9 2.2 2.5 2.5-1.6.28-2.22.9-2.5 2.5-.28-1.6-.9-2.22-2.5-2.5 1.6-.3 2.22-.9 2.5-2.5Z" fill="#fff"/></svg>';

// nút Google + spinner — mock dòng 401-402
export const GOOGLE_ICON = '<svg class="g" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"/><path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 6.68 9.14 4.75 12 4.75Z"/></svg>';
export const SPINNER = '<svg class="spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="var(--tutor)" stroke-width="3" stroke-opacity=".25"/><path d="M21 12a9 9 0 0 0-9-9" stroke="var(--tutor)" stroke-width="3" stroke-linecap="round"/></svg>';

// icons nhỏ — trust chips (mock 364/368/372), safe-line (407), benefits (413/417/421), tokens (309/314)
export const ICON_SHIELD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>';
export const ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7 9 18l-5-5"/></svg>';
export const ICON_LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="10" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>';
export const ICON_NOTE = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
export const ICON_GAMES = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="3"/><path d="M8 3v3M16 3v3M8 12h.01M12 12h.01M16 12h.01"/></svg>';
export const ICON_PERSON = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>';
export const ICON_BOOK = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V6a2 2 0 0 1 2-2h6v15H6a2 2 0 0 0-2 2Z"/><path d="M20 19V6a2 2 0 0 0-2-2h-6v15h6a2 2 0 0 1 2 2Z"/></svg>';
export const ICON_ATOM = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(28 12 12)"/></svg>';
```

- [ ] **Step 4: Chạy test xác nhận pass**

Run: `npx vitest run test/gate-art.test.js`
Expected: PASS (4 tests). Node smoke: `node --input-type=module -e "await import('./public/gate-art.js'); console.log('ok')"` → `ok`.

- [ ] **Step 5: Commit**

```bash
git add public/gate-art.js test/gate-art.test.js
git commit -m "feat: gate svg art module ported from the auth mockup"
```

---

### Task 2: `styles.css` — token mới + thay toàn bộ section gate

**Files:**
- Modify: `public/styles.css`

- [ ] **Step 1: Thêm token màu**

Ở `:root`, sau block `/* games */` (`--games`/`--chess`) thêm:

```css
  /* gate scene (authen-mock) */
  --sun: oklch(82% 0.15 80);
  --sun-2: oklch(76% 0.16 62);
  --grape: oklch(64% 0.15 300);
  --leaf: oklch(70% 0.14 150);
  --sky-top: oklch(70% 0.12 210);
  --tutor-2: oklch(52% 0.10 210);
  --tutor-deep: oklch(44% 0.10 220);
  --child-2: oklch(60% 0.17 30);
  --gate-pop: 0 18px 50px oklch(45% 0.1 250 / .22);
```

Trong block `@supports not (color: oklch(50% 0.1 200))` thêm cuối danh sách:
`--sun:#eec25c; --sun-2:#dfa83e; --grape:#8a4fd0; --leaf:#57b877; --sky-top:#4d9dc9; --tutor-2:#2e7f9e; --tutor-deep:#2a6684; --child-2:#d95a3d; --gate-pop:0 18px 50px rgba(38,48,92,.22);`

- [ ] **Step 2: Thay toàn bộ section gate**

Xoá từ dòng `.gate {` đến dòng `.chip-danger { ... }` (ngay trước comment `/* header profile chip */`) và chèn section mới dưới đây (giữ nguyên mọi selector cũ mà gate.js còn dùng, nâng cấp theo mockup; các class mới đều có tiền tố `g-`):

```css
/* ---------------------------------------------------------------- gate */
.gate {
  position: fixed; inset: 0; z-index: 50;
  display: grid; place-items: center;
  padding: clamp(14px, 3vw, 40px);
  background: radial-gradient(1100px 620px at 90% -10%, var(--tutor-soft), transparent 60%), var(--bg);
  overflow-y: auto;
}
.gate[hidden] { display: none; }
.g-screens { width: 100%; display: grid; place-items: center; }

/* đốm confetti trôi — nền chung mọi màn gate (từ mock .bg-dots) */
.g-dots { position: fixed; inset: 0; overflow: hidden; z-index: 0; pointer-events: none; }
.g-dots i { position: absolute; border-radius: 50%; opacity: .5; animation: gDriftUp 16s linear infinite; }
.g-dots i:nth-child(1) { left: 8%; bottom: -20px; width: 12px; height: 12px; background: var(--sun); animation-duration: 19s; }
.g-dots i:nth-child(2) { left: 22%; bottom: -30px; width: 8px; height: 8px; background: var(--child); animation-duration: 14s; animation-delay: 2s; }
.g-dots i:nth-child(3) { left: 70%; bottom: -24px; width: 14px; height: 14px; background: var(--tutor); animation-duration: 22s; animation-delay: 1s; }
.g-dots i:nth-child(4) { left: 86%; bottom: -18px; width: 9px; height: 9px; background: var(--grape); animation-duration: 17s; animation-delay: 3s; }
.g-dots i:nth-child(5) { left: 48%; bottom: -28px; width: 11px; height: 11px; background: var(--leaf); animation-duration: 20s; animation-delay: 4s; }
@keyframes gDriftUp { to { transform: translateY(-112vh) rotate(220deg); } }

/* ---- split card (màn đăng nhập) ---- */
.g-auth {
  position: relative; z-index: 1;
  width: min(1020px, 100%);
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--gate-pop);
  overflow: hidden;
  display: grid;
  grid-template-columns: 1.08fr .92fr;
  min-height: 640px;
  animation: gRise .6s cubic-bezier(.2, .9, .3, 1) both;
}
@keyframes gRise { from { opacity: 0; transform: translateY(22px) scale(.985); } to { opacity: 1; transform: none; } }

.g-world {
  position: relative;
  padding: clamp(24px, 3vw, 40px);
  color: #fff;
  background: linear-gradient(180deg, var(--sky-top) 0%, var(--tutor) 42%, var(--tutor-2) 78%, var(--tutor-deep) 100%);
  display: flex; flex-direction: column;
  overflow: hidden;
  isolation: isolate;
}
.g-sky { position: absolute; inset: 0; z-index: -1; overflow: hidden; }
.g-sun {
  position: absolute; left: 8%; top: 9%; width: 80px; height: 80px; border-radius: 50%;
  background: radial-gradient(circle at 40% 38%, #fff6d6, var(--sun) 58%, var(--sun-2));
  box-shadow: 0 0 0 14px oklch(88% 0.14 82 / .18), 0 0 44px oklch(85% 0.15 80 / .5);
  animation: gSunPulse 6s ease-in-out infinite;
}
@keyframes gSunPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
.g-star { position: absolute; fill: #fff; opacity: .85; animation: gTwinkle 3.2s ease-in-out infinite; }
.g-star.s1 { right: 14%; top: 12%; width: 20px; height: 20px; animation-delay: .2s; }
.g-star.s2 { right: 32%; top: 24%; width: 13px; height: 13px; animation-delay: 1.1s; }
.g-star.s3 { right: 8%; top: 30%; width: 15px; height: 15px; animation-delay: 2s; }
.g-star.s4 { left: 40%; top: 8%; width: 11px; height: 11px; animation-delay: .7s; }
@keyframes gTwinkle { 0%, 100% { opacity: .35; transform: scale(.8); } 50% { opacity: 1; transform: scale(1.15); } }
.g-cloud { position: absolute; fill: #fff; opacity: .9; animation: gDrift 26s linear infinite; }
.g-cloud.c1 { top: 20%; left: -30%; width: 150px; animation-duration: 34s; }
.g-cloud.c2 { top: 44%; left: -45%; width: 110px; opacity: .7; animation-duration: 44s; animation-delay: 6s; }
.g-cloud.c3 { top: 60%; left: -40%; width: 90px; opacity: .55; animation-duration: 52s; animation-delay: 12s; }
@keyframes gDrift { to { transform: translateX(230%); } }
.g-hills { position: absolute; left: 0; right: 0; bottom: 0; width: 100%; height: 42%; display: block; }

.g-brand { display: flex; align-items: center; gap: 11px; position: relative; z-index: 2; }
.g-brand-mark {
  width: 44px; height: 44px; border-radius: 14px; flex: none;
  background: rgba(255, 255, 255, .18);
  display: grid; place-items: center;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .3);
}
.g-brand-mark svg { width: 26px; height: 26px; }
.g-brand-name { font-family: var(--font-display); font-weight: 800; font-size: 23px; color: #fff; }
.g-brand-name span { color: var(--sun); }

.g-stage { position: relative; height: clamp(200px, 26vw, 270px); margin: 6px 0; z-index: 1; }
.g-sparkle {
  position: absolute; left: 50%; top: 14px; width: 150px; height: 150px;
  filter: drop-shadow(0 12px 20px rgba(0, 0, 0, .2));
  animation: gBob 4.5s ease-in-out infinite; z-index: 3;
}
.g-buddy { position: absolute; bottom: 14px; width: 78px; height: 78px; filter: drop-shadow(0 8px 14px rgba(0, 0, 0, .16)); z-index: 2; }
.g-buddy.b-left { left: 2%; animation: gBob 5.2s ease-in-out infinite .6s; }
.g-buddy.b-right { right: 2%; animation: gBob 4.8s ease-in-out infinite 1.4s; }
@keyframes gBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
.g-token {
  position: absolute; width: 54px; height: 54px; border-radius: 16px;
  display: grid; place-items: center;
  font-family: var(--font-display); font-weight: 800; color: #fff;
  box-shadow: 0 8px 18px rgba(0, 0, 0, .2); z-index: 4;
  animation: gFloaty 5s ease-in-out infinite;
}
.g-token svg { width: 30px; height: 30px; }
.g-token.t1 { left: 4%; top: 8px; background: var(--sun); color: oklch(35% 0.09 70); font-size: 26px; --rot: rotate(-8deg); animation-delay: .2s; }
.g-token.t2 { right: 6%; top: 0; background: var(--child); font-size: 27px; --rot: rotate(9deg); animation-delay: 1s; }
.g-token.t3 { right: 0; top: 96px; background: var(--grape); font-size: 22px; --rot: rotate(7deg); animation-delay: 2.1s; }
.g-token.t4 { left: 0; top: 104px; background: var(--leaf); color: oklch(28% 0.09 155); font-size: 25px; --rot: rotate(-6deg); animation-delay: 1.6s; }
@keyframes gFloaty { 0%, 100% { transform: translateY(0) var(--rot, rotate(0)); } 50% { transform: translateY(-13px) var(--rot, rotate(0)); } }

.g-copy { margin-top: auto; position: relative; z-index: 2; padding-bottom: 4px; }
.g-eyebrow {
  display: inline-block; font-weight: 800; font-size: 12px; letter-spacing: .14em; text-transform: uppercase;
  color: oklch(96% 0.02 195); background: rgba(255, 255, 255, .16);
  padding: 6px 13px; border-radius: var(--radius-pill); margin-bottom: 16px;
}
.g-world h1 { font-family: var(--font-display); font-size: clamp(28px, 3.4vw, 40px); font-weight: 800; color: #fff; line-height: 1.08; text-wrap: balance; }
.g-world h1 em { font-style: normal; color: var(--sun); }
.g-lede { margin-top: 12px; font-size: 16px; color: rgba(255, 255, 255, .92); max-width: 34ch; line-height: 1.5; }

.g-trust { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 22px; position: relative; z-index: 2; }
.tchip {
  display: inline-flex; align-items: center; gap: 7px;
  background: rgba(255, 255, 255, .16);
  border: 1px solid rgba(255, 255, 255, .24);
  color: #fff; font-weight: 700; font-size: 13px;
  padding: 7px 13px; border-radius: var(--radius-pill);
}
.tchip svg { width: 15px; height: 15px; flex: none; }

/* panel phải */
.g-panel { position: relative; padding: clamp(28px, 3.2vw, 50px); display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
.g-panel::before { content: ""; position: absolute; right: -70px; top: -70px; width: 200px; height: 200px; border-radius: 50%; background: radial-gradient(circle, var(--child-soft), transparent 70%); z-index: 0; }
.g-panel::after { content: ""; position: absolute; left: -60px; bottom: -60px; width: 180px; height: 180px; border-radius: 50%; background: radial-gradient(circle, var(--tutor-soft), transparent 70%); z-index: 0; }
.g-panel > * { position: relative; z-index: 1; }

.g-hero { display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 6px; }
.g-badge {
  width: 96px; height: 96px; margin-bottom: 14px;
  filter: drop-shadow(0 10px 16px oklch(60% 0.1 240 / .22));
  animation: gHeroPop .7s cubic-bezier(.2, 1.3, .4, 1) both .15s;
}
@keyframes gHeroPop { from { opacity: 0; transform: scale(.5) rotate(-12deg); } to { opacity: 1; transform: none; } }
.g-hero h2 { font-family: var(--font-display); font-size: clamp(25px, 2.7vw, 32px); font-weight: 800; }
.g-hero p { color: var(--muted); margin-top: 8px; font-size: 15px; max-width: 40ch; }

.g-google {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 12px;
  background: var(--surface); color: var(--fg);
  border: 1.5px solid var(--border);
  font-family: var(--font-display); font-weight: 800; font-size: 17px;
  padding: 16px; border-radius: var(--radius-pill); cursor: pointer; min-height: 58px;
  box-shadow: var(--shadow-sm);
  transition: transform .12s, box-shadow .2s, border-color .2s;
  margin-top: 26px;
}
.g-google:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: var(--tutor); }
.g-google:active { transform: translateY(0); }
.g-google svg.g { width: 22px; height: 22px; flex: none; }
.g-google .spin { width: 20px; height: 20px; flex: none; display: none; }
.g-google[data-state="loading"] .g { display: none; }
.g-google[data-state="loading"] .spin { display: inline-block; animation: gSpin .8s linear infinite; }
@keyframes gSpin { to { transform: rotate(360deg); } }

.g-safe { display: flex; align-items: center; justify-content: center; gap: 7px; margin-top: 14px; color: var(--muted); font-size: 13px; font-weight: 700; }
.g-safe svg { width: 15px; height: 15px; color: var(--success); flex: none; }

.g-benefits { list-style: none; margin: 26px 0 0; display: grid; gap: 12px; }
.g-benefits li { display: flex; align-items: center; gap: 13px; background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px 14px; }
.g-ico { width: 42px; height: 42px; border-radius: 12px; flex: none; display: grid; place-items: center; }
.g-ico svg { width: 22px; height: 22px; }
.g-ico.i1 { background: linear-gradient(150deg, var(--child), var(--child-2)); }
.g-ico.i2 { background: linear-gradient(150deg, var(--tutor), var(--tutor-2)); }
.g-ico.i3 { background: linear-gradient(150deg, var(--grape), oklch(56% 0.15 300)); }
.g-benefits strong { display: block; font-family: var(--font-display); font-weight: 700; font-size: 15px; }
.g-benefits li span.b-d { font-size: 13px; color: var(--muted); font-weight: 600; }

.g-foot { margin-top: 24px; color: var(--muted); font-size: 12.5px; line-height: 1.5; text-align: center; }
.g-foot b { color: var(--fg); }

/* ---- các màn card (picker/manager/lỗi) — nâng cấp cùng ngôn ngữ ---- */
.gate-card {
  width: min(460px, 94vw); background: var(--surface);
  border-radius: var(--radius-lg); box-shadow: var(--gate-pop);
  padding: 30px 26px; text-align: center;
  display: flex; flex-direction: column; gap: 14px; align-items: center;
  animation: rise .35s ease backwards;
}
.gate-card .g-badge { width: 84px; height: 84px; }
.gate-wide { width: min(560px, 94vw); }
.gate-title { font-family: var(--font-display); font-size: 26px; }
.gate-body { color: var(--muted); }
.gate-privacy { font-size: 13px; color: var(--muted); }
.gate-error { color: oklch(50% 0.16 25); font-weight: 700; }
.gate-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }

.profile-grid { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
.profile-card {
  --pc: var(--tutor);
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  width: 128px; padding: 16px 10px; cursor: pointer;
  border: 2px solid var(--border); border-radius: var(--radius);
  background: color-mix(in oklch, #fff 88%, var(--pc));
  box-shadow: var(--shadow-sm);
  transition: transform .14s ease, border-color .14s, box-shadow .14s;
  animation: rise .35s ease backwards;
}
.profile-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); border-color: var(--pc); }
.profile-avatar {
  width: 52px; height: 52px; border-radius: 50%;
  display: grid; place-items: center; color: #fff;
  background: linear-gradient(150deg, color-mix(in oklch, #fff 30%, var(--pc)), var(--pc));
  font-family: var(--font-display); font-weight: 800; font-size: 20px;
}
.profile-name { font-family: var(--font-display); font-weight: 700; overflow: hidden; text-overflow: ellipsis; max-width: 108px; white-space: nowrap; }
.profile-band {
  font-size: 12px; font-weight: 700; color: var(--pc);
  background: color-mix(in oklch, #fff 82%, var(--pc));
  border-radius: var(--radius-pill); padding: 3px 10px;
}

.profile-list { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.profile-row {
  --pc: var(--tutor);
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; border-left: 6px solid var(--pc);
  background: var(--bg-2); border-radius: var(--radius);
}
.profile-row-name { font-weight: 800; }
.profile-row-band { flex: 1; font-size: 13px; color: var(--muted); }

.profile-form { display: flex; flex-direction: column; gap: 12px; width: 100%; text-align: left; }
.profile-form .field { border-width: 2px; padding: 8px 14px; background: var(--bg); border-radius: var(--radius); }
.profile-form input {
  width: 100%; border: 0; outline: 0; font-family: var(--font-body);
  font-size: 16px; background: transparent; color: var(--fg);
}
.form-label { font-family: var(--font-display); font-weight: 700; font-size: 14px; color: var(--muted); }
.age-band-row { display: flex; gap: 10px; }
.age-band-btn {
  flex: 1; padding: 12px 10px; min-height: 48px; cursor: pointer;
  border: 2px solid var(--border); border-radius: var(--radius);
  background: var(--surface); font-family: var(--font-display); font-weight: 700;
  color: var(--fg); transition: border-color .12s, background .12s, transform .12s;
}
.age-band-btn:hover { transform: translateY(-1px); }
.age-band-btn.selected { border-color: var(--tutor); background: var(--tutor-soft); }
.gate-save {
  width: 100%; border-radius: var(--radius-pill); display: inline-flex; justify-content: center; align-items: center; gap: 8px;
  background: linear-gradient(150deg, var(--child), var(--child-2)); color: #fff; border: 0;
  min-height: 48px; font-weight: 800; cursor: pointer;
}
.gate-save::after { content: '→'; }
.gate-save:disabled { opacity: .55; cursor: default; }
.chip-danger { color: oklch(50% 0.16 25); border-color: color-mix(in oklch, #fff 60%, oklch(60% 0.16 25)); }

/* responsive gate (từ mock) */
@media (max-width: 860px) {
  .g-auth { grid-template-columns: 1fr; min-height: 0; }
  .g-world { padding-bottom: 0; }
  .g-world .g-stage { height: clamp(170px, 42vw, 220px); }
  .g-world .g-copy { padding-bottom: 20px; }
  .g-panel { padding: clamp(24px, 6vw, 34px); }
}
@media (max-width: 520px) {
  .g-world .g-trust { display: none; }
  .g-world h1 { font-size: 26px; }
  .g-benefits li { padding: 11px 12px; }
  .gate { padding: 14px; }
}
@media (max-width: 400px) {
  .gate { padding: 0; }
  .g-auth { border-radius: 0; min-height: 100dvh; }
}
@media (prefers-reduced-motion: reduce) {
  .g-dots i, .g-sun, .g-star, .g-cloud, .g-sparkle, .g-buddy, .g-token,
  .g-badge, .g-auth, .gate-card, .profile-card, .age-band-btn, .g-google .spin { animation: none; }
}
```

- [ ] **Step 3: Chạy test + smoke**

Run: `npx vitest run` → 20 files, 218/218 (CSS không ảnh hưởng test). Node smoke: `node --input-type=module -e "await import('./public/games/hub.js'); console.log('ok')"` → ok.

- [ ] **Step 4: Commit**

```bash
git add public/styles.css
git commit -m "feat: gate css redesign with scene tokens and g- namespace"
```

---

### Task 3: i18n keys + test mở rộng

**Files:**
- Modify: `public/i18n.js`
- Modify: `test/games-i18n.test.js`

- [ ] **Step 1: Thêm keys**

VI block (ngay sau `signInButton`):

```js
    signInEyebrow: 'Học mà chơi, chơi mà học',
    signInH1: 'Nơi các con <em>tự suy nghĩ</em>, không chỉ nhận đáp án',
    signInLede: 'Sparkle đồng hành cùng bé từng bước — với gợi ý nhẹ nhàng, trò chơi và lời động viên dành cho tuổi 6–12.',
    trustSafe: 'An toàn cho trẻ, không quảng cáo',
    trustParent: 'Phụ huynh kiểm soát',
    trustPrivate: 'Riêng tư thiết kế sẵn',
    signInConnecting: 'Đang kết nối Google…',
    signInSafe: 'Đăng nhập bảo mật — chúng tôi không thấy mật khẩu của bạn',
    benefit1T: 'Dẫn dắt, không thay lời',
    benefit1D: 'Sparkle gợi ý để bé tự tìm ra đáp án.',
    benefit2T: 'Trò chơi học tập',
    benefit2D: 'Toán kho báu, hành trình chữ, thám tử và cờ vua.',
    benefit3T: 'Bố mẹ luôn làm chủ',
    benefit3D: 'Hồ sơ riêng cho từng bé, quản lý bởi phụ huynh.',
    gateFoot: 'Gia đình bạn luôn được riêng tư. Không quảng cáo, không chia sẻ dữ liệu.',
```

EN block (ngay sau `signInButton`):

```js
    signInEyebrow: 'Learning that feels like play',
    signInH1: 'Where kids <em>think it through</em>, not just get answers.',
    signInLede: 'Sparkle guides your child step by step — with hints, games and friendly encouragement for ages 6–12.',
    trustSafe: 'Kid-safe, no ads',
    trustParent: 'Parent-controlled',
    trustPrivate: 'Private by design',
    signInConnecting: 'Connecting to Google…',
    signInSafe: 'Secure sign-in — we never see your password',
    benefit1T: 'Guides, never spoils',
    benefit1D: 'Sparkle nudges kids to figure it out themselves.',
    benefit2T: 'Learning games',
    benefit2D: 'Treasure math, word quests, detective puzzles and chess.',
    benefit3T: 'You stay in control',
    benefit3D: 'Parent-managed profiles for each child.',
    gateFoot: 'Your family stays private. No ads, no data sharing — ever.',
```

- [ ] **Step 2: Mở rộng test**

`test/games-i18n.test.js`: thêm vào SHARED: `'signInEyebrow', 'signInH1', 'signInLede', 'trustSafe', 'trustParent', 'trustPrivate', 'signInConnecting', 'signInSafe', 'benefit1T', 'benefit1D', 'benefit2T', 'benefit2D', 'benefit3T', 'benefit3D', 'gateFoot',`.
Nếu file có whitelist markup (Set `MARKUP_OK`): thêm `'signInH1'`.

- [ ] **Step 3: Chạy test**

Run: `npx vitest run` → 20 files, 218/218.

- [ ] **Step 4: Commit**

```bash
git add public/i18n.js test/games-i18n.test.js
git commit -m "feat: bilingual strings for the redesigned gate"
```

---

### Task 4: `gate.js` — renderLogin mới, wrapper + dots, polish 2 màn còn lại

**Files:**
- Modify: `public/gate.js`
- Modify: `docs/smoke-checklist.md`

- [ ] **Step 1: Imports + khung bền**

1a. Thêm import sau dòng `import { t } from './i18n.js';`:

```js
import {
  starSvg, cloudSvg, HILLS, SPARKLE_MASCOT, HERO_BADGE, HERO_BADGE_SAD,
  BUDDY_ROBOT, BUDDY_OWL, GOOGLE_ICON, SPINNER, BRAND_MARK,
  ICON_SHIELD, ICON_CHECK, ICON_LOCK, ICON_NOTE, ICON_GAMES, ICON_PERSON, ICON_BOOK, ICON_ATOM,
} from './gate-art.js';
```

1b. Trong `initGate`, sau dòng `gateEl = document.getElementById('gate');` (trước nhánh config error) thêm:

```js
  gateEl.innerHTML = '<div class="g-dots" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>'
    + '<div class="g-screens"></div>';
```

1c. Sửa `show()`/`hide()` ghi vào wrapper:

```js
function show(html) {
  const screens = gateEl.querySelector('.g-screens');
  screens.innerHTML = html;
  gateEl.hidden = false;
  const app = document.querySelector('.app');
  if (app && 'inert' in app) app.inert = true;
  const first = gateEl.querySelector('button');
  if (first) first.focus();
}
function hide() {
  gateEl.hidden = true;
  const screens = gateEl.querySelector('.g-screens');
  if (screens) screens.innerHTML = '';
  const app = document.querySelector('.app');
  if (app && 'inert' in app) app.inert = false;
}
```

- [ ] **Step 2: Thay `renderLogin`**

```js
function renderLogin() {
  const lang = currentLang();
  show(
    '<main class="g-auth" aria-label="KidGPT">' +
      '<section class="g-world">' +
        '<div class="g-sky" aria-hidden="true"><span class="g-sun"></span>' +
          starSvg('s1') + starSvg('s2') + starSvg('s3') + starSvg('s4') +
          cloudSvg('c1') + cloudSvg('c2') + cloudSvg('c3') + HILLS + '</div>' +
        '<div class="g-brand"><span class="g-brand-mark" aria-hidden="true">' + BRAND_MARK + '</span>' +
          '<span class="g-brand-name">Kid<span>GPT</span></span></div>' +
        '<div class="g-stage" aria-hidden="true">' +
          '<span class="g-token t1">7</span>' +
          '<span class="g-token t2">' + ICON_BOOK + '</span>' +
          '<span class="g-token t3">' + ICON_ATOM + '</span>' +
          '<span class="g-token t4">A</span>' +
          BUDDY_ROBOT + BUDDY_OWL + SPARKLE_MASCOT +
        '</div>' +
        '<div class="g-copy">' +
          '<span class="g-eyebrow">' + esc(t(lang, 'signInEyebrow')) + '</span>' +
          '<h1>' + t(lang, 'signInH1') + '</h1>' +
          '<p class="g-lede">' + esc(t(lang, 'signInLede')) + '</p>' +
          '<div class="g-trust">' +
            '<span class="tchip">' + ICON_SHIELD + esc(t(lang, 'trustSafe')) + '</span>' +
            '<span class="tchip">' + ICON_CHECK + esc(t(lang, 'trustParent')) + '</span>' +
            '<span class="tchip">' + ICON_LOCK + esc(t(lang, 'trustPrivate')) + '</span>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<section class="g-panel">' +
        '<div class="g-hero">' + HERO_BADGE +
          '<h2>' + esc(t(lang, 'signInTitle')) + '</h2>' +
          '<p>' + esc(t(lang, 'signInBody')) + '</p></div>' +
        '<button class="g-google" id="gate-signin" type="button" data-state="idle">' +
          GOOGLE_ICON + SPINNER +
          '<span id="gate-signin-label">' + esc(t(lang, 'signInButton')) + '</span></button>' +
        '<p class="gate-privacy gate-error" id="gate-signin-error" hidden></p>' +
        '<div class="g-safe">' + ICON_SHIELD + esc(t(lang, 'signInSafe')) + '</div>' +
        '<ul class="g-benefits">' +
          '<li><span class="g-ico i1" aria-hidden="true">' + ICON_NOTE + '</span>' +
            '<span><strong>' + esc(t(lang, 'benefit1T')) + '</strong><span class="b-d">' + esc(t(lang, 'benefit1D')) + '</span></span></li>' +
          '<li><span class="g-ico i2" aria-hidden="true">' + ICON_GAMES + '</span>' +
            '<span><strong>' + esc(t(lang, 'benefit2T')) + '</strong><span class="b-d">' + esc(t(lang, 'benefit2D')) + '</span></span></li>' +
          '<li><span class="g-ico i3" aria-hidden="true">' + ICON_PERSON + '</span>' +
            '<span><strong>' + esc(t(lang, 'benefit3T')) + '</strong><span class="b-d">' + esc(t(lang, 'benefit3D')) + '</span></span></li>' +
        '</ul>' +
        '<p class="g-foot"><b>' + esc(t(lang, 'gateFoot')) + '</b></p>' +
      '</section>' +
    '</main>');
  const btn = document.getElementById('gate-signin');
  const label = document.getElementById('gate-signin-label');
  const errEl = document.getElementById('gate-signin-error');
  btn.addEventListener('click', async () => {
    if (btn.dataset.state !== 'idle') return;
    btn.dataset.state = 'loading';
    label.textContent = t(lang, 'signInConnecting');
    errEl.textContent = '';
    errEl.hidden = true;
    try {
      await signInWithGoogle(); // thành công: watchAuth tự re-render gate
    } catch (e) {
      const code = (e && e.code) || '';
      if (!code.includes('popup-closed-by-user') && !code.includes('cancelled-popup-request')) {
        errEl.textContent = t(lang, 'signInError');
        errEl.hidden = false;
      }
    } finally {
      btn.dataset.state = 'idle';
      label.textContent = t(lang, 'signInButton');
    }
  });
}
```

- [ ] **Step 3: Polish picker/manager/lỗi**

3a. `renderPicker`: chèn badge trên tiêu đề — đổi dòng `'<h2 class="gate-title">' + esc(t(lang, 'chooseProfile')) + '</h2>'` thành:

```js
      HERO_BADGE +
      '<h2 class="gate-title">' + esc(t(lang, 'chooseProfile')) + '</h2>' +
```

3b. `renderManager`: tương tự, trước dòng `'<h2 class="gate-title">' + esc(t(lang, firstTime ? 'addProfile' : 'manageProfiles')) + '</h2>'` chèn `HERO_BADGE +`.

3c. `renderLoadError`: thay `'<h2 class="gate-title">😞</h2>'` bằng `HERO_BADGE_SAD +`.

3d. `renderConfigError`: thay `'<h2 class="gate-title">⚠️</h2>'` bằng `HERO_BADGE_SAD +`.

- [ ] **Step 4: Verify**

1. `npx vitest run` → 21 files, 222/222 (218 + 4 gate-art).
2. Node smoke: `node --input-type=module -e "await import('./public/games/hub.js'); console.log('ok')"` → ok. (gate.js không import được trong node vì firebase CDN — bình thường.)
3. Đọc lại gate.js một lượt: mọi `getElementById('gate-…')`/querySelector cũ vẫn nằm trong wrapper nên tìm thấy; `hide()` không xoá `.g-dots`; nút Google reset label/idle trong `finally` kể cả lỗi popup-closed.

- [ ] **Step 5: Checklist thủ công + commit**

Thêm vào `docs/smoke-checklist.md` (mục mới sau Games):

```markdown
## Gate redesign

- [ ] Màn đăng nhập: split-card thế giới (sun/sao/mây/đồi, Sparkle + robot + cú + 4 token bay) + panel phải; 2 ngôn ngữ; nút Google có spinner "Đang kết nối…" khi chờ popup, reset khi đóng popup
- [ ] Trust chips ẩn <520px; xếp dọc <860px; full-bleed <400px; reduced-motion tắt sạch animation
- [ ] Chọn hồ sơ & quản lý hồ sơ: badge Sparkle trên card, card hover lift, avatar gradient, nút Lưu gradient coral; luồng tạo/sửa/xóa hồ sơ hoạt động như cũ
- [ ] Nền đốm confetti bay hiện ở cả 3 màn và không biến mất khi chuyển màn
```

Commit:

```bash
git add public/gate.js docs/smoke-checklist.md
git commit -m "feat: redesigned gate screens ported from the auth mockup"
```

---

## Ghi chú tự-review kế hoạch (đã sửa tại chỗ)

1. **Spec coverage:** §2 login (T2 CSS + T4 renderLogin), §2.2 loading state (T4 finally-reset), §2.3 responsive/reduced-motion (T2 media), §3 picker/manager + lỗi SAD badge (T2 CSS + T4), §4 tokens + thay section gate (T2), §5 file map (T1/T2/T3/T4), §6 i18n (T3), §7 test (T1 + T3). Đủ.
2. **Namespace:** mọi class mới có tiền tố `g-` (tránh đụng `.brand`/`.chip`/`.stage` của app); trust chip dùng `.tchip`; keyframes `g*` duy nhất (kiểm tra: styles.css/games.css không có gDriftUp/gRise/gBob/gFloaty/gSpin/gHeroPop/gSunPulse/gTwinkle/gDrift).
3. **Type consistency:** gate-art exports khớp test + import trong T4 (starSvg/cloudSvg hàm; còn lại hằng); id `gate-signin`/`gate-signin-label`/`gate-signin-error` giữ nguyên để handler cũ mở rộng.
4. **Xoá `.btn-google`/`.gate-logo`:** các selector cũ này bị bỏ khỏi section gate — gate.js không còn dùng (renderLogin mới dùng `.g-google`; `.gate-logo` không còn markup). Nếu grep thấy nơi khác dùng (không có) thì an toàn.
