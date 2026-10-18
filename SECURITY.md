# Chính sách bảo mật

## Báo lỗi bảo mật

Nếu bạn phát hiện lỗ hổng, **đừng đăng công khai**. Gửi email tới <dtn-ddt@hcmut.edu.vn> (tiêu đề "Báo lỗi bảo mật") kèm mô tả, các bước tái hiện và ảnh hưởng. Chúng tôi sẽ phản hồi và xử lý trong thời gian sớm nhất.

## Phiên bản được hỗ trợ

| Phiên bản | Hỗ trợ |
|---|---|
| 1.x | ✅ |

## Các biện pháp hiện có

- Đăng nhập Google chỉ chấp nhận `@hcmut.edu.vn`; vai trò cán bộ lưu ở `admins/{email}`.
- Firestore Security Rules ([`firestore.rules`](firestore.rules)): vé chỉ chủ vé và cán bộ đọc; email/số điện thoại chỉ cán bộ đã được cấp quyền; danh sách sinh viên chỉ Ban QLNS-CTSV và Super Admin.
- Apps Script web app xác thực token đăng nhập Firebase và vai trò trước mọi thao tác.
- Firebase App Check (reCAPTCHA Enterprise) để chống truy cập tự động.

## Nhắc cho người quản trị

- Bật xác minh 2 bước cho tài khoản Google chạy Apps Script, tài khoản Super Admin và tài khoản GitHub.
- Giữ danh sách người có quyền chỉnh sửa Google Sheet sinh viên thật ngắn (Sheet ghi được vào Firestore qua script).
- Gỡ tài khoản cán bộ đã nghỉ khỏi **Quản trị → Phân quyền**; xuất Excel đăng ký định kỳ để sao lưu (gói Spark không có sao lưu tự động).
