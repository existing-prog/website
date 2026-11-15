import { test, expect } from "@playwright/test";
for (const viewport of [
  { width: 1860, height: 919 },
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 390, height: 844 },
  { width: 320, height: 700 },
]) {
  test(`FR and ENG share the same first-screen layout at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("");
    await page.evaluate(() => document.fonts.ready);
    const layouts = [];
    for (const name of ["English", "Français"]) {
      await page
        .locator("header")
        .getByRole("button", { name, exact: true })
        .click();
      const layout = await page.evaluate(() => {
        const hero = document.querySelector(".hero")!.getBoundingClientRect();
        const heading = document.querySelector(".hero-copy h1")!;
        const lines = [...document.querySelectorAll<HTMLElement>(".hero-line")];
        return {
          heroHeight: hero.height,
          nextTop: document.querySelector("#work")!.getBoundingClientRect().top,
          headingHeight: heading.getBoundingClientRect().height,
          font: getComputedStyle(heading).fontSize,
          lineHeights: lines.map((e) => e.getBoundingClientRect().height),
          lineOverflow: lines.map((e) => e.scrollWidth - e.clientWidth),
          overflow: document.documentElement.scrollWidth - innerWidth,
        };
      });
      expect(layout.nextTop).toBeGreaterThanOrEqual(viewport.height - 1);
      expect(layout.overflow).toBeLessThanOrEqual(1);
      expect(layout.lineHeights).toHaveLength(3);
      for (const overflow of layout.lineOverflow)
        expect(overflow).toBeLessThanOrEqual(1);
      layouts.push(layout);
    }
    expect(
      Math.abs(layouts[0].heroHeight - layouts[1].heroHeight),
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(layouts[0].headingHeight - layouts[1].headingHeight),
    ).toBeLessThanOrEqual(1);
    expect(layouts[0].font).toBe(layouts[1].font);
  });
}
for (const width of [1475, 1024, 768, 390]) {
  test(`closing ornament never overlaps the heading at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("");
    await page.evaluate(() => document.fonts.ready);
    for (const name of ["Français", "English"]) {
      await page
        .locator("header")
        .getByRole("button", { name, exact: true })
        .click();
      const star = page.locator(".closing-heading > .star-mark");
      if (width <= 760) await expect(star).toBeHidden();
      else {
        const a = await page.locator(".closing-heading h2").boundingBox();
        const b = await star.boundingBox();
        expect(b!.x).toBeGreaterThanOrEqual(a!.x + a!.width + 20);
      }
    }
  });
}
