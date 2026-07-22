-- Thay thế pg_net bằng supabase_functions (extension chính thức của Supabase)
-- supabase_functions.http_request gọi Edge Function từ trigger DB

-- 1. Xoá trigger + function cũ (dùng pg_net)
DROP TRIGGER IF EXISTS sync_to_sheet_contacts_trg ON contacts;
DROP TRIGGER IF EXISTS sync_to_sheet_events_trg ON events;
DROP TRIGGER IF EXISTS sync_to_sheet_memories_trg ON memories;
DROP FUNCTION IF EXISTS sync_to_sheet_trigger_fn();

-- 2. Tạo function mới dùng supabase_functions.http_request
CREATE OR REPLACE FUNCTION sync_to_sheet_trigger_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payload text;
  v_url text := 'https://hwgrdhnsuvohgtcuemag.supabase.co/functions/v1/sync-to-sheet';
BEGIN
  -- Build payload matching the old Database Webhook format
  v_payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', CASE
                WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW)
                ELSE NULL
              END,
    'old_record', CASE
                    WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD)
                    ELSE NULL
                  END
  )::text;

  -- Gọi HTTP POST async qua supabase_functions
  PERFORM
    supabase_functions.http_request(
      url := v_url,
      method := 'POST',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := v_payload,
      timeout_milliseconds := 5000
    );

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

-- 3. Tạo trigger trên 3 bảng
CREATE TRIGGER sync_to_sheet_contacts_trg
  AFTER INSERT OR UPDATE OR DELETE ON contacts
  FOR EACH ROW EXECUTE FUNCTION sync_to_sheet_trigger_fn();

CREATE TRIGGER sync_to_sheet_events_trg
  AFTER INSERT OR UPDATE OR DELETE ON events
  FOR EACH ROW EXECUTE FUNCTION sync_to_sheet_trigger_fn();

CREATE TRIGGER sync_to_sheet_memories_trg
  AFTER INSERT OR UPDATE OR DELETE ON memories
  FOR EACH ROW EXECUTE FUNCTION sync_to_sheet_trigger_fn();
