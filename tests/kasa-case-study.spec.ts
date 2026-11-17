import { test, expect } from "@playwright/test";

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`Kasa fits ${width}px in both languages`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("en/projects/kasa/");
    await expect(page.locator(".case-title")).toBeFocused();
    for (const language of ["Français", "English"]) {
      await page
        .locator("header")
        .getByRole("button", { name: language, exact: true })
        .click();
      await expect(page.locator(".kasa-study")).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      ).toBeLessThanOrEqual(1);
    }
    await expect(page).toHaveTitle(/Kasa/);
    await expect(page.locator(".kasa-flow-chapter")).toHaveCount(3);
  });
}

test("Kasa scroll chapters update forwards and backwards", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("en/projects/kasa/");
  await expect(page.locator(".kasa-study")).toHaveAttribute("data-motion", "full");
  for (const index of [0, 1, 2, 1]) {
    await page
      .locator(".kasa-flow-chapter")
      .nth(index)
      .evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
    await page.mouse.move(30 + index, 30);
    await expect(page.locator(".kasa-flow-shot").nth(index)).toHaveAttribute(
      "data-active",
      "true",
    );
  }
});

test("Kasa internal navigation and website quote", async ({ page }) => {
  await page.goto("en/");
  const link = page.locator("#chapter-kasa .story-card");
  await expect(link).toHaveAttribute("href", "/website/en/projects/kasa/");
  await expect(link).not.toHaveAttribute("target", "_blank");
  await link.click();
  await page.reload();
  await expect(page.locator(".kasa-study")).toBeVisible();
  await page.locator(".case-contact button").click();
  await expect(page.locator(".service-option.chosen strong")).toHaveText(
    "Business website",
  );
  await page.getByRole("button", { name: "Close project planner" }).click();
  await page.locator(".case-back").first().click();
  await expect(page.locator("#work .section-heading h2")).toBeInViewport();
});

test("reduced motion keeps all Kasa steps inline", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("en/projects/kasa/");
  await expect(page.locator(".kasa-flow-stage")).toBeHidden();
  await expect(page.locator(".kasa-flow-chapter img")).toHaveCount(3);
  await expect(page.locator(".kasa-hero-browser")).toHaveCSS("transform", "none");
});
