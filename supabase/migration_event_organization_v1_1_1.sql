-- Prot Life v1.1.1 — Wedding Quick Cashier
-- Chạy trong Supabase SQL Editor sau migration_event_organization_v2.sql.
-- Lưu phương thức nhận tiền mừng để dashboard tiếp tân tách Tiền mặt/Chuyển khoản.

ALTER TABLE wedding_guests
  ADD COLUMN IF NOT EXISTS "GiftMethod" TEXT;

ALTER TABLE wedding_guests
  DROP CONSTRAINT IF EXISTS wedding_guests_GiftMethod_check;

ALTER TABLE wedding_guests
  ADD CONSTRAINT wedding_guests_GiftMethod_check
  CHECK ("GiftMethod" IS NULL OR "GiftMethod" IN ('Cash', 'Transfer'));

CREATE INDEX IF NOT EXISTS idx_wedding_guests_gift_method
  ON wedding_guests ("EventID", "GiftMethod");
