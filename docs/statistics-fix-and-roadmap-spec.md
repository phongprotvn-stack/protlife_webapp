# Đặc tả: Sửa lỗi Thống kê + Đề xuất xây dựng tiếp

> Dựa trên review trực tiếp `src/app/statistical/page.tsx` (383 dòng) và
> `src/app/statistical/report/[type]/page.tsx` (232 dòng). Phát hiện **1 lỗi thật
> đang khiến trang Thống kê chính hoàn toàn không dùng được** — không phải mock data,
> mà là lỗi tên cột khiến query thất bại thật.

## 0. ƯU TIÊN SỐ 1 — Sửa lỗi tên cột (trang đang bị treo loading mãi mãi)

### Bằng chứng

`statistical/page.tsx` dòng 61-68 gọi 8 query cùng lúc qua `Promise.all([...])`. 3 query
đầu (đếm số lượng, dùng `select('*', {count})`) là an toàn. Nhưng **5 query sau dùng
sai tên cột** — viết theo kiểu `snake_case` thường gặp, trong khi schema thật của
project dùng `PascalCase` có ngoặc kép (xem `supabase/schema.sql`):

| Dòng | Query hiện tại (SAI) | Tên cột thật trong schema |
|---|---|---|
| 64 | `.select('id,name,created_at')` trên `contacts` | `"ContactID"`, `"Name"`, `"CreatedDate"` |
| 65 | `.select('id,title,start_time')` trên `events` | `"EventID"`, `"Title"`, `"StartDate"` |
| 66 | `.select('id,title,created_at')` trên `memories` | `"MemoryID"`, `"Title"`, `"CreatedDate"` |
| 67 | `.select('start_time')` trên `events` | `"StartDate"` |
| 68 | `.select('relation_type')` trên `contacts` | `"Relationship"` |

**Hậu quả:** Postgres/PostgREST trả lỗi "column does not exist" cho bất kỳ query nào
trong 5 query này. Vì cả 8 query nằm chung 1 `Promise.all()`, **chỉ cần 1 cái lỗi là
TOÀN BỘ khối bị reject**, rơi thẳng vào `catch`, biến `stats` không bao giờ được gán
giá trị → trang hiển thị **"Đang tải thống kê..." vĩnh viễn**, không bao giờ ra được 4
thẻ số liệu, biểu đồ, hay danh sách hoạt động gần đây — dù giao diện đã code khá đầy
đủ.

### Cách sửa

Đổi đúng tên cột theo bảng trên, giữ nguyên logic còn lại (không đổi cấu trúc code).

### Prompt gửi Hermes
```
Trang src/app/statistical/page.tsx đang bị lỗi nghiêm trọng: 5 câu query ở dòng 64-68
dùng sai tên cột (snake_case) so với schema thật (PascalCase có ngoặc kép). Vì cả 8
query nằm chung 1 Promise.all(), chỉ cần 1 câu lỗi là toàn bộ Promise.all bị reject,
khiến trang hiển thị "Đang tải thống kê..." vĩnh viễn, không bao giờ hiện được dữ liệu
dù UI đã code đầy đủ.

Sửa đúng theo bảng mapping sau (xem thêm docs/statistics-fix-and-roadmap-spec.md mục 0):
- contacts: id→"ContactID", name→"Name", created_at→"CreatedDate", relation_type→"Relationship"
- events: id→"EventID", title→"Title", start_time→"StartDate"
- memories: id→"MemoryID", title→"Title", created_at→"CreatedDate"

Sau khi sửa, chạy thử trang thật, xác nhận không còn kẹt ở "Đang tải..." nữa, và dán
cho tôi xem console có lỗi PostgREST nào khác còn sót không.
```

---

## 1. `report/[type]` — không lỗi, nhưng rỗng hoàn toàn theo thiết kế

Khác hẳn lỗi ở trên — file này **không hề gọi Supabase**. Biến `reportConfigs` (dòng
13-40) là 1 object tĩnh, mọi loại báo cáo đều gán cứng `data: []` (mảng rỗng) — nghĩa
là trang này chưa từng được nối dữ liệu thật ngay từ đầu, không phải bị lỗi runtime,
mà là code chưa hoàn thiện.

### Việc cần làm
Ứng với mỗi `type` (route param, VD `danh-sach-quan-he`, `danh-sach-su-kien`...), query
đúng bảng tương ứng, gán vào `data` thay vì mảng rỗng cứng.

### Prompt gửi Hermes
```
Trong src/app/statistical/report/[type]/page.tsx, object reportConfigs (dòng 13-40)
đang gán cứng data: [] cho mọi loại báo cáo — trang không gọi Supabase, luôn hiện
bảng rỗng dù có bao nhiêu dữ liệu thật. Sửa: với mỗi type (dựa theo useParams()), gọi
đúng service tương ứng (contactService/eventService/memoryService đã có sẵn) để lấy
dữ liệu thật, gán vào config.data thay vì rỗng cứng. Giữ nguyên toàn bộ UI tìm
kiếm/lọc ngày/export đã có, chỉ đổi nguồn dữ liệu.
```

---

## 2. Đề xuất xây dựng tiếp — sau khi 2 lỗi trên đã sửa xong

UI đã có sẵn khá tốt (4 thẻ số liệu, biểu đồ cột theo tháng có tab Quan hệ/Sự kiện,
phân bổ theo `byRelation`, danh sách hoạt động gần đây, xuất JSON) — đây là nền tảng
tốt để mở rộng, KHÔNG cần viết lại từ đầu. Đề xuất theo 3 giai đoạn:

### Giai đoạn A — Mở rộng số liệu đã có sẵn khung, còn thiếu nguồn
- Thêm khối **Mục tiêu** và **Tổ chức** vào thống kê (sau khi 2 trang này được nối
  thật theo `goals-documents-wiring-spec.md` đã làm trước đó) — VD "3 mục tiêu đang
  thực hiện, 1 đã hoàn thành".
- Thêm **so sánh với kỳ trước** (VD "Tháng này gặp gỡ nhiều hơn 20% so với tháng
  trước") — tính toán đơn giản từ dữ liệu `byMonth` đã có sẵn trong code, chỉ cần
  thêm phép trừ/chia phần trăm, không cần query mới.

### Giai đoạn B — Kết nối với Life Score (nếu trang AI Insight đã có khái niệm này)
- Nếu `ai-insight/page.tsx` đã có tính "Life Score" (điểm số tổng hợp cuộc sống), nên
  hiện xu hướng điểm số này theo thời gian ngay tại Thống kê — biến "chỉ số một lần"
  thành "biểu đồ diễn biến", giá trị cao hơn hẳn cho người dùng theo dõi lâu dài.

### Giai đoạn C — Xuất báo cáo đẹp, dùng lại hạ tầng đã thiết kế
- Nút "Xuất JSON" hiện có ở Thống kê nên dùng chung thư viện `docx`/`xlsx`/`jspdf`
  đã đề xuất ở `export-import-spec.md` — xuất được báo cáo Thống kê dạng Word/PDF
  trình bày đẹp, không chỉ JSON thô.

**Không đề xuất làm Giai đoạn B/C ngay** — nên hoàn tất sửa lỗi (Mục 0, 1) và chạy ổn
định trước, quay lại giai đoạn mở rộng sau khi đã xác nhận số liệu cơ bản hiển thị
đúng.

