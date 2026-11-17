import { test, expect } from "@playwright/test";

test("French is the default page and its HTML is prerendered for search engines", async ({
  request,
}) => {
  const html = await (await request.get("")).text();
  expect(html).toContain('<html lang="fr"');
  expect(html).toContain("Votre activité.");
  expect(html).toContain(
    '<link rel="canonical" href="https://existing-prog.github.io/website/">',
  );
  expect(html).toContain(
    'hreflang="en" href="https://existing-prog.github.io/website/en/"',
  );
  const kasa = await (await request.get("en/projects/kasa/")).text();
  expect(kasa).toContain('<html lang="en"');
  expect(kasa).toContain("<title>Kasa — Case study · Lucas Berdy</title>");
  const desk = await (await request.get("bureau/")).text();
  expect(desk).toContain('content="noindex, follow"');
  const sitemap = await (await request.get("sitemap.xml")).text();
  expect(sitemap).toContain("/website/projets/atelier-pizza/</loc>");
  expect(sitemap).not.toContain("bureau");
});

test("case studies have their own URLs, history and language equivalents", async ({
  page,
}) => {
  await page.goto("");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await page.locator("#chapter-kasa .story-card").click();
  await expect(page).toHaveURL(/\/website\/projets\/kasa\/$/);
  await expect(page).toHaveTitle("Kasa — Étude de cas · Lucas Berdy");
  await page
    .locator("header")
    .getByRole("button", { name: "English", exact: true })
    .click();
  await expect(page).toHaveURL(/\/website\/en\/projects\/kasa\/$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://existing-prog.github.io/website/en/projects/kasa/",
  );
  await page.goBack();
  await expect(page).toHaveURL(/\/website\/$/);
  await expect(page.locator(".hero")).toBeVisible();
});

test("old hash links still open the right page", async ({ page }) => {
  await page.goto("#project/nina");
  await expect(page).toHaveURL(/\/website\/projets\/nina\/$/);
  await expect(page.locator(".nina-intro h1")).toBeVisible();
  await page.goto("en/#workspace");
  await expect(page).toHaveURL(/\/website\/en\/desk\/$/);
});

test("unknown pages show a helpful 404", async ({ page }) => {
  const response = await page.goto("en/nothing-here/");
  if (!process.env.TEST_URL) expect([200, 404]).toContain(response!.status());
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    /This page doesn’t exist|Cette page n’existe pas/,
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("the project desk appears in the menu only once a draft exists", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("en/");
  await expect(page.locator("header a.desk-link")).toHaveCount(0);
  await page.evaluate(() =>
    localStorage.setItem(
      "lb-project-drafts-v1",
      JSON.stringify([
        {
          id: "a",
          updatedAt: new Date().toISOString(),
          service: "care",
          pages: "Not sure yet",
          extras: [],
          name: "Ana",
          email: "ana@example.com",
          company: "Studio Ana",
          website: "",
          timeline: "Flexible",
          brief: "Fix my site",
        },
      ]),
    ),
  );
  await page.reload();
  await page.locator("header a.desk-link").click();
  await expect(page).toHaveURL(/\/website\/en\/desk\/$/);
  await expect(
    page.getByRole("button", { name: "Delete the draft Studio Ana" }),
  ).toBeVisible();
});
