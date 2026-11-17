import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("French and English catalogs have matching keys and placeholders", async () => {
  const en = JSON.parse(await readFile("src/locales/ENG.json", "utf8"));
  const fr = JSON.parse(await readFile("src/locales/FR.json", "utf8"));
  expect(Object.keys(en).sort()).toEqual(Object.keys(fr).sort());
  for (const key of Object.keys(en)) {
    expect(fr[key].trim().length).toBeGreaterThan(0);
    expect((en[key].match(/\{\{\w+\}\}/g) || []).sort()).toEqual(
      (fr[key].match(/\{\{\w+\}\}/g) || []).sort(),
    );
  }
});

test.describe("French-language visitors", () => {
  test.use({ locale: "fr-FR" });
  for (const width of [320, 375, 390, 768, 1024, 1152, 1280, 1440]) {
    test(`French interface fits ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("");
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator("html")).toHaveAttribute("lang", "fr");
      await expect(page.locator(".hero-copy > p")).toHaveText(
        "Je conçois et développe des sites qui marquent dès le premier scroll, pour les indépendants, les restaurants et les chercheurs.",
      );
      await expect(
        page.locator("header").getByRole("button", { name: "Français", exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
      for (const name of ["Français", "English"]) {
        const r = await page
          .locator("header")
          .getByRole("button", { name, exact: true })
          .boundingBox();
        expect(r!.width).toBeGreaterThanOrEqual(43);
        expect(r!.height).toBeGreaterThanOrEqual(44);
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      ).toBeLessThanOrEqual(1);
      await expect(page.locator(".service-budget")).toHaveText([
        "600–1 200 €",
        "1 200–2 400 €",
        "45 € / heure",
      ]);
      await page
        .locator(".hero-actions")
        .getByRole("button", { name: "Démarrer un projet", exact: true })
        .click();
      await expect(
        page.getByRole("heading", {
          name: "Que construisons-nous ?",
          exact: true,
        }),
      ).toBeVisible();
      expect(
        await page
          .locator(".builder-content")
          .evaluate((e) => e.scrollWidth - e.clientWidth),
      ).toBeLessThanOrEqual(1);
      await page.getByRole("button", { name: "Fermer le formulaire de projet" }).click();
    });
  }
});

test("language changes preserve the form and local drafts and localize exports", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("");
  await page
    .locator("header")
    .getByRole("button", { name: "Français", exact: true })
    .click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await page
    .getByRole("button", {
      name: "Démarrer un projet : site professionnel",
      exact: true,
    })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Continuer", exact: true }).click();
  await page.getByLabel("Combien de pages ?").selectOption("2–5 pages");
  await page.getByLabel("Calendrier souhaité").selectOption("1–3 months");
  await page.getByLabel("Animations discrètes").check();
  const brief =
    "Un site élégant pour mon activité indépendante, avec une galerie et un formulaire de contact.";
  await page.getByRole("textbox", { name: "Votre idée" }).fill(brief);
  await dialog.getByRole("button", { name: "English", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Tell me a little more.", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Your idea" })).toHaveValue(brief);
  await expect(page.getByLabel("How many pages?")).toHaveValue("2–5 pages");
  await expect(page.getByLabel("Subtle animations")).toBeChecked();
  await dialog.getByRole("button", { name: "Français", exact: true }).click();
  await dialog.getByRole("button", { name: "Continuer", exact: true }).click();
  await page.getByLabel("Votre nom", { exact: true }).fill("Camille Dupont");
  await page.getByLabel("Adresse e-mail", { exact: true }).fill("camille@example.com");
  await page.getByLabel("Nom de l’entreprise ou du projet").fill("Atelier Camille");
  await dialog.getByRole("button", { name: "Continuer", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Votre prochaine étape se dessine.",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".review-budget strong")).toHaveText("1 200–2 400 €");
  const href = await dialog
    .getByRole("link", { name: "Envoyer la demande par e-mail" })
    .getAttribute("href");
  const body = new URLSearchParams(href!.split("?")[1]).get("body")!;
  expect(body).toContain("DEMANDE DE PROJET — Site professionnel");
  expect(body).toContain("Pages / périmètre : 2 à 5 pages");
  expect(body).toContain("Animations discrètes");
  expect(body).toContain(brief);
  expect(body).not.toContain("PROJECT REQUEST");
  const downloading = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Télécharger le brief" }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toBe("lucas-berdy-brief-projet.txt");
  expect(await readFile((await download.path())!, "utf8")).toContain(brief);
  await dialog
    .getByRole("button", { name: "Enregistrer le brouillon sur cet appareil" })
    .click();
  await expect(dialog.getByRole("status")).toContainText("Brouillon enregistré");
  await dialog.getByRole("button", { name: "Aller à mon bureau de projets" }).click();
  await expect(page.locator(".draft-card")).toHaveCount(1);
  await expect(page).toHaveTitle("Bureau de projets — Lucas Berdy");
  await page
    .locator("header")
    .getByRole("button", { name: "English", exact: true })
    .click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator(".draft-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Continue project" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Your idea" })).toHaveValue(brief);
  await expect(page.getByLabel("Subtle animations")).toBeChecked();
});

test("French remains selectable with blocked browser storage", async ({ page }) => {
  await page.goto("");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("blocked", "QuotaExceededError");
    };
  });
  await page
    .locator("header")
    .getByRole("button", { name: "Français", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page).toHaveTitle("Lucas Berdy — Votre prochaine étape, en ligne.");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /Des portfolios singuliers/,
  );
});

test("French animated projects retain their service mapping when language changes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("");
  await page
    .locator("header")
    .getByRole("button", { name: "Français", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Frontend et performance", exact: true })
    .click();
  await expect(page.locator(".project-card")).toHaveCount(2);
  await page
    .locator("#chapter-nina")
    .evaluate((e) => e.scrollIntoView({ block: "center", behavior: "instant" }));
  await expect(page.locator(".project-stories")).toHaveAttribute("data-active", "nina");
  await page
    .getByRole("button", { name: "Démarrer un projet comme Nina Carducci", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(page.locator(".service-option.chosen strong")).toHaveText("Maintenance");
  for (const name of ["Français", "English"]) {
    const rect = await dialog.getByRole("button", { name, exact: true }).boundingBox();
    expect(rect!.height).toBeGreaterThanOrEqual(44);
    expect(rect!.width).toBeGreaterThanOrEqual(44);
  }
  await dialog.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.locator(".service-option.chosen strong")).toHaveText("Website care");
  await dialog.getByRole("button", { name: "Close project planner" }).click();
  await expect(page.locator(".project-stories")).toHaveAttribute("data-active", "nina");
});
