import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAuth, extractBearer, AuthError } from '../api/lib/auth.js';

function req(headers) { return { headers }; }

beforeEach(() => {
  process.env.FIREBASE_PROJECT_ID = 'kidgpt-demo';
});

describe('extractBearer', () => {
  it('extracts token from Authorization header', () => {
    expect(extractBearer(req({ authorization: 'Bearer abc.def' }))).toBe('abc.def');
  });
  it('returns null when missing or malformed', () => {
    expect(extractBearer(req({}))).toBeNull();
    expect(extractBearer(req({ authorization: 'Basic abc' }))).toBeNull();
    expect(extractBearer(req({ authorization: 'Bearer ' }))).toBeNull();
  });
});

describe('requireAuth', () => {
  it('returns uid for a valid token', async () => {
    const fakeVerify = vi.fn(async () => ({ uid: 'u123' }));
    const auth = await requireAuth(req({ authorization: 'Bearer tok' }), fakeVerify);
    expect(auth.uid).toBe('u123');
  });
  it('throws unauthorized when header missing', async () => {
    await expect(requireAuth(req({}), vi.fn())).rejects.toMatchObject({ code: 'unauthorized' });
  });
  it('throws unauthorized when verify rejects', async () => {
    const fakeVerify = vi.fn(async () => { throw new Error('jwt expired'); });
    await expect(requireAuth(req({ authorization: 'Bearer tok' }), fakeVerify))
      .rejects.toMatchObject({ code: 'unauthorized' });
  });
  it('throws not_configured when FIREBASE_PROJECT_ID missing', async () => {
    delete process.env.FIREBASE_PROJECT_ID;
    await expect(requireAuth(req({ authorization: 'Bearer tok' }), vi.fn()))
      .rejects.toMatchObject({ code: 'not_configured' });
  });
  it('AuthError carries code', () => {
    const e = new AuthError('unauthorized');
    expect(e).toBeInstanceOf(Error);
    expect(e.code).toBe('unauthorized');
  });
});
