import { NextResponse } from "next/server";
import { createServerClient, type SetAllCookies } from "@supabase/ssr";

import { getSupabaseConfig } from "@/lib/supabase/env";

export async function middleware(request: Request & { cookies: { getAll(): { name: string; value: string }[]; set(name: string, value: string): void } }) {
  const config = getSupabaseConfig();
  let response = NextResponse.next();
  if (!config) return response;

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response = NextResponse.next();
          response.cookies.set(name, value, options);
        });
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|sw.js).*)"],
};
