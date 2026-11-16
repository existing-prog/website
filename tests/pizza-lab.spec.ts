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

test("pizza lab follows native scroll through six bite states and reverses", async ({
  gpuPage: page,
}) => {
  await openScene(page);
  const canvas = page.locator("#pizza-canvas");
  for (const [bite, progress] of [0, 0.715, 0.76, 0.805, 0.85, 0.9].entries()) {
    await scrollScene(page, progress);
    await expect(canvas).toHaveAttribute("data-bite", String(bite));
  }
  await expect(canvas).toHaveAttribute("data-view", "side");
  await scrollScene(page, 1);
  await expect(page.locator(".outro-copy")).toHaveAttribute("aria-hidden", "false");
  await expect(
    page.getByRole("link", { name: "Revoir le projet WordPress" }),
  ).toBeInViewport();
  await scrollScene(page, 0);
  await expect(canvas).toHaveAttribute("data-bite", "0");
  await expect(canvas).toHaveAttribute("data-view", "top");
  await expect(page.locator(".outro-copy")).toHaveAttribute("aria-hidden", "true");
});

test("scene controls remain reachable during seeking and optional playback", async ({
  gpuPage: page,
}) => {
  await openScene(page);
  const slider = page.getByRole("slider", { name: "Explorer la séquence" });
  await seekScene(page, 61);
  await expect(slider).toBeInViewport();
  await expect(page.locator(".studio")).toHaveAttribute("data-progress", /0\.6/);
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
    await seekScene(page, 80);
    await expect(page.locator("#pizza-canvas")).toHaveAttribute("data-bite", "3");
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
  await seekScene(page, 80);
  await expect(page.locator("#pizza-canvas")).toHaveAttribute("data-bite", "3");
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await expect(page.locator("#pizza-canvas")).toHaveAttribute("data-bite", "3");
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
    if (/pizzaLab-|\/src\/prototypes\/pizza3d\/|\/deps\/three/.test(request.url()))
      labRequests.push(request.url());
  });
  await page.goto("");
  await expect(page.locator("h1")).toBeVisible();
  await page.locator(".atelier-project-teaser").scrollIntoViewIfNeeded();
  expect(labRequests).toEqual([]);
  await expect(page.locator('a[href*="lab/pizza-3d"]')).toHaveCount(0);
});
