import { NextResponse } from "next/server";

import { getAllowedUser } from "@/lib/auth/guard";
import { resolveTatoebaAudio } from "@/lib/sources/tatoeba-audio";

const MAX_INPUT_LENGTH = 160;

function input(value: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 && trimmed.length <= MAX_INPUT_LENGTH ? trimmed : undefined;
}

export async function GET(request: Request) {
  const user = await getAllowedUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const text = input(new URL(request.url).searchParams.get("text"));
  if (!text) return NextResponse.json({ error: "Japanese text is required." }, { status: 400 });

  try {
    return NextResponse.json({ result: await resolveTatoebaAudio({ text }) });
  } catch {
    return NextResponse.json({ result: null, error: "Tatoeba audio lookup is temporarily unavailable." }, { status: 502 });
  }
}
