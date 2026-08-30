import { NextResponse } from "next/server";

import { getAllowedUser } from "@/lib/auth/guard";
import { parseSyncPayload } from "@/lib/supabase/sync-core";
import { readSyncSnapshot, writeSyncSnapshot } from "@/lib/supabase/sync";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ParsedSyncPayload =
  | { ok: true; value: { version: 1; data: Record<string, unknown> } }
  | { ok: false; error: string };

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function GET() {
  const user = await getAllowedUser();
  if (!user) return unauthorized();
  if (user.isDemo) return NextResponse.json({ version: 1, data: {}, mode: "local" });

  try {
    const supabase = await createSupabaseServerClient();
    const snapshot = await readSyncSnapshot(supabase!, user.id);
    return NextResponse.json(snapshot ?? { version: 1, data: {} });
  } catch {
    return NextResponse.json({ error: "Could not read synced study state." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const user = await getAllowedUser();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Sync payload must be valid JSON." }, { status: 400 });
  }
  const parsed = parseSyncPayload(body) as ParsedSyncPayload;
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  if (user.isDemo) return NextResponse.json({ ok: true, mode: "local" });

  try {
    const supabase = await createSupabaseServerClient();
    await writeSyncSnapshot(supabase!, user.id, parsed.value);
    return NextResponse.json({ ok: true, version: parsed.value.version });
  } catch {
    return NextResponse.json({ error: "Could not save synced study state." }, { status: 502 });
  }
}
