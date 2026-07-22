# Đặc tả: 3 việc còn thiếu ở trang Cài đặt

> Dựa trên review code thật (`src/app/settings/page.tsx`). Cả 3 việc đều nhỏ, độc lập
> nhau — có thể làm theo bất kỳ thứ tự nào, không phụ thuộc lẫn nhau. Làm từng việc,
> test xong mới sang việc tiếp theo, đúng nguyên tắc đã áp dụng xuyên suốt từ đầu.

---

## 1. Sửa số lượng hard-code ở Tab Phân quyền

**Hiện trạng:** dòng 573-576 trong `settings/page.tsx` gán cứng:
```tsx
{ key:'admin', label:'Admin', desc:'Toàn quyền quản lý', count:1 },
{ key:'contributor', label:'Người đóng góp', desc:'...', count:4 },
{ key:'viewer', label:'Chỉ xem', desc:'...', count:2 },
{ key:'public', label:'Khách công khai', desc:'...', count:0 },
```

**Cách sửa:** ở quy mô app cá nhân (số lượng user rất nhỏ), không cần viết RPC/SQL
riêng — chỉ cần lấy toàn bộ cột `role` từ bảng `profiles`, đếm bằng JavaScript:

```tsx
const { data } = await supabase.from('profiles').select('role');
const counts = { admin: 0, contributor: 0, viewer: 0, public: 0 };
(data || []).forEach(p => { if (p.role in counts) counts[p.role]++; });
```

Dùng `counts.admin`, `counts.contributor`... thay cho số cứng ở 4 dòng trên. Gọi hàm
này 1 lần khi mở Tab Phân quyền (không cần real-time, vì số lượng user hầu như không
đổi trong 1 phiên làm việc).

### Prompt gửi Hermes
```
Trong src/app/settings/page.tsx, Tab Phân quyền đang hard-code count:1/4/2/0 cho 4
vai trò (dòng ~573-576). Hãy thay bằng số liệu thật: query bảng profiles, select cột
role, đếm số lượng theo từng giá trị role bằng JavaScript (không cần RPC), gọi 1 lần
khi component mount hoặc khi Tab Phân quyền được mở. Giữ nguyên toàn bộ UI/style, chỉ
thay nguồn dữ liệu count.
```

---

## 2. Đổi mật khẩu — hiện chỉ là nút placeholder

**Hiện trạng:** nút "Đổi mật khẩu" ở Tab Tài khoản chưa gắn hành vi thật, chỉ hiện
toast "đang phát triển" hoặc tương tự.

**Cách làm:** Supabase Auth có sẵn API cho việc này, không cần bảng/Edge Function mới:
```tsx
const { error } = await supabase.auth.updateUser({ password: newPassword });
```

**Thiết kế UI — modal nhỏ (tái dùng đúng pattern modal đã có ở "Quản lý thiết bị"):**
```
Đổi mật khẩu
┌─────────────────────────────┐
│ Mật khẩu mới                │
│ [••••••••]              👁️  │
│                              │
│ Nhập lại mật khẩu mới       │
│ [••••••••]              👁️  │
│                              │
│  [Huỷ]         [Đổi mật khẩu]│
└─────────────────────────────┘
```

**Validate trước khi gọi API:**
- Mật khẩu mới ≥ 6 ký tự (giới hạn tối thiểu mặc định của Supabase Auth).
- 2 ô phải khớp nhau — nếu không khớp, hiện lỗi ngay dưới ô thứ 2, không gọi API.
- Sau khi đổi thành công: hiện toast "✅ Đã đổi mật khẩu", đóng modal. KHÔNG cần đăng
  xuất người dùng (Supabase tự giữ phiên hiện tại vẫn hợp lệ sau khi đổi mật khẩu).

**Lưu ý bảo mật nhỏ:** Supabase `updateUser()` không yêu cầu nhập lại mật khẩu CŨ để
xác nhận (khác 1 số hệ thống khác) — vì đây là app cá nhân, chấp nhận được, nhưng nếu
muốn chặt chẽ hơn có thể thêm bước xác thực lại qua email trước (không bắt buộc, để
sau nếu cần).

### Prompt gửi Hermes
```
Nút "Đổi mật khẩu" ở Tab Tài khoản (settings/page.tsx) hiện chưa có hành vi thật. Tạo
1 modal nhỏ (tái dùng đúng style modal "Quản lý thiết bị" đã có sẵn trong file này):
2 ô nhập (mật khẩu mới, nhập lại mật khẩu mới, cả 2 có icon con mắt ẩn/hiện như trang
Đăng nhập), validate khớp nhau + tối thiểu 6 ký tự trước khi gọi
supabase.auth.updateUser({ password }). Thành công thì toast + đóng modal, thất bại
thì hiện lỗi rõ ràng trong modal, không đóng.
```

---

## 3. Ngắt kết nối Google Sheets — hiện chỉ là nút placeholder

**Hiện trạng:** nút "Ngắt kết nối" ở khối Đồng bộ Google Sheets (Tab Dữ liệu) chưa gắn
hành vi thật.

**Cách làm — đối xứng với luồng LIÊN KẾT đã làm ở Phần 15:** tìm đúng nơi Phần 15 đã
lưu refresh token Google (bảng mới được tạo lúc đó — xem lại migration SQL đã tạo ở
Phần 15 để biết đúng tên bảng/cột, KHÔNG đoán tên bảng).

**Việc cần làm khi bấm "Ngắt kết nối":**
1. Xoá dòng refresh token tương ứng khỏi bảng đó (theo `user_id` hiện tại).
2. Đổi state UI từ `'linked'` sang `'unlinked'` (đúng biến `SheetStatus` đã có sẵn
   trong `settings/page.tsx`).
3. **KHÔNG cần** gọi API thu hồi quyền phía Google (`https://myaccount.google.com/permissions`)
   — việc đó do người dùng tự quản lý bên phía Google nếu muốn, app chỉ cần ngừng dùng
   token, không bắt buộc phải chủ động revoke nó.
4. Hiện toast xác nhận "🔌 Đã ngắt liên kết Google Sheet".

**Lưu ý:** Sheet đã tạo trên Google Drive của người dùng **vẫn còn nguyên** sau khi
ngắt kết nối (app không tự xoá Sheet của người dùng) — chỉ là app không còn quyền ghi
vào đó nữa. Nếu muốn liên kết lại sau, phải làm lại luồng OAuth từ đầu (Phần 15), sẽ
tạo Sheet mới hoặc hỏi chọn lại Sheet cũ tuỳ cách Phần 15 đã code.

### Prompt gửi Hermes
```
Nút "Ngắt kết nối" ở khối Đồng bộ Google Sheets (Tab Dữ liệu, settings/page.tsx) chưa
có hành vi thật. Trước tiên, hãy tự tìm lại: ở Phần 15 bạn đã lưu refresh token Google
vào bảng nào, cột nào — đọc lại code/migration đã tạo lúc đó, đừng đoán tên bảng.

Sau khi xác định đúng bảng, code nút Ngắt kết nối: xoá dòng token của user hiện tại
khỏi bảng đó, đổi state SheetStatus sang 'unlinked', hiện toast xác nhận. Không cần
gọi API revoke phía Google. Sheet trên Google Drive của người dùng giữ nguyên, không
xoá.
```

