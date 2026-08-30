export function isAllowedEmailValue(email, allowedEmail) {
  return Boolean(
    typeof email === "string" &&
    typeof allowedEmail === "string" &&
    email.trim() &&
    allowedEmail.split(/[,;\n]+/u).some((candidate) => candidate.trim().toLocaleLowerCase() === email.trim().toLocaleLowerCase()),
  );
}

export function isAdminUserValue(user, adminEmail, adminUserId) {
  if (!user || typeof user.id !== "string" || typeof user.email !== "string") return false;
  const matchesId = typeof adminUserId === "string" && adminUserId.trim() && user.id === adminUserId.trim();
  const matchesEmail = typeof adminEmail === "string" && adminEmail.trim() && user.email.trim().toLocaleLowerCase() === adminEmail.trim().toLocaleLowerCase();
  return Boolean(matchesId || matchesEmail);
}
