import { test, expect } from "@playwright/test";

test("Google login and signup show an honest setup error without creating a demo session", async ({ page, context }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue with Google", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: /Google sign-in|Google provider/ })).toContainText("Google sign-in requires Supabase configuration");
  await expect(page).toHaveURL(/\/login$/);
  expect((await context.cookies()).some((cookie) => cookie.name === "forge_demo_user")).toBe(false);
  await page.goto("/signup");
  await page.getByRole("button", { name: "Continue with Google", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: /Google sign-in|Google provider/ })).toContainText("Demo mode cannot sign in with Google");
  expect((await context.cookies()).some((cookie) => cookie.name === "forge_demo_user")).toBe(false);
});

test("OAuth cancellation renders a safe message and callback destinations cannot leave the app", async ({ page }) => {
  await page.goto("/auth/callback?error=access_denied&error_description=untrusted-provider-description&next=https://example.com");
  await expect(page).toHaveURL(/\/login\?error=oauth_cancelled$/);
  await expect(page.getByRole("alert").filter({ hasText: /Google sign-in|Google provider/ })).toContainText("Google sign-in was cancelled");
  await expect(page.locator("body")).not.toContainText("untrusted-provider-description");
  await page.goto("/auth/callback?code=unusable-code&next=//example.com");
  await expect(page).toHaveURL(/\/login\?error=oauth_setup$/);
  await expect(page.getByRole("alert").filter({ hasText: /Google sign-in|Google provider/ })).toContainText("Google provider enabled");
});
