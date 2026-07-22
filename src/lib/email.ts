/**
 * Dev/test mailer. In production, set EMAIL_PROVIDER=log (default) or wire Resend later.
 * Password-reset links are always returned in API responses when NODE_ENV !== production
 * so local/e2e flows work without SMTP.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
}) {
  console.info("[email]", JSON.stringify(opts));
  return { ok: true as const };
}
