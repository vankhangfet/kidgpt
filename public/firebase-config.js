// Firebase web config — GIÁ TRỊ PUBLIC BY DESIGN (không phải secret).
// Lấy từ: Firebase Console → Project settings → Your apps → Web app → SDK setup.
// Điền xong 4 giá trị dưới rồi deploy. Server-side cần thêm env FIREBASE_PROJECT_ID.
export const FIREBASE_CONFIG = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  appId: 'YOUR_APP_ID',
};
