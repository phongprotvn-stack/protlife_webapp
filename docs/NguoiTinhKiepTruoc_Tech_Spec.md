# ĐẶC TẢ KỸ THUẬT: MỤC "NGƯỜI TÌNH KIẾP TRƯỚC" (BENTO GLASS UI)

Tài liệu này hướng dẫn **Hermes Desktop** cách xây dựng một trang mới hoặc một section mới trong dự án **Prot Life** để hiển thị danh sách tên con gái tương lai với giao diện cực kỳ hiện đại.

---

### 1. CÔNG NGHỆ SỬ DỤNG
*   **Layout:** Tailwind CSS Grid (Bento style).
*   **Hiệu ứng:** Framer Motion (cho animation và 3D Tilt).
*   **Styling:** Backdrop-blur (Glassmorphism) và Gradient nền.

---

### 2. DANH SÁCH DỮ LIỆU (24 CÁI TÊN)
Hermes cần sử dụng danh sách sau để tạo các card:
1. Nghiêm Thu Sang, 2. Nghiêm Như Ngọc, 3. Nghiêm Như Sương, 4. Nghiêm Như Nguyệt, 5. Nghiêm Như Quyên, 6. Nghiêm Ngọc Ẩn, 7. Nghiêm Phương Châm, 8. Nghiêm Ngọc Thảo, 9. Nghiêm Hà An, 10. Nghiêm Bảo Trâm, 11. Nghiêm Kim Tuyến, 12. Nghiêm Thanh Quyên, 13. Nghiêm Hà Thu, 14. Nghiêm Thanh Mai, 15. Nghiêm Châu Loan, 16. Nghiêm Anh Thư, 17. Nghiêm Thị Nguyệt, 18. Nghiêm Thu Hoài, 19. Nghiêm Thảo Nguyên, 20. Nghiêm Thảo Chi, 21. Nghiêm Mai Thương, 22. Nghiêm Nhật Linh, 23. Nghiêm Bích Ngọc, 24. Nghiêm Thu Uyên.

---

### 3. CƠ CẤU COMPONENT `NameCard`
Mỗi card cần có các thuộc tính sau:
*   `bg-white/20 backdrop-blur-lg border border-white/30`
*   `rounded-[24px] p-6 shadow-xl`
*   Hiệu ứng `whileHover={{ scale: 1.05, rotateY: 5 }}` để tạo cảm giác 3D.
*   Phân loại kích thước ngẫu nhiên (ô 1x1, 1x2, 2x1) để tạo bố cục Bento.

---

### 4. CÂU LỆNH (PROMPT) YÊU CẦU HERMES DESKTOP

Bạn hãy copy đoạn lệnh này và gửi cho Hermes Desktop:

> **Yêu cầu:** "Hãy giúp tôi tạo một trang mới tại `src/app/memories/daughter-names/page.tsx` (hoặc tích hợp vào phần Tài liệu) với tiêu đề 'Người tình kiếp trước'.
> 
> **Yêu cầu chi tiết:**
> 1. **Giao diện Bento Grid:** Hiển thị 24 cái tên con gái tôi đã cung cấp dưới dạng các thẻ (cards) có kích thước khác nhau (Bento Grid).
> 2. **Phong cách Glassmorphism:** Các thẻ phải có hiệu ứng kính mờ, viền trắng mảnh và đổ bóng mềm mại trên nền Gradient cực quang (Aurora background).
> 3. **Typography cao cấp:** Sử dụng font Serif cho tên chính để tạo sự sang trọng và font Sans-serif cho các chi tiết phụ.
> 4. **Hiệu ứng chuyển động:** Sử dụng Framer Motion để tạo hiệu ứng các thẻ bay nhẹ vào màn hình khi load trang, và hiệu ứng nghiêng 3D (tilt) khi tôi chạm hoặc di chuột qua.
> 5. **Dữ liệu:** Sử dụng danh sách 24 tên họ Nghiêm mà tôi đã cung cấp.
> 
> Hãy viết code thật 'nghệ' và tối ưu cho Mobile PWA nhé!"

---
*Tài liệu được soạn thảo bởi chuyên gia Manus.*
