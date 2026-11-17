import { test, expect } from "@playwright/test";

for (const mode of ["desktop", "mobile", "reduced"] as const) {
  test(`project artwork stays isolated in ${mode} scenes`, async ({ page }) => {
    await page.setViewportSize({ width: mode === "mobile" ? 390 : 1440, height: 900 });
    if (mode === "reduced") await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("en/");
    await expect(page.locator(".project-stories")).toHaveAttribute(
      "data-enhanced",
      mode === "desktop" ? "true" : "false",
    );
    // Vérifier chaque scène montée, y compris les copies inline et sticky.
    for (const id of ["samantha", "kasa", "nina"]) {
      const scenes = page.locator(`.project-stories [data-scene="${id}"]`);
      expect(await scenes.count()).toBeGreaterThan(0);
      for (const scene of await scenes.all()) {
        await expect(scene.locator(".story-browser")).toHaveCount(1);
        await expect(scene.locator(".neptune-sphere")).toHaveCount(
          id === "samantha" ? 1 : 0,
        );
        await expect(scene.locator(".story-orbits")).toHaveCount(
          id === "samantha" ? 1 : 0,
        );
        await expect(scene.locator(".story-stars")).toHaveCount(
          id === "samantha" ? 1 : 0,
        );
        await expect(scene.locator(".kasa-blueprint")).toHaveCount(id === "kasa" ? 1 : 0);
        await expect(scene.locator(".contact-sheet")).toHaveCount(id === "nina" ? 1 : 0);
      }
    }
    // Les liens internes restent indépendants du choix du décor.
    for (const id of ["samantha", "kasa", "nina"])
      await expect(page.locator(`#chapter-${id} .story-card`)).toHaveAttribute(
        "href",
        `/website/en/projects/${id}/`,
      );
  });
}
