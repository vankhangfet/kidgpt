# KidGPT — Đăng nhập + Đa hồ sơ trẻ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bắt buộc login Google (phụ huynh mở khóa, Firebase Auth) + đa hồ sơ trẻ theo khổ tuổi làm AI thích ứng độ khó — theo spec `docs/superpowers/specs/2026-09-17-kidgpt-auth-design.md`.

**Architecture:** Firebase Auth phía client (SDK ESM từ CDN, session tự refresh) + Firestore lưu hồ sơ (CRUD client-side, security rules chỉ chủ sở hữu). Backend KHÔNG dùng firebase-admin: verify ID token bằng `jose` + JWKS công khai của Google, env mới duy nhất `FIREBASE_PROJECT_ID`. Gate 3 màn hình (login → quản lý hồ sơ → chọn hồ sơ) trong module `gate.js` overlay; `app.js` wiring Bearer header + 401 → gate.

**Tech Stack:** jose (server mới), Firebase JS SDK v11 (CDN, client), vitest, kiến trúc hiện tại giữ nguyên (static + Vercel serverless, không build step).

**Lưu ý:** Ref spec §3: `buildSystemPrompt(lang, ageBand)` mặc định '9-12'; body request thêm `ageBand` + `profileName`; rate limit key `scope:${uid}`. KHÔNG đổi hành vi khi thiếu gate ở static preview (Task 12 smoke).

---

## File Map

| File | Việc | Trách nhiệm |
|---|---|---|
| `package.json` | Modify | Thêm dep `jose` |
| `.env.example` | Modify | Thêm `FIREBASE_PROJECT_ID` |
| `api/lib/auth.js` | Create | requireAuth: extract Bearer + verify jose |
| `test/auth.test.js` | Create | Test auth middleware |
| `api/lib/prompts.js` | Modify | buildSystemPrompt(lang, ageBand) + suffix hồ sơ trong buildChatMessages |
| `test/prompts.test.js` | Modify | Test ageBand + suffix |
| `api/lib/schemas.js` | Modify | AGE_BANDS + sanitizeProfileName + normalizeAgeBand |
| `test/schemas.test.js` | Modify | Test 3 helper mới |
| `api/chat.js` | Modify | requireAuth gate + uid rate limit + ageBand/profileName |
| `test/chat.test.js` | Modify | Test 401/500 + uid scope + body params |
| `api/judge.js` | Modify | requireAuth gate + uid rate limit |
| `test/judge.test.js` | Modify | Test 401 + uid scope |
| `vercel.json` | Modify | CSP cho Firebase |
| `public/firebase-config.js` | Create | Firebase web config placeholder (public-by-design) |
| `public/i18n.js` | Modify | ~20 key gate/hồ sơ vi/en |
| `test/i18n.test.js` | — | parity test tự phủ (không cần sửa) |
| `public/auth.js` | Create | Wrapper Firebase: sign-in/out, token, profile CRUD |
| `public/gate.js` | Create | 3 màn hình gate + state machine |
| `public/styles.css` | Modify | Gate overlay, profile cards, header chip |
| `public/index.html` | Modify | #gate container, #profileChip, script gate |
| `public/app.js` | Modify | Wiring: Bearer, 401→gate, chip, unlock/reset |
| `README.md` | Modify | Setup Firebase + env |
| `docs/smoke-checklist.md` | Modify | Mục auth thủ công |

---

### Task 1: Scaffold nhánh + dependency

**Files:**
- Modify: `package.json`, `.env.example`

- [ ] **Step 1: Tạo nhánh từ main**

```bash
cd "C:\Working\FY26\DE\kidgpt"
git checkout main && git pull
git checkout -b feature/kidgpt-auth
```

- [ ] **Step 2: Cài jose**

Run: `npm install jose`
Expected: package.json có `"jose": "^5.x"` trong dependencies, lockfile cập nhật.

- [ ] **Step 3: Thêm env vào `.env.example`** — sau dòng `LLM_MODEL=...`, thêm dòng trống + block:

```
# Firebase (bắt buộc khi bật login) — project id của Firebase Console
FIREBASE_PROJECT_ID=
```

- [ ] **Step 4: Chạy suite確認 không vỡ**

Run: `npx vitest run`
Expected: 111/111 PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: scaffold auth branch with jose dependency"
```

(kèm footer attribution Claude Code như các commit trước.)

---

### Task 2: `api/lib/auth.js` — verify ID token

**Files:**
- Create: `api/lib/auth.js`
- Test: `test/auth.test.js`

- [ ] **Step 1: Viết test fail `test/auth.test.js`**

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAuth, extractBearer, AuthError } from '../api/lib/auth.js';

function req(headers) { return { headers }; }

beforeEach(() => {
  process.env.FIREBASE_PROJECT_ID = 'kidgpt-demo';
});

describe('extractBearer', () => {
  it('extracts token from Authorization header', () => {
    expect(extractBearer(req({ authorization: 'Bearer abc.def' }))).toBe('abc.def');
  });
  it('returns null when missing or malformed', () => {
    expect(extractBearer(req({}))).toBeNull();
    expect(extractBearer(req({ authorization: 'Basic abc' }))).toBeNull();
    expect(extractBearer(req({ authorization: 'Bearer ' }))).toBeNull();
  });
});

describe('requireAuth', () => {
  it('returns uid for a valid token', async () => {
    const fakeVerify = vi.fn(async () => ({ uid: 'u123' }));
    const auth = await requireAuth(req({ authorization: 'Bearer tok' }), fakeVerify);
    expect(auth.uid).toBe('u123');
  });
  it('throws unauthorized when header missing', async () => {
    await expect(requireAuth(req({}), vi.fn())).rejects.toMatchObject({ code: 'unauthorized' });
  });
  it('throws unauthorized when verify rejects', async () => {
    const fakeVerify = vi.fn(async () => { throw new Error('jwt expired'); });
    await expect(requireAuth(req({ authorization: 'Bearer tok' }), fakeVerify))
      .rejects.toMatchObject({ code: 'unauthorized' });
  });
  it('throws not_configured when FIREBASE_PROJECT_ID missing', async () => {
    delete process.env.FIREBASE_PROJECT_ID;
    await expect(requireAuth(req({ authorization: 'Bearer tok' }), vi.fn()))
      .rejects.toMatchObject({ code: 'not_configured' });
  });
  it('AuthError carries code', () => {
    const e = new AuthError('unauthorized');
    expect(e).toBeInstanceOf(Error);
    expect(e.code).toBe('unauthorized');
  });
});
```

- [ ] **Step 2: Chạy test fail**

Run: `npx vitest run test/auth.test.js`
Expected: FAIL — cannot resolve module.

- [ ] **Step 3: Viết `api/lib/auth.js`**

```js
import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

export class AuthError extends Error {
  constructor(code) {
    super(code);
    this.name = 'AuthError';
    this.code = code;
  }
}

let jwks = null;
function getJwks() {
  if (!jwks) jwks = createRemoteJWKSet(new URL(JWKS_URL));
  return jwks;
}

export function extractBearer(req) {
  const h = req.headers && req.headers.authorization;
  if (typeof h === 'string' && h.startsWith('Bearer ')) {
    const token = h.slice(7).trim();
    return token || null;
  }
  return null;
}

async function defaultVerify(token, projectId) {
  const { payload } = await jwtVerify(token, getJwks(), {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });
  if (!payload || !payload.sub) throw new AuthError('unauthorized');
  return { uid: payload.sub };
}

/**
 * Verify a Firebase ID token. `verifyImpl` is injectable for tests.
 * Returns {uid} or throws AuthError('unauthorized'|'not_configured').
 */
export async function requireAuth(req, verifyImpl = defaultVerify) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new AuthError('not_configured');
  const token = extractBearer(req);
  if (!token) throw new AuthError('unauthorized');
  try {
    return await verifyImpl(token, projectId);
  } catch (err) {
    if (err instanceof AuthError) throw err;
    throw new AuthError('unauthorized');
  }
}
```

- [ ] **Step 4: Chạy test pass**

Run: `npx vitest run test/auth.test.js` → 6 tests PASS. Full suite `npx vitest run` → 117 PASS.

- [ ] **Step 5: Commit**

```bash
git add api/lib/auth.js test/auth.test.js
git commit -m "feat: add firebase id token verification middleware"
```

---

### Task 3: `api/lib/prompts.js` — ageBand + suffix hồ sơ

**Files:**
- Modify: `api/lib/prompts.js`
- Test: `test/prompts.test.js`

- [ ] **Step 1: Thêm test fail vào cuối `test/prompts.test.js`**

```js
import { buildSystemPrompt as bsp } from '../api/lib/prompts.js'; // đã import sẵn trong file — dùng lại tên có sẵn nếu file đã import

// (nếu file đã import buildSystemPrompt thì KHÔNG import lại; viết thường như dưới)
```

Thực tế file test đã import sẵn `buildSystemPrompt, buildChatMessages` — THÊM các test sau vào cuối file (dùng tên đã import):

```js
describe('age band adaptation', () => {
  it('appends young-band rules for 6-8 in both langs', () => {
    const vi = buildSystemPrompt('vi', '6-8');
    const en = buildSystemPrompt('en', '6-8');
    expect(vi).toContain('6–8 tuổi');
    expect(vi).toContain('Socratic');
    expect(en).toContain('ages 6–8');
    expect(en).toContain('Socratic');
  });
  it('keeps base prompt for 9-12 or missing band', () => {
    expect(buildSystemPrompt('vi', '9-12')).toBe(buildSystemPrompt('vi'));
    expect(buildSystemPrompt('vi')).toBe(buildSystemPrompt('vi'));
  });
});

describe('profile suffix in chat messages', () => {
  it('appends child name and age band as a separate note', () => {
    const msgs = buildChatMessages({
      message: 'q', history: [], subject: 'math', lang: 'vi',
      profileName: 'Bé Bi', ageBand: '6-8',
    });
    const content = msgs.at(-1).content;
    expect(content).toContain('(Chủ đề: math)');
    expect(content).toContain('(Trẻ: Bé Bi, khổ tuổi: 6-8)');
  });
  it('english suffix and no suffix when absent', () => {
    const msgs = buildChatMessages({ message: 'q', history: [], subject: null, lang: 'en', profileName: 'Minh', ageBand: '9-12' });
    expect(msgs.at(-1).content).toContain('(Child: Minh, age band: 9-12)');
    const none = buildChatMessages({ message: 'q', history: [], lang: 'vi' });
    expect(none.at(-1).content).toBe('q');
  });
});
```

- [ ] **Step 2: Chạy test fail**

Run: `npx vitest run test/prompts.test.js`
Expected: FAIL — buildSystemPrompt ignores second arg; no profile suffix.

- [ ] **Step 3: Sửa `api/lib/prompts.js`**

3a. Thêm 2 hằng số vào cuối phần hằng số (sau SYSTEM_EN):

```js
const BAND_YOUNG_VI = `ĐỐI TƯỢNG HIỆN TẠI: trẻ 6–8 tuổi.
- Dùng câu CỰC ngắn (tối đa ~10 từ/câu), từ vựng rất đơn giản như nói với bé lớp 1.
- Ưu tiên 2–3 steps, mỗi bước chỉ hỏi MỘT điều nhỏ.
- Luôn kèm aid trực quan (number-blocks, group-dots) khi có thể.
- Khen cụ thể hành động ("con tách số giỏi quá") thay vì khen chung chung.`;

const BAND_YOUNG_EN = `CURRENT LEARNER: a child ages 6–8.
- Use VERY short sentences (max ~10 words each), simple first-grade vocabulary.
- Prefer 2–3 steps, each step asking only ONE small thing.
- Always include a visual aid (number-blocks, group-dots) when possible.
- Praise specific actions ("great job splitting the number") over generic praise.`;
```

3b. Thay hàm `buildSystemPrompt` bằng:

```js
export function buildSystemPrompt(lang, ageBand) {
  const base = lang === 'en' ? SYSTEM_EN : SYSTEM_VI;
  if (ageBand === '6-8') {
    return base + '\n\n' + (lang === 'en' ? BAND_YOUNG_EN : BAND_YOUNG_VI);
  }
  return base;
}
```

3c. Thay hàm `buildChatMessages` bằng:

```js
export function buildChatMessages({ message, history, subject, lang, profileName, ageBand }) {
  const msgs = [{ role: 'system', content: buildSystemPrompt(lang, ageBand) }];
  for (const m of history || []) {
    if ((m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string') {
      msgs.push({ role: m.role, content: m.content });
    }
  }
  let user = message;
  if (subject) {
    user += lang === 'en' ? `\n(Subject: ${subject})` : `\n(Chủ đề: ${subject})`;
  }
  if (profileName && ageBand) {
    user += lang === 'en' ? `\n(Child: ${profileName}, age band: ${ageBand})` : `\n(Trẻ: ${profileName}, khổ tuổi: ${ageBand})`;
  }
  msgs.push({ role: 'user', content: user });
  return msgs;
}
```

- [ ] **Step 4: Chạy test pass**

Run: `npx vitest run test/prompts.test.js` → 17 tests PASS (12 cũ + 5 mới). Full suite → 122 PASS.

- [ ] **Step 5: Commit**

```bash
git add api/lib/prompts.js test/prompts.test.js
git commit -m "feat: adapt system prompt to age band and child profile"
```

---

### Task 4: `api/lib/schemas.js` — AGE_BANDS + helpers

**Files:**
- Modify: `api/lib/schemas.js`
- Test: `test/schemas.test.js`

- [ ] **Step 1: Thêm test fail vào cuối `test/schemas.test.js`**

```js
import { AGE_BANDS, sanitizeProfileName, normalizeAgeBand } from '../api/lib/schemas.js';
```

(đưa 3 tên này vào DÒNG import đầu file thay vì import riêng) rồi THÊM:

```js
describe('profile helpers', () => {
  it('AGE_BANDS has two bands', () => {
    expect(AGE_BANDS).toEqual(['6-8', '9-12']);
  });
  it('sanitizeProfileName strips html and caps at 20', () => {
    expect(sanitizeProfileName('  <b>Bé</b> Bi ')).toBe('Bé Bi');
    expect(sanitizeProfileName('x'.repeat(40)).length).toBe(20);
    expect(sanitizeProfileName(null)).toBe('');
  });
  it('normalizeAgeBand accepts known bands only', () => {
    expect(normalizeAgeBand('6-8')).toBe('6-8');
    expect(normalizeAgeBand('9-12')).toBe('9-12');
    expect(normalizeAgeBand('3-5')).toBeNull();
    expect(normalizeAgeBand(undefined)).toBeNull();
  });
});
```

- [ ] **Step 2: Chạy test fail**

Run: `npx vitest run test/schemas.test.js` → FAIL (export chưa có).

- [ ] **Step 3: Thêm vào cuối `api/lib/schemas.js`**

```js
export const AGE_BANDS = ['6-8', '9-12'];

export function sanitizeProfileName(name) {
  return sanitizeText(name, 20);
}

export function normalizeAgeBand(band) {
  return AGE_BANDS.includes(band) ? band : null;
}
```

- [ ] **Step 4: Chạy test pass**

Run: `npx vitest run test/schemas.test.js` → 19 PASS. Full suite → 125 PASS.

- [ ] **Step 5: Commit**

```bash
git add api/lib/schemas.js test/schemas.test.js
git commit -m "feat: add age band and profile name helpers"
```

---

### Task 5: `api/chat.js` — auth gate + uid rate limit + hồ sơ

**Files:**
- Modify: `api/chat.js`
- Test: `test/chat.test.js`

- [ ] **Step 1: Thêm test fail vào `test/chat.test.js`**

Thêm vào cuối describe chính (trước describe 429 hiện có) — test 401 và pass-through hồ sơ:

```js
  it('returns 401 when auth token missing', async () => {
    const res = mockRes();
    await handler({ method: 'POST', body: { message: 'q' }, headers: {} }, res);
    expect(res.code).toBe(401);
    expect(res.body.error).toBe('unauthorized');
  });

  it('authenticates, rate limits by uid and passes profile to the prompt', async () => {
    vi.resetModules();
    let authArgs = null; let limitArgs = null; let seenBody = null;
    vi.doMock('../api/lib/auth.js', () => ({
      requireAuth: async (req) => { authArgs = req; return { uid: 'u1' }; },
    }));
    vi.doMock('../api/lib/ratelimit.js', () => ({
      createLimiter: () => ({}),
      checkRateLimit: async (...a) => { limitArgs = a; return { success: true, skipped: true }; },
      clientIp: () => '1.2.3.4',
    }));
    process.env.FIREBASE_PROJECT_ID = 'kidgpt-demo';
    const spy = okFetch(JSON.stringify(validPlan));
    vi.stubGlobal('fetch', spy);
    const h = (await import('../api/chat.js')).default;
    vi.doUnmock('../api/lib/ratelimit.js');
    vi.doUnmock('../api/lib/auth.js');
    delete process.env.FIREBASE_PROJECT_ID;
    const res = mockRes();
    await h({
      method: 'POST',
      body: { message: '25 + 17?', lang: 'vi', profileName: '<b>Bé</b> Bi', ageBand: '6-8' },
      headers: { authorization: 'Bearer tok' },
    }, res);
    expect(res.code).toBe(200);
    expect(limitArgs[1]).toBe('u1');
    expect(limitArgs[2]).toBe('chat');
    seenBody = JSON.parse(spy.mock.calls[0][1].body);
    const sysMsg = seenBody.messages[0].content;
    expect(sysMsg).toContain('6–8 tuổi');
    expect(seenBody.messages.at(-1).content).toContain('(Trẻ: Bé Bi, khổ tuổi: 6-8)');
  });
```

CẬP NHẬT beforeEach: thêm `delete process.env.FIREBASE_PROJECT_ID;` để các test cũ (không mock auth) vẫn nhất quán — sau này handler thật sẽ 401 với test cũ! → CẦN mock auth cho TOÀN BỘ test cũ: thay beforeEach bằng:

```js
beforeEach(async () => {
  vi.resetModules();
  process.env.LLM_BASE_URL = 'http://llm.test/v1';
  process.env.LLM_API_KEY = 'k';
  process.env.LLM_MODEL = 'm1';
  delete process.env.UPSTASH_REDIS_REST_URL;
  vi.doMock('../api/lib/auth.js', () => ({
    requireAuth: async () => ({ uid: 'u-test' }),
  }));
  handler = (await import('../api/chat.js')).default;
});
```

(và test 401 ở trên phải dùng cách mock riêng với `vi.doMock` throw — viết test 401 như sau thay vì dựa beforeEach:)

```js
  it('returns 401 when auth token missing', async () => {
    vi.resetModules();
    vi.doMock('../api/lib/auth.js', () => ({
      requireAuth: async () => { const e = new Error('x'); e.code = 'unauthorized'; throw e; },
    }));
    const h = (await import('../api/chat.js')).default;
    const res = mockRes();
    await h({ method: 'POST', body: { message: 'q' }, headers: {} }, res);
    expect(res.code).toBe(401);
    expect(res.body.error).toBe('unauthorized');
  });
```

Test 429 hiện có vẫn hoạt động (doMock ratelimit riêng, auth mock của beforeEach… chú ý: test 429 dùng `vi.resetModules()` riêng — cần mock auth trong nó nữa: thêm vào đầu test 429 các dòng `vi.doMock('../api/lib/auth.js', ...)` y hệt beforeEach vì resetModules xóa registry).

- [ ] **Step 2: Chạy test fail**

Run: `npx vitest run test/chat.test.js` → các test cũ FAIL (401 vì handler chưa có auth... thật ra handler cũ không gọi auth nên 200 — nhưng test mới fail vì thiếu 401/uid). Ghi nhận thực tế.

- [ ] **Step 3: Sửa `api/chat.js`**

3a. Thêm import:

```js
import { requireAuth } from './lib/auth.js';
import { sanitizeProfileName, normalizeAgeBand } from './lib/schemas.js';
```

3b. Sau block 405, THÊM auth gate (TRƯỚC rate limit):

```js
  let auth;
  try {
    auth = await requireAuth(req);
  } catch (err) {
    if (err && err.code === 'not_configured') {
      return res.status(500).json({ error: 'not_configured' });
    }
    return res.status(401).json({ error: 'unauthorized' });
  }
```

3c. Đổi dòng rate limit: `checkRateLimit(limiter, clientIp(req), 'chat')` → `checkRateLimit(limiter, auth.uid, 'chat')`.

3d. Sau dòng `const subject = ...`, thêm:

```js
  const profileName = sanitizeProfileName(body.profileName) || null;
  const ageBand = normalizeAgeBand(body.ageBand);
```

3e. Đổi call buildChatMessages: thêm 2 field:

```js
      messages: buildChatMessages({ message, history, subject, lang, profileName, ageBand }),
```

3f. Log 'chat' thêm `ageBand: ageBand || null,` (không log profileName).

- [ ] **Step 4: Chạy test pass**

Run: `npx vitest run test/chat.test.js` → 12 PASS. Full suite → 127 PASS.

- [ ] **Step 5: Commit**

```bash
git add api/chat.js test/chat.test.js
git commit -m "feat: require auth and pass child profile through chat endpoint"
```

---

### Task 6: `api/judge.js` — auth gate + uid rate limit

**Files:**
- Modify: `api/judge.js`
- Test: `test/judge.test.js`

- [ ] **Step 1: Thêm test + cập nhật beforeEach tương tự Task 5**

beforeEach của `test/judge.test.js` thêm:

```js
  vi.doMock('../api/lib/auth.js', () => ({
    requireAuth: async () => ({ uid: 'u-test' }),
  }));
```

(vì beforeEach đã có `vi.resetModules()` trước import dynamic.) Thêm 2 test:

```js
  it('returns 401 when auth rejects', async () => {
    vi.resetModules();
    vi.doMock('../api/lib/auth.js', () => ({
      requireAuth: async () => { const e = new Error('x'); e.code = 'unauthorized'; throw e; },
    }));
    const h = (await import('../api/judge.js')).default;
    const res = mockRes();
    await h({ method: 'POST', body: { question: 'Q', stepQuestion: 'S', childAnswer: 'A' }, headers: {} }, res);
    expect(res.code).toBe(401);
    expect(res.body.error).toBe('unauthorized');
  });

  it('rate limits by uid', async () => {
    vi.resetModules();
    let limitArgs = null;
    vi.doMock('../api/lib/auth.js', () => ({ requireAuth: async () => ({ uid: 'u9' }) }));
    vi.doMock('../api/lib/ratelimit.js', () => ({
      createLimiter: () => ({}),
      checkRateLimit: async (...a) => { limitArgs = a; return { success: true, skipped: true }; },
      clientIp: () => '1.2.3.4',
    }));
    const h = (await import('../api/judge.js')).default;
    vi.doUnmock('../api/lib/ratelimit.js');
    vi.doUnmock('../api/lib/auth.js');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ choices: [{ message: { content: JSON.stringify(okJudge) } }] }),
    }));
    await h({ method: 'POST', body: { question: 'Q', stepQuestion: 'S', childAnswer: 'A' }, headers: { authorization: 'Bearer t' } }, mockRes());
    expect(limitArgs[1]).toBe('u9');
    expect(limitArgs[2]).toBe('judge');
  });
```

(Test 429 scope cũ của judge đã mock ratelimit riêng — thêm `vi.doMock('../api/lib/auth.js', ...)` đầu test đó như trên nếu nó fail vì auth.)

- [ ] **Step 2: Chạy test fail** — Run: `npx vitest run test/judge.test.js`, ghi nhận.

- [ ] **Step 3: Sửa `api/judge.js`** — mirror Task 5: import requireAuth; auth gate sau 405 (500 not_configured / 401 unauthorized); `checkRateLimit(limiter, auth.uid, 'judge')`; clientIp import có thể bỏ nếu không dùng nữa (kiểm tra — bỏ khỏi import để tránh lint thừa; giữ cũng vô hại nhưng plan bỏ: import còn lại `createLimiter, checkRateLimit`).

- [ ] **Step 4: Chạy test pass** — `npx vitest run test/judge.test.js` → 11 PASS. Full → 129 PASS.

- [ ] **Step 5: Commit**

```bash
git add api/judge.js test/judge.test.js
git commit -m "feat: require auth and rate limit by uid on judge endpoint"
```

---

### Task 7: CSP + firebase-config + env docs

**Files:**
- Modify: `vercel.json`
- Create: `public/firebase-config.js`

- [ ] **Step 1: Sửa CSP trong `vercel.json`**

Thay giá trị Content-Security-Policy bằng:

```
default-src 'self'; script-src 'self' https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com; frame-src 'self' https://accounts.google.com; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
```

- [ ] **Step 2: Kiểm tra JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8')); console.log('ok')"` → `ok`.

- [ ] **Step 3: Tạo `public/firebase-config.js`**

```js
// Firebase web config — GIÁ TRỊ PUBLIC BY DESIGN (không phải secret).
// Lấy từ: Firebase Console → Project settings → Your apps → Web app → SDK setup.
// Điền xong 4 giá trị dưới rồi deploy. Server-side cần thêm env FIREBASE_PROJECT_ID.
export const FIREBASE_CONFIG = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  appId: 'YOUR_APP_ID',
};
```

- [ ] **Step 4: Commit**

```bash
git add vercel.json public/firebase-config.js
git commit -m "chore: open csp for firebase and add web config placeholder"
```

---

### Task 8: i18n — chuỗi gate/hồ sơ

**Files:**
- Modify: `public/i18n.js`

- [ ] **Step 1: Thêm 20 key vào STRINGS.vi (sau `sendAria:`)**

```js
    signInTitle: 'Chào bố mẹ! 👋',
    signInBody: 'Đăng nhập một lần bằng Google để mở khóa Sparkle cho bé. Phiên sẽ được ghi nhớ trên thiết bị này.',
    signInPrivacy: 'Thông tin chỉ dùng lưu hồ sơ học của bé trong gia đình bạn — không chia sẻ, không quảng cáo.',
    signInButton: 'Đăng nhập bằng Google',
    signOut: 'Đăng xuất',
    gateConfigError: 'Chưa cấu hình Firebase — xem public/firebase-config.js và README.',
    chooseProfile: 'Ai học hôm nay?',
    chooseProfileLead: 'Chọn hồ sơ của bé để bắt đầu nhé!',
    manageProfiles: 'Quản lý hồ sơ',
    addProfile: 'Tạo hồ sơ mới',
    profileNameLabel: 'Tên bé (biệt danh)',
    profileNamePlaceholder: 'VD: Bé Bi',
    ageBandLabel: 'Khổ tuổi',
    ageBand6to8: '6–8 tuổi',
    ageBand9to12: '9–12 tuổi',
    saveProfile: 'Lưu hồ sơ',
    deleteProfile: 'Xóa',
    editProfile: 'Sửa',
    profilesMax: 'Tối đa 5 hồ sơ nhé!',
    switchProfile: 'Đổi hồ sơ',
```

Và 20 key tương ứng vào STRINGS.en (cùng vị trí, sau `sendAria:`):

```js
    signInTitle: "Hi parents! 👋",
    signInBody: 'Sign in once with Google to unlock Sparkle for your child. The device stays signed in.',
    signInPrivacy: 'Your info is only used to store your family profiles — never shared, no ads.',
    signInButton: 'Sign in with Google',
    signOut: 'Sign out',
    gateConfigError: 'Firebase is not configured — see public/firebase-config.js and README.',
    chooseProfile: "Who's learning today?",
    chooseProfileLead: 'Pick a profile to start!',
    manageProfiles: 'Manage profiles',
    addProfile: 'New profile',
    profileNameLabel: "Child's name (nickname)",
    profileNamePlaceholder: 'e.g. Mia',
    ageBandLabel: 'Age band',
    ageBand6to8: 'Ages 6–8',
    ageBand9to12: 'Ages 9–12',
    saveProfile: 'Save profile',
    deleteProfile: 'Delete',
    editProfile: 'Edit',
    profilesMax: 'Up to 5 profiles!',
    switchProfile: 'Switch profile',
```

- [ ] **Step 2: Chạy test**

Run: `npx vitest run test/i18n.test.js` → 9/9 PASS (parity tự phủ). Full suite → 129 PASS.

- [ ] **Step 3: Commit**

```bash
git add public/i18n.js
git commit -m "feat: add gate and profile ui strings vi/en"
```

---

### Task 9: `public/auth.js` — Firebase wrapper

**Files:**
- Create: `public/auth.js`

(Không unit test — module import SDK từ CDN, chỉ chạy browser. Verify bằng smoke ở Task 12.)

- [ ] **Step 1: Viết `public/auth.js`**

```js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import {
  GoogleAuthProvider, getAuth, signInWithPopup, signOut, onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import {
  getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, getDocs,
  query, orderBy, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { FIREBASE_CONFIG } from './firebase-config.js';

export const MAX_PROFILES = 5;

let app = null;
let authInst = null;
let db = null;

export function isFirebaseConfigured() {
  return !/^YOUR_/.test(String(FIREBASE_CONFIG.projectId || 'YOUR_'));
}

function init() {
  if (!app) {
    app = initializeApp(FIREBASE_CONFIG);
    authInst = getAuth(app);
    db = getFirestore(app);
  }
}

export async function signInWithGoogle() {
  init();
  const provider = new GoogleAuthProvider();
  await signInWithPopup(authInst, provider);
}

export async function signOutGoogle() {
  init();
  await signOut(authInst);
}

export function watchAuth(cb) {
  init();
  return onAuthStateChanged(authInst, cb);
}

export async function getAuthToken() {
  init();
  return authInst.currentUser ? authInst.currentUser.getIdToken() : null;
}

function profilesRef(uid) {
  return collection(db, 'users', uid, 'profiles');
}

export async function listProfiles(uid) {
  init();
  const snap = await getDocs(query(profilesRef(uid), orderBy('createdAt', 'asc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createProfile(uid, { name, ageBand }) {
  init();
  const existing = await listProfiles(uid);
  if (existing.length >= MAX_PROFILES) throw new Error('profiles_max');
  const ref = await addDoc(profilesRef(uid), {
    name: String(name).trim().slice(0, 20),
    ageBand,
    color: existing.length % 8,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, name: String(name).trim().slice(0, 20), ageBand, color: existing.length % 8 };
}

export async function updateProfile(uid, id, { name, ageBand }) {
  init();
  await updateDoc(doc(db, 'users', uid, 'profiles', id), {
    name: String(name).trim().slice(0, 20),
    ageBand,
  });
}

export async function deleteProfile(uid, id) {
  init();
  await deleteDoc(doc(db, 'users', uid, 'profiles', id));
}
```

- [ ] **Step 2: Commit**

```bash
git add public/auth.js
git commit -m "feat: add firebase auth and profile store wrapper"
```

---

### Task 10: `public/gate.js` + styles + index.html

**Files:**
- Create: `public/gate.js`
- Modify: `public/styles.css`, `public/index.html`

- [ ] **Step 1: Viết `public/gate.js`**

```js
import { esc } from './util.js';
import { t } from './i18n.js';
import {
  isFirebaseConfigured, signInWithGoogle, signOutGoogle, watchAuth,
  listProfiles, createProfile, updateProfile, deleteProfile, MAX_PROFILES,
} from './auth.js';

const PROFILE_COLORS = ['#f5876f', '#f2b04c', '#8bc34a', '#4dc3b5', '#5aa0e8', '#9a7fe8', '#e87fb4', '#7ad0c8'];

let gateEl = null;
let onUnlock = null;
let currentUser = null;
let editingId = null; // null = đang tạo mới; string = đang sửa profile đó

export function initGate(callbacks) {
  onUnlock = callbacks.onUnlock;
  gateEl = document.getElementById('gate');
  if (!isFirebaseConfigured()) {
    renderConfigError();
    return;
  }
  watchAuth(async (user) => {
    currentUser = user;
    if (!user) { renderLogin(); return; }
    await route();
  });
}

export function reopenGate() {
  if (currentUser) route();
}

function show(html) {
  gateEl.innerHTML = html;
  gateEl.hidden = false;
}
function hide() {
  gateEl.hidden = true;
  gateEl.innerHTML = '';
}

async function route() {
  const profiles = await listProfiles(currentUser.uid);
  if (!profiles.length) renderManager(profiles, true);
  else renderPicker(profiles);
}

function renderConfigError() {
  show('<div class="gate-card"><h2 class="gate-title">⚠️</h2><p class="gate-body">' +
    esc(t(document.documentElement.lang === 'en' ? 'en' : 'vi', 'gateConfigError')) + '</p></div>');
}

function renderLogin() {
  const lang = document.documentElement.lang === 'en' ? 'en' : 'vi';
  show(
    '<div class="gate-card">' +
      '<div class="gate-logo" aria-hidden="true">✨</div>' +
      '<h2 class="gate-title">' + esc(t(lang, 'signInTitle')) + '</h2>' +
      '<p class="gate-body">' + esc(t(lang, 'signInBody')) + '</p>' +
      '<button class="btn-google" id="gate-signin" type="button">' +
        '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="#4285F4" d="M23 12.2c0-.8-.1-1.6-.2-2.3H12v4.4h6.2c-.3 1.4-1.1 2.6-2.3 3.4v2.8h3.7c2.2-2 3.4-5 3.4-8.3z"/><path fill="#34A853" d="M12 24c3.1 0 5.8-1 7.7-2.8l-3.7-2.8c-1 .7-2.3 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9H1.6v2.9C3.6 21.3 7.5 24 12 24z"/><path fill="#FBBC05" d="M5.4 14.6c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V7.1H1.6C.6 8.9 0 10.9 0 12.3s.6 3.4 1.6 5.2l3.8-2.9z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.3-3.3C17.9 1.2 15.1 0 12 0 7.5 0 3.6 2.7 1.6 6.6l3.8 2.9c.9-2.8 3.5-4.7 6.6-4.7z"/></svg>' +
        '<span>' + esc(t(lang, 'signInButton')) + '</span>' +
      '</button>' +
      '<p class="gate-privacy">' + esc(t(lang, 'signInPrivacy')) + '</p>' +
    '</div>');
  document.getElementById('gate-signin').addEventListener('click', async () => {
    try { await signInWithGoogle(); } catch (e) { /* user đóng popup — giữ màn login */ }
  });
}

function profileCard(p, lang) {
  const color = PROFILE_COLORS[p.color % 8];
  const initials = esc(String(p.name || '?').trim().slice(0, 2).toUpperCase() || '?');
  return '<button class="profile-card" type="button" data-id="' + esc(p.id) + '" style="--pc:' + color + '">' +
    '<span class="profile-avatar" aria-hidden="true">' + initials + '</span>' +
    '<span class="profile-name">' + esc(p.name) + '</span>' +
    '<span class="profile-band">' + esc(t(lang, p.ageBand === '6-8' ? 'ageBand6to8' : 'ageBand9to12')) + '</span>' +
  '</button>';
}

function renderPicker(profiles) {
  const lang = document.documentElement.lang === 'en' ? 'en' : 'vi';
  show(
    '<div class="gate-card gate-wide">' +
      '<h2 class="gate-title">' + esc(t(lang, 'chooseProfile')) + '</h2>' +
      '<p class="gate-body">' + esc(t(lang, 'chooseProfileLead')) + '</p>' +
      '<div class="profile-grid">' + profiles.map((p) => profileCard(p, lang)).join('') + '</div>' +
      '<div class="gate-actions">' +
        '<button class="btn-ghost" id="gate-manage" type="button">' + esc(t(lang, 'manageProfiles')) + '</button>' +
        '<button class="btn-ghost" id="gate-logout" type="button">' + esc(t(lang, 'signOut')) + '</button>' +
      '</div>' +
    '</div>');
  gateEl.querySelectorAll('.profile-card').forEach((card) => {
    card.addEventListener('click', () => {
      const p = profiles.find((x) => x.id === card.dataset.id);
      localStorage.setItem('kidgpt-profile:' + currentUser.uid, p.id);
      hide();
      onUnlock(p);
    });
  });
  document.getElementById('gate-manage').addEventListener('click', async () => {
    renderManager(await listProfiles(currentUser.uid));
  });
  document.getElementById('gate-logout').addEventListener('click', async () => {
    await signOutGoogle();
  });
}

function bandButtons(lang, selected) {
  const mk = (band, key) =>
    '<button class="age-band-btn' + (selected === band ? ' selected' : '') + '" type="button" data-band="' + band + '">' +
    (band === '6-8' ? '🌱 ' : '🚀 ') + esc(t(lang, key)) + '</button>';
  return mk('6-8', 'ageBand6to8') + mk('9-12', 'ageBand9to12');
}

function renderManager(profiles, firstTime) {
  const lang = document.documentElement.lang === 'en' ? 'en' : 'vi';
  editingId = null;
  show(
    '<div class="gate-card gate-wide">' +
      '<h2 class="gate-title">' + esc(t(lang, firstTime ? 'addProfile' : 'manageProfiles')) + '</h2>' +
      (profiles.length
        ? '<div class="profile-list">' + profiles.map((p) =>
            '<div class="profile-row" style="--pc:' + PROFILE_COLORS[p.color % 8] + '">' +
              '<span class="profile-row-name">' + esc(p.name) + '</span>' +
              '<span class="profile-row-band">' + esc(t(lang, p.ageBand === '6-8' ? 'ageBand6to8' : 'ageBand9to12')) + '</span>' +
              '<button class="chip" data-edit="' + esc(p.id) + '" type="button">' + esc(t(lang, 'editProfile')) + '</button>' +
              '<button class="chip chip-danger" data-del="' + esc(p.id) + '" type="button">' + esc(t(lang, 'deleteProfile')) + '</button>' +
            '</div>').join('') + '</div>'
        : '') +
      (profiles.length >= MAX_PROFILES
        ? '<p class="gate-body">' + esc(t(lang, 'profilesMax')) + '</p>'
        : '<form id="gate-form" class="profile-form">' +
            '<label class="field"><span class="form-label">' + esc(t(lang, 'profileNameLabel')) + '</span>' +
            '<input id="gate-name" type="text" maxlength="20" placeholder="' + esc(t(lang, 'profileNamePlaceholder')) + '" /></label>' +
            '<div class="form-label">' + esc(t(lang, 'ageBandLabel')) + '</div>' +
            '<div class="age-band-row" id="gate-bands">' + bandButtons(lang, '6-8') + '</div>' +
            '<button class="send gate-save" type="submit">' + esc(t(lang, 'saveProfile')) + '</button>' +
          '</form>') +
      (profiles.length && !firstTime
        ? '<div class="gate-actions"><button class="btn-ghost" id="gate-back" type="button">' + esc(t(lang, 'switchProfile')) + '</button></div>'
        : '') +
    '</div>');

  let band = '6-8';
  const bandsEl = gateEl.querySelector('#gate-bands');
  if (bandsEl) {
    bandsEl.querySelectorAll('.age-band-btn').forEach((b) => {
      b.addEventListener('click', () => {
        band = b.dataset.band;
        bandsEl.querySelectorAll('.age-band-btn').forEach((x) => x.classList.toggle('selected', x === b));
      });
    });
  }
  const form = gateEl.querySelector('#gate-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = (gateEl.querySelector('#gate-name').value || '').trim();
      if (!name) return;
      if (editingId) {
        await updateProfile(currentUser.uid, editingId, { name, ageBand: band });
      } else {
        await createProfile(currentUser.uid, { name, ageBand: band });
      }
      renderManager(await listProfiles(currentUser.uid), false);
    });
  }
  gateEl.querySelectorAll('[data-del]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await deleteProfile(currentUser.uid, btn.dataset.del);
      localStorage.removeItem('kidgpt-profile:' + currentUser.uid);
      renderManager(await listProfiles(currentUser.uid), false);
    });
  });
  gateEl.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = profiles.find((x) => x.id === btn.dataset.edit);
      editingId = p.id;
      const formEl = gateEl.querySelector('#gate-form');
      if (!formEl) return;
      gateEl.querySelector('#gate-name').value = p.name;
      gateEl.querySelector('#gate-bands').querySelectorAll('.age-band-btn').forEach((x) => {
        x.classList.toggle('selected', x.dataset.band === p.ageBand);
      });
    });
  });
  const back = gateEl.querySelector('#gate-back');
  if (back) back.addEventListener('click', async () => renderPicker(await listProfiles(currentUser.uid)));
}
```

Lưu ý: nút "Sửa" chỉ fill form khi form hiển thị (đủ < MAX hồ sơ). Khi đủ 5 hồ sơ không có form — sửa không khả dụng, xóa bớt trước (ghi nhận hạn chế, chấp nhận v1).

- [ ] **Step 2: Append CSS vào cuối `public/styles.css`**

```css
/* ---------------------------------------------------------------- auth gate */
.gate {
  position: fixed; inset: 0; z-index: 50;
  display: grid; place-items: center; padding: 20px;
  background: radial-gradient(1100px 640px at 92% -12%, var(--tutor-soft), transparent 58%), var(--bg);
}
.gate[hidden] { display: none; }
.gate-card {
  width: min(420px, 94vw); background: var(--surface);
  border-radius: var(--radius-lg); box-shadow: var(--shadow-pop);
  padding: 30px 26px; text-align: center;
  display: flex; flex-direction: column; gap: 14px; align-items: center;
}
.gate-wide { width: min(560px, 94vw); }
.gate-logo { font-size: 44px; }
.gate-title { font-family: var(--font-display); font-size: 24px; }
.gate-body { color: var(--muted); }
.gate-privacy { font-size: 13px; color: var(--muted); }
.gate-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }

.btn-google {
  display: inline-flex; align-items: center; gap: 10px;
  background: var(--surface); color: var(--fg);
  border: 2px solid var(--border); border-radius: var(--radius-pill);
  padding: 12px 22px; min-height: 48px; cursor: pointer;
  font-family: var(--font-display); font-weight: 700; font-size: 16px;
  box-shadow: var(--shadow-sm);
  transition: transform .12s ease, border-color .12s;
}
.btn-google:hover { transform: translateY(-1px); border-color: var(--tutor); }

.profile-grid { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
.profile-card {
  --pc: var(--tutor);
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  width: 128px; padding: 16px 10px; cursor: pointer;
  border: 2px solid var(--border); border-radius: var(--radius);
  background: color-mix(in oklch, #fff 88%, var(--pc));
  transition: transform .12s ease, border-color .12s;
  animation: rise .35s ease backwards;
}
.profile-card:hover { transform: translateY(-3px); border-color: var(--pc); }
.profile-avatar {
  width: 52px; height: 52px; border-radius: 50%;
  display: grid; place-items: center; color: #fff;
  background: var(--pc); font-family: var(--font-display); font-weight: 800; font-size: 20px;
}
.profile-name { font-family: var(--font-display); font-weight: 700; }
.profile-band { font-size: 12px; color: var(--muted); }

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
.profile-form .field { border-width: 2px; padding: 8px 14px; }
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
  color: var(--fg); transition: border-color .12s, background .12s;
}
.age-band-btn.selected { border-color: var(--tutor); background: var(--tutor-soft); }
.gate-save { width: 100%; border-radius: var(--radius); display: inline-flex; justify-content: center; align-items: center; gap: 8px; }
.gate-save::after { content: '→'; }
.chip-danger { color: oklch(50% 0.16 25); border-color: color-mix(in oklch, #fff 60%, oklch(60% 0.16 25)); }

/* header profile chip */
.profile-chip { max-width: 180px; }
.profile-chip .chip-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
```

- [ ] **Step 3: Sửa `public/index.html`**

3a. Sau dòng `<span class="spacer"></span>` trong topbar, THÊM:

```html
      <button class="btn-ghost profile-chip" id="profileChip" type="button" hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"/></svg>
        <span class="chip-name" id="profileChipName"></span>
      </button>
```

3b. Ngay TRƯỚC thẻ đóng `</body>` (sau `<script type="module" src="app.js"></script>`), THÊM:

```html
  <div class="gate" id="gate" hidden></div>
```

- [ ] **Step 4: Chạy full suite** — Run: `npx vitest run` → 129 PASS (không đổi).

- [ ] **Step 5: Commit**

```bash
git add public/gate.js public/styles.css public/index.html
git commit -m "feat: add login gate screens with profile picker and manager"
```

---

### Task 11: `public/app.js` — wiring

**Files:**
- Modify: `public/app.js`

- [ ] **Step 1: Áp 5 chỉnh sửa CHÍNH XÁC**

11a. Thêm imports (đầu file, sau các import hiện có):

```js
import { initGate, reopenGate } from './gate.js';
import { getAuthToken } from './auth.js';
```

11b. Thêm state (sau `let failStreak = 0;`):

```js
let currentProfile = null;
```

11c. Trong `planFlow`, thay đoạn fetch hiện tại:

```js
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        history: history.slice(-10),
        lang,
        subject: forcedSubject,
      }),
    });
```

bằng:

```js
    const token = await getAuthToken();
    if (!token) { reopenGate(); return; }
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({
        message: text,
        history: history.slice(-10),
        lang,
        subject: forcedSubject,
        profileName: currentProfile ? currentProfile.name : null,
        ageBand: currentProfile ? currentProfile.ageBand : null,
      }),
    });
    if (res.status === 401) { reopenGate(); return; }
```

11d. Trong `judgeFlow`, thay đoạn fetch hiện tại:

```js
    const res = await fetch('/api/judge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: active.question,
        stepQuestion: step.question,
        childAnswer: text,
        lang,
      }),
    });
```

bằng:

```js
    const token = await getAuthToken();
    if (!token) { reopenGate(); return; }
    const res = await fetch('/api/judge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({
        question: active.question,
        stepQuestion: step.question,
        childAnswer: text,
        lang,
      }),
    });
    if (res.status === 401) { reopenGate(); return; }
```

11e. Trong `init()`, thay 2 dòng cuối (`applyLang(); welcome();`) bằng:

```js
  applyLang();
  initGate({
    onUnlock: (profile) => {
      const changed = currentProfile && currentProfile.id !== profile.id;
      currentProfile = profile;
      const chip = $('#profileChip');
      chip.hidden = false;
      $('#profileChipName').textContent = profile.name;
      chip.onclick = () => reopenGate();
      if (changed || stream.children.length === 0) {
        stream.innerHTML = '';
        active = null;
        forcedSubject = null;
        history = [];
        hintLevel = 0;
        failStreak = 0;
        highlightSubject(null);
        welcome();
        renderSuggests(null);
        input.placeholder = t(lang, 'inputPlaceholder');
      }
    },
  });
```

(Gate ẩn mặc định `hidden` trong HTML; khi chưa login gate hiện login — chat bên dưới không tương tác được vì overlay phủ toàn màn. `welcome()` chỉ chạy sau khi unlock.)

- [ ] **Step 2: Chạy full suite + smoke parse**

Run: `npx vitest run` → 129 PASS.
Run: `node --input-type=module -e "await import('file:///C:/Working/FY26/DE/kidgpt/public/app.js').then(()=>console.log('ok')).catch(e=>{ if(String(e).includes('document')) console.log('DOM needed — expected'); else { console.error(e); process.exit(1);} })"` → KHÔNG SyntaxError. (Import gate.js → auth.js → firebase-config.js thuần local OK; URL imports chỉ resolve khi chạy browser thật — trong node sẽ lỗi resolve URL... nếu gặp lỗi khác 'document', chấp nhận lỗi resolve URL CDN là bình thường, ghi nhận.)

- [ ] **Step 3: Commit**

```bash
git add public/app.js
git commit -m "feat: wire auth gate, bearer requests and profile chip"
```

---

### Task 12: README + smoke checklist + full suite

**Files:**
- Modify: `README.md`, `docs/smoke-checklist.md`

- [ ] **Step 1: Cập nhật `README.md`**

1a. Thay bullet "Safe by design" bằng:

```markdown
- **Parent-unlocked** — a parent signs in once with Google (Firebase Auth, session stays
  on the device); each child gets their own profile, and the AI adapts to the 6–8 or
  9–12 age band. Only a nickname and age band are stored — never chat history
```

1b. Trong bảng Environment variables, thêm dòng:

```markdown
| `FIREBASE_PROJECT_ID` | ✓ (with login) | Firebase project id for ID-token verification |
```

1c. Sau mục "Deploy (Vercel)", thêm mục mới:

```markdown
## Firebase setup (login + profiles)

1. Create a free Firebase project → Authentication → Sign-in method → enable **Google**
2. Create a **Firestore** database (production mode)
3. Copy your web app config into `public/firebase-config.js` (apiKey/authDomain/projectId/appId — public by design)
4. Paste the owner-only security rules from `docs/superpowers/specs/2026-09-17-kidgpt-auth-design.md` §4 into Firestore → Rules
5. Set `FIREBASE_PROJECT_ID` on Vercel; add your deployed domain to Authentication → Settings → Authorized domains
```

- [ ] **Step 2: Cập nhật `docs/smoke-checklist.md`** — thêm mục "Đăng nhập & hồ sơ" sau phần chuẩn bị:

```markdown
## Đăng nhập & hồ sơ (cần Firebase cấu hình + FIREBASE_PROJECT_ID)
- [ ] Mở app chưa login → màn login với nút Google, chat không tiếp cận được
- [ ] Đăng nhập Google → màn tạo hồ sơ (0 hồ sơ); tạo "Bé Bi" khổ 6–8 → sang màn chọn
- [ ] Chọn hồ sơ → vào chat; header hiện chip 👋 tên bé
- [ ] Hỏi "25 + 17 = ?" ở hồ sơ 6–8 → câu chữ đơn giản hơn hồ sơ 9–12 (so sánh 2 hồ sơ)
- [ ] Bấm chip tên → đổi hồ sơ → phiên chat reset
- [ ] Quản lý hồ sơ: sửa tên, xóa hồ sơ, tối đa 5
- [ ] Logout → mở lại app → còn session (không phải login lại)
- [ ] Tắt FIREBASE_PROJECT_ID trên server → API trả 500 not_configured
- [ ] Token hết hạn/giả: gọi API không token → 401, app hiện lại màn login
```

- [ ] **Step 3: Full suite + git status sạch**

Run: `npx vitest run` → 129/129 PASS. `git status` sạch.

- [ ] **Step 4: Commit**

```bash
git add README.md docs/smoke-checklist.md
git commit -m "docs: firebase setup and auth smoke checklist"
```

---

## Self-Review (đã thực hiện khi lập plan)

1. **Spec coverage**: §2 luồng gate → Task 10/11; §3.1 auth middleware → Task 2; §3.2 gate endpoint → Task 5/6; §3.3 rate limit uid → Task 5/6 (test assert limitArgs[1] === uid); §3.4 ageBand prompt → Task 3 + 5; §3.5 CSP → Task 7; §4 Firestore + rules → Task 9 (rules paste là việc deployer, đã ghi README Task 12); §5 3 màn + chip → Task 10 + 11; §6 privacy (log không tên — Task 5 log chỉ thêm ageBand) ; §7 testing rải các task + Task 12; §8 deploy → README Task 12; §9 không làm — tuân thủ.
2. **Placeholder scan**: mọi step có code đầy đủ; 2 chỗ "ghi nhận thực tế" là hướng dẫn TDD đọc kết quả, không phải thiếu spec.
3. **Type consistency**: `requireAuth(req, verifyImpl)` dùng nhất quán (handler gọi không verifyImpl — production path; test middleware inject); `buildChatMessages({..., profileName, ageBand})` khớp chat.js Task 5; `initGate({onUnlock})` / `reopenGate()` khớp giữa gate.js và app.js; `getAuthToken()` tên thống nhất; i18n key names khớp gate.js (signInTitle…profilesMax, switchProfile).
```
