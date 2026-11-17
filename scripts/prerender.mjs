/**
 * Pré-rendu après `vite build` : chaque page (FR et EN) est ouverte dans Chromium,
 * puis son HTML final est écrit dans dist/. Les moteurs de recherche et les aperçus
 * de partage lisent ainsi le vrai contenu sans exécuter le JavaScript.
 * Génère aussi 404.html, sitemap.xml et robots.txt.
 *
 * Variables : VITE_SITE_URL (domaine public), CHROMIUM_PATH (navigateur existant),
 * SKIP_PRERENDER=1 (build sans pré-rendu, uniquement pour un essai local).
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { preview } from "vite";
import { chromium } from "@playwright/test";

if (process.env.SKIP_PRERENDER) {
  console.warn("prerender: skipped (SKIP_PRERENDER is set)");
  process.exit(0);
}

const base = "/website/";
const origin = (process.env.VITE_SITE_URL || "https://existing-prog.github.io").replace(
  /\/$/,
  "",
);
const cases = ["samantha", "kasa", "nina", "atelier-pizza"];
const pages = [
  { path: "", indexable: true },
  { path: "en/", indexable: true },
  ...cases.flatMap((id) => [
    { path: `projets/${id}/`, indexable: true },
    { path: `en/projects/${id}/`, indexable: true },
  ]),
  { path: "bureau/" },
  { path: "en/desk/" },
  { path: "page-introuvable/", file: "404.html" },
];

// Écrire seulement à la fin : le serveur doit servir le gabarit d’origine à chaque page.
const rendered = [];
const server = await preview({
  preview: { port: 4190, strictPort: true },
  logLevel: "error",
});
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--no-sandbox"],
});
try {
  // Mouvement réduit : le HTML figé montre l’état final, sans styles d’animation en ligne.
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
    serviceWorkers: "block",
  });
  for (const page of pages) {
    const tab = await context.newPage();
    await tab.goto(`http://localhost:4190${base}${page.path}`, {
      waitUntil: "networkidle",
    });
    await tab.waitForSelector("main h1");
    await tab.evaluate(() => document.fonts.ready);
    let html = await tab.evaluate(
      () => "<!doctype html>\n" + document.documentElement.outerHTML,
    );
    html = html.replaceAll(
      "https://existing-prog.github.io/website/",
      `${origin}${base}`,
    );
    rendered.push([join("dist", page.file ?? join(page.path, "index.html")), html]);
    await tab.close();
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}

for (const [file, html] of rendered) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
  console.log(`prerender: ${file}`);
}

const today = new Date().toISOString().slice(0, 10);
const urls = pages
  .filter((p) => p.indexable)
  .map(
    (p) => `  <url><loc>${origin}${base}${p.path}</loc><lastmod>${today}</lastmod></url>`,
  );
await writeFile(
  "dist/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`,
);
// robots.txt n’est lu qu’à la racine d’un domaine : utile dès le passage à un domaine personnel.
await writeFile(
  "dist/robots.txt",
  `User-agent: *\nDisallow: ${base}lab/\n\nSitemap: ${origin}${base}sitemap.xml\n`,
);
console.log("prerender: sitemap.xml, robots.txt");
await readFile("dist/404.html"); // échoue bruyamment si la page d’erreur manque
