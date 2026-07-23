-- Thêm cột toạ độ (Lat/Lng) vào bảng events và organizations
-- Dùng để hiển thị marker trên Bản đồ (Map)
-- Nullable — chỉ có giá trị khi người dùng chủ động geocode

ALTER TABLE events ADD COLUMN IF NOT EXISTS "Lat" NUMERIC;
ALTER TABLE events ADD COLUMN IF NOT EXISTS "Lng" NUMERIC;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS "Lat" NUMERIC;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS "Lng" NUMERIC;
