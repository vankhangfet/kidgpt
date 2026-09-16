import { sanitizeText, validateJudge } from './lib/schemas.js';
import { buildJudgeMessages } from './lib/prompts.js';
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

  const limit = await checkRateLimit(limiter, clientIp(req), 'judge');
  if (!limit.success) {
    logLine('judge_ratelimited', {});
    return res.status(429).json({ error: 'rate_limited' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const question = sanitizeText(body.question);
  const stepQuestion = sanitizeText(body.stepQuestion);
  const childAnswer = sanitizeText(body.childAnswer);
  if (!question || !stepQuestion || !childAnswer) {
    return res.status(400).json({ error: 'missing_fields' });
  }
  const lang = body.lang === 'en' ? 'en' : 'vi';

  const started = Date.now();
  try {
    const judge = await requestJSON({
      messages: buildJudgeMessages({ question, stepQuestion, childAnswer, lang }),
      validate: validateJudge,
      maxTokens: 800,
    });
    logLine('judge', { lang, verdict: judge.verdict, latencyMs: Date.now() - started });
    return res.status(200).json({ judge });
  } catch (err) {
    logLine('judge_error', { lang, code: err instanceof LLMError ? err.code : 'unknown', latencyMs: Date.now() - started });
    if (err instanceof LLMError && err.code === 'timeout') {
      return res.status(504).json({ error: 'timeout' });
    }
    if (err instanceof LLMError && err.code === 'missing_api_key') {
      return res.status(500).json({ error: 'not_configured' });
    }
    return res.status(502).json({ error: 'judge_invalid' });
  }
}
