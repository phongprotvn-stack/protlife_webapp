-- Trigger gọi Edge Function sync-to-sheet với exception handling
-- KHÔNG làm hỏng INSERT/UPDATE/DELETE gốc nếu HTTP call thất bại

-- 1. Xoá trigger cũ (nếu có)
DROP TRIGGER IF EXISTS sync_to_sheet_contacts_trg ON contacts;
DROP TRIGGER IF EXISTS sync_to_sheet_events_trg ON events;
DROP TRIGGER IF EXISTS sync_to_sheet_memories_trg ON memories;
DROP FUNCTION IF EXISTS sync_to_sheet_trigger_fn();

-- 2. Tạo function với exception handling
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

  -- Gọi HTTP — nếu lỗi (extension chưa cài, network lỗi, v.v.) thì silent fail
  BEGIN
    PERFORM
      net.http_post(
        url := v_url,
        body := v_payload::text,
        headers := '{"Content-Type": "application/json"}'::jsonb,
        timeout_milliseconds := 5000
      );
  EXCEPTION WHEN OTHERS THEN
    -- Không làm hỏng thao tác gốc
    RAISE WARNING 'Sync-to-sheet HTTP call failed for %.%.%: %',
      TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP, SQLERRM;
  END;

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
