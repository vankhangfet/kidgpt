# Main Page Polish (trang chủ sinh động) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm sinh động trang chính sau đăng nhập theo ngôn ngữ trang gate: nền trời + đốm confetti trôi, rail subject gradient màu, bubble "you" coral, welcome badge Sparkle, composer pill với nút gửi coral.

**Architecture:** Lớp trình bày thuần trên app hiện có — CSS mới trong `styles.css` (section cuối), markup nhỏ trong `app.js` (welcome badge + send button) và `index.html` (lớp `.app-dots`). Không đổi logic/layout; bubble tutor giữ trắng; reduced-motion tắt dots.

**Tech Stack:** Vanilla JS ES modules, CSS (color-mix + gradient), tái dùng `HERO_BADGE` từ `gate-art.js`.

**Spec:** `docs/superpowers/specs/2026-09-21-main-page-polish-design.md` · Suite hiện tại 230/230 (22 files).

---

### Task 1: CSS polish + app-dots layer

**Files:**
- Modify: `public/styles.css` (thêm section cuối ~120 dòng)
- Modify: `public/index.html` (lớp dots)

- [ ] **Step 1: `public/index.html`** — sau `<div class="app">` mở (dòng 15), bên TRONG `.app` làm con đầu tiên, chèn:

```html
    <div class="app-dots" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
```

- [ ] **Step 2: `public/styles.css`** — append section cuối file:

```css
/* ---------------------------------------------------------------- main polish (gate language) */
/* nền trời rất nhạt toả từ trên */
body {
  background:
    radial-gradient(1100px 620px at 90% -10%, var(--tutor-soft), transparent 60%),
    radial-gradient(900px 480px at 0% -20%, color-mix(in oklch, var(--sky-top) 7%, transparent), transparent 55%),
    var(--bg);
}
.app { position: relative; z-index: 1; }

/* đốm confetti trôi — nhạt hơn gate, nằm sau nội dung */
.app-dots { position: fixed; inset: 0; overflow: hidden; z-index: 0; pointer-events: none; }
.app-dots i { position: absolute; border-radius: 50%; opacity: .28; animation: aDriftUp 18s linear infinite; }
.app-dots i:nth-child(1) { left: 6%; bottom: -20px; width: 12px; height: 12px; background: var(--sun); animation-duration: 21s; }
.app-dots i:nth-child(2) { left: 24%; bottom: -30px; width: 8px; height: 8px; background: var(--child); animation-duration: 15s; animation-delay: 2s; }
.app-dots i:nth-child(3) { left: 68%; bottom: -24px; width: 14px; height: 14px; background: var(--tutor); animation-duration: 24s; animation-delay: 1s; }
.app-dots i:nth-child(4) { left: 88%; bottom: -18px; width: 9px; height: 9px; background: var(--grape); animation-duration: 18s; animation-delay: 3s; }
.app-dots i:nth-child(5) { left: 46%; bottom: -28px; width: 11px; height: 11px; background: var(--leaf); animation-duration: 22s; animation-delay: 4s; }
@keyframes aDriftUp { to { transform: translateY(-112vh) rotate(220deg); } }

/* topbar: logo gradient teal + viền dưới gradient */
.brand .logo {
  background: linear-gradient(150deg, var(--tutor), var(--tutor-2));
  color: #fff;
}
.topbar { border-bottom: 2px solid transparent; border-image: linear-gradient(90deg, var(--tutor), transparent 70%) 1; }

/* rail subject: gradient màu riêng rất nhạt */
.subject { border-color: color-mix(in oklch, var(--sc, var(--tutor)) 22%, var(--border)); background: color-mix(in oklch, var(--sc, var(--tutor)) 8%, var(--surface)); }
.subject[data-subject="math"]    { --sc: var(--math); }
.subject[data-subject="reading"] { --sc: var(--reading); }
.subject[data-subject="english"] { --sc: var(--english); }
.subject[data-subject="science"] { --sc: var(--science); }
.subject[data-subject="curio"]   { --sc: var(--curio); }
.subject[data-subject="games"]   { --sc: var(--games); }
.subject:hover { transform: translateY(-2px); box-shadow: var(--shadow-sm); border-color: var(--sc, var(--tutor)); }
.subject[aria-pressed="true"] {
  background: color-mix(in oklch, var(--sc, var(--tutor)) 24%, var(--surface));
  border-color: var(--sc, var(--tutor));
  box-shadow: 0 4px 14px color-mix(in oklch, var(--sc, var(--tutor)) 30%, transparent);
}
.subject[aria-pressed="true"] .label { color: var(--fg); }

/* bubble bạn: gradient coral */
.msg.you .bubble { background: linear-gradient(150deg, var(--child), var(--child-2)); }

/* composer pill */
.composer form#composer {
  display: flex; align-items: flex-end; gap: 8px;
  background: var(--surface); border: 2px solid var(--border);
  border-radius: var(--radius-pill); padding: 8px 8px 8px 18px;
  transition: border-color .15s, box-shadow .15s;
}
.composer form#composer:focus-within { border-color: var(--tutor); box-shadow: var(--shadow-md); }
.composer .field { border: 0 !important; background: transparent !important; flex: 1; padding: 0 !important; }
.composer textarea { background: transparent; }
.send {
  flex: none; width: 48px; height: 48px; min-height: 48px; border-radius: 50% !important;
  border: 0 !important; background: linear-gradient(150deg, var(--child), var(--child-2)) !important;
  color: #fff !important; display: grid; place-items: center;
  box-shadow: 0 6px 16px color-mix(in oklch, var(--child) 40%, transparent);
  transition: transform .12s, box-shadow .15s;
}
.send:hover:not(:disabled) { transform: translateY(-2px); }
.send svg { width: 22px; height: 22px; stroke: #fff; }
.send:disabled { opacity: .45; }

/* suggests chips mềm hơn */
.suggests button { border-radius: 14px; transition: transform .12s, background .12s; }
.suggests button:hover { transform: translateY(-1px); background: var(--tutor-soft); }

/* welcome badge */
.welcome-badge { width: 72px; height: 72px; margin: 0 auto 4px; display: block; filter: drop-shadow(0 8px 14px oklch(60% 0.1 240 / .2)); animation: gHeroPop .7s cubic-bezier(.2, 1.3, .4, 1) both .15s; }

/* reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .app-dots i, .welcome-badge { animation: none; }
}
```

Lưu ý: `@keyframes gHeroPop` đã tồn tại trong styles.css (section gate) — KHÔNG định nghĩa lại. Nếu thiếu thì báo BLOCKED.

- [ ] **Step 3: Verify**

1. `npx vitest run` → 22 files, 230/230.
2. Node smoke: `node --input-type=module -e "await import('./public/games/hub.js'); console.log('ok')"`.

- [ ] **Step 4: Commit**

```bash
git add public/styles.css public/index.html
git commit -m "feat: main page polish backdrop, rail gradients and composer pill"
```

---

### Task 2: app.js — welcome badge + send icon trắng

**Files:**
- Modify: `public/app.js`

- [ ] **Step 1: Import badge**

Thêm vào khối import gate (sau dòng `import { initGate, reopenGate } from './gate.js';`):

```js
import { HERO_BADGE } from './gate-art.js';
```

- [ ] **Step 2: Welcome bubble thêm badge**

Trong `welcome()`, ngay sau `const lead = document.createElement('p');` và `lead.className = 'lead';` — chèn badge TRƯỚC khi append lead. Sửa đoạn:

```js
    const lead = document.createElement('p');
    lead.className = 'lead';
```
thành:
```js
    const badge = document.createElement('div');
    badge.className = 'welcome-badge';
    badge.setAttribute('aria-hidden', 'true');
    badge.innerHTML = HERO_BADGE;
    b.appendChild(badge);

    const lead = document.createElement('p');
    lead.className = 'lead';
```
(và giữ nguyên `b.appendChild(lead);` phía sau.)

- [ ] **Step 3: Send icon**

Trong `init()`, dòng `$('#send').innerHTML = I.send;` — svg `I.send` hiện dùng `stroke="currentColor"`; CSS mới ép `stroke: #fff` — không cần đổi markup. Kiểm tra `.send` class đã có trên button trong `index.html` (`<button class="send" id="send" ...>` — đã đúng). Không đổi gì thêm.

- [ ] **Step 4: Verify**

1. `npx vitest run` → 22 files, 230/230.
2. Node smoke: `node --input-type=module -e "await import('./public/games/hub.js'); console.log('ok')"` (app.js không node-importable vì DOM top-level — bình thường).
3. Đọc lại welcome(): badge nằm trên lead trong bubble tutor đầu tiên, aria-hidden.

- [ ] **Step 5: Commit**

```bash
git add public/app.js
git commit -m "feat: sparkle welcome badge on the main page"
```

---

### Task 3: Checklist + tổng verify

**Files:**
- Modify: `docs/smoke-checklist.md`

- [ ] **Step 1:** Thêm vào cuối file:

```markdown
## Main page polish

- [ ] Nền: gradient trời nhạt + 5 đốm confetti trôi rất nhạt (không che nội dung, tắt khi reduced-motion)
- [ ] Topbar logo gradient teal, viền dưới gradient mỏng; rail subject gradient màu riêng, hover lift, nút chọn có bóng màu
- [ ] Bubble của bé gradient coral; bubble Sparkle vẫn trắng sạch
- [ ] Welcome bubble có badge Sparkle 72px; composer pill lớn + nút gửi tròn coral icon trắng
- [ ] Games view vẫn hoạt động, nền mới không đè nội dung game
```

- [ ] **Step 2:** `npx vitest run` → 22 files, 230/230. Node smoke hub ok.

- [ ] **Step 3: Commit**

```bash
git add docs/smoke-checklist.md
git commit -m "docs: add main page polish section to smoke checklist"
```

---

## Ghi chú tự-review kế hoạch

1. **Spec coverage:** §2.1 nền/topbar + dots (T1), §2.2 rail (T1), §2.3 welcome badge (T2), §2.4 bubble you + composer + suggests (T1), §2.5 games tự động, reduced-motion (T1 media). §3 checklist (T3). Đủ.
2. **Không placeholder** — mọi bước có code/verify cụ thể.
3. **Type consistency:** `--sc` local var đặt bằng selector `[data-subject=…]` rồi tiêu thụ trong `.subject` — kế thừa qua cascade từ chính phần tử; `gHeroPop` tái dùng keyframe gate (đã tồn tại); `HERO_BADGE` import khớp export gate-art.js.
4. **Nguy cơ cascade:** `.subject` rules mới đặt CUỐI styles.css nên thắng rule cũ cùng specificity; rule cũ `[aria-pressed=true]` màu chữ riêng của từng subject vẫn giữ (được `.label` color fg override — chấp nhận theo spec "gradient đậm hơn").
