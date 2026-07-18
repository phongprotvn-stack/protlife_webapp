-- Phase 1: Memory Journal Migration
-- Updates the existing memories table for Memory Journal + Memory Wheel

-- 1. Add Image column for 1 ảnh/memory
ALTER TABLE IF EXISTS memories ADD COLUMN IF NOT EXISTS "Image" TEXT;

-- 2. Add MoodEmoji column for emoji display (😊😢🤩😌😤😴)
ALTER TABLE IF EXISTS memories ADD COLUMN IF NOT EXISTS "MoodEmoji" TEXT;

-- 3. Add UNIQUE constraint on EventID (1 event → 1 memory max)
-- Remove duplicates first (keep first if any)
DELETE FROM memories m1 USING memories m2 
WHERE m1."MemoryID" < m2."MemoryID" 
  AND m1."EventID" = m2."EventID" 
  AND m1."EventID" IS NOT NULL;

-- Now add the constraint
ALTER TABLE memories ADD CONSTRAINT memories_eventid_unique UNIQUE ("EventID");

-- 4. Create sequence for MemoryID auto-generation
CREATE SEQUENCE IF NOT EXISTS memory_id_seq START 1;

-- 5. Update RLS policy (already exists, ensure it's correct)
-- The existing policy covers everything, but let's make sure

-- 6. Index for memory wheel queries
CREATE INDEX IF NOT EXISTS idx_memories_mood ON memories("Mood");
CREATE INDEX IF NOT EXISTS idx_memories_created ON memories("CreatedDate");
CREATE INDEX IF NOT EXISTS idx_memories_moodemoji ON memories("MoodEmoji");

-- 7. Add user_id default for existing rows (if any exist without it)
UPDATE memories SET user_id = auth.uid() WHERE user_id IS NULL;
