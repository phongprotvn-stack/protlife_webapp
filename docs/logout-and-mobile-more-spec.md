# Đặc tả: Sửa nút Đăng xuất Dashboard + Menu "Thêm" cho Mobile (12 tab)

## 1. Nút Đăng xuất ở Dashboard chưa đăng xuất thật

**Bằng chứng:** `src/components/layout/desktop-layout.tsx` dòng 60:
```tsx
logout(); router.push('/login');
```
Chỉ gọi `logout()` của `auth-store.ts` (dòng 37) — hàm này **chỉ xoá state local**
(`set({ isLoggedIn: false, user: null })`), **không hề gọi `supabase.auth.signOut()`**.
Session thật trên Supabase vẫn còn hiệu lực, chỉ là giao diện tưởng như đã đăng xuất.

### Prompt gửi Hermes
```
Trong src/components/layout/desktop-layout.tsx, hàm xử lý nút đăng xuất (dòng ~60)
đang chỉ gọi logout() local, không gọi supabase.auth.signOut(). Sửa thành:

const handleLogout = useCallback(async () => {
  await supabase.auth.signOut();
  logout();
  router.push('/login');
}, [logout, router]);

Kiểm tra xem file mobile-layout.tsx hoặc bất kỳ nơi nào khác trong app có nút đăng
xuất tương tự chưa gọi supabase.auth.signOut() không, sửa luôn nếu có.
```

---

## 2. Mobile — 12 tab nhưng bottom bar chỉ hiện 5, 7 tab còn lại không mở được

**Hiện trạng:** `mobile-layout.tsx` hard-code đúng 5 tab (Trang chủ, Quan hệ, Sự kiện,
AI Insight, Dòng thời gian). 7 tab còn lại (Ký ức, Bản đồ, Tổ chức, Tài liệu, Mục
tiêu, Thống kê, Cài đặt) **không có đường vào nào trên giao diện mobile**.

### Giải pháp — mẫu "More tab" chuẩn (Instagram/Threads/nhiều app iOS dùng)

Đổi bottom bar thành **4 tab chính + 1 tab "Thêm"** (không nhét đủ 12, vượt quá số tab
tối đa khuyến nghị cho thanh điều hướng dưới — thường tối đa 5). Bấm "Thêm" mở
**bottom sheet** (tái dùng đúng class `glass-card`/kiểu bottom-sheet đã dùng ở trang
Bản đồ) hiện lưới các tab còn lại.

**Đề xuất 4 tab chính** (có thể đổi lại nếu cậu muốn nhóm khác):
`Trang chủ, Quan hệ, Sự kiện, Ký ức` — 4 việc dùng hằng ngày nhiều nhất.

**8 tab còn lại vào "Thêm":** Dòng thời gian, Bản đồ, Tổ chức, Tài liệu, Mục tiêu,
Thống kê, AI Insight, Cài đặt.

### Prompt gửi Hermes
```
Sửa src/components/layout/mobile-layout.tsx:

1. Tách mảng TABS hiện tại thành 2 mảng:
   PRIMARY_TABS (4 tab): Trang chủ, Quan hệ, Sự kiện, Ký ức.
   MORE_TABS (8 tab còn lại): Dòng thời gian, Bản đồ, Tổ chức, Tài liệu, Mục tiêu,
   Thống kê, AI Insight, Cài đặt — dùng đúng icon lucide-react tương ứng mỗi trang
   (xem cách các trang desktop-layout.tsx đang dùng icon nào cho từng route, dùng lại
   y hệt, đừng tự chọn icon khác).

2. Bottom bar hiện PRIMARY_TABS (4 mục) + 1 nút thứ 5 "Thêm" (icon MoreHorizontal từ
   lucide-react). Nút "Thêm" tự động ở trạng thái active (đổi màu như tab khác) khi
   pathname hiện tại khớp với 1 trong 8 route của MORE_TABS.

3. Bấm "Thêm" mở 1 bottom sheet trượt lên từ dưới (dùng đúng pattern/class glass-card
   đã có trong globals.css, animation giống bottom sheet ở trang map/page.tsx nếu đã
   có sẵn pattern đó trong project — tái dùng, không viết CSS mới), hiện lưới 2-3 cột
   gồm 8 mục MORE_TABS, mỗi mục: icon + label. Bấm vào 1 mục → điều hướng route đó +
   tự đóng sheet. Có nút đóng (X) hoặc bấm ra ngoài overlay để đóng không chọn gì.

Giữ nguyên toàn bộ animation chuyển trang, style tab-item, tab-bar-glass hiện có —
chỉ thêm cấu trúc trên, không viết lại từ đầu.
```

