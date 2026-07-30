# ĐẶC TẢ KỸ THUẬT: TÁI CẤU TRÚC GIAO DIỆN "GIỌT KÝ ỨC" (FLUTTER)

Tài liệu này cung cấp hướng dẫn chi tiết để **Hermes Desktop** thực hiện code lại trang "Giọt Ký ức" từ Next.js sang Flutter, tập trung vào hiệu ứng chuyển động mượt mà (60-120 FPS).

---

### 1. CÁC THƯ VIỆN & CÀI ĐẶT CẦN THIẾT (Dependencies)
Thêm các thư viện sau vào `pubspec.yaml`:
```yaml
dependencies:
  flutter:
    sdk: flutter
  # Quản lý chuyển động phức tạp
  flutter_animate: ^4.5.0 
  # Xử lý hiệu ứng Gooey/Metaballs (nếu cần nâng cao)
  metaballs: ^1.1.0
  # Hỗ trợ các icon giống Lucide
  lucide_icons: ^0.321.0
```

---

### 2. CẤU TRÚC KỸ THUẬT CỐT LÕI

#### A. Khung chuyển động (The Wheel)
*   **Widget lõi:** `ListWheelScrollView.useDelegate`.
*   **Tham số quan trọng:**
    *   `itemExtent: 120.0`: Khoảng cách giữa các item.
    *   `perspective: 0.002`: Độ sâu phối cảnh 3D.
    *   `diameterRatio: 1.8`: Độ cong của quỹ đạo tròn.
    *   `physics: FixedExtentScrollPhysics()`: Đảm bảo item luôn dừng ở chính giữa.

#### B. Phép biến đổi 3D (Custom Transform)
Sử dụng `Transform` bao bọc mỗi item để tính toán dựa trên `scrollOffset`:
1.  **Trục X (Quỹ đạo cong):** `Matrix4.translationValues(math.pow(diff.abs(), 1.5) * 12, 0, 0)`.
2.  **Trục Z (Scale):** `Matrix4.diagonal3Values(scale, scale, 1.0)`.
3.  **Nghiêng 3D (RotateX):** `Matrix4.identity()..setEntry(3, 2, 0.001)..rotateX(diff * 0.15)`.

#### C. Hiệu ứng "Dính" (Gooey Effect)
*   Sử dụng `ShaderMask` hoặc bộ lọc `ImageFilter.blur` kết hợp với `ColorFilter` (Matrix) để tạo sự hòa quyện giữa các hình tròn khi chúng lướt qua nhau.

---

### 3. QUY TRÌNH THỰC HIỆN (Step-by-Step)

1.  **Bước 1: Thiết lập Theme & Layout:** Tạo `Scaffold` với nền đen (`Colors.black`) và Header tối giản.
2.  **Bước 2: Xây dựng Item Widget:** Thiết kế UI cho mỗi "Giọt" gồm một `Container` hình tròn (Avatar) và `Column` (Text).
3.  **Bước 3: Tích hợp Scroll Logic:** Dùng `FixedExtentScrollController` để lắng nghe vị trí cuộn và cập nhật `state`.
4.  **Bước 4: Áp dụng Math Transform:** Gắn các công thức toán học vào `Transform` để tạo quỹ đạo cong và độ nghiêng 3D.
5.  **Bước 5: Tối ưu hiệu năng:** Sử dụng `const` widgets và đảm bảo không re-build các thành phần không cần thiết.

---

### 4. CÂU LỆNH (PROMPT) YÊU CẦU HERMES DESKTOP

Bạn hãy copy đoạn lệnh dưới đây và gửi cho Hermes Desktop:

> **Yêu cầu:** "Hãy giúp tôi viết code Flutter cho trang 'Giọt Ký ức' (Memories Drops) dựa trên bản đặc tả kỹ thuật đính kèm. 
> 
> **Mục tiêu:** Tái tạo hiệu ứng chuyển động 3D mượt mà như video (3D Wheel + Quỹ đạo cong + Độ nghiêng 3D). 
> 
> **Yêu cầu kỹ thuật cụ thể:**
> 1. Sử dụng `ListWheelScrollView` làm cấu trúc chính.
> 2. Tính toán `Transform` cho từng item để khi cuộn: item ở trên nghiêng ngửa sau, ở giữa phẳng, ở dưới nghiêng úp trước.
> 3. Các item phải di chuyển theo cung tròn (đẩy sang phải khi ở giữa).
> 4. Thêm hiệu ứng Scale và Opacity mượt mà dựa trên khoảng cách tới tâm.
> 5. Sử dụng `lucide_icons` cho các biểu tượng.
> 
> Hãy viết mã nguồn hoàn chỉnh, sạch sẽ và tối ưu hiệu năng phần cứng (GPU)."

---
*Tài liệu được soạn thảo bởi Manus - Chuyên gia tối ưu hóa UI/UX.*
