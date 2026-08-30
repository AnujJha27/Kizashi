export function isAllowedEmailValue(email, allowedEmail) {
  if (typeof allowedEmail !== "string" || typeof email !== "string" || !email.trim()) return false;
  const normalizedEmail = email.trim().toLocaleLowerCase();
  return allowedEmail.split(/[;,\n]/).some((candidate) => candidate.trim().toLocaleLowerCase() === normalizedEmail);
}

export function isAdminUserId(userId, adminUserId) {
  return Boolean(
    typeof userId === "string" && userId.trim() &&
      typeof adminUserId === "string" && adminUserId.trim() &&
      userId.trim() === adminUserId.trim(),
  );
}

export function isAdminEmail(email, adminEmail) {
  return isAllowedEmailValue(email, adminEmail);
}

export function isAdminUserValue(user, adminEmail, adminUserId) {
  if (!user || typeof user.id !== "string" || typeof user.email !== "string") return false;
  return isAdminUserId(user.id, adminUserId) || isAdminEmail(user.email, adminEmail);
}
