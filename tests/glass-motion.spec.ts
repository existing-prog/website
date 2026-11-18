import { test, expect } from "@playwright/test";

// Vérifier le cycle de vie réel du reflet : interaction, sortie et préférence système.
test("glass light follows a mouse and clears when motion is reduced", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("en/");
  const card = page.locator(".service-card").first();
  await card.scrollIntoViewIfNeeded();
  await card.hover();
  await expect
    .poll(() => card.evaluate((el) => el.style.getPropertyValue("--light-x")))
    .not.toBe("");
  await page.mouse.move(5, 20);
  await expect
    .poll(() => card.evaluate((el) => el.style.getPropertyValue("--light-x")))
    .toBe("");
  await card.hover();
  await expect
    .poll(() => card.evaluate((el) => el.style.getPropertyValue("--light-x")))
    .not.toBe("");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() => card.evaluate((el) => el.style.getPropertyValue("--light-x")))
    .toBe("");
  for (const selector of [".studio-glow", ".glass-halo span"]) {
    expect(
      await page
        .locator(selector)
        .evaluateAll((els) =>
          els.every((el) => getComputedStyle(el).animationName === "none"),
        ),
    ).toBe(true);
  }
});

test("touch input leaves glass effects at rest", async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto("en/");
  const card = page.locator(".service-card").first();
  await card.dispatchEvent("pointermove", {
    pointerType: "touch",
    clientX: 120,
    clientY: 200,
  });
  expect(await card.evaluate((el) => el.style.getPropertyValue("--light-x"))).toBe("");
  await context.close();
});
