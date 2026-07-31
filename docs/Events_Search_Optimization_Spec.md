# ĐẶC TẢ KỸ THUẬT: TÌM KIẾM SỰ KIỆN NÂNG CAO (NGƯỜI THAM GIA & THỜI GIAN)

Tài liệu này hướng dẫn **Hermes Desktop** cách nâng cấp trang Sự kiện (`src/app/events/page.tsx`) để hỗ trợ tìm kiếm theo người tham gia và lọc theo khoảng thời gian.

---

### 1. CƠ CHẾ LỌC DỮ LIỆU MỚI

#### A. Tìm kiếm theo Người tham gia
*   **Vấn đề:** Hiện tại app chỉ hiển thị số lượng người tham gia, không cho phép tìm theo tên.
*   **Giải pháp:** 
    *   Trong hàm `loadEvents`, thực hiện fetch toàn bộ danh sách người tham gia kèm tên (join với bảng `contacts`).
    *   Tạo một `Map` ánh xạ `EventID` -> `Danh sách tên người tham gia`.
    *   Khi người dùng nhập tên vào ô tìm kiếm người tham gia, app sẽ kiểm tra xem sự kiện đó có chứa người đó không.

#### B. Lọc theo Khoảng thời gian
*   **Giải pháp:** 
    *   Thêm hai trường nhập liệu: **Từ ngày** và **Đến ngày**.
    *   Sử dụng component `DateInput` (đã tạo ở bước trước) để đảm bảo định dạng `dd/mm/yyyy`.
    *   Logic lọc: `event.StartDate >= fromDate` AND `event.StartDate <= toDate`.

---

### 2. THAY ĐỔI GIAO DIỆN (UI)

*   **Thanh công cụ:** Thêm một nút biểu tượng "Bộ lọc" (Filter) cạnh ô tìm kiếm chính.
*   **Vùng lọc nâng cao:** Khi nhấn nút Bộ lọc, hiển thị một hàng mới chứa:
    1.  Ô nhập tên người tham gia.
    2.  Ô chọn "Từ ngày".
    3.  Ô chọn "Đến ngày".
*   **Nút Reset:** Để xóa nhanh toàn bộ bộ lọc.

---

### 3. CÂU LỆNH (PROMPT) YÊU CẦU HERMES DESKTOP

Bạn hãy copy đoạn lệnh này và gửi cho Hermes Desktop:

> **Yêu cầu:** "Hãy giúp tôi nâng cấp tính năng tìm kiếm cho trang Sự kiện (`src/app/events/page.tsx`) như sau:
> 
> 1. **Thêm bộ lọc theo Người tham gia:**
>    - Cập nhật hàm `loadEvents` để lấy danh sách tên người tham gia từ bảng `participants` (join với `contacts`).
>    - Thêm một ô input để tìm kiếm theo tên người tham gia. Nếu tôi nhập 'Nam', hãy hiển thị tất cả sự kiện có 'Nam' tham gia.
> 
> 2. **Thêm bộ lọc theo Khoảng thời gian:**
>    - Thêm hai ô nhập liệu 'Từ ngày' và 'Đến ngày'.
>    - Sử dụng component `DateInput` để nhập liệu theo định dạng `dd/mm/yyyy`.
>    - Chỉ hiển thị các sự kiện diễn ra trong khoảng thời gian đã chọn.
> 
> 3. **Cải thiện UI:**
>    - Thêm một nút 'Bộ lọc' để ẩn/hiện các ô tìm kiếm nâng cao này cho gọn giao diện.
>    - Đảm bảo các bộ lọc này hoạt động mượt mà cùng với ô tìm kiếm tiêu đề và bộ lọc loại sự kiện hiện có.
> 
> Hãy viết code tối ưu trong `useMemo` để việc lọc dữ liệu diễn ra tức thì mà không bị giật lag."

---
*Tài liệu được soạn thảo bởi chuyên gia Manus.*
