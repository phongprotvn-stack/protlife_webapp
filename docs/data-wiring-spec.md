**ĐẶC TẢ NỐI DỮ LIỆU**

**Trang Cài đặt --- Prot Life (Data Wiring Spec)**

*Dựa trên review trực tiếp code thật (Next.js + Supabase) ngày kiểm tra --- không suy đoán. Đưa tài liệu này cho AI lập trình (DeepSeek) để nối đúng dữ liệu thật, thay thế phần mock còn lại.*

0\. Cách dùng tài liệu này với DeepSeek

Đây KHÔNG phải tài liệu giao diện (đã có ở bản trước) --- đây là tài liệu DỮ LIỆU: bảng nào, cột nào, API nào cần gọi cho từng phần tử UI đã dựng. Không gửi 1 lần toàn bộ tài liệu và bảo \'làm hết\' --- hãy làm theo TỪNG PHẦN theo đúng thứ tự ưu tiên ở Phần 8, mỗi lần chỉ trích đúng 1 mục (VD Phần 3) dán vào DeepSeek kèm câu lệnh mẫu ở cuối mỗi phần. Làm xong, test kỹ, rồi mới sang phần tiếp theo.

**⚠️ QUAN TRỌNG NHẤT: Phần 2 (thống nhất lại vai trò/role) phải làm ĐẦU TIÊN, trước mọi phần khác --- vì code hiện đang có 3 bộ tên vai trò khác nhau xung đột nhau, để càng lâu càng khó sửa khi đã có dữ liệu thật.**

1\. Hiện trạng thật --- kết quả kiểm tra trực tiếp code

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Phần**                                             **Trạng thái**                       **Bằng chứng trong code**
  ---------------------------------------------------- ------------------------------------ --------------------------------------------------------------------------------------------------------------
  Tên/email Tab Tài khoản                              ✅ Thật                              authUser từ useAuthStore, lấy từ Supabase Auth

  3 số liệu Người thân/Sự kiện/Ký ức                   ✅ Thật                              settings-service.ts --- COUNT(\*) thật trên bảng contacts/events/memories

  Số liệu \'Địa điểm\'                                 ⚪ Chưa làm (không phải giả)         Code ghi rõ \'Not implemented yet\', trả về 0

  Dung lượng DB/File Storage (MB)                      ⚠️ Nửa thật                          Đếm bản ghi thật, nhưng số MB suy từ công thức tự đặt (8KB/contact\...), không phải số byte thật từ Supabase

  Toggle Giao diện/Thông báo/Riêng tư/Nguồn liên kết   ⚠️ Nửa thật                          Lưu thật vào localStorage qua Zustand persist --- CHƯA đồng bộ lên Supabase

  Quản lý thiết bị                                     ❌ Giả hoàn toàn                     Mảng 4 thiết bị hard-code trong component

  Đồng bộ Google Sheets                                ❌ Giả hoàn toàn                     useState(\'linked\') gán cứng, không có OAuth thật

  Toggle Sao lưu 3-2-1 (R2/Drive/Git)                  ⚠️ Nửa thật                          Bật/tắt lưu local thật, nhưng không có GitHub Actions/R2 nào chạy phía sau

  Tab Phân quyền                                       ❌ Giả hoàn toàn + sai tên vai trò   Mảng hard-code, dùng tên vai trò KHÁC với schema.sql thật (xem Phần 2)
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

2\. ƯU TIÊN #0 --- Thống nhất lại vai trò (role)

Đã xác nhận trực tiếp trong code: có 3 bộ tên vai trò khác nhau đang tồn tại song song, xung đột nhau:

  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Nơi định nghĩa**                                                                 **Bộ giá trị hiện tại**              **Vấn đề**
  ---------------------------------------------------------------------------------- ------------------------------------ -------------------------------------------------------------------------------------
  supabase/schema.sql (CHECK constraint + 6 RLS Policy) --- NGUỒN THẬT, giữ nguyên   public, viewer, contributor, admin   Đây là bộ ĐÚNG, đã chốt giữ nguyên theo yêu cầu

  src/stores/auth-store.ts --- UserProfile.role                                      admin, viewer, contributor           Thiếu \'public\' --- không mô tả được người xem công khai

  src/app/settings/page.tsx --- RoleKey (Tab Phân quyền)                             admin, member, viewer, guest         Sai hoàn toàn 2/4 giá trị so với schema thật (member, guest không tồn tại trong DB)
  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

2.1 Việc cần làm

-   Sửa src/stores/auth-store.ts --- dòng \'role: admin \| viewer \| contributor\' → thêm \'public\': role: \'public\' \| \'viewer\' \| \'contributor\' \| \'admin\'.

-   Sửa src/app/settings/page.tsx --- dòng \'type RoleKey = admin \| member \| viewer \| guest\' → đổi thành: type RoleKey = \'public\' \| \'viewer\' \| \'contributor\' \| \'admin\'.

-   Sửa mảng hard-code ở Tab Phân quyền (dòng \~624-627 hiện tại: admin/member/viewer) --- đổi label theo đúng bảng mapping dưới đây.

2.2 Bảng mapping hiển thị UI (áp dụng cho RolePill và bảng vai trò)

  ---------------------------------------------------------------------------------------------------------------------
  **Giá trị DB**    **Nhãn hiển thị UI**   **Mô tả hiển thị**                                   **Màu pill**
  ----------------- ---------------------- ---------------------------------------------------- -----------------------
  admin             Admin                  Toàn quyền quản lý                                   Đỏ (\--color-primary)

  contributor       Người đóng góp         Được thêm/sửa dữ liệu, không xoá/không vào Cài đặt   Tím #8B5CF6

  viewer            Chỉ xem                Xem được, không chỉnh sửa                            Xanh lá #10B981

  public            Khách công khai        Xem giới hạn qua link chia sẻ, không cần tài khoản   Xám #6B7280
  ---------------------------------------------------------------------------------------------------------------------

2.3 Prompt mẫu gửi DeepSeek cho phần này

Trong project Next.js + Supabase của tôi, có 3 nơi định nghĩa vai trò (role) khác nhau:

1\. supabase/schema.sql: CHECK (role IN (\'public\',\'viewer\',\'contributor\',\'admin\')) --- GIỮ NGUYÊN, đây là chuẩn.

2\. src/stores/auth-store.ts: UserProfile.role đang là \'admin\'\|\'viewer\'\|\'contributor\' --- hãy sửa thành

\'public\'\|\'viewer\'\|\'contributor\'\|\'admin\' cho khớp schema.

3\. src/app/settings/page.tsx: type RoleKey đang là \'admin\'\|\'member\'\|\'viewer\'\|\'guest\' --- hãy sửa thành

\'public\'\|\'viewer\'\|\'contributor\'\|\'admin\', và cập nhật lại mảng hard-code trong PermissionsTab

theo đúng 4 giá trị mới, cùng nhãn hiển thị: admin=\'Admin\', contributor=\'Người đóng góp\',

viewer=\'Chỉ xem\', public=\'Khách công khai\'. Không đổi gì trong schema.sql.

3\. Tab Tài khoản --- đã đúng, chỉ cần bổ sung nhỏ

Tên/email đã lấy thật từ authUser. Chỉ còn thiếu: nút \'Lưu thay đổi\' hiện chỉ gọi setSetting() lưu vào Zustand/localStorage (state.displayName, state.phone\...), CHƯA ghi ngược lại bảng profiles thật trên Supabase.

Việc cần làm

-   Sửa hàm handleSaveProfile trong settings/page.tsx: sau khi setSetting(\...), gọi thêm 1 lệnh UPDATE bảng profiles (cột name --- đã có sẵn trong schema) qua Supabase.

await supabase.from(\'profiles\').update({ name: editName }).eq(\'id\', authUser.id);

Lưu ý: bảng profiles hiện chỉ có cột \'name\', KHÔNG có cột \'phone\', \'dob\', \'gender\' --- các trường này hiện chỉ tồn tại trong Zustand/localStorage. Nếu muốn 3 trường này cũng đồng bộ thật, xem Phần 5 (bảng user_preferences).

4\. Tab Dữ liệu --- sửa phần dung lượng ước lượng

3 số liệu đếm bản ghi đã đúng, không cần sửa. Phần dung lượng MB đang dùng công thức áng chừng --- có 2 hướng xử lý, chọn 1:

-   HƯỚNG A (đơn giản, khuyên dùng trước mắt): giữ nguyên công thức ước lượng NHƯNG đổi nhãn UI từ \'312 MB / 500 MB\' thành \'\~312 MB / 500 MB (ước tính)\' để không gây hiểu nhầm là số chính xác.

-   HƯỚNG B (chính xác nhưng cần thêm hạ tầng): gọi Supabase Management API (cần Service Role Key, PHẢI gọi từ server/Edge Function, không được gọi trực tiếp từ trình duyệt vì lộ key) để lấy đúng dung lượng byte thật --- để dành làm sau, không ưu tiên ngay.

Prompt mẫu gửi DeepSeek (Hướng A --- làm ngay)

Trong src/lib/services/settings-service.ts, hàm getDataStats() đang tính storageDbMb bằng công thức

ước lượng (contactCount\*8000 + eventCount\*4000 + memoryCount\*6000)/1MB, không phải số thật.

Hãy giữ nguyên công thức này, nhưng thêm 1 field \'isEstimate: true\' vào object trả về, và ở phần UI

hiển thị (Tab Dữ liệu, khối storage-block), thêm dấu \~ phía trước số MB và ghi chú nhỏ \'(ước tính)\'

ngay cạnh, để người dùng biết đây không phải số byte chính xác.

5\. Đồng bộ Settings (Zustand) lên Supabase --- việc nên làm sớm nhất

Đây là phần giá trị nhất/dễ nhất trong danh sách --- khung Zustand đã có sẵn (36 field trong SettingsState), chỉ cần thêm 1 bảng và 1 lượt đồng bộ hai chiều.

5.1 Tạo bảng mới trong Supabase

CREATE TABLE IF NOT EXISTS user_preferences (

user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

settings JSONB NOT NULL DEFAULT \'{}\',

updated_at TIMESTAMPTZ DEFAULT NOW()

);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY \"Users manage own preferences\"

ON user_preferences FOR ALL

USING (auth.uid() = user_id)

WITH CHECK (auth.uid() = user_id);

Dùng 1 cột JSONB duy nhất (thay vì 36 cột riêng) vì cấu trúc SettingsState hiện tại đã là 1 object phẳng hợp lý --- lưu nguyên object vào JSONB đơn giản hơn nhiều, không cần đổi lại mỗi khi thêm setting mới sau này.

5.2 Cách đồng bộ --- tải khi mở app, lưu khi đổi

-   Khi user đăng nhập / mở app: đọc user_preferences.settings, nếu có thì gọi useSettingsStore.setState(data) để nạp đè lên giá trị mặc định/localStorage.

-   Khi user đổi bất kỳ setting nào (hàm set() trong store đã có sẵn, mọi nơi trong Settings đều gọi qua đây): sau khi set() xong, gọi thêm 1 lượt upsert lên Supabase (nên debounce \~800ms để tránh gọi API liên tục khi kéo thanh trượt cỡ chữ).

Prompt mẫu gửi DeepSeek

Tôi cần đồng bộ Zustand store \'useSettingsStore\' (file src/stores/settings-store.ts) lên Supabase

để cài đặt không bị mất khi đổi thiết bị. Đã tạo sẵn bảng user_preferences (user_id, settings jsonb).

Hãy:

1\. Thêm 1 hàm loadPreferencesFromServer() gọi lúc app khởi động (trong layout hoặc AuthProvider hiện

có), đọc user_preferences.settings theo auth.uid() hiện tại, nếu có dữ liệu thì gọi

useSettingsStore.setState(data) để nạp vào store.

2\. Sửa hàm set() trong settings-store.ts (hoặc thêm 1 middleware/subscribe riêng) để mỗi lần state

đổi, debounce 800ms rồi gọi supabase.from(\'user_preferences\').upsert({ user_id, settings: state,

updated_at: new Date() }).

3\. Không đổi giao diện, chỉ thêm phần đồng bộ nền phía sau.

6\. Tab Quản lý thiết bị --- cần hạ tầng mới

Hiện là mảng hard-code, không đọc gì thật. Đây là phần khó nhất vì Supabase Auth KHÔNG có sẵn API liệt kê thiết bị kèm tên/vị trí --- phải tự ghi lại.

6.1 Bảng mới

CREATE TABLE IF NOT EXISTS user_devices (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

device_name TEXT,

login_method TEXT,

last_active TIMESTAMPTZ DEFAULT NOW(),

session_id TEXT,

created_at TIMESTAMPTZ DEFAULT NOW()

);

ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY \"Users manage own devices\" ON user_devices FOR ALL

USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-   Ghi 1 dòng vào bảng này mỗi khi đăng nhập thành công (trong page.tsx/login/page.tsx, ngay sau signInWithPassword/signInWithOtp/signInWithOAuth thành công) --- lấy device_name từ navigator.userAgent, login_method theo phương thức vừa dùng.

-   Đăng xuất 1 thiết bị = xoá đúng dòng đó khỏi bảng (không có API revoke session cụ thể từ client, nên chỉ mang tính hiển thị/ghi nhận --- muốn revoke thật cần Edge Function dùng service role, để dành sau).

-   Đây là phần nên làm SAU CÙNG trong danh sách --- độ ưu tiên thấp hơn Phần 5 và Phần 2.

7\. Tab Đồng bộ Google Sheets & Tab Sao lưu --- chưa nên làm vội

Cả 2 phần này cần hạ tầng ngoài Supabase (Google OAuth thật với scope drive.file, GitHub Actions, Cloudflare R2) --- đã có thiết kế UI đầy đủ từ tài liệu đặc tả giao diện trước, nhưng PHẦN BACKEND thật sự chưa nên vội làm cho tới khi Phần 2 và Phần 5 xong và ổn định. Khi tới lúc làm, quay lại đúng kiến trúc đã thống nhất trong các lần trò chuyện trước: GitHub Actions làm engine (không dùng Vercel Cron), R2 + Google Drive cho snapshot hàng tháng, Supabase Database Webhook cho chiều App → Sheet.

8\. Thứ tự triển khai đề xuất

  -------------------------------------------------------------------------------------------------------------------------
  **Thứ tự**   **Việc**                                 **Độ khó**   **Vì sao ưu tiên**
  ------------ ---------------------------------------- ------------ ------------------------------------------------------
  1            Thống nhất role (Phần 2)                 Thấp         Càng để lâu càng khó sửa khi đã có user thật

  2            Đồng bộ Settings lên Supabase (Phần 5)   Trung bình   Giá trị cao nhất/công sức thấp nhất, khung đã có sẵn

  3            Lưu profile đầy đủ (Phần 3)              Thấp         Nhỏ, làm cùng lúc với Phần 5 luôn

  4            Sửa nhãn dung lượng ước tính (Phần 4)    Rất thấp     1 dòng UI, không rủi ro

  5            Quản lý thiết bị (Phần 6)                Cao          Cần bảng mới + thay đổi luồng đăng nhập

  6            Google Sheets & Sao lưu (Phần 7)         Rất cao      Cần hạ tầng ngoài, để sau cùng
  -------------------------------------------------------------------------------------------------------------------------

9\. Cách nói chuyện với DeepSeek --- nguyên tắc chung

Rút kinh nghiệm từ lần trước (DeepSeek bịa mock data vì chỉ được đưa bản đặc tả GIAO DIỆN) --- lần này áp dụng nguyên tắc sau cho MỌI prompt gửi đi:

-   Luôn nói rõ: \'Đây là spec DỮ LIỆU, không phải spec giao diện --- KHÔNG được đổi bố cục/màu sắc/chữ đã có trên UI, chỉ nối đúng nguồn dữ liệu theo mô tả.\'

-   Luôn dán kèm ĐÚNG đoạn code hiện tại (copy nguyên văn từ file thật) mà bạn muốn nó sửa, không mô tả chung chung \'sửa file settings\' --- dán hẳn đoạn code cũ vào, để nó sửa trên nền code thật, không viết lại từ đầu.

-   Luôn yêu cầu: \'Nếu có bảng/cột nào tôi liệt kê chưa tồn tại trong Supabase, hãy generate cho tôi câu lệnh SQL CREATE TABLE riêng, đừng tự ý đổi tên bảng/cột đã có.\'

-   Làm xong 1 phần, luôn yêu cầu thêm: \'Liệt kê rõ những chỗ nào trong code vừa sửa VẪN CÒN là dữ liệu giả/chưa nối, nếu có.\' --- để tự AI khai báo phần còn thiếu, tránh lặp lại đúng vấn đề ban đầu.

10\. Tóm tắt --- đoạn mở đầu nên dán vào DeepSeek trước khi bắt đầu bất kỳ phần nào

**Copy đúng đoạn dưới đây làm tin nhắn đầu tiên gửi DeepSeek trong phiên làm việc mới:**

Tôi đang phát triển tiếp app Next.js + Supabase tên Prot Life. Trang Cài đặt đã có giao diện hoàn

chỉnh nhưng một số phần đang dùng mock data (dữ liệu giả hard-code) thay vì nối Supabase thật.

Tôi sẽ gửi cho bạn từng phần theo 1 tài liệu đặc tả nối dữ liệu đã chuẩn bị sẵn, kèm đúng đoạn code

hiện tại cần sửa. Yêu cầu:

\- Chỉ sửa phần LOGIC/DỮ LIỆU, không đổi giao diện/bố cục/màu sắc đã có.

\- Nếu cần bảng/cột mới trong Supabase, generate câu lệnh SQL riêng, không tự đổi bảng/cột đã có.

\- Sau khi sửa xong, liệt kê rõ phần nào trong code vẫn còn là mock/giả, nếu có.

Tôi sẽ bắt đầu với phần đầu tiên ngay sau đây.
