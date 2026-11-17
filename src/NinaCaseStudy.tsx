import { useLayoutEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowUpRight, Image, Search, Accessibility } from "lucide-react";
import { asset } from "./data";
import { tr } from "./i18n";
import { currentLang, pathFor } from "./routes";
import CaseWords from "./CaseWords";
import { useNinaMotion } from "./useNinaMotion";
import "./case-study.scss";
import "./nina-case-study.scss";

const photographs = [
  {
    id: "concert",
    label: "Concert photography",
    alt: "Audience beneath the lights of a concert hall",
  },
  { id: "wedding", label: "Wedding photography", alt: "A newly married couple outdoors" },
  {
    id: "portrait",
    label: "Portrait photography",
    alt: "A woman photographed in natural light",
  },
];
const improvements = [
  {
    icon: Image,
    title: "Keep the image. Reduce the weight.",
    text: "Images were converted and optimised in WebP, so the photography could keep its place without carrying unnecessary file weight.",
  },
  {
    icon: Search,
    title: "Give the content a clear structure.",
    text: "Semantic HTML and search metadata were improved to describe the content more clearly to search engines.",
  },
  {
    icon: Accessibility,
    title: "Make the details more accessible.",
    text: "Alternative text and the HTML structure were reviewed to improve access to the photographs and page content.",
  },
];
const audits = [
  { label: "Performance", before: 56, after: 94 },
  { label: "Accessibility", before: 68, after: 100 },
  { label: "SEO", before: 73, after: 100 },
];

/** Une étude d’optimisation, pas une refonte attribuée à tort.
 * Les photos et captures viennent de la démo ; les scores historiques sont
 * ceux publiés dans le portfolio, avec une source explicite et sans audit simulé.
 */
export default function NinaCaseStudy({ onStart }: { onStart: () => void }) {
  const root = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const { i18n } = useTranslation();
  useNinaMotion(root, i18n.resolvedLanguage);
  useLayoutEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);

  return (
    <article
      className="case-study nina-study"
      ref={root}
      aria-labelledby="case-nina-title"
    >
      <div className="case-reading-progress" aria-hidden="true">
        <span />
      </div>
      <section className="case-hero shell nina-intro">
        <a
          className="case-back"
          href={`${pathFor({ kind: "home" }, currentLang())}#work`}
        >
          <ArrowLeft size={16} /> {tr("Back to selected work")}
        </a>
        <p className="eyebrow nina-intro-reveal">
          {tr("NINA CARDUCCI / WEBSITE OPTIMISATION")}
        </p>
        <div className="nina-intro-grid">
          <h1
            className="case-title nina-title"
            id="case-nina-title"
            ref={heading}
            tabIndex={-1}
            aria-label={`${tr("Less weight.")} ${tr("More impact.")}`}
          >
            <CaseWords text={tr("Less weight.")} />
            <br />
            <em>
              <CaseWords text={tr("More impact.")} />
            </em>
          </h1>
          <div className="nina-intro-reveal nina-brief">
            <p>
              {tr(
                "A frontend training project focused on performance, SEO and accessibility. Improve an existing photography website while preserving its visual identity.",
              )}
            </p>
            <ul className="nina-tech" aria-label={tr("Project technologies")}>
              <li>HTML</li>
              <li>WebP</li>
              <li>Lighthouse</li>
              <li>SEO</li>
            </ul>
          </div>
        </div>
        <figure className="nina-cover">
          <div className="nina-cover-window">
            <img
              className="nina-cover-photo"
              src={asset("nina-study-cover.webp")}
              alt={tr(
                "A man crossing a striped pedestrian crossing, from the Nina Carducci website",
              )}
              width="1440"
              height="666"
              fetchPriority="high"
            />
            <div className="nina-viewfinder" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <span>01 / NINA CARDUCCI</span>
            </div>
          </div>
          <figcaption>
            <span>{tr("The photography stays in focus.")}</span>
            <span>{tr("Optimisation of an existing website · Training project")}</span>
          </figcaption>
        </figure>
      </section>

      <section className="nina-gallery-section">
        <div className="shell">
          <div className="nina-gallery-heading nina-reveal">
            <p className="eyebrow">{tr("01 / PRESERVE THE VISUAL STORY")}</p>
            <h2 aria-label={tr("Every frame deserves its space.")}>
              <CaseWords text={tr("Every frame deserves its space.")} />
            </h2>
            <p>
              {tr(
                "The brief was to improve the website, not replace its identity. Its photographs, gallery and visual character remain at the centre of the experience.",
              )}
            </p>
          </div>
          <div className="nina-contact-sheet">
            {photographs.map((photo, index) => (
              <figure className={`nina-print nina-print-${index}`} key={photo.id}>
                <div className="nina-print-window">
                  <img
                    src={asset(`nina-study-${photo.id}.webp`)}
                    alt={tr(photo.alt)}
                    width="650"
                    height="850"
                    loading="lazy"
                  />
                </div>
                <figcaption>
                  <span>0{index + 1}</span>
                  <span>{tr(photo.label)}</span>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="nina-gallery-footnote nina-reveal">
            <span>{tr("Photographs from the original project.")}</span>
            <span>{tr("A lighter website. The same visual identity.")}</span>
          </div>
        </div>
      </section>

      <section className="nina-work shell">
        <div className="nina-work-heading nina-reveal">
          <p className="eyebrow">{tr("02 / THE WORK BEHIND THE PICTURE")}</p>
          <h2 aria-label={tr("Small technical changes. A clearer experience.")}>
            <CaseWords text={tr("Small technical changes. A clearer experience.")} />
          </h2>
          <p>
            {tr(
              "My role was to analyse the existing frontend, identify improvements and apply them without disrupting the site’s appearance or functionality.",
            )}
          </p>
        </div>
        <div className="nina-improvements">
          {improvements.map(({ icon: Icon, title, text }, index) => (
            <div className="nina-improvement nina-reveal" key={title}>
              <div className="nina-improvement-number">
                <span>0{index + 1}</span>
                <Icon size={23} aria-hidden="true" />
              </div>
              <h3>{tr(title)}</h3>
              <p>{tr(text)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="nina-results">
        <div className="shell nina-results-grid">
          <div className="nina-results-copy nina-reveal">
            <p className="eyebrow">{tr("03 / DOCUMENTED AUDIT RESULTS")}</p>
            <h2 aria-label={tr("Progress you can read.")}>
              <CaseWords text={tr("Progress you can read.")} />
            </h2>
            <p>
              {tr(
                "Lighthouse audits were used to compare the project before and after optimisation. These are the results documented in my portfolio, rather than a live audit of the site today.",
              )}
            </p>
            <a
              className="understated-link"
              href="https://portfolio-swart-psi-26.vercel.app/projects/nina-carducci"
              target="_blank"
              rel="noreferrer"
            >
              {tr("View the documented project")} <ArrowUpRight size={16} />
            </a>
          </div>
          <div className="nina-audits">
            {audits.map((audit) => (
              <div className="nina-audit" key={audit.label}>
                <h3>{tr(audit.label)}</h3>
                <p className="nina-audit-values">
                  <span>
                    {tr("Before")} <b>{audit.before}</b>
                  </span>
                  <span aria-hidden="true">→</span>
                  <span>
                    {tr("After")}{" "}
                    <strong>
                      {audit.after}
                      <small>/100</small>
                    </strong>
                  </span>
                </p>
                <div className="nina-audit-track" aria-hidden="true">
                  <span
                    className="nina-audit-before"
                    style={{ width: `${audit.before}%` }}
                  />
                  <span
                    className="nina-audit-after"
                    style={{ width: `${audit.after}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="nina-preview shell">
        <div className="nina-preview-copy nina-reveal">
          <p className="eyebrow">{tr("04 / THE WEBSITE IN CONTEXT")}</p>
          <h2 aria-label={tr("The whole picture, on every screen.")}>
            <CaseWords text={tr("The whole picture, on every screen.")} />
          </h2>
          <p>
            {tr(
              "The final website keeps its photography-led layout, filterable gallery and service information. These are real desktop and mobile captures of the deployed project.",
            )}
          </p>
          <a
            className="understated-link"
            href="https://existing-prog.github.io/projet-4/"
            target="_blank"
            rel="noreferrer"
          >
            {tr("Explore the Nina Carducci website")} <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="nina-device-scene">
          <figure className="nina-desktop">
            <div className="nina-browser-bar" aria-hidden="true">
              <span>● ● ●</span>
              <span>Nina Carducci</span>
              <ArrowUpRight size={14} />
            </div>
            <img
              src={asset("nina-study-home.webp")}
              alt={tr("Actual desktop homepage of the Nina Carducci photography website")}
              width="1440"
              height="1000"
              loading="lazy"
            />
          </figure>
          <figure className="nina-mobile">
            <img
              src={asset("nina-study-phone.webp")}
              alt={tr("Actual mobile homepage of the Nina Carducci photography website")}
              width="390"
              height="844"
              loading="lazy"
            />
          </figure>
        </div>
      </section>

      <section className="case-contact nina-contact">
        <div className="shell nina-reveal">
          <p className="eyebrow">{tr("A FRESH LOOK AT YOUR EXISTING WEBSITE")}</p>
          <h2 aria-label={`${tr("Your website, with")} ${tr("a little more care.")}`}>
            <CaseWords text={tr("Your website, with")} />{" "}
            <em>
              <CaseWords text={tr("a little more care.")} />
            </em>
          </h2>
          <p>
            {tr(
              "Already have a website? Let’s identify the frontend updates, accessibility fixes or performance improvements that would make a difference.",
            )}
          </p>
          <div className="case-contact-actions">
            <button className="button primary" onClick={onStart}>
              {tr("Discuss website improvements")} <ArrowUpRight size={19} />
            </button>
            <a
              className="understated-link"
              href="https://github.com/existing-prog/projet-4"
              target="_blank"
              rel="noreferrer"
            >
              {tr("View the project code")} <ArrowUpRight size={16} />
            </a>
          </div>
          <a
            className="case-back case-back-bottom"
            href={`${pathFor({ kind: "home" }, currentLang())}#work`}
          >
            <ArrowLeft size={16} /> {tr("Back to selected work")}
          </a>
        </div>
      </section>
    </article>
  );
}
