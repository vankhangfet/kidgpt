# KidGPT — Main Page Polish: trang chủ sinh động theo ngôn ngữ gate

Ngày: 2026-09-21
Trạng thái: Đã duyệt qua thảo luận (thiết kế 3 phần được phê duyệt)

## 1. Tổng quan

Làm sinh động trang chính (sau đăng nhập) theo tinh thần trang login đã deploy:
mức **vừa phải** — màu sắc, chuyển động nền nhẹ và mascot, KHÔNG đụng bố cục hay
bubble chat (giữ trắng sạch để tập trung học). Không đổi logic app.

Quyết định chính đã chốt:

| Quyết định | Lựa chọn |
|---|---|
| Cường độ | Vừa phải — không cảnh trời sau stream |
| Nền | Gradient trời nhạt + 5 đốm confetti trôi (opacity thấp hơn gate) |
| Chat bubbles | Giữ nguyên; riêng bubble `you` gradient coral |
| Welcome | Sparkle hero badge (72px) + subject chips màu |
| Phạm vi file | styles.css + app.js (welcome/send markup) + tái dùng gate-art.js |

## 2. Chi tiết

### 2.1. Nền & topbar
- `body` nền thêm gradient trời nhạt (`--sky-top` ở ~6% + `--tutor-soft` hiện có);
  thêm lớp `.app-dots` (5 `<i>` đốm confetti, pattern giống `.g-dots`, opacity .28,
  màu sun/coral/teal/grape/leaf) render 1 lần trong `index.html`, `position: fixed`,
  z-index 0, `pointer-events: none`; tắt theo `prefers-reduced-motion`.
- `.app` đặt `z-index: 1` (nội dung đè dots). Topbar: `.brand .logo` nền
  `linear-gradient(150deg, var(--tutor), var(--tutor-2))`, icon `#fff`, giữ radius 14px;
  viền dưới topbar đổi `border-image` gradient teal→transparent (fallback: giữ border màu).

### 2.2. Rail subject
- Mỗi subject một gradient nền rất nhạt theo token màu riêng (dùng `color-mix` 10–14%
  màu + trắng), icon giữ màu hiện tại đậm hơn; hover `translateY(-2px)` + shadow-sm;
  trạng thái `aria-pressed="true"`: gradient ~30% màu + border màu + shadow màu.
- Games nút giữ màu `--games` như hiện tại, cùng pattern.

### 2.3. Welcome bubble
- Trong bubble welcome: chèn hero badge Sparkle (`HERO_BADGE` từ `gate-art.js`, CSS
  `.welcome-badge` 72px, `animation: heroPop` gate — tĩnh khi reduced-motion) phía
  trên đoạn lead; subject chips giữ nguyên logic, thêm class màu theo subject
  (border + icon màu, nền trắng) — chips đã có màu icon sẵn, chỉ nâng padding/bo.

### 2.4. Chat & composer
- Bubble `you`: `background: linear-gradient(150deg, var(--child), var(--child-2))`.
- Composer: `.composer` wrap pill lớn (radius pill, border 2px, bg surface, shadow-md
  khi `:focus-within`); textarea bỏ viền riêng (cha lo); nút `.send` tròn 48px nền
  gradient coral, icon plane trắng (giữ svg send, thêm fill #fff + bg); suggests
  chips radius 14, hover nền màu subject rất nhạt.

### 2.5. Games view
- Không đụng code game; hưởng nền mới tự động.

## 3. Kỹ thuật & ràng buộc

- File: `public/styles.css` (section mới ~120 dòng + override), `public/app.js`
  (welcome badge markup + send button class), `public/index.html` (lớp app-dots),
  không file mới ngoài đó.
- Reduced-motion: `.app-dots i { animation: none; }`.
- CSP không đổi (không asset ngoài; svg nội tuyến).
- 230 test giữ xanh (chỉ CSS/DOM markup); smoke checklist thêm mục "Main polish".

## 4. Ngoài phạm vi

- Cảnh trời sun/mây/đồi sau stream; đổi bố cục rail/composer
- Dark mode; hiệu ứng âm thanh ngoài cờ vua
- Thay đổi bubble tutor/steps/aids (giữ sạch trắng)
