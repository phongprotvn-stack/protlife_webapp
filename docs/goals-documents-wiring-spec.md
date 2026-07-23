# Đặc tả: Nối thật Mục tiêu & Tài liệu (việc nhanh, giá trị cao)

> Phát hiện quan trọng qua review code: `src/lib/services/goal-service.ts` và
> `document-service.ts` **đã tồn tại đầy đủ, có sẵn hàm CRUD** — nhưng
> `src/app/goals/page.tsx` và `src/app/documents/page.tsx` **chưa hề import hay gọi
> tới các service này**, chỉ hiện UI tĩnh "Chưa có dữ liệu" và nút "+ Thêm" chưa gắn
> `onClick`. Đây là việc DỄ NHẤT trong toàn bộ danh sách hôm nay — không cần viết
> logic mới, chỉ cần **nối dây** đúng cách trang `src/app/organizations/page.tsx` đã
> làm đúng (dùng làm mẫu tham chiếu).

## 1. Việc cần làm — lặp lại đúng pattern của Tổ chức

`organizations/page.tsx` đã là ví dụ chuẩn đang hoạt động thật: import
`organizationService`, gọi trong `useEffect`, hiện loading state, render danh sách
thật, nút "+ Thêm" điều hướng sang trang `add`.

**Áp dụng y hệt pattern này cho 2 trang còn lại**, không cần sáng tạo cách làm mới.

## 2. Prompt gửi Hermes

```
Đọc kỹ src/app/organizations/page.tsx — đây là mẫu ĐANG HOẠT ĐỘNG THẬT (import
organizationService, query trong useEffect, loading state, render danh sách, nút +
Thêm điều hướng đúng route add).

Áp dụng ĐÚNG pattern này cho 2 trang sau, đang chỉ là UI tĩnh chưa nối service dù
service đã có sẵn:

1. src/app/goals/page.tsx — hiện chưa import goalService (đã tồn tại sẵn ở
   src/lib/services/goal-service.ts). Nối query thật, thay "Chưa có dữ liệu" cứng
   bằng danh sách thật, gắn onClick cho nút "+ Thêm mục tiêu" điều hướng sang
   /goals/add.

2. src/app/documents/page.tsx — tương tự, nối documentService đã có sẵn ở
   src/lib/services/document-service.ts.

Giữ nguyên toàn bộ UI/style hiện có ở cả 2 trang, chỉ thay nguồn dữ liệu từ tĩnh sang
thật. Sau khi xong, kiểm tra luôn trang goals/add/page.tsx và documents/add/page.tsx
có thực sự gọi đúng hàm insert của service tương ứng chưa (nghi ngờ cũng có thể đang
chưa nối, cần xác nhận lại).
```

## 3. Cách tự kiểm tra sau khi Hermes làm xong

1. Vào Tab Mục tiêu → bấm "+ Thêm mục tiêu" → điền form → lưu → quay lại danh sách,
   phải thấy mục tiêu vừa tạo (không phải "Chưa có dữ liệu" nữa).
2. Tải lại trang (F5) → mục tiêu vẫn còn (xác nhận lưu thật vào Supabase, không phải
   chỉ lưu tạm trong state React).
3. Lặp lại y hệt cho Tab Tài liệu.

