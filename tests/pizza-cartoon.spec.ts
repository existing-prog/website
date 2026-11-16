import {
  test as base,
  expect,
  chromium,
  type Browser,
  type Page,
} from "@playwright/test";

/** Navigateur propre à la 3D : le rendu logiciel fonctionne aussi en CI. */
const test = base.extend<{ scenePage: Page }, { sceneBrowser: Browser }>({
  sceneBrowser: [
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
  scenePage: async ({ sceneBrowser, baseURL }, use) => {
    const context = await sceneBrowser.newContext({
      baseURL,
      viewport: { width: 1440, height: 1000 },
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

async function openVariant(page: Page) {
  await page.goto("lab/pizza-cartoon/");
  await expect(page.locator("body")).toHaveAttribute("data-renderer", "ready", {
    timeout: 15000,
  });
  await page.evaluate(() => document.fonts.ready);
}

async function scrollScene(page: Page, progress: number) {
  await page.locator(".experiment").evaluate((section, value) => {
    scrollTo({
      top:
        section.getBoundingClientRect().top +
        scrollY +
        ((section as HTMLElement).offsetHeight - innerHeight) * value,
      behavior: "instant",
    });
  }, progress);
  await page.mouse.move(20 + progress * 10, 25);
  await expect(page.locator(".studio")).toHaveAttribute(
    "data-progress",
    progress.toFixed(3),
  );
}

async function seekScene(page: Page, value: number) {
  await page.locator("#scene-progress").evaluate((element, position) => {
    (element as HTMLInputElement).value = String(position);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}

async function sliceBounds(page: Page) {
  return JSON.parse(
    (await page.locator("#pizza-canvas").getAttribute("data-full-slice-bounds"))!,
  ) as number[];
}

test("the hand takes the whole slice once and stays out of frame afterwards", async ({
  scenePage: page,
}) => {
  await openVariant(page);
  const canvas = page.locator("#pizza-canvas");
  let lastTravel = 0;
  // Une seule sortie progressive. La caméra garde ensuite la part hors champ,
  // y compris lorsqu’elle retrouve sa position du dessus.
  for (const progress of [0.61, 0.66, 0.7, 0.74, 0.768, 0.772, 0.8, 0.87, 1]) {
    await scrollScene(page, progress);
    const travel = Number(await canvas.getAttribute("data-hand-travel"));
    expect(travel).toBeGreaterThanOrEqual(lastTravel);
    lastTravel = travel;
    await expect(canvas).toHaveAttribute("data-bite", progress < 0.77 ? "0" : "5");
    if (progress >= 0.74) {
      const bounds = await sliceBounds(page);
      expect(bounds.every(Number.isFinite)).toBe(true);
      expect(bounds[0]).toBeGreaterThan(1);
    }
    if (progress >= 0.8)
      await expect(canvas).toHaveAttribute("data-hand-visible", "false");
  }
  await expect(canvas).toHaveAttribute("data-view", "top");
  await expect(canvas).toHaveAttribute("data-crumbs", "12");
  await expect(page.locator(".outro-copy")).toHaveAttribute("aria-hidden", "false");
  // Le retour arrière restitue le geste et la part complète, sans état cumulé.
  await scrollScene(page, 0.768);
  expect((await sliceBounds(page))[0]).toBeGreaterThan(1);
  await expect(canvas).toHaveAttribute("data-bite", "0");
  await scrollScene(page, 0.6);
  expect(Number(await canvas.getAttribute("data-slice-flex"))).toBeGreaterThan(0.9);
  await expect(canvas).toHaveAttribute("data-hand-visible", "true");
  await expect(canvas).toHaveAttribute("data-hand-travel", "0.0000");
  await scrollScene(page, 0);
  await expect(canvas).toHaveAttribute("data-bite", "0");
  await expect(canvas).toHaveAttribute("data-crumbs", "0");
  await expect(canvas).toHaveAttribute("data-slice-flex", "0.0000");
  await expect(canvas).toHaveAttribute("data-view", "top");
});

test("the mobile finale keeps the pizza clear of the text and respects reduced motion", async ({
  scenePage: page,
}) => {
  await page.setViewportSize({ width: 320, height: 667 });
  await openVariant(page);
  const canvas = page.locator("#pizza-canvas");
  for (const viewport of [
    { width: 320, height: 667 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await seekScene(page, 100);
    await expect(canvas).toHaveAttribute("data-view", "top");
    await expect(canvas).toHaveAttribute("data-hand-visible", "false");
    const composition = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>("#pizza-canvas")!;
      const [minX, minY, maxX, maxY] = JSON.parse(canvas.dataset.pizzaBounds!);
      const frame = canvas.getBoundingClientRect();
      const copy = document
        .querySelector<HTMLElement>(".outro-copy")!
        .getBoundingClientRect();
      const pizza = {
        left: frame.left + ((minX + 1) / 2) * frame.width,
        right: frame.left + ((maxX + 1) / 2) * frame.width,
        top: frame.top + ((1 - maxY) / 2) * frame.height,
        bottom: frame.top + ((1 - minY) / 2) * frame.height,
      };
      return {
        overflow: document.documentElement.scrollWidth - innerWidth,
        travel:
          (document.querySelector<HTMLElement>(".experiment")!.clientHeight -
            document.querySelector<HTMLElement>(".studio")!.clientHeight) /
          innerHeight,
        pizza,
        overlap:
          pizza.left < copy.right &&
          pizza.right > copy.left &&
          pizza.top < copy.bottom &&
          pizza.bottom > copy.top,
      };
    });
    expect(composition.overlap, JSON.stringify(composition)).toBe(false);
    expect(composition.overflow).toBeLessThanOrEqual(1);
    expect(composition.travel).toBeLessThanOrEqual(2);
    expect(composition.pizza.left).toBeGreaterThanOrEqual(0);
    expect(composition.pizza.right).toBeLessThanOrEqual(viewport.width);
    expect(composition.pizza.top).toBeGreaterThanOrEqual(0);
    expect(composition.pizza.bottom).toBeLessThanOrEqual(viewport.height);
    await expect(page.locator(".outro-copy .project-link")).toBeInViewport();
    await expect(page.locator("#scene-progress")).toBeInViewport();
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("body")).toHaveAttribute("data-reduced", "true");
  await expect(page.locator("#play")).toBeHidden();
  await expect(canvas).toHaveAttribute("data-bite", "0");
  expect(
    await page.locator(".experiment").evaluate((element) => element.clientHeight),
  ).toBeLessThanOrEqual(845);
  await seekScene(page, 100);
  await expect(canvas).toHaveAttribute("data-bite", "5");
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await expect(canvas).toHaveAttribute("data-bite", "5");
  await seekScene(page, 0);
  await expect(canvas).toHaveAttribute("data-crumbs", "0");
});

test("the comparison link preserves the previous gesture prototype", async ({
  scenePage: page,
}) => {
  await openVariant(page);
  const link = page
    .getByRole("link", { name: "Comparer avec l’ancien prototype" })
    .first();
  await expect(link).toHaveAttribute("href", "../pizza-gesture/");
  await link.click();
  await expect(page).toHaveURL(/\/lab\/pizza-gesture\/$/);
  await expect(page.locator("body")).toHaveAttribute("data-renderer", "ready");
  await expect(page.locator(".edition")).toContainText("Variante B");
});

test("the shorter optional playback remains pausable and ends despite skipped frames", async ({
  scenePage: page,
}) => {
  await page.clock.install();
  await openVariant(page);
  await page.getByRole("button", { name: "Lire la séquence", exact: true }).click();
  const pause = page.getByRole("button", { name: "Mettre en pause", exact: true });
  await expect(pause).toHaveAttribute("aria-pressed", "true");
  await expect(pause).toBeInViewport();
  // L’horloge simulée peut retenir les images qu’utilise Playwright pour son
  // contrôle de stabilité. Le bouton visible reçoit tout de même un vrai clic.
  await pause.click({ force: true });
  await expect(page.locator("#play")).toHaveAttribute("aria-pressed", "false");
  await page
    .getByRole("button", { name: "Lire la séquence", exact: true })
    .click({ force: true });
  // Une seule image après le saut temporel suffit pour atteindre la conclusion.
  await page.clock.fastForward(10_000);
  await expect(page.locator("#play")).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".studio")).toHaveAttribute("data-progress", "1.000");
  await expect(page.locator("#pizza-canvas")).toHaveAttribute("data-view", "top");
  await expect(page.locator(".outro-copy")).toHaveAttribute("aria-hidden", "false");
});

test("unavailable WebGL shows a usable fallback without a loading loop", async ({
  scenePage: page,
}) => {
  // L’absence de WebGL doit laisser le projet et les liens accessibles.
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      if (type === "webgl" || type === "webgl2") return null;
      return original.call(this, type as "2d", ...args);
    } as typeof original;
  });
  await page.goto("lab/pizza-cartoon/");
  await expect(page.locator("body")).toHaveAttribute("data-renderer", "fallback");
  await expect(page.locator(".fallback")).toBeVisible();
  await expect(page.locator(".loading")).toBeHidden();
  await expect(page.locator("#scene-progress")).toBeDisabled();
  await expect(page.locator("#play")).toBeDisabled();
  await expect(
    page.getByRole("link", { name: "Retour au projet Atelier Pizza" }),
  ).toBeVisible();
});
