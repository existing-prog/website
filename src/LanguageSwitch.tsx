import { useTranslation } from "react-i18next";
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
        onClick={() => void i18n.changeLanguage("fr")}
      >
        FR
      </button>
      <button
        type="button"
        lang="en"
        aria-label="English"
        aria-pressed={i18n.resolvedLanguage === "en"}
        onClick={() => void i18n.changeLanguage("en")}
      >
        ENG
      </button>
    </div>
  );
}
