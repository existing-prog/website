import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/ENG.json";
import fr from "./locales/FR.json";
const preferenceKey = "lb-language";
function initialLanguage() {
  try {
    const stored = localStorage.getItem(preferenceKey);
    if (stored === "fr" || stored === "en") return stored;
  } catch {
    /* The switch still works without browser storage. */
  }
  return (navigator.languages?.[0] || navigator.language || "en")
    .toLowerCase()
    .startsWith("fr")
    ? "fr"
    : "en";
}
i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, fr: { translation: fr } },
  lng: initialLanguage(),
  fallbackLng: "en",
  supportedLngs: ["en", "fr"],
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
  initAsync: false,
});
function syncLanguage(language: string) {
  const code = language.startsWith("fr") ? "fr" : "en";
  document.documentElement.lang = code;
  let ogLocale = document.querySelector('meta[property="og:locale"]');
  if (!ogLocale) {
    ogLocale = document.createElement("meta");
    ogLocale.setAttribute("property", "og:locale");
    document.head.append(ogLocale);
  }
  ogLocale.setAttribute("content", code === "fr" ? "fr_FR" : "en_GB");
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute("content", i18n.t("meta.description"));
  document
    .querySelector('meta[property="og:description"]')
    ?.setAttribute("content", i18n.t("meta.description"));
  try {
    localStorage.setItem(preferenceKey, code);
  } catch {
    /* Preference persistence is optional. */
  }
}
i18n.on("languageChanged", syncLanguage);
syncLanguage(i18n.language);
export const tr = (key: string, options?: Record<string, unknown>): string =>
  key ? String(i18n.t(key, options || {})) : "";
export const dateLocale = () =>
  i18n.language.startsWith("fr") ? "fr-FR" : "en-GB";
export default i18n;
