import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export function createLimiter(env = process.env) {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) return null;
  const redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
  return new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(20, '5 m'),
    prefix: 'kidgpt',
  });
}

export async function checkRateLimit(limiter, ip) {
  if (!limiter) return { success: true, skipped: true };
  const r = await limiter.limit(ip || 'unknown');
  return { success: r.success, skipped: false };
}

export function clientIp(req) {
  const fwd = req.headers && req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd) return fwd.split(',')[0].trim();
  return null;
}
