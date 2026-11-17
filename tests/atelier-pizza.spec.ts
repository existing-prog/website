import { test, expect, type Page } from "@playwright/test";

/** Même distance que le sticky CSS, sans déclencher artificiellement la vidéo. */
async function scrollFilm(page: Page, progress: number) {
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  await page.locator(".atelier-unfold").evaluate((section, value) => {
    const wide = matchMedia("(min-width: 1024px) and (min-height: 700px)").matches;
    const track = section.querySelector<HTMLElement>(".atelier-pizza-track")!;
    const visual = section.querySelector<HTMLElement>(".atelier-pizza-visual")!;
    const start =
      (wide ? section : track).getBoundingClientRect().top + scrollY - (wide ? 110 : 80);
    const distance = wide
      ? (section as HTMLElement).offsetHeight - innerHeight + 110
      : track.offsetHeight - visual.offsetHeight;
    scrollTo({ top: start + distance * value, behavior: "instant" });
  }, progress);
  await page.mouse.move(20 + progress * 10, 30);
  await expect
    .poll(async () =>
      Math.abs(
        Number(await page.locator(".atelier-unfold").getAttribute("data-film-progress")) -
          progress,
      ),
    )
    .toBeLessThan(0.005);
  await expect
    .poll(() =>
      page
        .locator(".atelier-pizza-film")
        .evaluate(
          (video: HTMLVideoElement, value) =>
            Math.abs(video.currentTime - (video.duration - 1 / 30) * value),
          progress,
        ),
    )
    .toBeLessThan(0.09);
}

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
test("the Blender film follows the first scroll, completes and reverses without autoplay", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("#project/atelier-pizza");
  await expect(page.locator(".atelier-unfold")).toHaveAttribute(
    "data-film-mode",
    "scroll",
  );
  // Le tout premier geste doit déjà changer l’image, même après un chargement lent.
  for (const progress of [0.25, 0.55, 1, 0]) await scrollFilm(page, progress);
  await expect(page.locator(".atelier-pizza-film")).toHaveJSProperty("paused", true);
  await scrollFilm(page, 1);
  await expect(page.locator(".atelier-reveal-copy")).toHaveCSS("opacity", "1");
  await page.setViewportSize({ width: 1280, height: 650 });
  await expect(page.locator(".atelier-unfold")).toHaveAttribute(
    "data-film-mode",
    "static",
  );
  await expect(page.locator(".atelier-pizza-film")).not.toHaveAttribute("src");
  await expect(page.locator(".atelier-reveal-copy")).toHaveCSS("opacity", "1");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await scrollFilm(page, 0.5);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".atelier-unfold")).toHaveAttribute(
    "data-film-mode",
    "static",
  );
  await expect(page.locator(".atelier-film-static")).toBeVisible();
  await expect(page.locator(".atelier-pizza-film")).not.toHaveAttribute("src");
  await expect(page.locator(".atelier-pizza-stage")).not.toHaveCSS("position", "sticky");
  await expect(page.locator(".atelier-reveal-copy")).toHaveCSS("opacity", "1");
});

test("reduced motion never downloads the decorative film", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const movies: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("pizza-scroll-v1.mp4")) movies.push(request.url());
  });
  await page.goto("#project/atelier-pizza");
  await page.locator(".atelier-reveal-copy").scrollIntoViewIfNeeded();
  await expect(page.locator(".atelier-film-static")).toBeVisible();
  await expect(page.locator(".atelier-pizza-film")).not.toHaveAttribute("src");
  expect(movies).toHaveLength(0);
});

test("a failed film leaves a static image, readable copy and no long scroll track", async ({
  page,
}) => {
  await page.route("**/atelier-film/pizza-scroll-v1.mp4", (route) => route.abort());
  await page.goto("#project/atelier-pizza");
  await expect(page.locator(".atelier-unfold")).toHaveAttribute(
    "data-film-mode",
    "fallback",
  );
  await expect(page.locator(".atelier-film-static")).toBeVisible();
  await expect(page.locator(".atelier-pizza-film")).toBeHidden();
  await expect(page.locator(".atelier-reveal-copy")).toHaveCSS("opacity", "1");
  await expect(page.locator(".atelier-pizza-stage")).not.toHaveCSS("position", "sticky");
  await page.locator(".case-back").first().click();
  await expect(page.locator("#work .section-heading h2")).toBeInViewport();
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

for (const width of [320, 390]) {
  test(`mobile film follows scroll at ${width}px, translates and releases above the copy`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("#project/atelier-pizza");
    await expect(page.locator(".atelier-unfold")).toHaveAttribute(
      "data-film-mode",
      "scroll",
    );
    for (const progress of [0.25, 0.6, 1, 0, 1]) await scrollFilm(page, progress);
    const language = page
      .locator("header")
      .getByRole("button", { name: "Français", exact: true });
    // Afficher le header masqué sans provoquer le scroll automatique d’un clic
    // Playwright sur un élément situé hors écran.
    await language.evaluate((button) => button.focus({ preventScroll: true }));
    await expect
      .poll(() => language.evaluate((button) => button.getBoundingClientRect().top))
      .toBeGreaterThanOrEqual(0);
    await page
      .locator(".atelier-pizza-film")
      .evaluate((video) =>
        video.addEventListener(
          "emptied",
          () => video.setAttribute("data-reloaded", "true"),
          { once: true },
        ),
      );
    await language.click();
    await expect(page.locator(".atelier-pizza-film")).not.toHaveAttribute(
      "data-reloaded",
      "true",
    );
    await scrollFilm(page, 1);
    await expect
      .poll(() =>
        page
          .locator(".atelier-pizza-film")
          .evaluate((v: HTMLVideoElement) => v.currentTime),
      )
      .toBeGreaterThan(5.8);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
    const boxes = await page.evaluate(() => ({
      film: document.querySelector(".atelier-pizza-visual")!.getBoundingClientRect()
        .bottom,
      copy: document.querySelector(".atelier-reveal-copy")!.getBoundingClientRect().top,
    }));
    expect(boxes.film).toBeLessThan(boxes.copy);
    await page.setViewportSize({ width, height: 740 });
    await scrollFilm(page, 0.5);
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(page.locator(".atelier-unfold")).toHaveAttribute(
      "data-film-mode",
      "static",
    );
    await expect(page.locator(".atelier-pizza-visual")).not.toHaveCSS(
      "position",
      "sticky",
    );
    await expect(page.locator(".atelier-film-static")).toBeVisible();
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator(".atelier-reveal-copy")).toHaveCSS("opacity", "1");
    await expect(page.locator(".atelier-pizza-film")).not.toHaveAttribute("src");
  });
}
