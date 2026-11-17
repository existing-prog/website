import { test, expect } from "@playwright/test";

for (const width of [320, 390, 768, 1440]) {
  test(`integrated Samantha study fits ${width}px in both languages`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("en/projects/samantha/");
    await expect(page.locator(".case-title")).toContainText("Research takes on a new");
    for (const language of ["Français", "English"]) {
      await page
        .locator("header")
        .getByRole("button", { name: language, exact: true })
        .click();
      await expect(page.locator(".case-study")).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      ).toBeLessThanOrEqual(1);
      await expect(page.locator(".case-demo video")).toHaveAttribute("preload", "none");
      await expect(page.locator(".case-demo video")).not.toHaveAttribute("autoplay");
    }
    await expect(page).toHaveTitle(/Samantha Ramsey/);
    await page.locator(".case-back").first().click();
    await expect(page.locator(".case-study")).toHaveCount(0);
    await expect(page.locator("#work .section-heading h2")).toBeInViewport();
  });
}

test("Samantha opens internally, the portfolio CTA selects the right service, and navigation survives reload", async ({
  page,
}) => {
  await page.goto("en/");
  const project = page.locator("#chapter-samantha .story-card");
  await expect(project).toHaveAttribute("href", "/website/en/projects/samantha/");
  await expect(project).not.toHaveAttribute("target", "_blank");
  await project.click();
  await expect(page.locator(".case-title")).toBeFocused();
  await page.reload();
  await expect(page.locator(".case-title")).toBeVisible();
  await page
    .getByRole("button", { name: "Start a portfolio project", exact: true })
    .click();
  await expect(page.locator(".service-option.chosen strong")).toHaveText("Portfolio");
  await page.getByRole("button", { name: "Close project planner" }).click();
  await expect(
    page.getByRole("button", { name: "Start a portfolio project", exact: true }),
  ).toBeFocused();
  // Sans brouillon, le bureau n’est plus dans le menu, mais son URL reste accessible.
  await expect(page.locator("header a.desk-link")).toHaveCount(0);
  await page.goto("en/desk/");
  await expect(page.locator(".empty-desk")).toBeVisible();
  await page.locator("header a[href='/website/en/#work']").click();
  await expect(page.locator("#work .section-heading h2")).toBeInViewport();
});

test("recorded demonstration plays locally on demand with reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const requested: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith(".mp4")) requested.push(request.url());
  });
  await page.goto("en/projects/samantha/");
  const video = page.locator(".case-demo video");
  await expect(page.locator(".case-title")).toBeVisible();
  expect(requested).toHaveLength(0);
  await expect(page.locator(".case-hero-image")).toHaveCSS("transform", "none");
  await video.scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Play the demonstration", exact: true }).click();
  await expect
    .poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime))
    .toBeGreaterThan(0.1);
  expect(requested.length).toBeGreaterThan(0);
  expect(requested.every((url) => url.startsWith("http://127.0.0.1:"))).toBe(true);
  await video.evaluate((element: HTMLVideoElement) => element.pause());
  expect(await video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(true);
});
