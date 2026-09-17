import { createRemoteJWKSet, jwtVerify } from 'jose';
import { logLine } from './log.js';

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
    algorithms: ['RS256'],
    requiredClaims: ['exp'],
  });
  if (!payload.sub) throw new AuthError('unauthorized');
  return { uid: payload.sub };
}

// Token-validation failures mean "this credential is bad" (401).
// Anything else (JWKS fetch timeout, network error, 5xx from Google...)
// means "we could not check" — surfaced as auth_unavailable (503).
const TOKEN_ERRORS = new Set([
  'JWTExpired', 'JWTClaimValidationFailed', 'JWSSignatureVerificationFailed',
  'JWSInvalid', 'JWTInvalid', 'JWTMalformed', 'JWKSNoMatchingKey',
  'JWKSMultipleMatchingKeys', 'JOSEAlgNotAllowed', 'JOSENotSupported',
]);

/**
 * Verify a Firebase ID token. `verifyImpl` is injectable for tests.
 * Returns {uid} or throws AuthError('unauthorized'|'auth_unavailable'|'not_configured').
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
    const name = (err && err.name) || 'unknown';
    logLine('auth_rejected', { error: name });
    if (TOKEN_ERRORS.has(name)) throw new AuthError('unauthorized');
    throw new AuthError('auth_unavailable');
  }
}
