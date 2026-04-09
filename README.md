# Vanmilo - Hệ Thống Quản Lý Sản Phẩm

## 🔥 Firebase Edition

Đây là ứng dụng quản lý sản phẩm với **Firebase Backend**. Ứng dụng cung cấp:
- ✅ CRUD sản phẩm (Thêm, Sửa, Xóa)
- ✅ Dữ liệu real-time (tất cả user thấy cùng lúc)
- ✅ Deploy lên Firebase Hosting miễn phí
- ✅ Không cần server riêng

## Cấu trúc dự án

```
vanmilo-project/
├── public/                 # Thư mục deploy lên Firebase
│   ├── index.html         # Trang chính
│   ├── css/
│   │   └── style.css      # Styles
│   └── js/
│       ├── firebase.js    # Cấu hình Firebase
│       └── app.js         # Logic ứng dụng
├── firebase.json          # Cấu hình Firebase Hosting
├── package.json           # NPM dependencies
└── README.md              # Tài liệu
```

## 🚀 Cách thiết lập

### Bước 1: Tạo Firebase Project

1. Truy cập [console.firebase.google.com](https://console.firebase.google.com)
2. Nhấn **"Add project"** → Đặt tên project (vd: `vanmilo-products`)
3. Tắt Google Analytics (không cần thiết)
4. Nhấn **"Create project"**

### Bước 2: Bật Cloud Firestore

1. Trong Firebase Console → **Build** → **Firestore Database**
2. Nhấn **"Create database"**
3. Chọn **"Start in test mode"** (để test nhanh)
4. Chọn location gần nhất → **Enable**

### Bước 3: Lấy Firebase Config

1. Vào **Project Settings** (biểu tượng ⚙️)
2. Cuộn xuống **Your apps** → Nhấn **Web** (</>)
3. Đặt tên app → Đăng ký
4. Copy **firebaseConfig** (object JavaScript)

### Bước 4: Cập nhật firebase.js

Mở file `public/js/firebase.js` và thay thế:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### Bước 5: Import dữ liệu ban đầu (tùy chọn)

1. Trong Firestore → **Start collection** → Đặt tên: `products`
2. Thêm document với các trường:
   - `id`: number
   - `name`: string
   - `price`: number
   - `quantity`: number
   - `category`: string (supplement/vitamin/personalcare/other)

### Bước 6: Cài đặt Firebase CLI

```bash
npm install -g firebase-tools
```

### Bước 7: Login Firebase

```bash
firebase login
```

### Bước 8: Deploy

```bash
# Di chuyển vào thư mục project
cd vanmilo-project

# Deploy lên Firebase Hosting
firebase deploy
```

Sau khi deploy thành công, bạn sẽ nhận được URL:
```
https://YOUR_PROJECT_ID.web.app
```

## 📱 Cách sử dụng

### Thêm sản phẩm
1. Nhấn nút **"Thêm Sản Phẩm"**
2. Điền thông tin vào form
3. Nhấn **"Lưu"**

### Chỉnh sửa sản phẩm
1. Nhấn biểu tượng **bút chì** trên hàng sản phẩm
2. Cập nhật thông tin
3. Nhấn **"Lưu"**

### Xóa sản phẩm
1. Nhấn biểu tượng **thùng rác** trên hàng sản phẩm
2. Xác nhận xóa

### Tìm kiếm & Lọc
- **Tìm kiếm**: Gõ tên sản phẩm
- **Lọc theo loại**: Chọn danh mục
- **Lọc theo tồn kho**: Còn hàng / Hết hàng

## 🔒 Bảo mật Firestore (Production)

Sau khi test xong, bạn nên thêm Rules cho Firestore:

1. Firebase Console → **Firestore Database** → **Rules**
2. Thay thế rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{product} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 💡 Mẹo

### Chạy local trước khi deploy
```bash
npm install
npx serve public
# Mở http://localhost:3000
```

### Xem logs Firebase
```bash
firebase functions:log
```

## 📊 Dữ liệu sản phẩm

| Trường | Mô tả | Ví dụ |
|--------|--------|-------|
| id | Mã sản phẩm (auto) | 1, 2, 3... |
| name | Tên sản phẩm | EMAX |
| price | Đơn giá (VNĐ) | 5000 |
| quantity | Số lượng tồn kho | 10 |
| category | Loại sản phẩm | supplement |

### Categories:
- `supplement` - Thực Phẩm Chức Năng
- `vitamin` - Vitamin
- `personalcare` - Chăm Sóc Cá Nhân
- `other` - Khác

## 📄 License

ISC
