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
- **Cơ sở dữ liệu:** Firebase Firestore (Lite SDK) + Firebase Auth (đăng nhập Google cho BCH). Khi chưa cấu hình Firebase, web chạy bản demo lưu trong LocalStorage.
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

## 🔥 Cài đặt Firebase (cơ sở dữ liệu thật)

Chưa cấu hình Firebase thì web vẫn chạy, nhưng dữ liệu chỉ lưu trên trình duyệt của từng người (bản demo).

### 1. Tạo project
1. Vào [Firebase Console](https://console.firebase.google.com/) → **Add project**. Gói **Spark (miễn phí)** là đủ.
2. **Build → Firestore Database → Create database**, chọn vùng `asia-southeast1` (Singapore), chế độ **production**.
3. **Build → Authentication → Get started → Sign-in method → Google → Enable**.
4. **Authentication → Settings → Authorized domains**: thêm `deeyu-hcmut.github.io`.
5. **Project settings → Your apps → Web (`</>`)**: tạo web app và chép 4 giá trị `apiKey`, `authDomain`, `projectId`, `appId`.

### 2. Áp dụng Security Rules
Mở **Firestore → Rules**, dán toàn bộ nội dung file [`firestore.rules`](firestore.rules) rồi bấm **Publish**.
(Hoặc dùng CLI: `npx firebase-tools deploy --only firestore:rules --project <projectId>`.)

> Không có rules này thì database **mở hoặc khoá hoàn toàn**. Rules đảm bảo: ai cũng đăng ký được nhưng không thể sửa vé/điểm danh; email & SĐT sinh viên chỉ BCH xem được.

### 3. Cấp quyền BCH
Trong **Firestore → Data**, tạo collection `admins`. Mỗi tài khoản là một document:
- **Document ID**: email Google, ví dụ `dtn-ddt@hcmut.edu.vn`
- **Trường** `role` (string): `SUPER_ADMIN`, `EVENT_MANAGER` (Ban CTXH: sự kiện, điểm danh) hoặc `EDITOR` (Ban Truyền thông: tin tức)

### 4. Khai báo cho GitHub Actions
Repo → **Settings → Secrets and variables → Actions → Variables** → thêm:
`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`.
Chạy lại workflow **Deploy to GitHub Pages**.

### 5. Nạp dữ liệu ban đầu (tuỳ chọn)
Đăng nhập bằng tài khoản `SUPER_ADMIN` → **Quản trị → Phân quyền** → **Nạp dữ liệu mẫu** (chỉ chạy khi database còn trống).

### Chạy local với Firebase
Chép `.env.example` thành `.env.local`, điền 4 giá trị Firebase, rồi `npm run dev`.
Muốn thử mà không đụng dữ liệu thật: đặt `VITE_FIREBASE_EMULATOR="true"`, `VITE_FIREBASE_PROJECT_ID="demo-fee-portal"` (các giá trị khác điền tuỳ ý) và chạy `npx firebase-tools emulators:start --only firestore,auth --project demo-fee-portal` (cần Java 21+).

### Lưu ý
- **Email chưa được gửi thật.** Nhật ký email trong trang Quản trị chỉ ghi trạng thái `QUEUED`. Muốn gửi thật cần thêm Cloud Functions (gói Blaze) hoặc dịch vụ như EmailJS.
- Sinh viên đăng ký không cần đăng nhập, nên ai biết MSSV đều tra cứu được lịch sử tham gia (họ tên, sự kiện, mã vé) của MSSV đó — giống như bản trước. Email/SĐT không bị lộ.
