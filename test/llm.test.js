import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readConfig, extractJSON, requestJSON, LLMError } from '../api/lib/llm.js';

const ENV = { LLM_BASE_URL: 'http://llm.test/v1', LLM_API_KEY: 'k', LLM_MODEL: 'm1' };

function okResponse(content) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content } }] }),
  };
}

beforeEach(() => {
  process.env.LLM_BASE_URL = ENV.LLM_BASE_URL;
  process.env.LLM_API_KEY = ENV.LLM_API_KEY;
  process.env.LLM_MODEL = ENV.LLM_MODEL;
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.LLM_BASE_URL;
  delete process.env.LLM_API_KEY;
  delete process.env.LLM_MODEL;
});

describe('readConfig', () => {
  it('reads env and strips trailing slash', () => {
    process.env.LLM_BASE_URL = 'http://llm.test/v1/';
    const c = readConfig();
    expect(c.baseUrl).toBe('http://llm.test/v1');
    expect(c.model).toBe('m1');
  });
  it('throws missing_api_key when absent', () => {
    delete process.env.LLM_API_KEY;
    expect(() => readConfig()).toThrow(LLMError);
  });
});

describe('extractJSON', () => {
  it('extracts first {...} block', () => {
    expect(extractJSON('noise {"a":1} noise')).toEqual({ a: 1 });
  });
  it('returns null when no JSON', () => {
    expect(extractJSON('no json here')).toBeNull();
  });
});

describe('requestJSON', () => {
  it('returns parsed plan on first try and sends json mode', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse('{"type":"refusal","message":"no"}'));
    const out = await requestJSON({
      messages: [{ role: 'user', content: 'q' }],
      validate: (d) => ({ ok: true, data: d }),
      fetchImpl,
    });
    expect(out.type).toBe('refusal');
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(body.response_format).toEqual({ type: 'json_object' });
  });

  it('retries once with correction message when schema invalid, then succeeds', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(okResponse('{"bad":1}'))
      .mockResolvedValueOnce(okResponse('{"type":"refusal","message":"ok"}'));
    const validate = (d) => (d.type === 'refusal' ? { ok: true, data: d } : { ok: false, error: 'expected type' });
    const out = await requestJSON({ messages: [{ role: 'user', content: 'q' }], validate, fetchImpl });
    expect(out.message).toBe('ok');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const body2 = JSON.parse(fetchImpl.mock.calls[1][1].body);
    expect(body2.messages.at(-1).role).toBe('user');
  });

  it('includes validation error detail in the retry message', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(okResponse('{"bad":1}'))
      .mockResolvedValueOnce(okResponse('{"type":"refusal","message":"ok"}'));
    await requestJSON({
      messages: [{ role: 'user', content: 'q' }],
      validate: (d) => (d.type === 'refusal' ? { ok: true, data: d } : { ok: false, error: 'expected type at root' }),
      fetchImpl,
    });
    const body2 = JSON.parse(fetchImpl.mock.calls[1][1].body);
    expect(body2.messages.at(-1).content).toContain('expected type at root');
  });

  it('returns canonicalized data from validate, stripping unknown keys', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse('{"verdict":"correct","feedback":"f","praise":"p","evil":"x"}'));
    const out = await requestJSON({
      messages: [{ role: 'user', content: 'q' }],
      validate: (d) => (d.verdict ? { ok: true, data: { verdict: d.verdict } } : { ok: false }),
      fetchImpl,
    });
    expect(out).toEqual({ verdict: 'correct' });
    expect(out.evil).toBeUndefined();
  });

  it('falls back to no response_format when gateway returns 400', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 400, text: async () => 'bad' })
      .mockResolvedValueOnce(okResponse('{"a":1}'));
    const out = await requestJSON({ messages: [{ role: 'user', content: 'q' }], validate: (d) => ({ ok: true, data: d }), fetchImpl });
    expect(out).toEqual({ a: 1 });
    const body2 = JSON.parse(fetchImpl.mock.calls[1][1].body);
    expect(body2.response_format).toBeUndefined();
  });

  it('throws invalid_json after two failed attempts', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse('garbage'));
    await expect(requestJSON({ messages: [{ role: 'user', content: 'q' }], fetchImpl }))
      .rejects.toMatchObject({ code: 'invalid_json' });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('throws timeout code on abort', async () => {
    const fetchImpl = vi.fn((_url, opts) => new Promise((_res, rej) => {
      opts.signal.addEventListener('abort', () => {
        const e = new Error('aborted');
        e.name = 'AbortError';
        rej(e);
      });
    }));
    await expect(requestJSON({
      messages: [{ role: 'user', content: 'q' }],
      fetchImpl,
      timeoutMs: 20,
    })).rejects.toMatchObject({ code: 'timeout' });
  });

  it('throws http_500 on server error', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'boom' });
    await expect(requestJSON({ messages: [{ role: 'user', content: 'q' }], fetchImpl }))
      .rejects.toMatchObject({ code: 'http_500' });
  });

  it('maps non-JSON 200 body to retryable bad_response', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => { throw new SyntaxError('Unexpected token <'); } })
      .mockResolvedValueOnce(okResponse('{"a":1}'));
    const out = await requestJSON({ messages: [{ role: 'user', content: 'q' }], validate: (d) => ({ ok: true, data: d }), fetchImpl });
    expect(out).toEqual({ a: 1 });
  });

  it('ends with http_400 when gateway 400s twice', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 400, text: async () => 'bad' });
    await expect(requestJSON({ messages: [{ role: 'user', content: 'q' }], fetchImpl }))
      .rejects.toMatchObject({ code: 'http_400' });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('does not mutate the caller messages array', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(okResponse('garbage'))
      .mockResolvedValueOnce(okResponse('{"a":1}'));
    const msgs = [{ role: 'user', content: 'q' }];
    await requestJSON({ messages: msgs, validate: (d) => ({ ok: true, data: d }), fetchImpl });
    expect(msgs.length).toBe(1);
  });

  it('abort during body read maps to timeout', async () => {
    const fetchImpl = vi.fn((_url, opts) => Promise.resolve({
      ok: true,
      status: 200,
      json: () => new Promise((_resolve, rej) => {
        opts.signal.addEventListener('abort', () => {
          const e = new Error('aborted');
          e.name = 'AbortError';
          rej(e);
        });
      }),
    }));
    await expect(requestJSON({ messages: [{ role: 'user', content: 'q' }], fetchImpl, timeoutMs: 20 }))
      .rejects.toMatchObject({ code: 'timeout' });
  });

  it('maps non-string content to retryable bad_response, not TypeError', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: 123 } }] }) })
      .mockResolvedValueOnce(okResponse('{"a":1}'));
    const out = await requestJSON({ messages: [{ role: 'user', content: 'q' }], validate: (d) => ({ ok: true, data: d }), fetchImpl });
    expect(out).toEqual({ a: 1 });
  });
});
