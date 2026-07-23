# Đặc tả: Sửa PWA — icon cài đặt chưa hoạt động

> Phát hiện qua review code thật: `public/manifest.json`, `public/icon-192.png`,
> `public/icon-512.png` **đã tồn tại sẵn trên đĩa** — nhưng `src/app/layout.tsx`
> (component `'use client'` tự dựng `<head>` thủ công) **HOÀN TOÀN KHÔNG liên kết**
> tới các file này. Thiếu cả 3 thẻ quan trọng:
> - `<link rel="manifest" ...>` — thiếu cái này, trình duyệt/điện thoại không nhận ra
>   đây là 1 PWA có thể cài đặt, nút "Add to Home Screen" có thể không xuất hiện đúng
>   cách hoặc dùng ảnh chụp màn hình thay vì icon thật.
> - `<link rel="apple-touch-icon" ...>` — thiếu, icon trên màn hình chính iPhone sẽ
>   không đúng (dùng ảnh mặc định xấu của Safari).
> - `<meta name="theme-color" ...>` — thiếu, thanh trạng thái không đúng màu thương
>   hiệu khi mở app đã cài.

## 1. Việc cần sửa — chỉ thêm vài dòng vào `<head>`, không đổi gì khác

Trong `src/app/layout.tsx`, phần `<head>` hiện có (đã có `apple-mobile-web-app-capable`
và favicon), thêm ngay các dòng còn thiếu:

```tsx
<link rel="manifest" href="/manifest.json" />
<link rel="apple-touch-icon" href="/icon-192.png" />
<meta name="theme-color" content="#E6002D" />
```

## 2. Lưu ý về chất lượng file icon hiện có — cần kiểm tra thêm

`icon-192.png` chỉ nặng **1.4KB**, `icon-512.png` chỉ nặng **4KB** — khá nhỏ so với 1
icon 512×512 chất lượng tốt thường nặng vài chục KB trở lên. Có khả năng đây là icon
tạm/placeholder đơn giản (nền phẳng + chữ P), chưa phải bản thiết kế hoàn chỉnh.

**Đề xuất:** sau khi sửa xong phần liên kết kỹ thuật (mục 1), mở thử 2 file này bằng
trình xem ảnh để kiểm tra thật đẹp/đúng thương hiệu chưa. Nếu muốn thiết kế lại icon
đẹp hơn (dùng đúng logo "P" phong cách vũ trụ đã dùng ở trang Đăng nhập), báo lại —
đây là việc thiết kế hình ảnh riêng, không nằm trong phạm vi sửa lỗi kỹ thuật này.

## 3. Kiểm tra thêm — file `manifest.json` có đúng nội dung không

Yêu cầu Hermes đọc và xác nhận nội dung `public/manifest.json` có đủ các trường bắt
buộc: `name`, `short_name`, `start_url`, `display: "standalone"`, `background_color`,
`theme_color`, và mảng `icons` trỏ đúng 2 file trên với `purpose: "any maskable"` (cho
phép hệ điều hành tự bo góc icon phù hợp, tránh icon bị cắt xấu trên các dòng máy khác
nhau).

## 4. Prompt gửi Hermes

```
Trong src/app/layout.tsx, phần <head> hiện đang thiếu 3 thẻ quan trọng cho PWA dù các
file manifest.json/icon-192.png/icon-512.png đã có sẵn trong public/. Thêm 3 dòng sau
vào đúng vị trí <head> hiện có (cạnh thẻ apple-mobile-web-app-capable đã có):

<link rel="manifest" href="/manifest.json" />
<link rel="apple-touch-icon" href="/icon-192.png" />
<meta name="theme-color" content="#E6002D" />

Đồng thời đọc và dán cho tôi xem nguyên văn nội dung public/manifest.json hiện tại —
xác nhận có đủ các trường name, short_name, start_url, display:"standalone",
background_color, theme_color, và icons đúng purpose "any maskable" hay chưa. Nếu
thiếu trường nào, bổ sung cho đủ, không tự đổi tên app hay màu đã có sẵn.

Sau khi sửa, hướng dẫn tôi cách tự kiểm tra: mở DevTools → tab Application →
Manifest, xem có báo lỗi đỏ nào không, và cách thử "Add to Home Screen" thật trên
điện thoại để xác nhận icon hiện đúng.
```

