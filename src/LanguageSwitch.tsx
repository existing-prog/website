import { useTranslation } from "react-i18next";
import { setLanguage } from "./i18n";
import { type Lang, parsePath, pathFor } from "./routes";

/** Basculer vers la même page dans l’autre langue, sans rechargement :
 * un formulaire ouvert garde sa saisie. replaceState évite d’empiler l’historique.
 */
function switchTo(lang: Lang) {
  const { view } = parsePath(location.pathname);
  if (view.kind !== "notfound")
    history.replaceState(history.state, "", pathFor(view, lang) + location.hash);
  void setLanguage(lang);
}

/**
 * Noms natifs pour rester identifiable dans les deux langues ; aria-pressed annonce
 * le choix actif. L’état appartient à i18next, pas à chaque instance du sélecteur.
 */
export default function LanguageSwitch() {
  const { t, i18n } = useTranslation();
  return (
    <div className="language-switch" role="group" aria-label={t("Website language")}>
      <button
        type="button"
        lang="fr"
        aria-label="Français"
        aria-pressed={i18n.resolvedLanguage === "fr"}
        onClick={() => switchTo("fr")}
      >
        FR
      </button>
      <button
        type="button"
        lang="en"
        aria-label="English"
        aria-pressed={i18n.resolvedLanguage === "en"}
        onClick={() => switchTo("en")}
      >
        ENG
      </button>
    </div>
  );
}
