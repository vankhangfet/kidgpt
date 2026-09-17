import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
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
  it('throws auth_unavailable when verify rejects with an unknown error', async () => {
    const fakeVerify = vi.fn(async () => { throw new Error('jwt expired'); });
    await expect(requireAuth(req({ authorization: 'Bearer tok' }), fakeVerify))
      .rejects.toMatchObject({ code: 'auth_unavailable' });
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

describe('defaultVerify (integration, stubbed JWKS)', () => {
  afterEach(() => vi.unstubAllGlobals());

  async function freshAuth() {
    vi.resetModules();
    return import('../api/lib/auth.js');
  }
  function jwksOk(jwk) {
    return vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ keys: [jwk] }) });
  }
  async function setupKeys() {
    const { publicKey, privateKey } = await generateKeyPair('RS256');
    const pubJwk = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' };
    return { privateKey, pubJwk };
  }
  async function mint(privateKey, { iss = 'https://securetoken.google.com/kidgpt-demo', aud = 'kidgpt-demo', sub = 'u9', exp = '2h', withExp = true } = {}) {
    let b = new SignJWT({})
      .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
      .setIssuer(iss)
      .setAudience(aud)
      .setSubject(sub);
    if (withExp) b = b.setExpirationTime(exp);
    return b.sign(privateKey);
  }

  it('accepts a valid token and returns uid', async () => {
    const { privateKey, pubJwk } = await setupKeys();
    vi.stubGlobal('fetch', jwksOk(pubJwk));
    const { requireAuth: ra } = await freshAuth();
    const out = await ra({ headers: { authorization: 'Bearer ' + (await mint(privateKey)) } });
    expect(out).toEqual({ uid: 'u9' });
  });

  it('rejects wrong issuer or wrong audience', async () => {
    const { privateKey, pubJwk } = await setupKeys();
    vi.stubGlobal('fetch', jwksOk(pubJwk));
    const { requireAuth: ra } = await freshAuth();
    const badIss = await mint(privateKey, { iss: 'https://evil.example/' });
    const badAud = await mint(privateKey, { aud: 'other-project' });
    await expect(ra({ headers: { authorization: 'Bearer ' + badIss } })).rejects.toMatchObject({ code: 'unauthorized' });
    await expect(ra({ headers: { authorization: 'Bearer ' + badAud } })).rejects.toMatchObject({ code: 'unauthorized' });
  });

  it('rejects expired token and token without exp', async () => {
    const { privateKey, pubJwk } = await setupKeys();
    vi.stubGlobal('fetch', jwksOk(pubJwk));
    const { requireAuth: ra } = await freshAuth();
    const expired = await mint(privateKey, { exp: Math.floor(Date.now() / 1000) - 60 });
    const noExp = await mint(privateKey, { withExp: false });
    await expect(ra({ headers: { authorization: 'Bearer ' + expired } })).rejects.toMatchObject({ code: 'unauthorized' });
    await expect(ra({ headers: { authorization: 'Bearer ' + noExp } })).rejects.toMatchObject({ code: 'unauthorized' });
  });

  it('rejects an HS256-header token without verifying', async () => {
    const { pubJwk } = await setupKeys();
    vi.stubGlobal('fetch', jwksOk(pubJwk));
    const { requireAuth: ra } = await freshAuth();
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: 'k1' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ sub: 'u9' })).toString('base64url');
    const forged = header + '.' + payload + '.c2ln';
    await expect(ra({ headers: { authorization: 'Bearer ' + forged } })).rejects.toMatchObject({ code: 'unauthorized' });
  });

  it('maps jwks network failure to auth_unavailable', async () => {
    const { privateKey } = await setupKeys();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network down')));
    const { requireAuth: ra } = await freshAuth();
    await expect(ra({ headers: { authorization: 'Bearer ' + (await mint(privateKey)) } }))
      .rejects.toMatchObject({ code: 'auth_unavailable' });
  });

  it('maps jwks http 500 to auth_unavailable', async () => {
    const { privateKey } = await setupKeys();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }));
    const { requireAuth: ra } = await freshAuth();
    await expect(ra({ headers: { authorization: 'Bearer ' + (await mint(privateKey)) } }))
      .rejects.toMatchObject({ code: 'auth_unavailable' });
  });
});
