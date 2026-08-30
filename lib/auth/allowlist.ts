import { isAdminEmail, isAdminUserId, isAllowedEmailValue } from "@/lib/auth/allowlist-core";

export function isAllowedEmail(email: string | null | undefined) {
  return isAllowedEmailValue(email, [process.env.ALLOWED_EMAIL, process.env.ALLOWED_EMAILS].filter(Boolean).join(","));
}

export function isAdminUser(userId: string | null | undefined, email: string | null | undefined) {
  return isAdminEmail(email, process.env.ADMIN_EMAIL || "aj05767625@gmail.com") || isAdminUserId(userId, process.env.ADMIN_USER_ID);
}
