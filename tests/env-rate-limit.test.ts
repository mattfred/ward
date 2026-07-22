import { describe, expect, it } from "vitest";
import { rateLimit } from "../src/lib/rate-limit";
import { allowDevBillingBypass, isAdminEmail } from "../src/lib/env";

describe("rateLimit", () => {
  it("blocks after limit", () => {
    const key = `test-${Math.random()}`;
    expect(rateLimit(key, { limit: 2, windowMs: 60_000 }).ok).toBe(true);
    expect(rateLimit(key, { limit: 2, windowMs: 60_000 }).ok).toBe(true);
    expect(rateLimit(key, { limit: 2, windowMs: 60_000 }).ok).toBe(false);
  });
});

describe("env helpers", () => {
  it("allows admin in non-production when ADMIN_EMAILS unset", () => {
    const prev = process.env.ADMIN_EMAILS;
    delete process.env.ADMIN_EMAILS;
    expect(isAdminEmail("anyone@example.com")).toBe(true);
    process.env.ADMIN_EMAILS = prev;
  });

  it("dev billing bypass respects production", () => {
    const prevNode = process.env.NODE_ENV;
    const prevBypass = process.env.ALLOW_DEV_PREMIUM_BYPASS;
    process.env.NODE_ENV = "development";
    process.env.ALLOW_DEV_PREMIUM_BYPASS = "true";
    expect(allowDevBillingBypass()).toBe(true);
    process.env.NODE_ENV = "production";
    expect(allowDevBillingBypass()).toBe(false);
    process.env.NODE_ENV = prevNode;
    process.env.ALLOW_DEV_PREMIUM_BYPASS = prevBypass;
  });
});
