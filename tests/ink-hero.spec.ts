import { test, expect, type Page } from "@playwright/test";

async function scrollInk(page: Page, progress: number) {
  await page.evaluate((value) => {
    const track = document.querySelector<HTMLElement>(".ink-track")!;
    const start = track.getBoundingClientRect().top + scrollY;
    scrollTo({
      top: start + (track.offsetHeight - innerHeight) * value,
      behavior: "instant",
    });
  }, progress);
  await expect
    .poll(async () =>
      Math.abs(
        Number(
          await page
            .locator(".ink-hero")
            .evaluate((el) => getComputedStyle(el).getPropertyValue("--ink-progress")),
        ) - progress,
      ),
    )
    .toBeLessThan(0.01);
}
const frame = (page: Page) =>
  page.locator(".ink-canvas").evaluate((c) => Number(c.dataset.frame ?? -1));
const opacity = (page: Page, selector: string) =>
  page.locator(selector).evaluate((el) => Number(getComputedStyle(el).opacity));

test("the ink blooms with the scroll behind the headline, then rewinds", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("en/");
  const hero = page.locator(".ink-hero");
  await expect(hero).toHaveAttribute("data-scene", "animated");
  await expect(hero).toHaveAttribute("data-ready", "true");
  await expect(page.locator(".ink-stage")).toHaveCSS("position", "sticky");
  await expect.poll(() => frame(page)).toBe(0);
  await expect(page.locator(".hero-copy h1")).toBeInViewport();
  await scrollInk(page, 1);
  await expect.poll(() => frame(page), { timeout: 10000 }).toBe(36);
  await expect.poll(() => opacity(page, ".hero-copy")).toBeLessThan(0.05);
  await expect.poll(() => opacity(page, ".ink-end")).toBeGreaterThan(0.95);
  await scrollInk(page, 0);
  await expect.poll(() => frame(page)).toBe(0);
  await expect.poll(() => opacity(page, ".hero-copy")).toBeGreaterThan(0.95);
  // Le bouton principal reste utilisable au chargement.
  await page.locator(".hero-actions .button").click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("reduced motion keeps a still picture and no scroll track", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("en/");
  await expect(page.locator(".ink-hero")).toHaveAttribute("data-scene", "static");
  await expect(page.locator(".ink-poster")).toBeVisible();
  await expect(page.locator(".ink-canvas")).toBeHidden();
  await expect(page.locator(".ink-end")).toBeHidden();
  await expect(page.locator(".hero-copy h1")).toHaveAccessibleName(
    "Living websites. That stay in your hands.",
  );
});

for (const width of [320, 390]) {
  test(`ink opening fits a ${width}px phone`, async ({ page }) => {
    await page.setViewportSize({ width, height: 700 });
    await page.goto("");
    await expect(page.locator(".ink-hero")).toHaveAttribute("data-scene", "animated");
    const actions = (await page.locator(".hero-actions").boundingBox())!;
    expect(actions.y + actions.height).toBeLessThanOrEqual(700);
    await scrollInk(page, 1);
    await expect.poll(() => frame(page), { timeout: 10000 }).toBe(36);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
  });
}
