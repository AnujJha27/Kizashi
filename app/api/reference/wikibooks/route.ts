import { NextResponse } from "next/server";

import { getAllowedUser } from "@/lib/auth/guard";
import { getWikibooksSection } from "@/lib/sources/wikibooks";

function value(value: string | null, max: number) {
  const text = value?.trim() ?? "";
  return text && text.length <= max && !/[\u0000-\u001f]/u.test(text) ? text : undefined;
}

export async function GET(request: Request) {
  const user = await getAllowedUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const url = new URL(request.url);
  const page = value(url.searchParams.get("page"), 180);
  const section = value(url.searchParams.get("section"), 120);
  if (!page) return NextResponse.json({ error: "A Wikibooks page is required." }, { status: 400 });
  try {
    return NextResponse.json({ result: await getWikibooksSection({ page, section }) });
  } catch {
    return NextResponse.json({ result: null, error: "The Wikibooks reference is temporarily unavailable." }, { status: 502 });
  }
}

