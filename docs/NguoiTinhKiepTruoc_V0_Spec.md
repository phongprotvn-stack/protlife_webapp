# Đặc tả kỹ thuật: Tích hợp mục "Người tình kiếp trước" (v0 Style)

Tài liệu này hướng dẫn chi tiết cách tái hiện thiết kế từ v0.app vào trang **Tài liệu** của dự án Prot Life. Thiết kế sử dụng phong cách **Bento Glass UI** với các hiệu ứng tương tác cao cấp.

## 1. Danh sách 24 tên (Dữ liệu gốc từ v0)
Mỗi cái tên sẽ đi kèm với ý nghĩa, icon và mã màu pastel riêng biệt:
1. **Nghiêm Thu Sang**: Mùa thu trong trẻo (Icon: Leaf, Color: #FFD1DC)
2. **Nghiêm Như Ngọc**: Đẹp như ngọc quý (Icon: Gem, Color: #E0F7FA)
3. **Nghiêm Như Sương**: Mong manh như sương (Icon: Cloud-Drizzle, Color: #F3E5F5)
4. **Nghiêm Như Nguyệt**: Sáng như trăng rằm (Icon: Moon, Color: #FFF9C4)
5. **Nghiêm Như Quyên**: Xinh đẹp như chim quyên (Icon: Bird, Color: #E8F5E9)
... (và 19 cái tên còn lại theo danh sách bạn đã cung cấp)

## 2. Cấu trúc thiết kế (v0 Style)
- **Layout:** Sử dụng **Bento Grid** (CSS Grid với các ô có kích thước khác nhau). Một số card "Featured" sẽ chiếm 2 cột để tạo sự nhịp điệu.
- **Background:** Hiệu ứng **Aurora Background** (các mảng màu pastel loang mờ, chuyển động chậm phía sau).
- **Card Style:**
  - **Frosted Glass:** `backdrop-blur-xl`, `bg-white/30`, `border-white/20`.
  - **Shimmer Border:** Hiệu ứng viền sáng chạy quanh card khi hover.
  - **Apple Wallet Hover:** Khi di chuyển chuột vào, card sẽ trồi lên (translateY) và phóng to nhẹ (scale), tạo cảm giác như rút thẻ từ ví.
- **Typography:** 
  - Tên: Font Serif (Cormorant Garamond) sang trọng.
  - Ý nghĩa & Tag: Font Sans-serif (Be Vietnam Pro) hiện đại.

## 3. Các thành phần cần tạo (Components)
- `NamesData`: Chứa mảng 24 object tên.
- `NameCard`: Component hiển thị từng thẻ với hiệu ứng hover và nút ghim (Heart).
- `IntroHeader`: Phần giới thiệu trang với tiêu đề nghệ thuật.

## 4. Cài đặt bổ sung
Yêu cầu cài đặt các thư viện sau để đảm bảo hiệu ứng mượt mà:
- `framer-motion`: Xử lý chuyển động trồi lên và shimmer.
- `lucide-react`: Hệ thống icon tối giản.
- `clsx` & `tailwind-merge`: Quản lý class Tailwind.

---

### 📝 Prompt gửi Hermes Desktop:

"Hãy giúp tôi thêm một mục mới mang tên **'Người tình kiếp trước'** vào trang **Tài liệu** (Documents) của dự án Prot Life. 

**Yêu cầu chi tiết:**
1. **Thiết kế:** Tái hiện chính xác phong cách từ link v0 (Bento Grid, Glassmorphism, Aurora background).
2. **Dữ liệu:** Sử dụng danh sách 24 tên con gái họ Nghiêm (Nghiêm Thu Sang, Nghiêm Như Ngọc...). Mỗi tên cần có một màu sắc pastel riêng, icon Lucide phù hợp và ý nghĩa ngắn gọn.
3. **Hiệu ứng:** 
   - Sử dụng **Framer Motion** để tạo hiệu ứng card trồi lên khi hover (Apple Wallet style).
   - Thêm hiệu ứng viền sáng (Shimmer border) và đổ bóng mềm mại.
   - Nút 'Ghim' (Trái tim) có thể bật/tắt trạng thái yêu thích.
4. **Kỹ thuật:** Đảm bảo code chạy mượt 60fps trên Mobile PWA, sử dụng GPU Acceleration cho các hiệu ứng blur và transform.

Hãy tham khảo file đặc tả `NguoiTinhKiepTruoc_V0_Spec.md` tôi gửi kèm để thực hiện nhé!"
