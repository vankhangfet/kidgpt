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
  it('delegates to limiter.limit(ip)', async () => {
    const limiter = {
      limit: async (ip) => ({ success: ip !== 'blocked' }),
    };
    expect((await checkRateLimit(limiter, 'ok')).success).toBe(true);
    expect((await checkRateLimit(limiter, 'blocked')).success).toBe(false);
  });
});

describe('clientIp', () => {
  it('takes first ip from x-forwarded-for', () => {
    expect(clientIp({ headers: { 'x-forwarded-for': '1.1.1.1, 2.2.2.2' } })).toBe('1.1.1.1');
  });
  it('returns null when absent', () => {
    expect(clientIp({ headers: {} })).toBeNull();
  });
});
