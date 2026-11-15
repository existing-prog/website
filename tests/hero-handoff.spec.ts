import { test, expect, type Page } from "@playwright/test";

// Le trajet doit rester un simple scroll : aucune hauteur de scène ni ancre supplémentaire.
async function scrollHandoff(page: Page, fraction: number) {
  await page.locator("#work").waitFor({ state: "attached" });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate((progress) => {
    const work = document.querySelector("#work")!;
    const end = work.getBoundingClientRect().top + scrollY - 80;
    window.scrollTo({ top: Math.max(0, end * progress), behavior: "instant" });
  }, fraction);
  // WebKit sans interface peut différer l’événement scroll d’un scrollTo jusqu’à
  // une entrée réelle. Reproduire le pointeur d’un visiteur, sans délai arbitraire.
  await page.mouse.move(2, 2 + Math.round(fraction * 10));
}

async function expectNoOverflow(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
}

test("hero preview hands off the selected project and reverses without changing layout", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("");
  await page.evaluate(() => document.fonts.ready);
  const layer = page.locator(".hero-handoff");
  await expect(layer).toHaveAttribute("data-mode", "desktop");
  await expect(layer).toBeHidden();
  await page.getByRole("button", { name: "Preview Kasa", exact: true }).click();
  const selectedImage = await page.locator(".showcase-image img").getAttribute("src");
  const layout = await page.evaluate(() => ({
    height: document.documentElement.scrollHeight,
    workTop: document.querySelector("#work")!.getBoundingClientRect().top + scrollY,
  }));

  await scrollHandoff(page, 0.5);
  await expect(page.locator(".hero")).toHaveAttribute("data-handoff", "active");
  await expect(layer).toBeVisible();
  await expect(layer).toHaveAttribute("aria-hidden", "true");
  expect(await layer.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe("none");
  await expect(page.locator(".handoff-frame img")).toHaveAttribute("src", selectedImage!);
  const progress = Number(await layer.getAttribute("data-progress"));
  expect(progress).toBeGreaterThan(0);
  expect(progress).toBeLessThan(1);
  await expectNoOverflow(page);

  await scrollHandoff(page, 0);
  await expect(layer).toBeHidden();
  await expect(page.locator(".hero")).not.toHaveAttribute("data-handoff", "active");
  await expect(page.locator(".showcase-window")).toBeVisible();
  const restored = await page.evaluate(() => ({
    height: document.documentElement.scrollHeight,
    workTop: document.querySelector("#work")!.getBoundingClientRect().top + scrollY,
  }));
  expect(Math.abs(restored.height - layout.height)).toBeLessThanOrEqual(1);
  expect(Math.abs(restored.workTop - layout.workTop)).toBeLessThanOrEqual(1);
});

test("a direct work anchor exposes the projects without a transition overlay", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("#work");
  await expect(page.locator("#work .section-heading h2")).toBeInViewport();
  await expect(page.locator(".hero-handoff")).toBeHidden();
  await expect(page.locator(".hero")).not.toHaveAttribute("data-handoff", "active");
  await expectNoOverflow(page);
  await page.getByRole("button", { name: "Portfolios", exact: true }).click();
  await expect(page.locator(".project-chapter")).toHaveCount(1);
  await expect(page.locator(".hero-handoff")).toBeHidden();
});

test("leaving for the project desk cleans up and returning restores the handoff", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("");
  await scrollHandoff(page, 0.5);
  await expect(page.locator(".hero-handoff")).toBeVisible();
  await page.evaluate(() => {
    location.hash = "workspace";
  });
  await expect(page.locator(".empty-desk")).toBeVisible();
  await expect(page.locator(".hero-handoff")).toBeHidden();
  await page.getByRole("link", { name: "Lucas Berdy home", exact: true }).first().click();
  await expect(page.locator(".hero-copy h1")).toBeInViewport();
  await expect(page.locator(".hero-handoff")).toBeHidden();
  await scrollHandoff(page, 0.5);
  await expect(page.locator(".hero-handoff")).toBeVisible();
  await expect(page.locator(".hero-handoff")).toHaveCount(1);
  await expectNoOverflow(page);
});

// Les changements de viewport ou de préférence doivent libérer l’aperçu réel.
test("mobile and reduced motion remove the desktop overlay and keep content usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("");
  await scrollHandoff(page, 0.5);
  await expect(page.locator(".hero-handoff")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".hero-handoff")).toHaveAttribute("data-mode", "mobile");
  await expect(page.locator(".hero-handoff")).toBeHidden();
  await scrollHandoff(page, 0);
  await expect(page.locator(".showcase-window")).toBeVisible();
  await expectNoOverflow(page);
  await scrollHandoff(page, 1);
  await expect(page.locator("#work .section-heading h2")).toBeInViewport();
  await expect(page.locator(".hero-handoff")).toBeHidden();

  await page.setViewportSize({ width: 1440, height: 900 });
  await scrollHandoff(page, 0.5);
  await expect(page.locator(".hero-handoff")).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".hero-handoff")).toBeHidden();
  await expect(page.locator(".hero")).not.toHaveAttribute("data-handoff", "active");
  await scrollHandoff(page, 0);
  await expect(page.locator(".showcase-window")).toBeVisible();
  expect(
    await page.locator(".hero-stage").evaluate((el) => getComputedStyle(el).transform),
  ).toBe("none");
  await expectNoOverflow(page);
});

// Changer de traduction reconstruit les mesures sans interrompre le trajet.
test("language changes mid-scroll preserve the camera and the work anchor stays usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("");
  await scrollHandoff(page, 0.5);
  await expect(page.locator(".hero-handoff")).toBeVisible();
  await page
    .locator("header button[lang='fr']")
    .evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator(".hero-handoff")).toBeVisible();
  await expectNoOverflow(page);
  await scrollHandoff(page, 0);
  await page.locator(".hero-actions a[href='#work']").click();
  await expect(page.locator(".hero-handoff")).toBeHidden();
  await expect(page.locator("#work .section-heading h2")).toBeInViewport();
});

// Le clavier doit garder ses éléments visibles même si une sélection reconstruit l’effet.
test("keyboard navigation suspends the decorative camera across preview changes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("");
  const preview = page.getByRole("button", { name: "Preview Kasa", exact: true });
  await preview.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(preview).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(preview).toHaveAttribute("aria-pressed", "true");
  await scrollHandoff(page, 0.5);
  await expect(page.locator(".hero-handoff")).toBeHidden();
  expect(
    await page.locator(".showcase-window").evaluate((el) => getComputedStyle(el).opacity),
  ).toBe("1");
  await expect(preview).toBeFocused();
});
