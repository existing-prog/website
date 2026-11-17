import { test, expect } from "@playwright/test";

test("project selection changes the artwork with its image without replacing the floating card", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("en/");
  const card = await page.locator(".showcase-window").elementHandle();
  for (const [id, name, image] of [
    ["kasa", "Kasa", "kasa.webp"],
    ["nina", "Nina Carducci", "nina.webp"],
    ["samantha", "Samantha Ramsey", "samantha-current.webp"],
  ]) {
    await page.getByRole("button", { name: `Preview ${name}`, exact: true }).click();
    await expect(page.locator(".hero-project-backdrop")).toHaveAttribute(
      "data-project",
      id,
    );
    await expect(page.locator(".hero-project-backdrop")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    await expect(page.locator(`.backdrop-${id}`)).toHaveCSS("opacity", "1");
    await expect(page.locator(".showcase-image img")).toHaveAttribute(
      "src",
      new RegExp(image + "$"),
    );
    expect(
      await card!.evaluate((el) => el === document.querySelector(".showcase-window")),
    ).toBe(true);
    for (const other of ["samantha", "kasa", "nina"].filter((p) => p !== id))
      await expect(page.locator(`.backdrop-${other}`)).toHaveCSS("opacity", "0");
  }
});

test("mobile project scenery changes without motion when reduced motion is requested", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("en/");
  await page.getByRole("button", { name: "Preview Kasa", exact: true }).click();
  await expect(page.locator(".backdrop-kasa")).toHaveCSS("opacity", "1");
  await expect(page.locator(".backdrop-samantha")).toHaveCSS("opacity", "0");
  await expect(page.locator(".hero-scene").first()).toHaveCSS(
    "transition-duration",
    "0s",
  );
  await expect(page.locator(".showcase-image img")).toHaveCSS("animation-name", "none");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
});
