// Sinh module JS `export const FIREBASE_CONFIG = {...}` từ biến môi trường.
// Frontend tải /firebase-config.js (trên Vercel được redirect tới /api/firebase-config).
// Firebase web config là PUBLIC BY DESIGN — env để tiện configure & giữ repo sạch,
// không phải để giấu secret.
export function firebaseConfigFromEnv(env) {
  const apiKey = env.FIREBASE_API_KEY || '';
  const appId = env.FIREBASE_APP_ID || '';
  const projectId = env.FIREBASE_PROJECT_ID || '';
  const configured = Boolean(apiKey && appId && projectId);
  const config = configured
    ? {
        apiKey,
        appId,
        projectId,
        authDomain: env.FIREBASE_AUTH_DOMAIN || (projectId + '.firebaseapp.com'),
      }
    : {
        apiKey: 'YOUR_API_KEY',
        authDomain: 'YOUR_AUTH_DOMAIN',
        projectId: 'YOUR_PROJECT_ID',
        appId: 'YOUR_APP_ID',
      };
  return {
    configured,
    js: 'export const FIREBASE_CONFIG = ' + JSON.stringify(config, null, 2) + ';\n',
  };
}
