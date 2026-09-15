import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { logLine } from './log.js';

export function createLimiter(env = process.env) {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    logLine('ratelimit_disabled', { reason: 'missing_upstash_env' });
    return null;
  }
  const redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
  return new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(20, '5 m'),
    prefix: 'kidgpt',
    timeout: 1000,
  });
}

export async function checkRateLimit(limiter, ip, scope = 'global') {
  if (!limiter) return { success: true, skipped: true };
  try {
    const r = await limiter.limit(`${scope}:${ip || 'unknown'}`);
    return { success: r.success, skipped: false };
  } catch (err) {
    logLine('ratelimit_error', { code: String((err && err.message) || err).slice(0, 200) });
    return { success: true, skipped: false, error: true };
  }
}

export function clientIp(req) {
  const fwd = req.headers && req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd) return fwd.split(',')[0].trim();
  return null;
}
