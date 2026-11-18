import { test, expect, type Page } from "@playwright/test";

async function scrollHero(page: Page, progress: number) {
  await page.evaluate((value) => {
    const track = document.querySelector<HTMLElement>(".lh-track")!;
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
            .locator(".lh-hero")
            .evaluate((el) => getComputedStyle(el).getPropertyValue("--lh-progress")),
        ) - progress,
      ),
    )
    .toBeLessThan(0.01);
}
/** Part des particules arrivées à leur place dans le logo (0 → 1). */
const formed = (page: Page) =>
  page.locator(".lh-canvas").evaluate((c) => Number(c.dataset.formed ?? -1));
const opacity = (page: Page, selector: string) =>
  page.locator(selector).evaluate((el) => Number(getComputedStyle(el).opacity));

test("particles gather into the lb. logo with the scroll, then scatter back", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("en/");
  const hero = page.locator(".lh-hero");
  await expect(hero).toHaveAttribute("data-scene", "animated");
  await expect(hero).toHaveAttribute("data-ready", "true");
  await expect(page.locator(".lh-stage")).toHaveCSS("position", "sticky");
  await expect.poll(() => formed(page)).toBe(0);
  expect(
    Number(await page.locator(".lh-canvas").getAttribute("data-particles")),
  ).toBeGreaterThan(500);
  await expect(page.locator(".hero-copy h1")).toBeInViewport();
  await scrollHero(page, 1);
  await expect.poll(() => formed(page)).toBe(1);
  await expect.poll(() => opacity(page, ".hero-copy")).toBeLessThan(0.05);
  await expect(page.locator(".hero-actions .button")).toBeHidden();
  await expect(page.locator(".hero-actions a")).toBeHidden();
  await expect(page.locator(".hero-copy h1")).toHaveAccessibleName(
    "Living websites. That stay in your hands.",
  );
  await expect.poll(() => opacity(page, ".lh-end")).toBeGreaterThan(0.95);
  await scrollHero(page, 0);
  await expect.poll(() => formed(page)).toBe(0);
  await expect.poll(() => opacity(page, ".hero-copy")).toBeGreaterThan(0.95);
  await expect(page.locator(".hero-actions a")).toBeVisible();
  // Le bouton principal reste utilisable au chargement.
  await page.locator(".hero-actions .button").click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("reduced motion shows the finished logo and no scroll track", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("en/");
  await expect(page.locator(".lh-hero")).toHaveAttribute("data-scene", "static");
  await expect(page.locator(".lh-poster")).toBeVisible();
  await expect(page.locator(".lh-canvas")).toBeHidden();
  await expect(page.locator(".lh-end")).toBeHidden();
  await expect(page.locator(".hero-copy h1")).toHaveAccessibleName(
    "Living websites. That stay in your hands.",
  );
});

for (const width of [320, 390]) {
  test(`logo opening fits a ${width}px phone`, async ({ page }) => {
    await page.setViewportSize({ width, height: 700 });
    await page.goto("");
    await expect(page.locator(".lh-hero")).toHaveAttribute("data-scene", "animated");
    const actions = (await page.locator(".hero-actions").boundingBox())!;
    expect(actions.y + actions.height).toBeLessThanOrEqual(700);
    const track = (await page.locator(".lh-track").boundingBox())!;
    expect(track.height - 700).toBeLessThan(700);
    await scrollHero(page, 1);
    await expect.poll(() => formed(page)).toBe(1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
  });
}
