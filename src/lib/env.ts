export function isProduction() {
  return process.env.NODE_ENV === "production";
}

export function allowDevBillingBypass() {
  if (isProduction()) return false;
  return process.env.ALLOW_DEV_PREMIUM_BYPASS !== "false";
}

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  const admins = getAdminEmails();
  if (admins.length === 0 && !isProduction()) {
    // In development, any signed-in user can view metrics if ADMIN_EMAILS unset
    return true;
  }
  return admins.includes(email.toLowerCase());
}

export function appOrigin() {
  return process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000";
}
