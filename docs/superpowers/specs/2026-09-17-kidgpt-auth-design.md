# KidGPT — Đăng nhập + Đa hồ sơ trẻ: Thiết kế

Ngày: 2026-09-17
Trạng thái: Đã duyệt qua thảo luận (5 phần đều được phê duyệt)
Ref: docs/superpowers/specs/2026-09-14-kidgpt-design.md (spec v2 gốc — app stateless không account)

## 1. Quyết định sản phẩm (đã chốt)

| Quyết định | Lựa chọn |
|---|---|
| Ai login | Phụ huynh mở khóa bằng Gmail của họ; session giữ trên thiết bị (mở khóa 1 lần) |
| Ai được dùng | Mọi Gmail — không allowlist |
| Phạm vi v1 | Đa hồ sơ trẻ: sau login, phụ huynh tạo hồ sơ từng con (tên + khổ tuổi); trẻ chọn hồ sơ khi dùng; AI thích ứng độ tuổi |
| Gate | Bắt buộc login mới dùng được app |
| Kiến trúc | Firebase Authentication (Google provider) + Firestore cho hồ sơ |

Lý do chọn Firebase (so với GIS+jose+Upstash / Supabase): session tự refresh vĩnh viễn
đúng UX "mở khóa một lần" cho phụ huynh; UI auth có sẵn; hồ sơ CRUD phía client với
security rules không cần API endpoint. Chi phí: thêm vendor + SDK load từ CDN.

Bối cảnh pháp lý: dữ liệu thu thập là email người lớn (phụ huynh) + biệt danh/khổ tuổi
trẻ — tối thiểu hóa; không thu thập DOB hay dữ liệu cá nhân định danh trẻ.

## 2. Kiến trúc tổng thể

### Thành phần mới

```
public/firebase-config.js   # Firebase web config (public-by-design, deployer tự điền)
public/auth.js              # Init Firebase Auth, sign-in/out, lấy ID token, onAuthStateChanged
api/lib/auth.js             # requireAuth(req): verify ID token bằng jose
```

### Luồng người dùng

```
Mở app (Firebase Auth session tự phục hồi từ IndexedDB)
 ├─ Chưa login            → MÀN LOGIN (nút Google + giải thích phụ huynh + ghi chú riêng tư)
 ├─ Đã login, 0 hồ sơ     → MÀN QUẢN LÝ HỒ SƠ (form tạo: tên + khổ tuổi)
 ├─ Đã login, ≥1 hồ sơ    → MÀN CHỌN HỒ SƠ (thẻ to theo màu, trẻ tự bấm)
 └─ Chọn hồ sơ xong       → CHAT (như v2) — header thêm chip tên bé + đổi hồ sơ + logout
```

- SDK Firebase v11 load dạng ESM từ `https://www.gstatic.com/firebasejs/…` — không build step
- Mọi request `/api/*` kèm `Authorization: Bearer <firebase_id_token>`; client dùng
  `currentUser.getIdToken()` (SDK tự refresh khi hết hạn 1h)
- Nhận 401 từ API → hiện lại màn login

## 3. Backend

1. **`api/lib/auth.js`** — `requireAuth(req)`:
   - Extract `Authorization: Bearer <token>`; thiếu/sai → 401 `{error:'unauthorized'}`
   - `jwtVerify` bằng jose với `createRemoteJWKSet('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')`
   - Check `issuer === 'https://securetoken.google.com/' + FIREBASE_PROJECT_ID`,
     `audience === FIREBASE_PROJECT_ID`; trả `{uid: payload.sub}`
   - Verifier injectable để test; JWKS được jose cache
   - Thiếu `FIREBASE_PROJECT_ID` env → 500 `not_configured`
2. **Gate**: `/api/chat` + `/api/judge` gọi `requireAuth` TRƯỚC rate limit
3. **Rate limit theo uid**: key `scope:${uid}` thay vì IP (chính xác hơn, hết bucket chung)
4. **Thích ứng độ tuổi**: `buildSystemPrompt(lang, ageBand)` (mặc định '9-12' khi vắng):
   - '6-8': câu cực ngắn, từ vựng đơn giản, ưu tiên 2–3 bước, khuyến khích aid trực quan
   - '9-12': như prompt hiện tại (tới 4 bước, ngôn ngữ giàu hơn)
   - Body request thêm `ageBand` (enum '6-8'|'9-12') + `profileName` (sanitize ≤ 20 ký tự,
     strip HTML như sanitizeText) → nối vào prompt theo kiểu "(Trẻ: {tên}, khổ tuổi {band})";
     log KHÔNG chứa tên
5. **CSP** (vercel.json): `script-src` thêm `https://www.gstatic.com https://apis.google.com`
   (gapi helper cho auth popup trên browser chặn third-party cookie); `connect-src` thêm
   `https://*.googleapis.com wss://*.googleapis.com https://apis.google.com`; `frame-src`
   `https://accounts.google.com https://*.firebaseapp.com https://apis.google.com` (auth iframe relay)
6. Dependency server mới: `jose` (thuần verify + fetch JWKS 1 lần/cache). KHÔNG firebase-admin,
   KHÔNG service account trên server — env duy nhất: `FIREBASE_PROJECT_ID`

## 4. Firestore — hồ sơ trẻ

Schema:

```
users/{uid}/profiles/{profileId}
  name: string    // biệt danh bé, 1–20 ký tự
  ageBand: '6-8' | '9-12'
  color: number   // 0–7 index màu avatar, client gán luân phiên theo thứ tự tạo
  createdAt: timestamp (serverTimestamp)
```

- CRUD hoàn toàn phía client (Firebase SDK); tối đa 5 hồ sơ/phụ huynh (check client)
- Security Rules (paste vào Firebase Console — LƯU Ý: read/delete phải tách khỏi create/update
  vì `request.resource` chỉ tồn tại khi ghi; gộp chung sẽ làm mọi read/delete bị từ chối):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/profiles/{profileId} {
      allow read, delete: if request.auth != null && request.auth.uid == uid;
      allow create, update: if request.auth != null && request.auth.uid == uid
        && request.resource.data.keys().hasOnly(['name', 'ageBand', 'color', 'createdAt'])
        && request.resource.data.name is string
        && request.resource.data.name.size() > 0
        && request.resource.data.name.size() <= 20
        && request.resource.data.ageBand in ['6-8', '9-12']
        && request.resource.data.color is int
        && request.resource.data.color >= 0
        && request.resource.data.color <= 7
        && request.resource.data.createdAt is timestamp;
    }
  }
}
```

(hasOnly ép đủ đúng 4 field — chống ghi field lạ và chống tài liệu thiếu `createdAt` bị
loại khỏi kết quả orderBy; color bound 0–7 khớp client.)

- Server không đọc Firestore: client gửi `ageBand`/`profileName` trong body; backend
  sanitize + enum-check (chỉ ảnh hưởng prompt của chính họ)

## 5. Frontend

File mới `public/auth.js` tách logic Firebase; `app.js` giữ orchestration. Màn hình mới
dùng design system hiện tại (Baloo/Nunito, coral/teal, pill, rise), i18n vi/en đầy đủ:

1. **Màn login** (thay chat khi chưa login): logo + tagline + nút Google + dòng cho phụ huynh
   "Đăng nhập một lần để lưu hồ sơ học của bé — thông tin chỉ dùng cho gia đình bạn" + ghi chú riêng tư
2. **Màn quản lý hồ sơ** (phụ huynh): danh sách hồ sơ (sửa/xóa) + form tạo (tên + 2 nút khổ tuổi) + lưu
3. **Màn chọn hồ sơ** (trẻ): thẻ to màu avatar + tên + khổ tuổi; bấm vào vào chat;
   `activeProfileId` lưu localStorage theo uid (`kidgpt-profile:{uid}`)
   (dự phòng auto-resume v2; v1 luôn hiện màn chọn)
4. **Header chat**: chip `👋 {tên bé}` (bấm → đổi hồ sơ), nút logout (icon, aria-label i18n)

Thay đổi app.js: state thêm `user`, `profile`; fetch kèm Bearer; 401 → màn login;
đổi hồ sơ = reset phiên; xóa hồ sơ xong ở lại màn quản lý (không tự về màn chọn).

## 6. Bảo mật & quyền riêng tư

- Lưu tối thiểu: email phụ huynh (Firebase Auth), biệt danh + khổ tuổi trẻ (Firestore,
  rules chỉ chủ sở hữu đọc được). Không lịch sử chat, không DOB, không PII trẻ
- Xóa hồ sơ: nút trong màn quản lý (xóa Firestore + localStorage). Xóa tài khoản: luồng chuẩn Firebase
- Log server: thêm `uid` (thay IP làm key rate limit; phục vụ debug), không nội dung, không tên
- Token hết hạn → 401 → client hiện login (hiếm vì SDK auto-refresh)

## 7. Kiểm thử

- **Unit (vitest)**: auth middleware (thiếu header/sai token/hết hạn/hợp lệ — mock verifier;
  thiếu FIREBASE_PROJECT_ID → 500); prompts ageBand 2 khổ + fallback mặc định; handlers
  trả 401 khi không token; sanitize profileName/ageBand
- **Frontend**: giữ nguyên không-unit; smoke checklist bổ sung: login → tạo hồ sơ → chọn →
  chat → đổi hồ sơ → logout → login lại còn session → xóa hồ sơ
- **Firestore rules**: kiểm thủ công qua Console (attempt truy cập uid khác bị từ chối)

## 8. Triển khai (deployer)

1. Tạo Firebase project (Spark miễn phí) → Authentication → bật Google provider → Firestore create
2. Điền `public/firebase-config.js` (apiKey/authDomain/projectId/appId — giá trị public);
   paste rules mục 4 vào Firestore Console
3. Vercel env thêm `FIREBASE_PROJECT_ID` (env server bắt buộc thứ 4)
4. Firebase Console → Authentication → Settings → Authorized domains: thêm domain deploy
5. README cập nhật các bước này

## 9. Không làm (v1)

- Allowlist email/domain; duyệt tay
- Lưu lịch sử chat/điểm số theo hồ sơ (v2 sau nếu cần)
- Hồ sơ có ảnh/độ tuổi chính xác (chỉ 2 khổ)
- firebase-admin, service account, API endpoint hồ sơ
- Emulator test cho Firestore rules
