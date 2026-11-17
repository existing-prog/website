import { test, expect } from "@playwright/test";

test("case choreography follows native scroll and reverses its reading progress", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("en/projects/samantha/");
  const study = page.locator(".case-study");
  await expect(study).toHaveAttribute("data-motion", "full");
  await expect(
    page.getByRole("heading", { level: 1, name: "Research takes on a new dimension." }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.locator(".case-hero-art").evaluate((el) => {
    scrollTo({
      top: el.getBoundingClientRect().top + scrollY - innerHeight * 0.15,
      behavior: "instant",
    });
  });
  await page.mouse.move(8, 200);
  const progress = page.locator(".case-reading-progress span");
  await expect
    .poll(() =>
      progress.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).a),
    )
    .toBeGreaterThan(0.01);
  const advanced = await progress.evaluate(
    (el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).a,
  );
  await expect
    .poll(() =>
      page
        .locator(".case-hero-viewport")
        .evaluate((el) =>
          parseFloat(getComputedStyle(el).clipPath.replace("inset(", "")),
        ),
    )
    .toBeLessThan(0.1);
  await expect(page.locator(".case-design .case-section-heading")).toHaveCSS(
    "position",
    "sticky",
  );
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.mouse.move(9, 200);
  await expect
    .poll(() =>
      progress.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).a),
    )
    .toBeLessThan(advanced);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(study).toHaveAttribute("data-motion", "light");
  await expect(page.locator(".case-design .case-section-heading")).not.toHaveCSS(
    "position",
    "sticky",
  );
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
  const play = page.getByRole("button", { name: "Play the demonstration", exact: true });
  await play.scrollIntoViewIfNeeded();
  await page.mouse.move(10, 200);
  await expect(page.locator(".case-demo-media")).toHaveCSS("opacity", "1");
  await play.click();
  await expect
    .poll(() =>
      page.locator(".case-demo video").evaluate((el: HTMLVideoElement) => el.currentTime),
    )
    .toBeGreaterThan(0.1);
});

test("reduced motion restores every title and frame and route exit removes progress", async ({
  page,
}) => {
  await page.goto("en/projects/samantha/");
  await expect(page.locator(".case-study")).toHaveAttribute("data-motion", /full|light/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".case-reading-progress")).toBeHidden();
  await expect(page.locator(".case-study")).not.toHaveAttribute(
    "data-motion",
    /full|light/,
  );
  expect(
    await page
      .locator(".case-word")
      .evaluateAll((els) => els.every((el) => getComputedStyle(el).transform === "none")),
  ).toBe(true);
  await expect(page.locator(".case-hero-viewport")).toHaveCSS("clip-path", "none");
  await expect(page.locator(".case-hero-image")).toHaveCSS("transform", "none");
  await page.locator(".case-back").first().click();
  await expect(page.locator(".case-reading-progress")).toHaveCount(0);
  await expect(page.locator("#work .section-heading h2")).toBeInViewport();
});
