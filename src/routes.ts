/**
 * Routes réelles (History API) : chaque page a sa propre URL, pré-rendue au build
 * pour que les moteurs de recherche lisent le contenu sans exécuter le JavaScript.
 * Le français est la langue par défaut ; l’anglais vit sous /en/.
 */
export type Lang = "fr" | "en";
export const caseIds = ["samantha", "kasa", "nina", "atelier-pizza"] as const;
export type CaseId = (typeof caseIds)[number];
export const landingIds = ["academic", "restaurants"] as const;
export type LandingId = (typeof landingIds)[number];
export type View =
  | { kind: "home" }
  | { kind: "landing"; id: LandingId }
  | { kind: "case"; id: CaseId }
  | { kind: "desk" }
  | { kind: "notfound" };

export const BASE = import.meta.env.BASE_URL; // "/website/"
/** URL publique du site, à remplacer par le futur nom de domaine via VITE_SITE_URL. */
export const SITE_ORIGIN = (
  import.meta.env.VITE_SITE_URL || "https://existing-prog.github.io"
).replace(/\/$/, "");

const segments = {
  fr: { prefix: "", case: "projets", desk: "bureau" },
  en: { prefix: "en/", case: "projects", desk: "desk" },
} as const;
/** Pages spécialisées : une adresse lisible par langue, pour le partage et le référencement. */
const landingSlugs: Record<Lang, Record<LandingId, string>> = {
  fr: { academic: "portfolios-chercheurs", restaurants: "restaurants-commerces" },
  en: { academic: "academic-portfolios", restaurants: "restaurants-shops" },
};

/** Chemin absolu (avec la base GitHub Pages) d’une vue dans une langue. */
export function pathFor(view: View, lang: Lang): string {
  const s = segments[lang];
  if (view.kind === "case") return `${BASE}${s.prefix}${s.case}/${view.id}/`;
  if (view.kind === "desk") return `${BASE}${s.prefix}${s.desk}/`;
  if (view.kind === "landing") return `${BASE}${s.prefix}${landingSlugs[lang][view.id]}/`;
  return `${BASE}${s.prefix}`;
}

export function parsePath(pathname: string): { lang: Lang; view: View } {
  let rest = pathname.startsWith(BASE)
    ? pathname.slice(BASE.length)
    : pathname.replace(/^\//, "");
  rest = rest.replace(/index\.html$/, "").replace(/\/+$/, "");
  const lang: Lang = rest === "en" || rest.startsWith("en/") ? "en" : "fr";
  if (lang === "en") rest = rest.replace(/^en\/?/, "");
  const s = segments[lang];
  if (rest === "") return { lang, view: { kind: "home" } };
  if (rest === s.desk) return { lang, view: { kind: "desk" } };
  const landing = landingIds.find((id) => landingSlugs[lang][id] === rest);
  if (landing) return { lang, view: { kind: "landing", id: landing } };
  const [first, id, ...more] = rest.split("/");
  if (first === s.case && !more.length && (caseIds as readonly string[]).includes(id))
    return { lang, view: { kind: "case", id: id as CaseId } };
  return { lang, view: { kind: "notfound" } };
}

/** Anciennes URL en hash (#project/kasa, #workspace) : conserver les liens déjà partagés. */
export function legacyHashView(hash: string): View | null {
  if (hash === "#workspace") return { kind: "desk" };
  const match = /^#project\/([\w-]+)$/.exec(hash);
  if (match && (caseIds as readonly string[]).includes(match[1]))
    return { kind: "case", id: match[1] as CaseId };
  return null;
}

export const sameView = (a: View, b: View) =>
  a.kind === b.kind &&
  (a.kind !== "case" || (b.kind === "case" && a.id === b.id)) &&
  (a.kind !== "landing" || (b.kind === "landing" && a.id === b.id));

/** Navigation interne sans rechargement ; App écoute cet évènement et popstate. */
export function navigate(url: string, replace = false) {
  history[replace ? "replaceState" : "pushState"](null, "", url);
  window.dispatchEvent(new Event("lb:navigate"));
}

export const currentLang = (): Lang => parsePath(location.pathname).lang;
