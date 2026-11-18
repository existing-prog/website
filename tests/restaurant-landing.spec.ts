import { test, expect, type Page } from "@playwright/test";

/** Défile jusqu’à une progression de l’éclatement (0 → 1), puis attend l’image affichée. */
async function scrollBurst(page: Page, progress: number) {
  await page.evaluate((value) => {
    const track = document.querySelector<HTMLElement>(".rb-track")!;
    const start = track.getBoundingClientRect().top + scrollY;
    const distance = track.offsetHeight - 2 * innerHeight;
    scrollTo({ top: start + distance * value, behavior: "instant" });
  }, progress);
  await expect
    .poll(async () =>
      Math.abs(
        Number(
          await page
            .locator(".rb-scene")
            .evaluate((el) => getComputedStyle(el).getPropertyValue("--rb-progress")),
        ) - progress,
      ),
    )
    .toBeLessThan(0.01);
}
const frame = (page: Page) =>
  page.locator(".rb-canvas").evaluate((c) => Number(c.dataset.frame ?? -1));

test("restaurants page is prerendered in both languages", async ({ request }) => {
  const fr = await (await request.get("restaurants-commerces/")).text();
  expect(fr).toContain('<html lang="fr"');
  expect(fr).toContain("Des sites qui donnent faim.");
  expect(fr).toContain("Exemple autour de 1 200 €");
  expect(fr).toContain("pizza-burst/final.webp");
  const en = await (await request.get("en/restaurants-shops/")).text();
  expect(en).toContain("<title>Websites for restaurants and shops — Lucas Berdy</title>");
  expect(en).toContain("Example at around €1,200");
  const sitemap = await (await request.get("sitemap.xml")).text();
  expect(sitemap).toContain("/website/restaurants-commerces/</loc>");
});

test("the pizza bursts with the scroll, rewinds, and the next section slides over it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("en/restaurants-shops/");
  const scene = page.locator(".rb-scene");
  await expect(scene).toHaveAttribute("data-scene", "animated");
  await expect(scene).toHaveAttribute("data-ready", "true");
  await expect(page.locator(".rb-poster")).toBeHidden();
  await expect.poll(() => frame(page)).toBe(0);
  await scrollBurst(page, 0.5);
  await expect.poll(() => frame(page)).toBeGreaterThan(20);
  await expect.poll(() => frame(page)).toBeLessThan(40);
  await scrollBurst(page, 1);
  await expect.poll(() => frame(page), { timeout: 10000 }).toBe(60);
  await expect
    .poll(() =>
      page.locator(".rb-outline").evaluate((el) => Number(getComputedStyle(el).opacity)),
    )
    .toBeLessThan(0.05);
  // Dernier écran de la piste : la section crème recouvre la scène restée en place.
  await page.evaluate(() => {
    const track = document.querySelector<HTMLElement>(".rb-track")!;
    scrollTo({
      top: track.getBoundingClientRect().bottom + scrollY - innerHeight,
      behavior: "instant",
    });
  });
  await expect
    .poll(() =>
      page.locator(".lp-reveal").evaluate((el) => el.getBoundingClientRect().top),
    )
    .toBeLessThanOrEqual(1);
  await scrollBurst(page, 0);
  await expect.poll(() => frame(page)).toBe(0);
  await expect
    .poll(() =>
      page.locator(".rb-outline").evaluate((el) => Number(getComputedStyle(el).opacity)),
    )
    .toBeGreaterThan(0.95);
});

test("reduced motion shows the final picture without a scroll track", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("en/restaurants-shops/");
  await expect(page.locator(".rb-scene")).toHaveAttribute("data-scene", "static");
  await expect(page.locator(".rb-poster")).toBeVisible();
  await expect(page.locator(".rb-canvas")).toBeHidden();
  await expect(page.locator(".lp-reveal")).toHaveCSS("margin-top", "0px");
  await expect(page.locator("#restaurants-title")).toHaveAccessibleName(
    "RESTAURANTS — Websites that make people hungry.",
  );
});

for (const width of [320, 390]) {
  test(`restaurants scene fits a ${width}px phone`, async ({ page }) => {
    await page.setViewportSize({ width, height: 700 });
    await page.goto("restaurants-commerces/");
    await expect(page.locator(".rb-scene")).toHaveAttribute("data-scene", "animated");
    const box = await page.locator(".rb-outline").boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
    await expect(page.locator(".rb-actions button")).toBeInViewport({ ratio: 1 });
    await scrollBurst(page, 1);
    await expect.poll(() => frame(page), { timeout: 10000 }).toBe(60);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
  });
}

test("calls to action open the planner with a business website selected", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("en/restaurants-shops/");
  await expect(page.locator("#restaurants-title")).toBeFocused();
  const openingButton = page.locator(".rb-actions").getByRole("button");
  await expect(openingButton).toBeInViewport({ ratio: 1 });
  await openingButton.press("Enter");
  await expect(page.locator(".service-option.chosen strong")).toHaveText(
    "Business website",
  );
  await page.getByRole("button", { name: "Close project planner" }).click();
  await expect(openingButton).toBeFocused();
  await page.getByRole("link", { name: "Read the case study" }).first().click();
  await expect(page).toHaveURL(/\/website\/en\/projects\/atelier-pizza\/$/);
});
