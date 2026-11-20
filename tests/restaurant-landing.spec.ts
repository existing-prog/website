import { test, expect } from "@playwright/test";

test("the restaurant offer is prerendered in both languages around a storefront", async ({
  request,
}) => {
  const fr = await (await request.get("restaurants-commerces/")).text();
  expect(fr).toContain('<html lang="fr"');
  expect(fr).toContain("de pousser la porte.");
  expect(fr).toContain("Exemple autour de 1 200 €");
  expect(fr).toContain("local-storefront.webp");
  expect(fr).not.toContain("pizza-burst/");
  const en = await (await request.get("en/restaurants-shops/")).text();
  expect(en).toContain("<title>Websites for restaurants and shops — Lucas Berdy</title>");
  expect(en).toContain("Example at around €1,200");
  const sitemap = await (await request.get("sitemap.xml")).text();
  expect(sitemap).toContain("/website/restaurants-commerces/</loc>");
});

test("the storefront opens and rewinds with ordinary scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("en/restaurants-shops/");
  await expect(page.locator("#restaurants-title")).toBeFocused();
  const detail = page.locator(".restaurant-visitor-detail").first();
  await expect(detail).toHaveCSS("opacity", "0");
  await page.evaluate(() => scrollTo({ top: 230, behavior: "instant" }));
  await expect(detail).toHaveCSS("opacity", "1");
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await expect(detail).toHaveCSS("opacity", "0");
});

test("reduced motion shows the open storefront immediately", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("en/restaurants-shops/");
  await expect(page.locator(".restaurant-pane-left")).toBeHidden();
  await expect(page.locator(".restaurant-visitor-detail").first()).toHaveCSS(
    "opacity",
    "1",
  );
});

for (const width of [320, 390]) {
  test(`the restaurant offer fits a ${width}px phone and keeps the quote in view`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 667 });
    await page.goto("restaurants-commerces/");
    await expect(page.locator(".restaurant-hero button")).toBeInViewport({ ratio: 1 });
    await expect
      .poll(() =>
        page.locator(".restaurant-photo img").evaluate((img: HTMLImageElement) => ({
          loaded: img.naturalWidth > 0,
          mobile: img.currentSrc.endsWith("local-storefront-640.webp"),
        })),
      )
      .toEqual({ loaded: true, mobile: true });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
  });
}

test("the hero opens a preselected quote and the text link reaches Atelier Pizza", async ({
  page,
}) => {
  await page.goto("en/restaurants-shops/");
  await expect(page.locator("#restaurants-title")).toBeFocused();
  const cta = page.locator(".restaurant-hero").getByRole("button");
  await cta.press("Enter");
  await expect(page.locator(".service-option.chosen strong")).toHaveText(
    "Business website",
  );
  await page.getByRole("button", { name: "Close project planner" }).click();
  await expect(cta).toBeFocused();
  await expect(page.locator("#restaurants-example img")).toHaveCount(0);
  await page.getByRole("link", { name: "Explore Atelier Pizza" }).click();
  await expect(page).toHaveURL(/\/website\/en\/projects\/atelier-pizza\/$/);
  await expect(page.locator(".atelier-bite")).toBeVisible();
});
