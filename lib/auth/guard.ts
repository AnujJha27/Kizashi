import { redirect } from "next/navigation";

import { getSupabaseConfig } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminUser, isAllowedEmail } from "@/lib/auth/allowlist";

export interface AuthenticatedUser {
  id: string;
  email: string;
  isDemo: boolean;
  isAdmin: boolean;
}

export async function getAllowedUser(): Promise<AuthenticatedUser | null> {
  if (!getSupabaseConfig()) {
    return { id: "demo-user", email: "demo@kizashi.local", isDemo: true, isAdmin: true };
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase!.auth.getUser();
  if (!data.user?.email || !isAllowedEmail(data.user.email)) return null;

  return { id: data.user.id, email: data.user.email, isDemo: false, isAdmin: isAdminUser(data.user.id, data.user.email) };
}

export async function requireAllowedUser(): Promise<AuthenticatedUser> {
  const user = await getAllowedUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdminUser(): Promise<AuthenticatedUser> {
  const user = await getAllowedUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/unauthorized");
  return user;
}
