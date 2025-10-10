# Firebase Configuration

## Cách cấu hình Firebase cho dự án

### 1. Tạo Firebase Project

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Tạo một project mới hoặc chọn project có sẵn
3. Vào Project Settings → Service Accounts
4. Click "Generate new private key"
5. Download file JSON

### 2. Cấu hình trong dự án

#### Phương án 1: Sử dụng file JSON

1. Copy file JSON đã download và đổi tên thành `serviceAccountKey.json`
2. Đặt file này vào thư mục root của dự án (cùng cấp với package.json)

#### Phương án 2: Sử dụng Environment Variables (khuyến nghị)

Thêm các biến sau vào file `.env`:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project-id.iam.gserviceaccount.com
```

### 3. Lưu ý bảo mật

- **KHÔNG BAO GIỜ** commit file `serviceAccountKey.json` vào git
- File này đã được thêm vào `.gitignore`
- Sử dụng environment variables trong production
- Giữ private key an toàn

### 4. Test Firebase

Nếu Firebase được cấu hình đúng, bạn sẽ thấy log:

```
✅ Firebase Admin đã được khởi tạo thành công
```

Nếu không có cấu hình Firebase, ứng dụng vẫn chạy được với mock services:

```
⚠️  serviceAccountKey.json không tồn tại. Firebase sẽ không khả dụng.
```
