# KidGPT — Sparkle Tutor

Trợ lý AI học tập song ngữ (VI/EN) cho trẻ 6–12 tuổi: không trả lời thay trẻ, mà hướng dẫn
tìm đáp án từng bước (Socratic) kèm minh họa trực quan — khối số, nhóm chấm, ô chữ, sơ đồ bước.

- Spec: `docs/superpowers/specs/2026-09-14-kidgpt-design.md`
- Plan: `docs/superpowers/plans/2026-09-14-kidgpt.md`
- Smoke checklist: `docs/smoke-checklist.md`

## Chạy local

```bash
npm install
cp .env.example .env.local   # điền LLM_BASE_URL / LLM_API_KEY / LLM_MODEL
npx vercel dev               # mở http://localhost:3000
```

## Biến môi trường

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `LLM_BASE_URL` | ✓ | Endpoint chuẩn OpenAI-compatible (vd `https://api.openai.com/v1`) |
| `LLM_API_KEY` | ✓ | API key của gateway |
| `LLM_MODEL` | ✓ | Tên model (vd `gpt-4o-mini`) |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | – | Bật rate limit 20 req/5 phút/IP/endpoint (không set = bỏ qua) |

## Test

```bash
npm test
```

## Deploy (Vercel)

Import repo (preset "Other") — `public/` là static, `api/` là Serverless Functions. Set các
biến môi trường trên trong Project Settings. Headers bảo mật nằm trong `vercel.json`.
