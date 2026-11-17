import { test, expect } from "@playwright/test";

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`Nina fits ${width}px in both languages`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("en/projects/nina/");
    await expect(page.locator(".case-title")).toBeFocused();
    for (const language of ["Français", "English"]) {
      await page
        .locator("header")
        .getByRole("button", { name: language, exact: true })
        .click();
      await expect(page.locator(".nina-study")).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      ).toBeLessThanOrEqual(1);
    }
    await expect(page).toHaveTitle(/Nina Carducci/);
    await expect(page.locator(".nina-print")).toHaveCount(3);
    expect(
      await page
        .locator(".nina-study img")
        .evaluateAll((images) => images.every((image) => image.getAttribute("alt"))),
    ).toBe(true);
  });
}

test("Nina opens internally, survives reload and starts a website-care quote", async ({
  page,
}) => {
  await page.goto("en/");
  const link = page.locator("#chapter-nina .story-card");
  await expect(link).toHaveAttribute("href", "/website/en/projects/nina/");
  await expect(link).not.toHaveAttribute("target", "_blank");
  await link.click();
  await page.reload();
  await expect(page.locator(".case-title")).toBeFocused();
  await page.locator(".case-contact button").click();
  await expect(page.locator(".service-option.chosen strong")).toHaveText("Website care");
  await page.getByRole("button", { name: "Close project planner" }).click();
  await expect(page.locator(".case-contact button")).toBeFocused();
  await page.locator(".case-back").first().click();
  await expect(page.locator("#work .section-heading h2")).toBeInViewport();
  await expect(page.locator(".case-reading-progress")).toHaveCount(0);
});

test("photo prints assemble with native scroll and reverse", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("en/projects/nina/");
  await expect(page.locator(".nina-study")).toHaveAttribute("data-motion", "full");
  const print = page.locator(".nina-print").nth(1);
  const y = () =>
    print.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42);
  await expect.poll(y).toBeGreaterThan(100);
  await page.locator(".nina-contact-sheet").evaluate((el) =>
    scrollTo({
      top:
        el.getBoundingClientRect().top +
        scrollY +
        el.clientHeight / 2 -
        innerHeight * 0.45,
      behavior: "instant",
    }),
  );
  await page.mouse.move(20, 30);
  await expect.poll(y).toBeLessThan(1);
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.mouse.move(21, 30);
  await expect.poll(y).toBeGreaterThan(100);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".nina-study")).toHaveAttribute("data-motion", "light");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
});

test("reduced motion restores photos and preserves sourced audit results", async ({
  page,
}) => {
  await page.goto("en/projects/nina/");
  await expect(page.locator(".nina-study")).toHaveAttribute("data-motion", /full|light/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".nina-study")).not.toHaveAttribute(
    "data-motion",
    /full|light/,
  );
  await expect(page.locator(".case-reading-progress")).toBeHidden();
  await expect(page.locator(".nina-cover-window")).toHaveCSS("clip-path", "none");
  for (const print of await page.locator(".nina-print").all())
    await expect(print).toHaveCSS("transform", "none");
  await expect(page.locator(".nina-audit strong")).toHaveText([
    "94/100",
    "100/100",
    "100/100",
  ]);
  await expect(page.locator(".nina-results a")).toHaveAttribute(
    "href",
    "https://portfolio-swart-psi-26.vercel.app/projects/nina-carducci",
  );
});
