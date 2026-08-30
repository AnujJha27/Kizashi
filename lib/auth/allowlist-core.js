export function isAllowedEmailValue(email, allowedEmail) {
  return Boolean(
    typeof allowedEmail === "string" &&
      allowedEmail.trim() &&
      typeof email === "string" &&
      email.trim().toLocaleLowerCase() === allowedEmail.trim().toLocaleLowerCase(),
  );
}
