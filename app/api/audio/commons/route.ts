import { NextResponse } from "next/server";

import { getAllowedUser } from "@/lib/auth/guard";
import { resolveCommonsAudio } from "@/lib/sources/commons-audio";

const MAX_INPUT_LENGTH = 160;

function input(value: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 && trimmed.length <= MAX_INPUT_LENGTH ? trimmed : undefined;
}
export async function GET(request: Request) {
  const user = await getAllowedUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const url = new URL(request.url);
  const text = input(url.searchParams.get("text"));
  const reading = input(url.searchParams.get("reading"));
  if (!text) return NextResponse.json({ error: "Japanese text is required." }, { status: 400 });

  try {
    const result = await resolveCommonsAudio({ text, reading });
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ result: null, error: "Human pronunciation lookup is temporarily unavailable." }, { status: 502 });
  }
}
