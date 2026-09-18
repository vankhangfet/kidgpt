# KidGPT — Sparkle Games: Menu Trò chơi & 4 game

Ngày: 2026-09-18
Trạng thái: Đã duyệt qua thảo luận (3 phần đều được phê duyệt)

## 1. Tổng quan

Thêm mục **Trò chơi (Games)** vào thanh subject của Sparkle Tutor, dẫn tới game hub
với 4 game "vừa học vừa chơi". Thiết kế dựa trên mock `mock/game-mockup.html`
(giữ nguyên ngôn ngữ thiết kế: token oklch, Baloo 2/Nunito, khung `.game` +
bong bóng Sparkle). Game cờ vua là game thứ 4, thêm mới ngoài 3 game trong mock.

Quyết định chính đã chốt:

| Quyết định | Lựa chọn |
|---|---|
| Phạm vi | Đủ 4 game: Treasure Number, Word Quest, Puzzle Detective, Cờ vua |
| Cờ vua | Đấu với bot đơn giản + gợi ý (không làm chế độ giải đố thế cờ) |
| Nguồn nội dung | 100% client-side — không gọi LLM, không tốn API, chạy offline |
| Lưu tiến trình | localStorage theo profile id + game (không đụng Firestore) |
| Tích hợp | View switch trong SPA — nút riêng trên rail, **không phải LLM subject** |
| Engine cờ vua | Tự viết pure JS (không dependency, không vendored lib) |

Quy tắc sư phạm giữ nguyên từ mock: **sai không bao giờ lộ đáp án** — Sparkle
đưa hint từng bước, chỉ xác nhận khi trẻ tự giải đúng.

## 2. Tích hợp vào app

### 2.1. Nút "Trò chơi" trên rail

- `app.js` render thêm 1 nút sau 5 subject: icon 🎮 + label `Trò chơi`/`Games`.
- **Không thêm vào `SUBJECTS`** ở `public/i18n.js` lẫn `api/lib/schemas.js` —
  games không phải subject lọc prompt LLM. Không sửa gì ở `api/`.
- Click → ẩn `<section class="chat">` (thêm `id="chatView"` cho rõ ràng), hiện
  `<section id="gamesView">` trong `index.html`. Nút Back trong games view →
  quay lại chat, state chat giữ nguyên (không reset stream, không mất plan đang dở).
- `applyLang()` re-render hub/game đang mở; `document.documentElement.lang`
  giữ nguyên cơ chế hiện tại (gate.js phụ thuộc).

### 2.2. Game hub

- 4 card theo mock `.game-card`: 3 game mock + Cờ vua (♟️). Mỗi game một màu:
  `--treasure-sea` (xanh biển), `--magic` (tím), `--sepia` (nâu), và màu mới
  `--chess: oklch(58% 0.12 155)` (ngọc lục bảo) thêm vào token.
- Click card → hub ẩn, panel game hiện; nút "Chọn game khác" quay về hub.

### 2.3. Khung chung (`public/games/games.css`)

Port từ mock: `.game` + `.game-top` (gradient theo màu game, điểm số bên phải),
`.game-say` (bong bóng Sparkle: thường / `.warn` gợi ý / `.win` chúc mừng),
`.opt` (đáp án, `.right`/`.wrong`), `.gbtn` (hành động, `.primary`/`.hint`),
`.level-pill` (chọn cấp độ). File css riêng, `index.html` thêm `<link>`.

### 2.4. i18n & tiến trình

- Chuỗi UI của games (nhãn nút, lời Sparkle mẫu, tên cấp độ/vùng/chặng) thêm
  vào `STRINGS` trong `public/i18n.js` (vi/en), dùng `t(lang, key)`.
- **Nội dung dữ liệu** (bank câu Word Quest, 3 vụ án Detective, cấu hình cấp độ
  Treasure) để trong `public/games/content.js` riêng — tránh i18n.js phình.
- `public/games/progress.js`: wrapper localStorage, key `kidgpt-games:<profileId>:<game>`
  (gems, node, level, case, W/L cờ vua). Try/catch toàn bộ — private mode
  fallback in-memory object, game vẫn chơi được. Mỗi game có nút nhỏ
  "Xóa tiến trình".

## 3. Ba game từ mockup

### 3.1. Treasure Number — toán (🗺️)

- 3 cấp độ: **Lv1** cộng/trừ trong phạm vi 20 · **Lv2** cộng/trừ trong 100 ·
  **Lv3** nhân/chia bảng (2–9) + cộng trừ 2 chữ số. Sinh câu hỏi tự động bằng
  số ngẫu nhiên trong khoảng, bảo đảm kết quả ≥ 0 (trừ) và chia hết (chia).
- Bản đồ 5 chặng: Đảo → Rừng → Cổng ma → Hang cướp biển → Kho báu. Mỗi chặng
  3 câu (15 câu/cấp độ); hết chặng → chúc mừng + mở chặng kế (node mock:
  done/current/locked). Khay gem **15 ô** (đầy/ghost) theo cấp độ hiện tại —
  mock vẽ 12 ô thuần trang trí, điều chỉnh thành 15 cho khớp cơ chế đếm;
  mỗi câu đúng +1 gem, tổng gem tích lũy qua các cấp lưu ở progress.
- Mỗi câu 3 đáp án: đúng + 2 nhiễu sinh từ lỗi phổ biến (±1, ±10, hoán vị
  toán hạng). 3 lựa chọn phân biệt, thứ tự trộn.
- Thang hint: sai lần 1 → hint khái niệm; sai lần 2 → hint chiến lược
  (đếm tiếp/decompose); phải chọn đúng mới qua câu. Cấu hình hint theo phép
  toán trong `content.js` (template vi/en).

### 3.2. Word Quest — tiếng Anh (📚)

- Bank 20 câu tiếng Anh chia 5 vùng theo mock (4 câu/vùng): Word Garden →
  Sentence Village → Grammar Castle → Time Tower → Story Kingdom; độ dài tăng
  3 → 7 từ.
- Ngôn ngữ hướng dẫn theo lang app (VI: "Sắp các thẻ thành câu đúng nhé!");
  câu xây luôn là tiếng Anh (mục tiêu học EN cho trẻ Việt).
- Tương tác **tap-then-tap** làm chính: chạm thẻ (sáng lên) → chạm ô trống;
  chạm thẻ đã đặt → nhả về bank. Chắc chắn chạy tốt desktop + touch.
  Kéo-thả native (`draggable`) chỉ là enhancement nếu thêm được mà không phức tạp.
- Sai thứ tự khi "Cast the spell" → gợi ý Socratic theo vị trí sai đầu tiên
  ("Đọc to thử xem: *The dog…* — con chó đang làm gì?"), không đảo sẵn đúng.
  Đúng → khóa thẻ, tinh thể SVG lớn thêm 1 nấc (4 nấc = 4 câu của vùng),
  đủ 4 nấc → mở vùng kế.

### 3.3. Puzzle Detective — suy luận (🕵️)

- 3 vụ án song ngữ vi/en trong `content.js`: **Bánh quy mất tích** (thủ phạm
  Bunny 🐰, từ mock), **Lọ hoa vỡ**, **Gấu bông biến mất**. Mỗi vụ: 3 nghi phạm,
  3–5 manh mối, đúng **1** thủ phạm nhất quán.
- Luồng mỗi vụ: giới thiệu + đọc manh mối → 2–3 câu hỏi suy luận trắc nghiệm
  (mỗi câu hỏi nhắm 1 bước logic: mâu thuẫn, loại nghi phạm, kết luận dở) →
  chỉ khi trả lời đúng hết mới mở màn tố cáo.
- Tố sai → Sparkle chỉ lại manh mối then chốt kèm câu hỏi dẫn dắt, không nói
  thủ phạm; tố đúng → "Case closed" + chuyển vụ kế. Tiến độ `Case n/3`.

## 4. Cờ vua (♟️) — đấu với bot + gợi ý

### 4.1. Engine (`public/games/chess/engine.js`)

Pure functions, không mutate state đầu vào — cùng pattern với `util.js`/`aids.js`:

- Đại diện bàn: mảng 64 ô (hoặc {pieces, turn, castling, ep, halfmove…}), quân
  ký hiệu kiểu `'wP'`, `'bK'`… ; render UI map sang Unicode (♔♕♖♗♘♙ / ♚♛♜♝♞♟).
- Luật đầy đủ: nước đi từng loại quân, ăn quân, **nhập thành 2 phía** (kiểm tra
  ô trống + không bị chiếu khi đi qua), **bắt tốt qua đường** (en passant),
  **phong cấp tự động thành Hậu** (đơn giản cho trẻ, ghi chú trong code),
  phát hiện **chiếu**, **chiếu hết**, **hết nước (stalemate = hòa)**.
- Bỏ qua: luật 50 nước, lặp 3 lần, underpromotion chọn quân — ghi chú rõ
  trong header module. Đủ cho trẻ, giữ engine gọn.
- API chính: `initialState()`, `legalMoves(state, from)`, `allLegalMoves(state, side)`,
  `applyMove(state, move)` (trả state mới), `status(state)` →
  `playing | check | checkmate | stalemate`, `inCheck(state, side)`.

### 4.2. Bot + Hint (`public/games/chess/bot.js`)

- "Sparkle Bot" cầm Đen: tìm 2 ply (bot đi → nước đáp trả tốt nhất của trẻ),
  đánh giá chỉ theo **lực quân** (p=1 n=3 b=3 r=5 q=9) + nhiễu ngẫu nhiên nhỏ
  để không lặp máy móc. Mức này biết phạt quân thả nhưng trẻ thắng được.
- `suggestMove(state, side)` dùng cùng logic theo phía trẻ — phục vụ nút Gợi ý.

### 4.3. UI (`public/games/chess/ui.js`)

- Bàn 8×8 dựng từ nút (button) — mỗi ô aria-label dạng "Mã trắng g1". Trẻ cầm
  Trắng. Chạm quân mình → **chấm sáng nước hợp lệ** (chấm nhỏ: trống; vòng:
  ăn quân); ô vua sáng đỏ khi bị chiếu + bong bóng Sparkle giải thích.
- Bong bóng Sparkle theo ngữ cảnh: dạy giá trị quân khi ăn ("Bạn ăn Hậu — 9 điểm,
  quân mạnh nhất!"), giải thích chiếu, chúc mừng chiếu hết, động viên khi thua.
- Thanh hành động: **Gợi ý** (highlight nước đề xuất + 1 câu giải thích trẻ con),
  **Đi lại** (undo cả cặp bot+trẻ), **Ván mới**. Danh sách nước đã đi dạng
  đơn giản ("♘ g1→f3 ×e5" — ký hiệu quân theo lang).
- Kết thúc ván → màn celebrate/hedge + đếm Thắng/Thua lưu localStorage.

## 5. Testing (Vitest, môi trường node — theo pattern test hiện có)

| File | Nội dung chính |
|---|---|
| `test/games-engine.test.js` | Nước hợp lệ từng loại quân; nhập thành (đủ/không đủ điều kiện); en passant; phong cấp; chiếu hết 1 nước (FEN-like setup); hết nước = hòa; không cho đi quân khi đang chiếu đường khác |
| `test/games-bot.test.js` | Bot ăn hậu đang thả; suggestMove tìm ra chiếu hết 1 nước; bot không bỏ quân miễn phí |
| `test/games-treasure.test.js` | Câu hỏi sinh đúng khoảng theo level; luôn có đúng đáp án; 3 lựa chọn phân biệt |
| `test/games-wordquest.test.js` | Trộn thẻ không bao giờ ra đúng thứ tự ban đầu (với câu ≥2 từ) |
| `test/games-detective.test.js` | Dữ liệu 3 vụ án hợp lệ: đúng 1 thủ phạm, đủ manh mối/bước suy luận, vi/en đủ |
| `test/games-progress.test.js` | Đọc/ghi/xóa localStorage (mock global); fallback in-memory khi throw |

UI render không test tự động (không jsdom) — nhất quán với `aids.test.js` hiện có.

## 6. Sơ đồ file

```
public/games/
  games.css        # Khung game + bàn cờ (port từ mock + mới)
  hub.js           # Render hub, mở/đóng panel game, quay lại chat
  progress.js      # localStorage wrapper per profile+game
  content.js       # Bank WQ, 3 vụ án, cấu hình level Treasure (vi/en)
  treasure.js      # Sinh câu hỏi + luồng bản đồ/gem/hint
  wordquest.js     # Tap-then-tap, kiểm tra thứ tự, tinh thể
  detective.js     # Luồng vụ án: manh mối → suy luận → tố cáo
  chess/
    engine.js      # Luật cờ đầy đủ (pure)
    bot.js         # Tìm 2 ply + suggestMove
    ui.js          # Bàn cờ, highlight, bong bóng Sparkle, hành động

test/
  games-engine.test.js  games-bot.test.js  games-treasure.test.js
  games-wordquest.test.js  games-detective.test.js  games-progress.test.js
```

Sửa file có sẵn:
- `public/index.html` — thêm `<section id="gamesView">` + `<link games.css>`
- `public/app.js` — nút Games trên rail, view switch, hook applyLang
- `public/i18n.js` — chuỗi UI games (vi/en)
- `public/styles.css` — màu rail cho nút Games

**Không sửa `api/`** — games hoàn toàn client-side.

## 7. Ngoài phạm vi

- Giải đố thế cờ (puzzle mode), đồng hồ cờ, xếp hạng online
- Underpromotion chọn quân; luật 50 nước & lặp 3 lần
- Lưu ván cờ dở giữa chừng (chỉ lưu W/L)
- Đồng bộ tiến trình Firestore; Multiplayer
- Kéo-thả nâng cao (chỉ tap-then-tap là bắt buộc)
