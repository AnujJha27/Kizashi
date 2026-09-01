import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getAllowedUser } from "@/lib/auth/guard";

export async function GET() {
  const user = await getAllowedUser();
  if (!user || user.isDemo) return NextResponse.json({ error: "Sign in before connecting Drive." }, { status: 401 });

  const token = (await cookies()).get("kizashi_drive_token")?.value;
  if (!token) return NextResponse.json({ error: "Connect Google Drive to browse this shelf." }, { status: 401 });

  return NextResponse.json({ accessToken: token }, { headers: { "Cache-Control": "no-store" } });
}
