-- ═══════════════════════════════════════════════════════════════════════
-- cleanup_onboarding_v2.sql
-- Dọn row user_preferences bị NHIỄM onboarded/displayName/dob.
--
-- ROOT CAUSE (màn hình Onboarding không hiện cho user Google mới):
--  Trong bản cũ, AuthGuard CÓ câu
--     if (hasIdentity) useSettingsStore.setState({ onboarded: true })
--  Khi login bằng trình duyệt thường có localStorage cũ của tài khoản khác
--  (chứa displayName/dob của admin), nó hydrate ra identity áo → auto-set
--  onboarded:true → subscribe → upsert LÊN SERVER → row user_preferences
--  của user mới bị nhiễm: onboarded:true + displayName admin.
--
--  Sau đó dù login bằng cửa sổ ẩn danh/trình duyệt khác, loadSettingsFromServer
--  đọc đúng row nhiễm này (onboarded:true) → AuthGuard bỏ qua redirect → user
--  mới thật không bao giờ thấy /onboarding.
--
-- FIX (2 tầng, chạy cùng):
--   1) [CODE - đã deploy] AuthGuard KHÔNG còn auto-set onboarded khi có identity.
--      onboarded:true chỉ được ghi bởi chính onboarding page (Skip/Complete).
--   2) [SQL này] Reset trạng thái onboarding CHO MỌI user không phải admin
--      (vì chưa ai thật sự bấm Skip hoàn thành onboarding — tính năng mới).
--      User có displayName/dob thật → AuthGuard thấy hasIdentity → không block.
--      User mới/user bị nhiễm → onboarded:false + name/dob rỗng → vào /onboarding.
--
-- Chạy trong Supabase → SQL Editor (chỉ dán + Run, không auto-run ngoài file này).
-- ═══════════════════════════════════════════════════════════════════════

UPDATE public.user_preferences up
SET settings = jsonb_set(
                 jsonb_set(
                   jsonb_set(settings, '{onboarded}', 'false'),
                   '{displayName}', '""'),
                 '{dob}', '""')
FROM public.profiles p
WHERE p.id = up.user_id
  AND p.role <> 'admin'
  AND ( (settings ->> 'onboarded')::boolean = true
        OR COALESCE(settings ->> 'displayName','') <> ''
        OR COALESCE(settings ->> 'dob','') <> '' );

-- Kiểm chứng: xem còn user thường nào onboarded/name/dob chưa reset
-- SELECT u.id, u.email, up.settings->>'onboarded' AS onboarded,
--        up.settings->>'displayName' AS displayName, up.settings->>'dob' AS dob
-- FROM public.user_preferences up JOIN public.profiles p ON p.id=up.user_id
-- LEFT JOIN auth.users u ON u.id = p.id
-- ORDER BY p.role, u.email;