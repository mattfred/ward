import { Resend } from "resend";
import { isProduction } from "@/lib/env";

export type SendEmailResult = {
  ok: true;
  provider: "resend" | "log";
  id?: string;
};

/**
 * Sends transactional email via Resend when RESEND_API_KEY is set.
 * Falls back to console logging (dev/test) so local flows still work.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() || "Ward <onboarding@resend.dev>";

  if (apiKey) {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html || opts.text.replace(/\n/g, "<br/>"),
    });
    if (error) {
      console.error("[email] Resend error", error);
      throw new Error(error.message || "Failed to send email");
    }
    return { ok: true, provider: "resend", id: data?.id };
  }

  if (isProduction()) {
    console.error(
      "[email] RESEND_API_KEY is not set — password reset emails will not be delivered",
    );
  }
  console.info("[email]", JSON.stringify({ ...opts, from }));
  return { ok: true, provider: "log" };
}

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}
