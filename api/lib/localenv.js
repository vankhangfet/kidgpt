import { readFileSync } from 'node:fs';

/**
 * Parse dotenv-style text and fill in only keys missing from `env`.
 * Used so `vercel dev` picks up .env.local (the CLI does not inject it
 * into functions). On deployed Vercel the file is gitignored and absent,
 * so this is a local-dev no-op.
 */
export function applyLocalEnv(env, text) {
  for (const line of String(text).split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let value = m[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!value) continue;
    if (env[m[1]] === undefined) env[m[1]] = value;
  }
}

/** Prime process.env from .env.local once, only when no key is configured. */
export function primeLocalEnv() {
  if (process.env.LLM_API_KEY && process.env.FIREBASE_PROJECT_ID) return;
  let text;
  try {
    text = readFileSync('.env.local', 'utf8');
  } catch {
    return;
  }
  applyLocalEnv(process.env, text);
}
