-- Tạo Storage bucket memory-images (public read, user tự upload vào thư mục của mình)
-- Chạy trong Supabase SQL Editor

-- 1. Tạo bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'memory-images',
  'memory-images',
  true,
  20971520, -- 20MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy: public read (anyone can view)
CREATE POLICY "memory_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'memory-images');

-- 3. Policy: authenticated users can upload to their own folder
CREATE POLICY "memory_images_auth_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'memory-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. Policy: owner can delete their own files
CREATE POLICY "memory_images_owner_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'memory-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
