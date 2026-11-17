import { type Lang, type View, pathFor, SITE_ORIGIN } from "./routes";

function tag(selector: string, create: () => HTMLElement) {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    document.head.append(el);
  }
  return el;
}
const meta = (attr: "name" | "property", key: string, content: string) =>
  tag(`meta[${attr}="${key}"]`, () => {
    const m = document.createElement("meta");
    m.setAttribute(attr, key);
    return m;
  }).setAttribute("content", content);
const link = (rel: string, href: string, hreflang?: string) =>
  tag(
    `link[rel="${rel}"]${hreflang ? `[hreflang="${hreflang}"]` : ":not([hreflang])"}`,
    () => {
      const l = document.createElement("link");
      l.rel = rel;
      if (hreflang) l.hreflang = hreflang;
      return l;
    },
  ).setAttribute("href", href);

/**
 * Métadonnées par page : titre, description, URL canonique, versions linguistiques
 * (hreflang) et aperçu de partage. Le pré-rendu fige ces balises dans le HTML publié.
 */
export function setHead({
  title,
  description,
  view,
  lang,
}: {
  title: string;
  description: string;
  view: View;
  lang: Lang;
}) {
  document.title = title;
  const indexable = view.kind === "home" || view.kind === "case";
  meta("name", "description", description);
  meta("name", "robots", indexable ? "index, follow" : "noindex, follow");
  meta("property", "og:title", title);
  meta("property", "og:description", description);
  meta("property", "og:type", "website");
  meta(
    "property",
    "og:image",
    `${SITE_ORIGIN}${pathFor({ kind: "home" }, "fr")}assets/og-image.jpg`,
  );
  meta("property", "og:image:width", "1200");
  meta("property", "og:image:height", "630");
  meta("name", "twitter:card", "summary_large_image");
  if (!indexable) {
    document.head
      .querySelectorAll('link[rel="canonical"], link[rel="alternate"][hreflang]')
      .forEach((n) => n.remove());
    return;
  }
  const url = (l: Lang) => SITE_ORIGIN + pathFor(view, l);
  link("canonical", url(lang));
  meta("property", "og:url", url(lang));
  link("alternate", url("fr"), "fr");
  link("alternate", url("en"), "en");
  link("alternate", url("fr"), "x-default");
}
