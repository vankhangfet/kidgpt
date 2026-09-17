import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

export class AuthError extends Error {
  constructor(code) {
    super(code);
    this.name = 'AuthError';
    this.code = code;
  }
}

let jwks = null;
function getJwks() {
  if (!jwks) jwks = createRemoteJWKSet(new URL(JWKS_URL));
  return jwks;
}

export function extractBearer(req) {
  const h = req.headers && req.headers.authorization;
  if (typeof h === 'string' && h.startsWith('Bearer ')) {
    const token = h.slice(7).trim();
    return token || null;
  }
  return null;
}

async function defaultVerify(token, projectId) {
  const { payload } = await jwtVerify(token, getJwks(), {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });
  if (!payload || !payload.sub) throw new AuthError('unauthorized');
  return { uid: payload.sub };
}

/**
 * Verify a Firebase ID token. `verifyImpl` is injectable for tests.
 * Returns {uid} or throws AuthError('unauthorized'|'not_configured').
 */
export async function requireAuth(req, verifyImpl = defaultVerify) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new AuthError('not_configured');
  const token = extractBearer(req);
  if (!token) throw new AuthError('unauthorized');
  try {
    return await verifyImpl(token, projectId);
  } catch (err) {
    if (err instanceof AuthError) throw err;
    throw new AuthError('unauthorized');
  }
}
