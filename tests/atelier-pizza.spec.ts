import { test, expect } from "@playwright/test";
for (const width of [320, 390, 768, 1024, 1440]) {
  test(`Atelier Pizza fits ${width}px in FR and ENG`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("#project/atelier-pizza");
    await expect(page.locator(".case-title")).toBeFocused();
    for (const language of ["Français", "English"]) {
      await page
        .locator("header")
        .getByRole("button", { name: language, exact: true })
        .click();
      await expect(page.locator(".atelier-study")).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      ).toBeLessThanOrEqual(1);
    }
    await expect(page).toHaveTitle(/Atelier Pizza/);
  });
}
test("the pizza slice is eaten with native scroll and comes back on reverse", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("#project/atelier-pizza");
  await expect(page.locator(".atelier-study")).toHaveAttribute("data-motion", "full");
  const radius = () =>
    page.locator(".bite-three").evaluate((el) => Number(el.getAttribute("r")));
  expect(await radius()).toBe(0);
  await page.locator(".atelier-unfold").evaluate((el) =>
    scrollTo({
      top: el.getBoundingClientRect().top + scrollY + el.clientHeight - innerHeight,
      behavior: "instant",
    }),
  );
  await page.mouse.move(20, 30);
  await expect.poll(radius).toBeGreaterThan(280);
  await expect(page.locator(".atelier-reveal-copy")).toHaveCSS("opacity", "1");
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.mouse.move(21, 30);
  await expect.poll(radius).toBeLessThan(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".atelier-study")).not.toHaveAttribute(
    "data-motion",
    /full|light/,
  );
  await expect(page.locator(".atelier-reveal-copy")).toHaveCSS("visibility", "visible");
  await expect(page.locator(".atelier-pizza-stage")).not.toHaveCSS("position", "sticky");
});
test("personal project opens internally, video is click-to-load, and quote selects business website", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const videos: string[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith("atelier-wordpress-demo.mp4")) videos.push(r.url());
  });
  await page.goto("");
  await page.locator(".atelier-project-teaser").click();
  await expect(page.locator(".case-title")).toBeFocused();
  expect(videos).toHaveLength(0);
  await page.getByRole("button", { name: "Play the demonstration", exact: true }).click();
  await expect
    .poll(() =>
      page
        .locator(".atelier-demo-media video")
        .evaluate((el: HTMLVideoElement) => el.currentTime),
    )
    .toBeGreaterThan(0.1);
  expect(videos.length).toBeGreaterThan(0);
  await page
    .locator(".atelier-demo-media video")
    .evaluate((el: HTMLVideoElement) => el.pause());
  await page
    .getByRole("button", { name: "Discuss an editable website", exact: true })
    .click();
  await expect(page.locator(".service-option.chosen strong")).toHaveText(
    "Business website",
  );
  await page.getByRole("button", { name: "Close project planner" }).click();
  await page.reload();
  await expect(page.locator(".atelier-study")).toBeVisible();
  await page.locator(".case-back").first().click();
  await expect(page.locator("#work .section-heading h2")).toBeInViewport();
});
