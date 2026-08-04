-- Supabase Database Schema Migration for Event Organization Module (v2.0.0)
-- Quản lý Khách mời (4 bước) + Hạng mục Công việc (việc cha/con + dự toán + bàn tiệc)
-- Run this in Supabase SQL Editor
-- NOTE: file idempotent — an toàn chạy lại nhiều lần (DROP POLICY IF EXISTS trước mỗi CREATE).

-------------------------------------------------------------------------------
-- MODULE 1.5: WEDDING PLANNER v2 — nâng cấp
-------------------------------------------------------------------------------

-- 1.5.1. Wedding Guests — thêm cột tự nhập nhanh (tổ chức + SĐT) + trạng thái liên lạc
ALTER TABLE wedding_guests ADD COLUMN IF NOT EXISTS "Organization" TEXT;
ALTER TABLE wedding_guests ADD COLUMN IF NOT EXISTS "PhoneNumber" TEXT;

-- Mở CHECK InvitationStatus thêm giá trị 'Unreachable' (không liên lạc được)
ALTER TABLE wedding_guests DROP CONSTRAINT IF EXISTS wedding_guests_InvitationStatus_check;
ALTER TABLE wedding_guests ADD CONSTRAINT wedding_guests_InvitationStatus_check
  CHECK ("InvitationStatus" IN ('Not Sent', 'Sent', 'Accepted', 'Declined', 'Unreachable'));

-- 1.5.2. Wedding Tasks — việc cha/con + số tiền dự toán + hạng mục
ALTER TABLE wedding_tasks ADD COLUMN IF NOT EXISTS "ParentTaskID" UUID;
ALTER TABLE wedding_tasks ADD COLUMN IF NOT EXISTS "EstimatedCost" NUMERIC DEFAULT 0;
ALTER TABLE wedding_tasks ADD COLUMN IF NOT EXISTS "Category" TEXT;
ALTER TABLE wedding_tasks ADD COLUMN IF NOT EXISTS "Order" INT DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_wedding_tasks_parent ON wedding_tasks("ParentTaskID");

-- 1.5.3. Bảng Bàn tiệc (có tên + sức chứa 6/10)
CREATE TABLE IF NOT EXISTS wedding_tables (
  "TableID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "EventID" TEXT NOT NULL REFERENCES events("EventID") ON DELETE CASCADE,
  "TableName" TEXT NOT NULL,
  "Capacity" INT NOT NULL DEFAULT 6 CHECK ("Capacity" IN (6, 10)),
  "CreatedDate" TIMESTAMPTZ DEFAULT NOW(),
  "UpdatedDate" TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id)
);

ALTER TABLE wedding_tables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin can do everything on wedding_tables" ON wedding_tables;
CREATE POLICY "Admin can do everything on wedding_tables"
  ON wedding_tables FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_wedding_tables_event ON wedding_tables("EventID");

-------------------------------------------------------------------------------
-- Bảo đảm các policy cũ của v1 vẫn tồn tại (idempotent — chạy lại an toàn)
-------------------------------------------------------------------------------
ALTER TABLE wedding_guests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin can do everything on wedding_guests" ON wedding_guests;
CREATE POLICY "Admin can do everything on wedding_guests"
  ON wedding_guests FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

ALTER TABLE wedding_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin can do everything on wedding_tasks" ON wedding_tasks;
CREATE POLICY "Admin can do everything on wedding_tasks"
  ON wedding_tasks FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));