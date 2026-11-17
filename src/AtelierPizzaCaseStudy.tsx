import AtelierGuidedDemo from "./AtelierGuidedDemo";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowUpRight, Check, PlayCircle } from "lucide-react";
import { asset } from "./data";
import { tr } from "./i18n";
import { currentLang, pathFor } from "./routes";
import CaseWords from "./CaseWords";
import { useAtelierMotion } from "./useAtelierMotion";
import { useAtelierPizzaFilm } from "./useAtelierPizzaFilm";
import "./case-study.scss";
import "./atelier-pizza.scss";

export default function AtelierPizzaCaseStudy({ onStart }: { onStart: () => void }) {
  const root = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  const { i18n } = useTranslation();
  useAtelierMotion(root, i18n.resolvedLanguage);
  useAtelierPizzaFilm(root);
  useLayoutEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (playing) video.current?.focus({ preventScroll: true });
  }, [playing]);
  const play = () => {
    if (!video.current) return;
    // Affectation au clic : Safari ne doit pas charger le film avant la demande.
    video.current.src = asset("atelier-wordpress-demo.mp4");
    setPlaying(true);
    setError(false);
    video.current.play().catch(() => setError(true));
  };
  return (
    <article
      className="case-study atelier-study"
      ref={root}
      aria-labelledby="atelier-title"
    >
      <div className="case-reading-progress" aria-hidden="true">
        <span />
      </div>
      <section className="case-hero shell atelier-intro">
        <a
          className="case-back"
          href={`${pathFor({ kind: "home" }, currentLang())}#work`}
        >
          <ArrowLeft size={16} /> {tr("Back to selected work")}
        </a>
        <p className="eyebrow">{tr("ATELIER PIZZA / PERSONAL WORDPRESS PROJECT")}</p>
        <h1
          className="case-title"
          id="atelier-title"
          ref={heading}
          tabIndex={-1}
          aria-label={`${tr("A fresh slice of")} ${tr("independence.")}`}
        >
          <CaseWords text={tr("A fresh slice of")} />{" "}
          <em>
            <CaseWords text={tr("independence.")} />
          </em>
        </h1>
        <div className="atelier-intro-details">
          <p>
            {tr(
              "A restaurant website with a menu the owner can actually update. A custom WordPress theme and a focused editing interface, developed as an independent personal project.",
            )}
          </p>
          <ul aria-label={tr("Project technologies")}>
            <li>WordPress</li>
            <li>PHP</li>
            <li>JavaScript</li>
            <li>GSAP</li>
          </ul>
        </div>
        <p className="atelier-project-note">
          {tr(
            "Fictional restaurant, recipes and prices. This project is not a commission for a real business.",
          )}
        </p>
      </section>

      <section
        className="atelier-unfold"
        data-film-mode="static"
        aria-labelledby="atelier-menu-title"
      >
        {/* La scène entière reste à l’écran : le titre accompagne le geste,
         * puis les détails prennent le relais dans le défilement normal. */}
        <div className="atelier-scene-track">
          <div className="atelier-pizza-stage">
            <div className="atelier-pizza-visual">
              {/* Le film est décoratif : le contenu commercial reste du texte.
               * Les deux images servent au chargement et au mouvement réduit. */}
              <div className="atelier-pizza-media">
                <img
                  className="atelier-film-intro"
                  src={asset("atelier-film/first-v1.webp")}
                  width="768"
                  height="512"
                  alt=""
                />
                <img
                  className="atelier-film-static"
                  src={asset("atelier-film/final-v1.webp")}
                  width="768"
                  height="512"
                  alt={tr(
                    "A pizza on a wooden board, with one slice missing and a few crumbs",
                  )}
                />
                <video
                  className="atelier-pizza-film"
                  muted
                  playsInline
                  preload="none"
                  tabIndex={-1}
                  aria-hidden="true"
                />
              </div>
            </div>
            <div className="atelier-reveal-copy">
              <p className="eyebrow">{tr("01 / A MENU THAT MOVES WITH YOU")}</p>
              <h2
                id="atelier-menu-title"
                aria-label={`${tr("Your menu.")} ${tr("In your hands.")}`}
              >
                <CaseWords text={tr("Your menu.")} />
                <br />
                <em>
                  <CaseWords text={tr("In your hands.")} />
                </em>
              </h2>
              <p className="atelier-scene-caption">
                {tr("A website to savour. A menu you control.")}
              </p>
              {/* Repères visuels uniquement : aucun live-region ne bavarde
               * pendant le scroll, et tout le contenu utile reste disponible. */}
              <div className="atelier-scene-beats" aria-hidden="true">
                {["Make an impression.", "Keep control.", "Make it your own."].map(
                  (label, index) => (
                    <span className="atelier-scene-beat" key={label}>
                      <small>0{index + 1}</small> {tr(label)}
                    </span>
                  ),
                )}
              </div>
            </div>
            <span className="atelier-scroll-label" aria-hidden="true">
              {tr("SCROLL FOR A TASTE")}
              <span className="atelier-scene-progress">
                <span />
              </span>
            </span>
          </div>
        </div>
        <div className="atelier-menu-details shell">
          <p>
            {tr(
              "Change a price, hide an unavailable pizza or announce a closure. Save in WordPress, then refresh the website. The layout stays consistent.",
            )}
          </p>
          <div className="atelier-menu-example">
            <span>{tr("EXAMPLE MENU ITEM")}</span>
            <strong>Margherita</strong>
            <p>
              29 cm <b>10,50 €</b> <span aria-hidden="true">/</span> 33 cm <b>11,50 €</b>
            </p>
            <small>{tr("Illustrative content from the personal project.")}</small>
          </div>
        </div>
      </section>

      <section className="atelier-web shell">
        <div className="atelier-section-copy atelier-reveal">
          <p className="eyebrow">{tr("02 / CLEAR ON EVERY SCREEN")}</p>
          <h2 aria-label={tr("Made to browse. Built to adapt.")}>
            <CaseWords text={tr("Made to browse. Built to adapt.")} />
          </h2>
          <p>
            {tr(
              "Categories, ingredients and two sizes with their prices. The interface is built for a quick look on a phone, with accessible filters and restrained motion.",
            )}
          </p>
        </div>
        <figure className="atelier-site-frame">
          <div className="atelier-site-viewport">
            <img
              src={asset("atelier-menu-desktop.webp")}
              alt={tr(
                "The Atelier Pizza menu with category filters and two prices per pizza",
              )}
              width="1440"
              height="1000"
              loading="lazy"
            />
          </div>
          <figcaption>
            {tr(
              "A real capture of the local WordPress prototype. All menu content is fictional.",
            )}
          </figcaption>
        </figure>
        <a
          className="understated-link"
          href={`${import.meta.env.BASE_URL}demos/atelier-pizza.html`}
          target="_blank"
          rel="noreferrer"
        >
          {tr("Open the static website preview")} <ArrowUpRight size={16} />
        </a>
      </section>

      <section className="atelier-editing">
        <div className="shell">
          <div className="atelier-section-copy atelier-reveal">
            <p className="eyebrow">{tr("03 / BEHIND THE MENU")}</p>
            <h2 aria-label={tr("Simple fields. Real control.")}>
              <CaseWords text={tr("Simple fields. Real control.")} />
            </h2>
            <p>
              {tr(
                "This recording shows a real update in the local WordPress administration: a price changes, a pizza is hidden, and the website reflects the saved content.",
              )}
            </p>
          </div>
          <AtelierGuidedDemo />
          <div className="atelier-demo-media atelier-reveal">
            <video
              ref={video}
              controls={playing}
              tabIndex={playing ? 0 : -1}
              muted
              playsInline
              loop
              preload="none"
              poster={asset("atelier-wordpress-poster.webp")}
              aria-label={tr("Recorded update of the Atelier Pizza menu in WordPress")}
              onError={() => setError(true)}
            />
            {!playing && (
              <button className="button primary atelier-play" onClick={play}>
                <PlayCircle size={21} /> {tr("Play the demonstration")}
              </button>
            )}
          </div>
          {error && (
            <p className="atelier-media-error" role="status">
              {tr(
                "The recording could not start. The editing screenshots below remain available.",
              )}
            </p>
          )}
          <div className="atelier-editor-grid">
            <figure className="atelier-reveal">
              <img
                src={asset("atelier-editor.webp")}
                alt={tr(
                  "WordPress editing fields for a pizza name, ingredients, two prices and visibility",
                )}
                width="1048"
                height="267"
                loading="lazy"
              />
              <figcaption>
                {tr(
                  "The owner edits content through named fields, rather than changing the page layout.",
                )}
              </figcaption>
            </figure>
            <ul className="atelier-checks atelier-reveal">
              {[
                "Prices for two sizes",
                "Add or temporarily hide a pizza",
                "Opening hours and closure announcements",
                "Photo changes through the media library",
              ].map((text) => (
                <li key={text}>
                  <Check size={17} aria-hidden="true" />
                  {tr(text)}
                </li>
              ))}
            </ul>
          </div>
          <p className="atelier-project-note">
            {tr(
              "The WordPress administration runs locally and is not publicly accessible. The online preview is static. No ordering or payment service is connected.",
            )}
          </p>
        </div>
      </section>
      <section className="case-contact atelier-contact">
        <div className="shell atelier-reveal">
          <p className="eyebrow">{tr("A WEBSITE YOU CAN KEEP UP TO DATE")}</p>
          <h2 aria-label={tr("Your menu evolves. Your website follows.")}>
            <CaseWords text={tr("Your menu evolves. Your website follows.")} />
          </h2>
          <p>
            {tr(
              "A new price, a seasonal recipe, an exceptional closure: keep control of your restaurant’s information. Let’s define the right website and editing tools for your business.",
            )}
          </p>
          <div className="case-contact-actions">
            <button className="button primary" onClick={onStart}>
              {tr("Let’s talk about your restaurant website")} <ArrowUpRight size={18} />
            </button>
            <a
              className="understated-link"
              href={`${pathFor({ kind: "home" }, currentLang())}#work`}
            >
              {tr("Back to selected work")} <ArrowLeft size={16} />
            </a>
          </div>
        </div>
      </section>
    </article>
  );
}
