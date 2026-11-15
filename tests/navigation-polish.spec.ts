import { test, expect } from "@playwright/test";

for (const width of [390, 1440]) {
  test(`navigation hides down and returns up at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("");
    const header = page.locator(".site-header");
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => scrollTo({ top: 700, behavior: "instant" }));
    await page.mouse.move(5, 200);
    await expect(header).toHaveAttribute("data-hidden", "true");
    await page.evaluate(() => scrollTo({ top: 560, behavior: "instant" }));
    await page.mouse.move(6, 200);
    await expect(header).toHaveAttribute("data-hidden", "false");
    await expect(header).toBeInViewport();
    await page.evaluate(() => scrollTo({ top: 800, behavior: "instant" }));
    await page.mouse.move(7, 200);
    await expect(header).toHaveAttribute("data-hidden", "true");
    await header.locator("a").first().focus();
    await expect(header).toHaveAttribute("data-hidden", "false");
    await expect(header.locator("a").first()).toBeInViewport();
  });
}

test("primary button has a colored hover and visible keyboard focus", async ({
  page,
}) => {
  await page.goto("");
  const button = page.locator(".hero-actions .button.primary");
  const initial = await button.evaluate((el) => getComputedStyle(el).backgroundImage);
  await button.hover();
  await expect
    .poll(() => button.evaluate((el) => getComputedStyle(el).backgroundImage))
    .not.toBe(initial);
  await button.focus();
  await expect(button).toBeFocused();
});
