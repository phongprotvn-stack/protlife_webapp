-- Thêm cột MemoryDate vào bảng memories
-- Dùng để lưu ngày sự kiện cho ký ức độc lập (không liên kết sự kiện)
-- Nếu ký ức có EventID, ưu tiên dùng EventDate (StartDate của sự kiện)
-- Nếu NULL và không có EventID, fallback về CreatedDate

ALTER TABLE memories ADD COLUMN IF NOT EXISTS "MemoryDate" DATE;

-- Cập nhật dữ liệu cũ: MemoryDate = CreatedDate nếu chưa có
UPDATE memories SET "MemoryDate" = "CreatedDate"::DATE WHERE "MemoryDate" IS NULL;
