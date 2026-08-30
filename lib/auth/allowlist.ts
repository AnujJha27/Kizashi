import { isAdminUserId, isAllowedEmailValue } from "@/lib/auth/allowlist-core";

export function isAllowedEmail(email: string | null | undefined) {
  return isAllowedEmailValue(email, [process.env.ALLOWED_EMAIL, process.env.ALLOWED_EMAILS].filter(Boolean).join(","));
}

export function isAdminUser(userId: string | null | undefined) {
  return isAdminUserId(userId, process.env.ADMIN_USER_ID || "aj05767625");
}
