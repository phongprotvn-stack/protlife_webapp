# Hermes Runbook 2 — Sửa lỗi role, Edge Function, Sao lưu, Google Sheets

> Nối tiếp `hermes-runbook.md` (Phần 1-9 đã xong, xác nhận qua review code thật ngày
> hôm nay). File này gồm Phần 10-16, **đã cập nhật lại dựa trên code thật** — có 1 lỗi
> mới phát hiện (Phần 10) cần sửa trước tiên.
>
> Cách dùng giống hệt các file trước: mỗi lần dán đúng 1 khối "PASTE VÀO HERMES", làm
> xong tự kiểm tra rồi mới sang bước sau. Bước nào có phần **"🙋 CẬU TỰ LÀM"** thì làm
> xong phần đó trước, KHÔNG để Hermes tự làm thay.

---

## Phần 10 — 🔴 SỬA LỖI: vai trò bị gán cứng `'admin'` cho mọi người

**Bối cảnh:** Review code `src/components/providers.tsx` phát hiện `AuthListener` chỉ
query cột `name` từ bảng `profiles`, không query `role`, nên gán cứng `role: 'admin'`
cho mọi tài khoản đăng nhập — làm vô hiệu hoá toàn bộ hệ thống phân quyền vừa thống
nhất ở Phần 2 (runbook trước).

**PASTE VÀO HERMES:**
```
Trong src/components/providers.tsx, hàm syncSession() bên trong AuthListener đang
query bảng profiles chỉ lấy cột 'name', và gán cứng role: 'admin' khi gọi store.login().

Hãy sửa:
1. Query thêm cột 'role' cùng lúc với 'name' (select('name, role')).
2. Gán role lấy từ dữ liệu thật trả về (profile?.role), KHÔNG hard-code 'admin' nữa.
3. Nếu vì lý do nào đó không lấy được role (lỗi query, network...), mặc định fallback
   về 'viewer' (an toàn hơn 'admin' rất nhiều — không nên mặc định quyền cao khi
   không chắc chắn).
4. Áp dụng sửa tương tự ở CẢ 2 chỗ gọi store.login() trong file (chỗ try và chỗ catch).

Sau khi sửa, chạy npm run build kiểm tra không lỗi.
```
✅ Kiểm tra: vào Supabase Dashboard → Table Editor → bảng `profiles`, đổi tay cột `role` của tài khoản test thành `viewer`. Đăng xuất, đăng nhập lại — vào Tab Phân quyền phải thấy đúng vai trò `Chỉ xem`, KHÔNG còn là Admin. Xong thì đổi lại `role = 'admin'` cho tài khoản chính của cậu.

---

## Phần 11 — Chuẩn bị session_id thật + Postgres function revoke

**Bối cảnh:** Bảng `user_devices` hiện tại (file `src/lib/services/device-service.ts`)
chỉ lưu `device_name`, `login_method`, KHÔNG lưu `session_id` thật — cần bổ sung để
Phần 12 revoke đúng đúng phiên, không revoke nhầm.

**PASTE VÀO HERMES:**
```
Đọc src/lib/services/device-service.ts hiện tại. Cần bổ sung lưu session_id thật:

1. Tạo cho tôi 1 file migration SQL mới (đặt trong supabase/, đúng convention đặt tên
   như các file migration cũ trong đó):
   - ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS session_id UUID;
   - Tạo 1 Postgres function revoke_session(target_session_id UUID) chạy với quyền
     SECURITY DEFINER, nội dung: DELETE FROM auth.sessions WHERE id = target_session_id;
     (đây là cách đáng tin cậy hơn supabase.auth.admin.signOut() — API đó có báo cáo
     lỗi thực tế không xoá được session trong database ở một số phiên bản).
   - GRANT EXECUTE quyền gọi function này CHỈ cho role 'service_role' (không cho phép
     người dùng thường tự gọi trực tiếp).
   Chỉ tạo file SQL, CHƯA tự chạy — tôi sẽ tự chạy tay qua Supabase Dashboard.

2. Sửa hàm recordDeviceLogin() trong device-service.ts: sau khi supabase.auth có
   session, lấy session_id thật bằng cách decode JWT của access_token hiện tại
   (payload JWT có sẵn field 'session_id' — dùng JSON.parse(atob(token.split('.')[1]))
   để đọc, không cần cài thêm thư viện jwt-decode). Lưu giá trị này vào cột session_id
   khi insert vào user_devices.
```
✅ Kiểm tra: chạy SQL migration trên Dashboard trước (`SELECT * FROM pg_proc WHERE proname = 'revoke_session';` phải trả về 1 dòng). Đăng nhập lại 1 lần, vào Table Editor xem bảng `user_devices`, dòng mới nhất phải có cột `session_id` không rỗng (dạng UUID).

---

## Phần 12 — Edge Function `revoke-device-session`

**🙋 CẬU TỰ LÀM trước (nếu máy chưa cài Supabase CLI):**
```powershell
npm install -g supabase
supabase login
supabase link
```

**🤖 PASTE VÀO HERMES:**
```
Tạo Supabase Edge Function mới tên revoke-device-session
(supabase functions new revoke-device-session).

Nội dung:
1. Nhận session_id và device_row_id từ body request (JSON).
2. Tạo Supabase client dùng Service Role Key — không cần tôi cung cấp key, Supabase
   tự cấp sẵn biến môi trường SUPABASE_SERVICE_ROLE_KEY bên trong Edge Function, đọc
   qua Deno.env.get('SUPABASE_SERVICE_ROLE_KEY').
3. Gọi supabase.rpc('revoke_session', { target_session_id: session_id }) — hàm này
   đã tạo ở Phần 11.
4. Nếu thành công, xoá luôn dòng device_row_id tương ứng trong bảng user_devices.
5. Trả về { success: true } hoặc lỗi rõ ràng.

Deploy bằng supabase functions deploy revoke-device-session, báo kết quả deploy.
```
✅ Kiểm tra: Supabase Dashboard → Edge Functions phải thấy `revoke-device-session`, trạng thái "Deployed".

---

## Phần 13 — Nối nút "Đăng xuất" gọi Edge Function thật

**PASTE VÀO HERMES:**
```
Sửa nút "Đăng xuất" ở Tab Tài khoản → Quản lý thiết bị (src/app/settings/page.tsx,
đang gọi trực tiếp deleteDevice() từ device-service.ts): đổi sang gọi Edge Function
qua supabase.functions.invoke('revoke-device-session', { body: { session_id, device_row_id } }).
Nếu thành công mới cập nhật UI/xoá khỏi danh sách, nếu lỗi hiện toast báo lỗi.
```
✅ Kiểm tra: đăng nhập 2 trình duyệt khác nhau cùng 1 tài khoản, ở trình duyệt A vào Quản lý thiết bị, bấm "Đăng xuất" cho dòng của trình duyệt B — quay sang B, F5, phải bị đá về `/login` thật (không chỉ biến mất khỏi danh sách ở A).

---

## Phần 14 — Sao lưu 3-2-1: GitHub Actions + Cloudflare R2

**🙋 CẬU TỰ LÀM trước:**
1. Tạo tài khoản Cloudflare (nếu chưa có) → R2 → tạo bucket mới (VD `protlife-backup`).
2. R2 → Manage API Tokens → tạo token đọc/ghi bucket vừa tạo → lưu `Access Key ID` + `Secret Access Key`.
3. GitHub repo → Settings → Secrets and variables → Actions → thêm 3 secret: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `SUPABASE_DB_URL` (lấy ở Supabase Dashboard → Settings → Database → Connection string).

**🤖 PASTE VÀO HERMES:**
```
Tạo GitHub Actions workflow mới tại .github/workflows/backup-daily.yml, chạy cron
hằng ngày (03:00 UTC):
1. pg_dump qua secret SUPABASE_DB_URL, nén gzip.
2. Upload lên Cloudflare R2 (aws-cli với endpoint R2, đọc R2_ACCESS_KEY_ID/
   R2_SECRET_ACCESS_KEY từ secrets) vào db-dumps/daily/YYYY-MM-DD.dump.gz trong
   bucket protlife-backup.
Chỉ tạo file workflow, CHƯA tự push/chạy.
```
✅ Kiểm tra: commit + push, vào tab Actions, chạy thử tay 1 lần ("Run workflow"), xem log không lỗi, kiểm tra bucket R2 có file mới.

---

## Phần 15 — Google OAuth cho Google Sheets

**🙋 CẬU TỰ LÀM trước:**
1. [Google Cloud Console](https://console.cloud.google.com) → tạo/chọn project.
2. Bật Google Sheets API + Google Drive API.
3. OAuth consent screen → điền tên app "Prot Life" + email liên hệ.
4. Credentials → Create OAuth Client ID → loại Web application → Authorized redirect URI trỏ về domain thật (VD `https://protlife.vercel.app/api/auth/google/callback`).
5. Lưu `Client ID` + `Client Secret` vào `.env.local` và Vercel Environment Variables: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

**🤖 PASTE VÀO HERMES:**
```
Đã có GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET trong biến môi trường. Code luồng OAuth
cho khối "Đồng bộ Google Sheets" ở Tab Dữ liệu (hiện type SheetStatus = 'linked'|
'unlinked' đang hard-code, xem settings/page.tsx dòng ~19 và ~363):
1. Nút "Liên kết với Google" điều hướng sang URL xác thực Google, scope
   'https://www.googleapis.com/auth/drive.file' (KHÔNG xin quyền rộng hơn).
2. Sau redirect, đổi authorization code lấy access + refresh token. Tạo migration SQL
   riêng cho bảng lưu refresh token (CHƯA tự chạy) — KHÔNG lưu token vào localStorage.
3. Dùng token gọi Google Sheets API tạo Sheet mới "ProtLife_Data_Export", cập nhật UI
   sang trạng thái đã liên kết thật (thay thế hard-code 'linked').
```
✅ Kiểm tra: bấm "Liên kết với Google" phải ra đúng màn hình xin quyền thật của Google, xong quay lại thấy tên Sheet thật, mở link ra đúng Sheet vừa tạo.

---

## Phần 16 — Database Webhook → Edge Function #2 + Rà soát cuối

**PASTE VÀO HERMES:**
```
1. Tạo Edge Function thứ 2 tên sync-to-sheet: nhận payload Database Webhook (table,
   type, record), đọc refresh token từ Phần 15, gọi Google Sheets API ghi/cập nhật/xoá
   đúng dòng tương ứng. Deploy function này.
2. Hướng dẫn tôi từng bước TỰ bật Database Webhook trên Supabase Dashboard cho 3 bảng
   contacts, events, memories, trỏ tới URL Edge Function này (chỉ hướng dẫn, không tự
   động hoá vì đây là thao tác UI).
3. Sau khi xong, rà soát lại TOÀN BỘ Tab Cài đặt (cả 7 tab), liệt kê rõ file + dòng
   code nếu còn bất kỳ phần nào là mock/hard-code chưa nối dữ liệu thật.
```
✅ Đây là điểm chốt cuối — nếu danh sách mock trả về rỗng, toàn bộ trang Cài đặt đã hoạt động thật 100%.

