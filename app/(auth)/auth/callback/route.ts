import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/auth/allowlist";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const origin = url.origin;
  const next = url.searchParams.get("next");
  const returnPath = next?.startsWith("/") ? next : "/journey";
  const connectDrive = url.searchParams.get("drive") === "1";
  const supabase = await createSupabaseServerClient();

  if (!supabase || !code) return NextResponse.redirect(`${origin}/login?error=missing-code`);

  const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${origin}/login?error=auth-failed`);

  const { data } = await supabase.auth.getUser();
  if (!isAllowedEmail(data.user?.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/unauthorized`);
  }

  const response = NextResponse.redirect(`${origin}${returnPath}`);
  if (connectDrive && sessionData.session?.provider_token) {
    response.cookies.set("kizashi_drive_token", sessionData.session.provider_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 55,
      path: "/",
    });
  }
  return response;
}
