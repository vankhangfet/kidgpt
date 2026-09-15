import { CORRECTION_MESSAGE } from './prompts.js';

export class LLMError extends Error {
  constructor(code, detail) {
    super(detail ? `${code}: ${detail}` : code);
    this.code = code;
    this.detail = detail || null;
  }
}

export function readConfig(env = process.env) {
  const baseUrl = String(env.LLM_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const apiKey = env.LLM_API_KEY;
  const model = env.LLM_MODEL || 'gpt-4o-mini';
  if (!apiKey) throw new LLMError('missing_api_key');
  return { baseUrl, apiKey, model };
}

export function extractJSON(text) {
  if (typeof text !== 'string') return null;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function postChat({ config, messages, maxTokens, timeoutMs, fetchImpl, useJsonMode }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const body = { model: config.model, messages, max_tokens: maxTokens, temperature: 0.4 };
  if (useJsonMode) body.response_format = { type: 'json_object' };
  let res;
  try {
    res = await fetchImpl(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (err && err.name === 'AbortError') throw new LLMError('timeout');
    throw new LLMError('network', String((err && err.message) || err));
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    const err = new LLMError(`http_${res.status}`, String(detail).slice(0, 500));
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new LLMError('empty_response');
  return content;
}

export async function requestJSON({
  messages,
  validate,
  maxTokens = 1200,
  timeoutMs = 20000,
  env = process.env,
  fetchImpl = fetch,
}) {
  const config = readConfig(env);
  let useJsonMode = true;
  let attempt = 0;
  let lastError = null;
  while (attempt < 2) {
    attempt += 1;
    let content;
    try {
      content = await postChat({ config, messages, maxTokens, timeoutMs, fetchImpl, useJsonMode });
    } catch (err) {
      if (err instanceof LLMError && err.status === 400 && useJsonMode) {
        useJsonMode = false;
        attempt -= 1; // same attempt again without response_format
        continue;
      }
      throw err;
    }
    const parsed = extractJSON(content);
    if (parsed) {
      const v = validate ? validate(parsed) : { ok: true, data: parsed };
      if (v.ok) return v.data;
      lastError = new LLMError('invalid_json', v.error ? String(v.error).slice(0, 300) : null);
      messages = [...messages, { role: 'user', content: `${CORRECTION_MESSAGE} Schema error: ${String(v.error).slice(0, 300)}` }];
    } else {
      lastError = new LLMError('invalid_json');
      messages = [...messages, { role: 'user', content: CORRECTION_MESSAGE }];
    }
  }
  throw lastError || new LLMError('invalid_json');
}
