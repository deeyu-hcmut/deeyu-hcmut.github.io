# ⚡ Cổng thông tin Đoàn - Hội khoa Điện - Điện tử (FEE Portal)

> Cổng thông tin chính thức của **Đoàn Thanh niên - Hội Sinh viên khoa Điện - Điện tử, Trường Đại học Bách khoa - ĐHQG-HCM**:
> tin tức, sự kiện, đăng ký, vé điện tử QR, điểm danh và quản lý Đoàn viên - Hội viên.

🌐 **Trang web:** <https://deeyu-hcmut.github.io/> · 📄 [Chính sách quyền riêng tư](https://deeyu-hcmut.github.io/privacy.html) · 🔖 Phiên bản **1.0.0** ([CHANGELOG](CHANGELOG.md))

---

## Tính năng

**Sinh viên** (đăng nhập bằng tài khoản `@hcmut.edu.vn`)
- Xem sự kiện, tin tức, cơ cấu Ban Chấp hành và Đội CTV (không cần đăng nhập).
- Liên kết hồ sơ sinh viên một lần (MSSV + họ tên khớp danh sách của khoa), rồi đăng ký sự kiện với thông tin điền sẵn.
- Nhận vé điện tử **QR**; trang **Tra cứu** tự hiện sự kiện đã đăng ký, lịch sử điểm danh và các vé của chính mình.
- Email tự động: xác nhận đăng ký (kèm QR), nhắc 24 giờ trước sự kiện, xác nhận điểm danh.

**Ban Chấp hành** (theo vai trò)
- Tạo/sửa/xoá sự kiện (ảnh bìa tải lên, không có thì dùng logo), tin tức, thông báo.
- **Quét QR điểm danh** bằng camera hoặc nhập mã vé.
- Danh sách đăng ký, xuất Excel, nhật ký email, tra cứu hoạt động của sinh viên theo MSSV.
- Quản lý danh sách sinh viên / Đoàn viên / Hội viên (đồng bộ với Google Sheet), BCH và Đội CTV, phân quyền tài khoản.

Giao diện sáng/tối luôn theo thiết bị. Dùng được trên điện thoại (thanh điều hướng dưới cùng, nút QR).

## Vai trò

| `role` trong `admins/{email}` | Ban | Quyền chính |
|---|---|---|
| `SUPER_ADMIN` | Ban Thường vụ | Toàn quyền, cấp quyền tài khoản, sửa BCH, đăng ký hộ MSSV |
| `HC_TV` | Ban HC-TV | Tạo / sửa / xoá sự kiện |
| `TT_SK` | Ban TT-SK | Như HC-TV, thêm tin tức |
| `QLNS_CTSV` | Ban QLNS-CTSV | BCH & Đội CTV, danh sách sinh viên - Đoàn viên - Hội viên |
| *(không có trong `admins`)* | Sinh viên | Đăng ký sự kiện, xem vé của mình |

Mọi vai trò cán bộ đều quét được QR, xem danh sách đăng ký, xuất Excel và xem nhật ký email. Chỉ tài khoản `@hcmut.edu.vn` đăng nhập được.

## Tài liệu hướng dẫn

- **Sinh viên:** GIF từng bước và kịch bản dựng clip trong [`docs/huong-dan/sinh-vien`](docs/huong-dan/sinh-vien/kich-ban.md).
- **Cán bộ (theo vai trò):** [`docs/huong-dan/huong-dan-can-bo.pdf`](docs/huong-dan/huong-dan-can-bo.pdf) (nguồn HTML để sửa: [`docs/huong-dan/can-bo`](docs/huong-dan/can-bo/huong-dan-can-bo.html)).

## Kiến trúc

```
Trình duyệt (React + Vite, GitHub Pages)
   ├─ Firebase Auth ........... đăng nhập Google, chỉ @hcmut.edu.vn
   ├─ Firestore (Lite SDK) .... dữ liệu; bảo vệ bằng firestore.rules (+ App Check)
   └─ Apps Script web app ..... tab "Sinh viên" đọc/ghi qua Google Sheet (kiểm tra token đăng nhập)

Google Apps Script (tools/google-sheet-sync)
   ├─ Code.gs ........ đồng bộ Sheet sinh viên ↔ Firestore + web app cho trang Quản trị
   ├─ bch/Code.gs .... đồng bộ Sheet BCH → Firestore
   └─ email/Code.gs .. gửi email tự động bằng Gmail (xác nhận, nhắc 24h, điểm danh)
```

Bố cục Firestore và quy tắc truy cập: xem phần chú thích đầu [`src/services/firebaseApi.ts`](src/services/firebaseApi.ts) và [`firestore.rules`](firestore.rules).

## Công nghệ

React 19 · TypeScript · Vite · Tailwind CSS 4 · Firebase (Auth, Firestore Lite, App Check) · `qrcode` / `qr-scanner` · `xlsx` · GitHub Actions + GitHub Pages · Google Apps Script. Thiết kế để chạy trên **gói Firebase Spark (miễn phí)**: có cache trình duyệt, dữ liệu cũ khi hết hạn mức, và tab Sinh viên đọc qua Sheet để tiết kiệm lượt đọc.

## Chạy trên máy cá nhân

Cần Node.js 22.

```bash
npm ci
npm run dev        # http://localhost:3000
npm run lint       # kiểm tra kiểu TypeScript
npx vite build     # build ra dist/
```

`npm run dev` dùng **project Firebase thật**, cẩn thận khi thử đăng ký/xoá. Các cách khác:
- Emulator: `.env.local` với `VITE_FIREBASE_EMULATOR="true"` và `VITE_FIREBASE_PROJECT_ID="demo-fee-portal"`, rồi `npx firebase-tools emulators:start --only firestore,auth --project demo-fee-portal` (cần Java 21+).
- Bản demo không cần Firebase: `VITE_DEMO_MODE="true"`.

Biến môi trường tuỳ chọn: xem [`.env.example`](.env.example).

## Cài đặt cho một project mới

### 1. Firebase (project `deeyu-hcmut`)
1. [Firestore](https://console.firebase.google.com/project/deeyu-hcmut/firestore) → **Create database** (vùng `asia-southeast1`, chế độ production).
2. [Authentication](https://console.firebase.google.com/project/deeyu-hcmut/authentication/providers) → bật **Google**; **Settings → Authorized domains** → thêm `deeyu-hcmut.github.io`.
3. **Quy tắc bảo mật:** dán toàn bộ [`firestore.rules`](firestore.rules) vào [Firestore → Rules](https://console.firebase.google.com/project/deeyu-hcmut/firestore/rules) và **Publish** (hoặc `npx firebase-tools deploy --only firestore:rules --project deeyu-hcmut`). **Mỗi lần sửa file phải Publish lại; nên deploy web trước rồi mới Publish quy tắc.**
4. **Super Admin đầu tiên:** tạo tay trong Firestore, collection `admins`, document ID là email `@hcmut.edu.vn`, trường `role` = `SUPER_ADMIN`. Sau đó cấp quyền ngay trên web: **Quản trị → Phân quyền**.
5. **App Check (khuyến nghị):** tạo khoá reCAPTCHA Enterprise loại Website cho `deeyu-hcmut.github.io`, đăng ký trong Firebase → App Check, đặt site key vào [`src/services/firebaseConfig.ts`](src/services/firebaseConfig.ts) (hoặc `VITE_APP_CHECK_SITE_KEY`). Chỉ bật **Enforce** sau khi biểu đồ App Check cho thấy gần như mọi yêu cầu đã được xác minh, và theo dõi hạn mức 10.000 lượt đánh giá/tháng của reCAPTCHA Enterprise.

### 2. Google Apps Script
Hướng dẫn từng bước trong [`tools/google-sheet-sync/README.md`](tools/google-sheet-sync/README.md): đồng bộ danh sách sinh viên (kèm web app cho tab Sinh viên), đồng bộ BCH, gửi email tự động. Tài khoản chạy script phải là Owner/Editor của project Firebase.

### 3. Triển khai
Mỗi lần push lên `main`, workflow [`deploy.yml`](.github/workflows/deploy.yml) chạy `npm ci` → `npm run lint` → `vite build` rồi đăng lên GitHub Pages. Tệp trong [`public/`](public/) (ví dụ `privacy.html`, tệp xác minh Search Console) được phục vụ ở gốc trang.

## Phát hành

Phiên bản theo [Semantic Versioning](https://semver.org/lang/vi/); lịch sử thay đổi ở [CHANGELOG.md](CHANGELOG.md). Push tag dạng `vX.Y.Z` để workflow [`release.yml`](.github/workflows/release.yml) kiểm tra, build và tạo bản **GitHub Release** kèm gói `dist`:

```bash
git tag -a v1.0.0 -m "v1.0.0"
git push origin v1.0.0
```

## Bảo mật

Tóm tắt các biện pháp và cách báo lỗi bảo mật: [SECURITY.md](SECURITY.md). Chính sách dữ liệu cá nhân: [privacy.html](public/privacy.html).

## Cấu trúc thư mục

```
src/            ứng dụng React (components, services, utils, types)
public/         tệp tĩnh (logo, privacy.html, sitemap, robots, xác minh)
tools/          Google Apps Script (Sheet sinh viên, BCH, email)
firestore.rules quy tắc bảo mật Firestore
.github/        workflow deploy và release
server.ts       máy chủ Express cho bản demo cục bộ
```

## Giấy phép

Chưa khai báo giấy phép mã nguồn; mặc định mọi quyền được bảo lưu bởi Đoàn - Hội khoa Điện - Điện tử. Liên hệ <dtn-ddt@hcmut.edu.vn> nếu muốn tái sử dụng.
