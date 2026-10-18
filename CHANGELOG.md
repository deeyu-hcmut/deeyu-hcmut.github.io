# Changelog

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/), phiên bản theo [Semantic Versioning](https://semver.org/lang/vi/).

## [Unreleased]

### Thêm
- Tài liệu hướng dẫn: GIF + kịch bản clip cho sinh viên, PDF hướng dẫn cho cán bộ (`docs/huong-dan`).

### Sửa
- Dòng mô tả trang chủ không còn tràn khỏi màn hình điện thoại.
- Bản demo cục bộ: sự kiện không có ảnh bìa dùng logo như bản thật.

## [1.0.0] - 2026-10-18

Bản phát hành đầu tiên của cổng thông tin.

### Tính năng
- Trang chủ, bản tin, sự kiện, cơ cấu tổ chức (Bí thư / Phó căn giữa, Ủy viên thu nhỏ, Trưởng ban trên Phó ban).
- Đăng ký sự kiện với hồ sơ sinh viên điền sẵn, vé điện tử **QR**, quét QR điểm danh, tra cứu vé của chính mình.
- Email tự động bằng Gmail qua Google Apps Script: xác nhận đăng ký (kèm QR), nhắc 24 giờ, xác nhận điểm danh; tiêu đề `[ĐOÀN - HỘI KHOA ĐIỆN - ĐIỆN TỬ] …`.
- Quản trị theo vai trò: sự kiện (ảnh bìa tải lên, không có thì dùng logo), tin tức, danh sách đăng ký, xuất Excel, nhật ký email, BCH, phân quyền.
- Danh sách sinh viên / Đoàn viên / Hội viên chia theo khóa và lớp, đọc/ghi qua Google Sheet (Apps Script web app) để tiết kiệm hạn mức Firestore.
- Giao diện sáng/tối theo thiết bị; trang [Chính sách quyền riêng tư](public/privacy.html).

### Bảo mật
- Chỉ tài khoản `@hcmut.edu.vn` đăng nhập được (cả giao diện lẫn Firestore Rules).
- Vé và chỉ mục sinh viên chỉ chủ vé và cán bộ đọc được; đăng ký chỉ bằng MSSV đã liên kết với tài khoản.
- Hỗ trợ Firebase App Check (reCAPTCHA Enterprise), bật Enforce sau khi theo dõi.

### Hiệu năng / gói miễn phí
- Cache danh sách (sự kiện, tin tức 3 phút; BCH, thông báo 15 phút), hiển thị dữ liệu cũ khi hết hạn mức, tin tức tải 10 bài kèm "Xem thêm", danh sách đăng ký admin cache trong bộ nhớ.

[1.0.0]: https://github.com/deeyu-hcmut/deeyu-hcmut.github.io/releases/tag/v1.0.0
