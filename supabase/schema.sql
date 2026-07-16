// Supabase Database Schema Migration
// Run this in Supabase SQL Editor

-- 1. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  role TEXT DEFAULT 'admin' CHECK (role IN ('public', 'viewer', 'contributor', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Contacts
CREATE TABLE IF NOT EXISTS contacts (
  "ContactID" TEXT PRIMARY KEY,
  "Name" TEXT NOT NULL,
  "Relationship" TEXT NOT NULL CHECK ("Relationship" IN ('Family', 'Relative', 'Friend', 'Colleague', 'Neighbor', 'Teacher', 'Partner', 'Other')),
  "Gender" TEXT CHECK ("Gender" IN ('Male', 'Female', 'Other')),
  "Birthday" TEXT,
  "Phone" TEXT,
  "Email" TEXT,
  "Organization1" TEXT,
  "Organization2" TEXT,
  "RelationshipScore" INTEGER DEFAULT 0 CHECK ("RelationshipScore" >= 0 AND "RelationshipScore" <= 100),
  "Status" TEXT DEFAULT 'Active' CHECK ("Status" IN ('Active', 'Lost Contact', 'Deceased', 'Blocked')),
  "IsFavorite" BOOLEAN DEFAULT FALSE,
  "Avatar" TEXT,
  "Notes" TEXT,
  "CreatedDate" TIMESTAMPTZ DEFAULT NOW(),
  "UpdatedDate" TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id)
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- 3. Events
CREATE TABLE IF NOT EXISTS events (
  "EventID" TEXT PRIMARY KEY,
  "No" INTEGER,
  "EventType" TEXT NOT NULL CHECK ("EventType" IN ('Meeting', 'Birthday', 'Travel', 'Work', 'Sport', 'Hospital', 'Meal', 'Call', 'Shopping', 'Study', 'Party', 'Date', 'Entertainment', 'Other')),
  "LifeStage" TEXT CHECK ("LifeStage" IN ('Infancy', 'Childhood', 'Secondary School', 'High School', 'University', 'Early Career', 'Mid Career', 'Mature Career', 'Retirement')),
  "Source" TEXT DEFAULT 'Manual' CHECK ("Source" IN ('Manual', 'Memory', 'Email')),
  "Title" TEXT NOT NULL,
  "StartDate" DATE NOT NULL,
  "EndDate" DATE,
  "Place" TEXT,
  "Maplink" TEXT,
  "Mood" TEXT CHECK ("Mood" IN ('Happy', 'Normal', 'Sad', 'Excited', 'Tired', 'Angry', 'Thoughtful', 'Loved')),
  "Importance" TEXT DEFAULT 'Medium' CHECK ("Importance" IN ('Lowest', 'Low', 'Medium', 'High', 'Highest')),
  "ParticipantCount" INTEGER DEFAULT 0,
  "Cost" NUMERIC DEFAULT 0,
  "Notes" TEXT,
  "CreatedDate" TIMESTAMPTZ DEFAULT NOW(),
  "UpdatedDate" TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id)
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 4. Participants (Event <-> Contact junction)
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "EventID" TEXT NOT NULL REFERENCES events("EventID") ON DELETE CASCADE,
  "ContactID" TEXT NOT NULL REFERENCES contacts("ContactID") ON DELETE CASCADE,
  "Role" TEXT,
  "CreatedDate" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("EventID", "ContactID")
);

ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- 5. Memories
CREATE TABLE IF NOT EXISTS memories (
  "MemoryID" TEXT PRIMARY KEY,
  "EventID" TEXT REFERENCES events("EventID") ON DELETE SET NULL,
  "Title" TEXT NOT NULL,
  "Content" TEXT,
  "MediaUrl" TEXT,
  "Mood" TEXT CHECK ("Mood" IN ('Happy', 'Normal', 'Sad', 'Excited', 'Tired', 'Angry', 'Thoughtful', 'Loved')),
  "CreatedDate" TIMESTAMPTZ DEFAULT NOW(),
  "UpdatedDate" TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id)
);

ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- 6. Organizations
CREATE TABLE IF NOT EXISTS organizations (
  "OrganizationID" TEXT PRIMARY KEY,
  "Name" TEXT NOT NULL,
  "Type" TEXT,
  "Phone" TEXT,
  "Email" TEXT,
  "Address" TEXT,
  "Website" TEXT,
  "Notes" TEXT,
  "CreatedDate" TIMESTAMPTZ DEFAULT NOW(),
  "UpdatedDate" TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id)
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- 7. Tags
CREATE TABLE IF NOT EXISTS tags (
  "TagID" TEXT PRIMARY KEY,
  "Name" TEXT NOT NULL UNIQUE,
  "Color" TEXT,
  "CreatedDate" TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- 8. Files (Knowledge Vault)
CREATE TABLE IF NOT EXISTS files (
  "FileID" TEXT PRIMARY KEY,
  "Name" TEXT NOT NULL,
  "Url" TEXT NOT NULL,
  "Type" TEXT NOT NULL,
  "Size" INTEGER,
  "EntityID" TEXT,
  "EntityType" TEXT,
  "CreatedDate" TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id)
);

ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Auto-generate ContactID
CREATE SEQUENCE IF NOT EXISTS contact_id_seq START 1;

-- Auto-generate EventID
CREATE SEQUENCE IF NOT EXISTS event_no_seq START 1;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts("Name");
CREATE INDEX IF NOT EXISTS idx_contacts_relationship ON contacts("Relationship");
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts("Status");
CREATE INDEX IF NOT EXISTS idx_events_startdate ON events("StartDate");
CREATE INDEX IF NOT EXISTS idx_events_type ON events("EventType");
CREATE INDEX IF NOT EXISTS idx_participants_event ON participants("EventID");
CREATE INDEX IF NOT EXISTS idx_participants_contact ON participants("ContactID");
CREATE INDEX IF NOT EXISTS idx_memories_event ON memories("EventID");

-- RLS Policies (Admin-only by default)
CREATE POLICY "Admin can do everything on contacts"
  ON contacts FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Admin can do everything on events"
  ON events FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Admin can do everything on participants"
  ON participants FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Admin can do everything on memories"
  ON memories FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Admin can do everything on organizations"
  ON organizations FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Admin can do everything on files"
  ON files FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Public read access for tagged content
CREATE POLICY "Public can view profiles"
  ON profiles FOR SELECT
  USING (true);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    'admin'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
