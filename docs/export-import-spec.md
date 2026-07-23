# Đặc tả: Xuất báo cáo & Nhập file THẬT (thay phần UI-only cũ)

> Hiện trạng: Tab Dữ liệu đã có modal "Xuất báo cáo" với bản xem trước dạng in
> (print-ready preview) — nhưng đó CHỈ LÀ GIAO DIỆN, chưa có logic tạo file Word/
> Excel/PDF thật phía sau. Tương tự, nút "Nhập từ file" chưa đọc/ghi dữ liệu thật.

## 1. Xuất báo cáo — chọn đúng thư viện miễn phí, chạy được trên trình duyệt

Không cần server riêng — cả 3 định dạng đều tạo được ngay trên trình duyệt (client-side),
miễn phí hoàn toàn, không giới hạn số lần dùng:

| Định dạng | Thư viện đề xuất | Ghi chú |
|---|---|---|
| Word (.docx) | `docx` (npm package, MIT license) | Tạo file .docx thật từ JS, tải về qua `file-saver` |
| Excel (.xlsx) | `xlsx` (SheetJS, đã phổ biến) | Chuyển mảng object JS thành sheet, xuất file |
| PDF | `jspdf` + `jspdf-autotable` | Tạo PDF có bảng biểu, hỗ trợ tiếng Việt cần nhúng font riêng (xem mục 1.3) |

### 1.1 Luồng chung cho cả 3 định dạng

1. Người dùng chọn phạm vi (Tất cả / Người thân / Sự kiện / Ký ức) + khoảng thời gian
   ở modal đã có sẵn.
2. Query đúng dữ liệu thật từ Supabase theo phạm vi đã chọn (dùng lại các service đã
   có: `contactService`, `eventService`, `memoryService`...).
3. Đưa dữ liệu vào đúng thư viện tương ứng, sinh file, dùng `file-saver` (hoặc thẻ
   `<a download>` tạo từ Blob) để trình duyệt tự tải xuống — không cần upload lên
   server rồi tải lại, tất cả xử lý ngay trên máy người dùng.

### 1.2 Riêng PDF — lưu ý font tiếng Việt

`jsPDF` mặc định KHÔNG hỗ trợ dấu tiếng Việt (font Latin cơ bản). Cần nhúng 1 font
Unicode hỗ trợ tiếng Việt (VD Roboto, Noto Sans — cả 2 đều miễn phí, giấy phép mở) vào
file base64 rồi `addFont()` vào jsPDF trước khi in chữ có dấu. Nếu bỏ qua bước này,
chữ tiếng Việt sẽ hiện lỗi (mất dấu hoặc ô vuông).

### 1.3 Prompt gửi Hermes — Xuất báo cáo
```
Cài 3 package: docx, xlsx, jspdf + jspdf-autotable, file-saver (đều free/MIT).

Modal "Xuất báo cáo" ở Tab Dữ liệu (settings/page.tsx) hiện chỉ có UI xem trước, nút
"Tải xuống" chưa có logic thật. Hãy code:
1. Khi bấm "Tải xuống", query dữ liệu thật theo đúng phạm vi/thời gian đã chọn (dùng
   lại contactService/eventService/memoryService có sẵn).
2. Nếu chọn Word: dùng thư viện docx tạo file .docx có tiêu đề, bảng dữ liệu.
3. Nếu chọn Excel: dùng xlsx tạo sheet từ mảng dữ liệu, xuất .xlsx.
4. Nếu chọn PDF: dùng jsPDF + jspdf-autotable, PHẢI nhúng font Unicode hỗ trợ tiếng
   Việt (Roboto hoặc Noto Sans, tải file .ttf free, convert base64) trước khi in chữ
   có dấu — không dùng font mặc định của jsPDF vì sẽ lỗi dấu.
5. Dùng file-saver để tải file về máy người dùng.
Nút "In ngay" giữ nguyên như cũ (window.print() cho bản xem trước HTML), không đổi.
```

## 2. Nhập từ file — CSV/XLSX/VCF/ICS

### 2.1 Thư viện

| Định dạng nhập | Thư viện |
|---|---|
| .csv | `papaparse` |
| .xlsx | `xlsx` (dùng chung với phần xuất ở trên) |
| .vcf (danh bạ) | Tự viết parser đơn giản (định dạng vCard là text thuần, không cần thư viện ngoài cho nhu cầu cơ bản) |
| .ics (lịch) | `ical.js` hoặc tự parse (định dạng iCalendar cũng là text thuần có cấu trúc rõ ràng) |

### 2.2 Luồng xử lý — BẮT BUỘC có bước xem trước, không lưu thẳng

**Quan trọng:** không được đọc file xong lưu thẳng vào database ngay — dữ liệu từ file
ngoài luôn có rủi ro sai định dạng (ngày tháng sai, thiếu cột, trùng lặp với dữ liệu
đã có). Luồng bắt buộc:

1. Đọc file, parse thành mảng object.
2. **Hiện bảng xem trước** (giống Excel) — mỗi dòng dữ liệu sắp nhập, có thể tick
   chọn/bỏ chọn từng dòng.
3. Đánh dấu rõ dòng nào **nghi trùng** với dữ liệu đã có (so khớp gần đúng theo tên +
   số điện thoại đối với contacts, hoặc tên + ngày đối với events) — hiện cảnh báo màu
   vàng, để người dùng tự quyết định bỏ qua hay vẫn nhập.
4. Người dùng bấm "Xác nhận nhập" mới thực sự ghi vào Supabase — dùng
   `insert` hàng loạt (batch), không insert từng dòng một (chậm, tốn request).

### 2.3 Prompt gửi Hermes — Nhập từ file
```
Cài papaparse (đọc CSV), dùng lại xlsx đã cài ở phần Xuất báo cáo.

Nút "Nhập từ file trên máy" ở Tab Dữ liệu hiện chưa có logic. Code luồng:
1. Nhận file .csv/.xlsx/.vcf/.ics qua input file.
2. Parse thành mảng object theo đúng loại file (dùng papaparse cho csv, xlsx cho
   excel, tự viết parser đơn giản cho vcf/ics).
3. Hiện modal bảng xem trước TOÀN BỘ dòng dữ liệu sắp nhập, cho tick chọn/bỏ từng
   dòng, đánh dấu màu vàng dòng nghi trùng với dữ liệu đã có (so khớp gần đúng tên +
   số điện thoại cho contacts, tên + ngày cho events).
4. CHỈ khi người dùng bấm "Xác nhận nhập" mới thực sự insert vào Supabase, dùng insert
   hàng loạt (1 lệnh cho nhiều dòng), không insert từng dòng riêng lẻ.
KHÔNG được lưu thẳng vào database ngay sau khi đọc file — bắt buộc phải qua bước xem
trước và xác nhận thủ công.
```

