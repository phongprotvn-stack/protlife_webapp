# Đặc tả kỹ thuật: Tích hợp trang "Người tình kiếp trước 3"

Tài liệu này hướng dẫn chi tiết cách tích hợp mã nguồn thiết kế từ v0 vào dự án Prot Life tại đường dẫn mới `/documents/daughter-names3`.

## 1. Yêu cầu chung
- **Tên Section:** Người tình kiếp trước 3.
- **Đường dẫn (Route):** `/src/app/documents/daughter-names3/page.tsx`.
- **Yêu cầu thiết kế:** Giữ nguyên 100% logic, style, và dữ liệu từ mã nguồn v0 đã cung cấp.
- **Bổ sung:** Thêm một Banner phía trên trang để tạo điểm nhấn.

## 2. Cấu trúc thư mục mục tiêu
- `/src/app/documents/daughter-names3/page.tsx` (Trang chính)
- `/src/components/daughter-names3/names-data.ts` (Dữ liệu 24 tên)
- `/src/components/daughter-names3/name-card.tsx` (Component thẻ tên)
- `/src/components/daughter-names3/intro-header.tsx` (Component tiêu đề)

## 3. Mã nguồn chi tiết (Trích xuất từ file zip)

### 3.1. Dữ liệu: `names-data.ts`
(Hermes hãy đọc trực tiếp nội dung từ file `names-data.ts` trong mã nguồn v0 để lấy danh sách 24 tên họ Nghiêm cùng các palette màu pastel đặc trưng).

### 3.2. Component: `name-card.tsx`
Sử dụng **Framer Motion** và **Lucide React** để tạo hiệu ứng:
- **Shimmering glow border:** Hiệu ứng viền sáng chạy quanh card.
- **Frosted glass:** Hiệu ứng kính mờ `backdrop-blur-xl`.
- **Apple Wallet Hover:** Card trồi lên và phóng to nhẹ khi hover.

### 3.3. Component: `intro-header.tsx`
Tiêu đề nghệ thuật với font Serif và một thẻ giới thiệu kính mờ (Glassmorphic card).

### 3.4. Styles: `globals.css`
Cần thêm các animation keyframes sau vào hệ thống:
```css
@keyframes shimmer {
  0%, 100% { background-position: 0% 50%; opacity: 0.75; }
  50% { background-position: 100% 50%; opacity: 1; }
}
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
```

## 4. Hướng dẫn tích hợp Banner
Tại trang `page.tsx`, hãy thiết kế một Banner rộng toàn màn hình phía trên `IntroHeader`:
- Chiều cao: ~300px.
- Background: Sử dụng gradient Aurora mượt mà (hòa quyện giữa hồng nhạt, xanh bạc hà và xanh trời).
- Nội dung: Hiển thị tiêu đề "Người tình kiếp trước 3" với font chữ nghệ thuật cỡ lớn.

---

### 📝 Prompt gửi Hermes Desktop:

"Chào Hermes, tôi muốn tích hợp mã nguồn thiết kế từ v0 (trong file zip đính kèm) vào dự án Prot Life.

**Nhiệm vụ của bạn:**
1. Tạo trang mới tại `/src/app/documents/daughter-names3/page.tsx`.
2. Sao chép chính xác 100% code từ các file `names-data.ts`, `name-card.tsx`, và `intro-header.tsx` vào thư mục `/src/components/daughter-names3/`. Lưu ý cập nhật đường dẫn import cho đúng.
3. Giữ nguyên toàn bộ logic hiệu ứng: Shimmer border, Frosted glass, và Apple Wallet hover.
4. **Thêm Banner:** Thiết kế một banner Aurora Gradient lung linh phía trên cùng của trang trước khi vào phần danh sách thẻ.
5. Đảm bảo các animation `shimmer` và `float` được khai báo trong `globals.css` hoặc dùng trực tiếp qua Tailwind config.

Hãy thực hiện việc này thật cẩn thận để không làm mất đi vẻ đẹp tinh tế của thiết kế gốc nhé!"
