**ĐẶC TẢ THIẾT KẾ GIAO DIỆN**

**Trang Đăng nhập --- Prot Life**

*Tài liệu dùng để giao cho AI lập trình (VD: DeepSeek) code lại chính xác giao diện demo đã thống nhất.*

0\. Hướng dẫn sử dụng tài liệu

Tài liệu mô tả trang Đăng nhập, giữ nguyên đúng bố cục 2 khối (trái: giới thiệu thương hiệu + ảnh cover; phải: form đăng nhập) đã có sẵn trong app hiện tại, chỉ bổ sung phương thức Magic Link còn thiếu và thay ảnh nền bằng ảnh cover chính thức. Đưa nguyên văn tài liệu cho AI lập trình kèm theo file ảnh cover đính kèm riêng.

1\. Design Tokens

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Tên biến**              **Giá trị**                                                   **Vai trò**
  ------------------------- ------------------------------------------------------------- -------------------------------------------------------------------------------
  \--color-primary          #E6002D                                                       Màu thương hiệu chính

  \--color-primary-dark     #B8001F                                                       Điểm đầu gradient panel trái (đậm hơn bản gradient chuẩn để ảnh cover nổi rõ)

  \--color-primary-light    #FF4B3A                                                       Điểm cuối phụ gradient

  \--grad-primary           linear-gradient(135deg,#8A0020 0%,#D60032 45%,#FF4B3A 100%)   Gradient nền panel trái + nút chính

  \--color-text-primary     #101010                                                       Chữ chính

  \--color-text-secondary   #6B7280                                                       Chữ phụ

  \--color-text-muted       #9CA3AF                                                       Chữ mờ nhất

  \--border                 #EEEEF1                                                       Viền input/card
  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------

2\. Bố cục tổng thể

Toàn màn hình chia 2 khối ngang, chiều cao = 100vh, không cuộn trang ngoài:

-   Panel trái: flex:1 (chiếm phần còn lại), nền gradient đỏ đậm, chứa ảnh cover + nội dung giới thiệu thương hiệu.

-   Panel phải: rộng cố định 46% màn hình (min-width 420px), nền trắng, chứa form đăng nhập căn giữa theo cả chiều dọc lẫn ngang, max-width nội dung form là 380px.

-   Responsive: dưới 860px, ẩn hẳn panel trái, panel phải chiếm 100% chiều rộng.

3\. Panel trái --- Thương hiệu & ảnh cover

3.1 Ảnh cover (BẮT BUỘC dùng đúng file ảnh đính kèm riêng, không tự tạo ảnh khác)

-   File ảnh: \'protlife_cover.png\' (đính kèm cùng tài liệu này) --- nội dung: chữ \'P\' màu đỏ rực phong cách vũ trụ/thiên hà, có các hành tinh nhỏ bay quanh quỹ đạo, nền đen với dải ngân hà đỏ cam.

-   Lưu ảnh vào thư mục assets thực của dự án (VD: /public/images/protlife-cover.jpg), KHÔNG nhúng base64 trực tiếp trong CSS ở bản chạy thật (bản demo HTML đính kèm có nhúng base64 chỉ để tiện xem trước, không dùng cách này khi code chính thức vì làm nặng bundle).

-   CSS: đặt ảnh làm background-image của 1 lớp phủ kín toàn bộ panel trái (position:absolute, inset:0), background-size:cover, background-position:\'center 35%\' (ưu tiên phần trên của ảnh nơi có chữ P), độ mờ (opacity) khoảng 0.55 để không lấn át chữ phía trên.

-   Phủ thêm 1 lớp gradient tối phía trên ảnh (để chữ luôn đọc được dù nền ảnh sáng/tối chỗ nào): linear-gradient(180deg, rgba(138,0,32,.55) 0%, rgba(138,0,32,.25) 30%, rgba(20,0,5,.65) 78%, rgba(10,0,2,.9) 100%) --- tối dần từ trên xuống dưới, đậm nhất ở đáy nơi có logo/footer.

3.2 Nội dung chữ (nằm trên 2 lớp ảnh + overlay, z-index cao hơn)

-   Hàng thương hiệu trên cùng: ô vuông bo góc 11px, nền trắng mờ 14% có hiệu ứng blur kính (glassmorphism), chữ \'P\' trắng đậm --- cạnh đó 2 dòng: \'Prot Life\' đậm 17px, \'Hệ điều hành cuộc sống cá nhân\' cỡ nhỏ 11.5px mờ hơn.

-   Khối giữa (căn giữa theo chiều dọc bằng margin-top/bottom:auto): tiêu đề lớn 34px đậm \'Quản lý cuộc sống theo cách của bạn\'; đoạn mô tả 14px màu trắng mờ 82%: \'Một nền tảng cá nhân để quản lý quan hệ, sự kiện, ký ức và mục tiêu --- tất cả trong một không gian riêng tư, bảo mật.\'

Lưới 2×2 các thẻ tính năng (nền kính mờ trắng 9%, viền trắng mờ 16%, bo góc 16px, hiệu ứng backdrop-blur), đúng 4 thẻ theo thứ tự:

-   👥 Quản lý quan hệ --- \'Theo dõi kết nối, sinh nhật, tương tác\'

-   📅 Sự kiện & Ký ức --- \'Ghi lại mọi khoảnh khắc đáng nhớ\'

-   🧠 AI Insight --- \'Phân tích thông minh cuộc sống của bạn\'

-   🛡️ Bảo mật & Riêng tư --- \'Dữ liệu cá nhân được bảo vệ tuyệt đối\'

```{=html}
<!-- -->
```
-   Chân panel trái: chữ nhỏ mờ \'Made with ♥ by Prot\'.

4\. Panel phải --- Form đăng nhập

4.1 Banner phiên đăng nhập cũ (hiển thị CÓ ĐIỀU KIỆN)

-   CHỈ hiện khi hệ thống phát hiện đã có session hợp lệ chưa hết hạn lưu trong trình duyệt (VD: Supabase vẫn còn access token/refresh token hợp lệ) --- không hiện mặc định với người dùng mới/đã đăng xuất.

-   Nội dung: nền xanh dương rất nhạt #EFF6FF, viền #DBEAFE, bo góc 14px --- dòng chữ nhỏ xanh dương \'Bạn đã đăng nhập\' + nút xanh dương full-width \'Vào Dashboard →\' (điều hướng thẳng vào /dashboard, bỏ qua toàn bộ form bên dưới).

4.2 Tiêu đề form

-   \'Đăng nhập\' --- đậm 24px. Dòng phụ: \'Đăng nhập để tiếp tục\' --- 13px màu mờ.

4.3 Bộ chọn phương thức (MỚI --- cần bổ sung, bản cũ chưa có)

-   2 tab dạng pill nằm trong 1 khay nền xám nhạt #F4F4F6 bo góc 12px, padding 4px: \'Mật khẩu\' (mặc định active) và \'Magic Link\'.

-   Tab active: nền trắng, chữ đỏ, có đổ bóng nhẹ. Tab thường: nền trong suốt, chữ xám.

-   Bấm đổi tab → ẩn/hiện đúng khối field tương ứng bên dưới bằng JS (không tải lại trang).

4.4 Khối \'Mật khẩu\' (hiện khi tab Mật khẩu active)

-   Field Email --- input text, placeholder \'email@domain.com\'.

-   Field Mật khẩu --- input type password, placeholder 8 chấm, có nút icon con mắt 👁️ bên trong input (bên phải) để bật/tắt hiện mật khẩu --- bấm đổi type input giữa \'password\' và \'text\', đồng thời đổi icon giữa 👁️ và 🙈.

-   Dòng \'Quên mật khẩu?\' --- canh phải, ngay dưới field mật khẩu, chữ đỏ nhỏ, là link (MỚI --- bổ sung so với bản cũ).

-   Nút chính full-width \'Đăng nhập\' --- nền gradient đỏ, bo góc 13px, có đổ bóng màu đỏ.

4.5 Khối \'Magic Link\' (hiện khi tab Magic Link active) --- MỚI HOÀN TOÀN

Có 2 trạng thái con, chuyển đổi qua JS:

-   Trạng thái A (mặc định --- form nhập): 1 field Email + nút chính full-width \'Gửi link đăng nhập\'.

-   Trạng thái B (sau khi bấm gửi): ẩn form, hiện khối xác nhận --- icon tròn nền xanh lá nhạt dấu tick lớn căn giữa; tiêu đề đậm \'Đã gửi link đăng nhập!\'; đoạn mô tả nhỏ có chèn động đúng email vừa nhập: \'Kiểm tra hộp thư \[email\] và bấm vào link để đăng nhập --- không cần nhớ mật khẩu.\'; dòng chữ đỏ nhỏ có thể bấm \'Gửi lại email\' để gửi lại (không quay về form nhập lại từ đầu).

4.6 Đường phân cách

-   1 đường kẻ ngang mờ ở giữa có chữ nhỏ \'Hoặc\' --- dùng để tách phần đăng nhập bằng mật khẩu/magic link (native) với phần đăng nhập mạng xã hội (OAuth) bên dưới.

4.7 Nút đăng nhập mạng xã hội (OAuth)

-   2 nút xếp dọc, nền trắng, viền mỏng xám, bo góc 12px, full-width:

    -   Nút \'Google\' --- icon tròn nhỏ nền xanh dương #4285F4 chữ \'G\' trắng bên trong (không dùng logo Google chính thức, chỉ mô phỏng khái quát) + chữ \'Google\'.

-   CHỈ 1 nút OAuth duy nhất --- KHÔNG có nút Apple. Đúng 3 phương thức đăng nhập đã chốt: Email/Password, Magic Link, Google --- không thêm phương thức nào khác.

-   Ghi chú cho việc sau này: nếu app được đóng gói qua Capacitor để phát hành lên Apple App Store, lúc đó Apple App Store Review Guideline 4.8 sẽ bắt buộc phải có thêm nút \'Sign in with Apple\' (vì đã có đăng nhập Google) --- nhưng đây là việc của giai đoạn sau, chưa áp dụng cho bản web hiện tại.

4.8 Chân form

-   Dòng chữ nhỏ căn giữa: \'Chưa có tài khoản? Đăng ký ngay\' (chữ \'Đăng ký ngay\' là link màu đỏ đậm).

5\. Toast thông báo (dùng chung, giữ nguyên style đã thống nhất ở tài liệu Cài đặt trước đó)

Vị trí cố định trên cùng giữa màn hình, nền đen mờ 85% + hiệu ứng blur phía sau, chữ trắng, bo góc viên thuốc. Dùng cho các phản hồi demo: bấm \'Đăng nhập\' → toast \'Đang đăng nhập\...\'; bấm nút Google → toast \'↗️ Chuyển tới Google\...\'; bấm \'Gửi lại email\' ở Magic Link → toast \'📩 Đã gửi lại email\'.

6\. State / Logic JavaScript cần cài đặt

-   loginMethod: \'password\' hoặc \'magic\' --- điều khiển hiện khối field nào, mặc định \'password\'.

-   passwordVisible: boolean --- điều khiển type của input mật khẩu và icon con mắt.

-   magicLinkSent: boolean --- điều khiển hiện Trạng thái A (form) hay Trạng thái B (xác nhận đã gửi) trong khối Magic Link.

-   hasActiveSession: boolean --- lấy từ việc kiểm tra session Supabase hiện tại (KHÔNG hard-code luôn hiện banner \'Bạn đã đăng nhập\' --- chỉ hiện khi thực sự có session).

-   Khi submit Đăng nhập (mode password): gọi supabase.auth.signInWithPassword({email, password}).

-   Khi submit Magic Link: gọi supabase.auth.signInWithOtp({email}) (Supabase gọi chung API này cho cả OTP email lẫn Magic Link không cần mật khẩu).

-   Khi bấm Google: gọi supabase.auth.signInWithOAuth({provider:\'google\'}).

7\. Ghi chú khác biệt so với giao diện đăng nhập hiện tại của app

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Hạng mục**            **Hiện tại**                             **Thiết kế mới**
  ----------------------- ---------------------------------------- ------------------------------------------------------------------------------------------------------
  Ảnh nền panel trái      Chỉ có các khối gradient mờ trừu tượng   Thêm ảnh cover \'P\' vũ trụ làm nền chính, phủ gradient tối để chữ vẫn rõ

  Phương thức đăng nhập   Chỉ có Mật khẩu (+ Google/Apple)         Thêm tab Magic Link; BỎ nút Apple --- chỉ giữ đúng 3 phương thức: Email/Password, Magic Link, Google

  Quên mật khẩu           Chưa thấy trên giao diện gốc             Bổ sung link \'Quên mật khẩu?\' cạnh field mật khẩu

  Đăng ký                 Chưa thấy                                Bổ sung dòng \'Chưa có tài khoản? Đăng ký ngay\' ở chân form
  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------

8\. Tóm tắt yêu cầu tổng thể cho AI lập trình

Giữ nguyên đúng bố cục 2 khối trái/phải đã có của trang đăng nhập hiện tại, chỉ: (1) thay nền panel trái bằng ảnh cover đính kèm theo đúng cách phủ overlay mô tả ở Phần 3; (2) bổ sung bộ chọn tab Mật khẩu / Magic Link ở panel phải theo đúng Phần 4.3--4.5; (3) bổ sung \'Quên mật khẩu?\' và \'Đăng ký ngay\' theo Phần 4.4 và 4.8; (4) giữ nguyên banner phiên đăng nhập cũ, nhưng BỎ HẲN nút Apple khỏi bản gốc --- chỉ giữ lại đúng 1 nút Google ở phần OAuth. Toàn bộ nội dung chữ giữ nguyên tiếng Việt như đã liệt kê.
