# ⚡ CỔNG THÔNG TIN ĐOÀN - HỘI KHOA ĐIỆN - ĐIỆN TỬ (FEE PORTAL)

> **Cổng thông tin điện tử, quản lý phong trào sinh viên, đăng ký sự kiện và tự động hóa điểm danh Đoàn - Hội Khoa Điện - Điện tử (FEE - HCMUT).**

🌐 **Trang web chính thức:** [https://deeyu-hcmut.github.io/](https://deeyu-hcmut.github.io/)

---

## 🚀 Các tính năng chính

- 🏠 **Trang chủ & Bản tin:** Cập nhật tin tức, sự kiện, học bổng doanh nghiệp, phong trào Sinh viên 5 Tốt và chiến dịch Mùa Hè Xanh.
- 🎟️ **Cổng Sự kiện & Xuất Vé Điện Tử:** Sinh viên đăng ký tham gia sự kiện và nhận mã vé điện tử QR độc nhất.
- 📷 **Điểm danh Tự động (QR Check-in Scanner):** Quét mã vé QR qua camera hoặc nhập mã vé/MSSV để ghi nhận tham gia thời gian thực.
- 🔍 **Tra cứu Sinh viên:** Sinh viên tra cứu lịch sử tham dự sự kiện và điểm rèn luyện theo MSSV.
- 📊 **Dashboard Quản trị:** Ban tổ chức theo dõi số lượng đăng ký, xuất danh sách điểm danh ra file Excel (`.xlsx`) và gửi email nhắc nhở tự động.

---

## 🛠️ Công nghệ sử dụng

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti.
- **Cơ sở dữ liệu:** Firebase Firestore (Lite SDK) + Firebase Auth (đăng nhập Google cho BCH). Bản demo không cần Firebase vẫn chạy được với `VITE_DEMO_MODE=true`.
- **Triển khai:** Tự động hóa qua **GitHub Actions & GitHub Pages**.

---

## 💻 Hướng dẫn chạy thử nghiệm trên máy cá nhân (Local)

1. **Cài đặt thư viện:**
   ```bash
   npm install
   ```

2. **Chạy máy chủ phát triển:**
   ```bash
   npm run dev
   ```

3. Mở trình duyệt tại: `http://localhost:3000` (hoặc port hiển thị trên terminal).

---

## 🔥 Firebase (cơ sở dữ liệu)

Web dùng project Firebase **`deeyu-hcmut`**. Cấu hình web app nằm trong [`src/services/firebaseConfig.ts`](src/services/firebaseConfig.ts) (các giá trị này công khai theo thiết kế; dữ liệu được bảo vệ bằng Security Rules).

### 1. Bật dịch vụ (làm một lần)
1. [Firestore](https://console.firebase.google.com/project/deeyu-hcmut/firestore) → **Create database**, vùng `asia-southeast1`, chế độ **production**.
2. [Authentication → Sign-in method](https://console.firebase.google.com/project/deeyu-hcmut/authentication/providers) → bật **Google**.
3. [Authentication → Settings → Authorized domains](https://console.firebase.google.com/project/deeyu-hcmut/authentication/settings) → thêm `deeyu-hcmut.github.io`.

### 2. Áp dụng Security Rules
Mở [Firestore → Rules](https://console.firebase.google.com/project/deeyu-hcmut/firestore/rules), dán toàn bộ nội dung file [`firestore.rules`](firestore.rules) rồi bấm **Publish**.
(Hoặc dùng CLI: `npx firebase-tools deploy --only firestore:rules --project deeyu-hcmut`.)
**Mỗi lần sửa `firestore.rules` phải Publish lại.**

> Rules đảm bảo: ai cũng đăng ký được nhưng không thể sửa vé/điểm danh; email & SĐT sinh viên chỉ BCH xem được.

### 3. Cấp quyền BCH
Trong [Firestore → Data](https://console.firebase.google.com/project/deeyu-hcmut/firestore/data), collection `admins`. Mỗi tài khoản là một document:
- **Document ID**: email Google, ví dụ `dtn-ddt@hcmut.edu.vn`
- **Trường** `role` (string), một trong:

| `role` | Ban | Quyền |
|---|---|---|
| `SUPER_ADMIN` | Ban Thường vụ | Toàn quyền, cấp quyền tài khoản (`admins`), sửa BCH |
| `HC_TV` | Ban HC-TV | Tạo/sửa/xoá sự kiện, danh sách đăng ký, xuất Excel, nhắc nhở 24h |
| `TT_SK` | Ban TT-SK | Như HC-TV, thêm đăng/sửa/xoá tin tức |
| `QLNS_CTSV` | Ban QLNS-CTSV | Quản lý danh sách sinh viên, đoàn viên, hội viên (collection `members`) |

Mọi vai trò trên đều quét QR điểm danh được. Tài khoản không có trong `admins` là sinh viên: không thấy nút quét QR.
Giá trị cũ `EVENT_MANAGER` / `EDITOR` vẫn được hiểu là `HC_TV` / `TT_SK`.

### Chạy local
`npm run dev` dùng luôn project thật — cẩn thận khi thử đăng ký/xoá.
- Thử mà không đụng dữ liệu thật: tạo `.env.local` với `VITE_FIREBASE_EMULATOR="true"` và `VITE_FIREBASE_PROJECT_ID="demo-fee-portal"`, rồi chạy `npx firebase-tools emulators:start --only firestore,auth --project demo-fee-portal` (cần Java 21+).
- Chạy bản demo cũ không có Firebase: `VITE_DEMO_MODE="true"`.

### Lưu ý
- **Email chưa được gửi thật.** Nhật ký email trong trang Quản trị chỉ ghi trạng thái `QUEUED`. Muốn gửi thật cần thêm Cloud Functions (gói Blaze) hoặc dịch vụ như EmailJS.
- Sinh viên đăng ký không cần đăng nhập, nên ai biết MSSV đều tra cứu được lịch sử tham gia (họ tên, sự kiện, mã vé) của MSSV đó — giống như bản trước. Email/SĐT không bị lộ.
