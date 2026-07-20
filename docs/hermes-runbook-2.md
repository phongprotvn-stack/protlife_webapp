# Hermes Runbook 2 — Edge Function, Sao lưu, Google Sheets

> Nối tiếp `hermes-runbook.md` (đã xong 9 bước). File này gồm Bước 10-16.
> Cách dùng giống hệt file trước: mỗi lần dán đúng 1 khối "PASTE VÀO HERMES", làm xong tự kiểm tra rồi mới sang bước sau.
>
> **Khác 1 điểm quan trọng so với file trước:** một số bước (13, 14) có phần việc
> **chỉ cậu tự làm được, Hermes không làm thay được** — vì cần bấm chuột tạo tài khoản/lấy
> API key trên trang web ngoài (Cloudflare, GitHub, Google Cloud Console). Những phần đó
> được đánh dấu rõ **"🙋 CẬU TỰ LÀM"**, tách khỏi phần **"🤖 HERMES LÀM"**.

---

## Bước 10 — Đồng bộ auth-store với session thật

**PASTE VÀO HERMES:**
```
Đọc src/stores/auth-store.ts và toàn bộ nơi đang gọi supabase.auth (src/app/page.tsx,
src/app/login/page.tsx). Hiện tại auth-store tự quản lý trạng thái đăng nhập thủ công,
CHƯA lắng nghe supabase.auth.onAuthStateChange().

Hãy thêm 1 listener onAuthStateChange (đặt ở nơi hợp lý nhất trong app, ví dụ 1
AuthProvider bọc toàn app nếu đã có, hoặc tạo mới nếu chưa có) — khi Supabase báo
SIGNED_IN/SIGNED_OUT/TOKEN_REFRESHED, cập nhật lại đúng state trong auth-store cho
khớp, không để 2 nguồn trạng thái (Supabase thật và auth-store) lệch nhau.

Sau khi sửa xong, chạy npm run build kiểm tra không lỗi.
```
✅ Kiểm tra: đăng nhập ở 1 tab, mở thêm tab thứ 2 cùng trình duyệt — tab 2 phải tự nhận trạng thái đã đăng nhập mà không cần F5.

---

## Bước 11 — Xây Edge Function `revoke-device-session`

**🙋 CẬU TỰ LÀM trước (1 lần duy nhất, nếu máy chưa cài Supabase CLI):**
```powershell
npm install -g supabase
supabase login
```
Lệnh `login` sẽ mở trình duyệt để cậu đăng nhập — làm xong quay lại terminal là được.

**🤖 PASTE VÀO HERMES:**
```
Tạo 1 Supabase Edge Function mới tên revoke-device-session (dùng lệnh
`supabase functions new revoke-device-session` nếu cần khởi tạo khung).

Nội dung function:
1. Nhận session_id từ body request (JSON).
2. Tạo Supabase client với Service Role Key — LƯU Ý: không cần tôi cung cấp key,
   Supabase tự động cấp sẵn biến môi trường SUPABASE_SERVICE_ROLE_KEY bên trong mọi
   Edge Function, chỉ cần đọc qua Deno.env.get('SUPABASE_SERVICE_ROLE_KEY').
3. Gọi supabase.auth.admin.signOut(session_id) để vô hiệu hoá đúng phiên đó.
4. Nếu thành công, xoá luôn dòng tương ứng trong bảng user_devices (theo session_id).
5. Trả về JSON { success: true } hoặc lỗi rõ ràng nếu thất bại.

Sau khi viết xong code, chạy `supabase functions deploy revoke-device-session` để
deploy lên Supabase thật, và báo cho tôi kết quả deploy.
```
✅ Kiểm tra: vào Supabase Dashboard → Edge Functions, phải thấy `revoke-device-session` xuất hiện, trạng thái "Deployed".

---

## Bước 12 — Nối nút "Đăng xuất" gọi Edge Function thật

**PASTE VÀO HERMES:**
```
Sửa nút "Đăng xuất" ở Tab Tài khoản → Quản lý thiết bị (đã nối bảng user_devices ở
Bước 8): thay vì chỉ xoá row trực tiếp trong bảng như hiện tại, gọi:

  const { error } = await supabase.functions.invoke('revoke-device-session', {
    body: { session_id: device.session_id }
  });

Nếu thành công mới xoá khỏi UI/bảng, nếu lỗi thì hiện toast báo lỗi, không xoá.
```
✅ Kiểm tra: đăng nhập bằng 2 trình duyệt khác nhau (VD Chrome + Edge) cùng 1 tài khoản, vào Quản lý thiết bị ở Chrome, bấm "Đăng xuất" cho dòng của Edge — quay sang tab Edge, thử F5, phải bị đá về trang đăng nhập thật.

---

## Bước 13 — Sao lưu 3-2-1: GitHub Actions + Cloudflare R2

Đây là bước có nhiều việc **cậu phải tự bấm tay** trên các trang ngoài trước — Hermes không tạo tài khoản/lấy key hộ được.

**🙋 CẬU TỰ LÀM trước:**
1. Tạo tài khoản Cloudflare (nếu chưa có) → vào R2 → tạo 1 bucket mới (VD `protlife-backup`).
2. Cloudflare Dashboard → R2 → Manage API Tokens → tạo token có quyền đọc/ghi bucket vừa tạo → lưu lại `Access Key ID` và `Secret Access Key`.
3. Vào GitHub repo của project → Settings → Secrets and variables → Actions → thêm 3 secret: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `SUPABASE_DB_URL` (connection string Postgres, lấy ở Supabase Dashboard → Settings → Database).

**🤖 PASTE VÀO HERMES (sau khi 3 bước trên xong):**
```
Tạo 1 GitHub Actions workflow mới tại .github/workflows/backup-daily.yml, chạy theo
lịch cron hằng ngày (03:00 UTC). Job này:
1. Dùng pg_dump kết nối qua secret SUPABASE_DB_URL, dump toàn bộ database, nén gzip.
2. Upload file dump nén lên Cloudflare R2 (dùng aws-cli với endpoint R2, đọc key từ
   secret R2_ACCESS_KEY_ID và R2_SECRET_ACCESS_KEY), lưu vào đường dẫn
   db-dumps/daily/YYYY-MM-DD.dump.gz trong bucket protlife-backup.
Không cần tôi cung cấp secret gì thêm ngoài 3 cái đã thêm trong GitHub — workflow đọc
qua ${{ secrets.TÊN_SECRET }} như chuẩn GitHub Actions.

Chỉ tạo file workflow, CHƯA tự ý push/chạy — tôi sẽ tự kiểm tra rồi commit.
```
✅ Kiểm tra: đọc lại file `.github/workflows/backup-daily.yml`, commit + push, vào tab Actions trên GitHub, chạy thử thủ công 1 lần (nút "Run workflow"), xem log chạy có báo lỗi không, kiểm tra bucket R2 có file mới xuất hiện.

---

## Bước 14 — Google OAuth cho Google Sheets

**🙋 CẬU TỰ LÀM trước:**
1. Vào [Google Cloud Console](https://console.cloud.google.com) → tạo project mới (hoặc dùng project có sẵn).
2. Bật **Google Sheets API** và **Google Drive API** (mục APIs & Services → Library).
3. Vào **OAuth consent screen** → điền thông tin cơ bản (tên app "Prot Life", email liên hệ).
4. Vào **Credentials** → Create Credentials → OAuth Client ID → loại "Web application" → thêm `Authorized redirect URI` trỏ về domain app của cậu (VD `https://protlife.vercel.app/api/auth/google/callback`).
5. Lưu lại `Client ID` và `Client Secret`.
6. Thêm 2 giá trị đó vào biến môi trường project (`.env.local` và trên Vercel → Settings → Environment Variables): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

**🤖 PASTE VÀO HERMES (sau khi có Client ID/Secret trong biến môi trường):**
```
Tôi đã có GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET trong biến môi trường. Hãy code
luồng OAuth liên kết Google Sheets cho khối "Đồng bộ Google Sheets" ở Tab Dữ liệu
(hiện đang mock, xem lại code cũ trong settings/page.tsx):
1. Nút "Liên kết với Google" điều hướng sang URL xác thực Google, scope
   'https://www.googleapis.com/auth/drive.file' (KHÔNG xin quyền rộng hơn).
2. Sau khi Google redirect về, đổi authorization code lấy access token + refresh
   token, lưu refresh token vào 1 bảng mới (tạo file migration SQL riêng, không tự
   chạy) — KHÔNG lưu token vào localStorage hay bất kỳ chỗ nào trình duyệt đọc được.
3. Dùng token đó gọi Google Sheets API tạo 1 Sheet mới tên "ProtLife_Data_Export",
   cập nhật UI sang trạng thái "đã liên kết" thật.
```
✅ Kiểm tra: bấm "Liên kết với Google", phải thấy đúng màn hình xin quyền thật của Google (không phải mô phỏng), chọn tài khoản xong quay lại app phải thấy trạng thái "đã liên kết" với tên Sheet thật, mở thử link phải ra đúng Google Sheet vừa tạo.

---

## Bước 15 — Database Webhook → Edge Function thứ 2 (App → Sheet)

**PASTE VÀO HERMES:**
```
Tạo Edge Function thứ 2 tên sync-to-sheet:
1. Nhận payload từ Supabase Database Webhook (table, type: INSERT/UPDATE/DELETE, record).
2. Đọc refresh token đã lưu ở Bước 14, đổi lấy access token mới nếu cần.
3. Gọi Google Sheets API ghi/cập nhật/xoá đúng dòng tương ứng trên Sheet đã liên kết.
Deploy function này (supabase functions deploy sync-to-sheet).

Sau đó hướng dẫn tôi từng bước để tự bật Database Webhook trên Supabase Dashboard cho
3 bảng contacts, events, memories, trỏ webhook tới URL của Edge Function này — không
cần tự động hoá bước bật webhook, chỉ hướng dẫn tôi làm tay vì đây là thao tác UI trên
Dashboard.
```
✅ Kiểm tra: thêm 1 người thân mới trong app, mở Google Sheet lên xem có dòng mới xuất hiện trong vài giây không.

---

## Bước 16 — Rà soát tổng thể lần cuối

**PASTE VÀO HERMES:**
```
Rà soát lại toàn bộ Tab Cài đặt (Tài khoản, Dữ liệu, Riêng tư, Thông báo, Giao diện,
Phân quyền, Sao lưu) và liệt kê: còn phần nào là mock/hard-code không đọc-ghi dữ liệu
thật không? Với mỗi phần liệt kê, ghi rõ file và dòng code liên quan.
```
✅ Đây là điểm chốt — nếu danh sách trả về rỗng (không còn mock nào), toàn bộ trang Cài đặt đã hoạt động thật 100%. Nếu còn sót, xử lý riêng từng cái theo đúng nguyên tắc cũ (1 phần/1 lần, không gộp).

