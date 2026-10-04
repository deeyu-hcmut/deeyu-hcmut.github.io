# Đồng bộ danh sách sinh viên Google Sheet ↔ cổng thông tin

Script Apps Script gắn vào Google Sheet danh sách sinh viên, tự đồng bộ với collection `members` trên Firestore
(tab **Sinh viên - Đoàn viên - Hội viên** trong trang Quản trị).

## Cách đồng bộ

| Cột | Chiều đồng bộ |
|---|---|
| MSSV, Họ và tên, Khóa, Ghi chú | Sheet → Web. Ô trống giữ nguyên dữ liệu trên web. |
| Giới tính, Ngày sinh, Lớp/Chi đoàn, Email, Số điện thoại, Đoàn viên, Ngày vào Đoàn, Hội viên, Trạng thái | Sinh viên **chưa** tự bổ sung hồ sơ: Sheet → Web. Sinh viên **đã** tự bổ sung (đăng nhập @hcmut.edu.vn): Web → Sheet. |

- **Nhiều tab:** mọi tab có cột `MSSV` ở dòng 1 đều được đồng bộ (ví dụ tab `K24`, `K25`, `K26`). Tab đặt tên theo khóa
  thì ô Khóa để trống (hoặc không có cột Khóa) sẽ lấy tên tab làm khóa. Muốn chỉ đồng bộ một số tab, sửa
  `const SHEET_NAMES = [];` thành ví dụ `['K24', 'K25', 'K26']`. Một MSSV xuất hiện ở hai tab thì chỉ lấy lần đầu và báo trùng.
- Sinh viên có trên web nhưng không có trong sheet (ví dụ thêm từ trang Quản trị) được **thêm dòng** vào cuối tab cùng khóa.
  Chưa có tab cho khóa đó thì không thêm, chỉ báo trong thông báo kết quả.
- **Xoá dòng trong sheet không xoá trên web.** Muốn xoá hẳn, xoá trên trang Quản trị rồi xoá dòng trong sheet.
- MSSV trùng hoặc sai định dạng (không phải chữ/số) bị bỏ qua và được báo trong thông báo sau khi chạy.
- Chỉ ghi lại đúng những ô thay đổi, công thức ở chỗ khác trong sheet không bị ảnh hưởng.

## Yêu cầu

- Dòng 1 của sheet là tiêu đề cột: `MSSV, Họ và tên, Giới tính, Ngày sinh, Khóa, Lớp/Chi đoàn, Email, Số điện thoại, Đoàn viên, Ngày vào Đoàn, Hội viên, Trạng thái, Ghi chú`
  (thứ tự không quan trọng; thiếu cột nào thì cột đó không đồng bộ).
- Người cài đặt script phải là **Owner hoặc Editor của project Firebase `deeyu-hcmut`**
  (Firebase console → ⚙ Project settings → Users and permissions). Script chạy bằng tài khoản người này.
- Giá trị trong ô:
  - Giới tính: `Nam` / `Nữ` / `Khác`
  - Ngày: định dạng ngày của Google Sheet hoặc `dd/mm/yyyy`
  - Đoàn viên / Hội viên: `x`, `Có` hoặc ô checkbox
  - Trạng thái: `Đang học` / `Bảo lưu` / `Đã tốt nghiệp` / `Thôi học` (để trống = Đang học)
  - Nên định dạng cột Số điện thoại là **Văn bản thuần tuý** để không mất số 0 ở đầu.

## Cài đặt (một lần)

1. Mở Google Sheet → **Tiện ích mở rộng → Apps Script**.
2. Trong Apps Script: **⚙ Cài đặt dự án** → tích **Hiển thị tệp kê khai "appsscript.json" trong trình chỉnh sửa**.
3. Quay lại **Trình chỉnh sửa**:
   - Mở `Code.gs`, xoá hết, dán toàn bộ nội dung file [`Code.gs`](Code.gs).
   - Mở `appsscript.json`, xoá hết, dán nội dung file [`appsscript.json`](appsscript.json).
   - Bấm 💾 Lưu.
4. Tải lại trang Google Sheet. Trên thanh menu xuất hiện **Đồng bộ web**.
5. **Đồng bộ web → Đồng bộ ngay**. Lần đầu Google hỏi quyền:
   - Chọn tài khoản → nếu hiện "Google chưa xác minh ứng dụng này" thì bấm **Nâng cao → Đi tới … (không an toàn)**
     (đây là script của chính bạn) → **Cho phép**.
   - Bấm **Đồng bộ ngay** lần nữa. Góc dưới phải hiện kết quả, ví dụ `Web: thêm 120, cập nhật 0…`.
6. Kiểm tra trên web (Quản trị → Sinh viên - Đoàn viên - Hội viên) thấy dữ liệu đúng thì bấm
   **Đồng bộ web → Bật tự động (mỗi 10 phút)**.

Tắt: **Đồng bộ web → Tắt tự động**.

## Khi có lỗi

- Xem nhật ký: Apps Script → **Lần thực thi** (Executions).
- `Firestore trả lỗi 403 … PERMISSION_DENIED`: tài khoản chạy script chưa có quyền trên project `deeyu-hcmut`
  (xem mục Yêu cầu), hoặc thiếu quyền `serviceusage.services.use` (vai trò Owner/Editor đều có).
- `Không tab nào có cột MSSV ở dòng tiêu đề.`: dòng 1 của các tab không có cột tên `MSSV`.
- Đổi người quản lý sheet: người mới làm lại bước 5–6 bằng tài khoản của họ (và người cũ bấm Tắt tự động).

---

# Danh sách BCH (trang Cơ cấu Tổ chức)

Script riêng [`bch/Code.gs`](bch/Code.gs), gắn vào **file Google Sheet BCH** (khác file sinh viên), đồng bộ với
collection `bch` (tab **BCH và Trưởng, phó ban Đội CTV** trong trang Quản trị và trang công khai Cơ cấu Tổ chức).

## Cách đồng bộ

- Cột `Tổ chức, Họ và tên, Chức vụ, Ban/Bộ phận, Email, Giới thiệu`: **Sheet → Web**. Ô trống giữ nguyên dữ liệu trên web.
- Mỗi người được ghép theo **Tổ chức + Họ và tên** (không phân biệt hoa thường). Đổi tên trong sheet = người mới trên web
  (người cũ vẫn còn, xoá trên web hoặc bật chế độ xoá bên dưới).
- **Ảnh đại diện và Chi đoàn** không có trong sheet: sửa trên web (nút Sửa), đồng bộ không đụng tới.
- **Thứ tự hiển thị trên web = thứ tự tab, rồi thứ tự dòng** trong sheet. Muốn Bí thư đứng đầu thì để ở dòng 2 của tab đầu.
- Đọc mọi tab có cột `Họ và tên` ở dòng 1 (ví dụ 3 tab BCH Đoàn / BCH Hội / Trưởng, phó ban CTV).
  Ô **Tổ chức** ghi `Đoàn Thanh niên`, `Hội Sinh viên` hoặc `Đội CTV`; để trống thì lấy theo tên tab
  (tên tab có chữ "Đoàn", "Hội" hoặc "CTV" / "Trưởng, phó ban").
- Người chỉ có trên web được thêm dòng vào tab cùng tổ chức. Xoá dòng trong sheet **không** xoá trên web, trừ khi sửa
  `const XOA_NGUOI_KHONG_CO_TRONG_SHEET = false;` thành `true` (dùng khi đổi nhiệm kỳ: web khớp đúng sheet,
  ai không còn trong sheet bị xoá khỏi web).

## Cài đặt

Giống mục [Cài đặt](#cài-đặt-một-lần) ở trên, nhưng làm trong **file Google Sheet BCH** và dán nội dung
[`bch/Code.gs`](bch/Code.gs) (file `appsscript.json` dùng chung bản ở thư mục này).
