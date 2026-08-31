import { readFile } from "node:fs/promises";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";

import { NextResponse } from "next/server";

import { getAllowedUser } from "@/lib/auth/guard";
import { releaseForLearners } from "@/lib/content-release.js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STAGING_FILE = path.join(process.cwd(), "data", "staging", "kizashi-n5-source-review.json.gz");

export async function GET(request: Request) {
  const user = await getAllowedUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const learnerAudience = new URL(request.url).searchParams.get("audience") === "learner";
  if (!learnerAudience && !user.isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  try {
    const payload = await readFile(STAGING_FILE);
    const body = learnerAudience
      ? gzipSync(JSON.stringify(releaseForLearners(JSON.parse(gunzipSync(payload).toString("utf8")))))
      : payload;
    return new NextResponse(new Uint8Array(body), {
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
