# KidGPT — Gate Redesign: trang đăng nhập & hồ sơ theo authen-mock

Ngày: 2026-09-20
Trạng thái: Đã duyệt qua thảo luận (thiết kế 3 phần được phê duyệt)

## 1. Tổng quan

Làm mới toàn bộ 3 màn gate (đăng nhập Google, chọn hồ sơ, quản lý hồ sơ) theo
`mock/authen-mock.html` — giữ nguyên toàn bộ logic auth/profile (Firebase,
`auth.js`), chỉ thay lớp trình bày. Mục tiêu: hấp dẫn với phụ huynh (tin tưởng,
lợi ích rõ ràng) và thân thiện với trẻ (mascot, cảnh trời, chuyển động mềm).

Quyết định chính đã chốt:

| Quyết định | Lựa chọn |
|---|---|
| Phạm vi | Cả 3 màn gate |
| Màn đăng nhập | Port đầy đủ mockup split-card (world + panel) |
| Màn chọn/quản lý hồ sơ | Card hiện tại nâng cấp theo ngôn ngữ mockup (mascot hero + tokens màu), KHÔNG split-layout |
| Terms/Privacy | Text thuần, không link chết (chưa có trang chính sách) |
| Nút Google | 3 state thật theo promise `signInWithGoogle()`: idle → loading → reset (thành công do auth watcher re-render) |
| Nền gate | Lớp `bg-dots` 5 đốm confetti trôi dùng chung mọi màn |

## 2. Màn đăng nhập — port mockup

### 2.1. Cấu trúc (renderLogin)

```
#gate (bg hiện tại + .bg-dots)
└─ main.auth (split-card, rise animation)
   ├─ section.world
   │  ├─ .sky (aria-hidden): sun (pulse), 4 stars (twinkle), 3 clouds (drift), hills SVG
   │  ├─ .brand: brand-mark sparkle nhỏ + "Kid<span>GPT</span>" (span màu --sun)
   │  ├─ .stage (aria-hidden): .sparkle mascot (bob) + 2 .buddy (robot/cú, bob lệch pha)
   │  │   + 4 .token (7 / icon sách / icon hành tinh / A — floaty, xoay nhẹ)
   │  └─ .world-copy: eyebrow, h1 (chứa <em> màu sun), lede, 3 .chip trust
   └─ section.panel
      ├─ ::before/::after blob trang trí
      ├─ .panel-hero: hero-badge Sparkle (heroPop) + h2 (👋 wave) + p (i18n signInTitle/Body)
      ├─ button.google (data-state idle|loading) + spinner riêng
      ├─ .safe-line (khiên + khóa, i18n)
      ├─ ul.benefits ×3 (icon gradient coral/teal/grape + strong + span)
      └─ p.foot-note (i18n, text thuần)
```

### 2.2. Hành vi nút Google

- click → `data-state="loading"` (ẩn logo G, hiện spinner, label `signInConnecting`)
  → `await signInWithGoogle()`:
  - Thành công: `watchAuth` re-render gate (route) — không cần state done trong app thật
  - Lỗi: reset `data-state="idle"`, hiện `signInError` như hiện tại (bỏ qua
    popup-closed/cancelled như code cũ)
- Kết xuất label qua i18n; spinner SVG như mockup.

### 2.3. Responsive & motion

- <860px: `.auth` xếp 1 cột (world trên, stage co lại), <520px ẩn trust + giảm
  cỡ h1, <400px full-bleed. Theo mockup nguyên văn.
- Mọi animation (rise/sunPulse/twinkle/drift/bob/floaty/heroPop/wave/driftUp)
  port nguyên vẹn; `prefers-reduced-motion` đã có global clamp ở styles.css —
  thêm mục tắt riêng cho gate anim để tự chủ (không `!important` toàn cục như mock).

## 3. Màn chọn hồ sơ & quản lý hồ sơ — nâng cấp cùng ngôn ngữ

- Giữ nguyên cấu trúc HTML/luồng hiện tại (`renderPicker`/`renderManager`) và
  toàn bộ handler; thay đổi trình bày:
  - `.gate-card` (2 màn này): thêm **hero badge Sparkle 96px** (heroPop + wave)
    trên đầu thay `✨`; tiêu đề Baloo 2 lớn hơn (26px); shadow-pop.
  - `.profile-card`: hover translateY(-4px) + shadow-md; avatar dùng gradient
    theo `--pc` thay màu phẳng; band pill nền màu theo `--pc` 12% opacity.
  - `.profile-row`, form, `.age-band-btn`, `.gate-save`: nâng cấp cùng phong cách
    (field nền `--bg`, viền `--border`, radius 18; save pill gradient coral như
    nút Google nhưng màu `--child`); chip-danger giữ ngữ nghĩa đỏ.
  - Màn lỗi (`renderLoadError`/`renderConfigError`) dùng hero-badge buồn (mắt
    cong xuống — biến thể SVG nhỏ) thay emoji.
- Nền `.gate` + `.bg-dots` áp cho mọi màn. Vì `show()` thay toàn bộ innerHTML
  của #gate, thêm wrapper con `<div id="gate-screens">` bên trong #gate:
  `show()`/`hide()` chỉ ghi vào wrapper này; lớp `.bg-dots` là anh em của
  wrapper, render một lần trong `initGate` và tồn tại suốt vòng đời gate.

## 4. Token màu & CSS

Thêm vào `:root` (`styles.css`): `--sun, --sun-2, --grape, --leaf, --sky-top,
--tutor-2, --tutor-deep, --child-2`, nâng `--shadow-md`, thêm `--shadow-pop`
đậm hơn — kèm fallback hex trong block `@supports` hiện có.

Vị trí CSS: **thay thế section gate trong `styles.css`** (một chủ sở hữu duy
nhất cho gate; games.css giữ nguyên). Ước lượng ~330 dòng mới.

## 5. File & kiến trúc

```
public/gate-art.js  (MỚI — hằng SVG thuần, không DOM)
  SPARKLE_MASCOT (132), HERO_BADGE (96, có biến thể SAD), BUDDY_ROBOT,
  BUDDY_OWL, HILLS, CLOUD, STAR, ICON_* (sách, hành tinh, khiên, check,
  khóa, nhạc, calendar, người, cờ hiệu 3 benefit)
public/gate.js     (SỬA — renderLogin mới, picker/manager polish,
  loading state thật, bg-dots init)
public/styles.css  (SỬA — token + section gate mới)
public/i18n.js     (SỬA — ~16 keys vi/en mới)
test/games-i18n.test.js (SỬA — SHARED mở rộng keys gate)
```

## 6. i18n — keys mới (vi/en)

`signInEyebrow, signInH1 (chứa <em>), signInLede, trustSafe, trustParent,
trustPrivate, signInConnecting, signInSafe, benefit1T/benefit1D,
benefit2T/benefit2D, benefit3T/benefit3D, gateFoot`. Các key hiện tại
(signInTitle/signInBody/chooseProfileLead…) giữ và dùng tiếp nơi phù hợp.
Markup `<em>` cho phép giống `welcomeBody`/`gamesSay` (mở rộng whitelist
test i18n nếu cần).

## 7. Kiểm thử

- `test/games-i18n.test.js`: thêm keys mới vào SHARED (cả 2 ngôn ngữ tồn tại,
  string không rỗng — đổi `typeof === 'string'` của SHARED loop sang
  `toBeTruthy()` cho chắc).
- Không test DOM cho gate (không jsdom, gate.js import firebase CDN — không
  node-import được); xác minh bằng smoke thủ công theo checklist.
- Suite hiện tại phải xanh nguyên vẹn (không đụng engine/games).

## 8. Ngoài phạm vi

- Trang Terms/Privacy thật (links) — text thuần
- Đổi flow auth (Google-only giữ nguyên), MAX_PROFILES, Firestore rules
- Mascot tùy biến theo age-band; dark mode
- Áp ngôn ngữ mock cho app chính (topbar/rail) — chỉ gate
