# ĐẶC TẢ KỸ THUẬT: TỐI ƯU UI "GIỌT KÝ ỨC" CHO NEXT.JS PWA (VERCEL)

Tài liệu này hướng dẫn **Hermes Desktop** sửa lại trang `memories/drops` hiện tại để đạt hiệu ứng mượt mà như video mà không cần dùng Flutter, đảm bảo chạy tốt trên Vercel và cài đặt được như PWA.

---

### 1. CHIẾN LƯỢC TỐI ƯU HIỆU NĂNG (BẮT BUỘC)

Để hết giật lag trên Web, Hermes cần thực hiện các thay đổi sau:

*   **Loại bỏ `useState` cho Scroll:** Tuyệt đối không dùng `useState` để lưu `scrollOffset` vì nó gây re-render toàn bộ trang.
*   **Sử dụng `useMotionValue` (Framer Motion):** Dùng `useMotionValue` và `useTransform` của Framer Motion. Các giá trị này cập nhật trực tiếp vào lớp CSS (GPU), không thông qua React Re-render.
*   **Tối ưu Gooey Filter:** Chỉ áp dụng `filter: url(#goo)` lên một thẻ `div` cha duy nhất bao bọc các hình tròn, không áp dụng lên từng item.

---

### 2. CẤU TRÚC CODE MỚI (MÔ HÌNH)

#### A. Quản lý chuyển động
```javascript
const scrollY = useMotionValue(0);
// Tính toán các giá trị biến đổi dựa trên scrollY mà không re-render
const scale = useTransform(scrollY, [inputRange], [outputRange]);
const rotateX = useTransform(scrollY, [inputRange], [outputRange]);
const xOffset = useTransform(scrollY, [inputRange], [outputRange]);
```

#### B. CSS GPU Acceleration
Mọi item phải có:
*   `will-change: transform, opacity;`
*   `transform: translateZ(0);` (Kích hoạt 3D rendering)

---

### 3. CÂU LỆNH (PROMPT) YÊU CẦU HERMES DESKTOP

Bạn hãy gửi đoạn này cho Hermes Desktop:

> **Yêu cầu:** "Tôi muốn giữ dự án là Next.js PWA để deploy lên Vercel, nhưng cần trang 'Giọt Ký ức' mượt như video. Hãy giúp tôi sửa lại file `src/app/memories/drops/page.tsx` theo các bước sau:
> 
> 1. **Thay thế `useState(scrollOffset)`** bằng `useMotionValue` từ Framer Motion để tránh re-render gây lag.
> 2. **Sử dụng `useTransform`** để tính toán:
>    - **Độ nghiêng 3D (rotateX):** Item ở trên nghiêng sau, ở dưới nghiêng trước.
>    - **Quỹ đạo cong (translateX):** Item ở giữa đẩy sang phải.
>    - **Tỷ lệ (scale) & Độ mờ (opacity):** Giảm dần khi xa tâm.
> 3. **Tối ưu Gooey Filter:** Đảm bảo filter SVG chỉ nằm ở lớp cha bao bọc các vòng tròn.
> 4. **Thêm `will-change: transform`** vào style của các item để kích hoạt tăng tốc phần cứng.
> 
> Hãy ưu tiên viết code sao cho chuyển động đạt 60fps trên trình duyệt mobile."

---
*Tài liệu được soạn thảo bởi Manus - Chuyên gia tối ưu hóa Web PWA.*
