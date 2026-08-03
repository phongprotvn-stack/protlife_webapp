-- Migration: Admin can manage (update role / delete) any profile
-- Needed for Settings → Tab Phân quyền: admin thay đổi vai trò & xoá thành viên.
-- Hiện tại RLS chỉ cho phép mỗi người tự sửa/xoá chính mình (Users can update/delete own profile).
-- User đã chọn phương án A: xoá chỉ tác động profile (user mất quyền truy cập), KHÔNG xoá auth.users.

-- 1) Admin được cập nhật (đổi vai trò) profile của BẤT KỲ ai
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 2) Admin được xoá profile của người khác (KHÔNG xoá chính mình để tránh khoá ngoài)
DROP POLICY IF EXISTS "Admins can delete any profile" ON profiles;
CREATE POLICY "Admins can delete any profile"
  ON profiles FOR DELETE
  USING (
    id <> auth.uid()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3) Ai đó CHỈ ĐƯỢC tự hạ vai trò admin của chính mình khi còn >= 2 admin?
-- KHÔNG bắt buộc. Bảo vệ "chủ" (phongprot.vn@gmail.com) sẽ được xử lý ở tầng UI
-- (không hiện nút hạ/xoá cho tài khoản chủ), để tránh khoá ngoài ngoài ý muốn.

-- Kiểm chứng sau khi chạy:
--   SELECT email, role FROM public.profiles ORDER BY role, email;
-- vẫn phải còn ít nhất 1 admin (chủ).