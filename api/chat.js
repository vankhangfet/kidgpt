import { sanitizeText, sanitizeHistory, validatePlan, SUBJECTS } from './lib/schemas.js';
import { buildChatMessages } from './lib/prompts.js';
import { requestJSON, LLMError } from './lib/llm.js';
import { createLimiter, checkRateLimit, clientIp } from './lib/ratelimit.js';
import { logLine } from './lib/log.js';

const limiter = createLimiter();

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const limit = await checkRateLimit(limiter, clientIp(req), 'chat');
  if (!limit.success) {
    logLine('chat_ratelimited', {});
    return res.status(429).json({ error: 'rate_limited' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const message = sanitizeText(body.message);
  if (!message) return res.status(400).json({ error: 'missing_message' });
  const history = sanitizeHistory(body.history);
  const lang = body.lang === 'en' ? 'en' : 'vi';
  const subject = SUBJECTS.includes(body.subject) ? body.subject : null;

  const started = Date.now();
  try {
    const plan = await requestJSON({
      messages: buildChatMessages({ message, history, subject, lang }),
      validate: validatePlan,
    });
    logLine('chat', {
      lang,
      outcome: plan.type,
      subject: plan.type === 'plan' ? plan.subject : null,
      latencyMs: Date.now() - started,
    });
    return res.status(200).json({ plan });
  } catch (err) {
    logLine('chat_error', { lang, code: err instanceof LLMError ? err.code : 'unknown', latencyMs: Date.now() - started });
    if (err instanceof LLMError && err.code === 'timeout') {
      return res.status(504).json({ error: 'timeout' });
    }
    if (err instanceof LLMError && err.code === 'missing_api_key') {
      return res.status(500).json({ error: 'not_configured' });
    }
    return res.status(502).json({ error: 'plan_invalid' });
  }
}
