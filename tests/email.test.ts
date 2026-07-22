import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("sendEmail", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.RESEND_API_KEY;
  });

  it("logs when Resend is not configured", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const { sendEmail, emailConfigured } = await import("@/lib/email");
    expect(emailConfigured()).toBe(false);
    const result = await sendEmail({
      to: "a@example.com",
      subject: "Hello",
      text: "Body",
    });
    expect(result.provider).toBe("log");
    expect(info).toHaveBeenCalled();
  });
});
