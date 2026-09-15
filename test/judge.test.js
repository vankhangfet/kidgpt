import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const okJudge = { verdict: 'correct', feedback: 'Chính xác!', praise: 'Giỏi lắm!' };

function mockRes() {
  const out = { code: 0, body: null, headers: {} };
  out.setHeader = (k, v) => { out.headers[k.toLowerCase()] = v; };
  out.status = (c) => { out.code = c; return out; };
  out.json = (b) => { out.body = b; return out; };
  return out;
}

let handler;
beforeEach(async () => {
  vi.resetModules();
  process.env.LLM_BASE_URL = 'http://llm.test/v1';
  process.env.LLM_API_KEY = 'k';
  process.env.LLM_MODEL = 'm1';
  delete process.env.UPSTASH_REDIS_REST_URL;
  handler = (await import('../api/judge.js')).default;
});
afterEach(() => vi.unstubAllGlobals());

describe('POST /api/judge', () => {
  it('returns 200 with judge on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ choices: [{ message: { content: JSON.stringify(okJudge) } }] }),
    }));
    const res = mockRes();
    await handler({
      method: 'POST',
      body: { question: 'Q', stepQuestion: 'S', childAnswer: 'A', lang: 'vi' },
      headers: {},
    }, res);
    expect(res.code).toBe(200);
    expect(res.body.judge.verdict).toBe('correct');
  });

  it('returns 400 when any field missing', async () => {
    const res = mockRes();
    await handler({ method: 'POST', body: { question: 'Q', stepQuestion: '', childAnswer: 'A' }, headers: {} }, res);
    expect(res.code).toBe(400);
  });

  it('returns 405 for GET', async () => {
    expect((await handler({ method: 'GET', headers: {} }, mockRes())).code).toBe(405);
  });

  it('returns 502 when LLM returns invalid verdict', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ choices: [{ message: { content: '{"verdict":"maybe"}' } }] }),
    }));
    const res = mockRes();
    await handler({ method: 'POST', body: { question: 'Q', stepQuestion: 'S', childAnswer: 'A' }, headers: {} }, res);
    expect(res.code).toBe(502);
    expect(res.body.error).toBe('judge_invalid');
  });

  it('sanitizes all three inputs before prompting', async () => {
    const spy = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ choices: [{ message: { content: JSON.stringify(okJudge) } }] }),
    });
    vi.stubGlobal('fetch', spy);
    await handler({
      method: 'POST',
      body: { question: '<b>Q</b>', stepQuestion: 'S<script>', childAnswer: 'my answer' },
      headers: {},
    }, mockRes());
    const body = JSON.parse(spy.mock.calls[0][1].body);
    const userPayload = JSON.parse(body.messages.at(-1).content);
    expect(userPayload).toEqual({ question: 'Q', stepQuestion: 'S', childAnswer: 'my answer' });
  });

  it('returns 429 when rate limit denies', async () => {
    vi.resetModules();
    let limitArgs = null;
    vi.doMock('../api/lib/ratelimit.js', () => ({
      createLimiter: () => ({}),
      checkRateLimit: async (...a) => { limitArgs = a; return { success: false, skipped: false }; },
      clientIp: () => '1.2.3.4',
    }));
    const h = (await import('../api/judge.js')).default;
    vi.doUnmock('../api/lib/ratelimit.js');
    const res = mockRes();
    await h({ method: 'POST', body: { question: 'Q', stepQuestion: 'S', childAnswer: 'A' }, headers: {} }, res);
    expect(res.code).toBe(429);
    expect(res.body.error).toBe('rate_limited');
    expect(limitArgs[2]).toBe('judge');
  });

  it('returns 504 on LLM timeout', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(Object.assign(new Error('t'), { name: 'AbortError' })));
    const res = mockRes();
    await handler({ method: 'POST', body: { question: 'Q', stepQuestion: 'S', childAnswer: 'A' }, headers: {} }, res);
    expect(res.code).toBe(504);
    expect(res.body.error).toBe('timeout');
  });

  it('returns 500 not_configured when api key missing', async () => {
    delete process.env.LLM_API_KEY;
    const res = mockRes();
    await handler({ method: 'POST', body: { question: 'Q', stepQuestion: 'S', childAnswer: 'A' }, headers: {} }, res);
    expect(res.code).toBe(500);
    expect(res.body.error).toBe('not_configured');
  });
});
