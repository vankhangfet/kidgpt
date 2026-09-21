import { describe, it, expect } from 'vitest';
import { firebaseConfigFromEnv } from '../api/lib/firebase-config.js';

const FULL = {
  FIREBASE_API_KEY: 'AIza-test-key',
  FIREBASE_APP_ID: '1:123:web:abc',
  FIREBASE_PROJECT_ID: 'kid-gpt',
};

describe('firebaseConfigFromEnv', () => {
  it('builds a configured module from complete env', () => {
    const out = firebaseConfigFromEnv(FULL);
    expect(out.configured).toBe(true);
    expect(out.js).toContain("'AIza-test-key'".replace(/'/g, '"'));
    expect(out.js).toContain('"kid-gpt"');
    expect(out.js).toContain('"1:123:web:abc"');
    expect(out.js).toMatch(/^export const FIREBASE_CONFIG = \{/);
    expect(out.js.trimEnd().endsWith(';')).toBe(true);
  });

  it('derives authDomain from projectId when not provided', () => {
    const out = firebaseConfigFromEnv(FULL);
    expect(out.js).toContain('"authDomain": "kid-gpt.firebaseapp.com"');
  });

  it('keeps an explicit FIREBASE_AUTH_DOMAIN', () => {
    const out = firebaseConfigFromEnv({ ...FULL, FIREBASE_AUTH_DOMAIN: 'custom.example.com' });
    expect(out.js).toContain('"custom.example.com"');
    expect(out.js).not.toContain('firebaseapp.com');
  });

  it('falls back to YOUR_ placeholders when any required var is missing', () => {
    for (const missing of ['FIREBASE_API_KEY', 'FIREBASE_APP_ID', 'FIREBASE_PROJECT_ID']) {
      const env = { ...FULL };
      delete env[missing];
      const out = firebaseConfigFromEnv(env);
      expect(out.configured).toBe(false);
      expect(out.js).toContain('YOUR_API_KEY');
      expect(out.js).toContain('YOUR_PROJECT_ID');
      expect(out.js).toContain('YOUR_APP_ID');
    }
  });

  it('treats empty strings as missing', () => {
    const out = firebaseConfigFromEnv({ ...FULL, FIREBASE_APP_ID: '' });
    expect(out.configured).toBe(false);
  });

  it('json-escapes values so the module stays valid', () => {
    const out = firebaseConfigFromEnv({ ...FULL, FIREBASE_API_KEY: 'ab"c\\d' });
    expect(out.js).toContain('ab\\"c\\\\d');
    // module parseable
    expect(out.js).not.toMatch(/export const FIREBASE_CONFIG = \{[^}]*ab"c/);
  });
});
