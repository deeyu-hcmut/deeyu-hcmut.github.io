# Đồng bộ danh sách sinh viên Google Sheet ↔ cổng thông tin

Script Apps Script gắn vào Google Sheet danh sách sinh viên, tự đồng bộ với collection `members` trên Firestore
(tab **Sinh viên** trong trang Quản trị).

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
- **Tiết kiệm hạn mức Firestore** (gói miễn phí: 50.000 lượt đọc/ngày cho cả trang web): mỗi lần chạy chỉ đọc những dòng
  vừa sửa trong sheet và những hồ sơ vừa sửa trên web. Không ai sửa gì thì một lần chạy tốn khoảng 1 lượt đọc.
  Script lưu dấu vết trong tab ẩn `_dong_bo` — đừng xoá/sửa tab này (xoá thì lần sau sẽ đọc lại toàn bộ một lần).
  Menu **Đồng bộ toàn bộ** đọc lại mọi hồ sơ (tốn bằng số sinh viên), chỉ dùng khi nghi dữ liệu lệch.

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
6. Kiểm tra trên web (Quản trị → Sinh viên) thấy dữ liệu đúng thì bấm
   **Đồng bộ web → Bật tự động (mỗi 15 phút)**.

Tắt: **Đồng bộ web → Tắt tự động**.

## Tab Sinh viên đọc thẳng từ Sheet (web app, tuỳ chọn)

Mặc định tab **Sinh viên** trong trang Quản trị đọc cả collection `members` mỗi lần mở (tốn bằng số sinh viên). Bật web app thì tab
này đọc/ghi qua Sheet: mỗi lần mở chỉ tốn khoảng 1 lượt đọc Firestore (script đồng bộ phần thay đổi rồi trả danh sách từ Sheet).

1. Cập nhật `Code.gs` **và** `appsscript.json` (có thêm khối `webapp`) như phần Cài đặt, bấm 💾 Lưu.
2. **Triển khai → Tùy chọn triển khai mới → Ứng dụng web**: *Thực thi bằng* **Tôi**, *Người có quyền truy cập* **Bất kỳ ai**
   → **Triển khai** → cấp quyền nếu được hỏi → sao chép **URL ứng dụng web** (kết thúc bằng `/exec`).
   Sau này sửa `Code.gs` phải **Triển khai → Quản lý bản triển khai → ✏ → Phiên bản mới** thì web mới nhận code mới.
3. Chạy **Đồng bộ web → Đồng bộ toàn bộ** một lần (script lưu thêm liên kết tài khoản sinh viên vào tab ẩn `_dong_bo`;
   lần chạy tự động đầu tiên sau khi cập nhật cũng tự làm việc này).
4. GitHub repo → Settings → Secrets and variables → Actions → **Variables** → thêm `VITE_MEMBERS_SHEET_URL` = URL ở bước 2,
   rồi chạy lại workflow Deploy (hoặc đặt biến trong `.env.local` khi chạy local). Để trống = tab Sinh viên đọc Firestore như cũ.

Lưu ý:

- URL công khai nhưng mọi yêu cầu phải kèm token đăng nhập Firebase của tài khoản **Super Admin / Ban QLNS-CTSV** (script kiểm tra
  lại `admins/{email}` trên Firestore), người khác nhận lỗi không có quyền.
- Thêm/sửa/xoá sinh viên trên web được ghi thẳng vào **cả Sheet lẫn Firestore**. Thêm sinh viên cần có tab cùng tên khóa (ví dụ `K24`)
  trong Sheet, nếu không web báo lỗi.
- Nếu `apiKey` Firebase bị giới hạn theo HTTP referrer thì script (gọi từ máy chủ Google) bị từ chối khi xác thực token:
  bỏ giới hạn referrer cho key này hoặc dùng key không giới hạn.
- Hạn mức Apps Script (UrlFetch 20.000 lần/ngày với tài khoản thường) đủ cho nhu cầu quản trị; mỗi lần mở tab tốn khoảng 5 lần.
- Firestore hết hạn mức ngày thì tab vẫn hiện danh sách theo Sheet, nhưng sửa/xoá sẽ báo lỗi.

## Khi có lỗi

- Xem nhật ký: Apps Script → **Lần thực thi** (Executions).
- `Firestore trả lỗi 403 … PERMISSION_DENIED`: tài khoản chạy script chưa có quyền trên project `deeyu-hcmut`
  (xem mục Yêu cầu), hoặc thiếu quyền `serviceusage.services.use` (vai trò Owner/Editor đều có).
- `Không tab nào có cột MSSV ở dòng tiêu đề.`: dòng 1 của các tab không có cột tên `MSSV`.
- Đổi người quản lý sheet: người mới làm lại bước 5–6 bằng tài khoản của họ (và người cũ bấm Tắt tự động).

---

# Danh sách BCH (trang Cơ cấu Tổ chức)

Script riêng [`bch/Code.gs`](bch/Code.gs), gắn vào **file Google Sheet BCH** (khác file sinh viên), đồng bộ với
collection `bch` (tab **BCH & Trưởng, phó ban CTV** trong trang Quản trị và trang công khai Cơ cấu Tổ chức).

## Cách đồng bộ

- Cột `Tổ chức, Họ và tên, Chức vụ, Ban/Bộ phận, Email, Giới thiệu`: **Sheet → Web**. Ô trống giữ nguyên dữ liệu trên web.
- Mỗi người được ghép theo **Tổ chức + Họ và tên** (không phân biệt hoa thường). Đổi tên trong sheet = người mới trên web
  (người cũ vẫn còn, xoá trên web hoặc bật chế độ xoá bên dưới).
- **Ảnh đại diện và Chi đoàn** không có trong sheet: sửa trên web (nút Sửa), đồng bộ không đụng tới.
- **Thứ tự hiển thị trên web = thứ tự tab, rồi thứ tự dòng** trong sheet. Muốn Bí thư đứng đầu thì để ở dòng 2 của tab đầu.
- Đọc mọi tab có cột `Họ và tên` ở dòng 1 (ví dụ 3 tab BCH Đoàn / BCH Hội / Trưởng, phó ban CTV).
  Ô **Tổ chức** ghi `Đoàn Thanh niên`, `Hội Sinh viên` hoặc `Đội CTV`; để trống thì lấy theo tên tab
  (tên tab có chữ "Đoàn", "Hội" hoặc "CTV" / "Trưởng, phó ban").
- Chạy tự động chỉ đọc Firestore khi sheet BCH có thay đổi; bấm **Đồng bộ ngay** thì luôn đồng bộ.
- Người chỉ có trên web được thêm dòng vào tab cùng tổ chức. Xoá dòng trong sheet **không** xoá trên web, trừ khi sửa
  `const XOA_NGUOI_KHONG_CO_TRONG_SHEET = false;` thành `true` (dùng khi đổi nhiệm kỳ: web khớp đúng sheet,
  ai không còn trong sheet bị xoá khỏi web).

## Cài đặt

Giống mục [Cài đặt](#cài-đặt-một-lần) ở trên, nhưng làm trong **file Google Sheet BCH** và dán nội dung
[`bch/Code.gs`](bch/Code.gs) (file `appsscript.json` dùng chung bản ở thư mục này).

---

# Gửi email tự động

Script riêng [`email/Code.gs`](email/Code.gs) gửi email bằng **Gmail của người cài đặt** (miễn phí, không cần gói Blaze).
Không gắn vào sheet nào: tạo một project Apps Script độc lập.

## Email nào được gửi

| Khi nào | Nội dung |
|---|---|
| Sinh viên đăng ký sự kiện trên web | Xác nhận đăng ký, mã vé, thời gian, địa điểm |
| Ban Tổ chức quét QR điểm danh | Ghi nhận điểm danh thành công |
| **Trong vòng 24 giờ trước giờ bắt đầu** sự kiện | Nhắc sự kiện sắp diễn ra, kèm mã vé |

- Script chạy **mỗi 5 phút**, nên email đến chậm tối đa khoảng 5 phút.
- Kết quả xem ở **Quản trị → Nhật ký Email**: `Đang chờ` → `Đã gửi`, hoặc `Lỗi` nếu địa chỉ email sai (không gửi lại).
- **Giới hạn của Google:** Gmail cá nhân ~**100 email/ngày**, tài khoản Google Workspace ~**1.500 email/ngày**.
  Hết hạn mức thì phần còn lại tự gửi vào hôm sau. Email gửi đi mang địa chỉ của người cài script, tên hiển thị
  `Đoàn - Hội Khoa Điện - Điện tử`. Nên dùng một tài khoản Gmail chung của Đoàn - Hội thay vì Gmail cá nhân.
- Email xác nhận đăng ký và email nhắc 24h kèm **mã QR của vé** (nội dung QR là mã vé, giống vé trên web). Ảnh QR do dịch vụ công cộng
  `api.qrserver.com` tạo (mã vé được gửi tới dịch vụ này); nếu không gọi được thì email vẫn gửi, chỉ thiếu ảnh.
- Chỉ gửi xác nhận cho đăng ký **sau khi** bật tự động; các đăng ký cũ không nhận email xác nhận (nhưng vẫn nhận nhắc 24h).
- Mỗi sự kiện chỉ nhắc một lần. Đổi ngày/giờ bắt đầu thì nhắc lại theo giờ mới.

## Cài đặt (một lần)

1. Đăng nhập tài khoản Google sẽ dùng để gửi email. Tài khoản này phải là **Owner hoặc Editor của project Firebase
   `deeyu-hcmut`** (Firebase console → ⚙ Project settings → Users and permissions → Add member).
2. Vào <https://script.google.com> → **Dự án mới**. Đặt tên, ví dụ `Email cổng thông tin`.
3. **⚙ Cài đặt dự án** → tích **Hiển thị tệp kê khai "appsscript.json" trong trình chỉnh sửa**.
4. Quay lại **Trình chỉnh sửa**:
   - Mở `Code.gs`, xoá hết, dán toàn bộ nội dung [`email/Code.gs`](email/Code.gs).
   - Mở `appsscript.json`, xoá hết, dán nội dung [`email/appsscript.json`](email/appsscript.json)
     (khác bản dùng cho sheet, vì cần quyền gửi email).
   - Bấm 💾 Lưu.
5. Trên thanh công cụ chọn hàm **`guiThu`** → bấm **▶ Chạy**. Lần đầu Google hỏi quyền:
   **Xem lại quyền** → chọn tài khoản → **Nâng cao → Đi tới … (không an toàn)** (đây là script của chính bạn) → **Cho phép**.
   Kiểm tra hộp thư của bạn có email "Gửi thử email từ cổng thông tin".
6. Chọn hàm **`batTuDong`** → **▶ Chạy**. Xong, từ giờ email tự gửi mỗi 5 phút.
7. Thử: đăng ký một sự kiện trên web bằng email của bạn, đợi vài phút là có email xác nhận.

Tắt: chọn hàm **`tatTuDong`** → **▶ Chạy**.

## Khi có lỗi

- Xem nhật ký: Apps Script → **Lần thực thi** (Executions). Mỗi lần chạy ghi `Xác nhận đăng ký: …, Email chờ gửi: …, Còn … email hôm nay`.
- `Firestore trả lỗi 403 … PERMISSION_DENIED`: tài khoản chưa có quyền trên project `deeyu-hcmut` (bước 1).
- Email rơi vào thư rác: nhắc sinh viên đánh dấu "Không phải thư rác"; dùng Gmail chung của Đoàn - Hội giúp ít bị chặn hơn.
- Đổi tài khoản gửi: người cũ chạy `tatTuDong`, người mới làm lại từ bước 1.
