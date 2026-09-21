import { firebaseConfigFromEnv } from './lib/firebase-config.js';
import { primeLocalEnv } from './lib/localenv.js';

// GET /api/firebase-config — trả module JS chứa FIREBASE_CONFIG cho frontend.
// Thiếu env bắt buộc thì trả placeholder YOUR_* để app hiện màn "Chưa cấu hình".
export default function handler(req, res) {
  primeLocalEnv();
  const { js } = firebaseConfigFromEnv(process.env);
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(js);
}
