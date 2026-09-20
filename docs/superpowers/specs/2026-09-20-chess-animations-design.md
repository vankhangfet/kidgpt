# KidGPT — Chess Animations: hiệu ứng & âm thanh sinh động cho cờ vua

Ngày: 2026-09-20
Trạng thái: Đã duyệt qua thảo luận (3 phần đều được phê duyệt)

## 1. Tổng quan

Nâng cấp game cờ vua (đã ship ở `public/games/chess/`) thêm hiệu ứng chuyển động và âm
thanh phù hợp trẻ nhỏ. Không đổi luật chơi, engine, bot hay tiến trình — chỉ thêm lớp
trình bày phía trên. Nguyên tắc: hiệu ứng phải **phản ánh đúng chuyện vừa xảy ra**
(nước đi, nước ăn, chiếu, thắng/thua) và tôn trọng người nhạy cảm chuyển động.

Quyết định chính đã chốt:

| Quyết định | Lựa chọn |
|---|---|
| Nhóm hiệu ứng | Cả 4: trượt+ăn quân, gợi ý mũi tên, phản hồi nước đi+chiếu, mừng thắng/thua |
| Âm thanh | Có — WebAudio synth (không file, không network, an toàn CSP) + nút bật/tắt |
| Kỹ thuật trượt quân | FLIP glide trên render hiện tại + overlay layer (không refactor keyed DOM) |
| Accessibility | `prefers-reduced-motion` tắt toàn bộ animation |
| Phạm vi | Chỉ game cờ vua |

## 2. Hiệu ứng hình ảnh

### 2.1. Trượt quân (FLIP)

- Trước khi `draw()` render lại, lưu snapshot vị trí tuyệt đối (getBoundingClientRect)
  của quân ở ô nguồn. Sau render, quân ở ô đích được set `transform: translate(dx,dy)`
  (delta = ô cũ → ô mới), ép reflow, rồi transition ~220ms ease-out về `translate(0,0)`.
- Áp cho nước người và nước bot. **Không** trượt khi: undo, Ván mới, render do đổi
  ngôn ngữ (chỉ animate khi đúng 1 quân vừa thay đổi ô — tham số `lastMove` truyền
  vào draw).
- CSS: `.pc { transition: transform .22s ease-out; }` — chỉ ăn khi có transform;
  `.sq` đặt `overflow: hidden`? KHÔNG — quân trượt cần ló ra giữa các ô; board đã có
  `overflow: hidden` ở `.chessboard`, chấp nhận quân bị cắt nhẹ khi trượt qua mép.

### 2.2. Ăn quân

- Quân bị ăn hiện "ghost" tại ô đích: span glyph đè lên, animation 300ms
  `scale(1 → 1.6) + rotate(±12deg) + fade out`, tự gỡ sau animation.
- **Khay quân bị bắt** (captured trays): 2 dải nhỏ dưới bàn — "Quân bạn ăn" (glyph
  quân đen bị bắt) và "Sparkle Bot ăn" (glyph quân trắng bị bắt), sắp theo thứ tự
  bị bắt, tối đa 15 glyph mỗi hàng (wrap). Chỉ hiện khi có quân bị bắt.

### 2.3. Phản hồi nước đi + chiếu

- Ô nguồn + ô đích của nước VỪA ĐI mang class `.last` (nền vàng nhạt đè lên
  light/dark, z-index dưới quân), tự xoá khi có nước mới.
- Vua bị chiếu: `.chk` chuyển từ nền đỏ tĩnh sang **nhấp nháy** (keyframe pulse nền
  đỏ 3 nhịp ~0.9s rồi giữ đỏ nhạt).

### 2.4. Gợi ý mũi tên lấp lánh

- Overlay SVG tuyệt đối trên bàn (pointer-events: none): mũi tên vàng từ tâm ô nguồn
  → tâm ô đích, stroke đứt (`stroke-dasharray`) với animation `stroke-dashoffset`
  chạy liên tục (hiệu ứng "chảy"), đầu mũi tên tam giác; ô đích thêm keyframe nhấp
  nháy viền vàng. Xoá khi người chạm bàn hoặc đi nước.

### 2.5. Bot đang nghĩ

- Trong 450ms chờ bot: bong bóng Sparkle "Sparkle đang nghĩ…" + 3 chấm nhảy — tái
  dùng markup `.thinking` + CSS sẵn có của app (`styles.css`).

### 2.6. Mừng thắng / thua

- **Thắng:** pháo giấy CSS — 24 mảnh màu (div nhỏ absolute, toạ độ/keyframe ngẫu
  nhiên do fx.js sinh) rơi + xoay ~1.5s rồi tự gỡ; các quân Trắng nhảy nhẹ
  (keyframe bounce 2 nhịp).
- **Thua:** 6 trái tim vàng rơi chậm + bong bóng động viên (dùng `chLose` hiện có).
- Hòa: bong bóng hiện có, không hiệu ứng thêm.

## 3. Âm thanh — `public/games/chess/sfx.js`

- WebAudio thuần: `AudioContext` lazy — tạo ở lần gọi phát tiếng ĐẦU TIÊN sau cử chỉ
  người dùng (đúng autoplay policy); nếu chưa có context thì bỏ qua im lặng.
- Hiệu ứng (đều là oscillator ngắn 60–400ms, gain envelope, không file):
  | Tên | Kích hoạt | Âm |
  |---|---|---|
  | move | đặt quân xong | blip gỗ 220Hz 60ms |
  | capture | ăn quân | 2 tông xuống (330→180Hz) |
  | check | bị chiếu | 2 beep mềm |
  | win | chiếu hết thắng | arpeggio C5-E5-G5 |
  | lose | thua | tông trầm dịu xuống |
  | hint | bấm Gợi ý | ping lấp lánh cao |
- API: `playSfx(name)`; `isSoundOn()` / `setSoundOn(bool)` — lưu
  `kidgpt-games:chess:sound` (mặc định bật). Nút 🔊/🔇 (gbtn ghost) trên game-actions,
  aria-label vi/en.

## 4. Kiến trúc & file

```
public/games/chess/
  fx.js     (MỚI — thuần, test được)
    - glideDelta(fromRect, toRect) → {dx, dy}
    - arrowGeometry(fromRect, toRect, padPx) → {x1,y1,x2,y2} (SVG toạ độ %)
    - confettiSpec(rng) → 24 mảnh {left, delay, color, rotate, duration}
    - trayGlyphs(capturedList) → chuỗi glyph sắp theo thứ tự
    - prefersReducedMotion() → bool (matchMedia + fallback)
  sfx.js    (MỚI — synth + mute persistence, mock-able)
  ui.js     (SỬA — wire: FLIP, ghost, trays, .last, arrow overlay, thinking,
             confetti/hearts, gọi playSfx, nút âm thanh)
public/games/games.css  (SỬA — keyframes: capture-pop, chk-pulse, last, arrow
             dash-run, confetti-fall, heart-fall, bounce; @media reduced-motion
             tắt tất cả)
public/i18n.js          (SỬA — keys: chThinking, chYouTook, chBotTook, soundOn,
             soundOff — vi/en)
test/games-chess-fx.test.js (MỚI — fx.js + sfx.js với AudioContext mock)
```

## 5. Accessibility & hiệu năng

- `@media (prefers-reduced-motion: reduce)`: mọi animation/transition ở games.css
  về `none`/`0.01ms`; JS đọc `prefersReducedMotion()` để bỏ FLIP glide + confetti.
- Overlay pointer-events: none — không chặn chạm ô.
- Không thêm network request, không đổi CSP; hiệu ứng đều một-shot và tự dọn
  (animationend / timeout) để không rò rỉ node.

## 6. Testing

| File | Nội dung |
|---|---|
| `test/games-chess-fx.test.js` | glideDelta đúng dấu/độ lớn; arrowGeometry nằm trong 0–100 và trừ pad; confettiSpec đủ 24 mảnh, trường màu/độ trễ hợp lệ; trayGlyphs sắp thứ tự + glyph đúng; sfx: playSfx không throw khi không có AudioContext, setSoundOn/isSoundOn round-trip (mock localStorage), playSfx gọi oscillator khi context mock có sẵn |
| Hiện có | Toàn bộ 201 test phải xanh — không đổi engine/bot/ui logic có sẵn ngoài việc thêm hook |

## 7. Ngoài phạm vi

- Âm thanh lặp/ambient, nhạc nền
- Hiệu ứng cho 3 game khác (làm sau nếu cần)
- Animation khi hover ô; haptic
- Lưu cấu hình âm thanh lên Firestore (chỉ localStorage)
