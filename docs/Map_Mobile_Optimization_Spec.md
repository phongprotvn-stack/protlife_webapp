# ĐẶC TẢ KỸ THUẬT: TỐI ƯU BẢN ĐỒ VÀ ĐỒNG BỘ DỮ LIỆU MOBILE

Tài liệu này hướng dẫn **Hermes Desktop** khắc phục triệt để lỗi tìm kiếm địa điểm trên Bản đồ và lỗi mất dữ liệu khi chuyển đổi giữa Desktop và Mobile cho dự án **Prot Life**.

---

### 1. TỐI ƯU BẢN ĐỒ & TÌM KIẾM ĐỊA ĐIỂM (GEOCODING)

**Vấn đề:** Hiện tại app dùng Nominatim (OpenStreetMap) nên dữ liệu địa điểm rất nghèo nàn so với Google Maps.

**Giải pháp đề xuất:**
*   **Chuyển sang Google Geocoding API:** Để tìm tọa độ chính xác 100% như Google Maps.
*   **Chi phí:** Google tặng **$200 miễn phí mỗi tháng**. Với nhu cầu nhập 10 địa điểm/ngày (~300 địa điểm/tháng), bạn sẽ **không bao giờ phải trả phí** vì mức này cực kỳ thấp (chỉ tốn khoảng $1.5 trong khi được tặng $200).
*   **Hiển thị:** Tiếp tục dùng **Leaflet + OpenStreetMap** để hiển thị bản đồ (hoàn toàn miễn phí) nhằm tiết kiệm chi phí hiển thị.

---

### 2. SỬA LỖI MẤT DỮ LIỆU TRÊN MOBILE

**Vấn đề:** Các Service (`goal-service.ts`, `organization-service.ts`,...) đang đọc dữ liệu từ `localStorage`. Dữ liệu trên Desktop không thể tự đồng bộ sang Mobile qua `localStorage`.

**Giải pháp:**
*   **Ưu tiên Supabase:** Chỉnh sửa hàm `getAll()` trong các service để đọc dữ liệu trực tiếp từ Supabase thay vì `localStorage`.
*   **Đồng bộ hóa:** Đảm bảo khi người dùng đăng nhập trên Mobile, app sẽ kéo dữ liệu từ server về.

---

### 3. CÂU LỆNH (PROMPT) YÊU CẦU HERMES DESKTOP

Bạn hãy copy đoạn lệnh này và gửi cho Hermes Desktop:

> **Yêu cầu:** "Hãy giúp tôi sửa lỗi Bản đồ và lỗi mất dữ liệu trên Mobile cho dự án Prot Life theo các bước sau:
> 
> 1. **Sửa lỗi đồng bộ dữ liệu:** Trong các file `src/lib/services/goal-service.ts`, `src/lib/services/event-service.ts`, và `src/lib/services/organization-service.ts`, hãy chỉnh sửa hàm `getAll()` để **đọc dữ liệu trực tiếp từ Supabase**. Loại bỏ việc chỉ đọc từ `localStorage` để dữ liệu trên Desktop và Mobile luôn đồng bộ với nhau.
> 
> 2. **Nâng cấp tìm kiếm địa điểm (Geocoding):** 
>    - Tại trang thêm sự kiện (`src/app/events/add/page.tsx`), hãy thay thế hàm `geocodeAddress` (đang dùng Nominatim) bằng **Google Geocoding API**. 
>    - Hướng dẫn tôi chỗ để điền `GOOGLE_MAPS_API_KEY`.
>    - Đảm bảo khi thêm nhiều địa điểm, app sẽ lấy tọa độ cho **tất cả** địa điểm đó thay vì chỉ địa điểm đầu tiên.
> 
> 3. **Kiểm tra hiển thị Mobile:** Đảm bảo trang Bản đồ (`src/app/map/page.tsx`) và trang Mục tiêu (`src/app/goals/page.tsx`) hiển thị đầy đủ danh sách dữ liệu khi mở trên trình duyệt điện thoại.
> 
> Hãy ưu tiên việc đồng bộ dữ liệu qua Supabase trước để tôi có thể thấy dữ liệu trên Mobile ngay lập tức."

---
*Tài liệu được soạn thảo bởi chuyên gia Manus.*
