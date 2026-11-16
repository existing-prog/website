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
  const frame = () =>
    page.locator(".atelier-pizza-slice").getAttribute("data-bite-frame");
  expect(await frame()).toBe("0");
  for (const [index, progress] of [0, 0.44, 0.57, 0.7, 0.84, 1].entries()) {
    await page.locator(".atelier-unfold").evaluate(
      (el, p) =>
        scrollTo({
          top:
            el.getBoundingClientRect().top +
            scrollY -
            110 +
            (el.clientHeight - innerHeight + 110) * p,
          behavior: "instant",
        }),
      progress,
    );
    await page.mouse.move(20 + index, 30);
    await expect.poll(frame).toBe(String(index));
    if (index === 1)
      await expect(page.locator('.atelier-crumb-burst[data-burst="0"]')).toHaveCSS(
        "opacity",
        "1",
      );
    await expect(page.locator(`.atelier-slice-frame[data-frame="${index}"]`)).toHaveCSS(
      "visibility",
      "visible",
    );
    for (const other of [0, 1, 2, 3, 4, 5].filter((n) => n !== index))
      await expect(page.locator(`.atelier-slice-frame[data-frame="${other}"]`)).toHaveCSS(
        "visibility",
        "hidden",
      );
  }
  await expect(page.locator(".atelier-reveal-copy")).toHaveCSS("opacity", "1");
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.mouse.move(21, 30);
  await expect.poll(frame).toBe("0");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".atelier-study")).not.toHaveAttribute(
    "data-motion",
    /full|light/,
  );
  await expect(page.locator(".atelier-reveal-copy")).toHaveCSS("visibility", "visible");
  for (const crumbs of await page.locator(".atelier-crumb-burst").all())
    await expect(crumbs).toHaveCSS("opacity", "0");
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
    .getByRole("button", {
      name: "Let’s talk about your restaurant website",
      exact: true,
    })
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

test("guided captures compare three real updates and keep their state when translated", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("#project/atelier-pizza");
  const demo = page.locator(".atelier-guided-demo");
  for (const [id, label, result] of [
    ["price", "Change a price", "€10.50"],
    ["visibility", "Hide a pizza", "La Reine is hidden"],
    ["closure", "Announce a closure", "closure announcement appears"],
  ]) {
    await demo.getByRole("button", { name: new RegExp(label) }).click();
    await expect(demo).toHaveAttribute("data-action", id);
    await expect(demo).toHaveAttribute("data-state", "before");
    await demo.getByRole("button", { name: "See the saved result", exact: true }).click();
    await expect(demo).toHaveAttribute("data-state", "after");
    await expect(demo.locator(".atelier-demo-result")).toContainText(result);
    await expect(demo.locator(".atelier-capture-link[data-active=true]")).toHaveCount(2);
    await expect
      .poll(() =>
        demo
          .locator(".atelier-capture-link[data-active=true] img")
          .evaluateAll((images) =>
            images.every((image) => (image as HTMLImageElement).naturalWidth > 0),
          ),
      )
      .toBe(true);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
  }
  await page
    .locator("header")
    .getByRole("button", { name: "Français", exact: true })
    .click();
  await expect(demo).toHaveAttribute("data-state", "after");
  await expect(demo.locator(".atelier-demo-result")).toContainText(
    "L’annonce de fermeture",
  );
  await demo.getByRole("button", { name: "Rejouer cet exemple", exact: true }).click();
  await expect(demo).toHaveAttribute("data-state", "before");
  await expect(
    page.getByRole("button", {
      name: "Parlons du site de votre restaurant",
      exact: true,
    }),
  ).toBeVisible();
});

test("editorial titles and capture reveal follow scroll and clean up in reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("#project/atelier-pizza");
  await expect(page.locator(".atelier-study")).toHaveAttribute("data-motion", "full");
  const word = page.locator(".atelier-web h2 .case-word").first();
  const offset = () =>
    word.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42);
  expect(await offset()).toBeGreaterThan(1);
  await page
    .locator(".atelier-web h2")
    .evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await page.mouse.move(20, 30);
  await expect.poll(offset).toBeLessThan(1);
  await page.locator(".atelier-site-viewport").evaluate((el) =>
    scrollTo({
      top: el.getBoundingClientRect().top + scrollY - innerHeight * 0.2,
      behavior: "instant",
    }),
  );
  await page.mouse.move(21, 30);
  await expect
    .poll(() =>
      page
        .locator(".atelier-site-viewport")
        .evaluate((el) =>
          parseFloat(getComputedStyle(el).clipPath.replace("inset(", "")),
        ),
    )
    .toBeLessThan(0.1);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".atelier-site-viewport")).toHaveCSS("clip-path", "none");
  await expect(page.locator(".atelier-site-viewport img")).toHaveCSS("transform", "none");
  await expect(word).toHaveCSS("transform", "none");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator(".atelier-study")).toHaveAttribute("data-motion", "light");
  await expect(page.locator(".atelier-site-viewport")).toHaveCSS("clip-path", "none");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
});
