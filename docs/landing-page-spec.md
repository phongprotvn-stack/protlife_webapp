# Đặc tả: Trang Landing/Đăng nhập — bản thiết kế mới (thay bản cũ)

> So với bản Đăng nhập đã code trước đó (`docs/login-ui-spec.md`, nếu còn lưu), đây là
> **bản thiết kế mới, khác biệt rõ rệt** — không phải chỉnh sửa nhỏ. Đặc tả này THAY
> THẾ hoàn toàn đặc tả cũ, không phải bổ sung thêm.

## 0. Xem trước

Demo trực quan: `landing_page_demo.html` (đính kèm) — mở trực tiếp bằng trình duyệt để
xem đầy đủ tương tác trước khi code.

## 1. Khác biệt chính so với bản cũ

| Hạng mục | Bản cũ | Bản mới |
|---|---|---|
| Nền panel trái | Gradient đỏ sáng | **Đen sâu gần tuyệt đối** (`#050203`), ảnh cover hoà vào nền qua `mix-blend-mode: screen`, không dùng overlay đỏ nữa |
| Bố cục tính năng | Lưới 2×2, dạng thẻ kính mờ (glass card) | **1 hàng ngang 5 mục**, không có nền thẻ, chỉ icon vuông nhỏ + chữ, tối giản hơn |
| Số lượng tính năng | 4 (Quan hệ, Sự kiện, AI Insight, Bảo mật) | **5** — thêm "Ký ức" |
| Nút CTA | Không có | **Mới**: "🚀 Bắt đầu miễn phí" — nút gradient đỏ, dẫn sang trang Đăng ký |
| Tiêu đề hero | "Quản lý cuộc sống theo cách của bạn" | **"Quản lý toàn bộ cuộc sống của bạn"** — cụm "toàn bộ cuộc sống" tô đỏ đậm, có gạch chân ngắn (accent bar) bên dưới |
| Nút Google | Icon tròn đơn sắc tự vẽ | **Icon Google 4 màu chính thức** (SVG, xem mục 3) |
| Chân form | Chỉ có "Đổi mật khẩu?" | Thêm dòng **"Chưa có tài khoản? Đăng ký ngay"** |

## 2. Panel trái — chi tiết

- Nền: `#050203` (gần đen tuyệt đối) — KHÔNG dùng gradient đỏ như bản cũ.
- Ảnh cover (`protlife-cover.jpg`, đã có sẵn trong `public/images/` — xem
  `docs/login-ui-spec.md` cũ nếu cần đối chiếu đường dẫn): áp `mix-blend-mode: screen`
  thay vì chỉ giảm `opacity` — cách này khiến vùng đen của ảnh biến mất hoàn toàn vào
  nền, chỉ còn lại các vệt sáng đỏ/cam của logo "P" nổi lên, hoà tự nhiên với nền đen,
  không còn viền ảnh chữ nhật lộ liễu như cách làm cũ.
- Phủ thêm 1 lớp `radial-gradient` tối dần từ tâm ảnh ra biên + `linear-gradient` tối
  dần từ trên xuống dưới, đảm bảo chữ luôn đọc rõ dù ảnh sáng chỗ nào.
- Tiêu đề hero: `font-size: 40px`, chữ `<span>` bọc quanh "toàn bộ cuộc sống" tô màu
  `#FF3B4E`. Thanh gạch chân nhỏ (64px × 4px, bo tròn, gradient đỏ) đặt ngay dưới tiêu
  đề, TRƯỚC đoạn mô tả.
- Nút CTA "🚀 Bắt đầu miễn phí": đặt ngay sau đoạn mô tả, TRƯỚC hàng 5 tính năng — dẫn
  sang route `/register` (trang Đăng ký — xem mục 4, có thể chưa tồn tại, cần tạo).
- Hàng 5 tính năng: `display:flex`, `gap: 30px`, mỗi mục tối đa `120px` chiều rộng,
  icon vuông nhỏ (38×38px, bo góc 11px, nền đỏ rất nhạt `rgba(230,0,45,.14)`, viền đỏ
  nhạt) — không dùng nền kính mờ như bản cũ.

## 3. Panel phải — icon Google thật (khác bản cũ dùng vòng tròn "G" tự vẽ)

Dùng đúng SVG 4 màu chính thức của Google (đã nhúng sẵn trong `landing_page_demo.html`,
copy nguyên `<svg>` đó sang component thật) — đây là icon phổ biến, dùng lại được, KHÔNG
phải logo có bản quyền hạn chế khi dùng đúng mục đích "Đăng nhập với Google".

Toàn bộ phần còn lại (tab Mật khẩu/Magic Link, field email/mật khẩu, con mắt ẩn/hiện,
"Quên mật khẩu?", luồng Magic Link 2 trạng thái) **giữ nguyên y hệt** đặc tả/code cũ đã
làm — không đổi logic, chỉ đổi phần giao diện panel trái + icon Google + thêm dòng
"Đăng ký ngay".

## 4. Cần xác nhận — route `/register` đã tồn tại chưa

Nút "Bắt đầu miễn phí" và link "Đăng ký ngay" đều trỏ tới trang Đăng ký — **kiểm tra
trước khi code xem `src/app/register/page.tsx` đã tồn tại và hoạt động thật chưa**
(có thể đã có sẵn từ trước, hoặc chưa từng làm). Nếu chưa có, đây là việc phát sinh
thêm ngoài phạm vi đặc tả này — báo lại trước khi tự ý tạo mới.

## 5. Prompt gửi Hermes

```
Đọc file docs/landing_page_demo.html (demo trực quan) và docs/landing-page-spec.md.

Đây là bản thiết kế MỚI cho trang Đăng nhập (src/app/login/page.tsx và/hoặc trang chủ
src/app/page.tsx nếu đang gộp chung — xác nhận lại cấu trúc route hiện tại trước khi
sửa), THAY THẾ hoàn toàn phần giao diện panel trái đã code trước đó theo
docs/login-ui-spec.md cũ.

Trước khi sửa:
1. Xác nhận route /register đã tồn tại thật chưa (src/app/register/page.tsx) — nếu
   chưa, dừng lại báo tôi, đừng tự ý tạo trang mới ngoài phạm vi đặc tả này.
2. Đọc lại đúng code hiện tại của trang đăng nhập thật để biết state/logic
   (loginMethod, passwordVisible, magicLinkSent...) đã viết ra sao, GIỮ NGUYÊN toàn
   bộ, chỉ thay phần JSX/CSS theo mục 2-3 trong docs/landing-page-spec.md.

Sau khi sửa xong, dán cho tôi xem đoạn code phần panel trái đã đổi để tôi đối chiếu
với demo trước khi bạn tiếp tục.
```


---

## 6. CẬP NHẬT v2 — 7 thay đổi bổ sung (xem `landing_page_demo_v2.html`)

1. Tỉ lệ panel: trái **60%**, phải **40%** (không phải `flex:1`/46% như v1).
2. 5 tính năng: `justify-content: space-between`, dàn đều hết chiều ngang panel trái.
3. **Đổi icon emoji → SVG line-icon** (stroke, không tô đặc) khớp đúng ảnh mẫu: trái tim (Quan hệ), lịch (Sự kiện), khung ảnh có núi+mặt trời (Ký ức), não 2 thuỳ (AI Insight), khiên có khoá (Bảo mật) — code SVG có sẵn trong demo v2, copy nguyên `<svg>` sang component thật.
4. "Made with ♥ by Prot" → `text-align:center`.
5. Tiêu đề tách 2 dòng: `Quản lý <span class="accent">toàn bộ</span><br><span class="accent">cuộc sống</span> của bạn`.
6. Mô tả tách 3 dòng bằng `<br>` đúng theo đúng 3 cụm đã cho.
7. Ảnh hero: đổi `background-size` từ `cover` sang `130%`, dịch `background-position` sang phải (`82% 48%`), thêm `linear-gradient` ngang tối dần từ trái sang phải — dồn vùng sáng "P" về bên phải panel, vùng chữ bên trái tối hơn, không còn đè lên nhau. (Giả định "hình 2" cậu nhắc là ảnh landing page đã gửi ở lượt trước — nếu ý khác, gửi lại ảnh cụ thể.)

### Prompt bổ sung gửi Hermes (nối tiếp, không thay prompt gốc ở Mục 5)
```
Đọc landing_page_demo_v2.html — bản cập nhật. Áp dụng đúng 7 thay đổi ở Mục 6 file
docs/landing-page-spec.md vào code đã sửa từ Mục 5. Giữ nguyên toàn bộ logic
JS/state cũ, chỉ đổi JSX/CSS panel trái + tỉ lệ layout.
```
