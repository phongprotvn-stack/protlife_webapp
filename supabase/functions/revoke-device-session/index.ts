// Edge Function: revoke-device-session
// Called when user revokes a specific device session from Settings → Quản lý thiết bị
//
// 1. Receives { session_id, device_row_id } from JSON body
// 2. Revokes the Supabase auth session via revoke_session() RPC (service_role bypasses RLS)
// 3. Deletes the device record from user_devices table
// 4. Returns { success: true } or error message

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server";

export default {
  fetch: withSupabase({ auth: ["secret"] }, async (req: Request, ctx) => {
    try {
      const { session_id, device_row_id } = await req.json();

      // ─── Validate input ────────────────────────────────────────
      if (!session_id || typeof session_id !== "string") {
        return Response.json(
          { success: false, error: "Missing or invalid session_id" },
          { status: 400 }
        );
      }
      if (!device_row_id || typeof device_row_id !== "string") {
        return Response.json(
          { success: false, error: "Missing or invalid device_row_id" },
          { status: 400 }
        );
      }

      // ─── Revoke Supabase auth session ──────────────────────────
      const { error: rpcError } = await ctx.supabaseAdmin.rpc(
        "revoke_session",
        { target_session_id: session_id }
      );

      if (rpcError) {
        console.error("revoke_session RPC failed:", rpcError);
        return Response.json(
          { success: false, error: `Failed to revoke session: ${rpcError.message}` },
          { status: 500 }
        );
      }

      // ─── Delete device record ─────────────────────────────────
      const { error: deleteError } = await ctx.supabaseAdmin
        .from("user_devices")
        .delete()
        .eq("id", device_row_id);

      if (deleteError) {
        console.error("Failed to delete device record:", deleteError);
        return Response.json(
          { success: false, error: `Failed to delete device record: ${deleteError.message}` },
          { status: 500 }
        );
      }

      return Response.json({ success: true });
    } catch (err) {
      console.error("revoke-device-session error:", err);
      return Response.json(
        { success: false, error: err instanceof Error ? err.message : "Unknown error" },
        { status: 500 }
      );
    }
  }),
};
