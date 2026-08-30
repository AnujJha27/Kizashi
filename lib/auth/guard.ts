import { redirect } from "next/navigation";

import { getSupabaseConfig } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/auth/allowlist";
import { isAdminUserValue } from "@/lib/auth/allowlist-core";

export interface AuthenticatedUser {
  id: string;
  email: string;
  isDemo: boolean;
}

export async function getAllowedUser(): Promise<AuthenticatedUser | null> {
  if (!getSupabaseConfig()) {
    return { id: "demo-user", email: "demo@kizashi.local", isDemo: true };
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase!.auth.getUser();
  if (!data.user?.email || !isAllowedEmail(data.user.email)) return null;

  return { id: data.user.id, email: data.user.email, isDemo: false };
}

export async function requireAllowedUser(): Promise<AuthenticatedUser> {
  const user = await getAllowedUser();
  if (!user) redirect("/login");
  return user;
}

export function isAdminUser(user: AuthenticatedUser | null) {
  if (!user) return false;
  if (user.isDemo) return true;
  return isAdminUserValue(user, process.env.ADMIN_EMAIL, process.env.ADMIN_USER_ID);
}

export async function getAdminUser(): Promise<AuthenticatedUser | null> {
  const user = await getAllowedUser();
  return isAdminUser(user) ? user : null;
}

export async function requireAdminUser(): Promise<AuthenticatedUser> {
  const user = await getAllowedUser();
  if (!user) redirect("/login");
  if (!isAdminUser(user)) redirect("/journey");
  return user;
}
