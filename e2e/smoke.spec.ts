import { test, expect } from "@playwright/test";

test.describe("Cohesive v1 smoke", () => {
  test("landing shows brand and CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Cohesive").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Build your style system|Start free/i }).first()).toBeVisible();
  });

  test("signup → onboarding → dashboard", async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`;
    await page.goto("/signup");
    await page.getByLabel("Name").fill("E2E User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("password123");
    await Promise.all([
      page.waitForURL(/\/(onboarding|login)/, { timeout: 45_000 }),
      page.getByRole("button", { name: /Start free/i }).click(),
    ]);

    if (page.url().includes("/login")) {
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password").fill("password123");
      await Promise.all([
        page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 45_000 }),
        page.getByRole("button", { name: /Log in/i }).click(),
      ]);
    }

    if (page.url().includes("/dashboard")) {
      // Already generated in a prior attempt — still assert core UI
      await expect(page.getByText(/Your style system|Build your style|Generate/i).first()).toBeVisible();
      return;
    }

    await expect(page).toHaveURL(/onboarding/);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: /Generate my system/i }).click();
    await page.waitForURL("**/dashboard", { timeout: 90_000 });

    await expect(page.getByRole("heading", { name: "Your style system" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Rebuild roadmap" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Keep · replace · gaps" })).toBeVisible();
  });
});
