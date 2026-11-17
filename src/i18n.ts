import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { currentLang, type Lang } from "./routes";

// Catalogues locaux chargés à la demande : seule la langue affichée est téléchargée.
// Aucun appel à une API de traduction et aucun texte utilisateur transmis.
const catalogs: Record<Lang, () => Promise<{ default: Record<string, string> }>> = {
  en: () => import("./locales/ENG.json"),
  fr: () => import("./locales/FR.json"),
};

async function loadLanguage(lang: Lang) {
  if (i18n.hasResourceBundle(lang, "translation")) return;
  const { default: catalog } = await catalogs[lang]();
  i18n.addResourceBundle(lang, "translation", catalog);
}

/** Changer de langue après avoir chargé son catalogue (évite un affichage de clés). */
export async function setLanguage(lang: Lang) {
  await loadLanguage(lang);
  if (i18n.resolvedLanguage !== lang) await i18n.changeLanguage(lang);
}

/** Maintenir la langue annoncée aux technologies d’assistance et aux réseaux sociaux. */
function syncLanguage(language: string) {
  const code = language.startsWith("en") ? "en" : "fr";
  document.documentElement.lang = code;
  let ogLocale = document.querySelector('meta[property="og:locale"]');
  if (!ogLocale) {
    ogLocale = document.createElement("meta");
    ogLocale.setAttribute("property", "og:locale");
    document.head.append(ogLocale);
  }
  ogLocale.setAttribute("content", code === "fr" ? "fr_FR" : "en_GB");
}

/** La langue vient de l’URL : / en français (par défaut), /en/ en anglais. */
export const i18nReady = (async () => {
  const lng = currentLang();
  const { default: catalog } = await catalogs[lng]();
  i18n.on("languageChanged", syncLanguage);
  // Les phrases anglaises servent de clés, donc les points et deux-points ne sont pas des séparateurs.
  await i18n.use(initReactI18next).init({
    resources: { [lng]: { translation: catalog } },
    lng,
    fallbackLng: false,
    supportedLngs: ["en", "fr"],
    partialBundledLanguages: true,
    keySeparator: false,
    nsSeparator: false,
    interpolation: { escapeValue: false },
  });
  syncLanguage(lng);
})();

export const tr = (key: string, options?: Record<string, unknown>): string =>
  key ? String(i18n.t(key, options || {})) : "";
export const dateLocale = () => (i18n.language.startsWith("fr") ? "fr-FR" : "en-GB");
export default i18n;
