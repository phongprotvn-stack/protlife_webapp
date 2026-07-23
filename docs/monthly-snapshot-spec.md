# Đặc tả: Snapshot hàng tháng + lớp Google Drive

> Hiện trạng: `backup-daily.yml` đã chạy tốt (đã debug qua nhiều lỗi thật: IPv6 pooler,
> version mismatch pg_dump 17 vs 16...) — nhưng đó CHỈ là lớp "ghi đè hằng ngày" trong
> kiến trúc 3-2-1 gốc. Còn thiếu lớp **"đóng băng vĩnh viễn theo tháng"** + lớp
> **Google Drive (bản người dùng tự xem tay)** đã thiết kế từ đầu nhưng chưa code.

## 1. Vì sao cần Google Drive riêng, không chỉ R2

R2 là "bản kỹ thuật" — chỉ cậu (qua code) truy cập được, không mở lên xem trực tiếp
dễ dàng. Google Drive là "bản con người" — cậu tự mở app Google Drive trên điện thoại,
thấy ngay file, tải về bất cứ lúc nào, không cần biết gì về S3/API.

## 2. Cách xác thực Google Drive KHÔNG CẦN người dùng đăng nhập mỗi lần (Service Account)

Khác với luồng OAuth ở Phần 15 (cần người dùng bấm "Cho phép" 1 lần), backup tự động
chạy lúc 3 giờ sáng không có ai ngồi bấm — cần dùng **Service Account** (tài khoản máy
tính riêng của Google Cloud, xác thực bằng file JSON key, không cần màn hình đăng
nhập).

**Lưu ý quan trọng:** Service Account **không có dung lượng lưu trữ riêng** (0 byte)
đối với tài khoản Gmail cá nhân miễn phí — nó chỉ ghi được vào thư mục mà TÀI KHOẢN
CẬU tự chia sẻ quyền chỉnh sửa cho nó, dùng đúng dung lượng 15GB free có sẵn của Gmail
cậu.

### 2.1 🙋 CẬU TỰ LÀM — thiết lập Service Account (làm 1 lần)

1. Vào [Google Cloud Console](https://console.cloud.google.com) → đúng project đã
   dùng ở Phần 15 → **IAM & Admin** → **Service Accounts** → **Create Service Account**.
2. Đặt tên gợi nhớ (VD `protlife-backup-bot`) → **Create and Continue** → bỏ qua bước
   gán role (không cần) → **Done**.
3. Bấm vào Service Account vừa tạo → tab **Keys** → **Add Key** → **Create new key** →
   chọn **JSON** → tự động tải về 1 file `.json` — **đây là bí mật quan trọng, không
   dán vào chat với bất kỳ ai, kể cả Hermes**.
4. Mở Google Drive cá nhân (drive.google.com) → tạo 1 thư mục mới tên `ProtLife Backups`.
5. Chuột phải thư mục đó → **Share** → dán đúng email của Service Account (dạng
   `protlife-backup-bot@TEN-PROJECT.iam.gserviceaccount.com`, xem trong Cloud Console)
   → chọn quyền **Editor** → Send.
6. Mở file JSON vừa tải, copy TOÀN BỘ nội dung, dán làm giá trị 1 GitHub Secret mới
   tên `GOOGLE_SERVICE_ACCOUNT_JSON`.
7. Lấy **Folder ID** của thư mục `ProtLife Backups` (mở thư mục trên trình duyệt, copy
   đoạn ký tự sau `/folders/` trên URL) → thêm GitHub Secret thứ 2 tên
   `GDRIVE_FOLDER_ID`.

### 2.2 Công cụ upload — dùng `rclone` (miễn phí, hỗ trợ sẵn Service Account cho Drive)

`rclone` là công cụ dòng lệnh miễn phí, hỗ trợ cả S3 (đã dùng cho B2) lẫn Google Drive
qua Service Account có sẵn, không cần viết code gọi API thủ công.

## 3. Workflow mới — `backup-monthly.yml`

```yaml
name: Monthly Snapshot
on:
  schedule:
    - cron: '0 3 1 * *'   # 03:00 UTC, ngày 1 mỗi tháng
  workflow_dispatch:
jobs:
  snapshot:
    runs-on: ubuntu-latest
    steps:
      - name: Install PostgreSQL 17 client tools
        run: |
          # (giống hệt bước đã chạy thành công trong backup-daily.yml)
      - name: Dump PostgreSQL database
        env:
          PGHOST: ${{ secrets.PGHOST }}
          PGPORT: "5432"
          PGUSER: ${{ secrets.PGUSER }}
          PGPASSWORD: ${{ secrets.PGPASSWORD }}
          PGDATABASE: postgres
        run: |
          set -euo pipefail
          /usr/lib/postgresql/17/bin/pg_dump --no-owner --no-acl | gzip > protlife-$(date -u +%Y-%m).dump.gz
          ls -la protlife-*.dump.gz
      - name: Install rclone
        run: curl https://rclone.org/install.sh | sudo bash
      - name: Upload to R2 (monthly, permanent)
        env: ...(giống bước upload B2 trong backup-daily.yml, đổi path thành db-dumps/monthly/)...
      - name: Upload to Google Drive
        run: |
          echo '${{ secrets.GOOGLE_SERVICE_ACCOUNT_JSON }}' > /tmp/sa.json
          rclone config create gdrive drive service_account_file /tmp/sa.json --non-interactive
          rclone copy protlife-*.dump.gz gdrive:${{ secrets.GDRIVE_FOLDER_ID }}
          rm /tmp/sa.json
```

**Lưu ý bảo mật:** file `/tmp/sa.json` chỉ tồn tại tạm trong máy ảo GitHub Actions,
tự huỷ khi job kết thúc (máy ảo bị xoá hoàn toàn sau mỗi lần chạy) — dòng `rm` cuối
chỉ để dọn sớm, không bắt buộc nhưng là thói quen tốt.

## 4. Retention — giữ vĩnh viễn mốc Tháng 1 mỗi năm

Việc này làm trực tiếp trên **R2 Dashboard** (không phải code), dùng tính năng
**Lifecycle Rules** có sẵn:
- 🙋 Vào bucket `protlife-backup` → **Lifecycle Rules** → tạo rule: xoá file trong
  `db-dumps/monthly/` sau 365 ngày — TRỪ file có tên khớp mẫu `*-01.dump.gz` (tháng 1)
  → loại trừ khỏi rule xoá (R2 hỗ trợ điều kiện theo tiền tố/hậu tố tên file).
- Google Drive: không cần thiết lập gì thêm, cứ để tự nhiên tích luỹ (15GB free đủ
  dùng nhiều năm với chỉ 12 file/năm, mỗi file vài chục MB).

## 5. Prompt gửi Hermes

```
Đã tạo Service Account trên Google Cloud, chia sẻ 1 thư mục Google Drive cho nó, và
thêm 2 GitHub Secret: GOOGLE_SERVICE_ACCOUNT_JSON, GDRIVE_FOLDER_ID.

Tạo workflow mới .github/workflows/backup-monthly.yml theo đúng mẫu ở mục 3 trong
docs/monthly-snapshot-spec.md — TÁI SỬ DỤNG chính xác cách cài PostgreSQL 17 và cách
dump database đã chạy thành công trong backup-daily.yml (copy y hệt, đừng viết lại từ
đầu). Thêm bước cài rclone và upload file dump lên CẢ R2 (path db-dumps/monthly/,
khác với path daily/) VÀ Google Drive qua rclone + service account như mô tả.

Sau khi tạo xong, hướng dẫn tôi cách chạy thử tay (workflow_dispatch) và cách kiểm tra
kết quả ở cả 2 nơi (R2 bucket + thư mục Google Drive).
```

