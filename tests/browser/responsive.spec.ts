import { expect, test } from "@playwright/test";
for (const viewport of [
  { width: 320, height: 740 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]) {
  test(`personal subjects, navigation and routine controls fit ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/login");
    await page.locator("[name=email]").fill("responsive@example.com");
    await page.locator("[name=password]").fill("local-demo-password");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page).toHaveURL(/dashboard$/);
    await page.goto("/onboarding");
    await page
      .locator('input[name="fullName"]:visible')
      .fill("Responsive Student");
    await page.locator('input[type="date"]:visible').fill("2099-11-20");
    for (let i = 0; i < 3; i++)
      await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page
      .getByRole("button", { name: "Start Your Preparation Journey" })
      .click();
    await expect(page).toHaveURL(/roadmaps\/new$/);
    await page.goto("/learning");
    await page
      .getByRole("button", { name: "Create Learning Track", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    const options = await dialog
      .locator("[name=subject] option")
      .allTextContents();
    expect(options).not.toContain("Java");
    expect(options).not.toContain("C++");
    expect(options).toContain("DBMS");
    const bounds = await dialog.boundingBox();
    expect(bounds!.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds!.height).toBeLessThanOrEqual(viewport.height);
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await page.goto("/planner/customize");
    await expect(
      page.getByRole("heading", { name: "Your week, your control" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Approve & activate daily planner" }),
    ).toBeDisabled();
    await page.screenshot({
      path: test.info().outputPath(`routine-${viewport.width}.png`),
    });
    if (viewport.width < 1280) {
      await page.getByRole("button", { name: "Subjects", exact: true }).click();
      await expect(
        page.getByRole("heading", { name: "Subject library", exact: true }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Calendar", exact: true }).click();
      await expect(
        page.getByRole("heading", { name: "Weekly calendar", exact: true }),
      ).toBeVisible();
    }
    await page
      .getByText("Availability, rest days and subject targets", { exact: true })
      .click();
    await expect(page.getByLabel("Maximum subjects per day")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    if (viewport.width < 1024) {
      await page
        .getByRole("button", { name: "Open menu", exact: true })
        .click();
      await expect(
        page
          .getByRole("link", { name: "Weekly Routine Editor", exact: true })
          .last(),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Close menu", exact: true })
        .click();
    }
    await page.goto("/roadmaps/new");
    await page.getByRole("button", { name: "Add topic manually" }).click();
    await expect(page.getByLabel("Topic", { exact: true })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    for (const route of [
      "/dashboard",
      "/planner",
      "/dsa",
      "/revision",
      "/applications",
      "/analytics",
      "/mentor",
      "/settings",
    ]) {
      await page.goto(route);
      await expect(page.locator("h1").first()).toBeVisible();
      await expect(
        page.getByRole("heading", {
          name: "This workspace could not be loaded",
          exact: true,
        }),
      ).not.toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        `${route} should fit ${viewport.width}px`,
      ).toBe(true);
    }
  });
}
