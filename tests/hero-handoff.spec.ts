import { test, expect } from "@playwright/test";

for (const width of [390, 1440]) {
  test(`hero stays in its column while scrolling at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("en/");
    await page.evaluate(() => document.fonts.ready);
    const initial = await page
      .locator(".showcase-window")
      .evaluate((el) => (el as HTMLElement).offsetWidth);
    await page.evaluate(() => scrollTo({ top: 350, behavior: "instant" }));
    await page.mouse.move(8, 100);
    await expect(page.locator(".hero-handoff, .handoff-frame")).toHaveCount(0);
    await expect(page.locator(".showcase-window")).toHaveCSS("opacity", "1");
    const current = await page.locator(".showcase-window").boundingBox();
    expect(
      await page
        .locator(".showcase-window")
        .evaluate((el) => (el as HTMLElement).offsetWidth),
    ).toBe(initial);
    expect(current!.width).toBeLessThan(width);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await page.getByRole("button", { name: "Preview Kasa", exact: true }).click();
    await expect(page.locator(".showcase-image img")).toHaveAttribute(
      "src",
      /kasa.webp$/,
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator(".hero-stage")).toHaveCSS("transform", "none");
  });
}

test("direct work links expose projects without covering their titles", async ({
  page,
}) => {
  await page.goto("en/#work");
  await expect(page.locator("#work .section-heading h2")).toBeInViewport();
  await expect(page.locator(".hero-handoff")).toHaveCount(0);
  await page.getByRole("button", { name: "Portfolios", exact: true }).click();
  await expect(page.locator(".project-chapter")).toHaveCount(1);
});
