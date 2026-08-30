import { isAllowedEmailValue } from "@/lib/auth/allowlist-core";

export function isAllowedEmail(email: string | null | undefined) {
  return isAllowedEmailValue(email, process.env.ALLOWED_EMAILS || process.env.ALLOWED_EMAIL);
}
