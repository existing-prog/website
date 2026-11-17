import { test, expect, type Page } from "@playwright/test";

/** Faire défiler la piste de la scène jusqu’à une progression (0 → 1). */
async function scrollScene(page: Page, progress: number) {
  await page.locator(".atelier-bite").evaluate((scene, value) => {
    const track = scene.querySelector<HTMLElement>(".atelier-bite-track")!;
    const stage = scene.querySelector<HTMLElement>(".atelier-bite-stage")!;
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
            .locator(".atelier-bite")
            .evaluate((el) => getComputedStyle(el).getPropertyValue("--bite-progress")),
        ) - progress,
      ),
    )
    .toBeLessThan(0.01);
}
const opacity = (page: Page, selector: string) =>
  page.locator(selector).evaluate((el) => Number(getComputedStyle(el).opacity));
const wordOffset = (page: Page) =>
  page
    .locator(".atelier-bite-copy h2 .case-word")
    .last()
    .evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42);

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`Atelier Pizza fits ${width}px in FR and ENG`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("en/projects/atelier-pizza/");
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

test("bite scene follows the first scroll, reveals the price and text, then reverses", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("en/projects/atelier-pizza/");
  const scene = page.locator(".atelier-bite");
  await expect(scene).toHaveAttribute("data-scene", "animated");
  await expect(page.locator(".atelier-bite-stage")).toHaveCSS("position", "sticky");
  // Avant le défilement : pizza entière, titre masqué, étiquette invisible.
  await expect(scene).toHaveAttribute("data-bite", "0");
  expect(await wordOffset(page)).toBeGreaterThan(1);
  expect(await opacity(page, ".atelier-price-tag")).toBeLessThan(0.05);
  await scrollScene(page, 0.2);
  await expect(scene).toHaveAttribute("data-phase", "lift");
  await scrollScene(page, 0.6);
  await expect(scene).toHaveAttribute("data-phase", "bite");
  await expect(scene).toHaveAttribute("data-bite", "3");
  // Trois bouchées : les trois premiers masques ont un rayon, pas les suivants.
  await expect
    .poll(() =>
      page
        .locator(".atelier-bite-mark > circle:first-child")
        .evaluateAll((circles) => circles.map((c) => Number(c.getAttribute("r")) > 1)),
    )
    .toEqual([true, true, true, false, false]);
  await scrollScene(page, 1);
  await expect(scene).toHaveAttribute("data-phase", "reveal");
  await expect(scene).toHaveAttribute("data-bite", "5");
  await expect.poll(() => opacity(page, ".atelier-price-tag")).toBeGreaterThan(0.95);
  await expect.poll(() => wordOffset(page)).toBeLessThan(1);
  await expect.poll(() => opacity(page, ".atelier-bite-text")).toBeGreaterThan(0.95);
  await expect(page.locator(".atelier-price-new")).toHaveText("€10.50");
  // Le défilement inverse rejoue la scène à l’envers.
  await scrollScene(page, 0);
  await expect(scene).toHaveAttribute("data-bite", "0");
  await expect.poll(() => opacity(page, ".atelier-price-tag")).toBeLessThan(0.05);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
});

test("reduced motion and short screens show the final scene without a scroll track", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("en/projects/atelier-pizza/");
  const scene = page.locator(".atelier-bite");
  await expect(scene).toHaveAttribute("data-scene", "static");
  await expect(page.locator(".atelier-bite-stage")).not.toHaveCSS("position", "sticky");
  await expect(page.locator(".atelier-bite-slice")).toBeHidden();
  await expect(page.locator(".atelier-price-tag")).toBeVisible();
  await expect(page.locator(".atelier-bite-copy h2")).toHaveAccessibleName(
    "Your menu. In your hands.",
  );
  expect(await wordOffset(page)).toBeLessThan(1);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(scene).toHaveAttribute("data-scene", "animated");
  // Téléphone en paysage : trop bas pour une scène collante.
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(scene).toHaveAttribute("data-scene", "static");
  await expect(page.locator(".atelier-price-tag")).toBeVisible();
  expect(await opacity(page, ".atelier-bite-text")).toBe(1);
});

for (const width of [320, 390, 768]) {
  test(`bite scene fits a ${width}px phone, keeps its state when translated`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("en/projects/atelier-pizza/");
    await expect(page.locator(".atelier-bite")).toHaveAttribute("data-scene", "animated");
    for (const progress of [0.3, 0.7, 1]) await scrollScene(page, progress);
    await expect.poll(() => wordOffset(page)).toBeLessThan(1);
    const language = page
      .locator("header")
      .getByRole("button", { name: "Français", exact: true });
    await language.evaluate((button) => button.focus({ preventScroll: true }));
    await language.click();
    await expect(page.locator(".atelier-bite-copy h2")).toHaveAccessibleName(
      "Votre carte. Entre vos mains.",
    );
    await scrollScene(page, 1);
    await expect(page.locator(".atelier-bite")).toHaveAttribute("data-bite", "5");
    await expect.poll(() => opacity(page, ".atelier-price-tag")).toBeGreaterThan(0.95);
    const boxes = await page.evaluate(() => ({
      visual: document.querySelector(".atelier-bite-visual")!.getBoundingClientRect(),
      link: document.querySelector(".atelier-bite-link")!.getBoundingClientRect(),
      stage: document.querySelector(".atelier-bite-stage")!.getBoundingClientRect(),
      overflow: document.documentElement.scrollWidth - innerWidth,
    }));
    expect(boxes.overflow).toBeLessThanOrEqual(1);
    expect(boxes.link.bottom).toBeLessThanOrEqual(boxes.stage.bottom);
    expect(boxes.link.top).toBeGreaterThanOrEqual(boxes.visual.bottom);
  });
}

test("the editing demo comes right after the scene and its shortcut reaches it", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("en/projects/atelier-pizza/");
  await expect(page.locator(".atelier-study .case-contact")).toBeAttached();
  const order = await page
    .locator(".atelier-study > section")
    .evaluateAll((sections) => sections.map((s) => s.classList[0]));
  const position = (name: string) => order.indexOf(name);
  expect(position("atelier-bite")).toBeGreaterThan(position("case-hero"));
  expect(position("atelier-editing")).toBe(position("atelier-bite") + 1);
  expect(position("atelier-web")).toBeGreaterThan(position("atelier-editing"));
  await page.getByRole("link", { name: "See how it works" }).click();
  await expect(page.locator("#atelier-editing h2")).toBeInViewport();
});

test("personal project opens internally, video is click-to-load, and quote selects business website", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const videos: string[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith("atelier-wordpress-demo.mp4")) videos.push(r.url());
  });
  await page.goto("en/");
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
  await page.goto("en/projects/atelier-pizza/");
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
  await page.goto("en/projects/atelier-pizza/");
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
