-- Supabase Database Schema Migration for Event Organization Module (v1.1.0)
-- Run this in Supabase SQL Editor

-------------------------------------------------------------------------------
-- MODULE 1: WEDDING PLANNER
-------------------------------------------------------------------------------

-- 1.1. Wedding Details (Extends the base 'events' table)
CREATE TABLE IF NOT EXISTS wedding_details (
  "EventID" TEXT PRIMARY KEY REFERENCES events("EventID") ON DELETE CASCADE,
  "BrideName" TEXT,
  "GroomName" TEXT,
  "BudgetLimit" NUMERIC DEFAULT 0,
  "CreatedDate" TIMESTAMPTZ DEFAULT NOW(),
  "UpdatedDate" TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id)
);

ALTER TABLE wedding_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can do everything on wedding_details"
  ON wedding_details FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- 1.2. Wedding Tasks (Checklist)
CREATE TABLE IF NOT EXISTS wedding_tasks (
  "TaskID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "EventID" TEXT NOT NULL REFERENCES events("EventID") ON DELETE CASCADE,
  "Title" TEXT NOT NULL,
  "Description" TEXT,
  "Status" TEXT DEFAULT 'Pending' CHECK ("Status" IN ('Pending', 'In Progress', 'Done')),
  "DueDate" TIMESTAMPTZ,
  "CreatedDate" TIMESTAMPTZ DEFAULT NOW(),
  "UpdatedDate" TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id)
);

ALTER TABLE wedding_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can do everything on wedding_tasks"
  ON wedding_tasks FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- 1.3. Wedding Expenses
CREATE TABLE IF NOT EXISTS wedding_expenses (
  "ExpenseID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "EventID" TEXT NOT NULL REFERENCES events("EventID") ON DELETE CASCADE,
  "Category" TEXT NOT NULL CHECK ("Category" IN ('Apparel', 'Photography', 'Food', 'Venue', 'Decoration', 'Transport', 'Other')),
  "EstimatedCost" NUMERIC DEFAULT 0,
  "ActualCost" NUMERIC DEFAULT 0,
  "Notes" TEXT,
  "CreatedDate" TIMESTAMPTZ DEFAULT NOW(),
  "UpdatedDate" TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id)
);

ALTER TABLE wedding_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can do everything on wedding_expenses"
  ON wedding_expenses FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- 1.4. Wedding Guests
CREATE TABLE IF NOT EXISTS wedding_guests (
  "GuestID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "EventID" TEXT NOT NULL REFERENCES events("EventID") ON DELETE CASCADE,
  "ContactID" TEXT REFERENCES contacts("ContactID") ON DELETE SET NULL, -- Null if manual guest
  "Name" TEXT NOT NULL, -- Used if ContactID is null, or as display name override
  "Group" TEXT CHECK ("Group" IN ('Groom Family', 'Bride Family', 'Groom Friends', 'Bride Friends', 'Colleagues', 'Other')),
  "InvitationStatus" TEXT DEFAULT 'Not Sent' CHECK ("InvitationStatus" IN ('Not Sent', 'Sent', 'Accepted', 'Declined')),
  "AttendanceStatus" TEXT DEFAULT 'Pending' CHECK ("AttendanceStatus" IN ('Pending', 'Attended', 'Not Attended')),
  "TableNumber" TEXT,
  "GiftAmount" NUMERIC DEFAULT 0,
  "Notes" TEXT,
  "CreatedDate" TIMESTAMPTZ DEFAULT NOW(),
  "UpdatedDate" TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id)
);

ALTER TABLE wedding_guests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can do everything on wedding_guests"
  ON wedding_guests FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-------------------------------------------------------------------------------
-- MODULE 2: GROUP EVENTS & TEAM BUILDING
-------------------------------------------------------------------------------

-- 2.1. Group Event Funds (Who paid into the common fund)
CREATE TABLE IF NOT EXISTS group_event_funds (
  "FundID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "EventID" TEXT NOT NULL REFERENCES events("EventID") ON DELETE CASCADE,
  "ContactID" TEXT NOT NULL REFERENCES contacts("ContactID") ON DELETE CASCADE,
  "HasPaid" BOOLEAN DEFAULT FALSE,
  "AmountPaid" NUMERIC DEFAULT 0,
  "CreatedDate" TIMESTAMPTZ DEFAULT NOW(),
  "UpdatedDate" TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id),
  UNIQUE("EventID", "ContactID")
);

ALTER TABLE group_event_funds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can do everything on group_event_funds"
  ON group_event_funds FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- 2.2. Group Event Expenses
CREATE TABLE IF NOT EXISTS group_event_expenses (
  "ExpenseID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "EventID" TEXT NOT NULL REFERENCES events("EventID") ON DELETE CASCADE,
  "PaidByContactID" TEXT NOT NULL REFERENCES contacts("ContactID") ON DELETE CASCADE, -- Who paid the bill
  "Amount" NUMERIC NOT NULL,
  "Description" TEXT,
  "CreatedDate" TIMESTAMPTZ DEFAULT NOW(),
  "UpdatedDate" TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id)
);

ALTER TABLE group_event_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can do everything on group_event_expenses"
  ON group_event_expenses FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wedding_details_event ON wedding_details("EventID");
CREATE INDEX IF NOT EXISTS idx_wedding_tasks_event ON wedding_tasks("EventID");
CREATE INDEX IF NOT EXISTS idx_wedding_expenses_event ON wedding_expenses("EventID");
CREATE INDEX IF NOT EXISTS idx_wedding_guests_event ON wedding_guests("EventID");
CREATE INDEX IF NOT EXISTS idx_wedding_guests_contact ON wedding_guests("ContactID");
CREATE INDEX IF NOT EXISTS idx_group_event_funds_event ON group_event_funds("EventID");
CREATE INDEX IF NOT EXISTS idx_group_event_expenses_event ON group_event_expenses("EventID");
