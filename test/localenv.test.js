import { describe, it, expect } from 'vitest';
import { applyLocalEnv } from '../api/lib/localenv.js';

describe('applyLocalEnv', () => {
  it('sets missing keys only, never overrides existing', () => {
    const env = { LLM_API_KEY: 'cloud' };
    applyLocalEnv(env, 'LLM_API_KEY=local\nLLM_MODEL=gpt-4o-mini\n');
    expect(env.LLM_API_KEY).toBe('cloud');
    expect(env.LLM_MODEL).toBe('gpt-4o-mini');
  });
  it('skips comments, blank lines and empty values', () => {
    const env = {};
    applyLocalEnv(env, '# comment\n\nUPSTASH_REDIS_REST_URL=\nLLM_BASE_URL=https://x/v1\n');
    expect(env.UPSTASH_REDIS_REST_URL).toBeUndefined();
    expect(env.LLM_BASE_URL).toBe('https://x/v1');
  });
  it('strips matching surrounding quotes and handles export prefix', () => {
    const env = {};
    applyLocalEnv(env, 'LLM_API_KEY="abc123"\nexport LLM_MODEL=\'m1\'\n');
    expect(env.LLM_API_KEY).toBe('abc123');
    expect(env.LLM_MODEL).toBe('m1');
  });
  it('ignores malformed lines', () => {
    const env = {};
    applyLocalEnv(env, 'not a assignment\n123=x\n=empty\nLLM_MODEL=m1\n');
    expect(Object.keys(env)).toEqual(['LLM_MODEL']);
  });
});
