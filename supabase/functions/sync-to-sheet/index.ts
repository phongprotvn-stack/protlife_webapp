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

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: Record<string, unknown> | null;
  old_record: Record<string, unknown> | null;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const payload: WebhookPayload = await req.json();
    const { type, table, record, old_record } = payload;

    // Get user_id from whichever field has data
    const rec = record ?? old_record;
    const userId = rec?.user_id;
    if (!userId || typeof userId !== "string") {
      return response({ skipped: true, reason: "no user_id" });
    }

    // ─── Look up Google tokens ──────────────────────────────────────
    const { createClient } = await import("jsr:@supabase/supabase-js");
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: tokens, error: tokenError } = await supabaseAdmin
      .from("google_tokens")
      .select("access_token, refresh_token, token_expires_at, sheet_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (tokenError || !tokens || !tokens.sheet_id) {
      return response({ skipped: true, reason: "no google tokens or sheet_id" });
    }

    // ─── Refresh token if expired ────────────────────────────────────
    let accessToken = tokens.access_token;
    if (tokens.token_expires_at && new Date(tokens.token_expires_at) < new Date()) {
      const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: Deno.env.get("GOOGLE_CLIENT_ID") ?? "",
          client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET") ?? "",
          refresh_token: tokens.refresh_token,
          grant_type: "refresh_token",
        }),
      });

      if (!refreshRes.ok) {
        console.error("Google token refresh failed:", await refreshRes.text());
        return response({ success: false, error: "token refresh failed" }, 500);
      }

      const refreshed = await refreshRes.json();
      accessToken = refreshed.access_token;

      // Update stored token
      await supabaseAdmin.from("google_tokens").update({
        access_token: accessToken,
        token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("user_id", userId);
    }

    const sheetId = tokens.sheet_id;
    const tableLabel = { contacts: "Liên hệ", events: "Sự kiện", memories: "Ký ức" }[table] ?? table;

    // ─── Execute sheet operation ─────────────────────────────────────
    switch (type) {
      case "INSERT":
        if (record) await appendRow(sheetId, accessToken, tableLabel, record);
        break;
      case "UPDATE":
        if (record) await updateRow(sheetId, accessToken, tableLabel, record);
        break;
      case "DELETE":
        if (old_record?.id) await deleteRow(sheetId, accessToken, String(old_record.id));
        break;
    }

    return response({ success: true });
  } catch (err) {
    console.error("sync-to-sheet error:", err);
    return response(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      500,
    );
  }
});

// ─── Helpers ────────────────────────────────────────────────────────────

function toRow(tableLabel: string, record: Record<string, unknown>): string[] {
  const id = String(record.id ?? "");
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);

  switch (tableLabel) {
    case "Liên hệ":
      return [id, tableLabel, String(record.name ?? record.phone ?? ""), record.created_at ? String(record.created_at).slice(0, 10) : "", String(record.notes ?? ""), now];
    case "Sự kiện":
      return [id, tableLabel, String(record.name ?? ""), record.event_date ? String(record.event_date).slice(0, 10) : record.created_at ? String(record.created_at).slice(0, 10) : "", String(record.description ?? ""), now];
    case "Ký ức":
      return [id, tableLabel, String(record.title ?? record.name ?? ""), record.created_at ? String(record.created_at).slice(0, 10) : "", String(record.content ?? record.description ?? ""), now];
    default:
      return [id, tableLabel, JSON.stringify(record), "", "", now];
  }
}

async function appendRow(
  sheetId: string,
  accessToken: string,
  tableLabel: string,
  record: Record<string, unknown>,
) {
  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Data:append`);
  url.searchParams.set("valueInputOption", "USER_ENTERED");
  url.searchParams.set("insertDataOption", "INSERT_ROWS");

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      values: [toRow(tableLabel, record)],
      majorDimension: "ROWS",
    }),
  });

  if (!res.ok) console.error("appendRow failed:", await res.text());
}

async function updateRow(
  sheetId: string,
  accessToken: string,
  tableLabel: string,
  record: Record<string, unknown>,
) {
  const row = await findRowById(sheetId, accessToken, String(record.id));
  if (row === -1) {
    // Row not found — append instead
    return appendRow(sheetId, accessToken, tableLabel, record);
  }

  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Data!A${row}:F${row}`);
  url.searchParams.set("valueInputOption", "USER_ENTERED");

  const res = await fetch(url.toString(), {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      values: [toRow(tableLabel, record)],
      majorDimension: "ROWS",
    }),
  });

  if (!res.ok) console.error("updateRow failed:", await res.text());
}

async function deleteRow(
  sheetId: string,
  accessToken: string,
  recordId: string,
) {
  const row = await findRowById(sheetId, accessToken, recordId);
  if (row === -1) return;

  // Clear row content (cannot delete individual cells, only clear)
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Data!A${row}:F${row}:clear`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!res.ok) console.error("deleteRow failed:", await res.text());
}

async function findRowById(
  sheetId: string,
  accessToken: string,
  id: string,
): Promise<number> {
  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Data!A:A`);
  url.searchParams.set("majorDimension", "COLUMNS");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) return -1;

  const data = await res.json();
  const values: string[] = data.values?.[0] ?? [];

  // values[0] = header "ID", values[1..] = actual IDs
  for (let i = 1; i < values.length; i++) {
    if (values[i] === id) return i + 1; // 1-indexed row
  }

  return -1;
}
