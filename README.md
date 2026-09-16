# KidGPT — Sparkle Tutor

A bilingual (Vietnamese/English) AI study buddy for kids aged 6–12. Sparkle never hands
over the answer — it guides children to find it themselves, one small question at a time,
with animated visual aids: number blocks, dot groups, letter tiles and step-flow diagrams.

## Why use it with children?

- **Guides, never tells** — Socratic step-by-step plans keep the child thinking; the final
  answer stays hidden behind an explicit "I tried — reveal the answer" button
- **Built for young readers** — short sentences, a warm tutor voice, cheerful visuals for
  math, spelling and science, and legacy-browser fallbacks so old family tablets still work
- **Safe by design** — school topics only with kind refusals for anything else, hardened
  prompts that ignore "just tell me the answer" tricks, strictly validated AI output,
  and zero stored personal data (no accounts, no server-side chat history)
- **Bring your own AI** — works with any OpenAI-compatible endpoint (OpenAI, z.ai GLM,
  Ollama…) configured purely through environment variables

## Run locally

```bash
npm install
cp .env.example .env.local   # fill LLM_BASE_URL / LLM_API_KEY / LLM_MODEL
npx vercel dev               # open http://localhost:3000
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `LLM_BASE_URL` | ✓ | OpenAI-compatible endpoint, e.g. `https://api.openai.com/v1` |
| `LLM_API_KEY` | ✓ | Gateway API key |
| `LLM_MODEL` | ✓ | Model name, e.g. `gpt-4o-mini` |
| `LLM_EXTRA_BODY` | – | JSON merged into the request body, e.g. `{"thinking":{"type":"disabled"}}` on z.ai for 2–3× faster replies |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | – | Enables 20 req/5 min/IP/endpoint rate limiting (skipped when unset) |

## Tests

```bash
npm test
```

## Deploy (Vercel)

Import the repo (preset "Other") — `public/` is served statically and `api/` becomes
Serverless Functions. Set the environment variables in Project Settings. Security headers
live in `vercel.json`. Design spec, implementation plan and the manual QA checklist are
under `docs/`.
