# Hermes Runbook — Nối dữ liệu thật cho trang Cài đặt Prot Life

> **Cách dùng:** copy đúng 1 khối "PASTE VÀO HERMES" mỗi lần, dán vào Hermes Desktop, đợi nó làm xong, TỰ KIỂM TRA lại (chạy `npm run dev` xem còn chạy được không), rồi mới copy bước tiếp theo. **Không dán nhiều bước cùng lúc.**
>
> Đặt file này (`hermes-runbook.md`) và file `data-wiring-spec.md` vào thư mục `docs/` trong project trước khi bắt đầu.

---

## Bước 1 — Chỉ đọc, chưa sửa gì

**PASTE VÀO HERMES:**
```
Hãy đọc kỹ 4 file sau trong project này, CHƯA sửa gì cả:
1. docs/data-wiring-spec.md
2. supabase/schema.sql
3. src/stores/auth-store.ts
4. src/app/settings/page.tsx

Sau khi đọc xong, tóm tắt lại cho tôi bằng 5-6 gạch đầu dòng:
- 3 bộ tên vai trò (role) khác nhau hiện đang tồn tại ở đâu, giá trị gì
- Những phần nào trong Tab Cài đặt hiện đang là mock data (dữ liệu giả hard-code)
Không sửa code ở bước này, chỉ đọc và tóm tắt để tôi xác nhận bạn đã hiểu đúng.
```
✅ Kiểm tra: đọc bản tóm tắt Hermes trả về, đối chiếu với Phần 1 và Phần 2 trong `data-wiring-spec.md` — nếu khớp, sang Bước 2. Nếu sai, sửa lại rồi thử lại Bước 1.

---

## Bước 2 — Thống nhất lại vai trò (role) — QUAN TRỌNG NHẤT

**PASTE VÀO HERMES:**
```
Thực hiện đúng Phần 2 trong docs/data-wiring-spec.md: thống nhất lại vai trò (role).

1. Sửa src/stores/auth-store.ts: đổi type role từ 'admin'|'viewer'|'contributor'
   thành 'public'|'viewer'|'contributor'|'admin'.
2. Sửa src/app/settings/page.tsx: đổi type RoleKey từ 'admin'|'member'|'viewer'|'guest'
   thành 'public'|'viewer'|'contributor'|'admin'.
3. Cập nhật mảng hard-code ở PermissionsTab theo đúng bảng mapping trong mục 2.2 của
   tài liệu (nhãn hiển thị, mô tả, màu pill cho từng giá trị: admin, contributor, viewer, public).

KHÔNG đổi bất kỳ dòng nào trong supabase/schema.sql — bảng đó đã đúng, giữ nguyên.
Sau khi sửa xong, chạy `npm run build` để kiểm tra không có lỗi TypeScript nào phát sinh
từ việc đổi type, và báo cho tôi biết kết quả.
```
✅ Kiểm tra: mở app, vào Tab Phân quyền, xem 4 vai trò hiển thị đúng: Admin / Người đóng góp / Chỉ xem / Khách công khai.

---

## Bước 3 — Nối thật Tab Tài khoản (nút Lưu thay đổi)

**PASTE VÀO HERMES:**
```
Thực hiện đúng Phần 3 trong docs/data-wiring-spec.md.
Sửa hàm xử lý nút "Lưu thay đổi" ở Tab Tài khoản (src/app/settings/page.tsx): sau khi
gọi setSetting(...) như hiện tại, gọi thêm:
  await supabase.from('profiles').update({ name: editName }).eq('id', authUser.id);
Xử lý lỗi nếu update thất bại (hiện toast báo lỗi), và hiện toast báo thành công nếu ổn.
```
✅ Kiểm tra: đổi tên ở Tab Tài khoản, bấm Lưu, tải lại trang (F5) — tên mới phải còn giữ nguyên (chứng tỏ đã lưu thật vào Supabase, không chỉ lưu tạm trên máy).

---

## Bước 4 — Sửa nhãn dung lượng ước tính

**PASTE VÀO HERMES:**
```
Thực hiện đúng Phần 4, Hướng A trong docs/data-wiring-spec.md.
Trong src/lib/services/settings-service.ts, hàm getDataStats(): giữ nguyên công thức
tính storageDbMb/storageFileMb hiện tại, chỉ thêm field isEstimate: true vào object
trả về. Ở phần UI hiển thị (Tab Dữ liệu, khối storage-block trong settings/page.tsx),
thêm dấu ~ trước số MB và chữ "(ước tính)" nhỏ cạnh bên khi isEstimate = true.
```
✅ Kiểm tra: Tab Dữ liệu hiện "~312 MB / 500 MB (ước tính)" thay vì số tuyệt đối.

---

## Bước 5 — Tạo bảng `user_preferences`

**PASTE VÀO HERMES:**
```
Tạo cho tôi 1 file migration SQL mới trong thư mục supabase/ (đặt tên theo đúng quy ước
đặt tên file migration hiện có trong project, xem các file cũ trong đó để theo đúng
convention), nội dung đúng theo mục 5.1 trong docs/data-wiring-spec.md: tạo bảng
user_preferences (user_id, settings jsonb, updated_at) kèm RLS Policy. Chỉ tạo file
SQL, CHƯA chạy migration — tôi sẽ tự chạy qua Supabase Dashboard.
```
✅ Kiểm tra: mở file SQL vừa tạo, đọc lại đúng chưa, rồi copy vào Supabase Dashboard → SQL Editor → chạy tay (không để Hermes tự chạy migration lên database thật).

---

## Bước 6 — Đồng bộ Settings store lên Supabase

**PASTE VÀO HERMES:**
```
Bảng user_preferences đã tạo xong trên Supabase. Bây giờ thực hiện đúng mục 5.2 trong
docs/data-wiring-spec.md: đọc file src/stores/settings-store.ts hiện tại, rồi thêm:
1. Hàm loadPreferencesFromServer() gọi lúc app khởi động, đọc user_preferences.settings
   theo auth.uid() hiện tại, nếu có dữ liệu thì setState(data) vào store.
2. Mỗi khi store đổi, debounce 800ms rồi upsert lên Supabase.
Dán cho tôi đoạn code state hiện tại trong file trước khi sửa nếu cần tôi xác nhận thêm.
```
✅ Kiểm tra: đổi 1 setting (VD theme), mở app ở trình duyệt ẩn danh đăng nhập cùng tài khoản — setting mới phải tự động có mặt.

---

## Bước 7 — Kiểm tra tổng thể sau khi đồng bộ

**PASTE VÀO HERMES:**
```
Chạy `npm run build` và `npm run lint` (nếu project có cấu hình lint), báo cho tôi
toàn bộ lỗi/warning nếu có. Sau đó liệt kê lại: trong toàn bộ Tab Cài đặt, phần nào
BÂY GIỜ vẫn còn là mock/dữ liệu giả (không đọc/ghi Supabase thật)?
```
✅ Kiểm tra: đối chiếu danh sách Hermes trả về với Phần 6 và Phần 7 trong `data-wiring-spec.md` — phải khớp (chỉ còn Quản lý thiết bị + Google Sheets + Sao lưu là mock, các phần khác đã thật).

---

## Bước 8 — Quản lý thiết bị (bảng mới + ghi log đăng nhập)

**PASTE VÀO HERMES:**
```
Thực hiện đúng Phần 6 trong docs/data-wiring-spec.md:
1. Tạo file migration SQL mới cho bảng user_devices (id, user_id, device_name,
   login_method, last_active, session_id, created_at) kèm RLS Policy — CHƯA tự chạy.
2. Đọc src/app/page.tsx và src/app/login/page.tsx hiện tại — sau mỗi lần
   signInWithPassword/signInWithOtp/signInWithOAuth thành công, thêm 1 lệnh insert
   vào bảng user_devices (device_name lấy từ navigator.userAgent, login_method theo
   đúng phương thức vừa dùng).
3. Sửa Tab Tài khoản → khối Quản lý thiết bị: đọc danh sách thật từ user_devices
   (where user_id = auth.uid()), thay cho mảng hard-code hiện tại. Nút "Đăng xuất"
   từng dòng = xoá dòng đó khỏi bảng.
```
✅ Kiểm tra: chạy SQL migration trên Dashboard trước, sau đó đăng nhập lại — vào Tab Tài khoản → Quản lý thiết bị phải thấy đúng thiết bị/trình duyệt đang dùng, không còn 4 thiết bị mẫu cũ.

---

## Bước 9 — Chốt lại, KHÔNG làm vội phần còn thiếu

**PASTE VÀO HERMES:**
```
Liệt kê lại toàn bộ danh sách những phần trong Tab Cài đặt hiện VẪN CÒN là mock data
sau tất cả các bước vừa làm (dự kiến: Đồng bộ Google Sheets, Sao lưu 3-2-1). Với
2 phần này, ĐỪNG code gì thêm — chỉ xác nhận lại rằng UI hiện tại đang hiển thị đúng
là "mock/demo", không gây hiểu nhầm là đã hoạt động thật (VD: có thể tạm gắn badge
"Sắp ra mắt" nếu chưa có, tôi sẽ quyết định sau).
```
✅ Đây là điểm dừng an toàn — 2 phần còn lại (Google Sheets, Sao lưu) cần hạ tầng ngoài (GitHub Actions, Cloudflare R2, Google OAuth thật) đã bàn trong các lần trò chuyện trước, để làm ở 1 phiên làm việc riêng sau này, không vội trong runbook này.

