import {
  test as base,
  expect,
  chromium,
  type Browser,
  type Page,
} from "@playwright/test";

/** WebGL logiciel déterministe pour les machines CI sans carte graphique.
 * Ce navigateur reste propre au prototype ; les autres tests gardent leur config.
 */
const test = base.extend<{ gpuPage: Page }, { gpuBrowser: Browser }>({
  gpuBrowser: [
    async ({}, use) => {
      const browser = await chromium.launch({
        executablePath: process.env.CHROMIUM_PATH || undefined,
        args: [
          "--no-sandbox",
          "--enable-webgl",
          "--use-gl=angle",
          "--use-angle=swiftshader",
          "--enable-unsafe-swiftshader",
        ],
      });
      await use(browser);
      await browser.close();
    },
    { scope: "worker" },
  ],
  gpuPage: async ({ gpuBrowser, baseURL }, use) => {
    const context = await gpuBrowser.newContext({
      baseURL,
      viewport: { width: 1440, height: 1000 },
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

async function openScene(page: Page) {
  await page.goto("lab/pizza-3d/");
  await expect(page.locator("body")).toHaveAttribute("data-renderer", "ready", {
    timeout: 15000,
  });
  await page.evaluate(() => document.fonts.ready);
}

/** La séquence reste courte sans dépendre d’une valeur CSS précise. */
async function expectCompactTravel(page: Page) {
  const viewportTravel = await page.evaluate(() => {
    const experiment = document.querySelector<HTMLElement>(".experiment")!;
    const studio = document.querySelector<HTMLElement>(".studio")!;
    return (experiment.clientHeight - studio.clientHeight) / innerHeight;
  });
  expect(viewportTravel).toBeLessThanOrEqual(2.5);
}

async function scrollScene(page: Page, progress: number) {
  await page.locator(".experiment").evaluate((section, p) => {
    scrollTo({
      top:
        section.getBoundingClientRect().top +
        scrollY +
        ((section as HTMLElement).offsetHeight - innerHeight) * p,
      behavior: "instant",
    });
  }, progress);
  await page.mouse.move(20 + progress * 10, 25);
}

async function seekScene(page: Page, value: number) {
  await page.locator("#scene-progress").evaluate((input, progress) => {
    (input as HTMLInputElement).value = String(progress);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}

test("pizza lab follows three offscreen bites with native scroll and reverses", async ({
  gpuPage: page,
}) => {
  await openScene(page);
  await expectCompactTravel(page);
  const canvas = page.locator("#pizza-canvas");
  for (const [progress, bite] of [
    [0, 0],
    [0.645, 2],
    [0.735, 4],
    [0.822, 5],
  ]) {
    await scrollScene(page, progress);
    await expect(canvas).toHaveAttribute("data-bite", String(bite));
  }
  await expect(canvas).toHaveAttribute("data-hand-phase", "empty");
  await expect(canvas).toHaveAttribute("data-view", "side");
  await scrollScene(page, 1);
  await expect(canvas).toHaveAttribute("data-view", "top");
  await expect(canvas).toHaveAttribute("data-bite", "5");
  await expect(canvas).toHaveAttribute("data-crumbs", "12");
  await expect(canvas).toHaveAttribute("data-crumb-opacity", "1.000");
  await expect(page.locator(".scene")).toHaveCSS("opacity", "1");
  await expect(page.locator(".outro-copy")).toHaveAttribute("aria-hidden", "false");
  await expect(
    page.getByRole("link", { name: "Revoir le projet WordPress" }),
  ).toBeInViewport();
  await scrollScene(page, 0);
  await expect(canvas).toHaveAttribute("data-bite", "0");
  await expect(canvas).toHaveAttribute("data-view", "top");
  await expect(canvas).toHaveAttribute("data-crumbs", "0");
  await expect(canvas).toHaveAttribute("data-crumb-opacity", "0.000");
  await expect(page.locator(".outro-copy")).toHaveAttribute("aria-hidden", "true");
});

test("scene controls remain reachable during seeking and optional playback", async ({
  gpuPage: page,
}) => {
  await openScene(page);
  const slider = page.getByRole("slider", { name: "Explorer la séquence" });
  await seekScene(page, 52.5);
  await expect(slider).toBeInViewport();
  await expect(page.locator(".studio")).toHaveAttribute("data-progress", /0\.52/);
  await page.getByRole("button", { name: "Lire la séquence", exact: true }).click();
  const pause = page.getByRole("button", { name: "Mettre en pause", exact: true });
  await expect(pause).toHaveAttribute("aria-pressed", "true");
  await expect(pause).toBeInViewport();
  await expect
    .poll(() => page.locator(".studio").getAttribute("data-progress"))
    .not.toBe("0.000");
  await pause.click();
  await expect(
    page.getByRole("button", { name: "Lire la séquence", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await expect(slider).toBeInViewport();
  await expect(page.locator("#progress-value")).toHaveAttribute("aria-live", "off");
});

test("mobile layouts and reduced motion allow deliberate poses without a long track", async ({
  gpuPage: page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await openScene(page);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await expectCompactTravel(page);
    await seekScene(page, 73.5);
    await expect(page.locator("#pizza-canvas")).toHaveAttribute("data-bite", "4");
    await expect(page.locator("#scene-progress")).toBeInViewport();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("body")).toHaveAttribute("data-reduced", "true");
  await expect(page.locator("#play")).toBeHidden();
  expect(
    await page.locator(".experiment").evaluate((section) => section.clientHeight),
  ).toBeLessThanOrEqual(845);
  await expect(page.locator("#pizza-canvas")).toHaveAttribute("data-bite", "0");
  await seekScene(page, 73.5);
  await expect(page.locator("#pizza-canvas")).toHaveAttribute("data-bite", "4");
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await expect(page.locator("#pizza-canvas")).toHaveAttribute("data-bite", "4");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("body")).toHaveAttribute("data-reduced", "false");
  await expect(page.locator("#play")).toBeVisible();
});

test("unavailable WebGL provides an honest static fallback and a working return link", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type === "webgl" || type === "webgl2" || type === "experimental-webgl")
        return null;
      return (original as (...values: unknown[]) => RenderingContext | null).apply(this, [
        type,
        ...args,
      ]);
    } as typeof original;
  });
  await page.goto("lab/pizza-3d/");
  await expect(page.locator("body")).toHaveAttribute("data-renderer", "fallback");
  await expect(page.locator(".fallback")).toBeVisible();
  await expect(page.locator("#scene-progress")).toBeDisabled();
  await expect(page.locator(".loading")).toBeHidden();
  await page.getByRole("link", { name: "Retour au projet Atelier Pizza" }).click();
  await expect(page.locator(".atelier-study")).toBeVisible();
});

test("the storefront does not load the 3D laboratory", async ({ page }) => {
  const labRequests: string[] = [];
  page.on("request", (request) => {
    if (
      /pizzaLab-|anatomical-hand\.glb|\/src\/prototypes\/pizza3d\/|\/deps\/three/.test(
        request.url(),
      )
    )
      labRequests.push(request.url());
  });
  await page.goto("");
  await expect(page.locator("h1")).toBeVisible();
  await page.locator(".atelier-project-teaser").scrollIntoViewIfNeeded();
  expect(labRequests).toEqual([]);
  await expect(page.locator('a[href*="lab/pizza-3d"]')).toHaveCount(0);
});

for (const viewport of [
  { width: 320, height: 844 },
  { width: 390, height: 844 },
  { width: 1440, height: 1000 },
  { width: 1920, height: 1080 },
]) {
  test(`bite geometry changes beyond the canvas at ${viewport.width}px, forward and backward`, async ({
    gpuPage: page,
  }) => {
    await page.setViewportSize(viewport);
    await openScene(page);
    const canvas = page.locator("#pizza-canvas");
    const snapshots: Array<{
      progress: number;
      bite: number;
      phase: string;
      bounds: number[];
    }> = [];

    // Les bornes utilisent la part entière, y compris après une bouchée.
    // On teste le cadre visible (-1..1), pas le booléen interne « hors champ ».
    for (const [before, after, bite, returned] of [
      [0.595, 0.601, 2, 0.645],
      [0.685, 0.691, 4, 0.735],
      [0.776, 0.781, 5, 0.822],
    ]) {
      for (const [progress, expectedBite] of [
        [before, bite === 2 ? 0 : bite === 4 ? 2 : 4],
        [after, bite],
      ]) {
        await scrollScene(page, progress);
        await expect(page.locator(".studio")).toHaveAttribute(
          "data-progress",
          progress.toFixed(3),
        );
        await expect(canvas).toHaveAttribute("data-bite", String(expectedBite));
        await expect(canvas).toHaveAttribute("data-hand-phase", "outside");
        const bounds = JSON.parse(
          (await canvas.getAttribute("data-full-slice-bounds"))!,
        ) as number[];
        expect(bounds.every(Number.isFinite)).toBe(true);
        expect(bounds[0]).toBeGreaterThan(1);
        snapshots.push({
          progress,
          bite: expectedBite,
          phase: "outside",
          bounds,
        });
      }
      await scrollScene(page, returned);
      await expect(page.locator(".studio")).toHaveAttribute(
        "data-progress",
        returned.toFixed(3),
      );
      await expect(canvas).toHaveAttribute("data-bite", String(bite));
      await expect(canvas).toHaveAttribute(
        "data-hand-phase",
        bite === 5 ? "empty" : "presenting",
      );
      if (bite < 5) {
        const bounds = JSON.parse(
          (await canvas.getAttribute("data-full-slice-bounds"))!,
        ) as number[];
        // Les deux retours montrent à nouveau la part dans le cadre.
        expect(bounds[0]).toBeLessThan(1);
        expect(bounds[2]).toBeGreaterThan(-1);
        expect(bounds[1]).toBeLessThan(1);
        expect(bounds[3]).toBeGreaterThan(-1);
      }
    }

    // Revenir sur les changements conserve les mêmes poses et la même protection.
    for (const pose of snapshots.reverse()) {
      await scrollScene(page, pose.progress);
      await expect(page.locator(".studio")).toHaveAttribute(
        "data-progress",
        pose.progress.toFixed(3),
      );
      await expect(canvas).toHaveAttribute("data-bite", String(pose.bite));
      await expect(canvas).toHaveAttribute("data-hand-phase", pose.phase);
      const bounds = JSON.parse(
        (await canvas.getAttribute("data-full-slice-bounds"))!,
      ) as number[];
      expect(bounds[0]).toBeGreaterThan(1);
      bounds.forEach((value, index) => expect(value).toBeCloseTo(pose.bounds[index], 3));
    }
  });
}

for (const viewport of [
  { width: 320, height: 667 },
  { width: 390, height: 844 },
  { width: 761, height: 900 },
  { width: 1440, height: 1000 },
  { width: 1920, height: 1080 },
]) {
  test(`the overhead finale preserves the pizza beside readable copy at ${viewport.width}px`, async ({
    gpuPage: page,
  }) => {
    await page.setViewportSize(viewport);
    await openScene(page);
    await scrollScene(page, 1);
    const canvas = page.locator("#pizza-canvas");
    await expect(canvas).toHaveAttribute("data-view", "top");
    await expect(canvas).toHaveAttribute("data-bite", "5");
    await expect(canvas).toHaveAttribute("data-crumbs", "12");
    await expect(page.locator(".outro-copy")).toHaveAttribute("aria-hidden", "false");
    const composition = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>("#pizza-canvas")!;
      const [minX, minY, maxX, maxY] = JSON.parse(
        canvas.dataset.pizzaBounds!,
      ) as number[];
      const frame = canvas.getBoundingClientRect();
      const copy = document
        .querySelector<HTMLElement>(".outro-copy")!
        .getBoundingClientRect();
      // Les bornes 3D projetées sont converties dans le même repère CSS que le texte.
      const pizza = {
        left: frame.left + ((minX + 1) / 2) * frame.width,
        right: frame.left + ((maxX + 1) / 2) * frame.width,
        top: frame.top + ((1 - maxY) / 2) * frame.height,
        bottom: frame.top + ((1 - minY) / 2) * frame.height,
      };
      return {
        pizza,
        copy: { left: copy.left, right: copy.right, top: copy.top, bottom: copy.bottom },
        overlap:
          pizza.left < copy.right &&
          pizza.right > copy.left &&
          pizza.top < copy.bottom &&
          pizza.bottom > copy.top,
      };
    });
    expect(composition.overlap, JSON.stringify(composition)).toBe(false);
    expect(composition.pizza.left).toBeGreaterThanOrEqual(0);
    expect(composition.pizza.right).toBeLessThanOrEqual(viewport.width);
    expect(composition.pizza.top).toBeGreaterThanOrEqual(0);
    expect(composition.pizza.bottom).toBeLessThanOrEqual(viewport.height);
    await expect(page.locator(".outro-copy h2")).toBeInViewport();
    await expect(page.locator(".project-link")).toBeInViewport();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
  });
}

test("optional playback finishes after elapsed time even when frames are skipped", async ({
  gpuPage: page,
}) => {
  // Un saut d’horloge ne délivre pas toutes les images intermédiaires : cela
  // reproduit le problème qui étirait la lecture sur un navigateur ralenti.
  await page.clock.install();
  await openScene(page);
  await page.getByRole("button", { name: "Lire la séquence", exact: true }).click();
  await expect(page.locator("#play")).toHaveAttribute("aria-pressed", "true");
  await page.clock.fastForward(14_000);
  await expect(page.locator("#play")).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".studio")).toHaveAttribute("data-progress", "1.000");
  await expect(page.locator(".scene-status")).toContainText("Séquence terminée");
  await expect(page.locator("#pizza-canvas")).toHaveAttribute("data-view", "top");
  await expect(page.locator("#pizza-canvas")).toHaveAttribute("data-crumbs", "12");
});

test("a missing anatomical hand falls back without leaving the scene loading", async ({
  gpuPage: page,
}) => {
  await page.route("**/assets/models/anatomical-hand.glb", (route) => route.abort());
  await page.goto("lab/pizza-3d/");
  await expect(page.locator("body")).toHaveAttribute("data-renderer", "fallback");
  await expect(page.locator(".fallback")).toBeVisible();
  await expect(page.locator(".loading")).toBeHidden();
  await expect(page.locator("#scene-progress")).toBeDisabled();
  await expect(
    page.getByRole("link", { name: "Retour au projet Atelier Pizza" }),
  ).toBeVisible();
});
