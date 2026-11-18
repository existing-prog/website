import { test, expect, type Page } from "@playwright/test";

async function scrollScene(page: Page, progress: number) {
  await page.locator(".ac-scene").evaluate((scene, value) => {
    const track = scene.querySelector<HTMLElement>(".ac-track")!;
    const stage = scene.querySelector<HTMLElement>(".ac-stage")!;
    const start = track.getBoundingClientRect().top + scrollY;
    scrollTo({
      top: start + (track.offsetHeight - stage.offsetHeight) * value,
      behavior: "instant",
    });
  }, progress);
  await expect
    .poll(async () =>
      Math.abs(
        Number(
          await page
            .locator(".ac-scene")
            .evaluate((el) => getComputedStyle(el).getPropertyValue("--ac-progress")),
        ) - progress,
      ),
    )
    .toBeLessThan(0.01);
}
const opacity = (page: Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((el) => Number(getComputedStyle(el).opacity));

test("academic page has its own prerendered URL in both languages", async ({
  request,
}) => {
  const fr = await (await request.get("portfolios-chercheurs/")).text();
  expect(fr).toContain('<html lang="fr"');
  expect(fr).toContain("Vos recherches méritent");
  expect(fr).toContain(
    'hreflang="en" href="https://existing-prog.github.io/website/en/academic-portfolios/"',
  );
  const en = await (await request.get("en/academic-portfolios/")).text();
  expect(en).toContain("<title>Portfolio websites for researchers — Lucas Berdy</title>");
  expect(en).toContain("And becomes your portfolio.");
  const sitemap = await (await request.get("sitemap.xml")).text();
  expect(sitemap).toContain("/website/en/academic-portfolios/</loc>");
});

test("paper scene turns an article into a website, forward and backward", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("en/academic-portfolios/");
  const scene = page.locator(".ac-scene");
  await expect(scene).toHaveAttribute("data-scene", "animated");
  await expect(page.locator(".ac-stage")).toHaveCSS("position", "sticky");
  await scrollScene(page, 0.02);
  await expect(scene).toHaveAttribute("data-phase", "paper");
  expect(await opacity(page, ".ac-head .ac-paper")).toBe(1);
  expect(await opacity(page, ".ac-head .ac-site")).toBe(0);
  await scrollScene(page, 0.43);
  await expect(scene).toHaveAttribute("data-phase", "alive");
  await expect.poll(() => opacity(page, ".ac-word")).toBeLessThan(0.05);
  await expect.poll(() => opacity(page, ".ac-figure .ac-site")).toBeGreaterThan(0.95);
  await scrollScene(page, 1);
  await expect(scene).toHaveAttribute("data-phase", "site");
  await expect.poll(() => opacity(page, ".ac-head .ac-site")).toBeGreaterThan(0.95);
  await expect.poll(() => opacity(page, ".ac-card:last-child")).toBeGreaterThan(0.95);
  await expect.poll(() => opacity(page, ".ac-chrome")).toBeGreaterThan(0.95);
  await expect.poll(() => opacity(page, ".ac-beat:last-child")).toBeGreaterThan(0.95);
  await scrollScene(page, 0.02);
  await expect.poll(() => opacity(page, ".ac-head .ac-paper")).toBeGreaterThan(0.95);
  await expect.poll(() => opacity(page, ".ac-word")).toBeGreaterThan(0.95);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
});

test("reduced motion shows the finished website and every caption", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("en/academic-portfolios/");
  await expect(page.locator(".ac-scene")).toHaveAttribute("data-scene", "static");
  await expect(page.locator(".ac-stage")).not.toHaveCSS("position", "sticky");
  await expect(page.locator(".ac-head .ac-paper")).toBeHidden();
  await expect(page.locator(".ac-card")).toHaveCount(3);
  for (const beat of await page.locator(".ac-beat").all())
    await expect(beat).toBeVisible();
});

for (const width of [320, 390, 768]) {
  test(`paper scene fits a ${width}px phone`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("portfolios-chercheurs/");
    await expect(page.locator(".ac-scene")).toHaveAttribute("data-scene", "animated");
    for (const progress of [0.3, 0.6, 1]) await scrollScene(page, progress);
    await expect.poll(() => opacity(page, ".ac-beat:last-child")).toBeGreaterThan(0.95);
    const boxes = await page.evaluate(() => ({
      sheet: document.querySelector(".ac-sheet")!.getBoundingClientRect(),
      beat: document.querySelector(".ac-beat:last-child")!.getBoundingClientRect(),
      overflow: document.documentElement.scrollWidth - innerWidth,
    }));
    expect(boxes.overflow).toBeLessThanOrEqual(1);
    expect(boxes.beat.top).toBeGreaterThanOrEqual(boxes.sheet.bottom);
    expect(boxes.beat.bottom).toBeLessThanOrEqual(844);
  });
}

test("calls to action open the planner with a portfolio selected", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("en/academic-portfolios/");
  await expect(page.locator("#academic-title")).toBeFocused();
  await page.getByRole("button", { name: "Get a quote" }).click();
  await expect(page.locator(".service-option.chosen strong")).toHaveText("Portfolio");
  await page.getByRole("button", { name: "Close project planner" }).click();
  await page.getByRole("link", { name: "Read the case study" }).first().click();
  await expect(page).toHaveURL(/\/website\/en\/projects\/samantha\/$/);
});

for (const width of [320, 390, 1440]) {
  test(`no text of the finished mock website is cut off at ${width}px`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width, height: 900 });
    await page.goto("en/academic-portfolios/");
    await page.evaluate(() => document.fonts.ready);
    const overflow = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>(".ac-block")].map((block) => {
        const box = block.getBoundingClientRect();
        const bottom = Math.max(
          ...[...block.querySelectorAll(".ac-site *")].map(
            (e) => e.getBoundingClientRect().bottom,
          ),
        );
        return Math.round(bottom - box.bottom);
      }),
    );
    for (const value of overflow) expect(value).toBeLessThanOrEqual(0);
  });
}

for (const width of [320, 390, 1440]) {
  test(`no text of the paper is cut off before the scroll at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("en/academic-portfolios/");
    await expect(page.locator(".ac-scene")).toHaveAttribute("data-scene", "animated");
    await page.evaluate(() => document.fonts.ready);
    await scrollScene(page, 0);
    const overflow = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>(".ac-block")].map((block) => {
        const box = block.getBoundingClientRect();
        const bottom = Math.max(
          ...[...block.querySelectorAll(".ac-paper > *")].map(
            (e) => e.getBoundingClientRect().bottom,
          ),
        );
        return Math.round(bottom - box.bottom);
      }),
    );
    for (const value of overflow) expect(value).toBeLessThanOrEqual(0);
  });
}
