import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { getAllowedUser } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STAGING_FILE = path.join(process.cwd(), "data", "staging", "kizashi-n5-source-review.json.gz");

export async function GET() {
  const user = await getAllowedUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!user.isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  try {
    const payload = await readFile(STAGING_FILE);
    return new NextResponse(new Uint8Array(payload), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Encoding": "gzip",
        "Content-Type": "application/json; charset=utf-8",
        Vary: "Cookie",
      },
    });
  } catch {
    return NextResponse.json({ error: "Review package is unavailable." }, { status: 404 });
  }
}
