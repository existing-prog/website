import { test, expect } from "@playwright/test";

/** Requêtes du fond 3D de l’accueil (chunk de la scène ou Three.js lui-même). */
const isWorldRequest = (url: string) =>
  /worldScene|three\.module|\/deps\/three/.test(url);

test("reduced motion never downloads the 3D backdrop", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const requests: string[] = [];
  page.on("request", (request) => {
    if (isWorldRequest(request.url())) requests.push(request.url());
  });
  await page.goto("");
  await expect(page.locator("h1")).toBeVisible();
  await page.waitForTimeout(2500);
  expect(requests).toEqual([]);
  await expect(page.locator("html")).not.toHaveClass(/has-world/);
  await expect(page.locator(".world-canvas")).toBeHidden();
});

test("with motion, the backdrop loads after the page and stays out of the way", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("");
  await expect(page.locator("h1")).toBeVisible();
  // Chargé au repos ; sans WebGL, le site reste simplement tel quel.
  const webgl = await page.evaluate(
    () => !!document.createElement("canvas").getContext("webgl2"),
  );
  test.skip(!webgl, "WebGL unavailable in this browser");
  await expect(page.locator("html")).toHaveClass(/has-world/, { timeout: 10_000 });
  const canvas = page.locator(".world-canvas");
  await expect(canvas).toHaveAttribute("aria-hidden", "true");
  expect(await canvas.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe("none");
  // Les liens restent cliquables par-dessus le canvas.
  await page.locator("#services").scrollIntoViewIfNeeded();
  await expect(page.locator("#services a, #services button").first()).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
});

test("case-study pages do not load the 3D backdrop", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const requests: string[] = [];
  page.on("request", (request) => {
    if (/worldScene/.test(request.url())) requests.push(request.url());
  });
  await page.goto("projets/kasa/");
  await expect(page.locator("h1")).toBeVisible();
  await page.waitForTimeout(2500);
  expect(requests).toEqual([]);
  await expect(page.locator(".world-canvas")).toHaveCount(0);
});
