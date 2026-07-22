-- Tạo Storage bucket memory-attachments (public read, auth write)
-- Dùng để lưu file đính kèm tài liệu của ký ức

-- 1. Tạo bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'memory-attachments',
  'memory-attachments',
  true,
  10485760, -- 10MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/rtf', 'application/rtf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy: only authenticated users can read
CREATE POLICY "attachments_auth_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'memory-attachments' AND auth.role() = 'authenticated');

-- 3. Policy: authenticated users can upload to their own folder
CREATE POLICY "attachments_auth_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'memory-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. Policy: owner can delete their own files
CREATE POLICY "attachments_owner_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'memory-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 5. Users can insert their own file records (for memory attachments)
CREATE POLICY "Users can insert own files"
  ON files FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 6. Users can select their own file records
CREATE POLICY "Users can select own files"
  ON files FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 7. Users can delete their own file records
CREATE POLICY "Users can delete own files"
  ON files FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
