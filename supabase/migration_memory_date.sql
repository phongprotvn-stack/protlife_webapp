-- Thêm cột MemoryDate vào bảng memories
-- Ngày ký ức (ngày sự việc xảy ra), độc lập với CreatedDate (ngày tạo)
-- Nếu NULL, fallback về CreatedDate

ALTER TABLE memories ADD COLUMN IF NOT EXISTS "MemoryDate" DATE;

-- Cập nhật dữ liệu cũ: MemoryDate = CreatedDate nếu chưa có
UPDATE memories SET "MemoryDate" = "CreatedDate"::DATE WHERE "MemoryDate" IS NULL;
