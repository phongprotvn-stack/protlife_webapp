# Đặc tả thiết kế: Ghi ký ức bằng giọng nói + Đính kèm ảnh/tài liệu

> Tài liệu này mô tả cách nâng cấp tính năng tạo Ký ức hiện có (KHÔNG viết lại từ đầu).
> Dựa trên review trực tiếp code thật ngày hôm nay: `src/app/memories/add/page.tsx`,
> `src/components/events/event-detail.tsx`, bảng `files` trong `supabase/schema.sql`.

## 0. Vấn đề cấu trúc cần xử lý TRƯỚC — hợp nhất 2 luồng trùng lặp

Hiện có **2 nơi tạo ký ức độc lập, không dùng chung code**:
1. `src/app/memories/add/page.tsx` — trang riêng, tạo ký ức trống (`EventID: null` cố định).
2. Form inline trong `src/components/events/event-detail.tsx` (quanh dòng 320-340, hàm `openMemoryForm`) — tạo ký ức có sẵn `EventID` từ sự kiện.

**Việc cần làm trước tiên:** tách phần form (mood picker, tiêu đề, nội dung, ảnh) thành 1 component dùng chung, ví dụ `src/components/memories/memory-form-fields.tsx`, nhận props `eventId?: string` (optional). Cả `/memories/add/page.tsx` và `event-detail.tsx` đều import và dùng lại component này thay vì code lặp lại. Toàn bộ tính năng mô tả ở Phần 1 và 2 dưới đây chỉ cần thêm **đúng 1 lần** vào component dùng chung này.

## 1. Ghi ký ức bằng giọng nói

### 1.1 Vị trí thêm

Ngay trong component `memory-form-fields.tsx`, ở field "Nội dung" hiện có (dòng ~87-92 của `add/page.tsx` cũ), thêm 1 nút mic bên cạnh label:

```
Nội dung                                    🎙️ (nút mic, góc phải label)
┌─────────────────────────────────────┐
│ [textarea hiện có, giữ nguyên style] │
└─────────────────────────────────────┘
```

### 1.2 Công nghệ — dùng đúng Web Speech API đã thống nhất (miễn phí, không dùng Google Cloud Speech trả phí)

```tsx
const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const supported = !!SpeechRecognitionCtor;
```

### 1.3 Hành vi

- Bấm nút mic lần 1 → bắt đầu ghi, nút chuyển trạng thái "đang nghe" (đổi icon/màu, có thể thêm hiệu ứng pulse nhẹ bằng CSS animation).
- `recognition.lang = 'vi-VN'`, `continuous = true`, `interimResults = true`.
- Transcript (cả interim + final) **nối tiếp vào cuối nội dung đã có sẵn trong textarea** — KHÔNG ghi đè nội dung cũ nếu người dùng đã gõ tay trước đó. Xử lý: lưu vị trí con trỏ / độ dài text trước khi bắt đầu ghi, chèn transcript mới vào đúng vị trí đó.
- Bấm mic lần 2 → dừng ghi (`recognition.stop()`).
- Nếu `!supported` (trình duyệt không hỗ trợ — thường gặp khi mở app đã cài trên iOS PWA như đã ghi nhận trước đó): ẩn nút mic, không hiện gì gây rối, người dùng vẫn gõ tay bình thường.
- Lỗi ghi âm (`recognition.onerror`): hiện toast ngắn "Không nghe rõ, thử lại hoặc gõ tay", không chặn form.

### 1.4 Không cần sửa gì ở backend

Vì transcript chỉ đổ vào field `Content` (text) đã tồn tại sẵn trong bảng `memories` — không cần cột mới, không cần Edge Function.

## 2. Đính kèm ảnh (nâng cấp) + tài liệu (mới)

### 2.1 Hiện trạng cần sửa — field Ảnh đang GIẢ

Code cũ (`add/page.tsx` dòng 94-108): field "Ảnh" chỉ là **1 ô nhập text dán URL**, không có upload file thật:
```tsx
<input value={image} onChange={...} placeholder="https://... hoặc để trống" />
```
Đây là mock — người dùng phải tự có sẵn URL ảnh ở đâu đó, không upload trực tiếp từ máy được.

### 2.2 Ảnh — giữ CẢ 2 chế độ: dán URL hoặc upload thật

**Quyết định thiết kế:** không thay hẳn URL bằng upload — giữ cả 2, cho người dùng tự
chọn, vì lý do dung lượng: Supabase Storage free tier chỉ có 1GB (đã nhắc ở phần Cài
đặt/Dữ liệu trước đó) — nếu chỉ cho upload, ảnh chất lượng cao từ điện thoại (thường
3-8MB/ảnh) sẽ ăn hết 1GB rất nhanh. Cho phép dán URL (ảnh host ở nơi khác, VD Google
Photos share link, ảnh có sẵn trên mạng) giúp giảm tải cho storage của chính app.

**Giao diện — 2 tab nhỏ, tái dùng đúng pattern "Mật khẩu / Magic Link" đã làm ở trang
Đăng nhập trước đó** (khay nền xám, tab active nền trắng):

```
┌─────────────┬─────────────┐
│  🔗 Dán link │ 📤 Tải ảnh lên │   ← 2 tab, mặc định chọn "Dán link"
└─────────────┴─────────────┘
```

**Tab "Dán link"** (giữ nguyên y hệt code cũ, không đổi gì):
- Input text URL như hiện tại (dòng 100-101 code cũ), preview ảnh giữ nguyên.

**Tab "Tải ảnh lên"** (mới):
- `<input type="file" accept="image/*">` (ẩn, kích hoạt qua click khung preview).
- **BẮT BUỘC nén/resize ảnh ở phía trình duyệt TRƯỚC khi upload** (dùng Canvas API,
  không cần thư viện ngoài) — giới hạn cạnh dài nhất tối đa 1600px, chất lượng JPEG
  ~80% — để 1 ảnh chụp điện thoại 8MB thường giảm còn khoảng 200-400KB trước khi gửi
  lên Storage. Đây là lớp bảo vệ dung lượng THẬT SỰ, quan trọng hơn cả việc có tab URL
  hay không — vì nếu người dùng vẫn chọn tải lên, ảnh vẫn phải nhỏ gọn.
- Sau khi nén xong, upload lên Supabase Storage (bucket mới `memory-images`, policy
  chỉ cho user đã đăng nhập upload vào đúng thư mục của mình theo `user_id`).
- Từ chối thẳng (báo lỗi rõ ràng, không cố nén) nếu file gốc > 20MB — tránh treo trình
  duyệt khi cố nén ảnh quá khổng lồ.
- Lấy `public URL` sau khi upload xong, gán vào field `Image` (cột đã có sẵn, không
  đổi schema) — CÙNG 1 cột với chế độ URL, chỉ khác nguồn gốc giá trị.
- Preview ảnh dùng chung logic hiển thị cho cả 2 tab (không cần 2 khối preview riêng).

### 2.3 Thêm mới — Đính kèm tài liệu (Word/Notepad/Text/PDF...)

Đặt thành 1 khối riêng, dưới field Ảnh, tên "Đính kèm tài liệu (tuỳ chọn)":

```
Đính kèm tài liệu (tuỳ chọn)
┌───────────────────────────────────┐
│  📎 Chọn file — .docx, .txt, .pdf │
└───────────────────────────────────┘
[danh sách file đã chọn, dạng chip]
 📄 ke-hoach-du-lich.docx  (12 KB)  ✕
 📝 ghi-chu.txt            (2 KB)   ✕
```

- Input `<input type="file" multiple accept=".doc,.docx,.txt,.pdf,.rtf">`.
- Mỗi file chọn xong: upload lên Supabase Storage (bucket mới `memory-attachments`), sau khi tạo `MemoryID` thành công (bước lưu ký ức), **insert 1 dòng vào bảng `files` đã có sẵn**:
  ```
  INSERT INTO files (FileID, Name, Url, Type, Size, EntityID, EntityType, user_id)
  VALUES (generate_id(), file.name, uploaded_url, file.type, file.size, memoryId, 'Memory', auth.uid());
  ```
- Icon hiển thị theo `Type`: 📄 cho .docx/.pdf, 📝 cho .txt, 📦 mặc định cho loại khác.
- Nút ✕ trên mỗi chip: xoá khỏi danh sách đang chọn (trước khi lưu) hoặc xoá dòng trong bảng `files` + file trên Storage (nếu đang sửa ký ức đã lưu).
- Giới hạn hợp lý: tối đa 5 file/ký ức, mỗi file tối đa 10MB (kiểm tra phía client trước khi upload để tránh phí băng thông Storage vô ích).

### 2.4 Không cần đổi bảng `files` — chỉ cần thêm 2 bucket Storage mới

```sql
-- Chạy trong Supabase Storage dashboard hoặc SQL, tạo 2 bucket:
-- memory-images (public read, user chỉ ghi được vào thư mục của chính mình)
-- memory-attachments (private, chỉ chủ sở hữu đọc được qua signed URL)
```

## 3. Component dùng chung — tổng hợp state cần có

```tsx
interface MemoryFormFieldsProps {
  eventId?: string;              // undefined nếu tạo độc lập
  initialData?: Partial<Memory>; // để dùng lại khi sửa ký ức có sẵn
  onSaved: (memoryId: string) => void;
}
```

State nội bộ: `title, content, moodEmoji, imageFile, imagePreviewUrl, attachedFiles[], isRecording, saving, error`.

## 4. Prompt mẫu gửi Hermes (làm theo đúng thứ tự, từng phần)

### Bước A — Hợp nhất component trước
```
Tách phần form trong src/app/memories/add/page.tsx (mood picker, title, content, image)
thành 1 component dùng chung tại src/components/memories/memory-form-fields.tsx, nhận
prop eventId? optional. Sửa lại cả memories/add/page.tsx và event-detail.tsx (hàm
openMemoryForm) để dùng chung component này, KHÔNG giữ 2 bản code riêng như hiện tại.
Giữ nguyên toàn bộ hành vi hiện có, chỉ gộp code, chưa thêm tính năng mới.
```

### Bước B — Thêm voice
```
Trong memory-form-fields.tsx vừa tạo, thêm nút mic cạnh label "Nội dung", dùng Web
Speech API (window.SpeechRecognition || window.webkitSpeechRecognition), lang='vi-VN',
continuous=true, interimResults=true. Transcript nối vào CUỐI nội dung đã gõ sẵn,
không ghi đè. Ẩn nút nếu trình duyệt không hỗ trợ. Xem chi tiết hành vi ở mục 1.3 tài
liệu docs/voice-attachment-memory-spec.md.
```

### Bước C — Thêm chế độ upload ảnh SONG SONG với URL (không thay thế)
```
Tạo Storage bucket mới "memory-images" (public read). Trong memory-form-fields.tsx,
GIỮ NGUYÊN ô input URL hiện có, thêm 2 tab nhỏ phía trên field Ảnh: "🔗 Dán link"
(mặc định, chính là input cũ) và "📤 Tải ảnh lên" (mới). Tab mới cho chọn file ảnh,
BẮT BUỘC nén/resize bằng Canvas API trước khi upload (cạnh dài tối đa 1600px, chất
lượng ~80%, từ chối file gốc >20MB), rồi mới upload lên bucket, gán public URL vào
CÙNG cột Image như tab URL. Xem chi tiết mục 2.2 — đây KHÔNG phải thay thế input URL,
mà là thêm lựa chọn thứ 2 để tránh tốn Storage 1GB free tier nếu người dùng cứ upload
ảnh gốc dung lượng cao.
```

### Bước D — Thêm đính kèm tài liệu
```
Tạo Storage bucket mới "memory-attachments" (private). Thêm khối "Đính kèm tài liệu"
theo đúng mục 2.3 — upload nhiều file, sau khi lưu memory thành công thì insert vào
bảng files đã có sẵn (EntityType='Memory', EntityID=memoryId). Giới hạn 5 file, tối đa
10MB/file. Hiển thị dạng chip có icon theo loại file + nút xoá.
```

