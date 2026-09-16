import { describe, it, expect } from 'vitest';
import { createLimiter, checkRateLimit, clientIp } from '../api/lib/ratelimit.js';

describe('createLimiter', () => {
  it('returns null when upstash env missing', () => {
    expect(createLimiter({})).toBeNull();
    expect(createLimiter({ UPSTASH_REDIS_REST_URL: 'u' })).toBeNull();
  });
});

describe('checkRateLimit', () => {
  it('passes when limiter is null (skipped)', async () => {
    const r = await checkRateLimit(null, '1.2.3.4');
    expect(r).toEqual({ success: true, skipped: true });
  });
  it('delegates to limiter.limit with scoped identifier', async () => {
    const limiter = {
      limit: async (id) => ({ success: !id.endsWith('blocked') }),
    };
    expect((await checkRateLimit(limiter, 'ok', 'chat')).success).toBe(true);
    expect((await checkRateLimit(limiter, 'blocked', 'chat')).success).toBe(false);
  });
  it('scopes the limiter key per endpoint', async () => {
    const seen = [];
    const limiter = { limit: async (id) => { seen.push(id); return { success: true }; } };
    await checkRateLimit(limiter, '1.2.3.4', 'chat');
    await checkRateLimit(limiter, '1.2.3.4', 'judge');
    expect(seen).toEqual(['chat:1.2.3.4', 'judge:1.2.3.4']);
  });
  it('fails open when upstash throws', async () => {
    const limiter = { limit: async () => { throw new Error('upstash down'); } };
    const r = await checkRateLimit(limiter, '1.2.3.4', 'chat');
    expect(r.success).toBe(true);
    expect(r.error).toBe(true);
  });
  it('creates a limiter when env is complete', () => {
    const limiter = createLimiter({ UPSTASH_REDIS_REST_URL: 'https://x.upstash.io', UPSTASH_REDIS_REST_TOKEN: 't' });
    expect(limiter && typeof limiter.limit).toBe('function');
  });
});

describe('clientIp', () => {
  it('prefers x-real-ip over x-forwarded-for', () => {
    expect(clientIp({ headers: { 'x-real-ip': '9.9.9.9', 'x-forwarded-for': '1.1.1.1, 2.2.2.2' } })).toBe('9.9.9.9');
  });
  it('takes the last entry of x-forwarded-for (platform-appended real ip)', () => {
    expect(clientIp({ headers: { 'x-forwarded-for': '1.1.1.1, 2.2.2.2' } })).toBe('2.2.2.2');
  });
  it('returns null when absent', () => {
    expect(clientIp({ headers: {} })).toBeNull();
  });
});
