-- Migration: add goals + documents tables to Supabase
-- Run this in Supabase SQL Editor after deploying

-- ===================================================================
-- 1. Goals
-- ===================================================================
CREATE TABLE IF NOT EXISTS goals (
  "GoalID" TEXT PRIMARY KEY,
  "Title" TEXT NOT NULL,
  "Status" TEXT DEFAULT 'Not Started',
  "Deadline" TEXT,
  "Priority" TEXT DEFAULT 'Medium',
  "Progress" INTEGER DEFAULT 0,
  "Notes" TEXT,
  "CreatedDate" TIMESTAMPTZ DEFAULT NOW(),
  "UpdatedDate" TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id)
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- 2. Documents
-- ===================================================================
CREATE TABLE IF NOT EXISTS documents (
  "DocumentID" TEXT PRIMARY KEY,
  "Title" TEXT NOT NULL,
  "Type" TEXT,
  "Date" TEXT,
  "Size" TEXT,
  "Notes" TEXT,
  "CreatedDate" TIMESTAMPTZ DEFAULT NOW(),
  "UpdatedDate" TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id)
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- 3. Add Contact column to organizations (missing from form)
-- ===================================================================
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS "Contact" TEXT;

-- ===================================================================
-- RLS Policies - Admin only (like other tables)
-- ===================================================================
CREATE POLICY "Admin can do everything on goals"
  ON goals FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Admin can do everything on documents"
  ON documents FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- ===================================================================
-- Sequences for auto ID generation
-- ===================================================================
CREATE SEQUENCE IF NOT EXISTS goal_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS document_id_seq START 1;

-- ===================================================================
-- Indexes
-- ===================================================================
CREATE INDEX IF NOT EXISTS idx_goals_title ON goals("Title");
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals("Status");
CREATE INDEX IF NOT EXISTS idx_documents_title ON documents("Title");
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents("Type");
