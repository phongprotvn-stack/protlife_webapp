# Đặc tả: Trang Bản đồ (Map)

> Hiện trạng xác nhận qua review code thật: `src/app/map/page.tsx` chỉ 32 dòng, là
> card tĩnh "sắp ra mắt", CHƯA có bản đồ thật, chưa cài thư viện map nào (`leaflet`,
> `mapbox`... không có trong `package.json`), và **chưa có toạ độ (lat/lng) ở bất kỳ
> bảng nào** — bảng `events` chỉ có cột `Place` (text tự do), không có toạ độ.

## 0. Xem trước thiết kế

Đã có demo trực quan riêng: `map_page_demo.html` (Leaflet + OpenStreetMap, không cần
API key, hoàn toàn miễn phí) — dùng làm tài liệu tham chiếu hình ảnh khi code, KHÔNG
phải code để copy thẳng vào Next.js (demo là HTML thuần, cần viết lại theo component
React đúng chuẩn project).

## 1. Thay đổi schema — thêm toạ độ, KHÔNG tạo bảng `places` mới

Vì địa điểm hiện đã "sống" bên trong `events` (cột `Place`) và `organizations` (cột
`Address`), cách đơn giản nhất — không phá vỡ cấu trúc hiện có — là thêm 2 cột toạ độ
nullable vào 2 bảng này, thay vì tạo hẳn 1 bảng `places` riêng (over-engineering cho
quy mô app cá nhân hiện tại):

```sql
ALTER TABLE events ADD COLUMN IF NOT EXISTS "Lat" NUMERIC;
ALTER TABLE events ADD COLUMN IF NOT EXISTS "Lng" NUMERIC;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS "Lat" NUMERIC;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS "Lng" NUMERIC;
```

## 2. Lấy toạ độ từ địa chỉ text — dùng Nominatim (miễn phí, không cần API key)

OpenStreetMap có sẵn dịch vụ geocoding miễn phí tên **Nominatim**. Giới hạn: **tối đa
1 request/giây**, bắt buộc gửi kèm header `User-Agent` nhận diện app (điều khoản sử
dụng của họ), không được gọi tự động liên tục — chỉ gọi khi người dùng chủ động bấm.

**Thiết kế UI:** ở form thêm/sửa Sự kiện và Tổ chức, cạnh field "Địa điểm/Địa chỉ" đã
có sẵn, thêm 1 nút nhỏ **"📍 Lấy toạ độ"** — bấm mới gọi API, không tự động theo mỗi
lần gõ phím (tránh vượt giới hạn 1 req/giây và tránh gọi API thừa khi người dùng gõ
dở).

```tsx
async function geocodeAddress(address: string) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
    { headers: { 'User-Agent': 'ProtLife/1.0 (personal life app)' } }
  );
  const data = await res.json();
  if (data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}
```

Sau khi lấy được toạ độ, hiện preview nhỏ (1 khung Leaflet mini, hoặc chỉ hiện dòng
"✅ Đã xác định vị trí") để người dùng xác nhận trước khi lưu — tránh lưu nhầm toạ độ
nếu địa chỉ nhập mơ hồ.

## 3. Trang Bản đồ — component chính

- Cài `leaflet` + `react-leaflet` (hoặc dùng Leaflet thuần trong `useEffect` nếu
  project không muốn thêm dependency `react-leaflet` — cả 2 cách đều được, để Hermes
  chọn theo pattern đang dùng trong project).
- Query toàn bộ `events` và `organizations` của user hiện tại có `Lat`/`Lng` khác
  NULL — bỏ qua các bản ghi chưa có toạ độ (không ép người dùng phải geocode hết mọi
  thứ cũ).
- Vẽ marker theo đúng 2 loại: sự kiện (đỏ) / tổ chức (xanh dương) — icon tối giản như
  demo, dùng emoji hoặc SVG nhỏ, không cần ảnh icon riêng.
- Bấm marker → mở bottom sheet (mobile) hoặc panel bên phải (desktop, ≥860px) hiện
  chi tiết + nút "Chỉ đường" mở Google Maps thật
  (`https://www.google.com/maps/dir/?api=1&destination=LAT,LNG`) — không cần tự vẽ
  chỉ đường trong app, tận dụng Google Maps có sẵn trên máy người dùng, miễn phí.
- Panel danh sách bên trái (desktop) / ẩn trong bottom sheet (mobile) — liệt kê toàn
  bộ địa điểm, lọc theo tab (Tất cả / Sự kiện / Tổ chức).
- Ô tìm kiếm trên cùng: lọc theo tên/địa chỉ chứa từ khoá (client-side filter, không
  cần gọi API tìm kiếm riêng vì số lượng địa điểm cá nhân thường nhỏ).

## 4. Prompt gửi Hermes — làm theo thứ tự

### Bước A — Schema
```
Chạy đúng 2 câu ALTER TABLE ở mục 1 của docs/map-feature-spec.md, tạo file migration
riêng, CHƯA tự chạy.
```

### Bước B — Nút lấy toạ độ ở form Sự kiện/Tổ chức
```
Thêm nút "📍 Lấy toạ độ" cạnh field Địa điểm ở form thêm/sửa Sự kiện (events/add) và
Tổ chức (organizations/add), gọi Nominatim theo đúng mục 2 của
docs/map-feature-spec.md, lưu vào cột Lat/Lng vừa tạo. Chỉ gọi khi bấm nút, không tự
động theo mỗi lần gõ.
```

### Bước C — Trang Bản đồ
```
Xem file map_page_demo.html (đính kèm) để tham khảo bố cục/màu sắc — đây chỉ là HTML
demo tham khảo hình ảnh, không phải code để copy thẳng. Xây lại src/app/map/page.tsx
thành component React thật theo đúng mục 3 của docs/map-feature-spec.md, dùng
Leaflet, query dữ liệu thật từ bảng events/organizations có Lat/Lng khác NULL, giữ
đúng design system hiện có (glass-card, --prot-red, backdrop-blur như các trang khác
trong project).
```

