# ĐẶC TẢ KỸ THUẬT: TỐI ƯU TRANG "MẢNH KÝ ỨC" (SHARDS) - NEXT.JS PWA

Tài liệu này hướng dẫn **Hermes Desktop** nâng cấp trang `memories/shards` để đạt độ mượt 60fps trên Web/PWA. Mục tiêu là xử lý hành trình vuốt dài liên tục mà không bị giật lag, đồng thời giữ nguyên các hiệu ứng thị giác (reflection, shadow, contrast).

---

### 1. NGUYÊN TẮC TỐI ƯU "KHÔNG RE-RENDER"

Trang Shards hiện tại đang dùng `useState(scrollOffset)` và cập nhật liên tục trong `onPointerMove`. Điều này khiến React re-render hàng trăm lần mỗi giây, gây nghẽn CPU.

**Giải pháp:**
*   Sử dụng **`useMotionValue`** của Framer Motion để lưu trữ vị trí cuộn.
*   Sử dụng **`useTransform`** để ánh xạ vị trí cuộn sang các thuộc tính CSS (scale, rotate, translate, opacity).
*   Mọi thay đổi sẽ diễn ra trực tiếp ở lớp **GPU**, bỏ qua chu kỳ re-render của React.

---

### 2. GIỮ NGUYÊN CÁC HIỆU ỨNG THỊ GIÁC CAO CẤP

Hermes cần đảm bảo các yếu tố sau không thay đổi về mặt thẩm mỹ:
*   **Reflection (Gương):** Giữ nguyên phần phản chiếu phía dưới các mảnh.
*   **Shadow & Glow:** Giữ nguyên các lớp đổ bóng và ánh sáng xung quanh mảnh ký ức.
*   **Vị trí & Bố cục:** Giữ nguyên quỹ đạo cong (arc path) và khoảng cách giữa các mảnh.

---

### 3. CƠ CHẾ VUỐT MƯỢT MÀ (INFINITE & SMOOTH)

Để vuốt hành trình dài liên tục mà vẫn mượt:
*   **Inertia (Quán tính):** Sử dụng `useTime` hoặc `animate` của Framer Motion để xử lý chuyển động sau khi thả tay, thay vì tự viết hàm `requestAnimationFrame` thủ công.
*   **Hardware Acceleration:** Thêm `will-change: transform` vào tất cả các item.
*   **Viewport Culling:** Chỉ render các item nằm trong vùng nhìn thấy (VISIBLE_ITEMS) để giảm tải cho trình duyệt.

---

### 4. CÂU LỆNH (PROMPT) YÊU CẦU HERMES DESKTOP

Bạn hãy copy đoạn lệnh này và gửi cho Hermes Desktop:

> **Yêu cầu:** "Hãy giúp tôi tối ưu lại file `src/app/memories/shards/page.tsx` để đạt độ mượt 60fps trên Web PWA.
> 
> **Yêu cầu chi tiết:**
> 1. **Loại bỏ hoàn toàn `useState` cho `scrollOffset`**. Thay thế bằng `useMotionValue` từ Framer Motion.
> 2. **Sử dụng `useTransform`** để xử lý tất cả các hiệu ứng chuyển động (X, Y, Scale, Opacity, RotateX).
> 3. **Giữ nguyên 100% thiết kế hiện tại:** Bao gồm màu sắc, hiệu ứng gương (reflection), bóng đổ, và độ tương phản. Không được làm mất đi vẻ 'cao cấp' của trang Shards.
> 4. **Tối ưu việc vuốt:** Đảm bảo khi vuốt mạnh, danh sách có quán tính mượt mà và dừng lại đúng vị trí (snap) mà không bị giật.
> 5. **Tận dụng GPU:** Thêm `will-change: transform` và sử dụng `translateZ(0)` cho các item.
> 
> Hãy viết code theo phong cách 'Framer Motion Pro' để tối ưu hiệu năng cho trình duyệt Mobile Web."

---
*Tài liệu được soạn thảo bởi Manus - Chuyên gia tối ưu hóa trải nghiệm người dùng.*
