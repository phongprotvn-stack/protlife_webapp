// Edge Function: revoke-device-session
// Called when user revokes a specific device session from Settings → Quản lý thiết bị
//
// 1. Receives { session_id, device_row_id } from JSON body
// 2. Revokes the Supabase auth session via revoke_session() RPC (service_role bypasses RLS)
// 3. Deletes the device record from user_devices table
// 4. Returns { success: true } or error message

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { session_id, device_row_id } = await req.json();

    // ─── Validate input ────────────────────────────────────────
    if (!device_row_id || typeof device_row_id !== "string") {
      return response(
        { success: false, error: "Missing or invalid device_row_id" },
        400
      );
    }

    // Create admin client using service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // ─── Revoke Supabase auth session (if session_id provided) ──
    if (session_id && typeof session_id === "string") {
      const { error: rpcError } = await supabaseAdmin.rpc(
        "revoke_session",
        { target_session_id: session_id }
      );
      if (rpcError) {
        // "Session not found" means already invalid — that's fine, keep going
        if (rpcError.message?.includes("Session not found")) {
          console.log("Session already invalid, skipping revocation:", session_id);
        } else {
          console.error("revoke_session RPC failed:", rpcError);
          return response(
            { success: false, error: `Failed to revoke session: ${rpcError.message}` },
            500
          );
        }
      }
    }

    // ─── Delete device record ─────────────────────────────────
    const { error: deleteError } = await supabaseAdmin
      .from("user_devices")
      .delete()
      .eq("id", device_row_id);

    if (deleteError) {
      console.error("Failed to delete device record:", deleteError);
      return response(
        { success: false, error: `Failed to delete device record: ${deleteError.message}` },
        500
      );
    }

    return response({ success: true });
  } catch (err) {
    console.error("revoke-device-session error:", err);
    return response(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      500
    );
  }
});
