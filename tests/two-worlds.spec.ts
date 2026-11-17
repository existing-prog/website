import { test, expect, type Page } from "@playwright/test";

async function scrollWorlds(page: Page, progress: number) {
  await page.evaluate((value) => {
    const track = document.querySelector<HTMLElement>(".tw-track")!;
    const start = track.getBoundingClientRect().top + scrollY;
    scrollTo({
      top: start + (track.offsetHeight - innerHeight) * value,
      behavior: "instant",
    });
  }, progress);
}
const opacity = (page: Page, selector: string) =>
  page.locator(selector).evaluate((el) => Number(getComputedStyle(el).opacity));

test("home splits into two worlds that lead to the specialised pages", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("en/");
  const section = page.locator(".tw-section");
  await expect(section).toHaveAttribute("data-scene", "animated");
  await scrollWorlds(page, 0);
  await expect.poll(() => opacity(page, ".tw-question")).toBeGreaterThan(0.95);
  await expect
    .poll(() => opacity(page, ".tw-world-academic .tw-veil"))
    .toBeGreaterThan(0.95);
  await scrollWorlds(page, 1);
  await expect(section).toHaveAttribute("data-phase", "worlds");
  await expect.poll(() => opacity(page, ".tw-question")).toBeLessThan(0.05);
  await expect
    .poll(() => opacity(page, ".tw-world-restaurants .tw-veil"))
    .toBeLessThan(0.05);
  await page.getByRole("link", { name: /Websites that make people hungry/ }).click();
  await expect(page).toHaveURL(/\/website\/en\/restaurants-shops\/$/);
});

test("on a phone the two worlds are plain stacked links", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("");
  await expect(page.locator(".tw-section")).toHaveAttribute("data-scene", "static");
  await expect(page.locator(".tw-question p:not(.eyebrow)")).toBeHidden();
  const academic = page.locator(".tw-world-academic");
  const restaurants = page.locator(".tw-world-restaurants");
  await expect(academic).toHaveAttribute("href", "/website/portfolios-chercheurs/");
  await expect(restaurants).toHaveAttribute("href", "/website/restaurants-commerces/");
  const a = (await academic.boundingBox())!;
  const r = (await restaurants.boundingBox())!;
  expect(r.y).toBeGreaterThanOrEqual(a.y + a.height);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
  await academic.click();
  await expect(page).toHaveURL(/\/website\/portfolios-chercheurs\/$/);
});

test("footer links reach both specialised pages in the current language", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("en/");
  const footer = page.locator(".site-footer");
  await expect(footer.getByRole("link", { name: "Research portfolios" })).toHaveAttribute(
    "href",
    "/website/en/academic-portfolios/",
  );
  await footer.getByRole("link", { name: "Restaurants & shops" }).click();
  await expect(page).toHaveURL(/\/website\/en\/restaurants-shops\/$/);
});
