# ĐẶC TẢ KỸ THUẬT: ĐỊNH DẠNG NGÀY THÁNG NHẬP LIỆU (DD/MM/YYYY)

Tài liệu này hướng dẫn **Hermes Desktop** cách thay đổi toàn bộ các trường nhập liệu ngày tháng trong dự án **Prot Life** từ định dạng mặc định của trình duyệt (`mm/dd/yyyy` hoặc `yyyy-mm-dd`) sang định dạng tiếng Việt chuẩn (`dd/mm/yyyy`) ngay cả khi đang nhập.

---

### 1. VẤN ĐỀ HIỆN TẠI
Dự án đang sử dụng `<input type="date">`. Trình duyệt hiển thị định dạng này dựa trên ngôn ngữ hệ thống của người dùng (thường là `mm/dd/yyyy`), gây nhầm lẫn khi nhập liệu mặc dù dữ liệu hiển thị ra ngoài đã là `dd/mm/yyyy`.

---

### 2. GIẢI PHÁP: TẠO THÀNH PHẦN `DateInput` TÙY CHỈNH

Thay vì dùng input native, chúng ta sẽ tạo một component `DateInput` sử dụng `type="text"` với logic tự động định dạng.

#### Bước 1: Tạo file `src/components/ui/date-input.tsx`
Hermes cần tạo thành phần này với các tính năng:
*   Tự động thêm dấu `/` khi người dùng gõ.
*   Chặn các ký tự không phải số.
*   Chuyển đổi qua lại giữa `dd/mm/yyyy` (hiển thị) và `yyyy-mm-dd` (lưu vào database).

#### Bước 2: Thay thế toàn bộ `input type="date"`
Hermes cần quét toàn bộ dự án và thay thế các thẻ input date bằng component `DateInput` mới.

---

### 3. CÂU LỆNH (PROMPT) YÊU CẦU HERMES DESKTOP

Bạn hãy copy đoạn lệnh này và gửi cho Hermes Desktop:

> **Yêu cầu:** "Tôi muốn thay đổi toàn bộ các trường nhập liệu ngày tháng trong app Prot Life sang định dạng `dd/mm/yyyy` khi nhập. Hãy thực hiện các bước sau:
> 
> 1. **Tạo component `DateInput`** tại `src/components/ui/date-input.tsx`. Component này phải:
>    - Sử dụng `<input type="text">` để có toàn quyền kiểm soát hiển thị.
>    - Có placeholder là `dd/mm/yyyy`.
>    - Tự động thêm dấu `/` khi tôi gõ (ví dụ gõ '2512' thành '25/12/').
>    - Nhận giá trị `value` là định dạng `yyyy-mm-dd` (từ database) và hiển thị ra là `dd/mm/yyyy`.
>    - Khi `onChange`, phải trả về định dạng `yyyy-mm-dd` để lưu vào database.
> 
> 2. **Thay thế tất cả các thẻ `<input type="date" ... />`** trong các file sau bằng component `DateInput` vừa tạo:
>    - `src/components/memories/memory-form-fields.tsx`
>    - `src/components/contacts/add-contact-modal.tsx`
>    - `src/components/events/add-event-modal.tsx`
>    - `src/components/goals/goal-detail.tsx`
>    - (Và các file khác có sử dụng input date).
> 
> 3. Đảm bảo giao diện vẫn giữ phong cách `input-glass` hoặc `input-ios` như cũ."

---
*Tài liệu được soạn thảo bởi Manus - Chuyên gia tối ưu hóa trải nghiệm người dùng.*
