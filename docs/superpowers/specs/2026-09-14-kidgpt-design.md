# KidGPT — Sparkle Tutor: Thiết kế hệ thống

Ngày: 2026-09-14
Trạng thái: Đã duyệt qua thảo luận (3 phần đều được phê duyệt)

## 1. Tổng quan

KidGPT (Sparkle Tutor) là trợ lý AI học tập cho trẻ 6–12 tuổi. Trẻ đặt câu hỏi qua cửa
sổ chat; AI **không trả lời trực tiếp** mà hướng dẫn cách tiếp cận từng bước (phương pháp
Socratic), kèm minh họa trực quan sinh động. Giao diện dựa trên mock
`mock/sparkle-tutor.html` (giữ nguyên ngôn ngữ thiết kế).

Quyết định chính đã chốt:

| Quyết định | Lựa chọn |
|---|---|
| Ngôn ngữ | Song ngữ VN/EN — nút chuyển trên topbar, mặc định theo trình duyệt, lưu localStorage |
| AI provider | Chuẩn OpenAI-compatible — cấu hình được `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL` |
| Minh họa | Component library — AI trả JSON descriptor, frontend render từ 4 loại component |
| Triển khai | Vercel — serverless functions (`api/`) + static frontend (`public/`) |
| Mức độ | Production-ready: rate limit, moderation, security headers, logging |
| Kiến trúc AI | Plan-based — 1 call LLM trả về "kế hoạch học" JSON; đáp án tự do gọi thêm 1 call phán xét |

## 2. Kiến trúc

### 2.1. Cấu trúc repo

```
kidgpt/
├── api/                    # Backend — Vercel serverless functions
│   ├── chat.js             # POST /api/chat — tạo plan hướng dẫn
│   ├── judge.js            # POST /api/judge — phán xét đáp án tự do
│   └── lib/
│       ├── llm.js          # Client LLM chuẩn OpenAI-compatible
│       ├── prompts.js      # System prompt sư phạm (vi/en)
│       ├── schemas.js      # Zod schema validate + sanitize
│       └── ratelimit.js    # Rate limit per IP (Upstash)
├── public/                 # Frontend — static, không build step
│   ├── index.html          # Từ mock + nút VN/EN
│   ├── styles.css          # Design system mock (Baloo 2/Nunito, coral/teal)
│   ├── app.js              # Logic chat + state (ES module vanilla)
│   ├── aids.js             # Thư viện component minh họa (4 loại)
│   └── i18n.js             # Từ điển UI vi/en
├── test/                   # Vitest
├── vercel.json             # Security headers, maxDuration
└── package.json
```

### 2.2. Luồng dữ liệu

```
Trẻ gửi câu hỏi
   │
   ▼
POST /api/chat  { message, history, lang, subject? }
   │  1. Rate limit check (per IP)
   │  2. System prompt sư phạm + schema JSON → gọi LLM
   │  3. Zod validate + retry 1 lần nếu JSON hỏng
   ▼
Plan JSON { intro, aid, steps[], answer }  ──► Frontend render intro + aid + step 1
   ├─ Trẻ bấm "Bước tiếp"      → client-side, tức thì
   ├─ Trẻ bấm "Cho gợi ý"      → client-side, thang 3 mức (tip AI sinh sẵn)
   ├─ Trẻ bấm "Xem đáp án"     → client-side (answer.explanation)
   ├─ Trẻ gõ đáp án, có check  → client so sánh số/chữ → cheer / thử lại
   ├─ Trẻ gõ đáp án tự do      → POST /api/judge → verdict + khích lệ
   └─ Trẻ hỏi câu mới          → plan mới
```

Backend **stateless**: lịch sử do frontend giữ và gửi kèm (trim 10 lượt cuối).
Không lưu trữ dữ liệu trẻ em (không account, không PII).

### 2.3. Biến môi trường

- `LLM_BASE_URL` — gốc endpoint chuẩn OpenAI (vd: `https://api.openai.com/v1`)
- `LLM_API_KEY`
- `LLM_MODEL` — ví dụ `gpt-4o-mini`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — rate limit (tùy chọn;
  thiếu thì bỏ qua rate limit + log warning, dev local vẫn chạy)

## 3. Backend chi tiết

### 3.1. POST /api/chat

Request:
```json
{ "message": "...", "history": [ /* tối đa 10 lượt */ ],
  "lang": "vi" | "en", "subject": "math|reading|english|science|curio|null" }
```

Response — 2 dạng:

**Plan** (câu hỏi hợp lệ):
```json
{
  "type": "plan",
  "subject": "math",
  "intro": "Câu hỏi hay lắm! Cùng giải nhé...",
  "aid": { "type": "number-blocks", "numbers": [25, 17], "operation": "add" },
  "steps": [
    { "question": "...", "tip": "...", "check": null },
    { "question": "...", "tip": "...", "check": 35 }
  ],
  "answer": { "value": "42", "explanation": "...", "celebration": "..." }
}
```
- `steps`: 2–4 bước; `check` là số hoặc chuỗi (đáp án đúng của bước, để client
  tự kiểm tra) hoặc `null`
- `intro`/`steps`/`tips` **cấm chứa đáp án cuối**

**Refusal** (ngoài phạm vi/an toàn):
```json
{ "type": "refusal", "message": "Mình chỉ giúp bài học thôi nhé..." }
```
Một schema xử dụng cả hướng dẫn lẫn từ chối — moderation không tốn call riêng.

### 3.2. POST /api/judge

Request: `{ "question", "stepQuestion", "childAnswer", "lang" }`

Response:
```json
{ "verdict": "correct|close|incorrect",
  "feedback": "Gần đúng rồi! Xem lại phần hàng đơn vị nhé...",
  "praise": "Bạn nghĩ rất cẩn thận đấy!" }
```
`feedback` không bao giờ chứa đáp án. `correct` → frontend tự chuyển bước tiếp.

### 3.3. System prompt sư phạm (ràng buộc LLM)

1. Cấm nêu đáp án cuối trong intro/steps/tips — chỉ nằm trong `answer`
2. Mỗi step là câu hỏi ngược (Socratic), tối đa 4 bước, câu ngắn, từ vựng 6–12 tuổi
3. `tip` là gợi ý nhỏ, không làm hộ bài
4. Chỉ nhận chủ đề học tập phổ thông; từ chối thân thiện mọi chủ đề khác (refusal)
5. Chỉ xuất JSON đúng schema; `aid` chỉ chọn từ 4 loại cho phép
6. Tiếng Việt: giọng thân thiện cô giáo/anh chị, chính tả chuẩn

### 3.4. Thư viện component minh họa (aids.js)

| type | Params | Dùng cho | Nguồn |
|---|---|---|---|
| `number-blocks` | `numbers[2]`, `operation: add\|sub` | Cộng/trừ — que chục + khối đơn vị, animate | mock |
| `group-dots` | `groups`, `perGroup` | Nhân/chia — nhóm chấm tròn đếm được | mở rộng |
| `letter-tiles` | `word` | Chính tả/học vần — ô chữ, nguyên âm tô vàng | mock, dùng cho vi/en |
| `step-flow` | `steps: [{icon, label}]` | Khoa học tuần tự — icon từ enum ~10 SVG có sẵn | thay SVG hardcode |

Params không hợp lệ hoặc type lạ → bỏ aid, chat vẫn hoạt động.

### 3.5. LLM client (llm.js)

- POST `{LLM_BASE_URL}/chat/completions`; `Authorization: Bearer {LLM_API_KEY}`
- Ưu tiên `response_format: json_schema`; gateway không hỗ trợ → fallback nhắc JSON
  trong prompt + parse an toàn (trích khối JSON đầu) + retry 1 lần
- Timeout 20s (AbortController); `maxDuration` 30s trong vercel.json
- Sanitize: `message` ≤ 500 ký tự, `history` ≤ 10 mục, strip HTML

## 4. Frontend chi tiết

- Giữ nguyên thiết kế mock: topbar, subject rail (Toán/Đọc/Tiếng Anh/Khoa học/Tò mò),
  stream bubble chat, composer + suggest chips; animation rise/pop/thinking dots;
  tôn trọng `prefers-reduced-motion`
- Nút VN/EN trên topbar (pill, localStorage, đổi toàn bộ UI text/placeholder/suggest)
- State phiên in-memory; "Bắt đầu lại" xóa sạch
- Nhận diện subject: dùng `subject` AI trả về để highlight rail (khi trẻ không chọn)
- Kiểm tra đáp án client-side: `check` số → so số trong câu trả lời; `check` chữ →
  so sau khi bỏ dấu cách/dấu gạch nối; sai → cheer "thử lại" + tự mở gợi ý;
  đúng → cheer + tự sang bước tiếp
- Fallback hỏng AI (backend lỗi 2 lần): plan "thám tử" canned theo lang — trẻ
  không bao giờ bị treo

## 5. Production

| Hạng mục | Giải pháp |
|---|---|
| Rate limit | `@upstash/ratelimit` fixed-window per IP: 20 req / 5 phút / endpoint; thiếu env → bỏ qua + warning; quá hạn → 429 + thông điệp thân thiện |
| Moderation | 3 lớp: validate input; refusal trong cùng call AI (không cần /moderations trên gateway); CSP chặn script ngoài |
| Security headers | vercel.json: CSP (self + Google Fonts), `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: DENY` |
| Privacy trẻ em | Không account, không cookie tracking, không lưu hội thoại server-side; API key chỉ ở env server |
| Logging | JSON line `{ts, reqId, endpoint, lang, outcome, subject, latencyMs, usage, ratelimited}` — không log nội dung |
| Chi phí | ~1–2 call/câu hỏi, max_tokens giới hạn, history trim 10 lượt |

## 6. Error handling

| Tình huống | Xử lý |
|---|---|
| LLM timeout / 502 | Thông điệp thân thiện + nút "Thử lại" |
| JSON hỏng sau retry 1 lần | Fallback plan canned (client) |
| `/api/judge` lỗi/timeout | Không chặn trẻ: client hiện cheer "Tiếp tục thử nhé!" và coi như `incorrect` không có feedback |
| 429 rate limit | "Sparkle cần nghỉ một chút nhé!" |
| Refusal | Hiện message thân thiện, gợi ý quay lại chủ đề học |
| Mất mạng frontend | Bong bóng lỗi + giữ câu hỏi trong ô nhập |

## 7. Testing

- **Unit (vitest)**: schemas (plan/judge hợp lệ & hỏng, sanitize), prompts (build
  theo lang), llm (mock fetch: success/timeout/JSON hỏng/retry), ratelimit,
  aids (render 4 loại + params xấu), i18n (parity key vi/en)
- **Integration**: handler chat/judge với fetch mock toàn phần
- **Smoke manual**: checklist song ngữ, 4 aid, refusal, rate limit, offline (docs/)
- Live smoke script (endpoint thật) chạy tay, không chạy trong CI

## 8. Phạm vi không làm (v1)

- Account / lưu lịch sử hội thoại lâu dài
- Sinh ảnh bằng model ảnh hoặc AI vẽ SVG tự do
- Streaming (SSE) — nâng cấp sau nếu cần
- Dedicated moderation API (nếu gateway có /moderations, cân nhắc bật ở v2)
- Text-to-speech cho trẻ chưa biết đọc
