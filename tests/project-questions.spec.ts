import { test, expect } from "@playwright/test";

for (const width of [320, 390, 768, 1440]) {
  test(`process and questions work in both languages at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("#questions");
    for (const language of ["Français", "English"]) {
      await page
        .locator("header")
        .getByRole("button", { name: language, exact: true })
        .click();
      await expect(page.locator("#approach .step")).toHaveCount(4);
      await expect(page.locator(".project-question")).toHaveCount(8);
      const summary = page.locator(".project-question summary").first();
      await summary.focus();
      await page.keyboard.press("Enter");
      await expect(page.locator(".project-question").first()).toHaveAttribute("open", "");
      await expect(page.locator(".project-question > p").first()).toBeVisible();
      await page.keyboard.press("Enter");
      await expect(page.locator(".project-question").first()).not.toHaveAttribute(
        "open",
        "",
      );
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      ).toBeLessThanOrEqual(1);
    }
    await page.locator(".questions-intro button").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.locator(".service-option.chosen strong")).toHaveText(
      "Business website",
    );
    await page.getByRole("button", { name: "Close project planner" }).click();
    await expect(page.locator(".questions-intro button")).toBeFocused();
  });
}
