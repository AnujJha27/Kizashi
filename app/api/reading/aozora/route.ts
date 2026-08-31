import { NextResponse } from "next/server";

import entries from "@/data/source-maps/aozora.json";
import { getAllowedUser } from "@/lib/auth/guard";
import { fetchAozoraText, type AozoraWork } from "@/lib/sources/aozora";

export const runtime = "nodejs";

function workId(value: string | null) {
  const trimmed = value?.trim() ?? "";
  return /^\d{1,8}$/u.test(trimmed) ? trimmed : undefined;
}

export async function GET(request: Request) {
  const user = await getAllowedUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const requested = workId(new URL(request.url).searchParams.get("workId"));
  if (!requested) return NextResponse.json({ works: entries.map(({ textUrl: _textUrl, ...entry }) => entry) });
  const entry = entries.find((candidate) => candidate.workId === requested) as AozoraWork | undefined;
  if (!entry) return NextResponse.json({ error: "Aozora work not found." }, { status: 404 });
  try {
    const text = await fetchAozoraText(entry);
    return NextResponse.json({ entry, text }, { headers: { "Cache-Control": "private, max-age=300" } });
  } catch (error) {
    const message = error instanceof Error && /not marked reusable/u.test(error.message) ? "This work is not marked reusable." : "The Aozora source is temporarily unavailable.";
    return NextResponse.json({ entry, text: null, error: message }, { status: message.includes("not marked") ? 403 : 502 });
  }
}
