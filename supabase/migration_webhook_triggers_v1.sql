-- Thay thế Database Webhooks bằng PostgreSQL triggers + pg_net
-- pg_net cho phép gọi HTTP async từ trong database trigger

-- 1. Bật extension pg_net (nếu chưa bật)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Hàm trigger gửi HTTP POST đến Edge Function sync-to-sheet
CREATE OR REPLACE FUNCTION sync_to_sheet_trigger_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payload jsonb;
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
  );

  -- Gọi HTTP POST async (pg_net)
  PERFORM
    net.http_post(
      url := v_url,
      body := v_payload::text,
      headers := '{"Content-Type": "application/json"}'::jsonb,
      timeout_milliseconds := 5000
    );

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

-- 3. Tạo trigger trên 3 bảng
DROP TRIGGER IF EXISTS sync_to_sheet_contacts_trg ON contacts;
CREATE TRIGGER sync_to_sheet_contacts_trg
  AFTER INSERT OR UPDATE OR DELETE ON contacts
  FOR EACH ROW EXECUTE FUNCTION sync_to_sheet_trigger_fn();

DROP TRIGGER IF EXISTS sync_to_sheet_events_trg ON events;
CREATE TRIGGER sync_to_sheet_events_trg
  AFTER INSERT OR UPDATE OR DELETE ON events
  FOR EACH ROW EXECUTE FUNCTION sync_to_sheet_trigger_fn();

DROP TRIGGER IF EXISTS sync_to_sheet_memories_trg ON memories;
CREATE TRIGGER sync_to_sheet_memories_trg
  AFTER INSERT OR UPDATE OR DELETE ON memories
  FOR EACH ROW EXECUTE FUNCTION sync_to_sheet_trigger_fn();
