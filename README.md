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

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Motion, Canvas Confetti.
- **Backend / Serverless Storage:** Express + LocalStorage Fallback cho GitHub Pages tĩnh.
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
