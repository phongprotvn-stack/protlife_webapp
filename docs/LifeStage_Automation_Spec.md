# ĐẶC TẢ KỸ THUẬT: TỰ ĐỘNG HÓA TRƯỜNG "GIAI ĐOẠN" (LIFESTAGE) THEO ĐỘ TUỔI

Tài liệu này hướng dẫn **Hermes Desktop** cách tự động hóa việc chọn "Giai đoạn" khi thêm sự kiện mới trong dự án **Prot Life**, dựa trên ngày sinh của người dùng và ngày diễn ra sự kiện.

---

### 1. LOGIC TÍNH TOÁN GIAI ĐOẠN

Giai đoạn sẽ được tính toán dựa trên số tuổi của người dùng tại thời điểm **Ngày bắt đầu sự kiện**.

**Công thức quy đổi độ tuổi:**
*   **Infancy:** 0 - 5 tuổi
*   **Childhood:** 6 - 10 tuổi
*   **Secondary School:** 11 - 14 tuổi
*   **High School:** 15 - 17 tuổi
*   **University:** 18 - 22 tuổi
*   **Early Career:** 23 - 30 tuổi
*   **Mid Career:** 31 - 50 tuổi
*   **Mature Career:** 51 - 65 tuổi
*   **Retirement:** 66 tuổi trở lên

---

### 2. CÁC BƯỚC TRIỂN KHAI

#### Bước 1: Thêm hàm tiện ích vào `src/lib/utils.ts`
Hermes cần thêm hàm `calculateLifeStage(birthDate: string, eventDate: string)` để thực hiện logic so khớp trên.

#### Bước 2: Cập nhật các Form thêm/sửa sự kiện
Hermes cần chỉnh sửa `src/app/events/add/page.tsx` và `src/components/events/add-event-modal.tsx`:
1.  Sử dụng `useSettingsStore` để lấy ngày sinh (`dob`) của người dùng.
2.  Lắng nghe sự thay đổi của trường `StartDate`.
3.  Khi `StartDate` thay đổi, tự động gọi hàm `calculateLifeStage` và cập nhật giá trị vào trường `LifeStage`.
4.  (Tùy chọn) Chuyển trường `LifeStage` sang trạng thái `disabled` trong form để người dùng không cần can thiệp thủ công.

---

### 3. CÂU LỆNH (PROMPT) YÊU CẦU HERMES DESKTOP

Bạn hãy copy đoạn lệnh này và gửi cho Hermes Desktop:

> **Yêu cầu:** "Hãy giúp tôi tự động hóa trường 'Giai đoạn' (LifeStage) khi thêm sự kiện mới trong dự án Prot Life:
> 
> 1. **Thêm logic vào `src/lib/utils.ts`**: Tạo hàm `calculateLifeStage(birthDate, eventDate)` để tính tuổi và trả về Giai đoạn tương ứng:
>    - 0-5: Infancy
>    - 6-10: Childhood
>    - 11-14: Secondary School
>    - 15-17: High School
>    - 18-22: University
>    - 23-30: Early Career
>    - 31-50: Mid Career
>    - 51-65: Mature Career
>    - 66+: Retirement
> 
> 2. **Tự động hóa trong Form**: Tại các file `src/app/events/add/page.tsx` và `src/components/events/add-event-modal.tsx`:
>    - Lấy ngày sinh của tôi từ `useSettingsStore` (trường `dob`).
>    - Khi tôi chọn hoặc thay đổi 'Ngày bắt đầu' (StartDate), hãy tự động tính toán và chọn 'Giai đoạn' phù hợp.
>    - Chuyển ô chọn 'Giai đoạn' sang trạng thái `disabled` để tôi không cần phải chọn tay nữa.
> 
> 3. Đảm bảo nếu tôi chưa cài đặt ngày sinh trong phần Cài đặt, app sẽ hiện thông báo nhắc nhở hoặc cho phép chọn tay như cũ."

---
*Tài liệu được soạn thảo bởi chuyên gia Manus.*
