import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowUpRight, Layers, Route, PanelTop } from "lucide-react";
import { asset } from "./data";
import { tr } from "./i18n";
import CaseWords from "./CaseWords";
import { useKasaMotion } from "./useKasaMotion";
import "./case-study.scss";
import "./kasa-case-study.scss";

const steps = [
  {
    id: "browse",
    label: "Discover the catalogue",
    title: "Start with the possibilities.",
    text: "A consistent grid of property cards makes the catalogue easy to scan. Each card opens the corresponding accommodation page.",
    image: "kasa-study-home.webp",
    alt: "Kasa homepage with its property catalogue",
    height: 850,
  },
  {
    id: "property",
    label: "Open a property",
    title: "The right details, in one place.",
    text: "Dynamic routes connect the selected accommodation to its photos, location, host, rating and amenities. The interface is populated from JSON data.",
    image: "kasa-study-property.webp",
    alt: "Kasa accommodation page with photos, host and property information",
    height: 1061,
  },
  {
    id: "interact",
    label: "Explore the details",
    title: "Explore without losing your place.",
    text: "The image carousel and expandable information sections keep the property page compact, while letting visitors choose which details to explore.",
    image: "kasa-study-gallery.webp",
    alt: "Kasa property gallery displaying another photo alongside expandable details",
    height: 1061,
  },
];

/** Étude Kasa : un parcours produit en trois étapes, à partir de vraies captures.
 * La scène sticky est décorative ; les chapitres restent accessibles et les petits
 * écrans affichent les captures directement dans le flux de lecture.
 */
export default function KasaCaseStudy({ onStart }: { onStart: () => void }) {
  const root = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const { i18n } = useTranslation();
  useKasaMotion(root, i18n.resolvedLanguage, setActiveStep);
  useLayoutEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  const jump = (index: number) => {
    document.getElementById(`kasa-step-${steps[index].id}`)?.scrollIntoView({
      block: "center",
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };

  return (
    <article
      className="case-study kasa-study"
      ref={root}
      aria-labelledby="case-kasa-title"
    >
      <div className="case-reading-progress" aria-hidden="true">
        <span />
      </div>
      <section className="case-hero shell kasa-intro">
        <a className="case-back" href="#work">
          <ArrowLeft size={16} /> {tr("Back to selected work")}
        </a>
        <p className="eyebrow kasa-intro-reveal">{tr("KASA / REACT RENTAL INTERFACE")}</p>
        <div className="kasa-intro-grid">
          <h1
            className="case-title kasa-title"
            id="case-kasa-title"
            ref={heading}
            tabIndex={-1}
            aria-label={`${tr("A place to feel")} ${tr("at home.")}`}
          >
            <CaseWords text={tr("A place to feel")} />{" "}
            <em>
              <CaseWords text={tr("at home.")} />
            </em>
          </h1>
          <div className="kasa-brief kasa-intro-reveal">
            <p>
              {tr(
                "A frontend training project: turning supplied designs into a responsive rental interface, with dynamic property pages and reusable React components.",
              )}
            </p>
            <ul className="kasa-tech" aria-label={tr("Project technologies")}>
              <li>React</li>
              <li>React Router</li>
              <li>SCSS</li>
              <li>JSON</li>
            </ul>
          </div>
        </div>
        <figure className="kasa-hero-art">
          <div className="kasa-hero-setting" aria-hidden="true">
            <span />
            <span />
          </div>
          <div className="kasa-hero-browser">
            <img
              src={asset("kasa-study-home.webp")}
              alt={tr("Kasa homepage with its property catalogue")}
              width="1280"
              height="850"
              fetchPriority="high"
            />
          </div>
          <div className="kasa-hero-phone">
            <img
              src={asset("kasa-study-phone-property.webp")}
              alt={tr("Actual mobile Kasa property page")}
              width="390"
              height="844"
            />
          </div>
          <figcaption>
            {tr("One interface, from the first overview to the property details.")}
          </figcaption>
        </figure>
      </section>

      <section className="kasa-journey">
        <div className="shell">
          <div className="kasa-section-heading kasa-reveal">
            <p className="eyebrow">{tr("01 / A CLEAR USER JOURNEY")}</p>
            <h2 aria-label={tr("From browsing to a closer look.")}>
              <CaseWords text={tr("From browsing to a closer look.")} />
            </h2>
            <p>
              {tr(
                "Three moments in the same application. Scroll through the journey to see how the interface connects them.",
              )}
            </p>
          </div>
          <div className="kasa-flow-layout">
            <div className="kasa-flow-stage">
              <div className="kasa-flow-art" aria-hidden="true">
                {steps.map((step, index) => (
                  <div
                    className="kasa-flow-shot"
                    data-active={activeStep === index}
                    key={step.id}
                  >
                    <img
                      src={asset(step.image)}
                      alt=""
                      width="1280"
                      height={step.height}
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
              <div className="kasa-flow-footer">
                <span>{tr(steps[activeStep].label)}</span>
                <nav aria-label={tr("Explore the Kasa journey")}>
                  {steps.map((step, index) => (
                    <button
                      key={step.id}
                      aria-label={tr("Show step {{number}}: {{title}}", {
                        number: index + 1,
                        title: tr(step.label),
                      })}
                      aria-pressed={activeStep === index}
                      onClick={() => jump(index)}
                    >
                      0{index + 1}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
            <div className="kasa-flow-chapters">
              {steps.map((step, index) => (
                <section
                  className="kasa-flow-chapter"
                  id={`kasa-step-${step.id}`}
                  data-step={index}
                  data-active={activeStep === index}
                  key={step.id}
                >
                  <figure className="kasa-inline-preview">
                    <img
                      src={asset(step.image)}
                      alt={tr(step.alt)}
                      width="1280"
                      height={step.height}
                      loading="lazy"
                    />
                  </figure>
                  <div className="kasa-chapter-copy">
                    <span className="kasa-step-number">
                      0{index + 1}
                      <small> / 03</small>
                    </span>
                    <h3>{tr(step.title)}</h3>
                    <p>{tr(step.text)}</p>
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="kasa-system shell">
        <div className="kasa-section-heading kasa-reveal">
          <p className="eyebrow">{tr("02 / THE FRONTEND FOUNDATION")}</p>
          <h2 aria-label={tr("A consistent system behind every screen.")}>
            <CaseWords text={tr("A consistent system behind every screen.")} />
          </h2>
          <p>
            {tr(
              "The challenge was to translate the designs into a working application, with predictable navigation and layouts that adapt across screens.",
            )}
          </p>
        </div>
        <div className="kasa-components">
          {[
            {
              icon: Layers,
              title: "Reusable components",
              text: "Cards, banners, expandable panels and the carousel share reusable React patterns, so the interface stays consistent across pages.",
            },
            {
              icon: Route,
              title: "Dynamic navigation",
              text: "React Router connects the catalogue and property pages. Invalid routes or property identifiers lead to a dedicated 404 page.",
            },
            {
              icon: PanelTop,
              title: "Responsive layouts",
              text: "SCSS adapts spacing, typography, the property grid and the details layout to desktop, tablet and mobile screens.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <div className="kasa-component kasa-reveal" key={title}>
              <Icon size={25} aria-hidden="true" />
              <h3>{tr(title)}</h3>
              <p>{tr(text)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="kasa-responsive shell">
        <div className="kasa-device-pair">
          <figure className="kasa-device kasa-device-home">
            <img
              src={asset("kasa-study-phone-home.webp")}
              alt={tr("Actual mobile Kasa catalogue")}
              width="390"
              height="844"
              loading="lazy"
            />
          </figure>
          <figure className="kasa-device kasa-device-property">
            <img
              src={asset("kasa-study-phone-property.webp")}
              alt={tr("Actual mobile Kasa property page")}
              width="390"
              height="844"
              loading="lazy"
            />
          </figure>
        </div>
        <div className="kasa-responsive-copy kasa-reveal">
          <p className="eyebrow">{tr("03 / BUILT TO ADAPT")}</p>
          <h2 aria-label={tr("Different screens. The same journey.")}>
            <CaseWords text={tr("Different screens. The same journey.")} />
          </h2>
          <p>
            {tr(
              "The catalogue and property details keep their hierarchy on a phone. The layout changes, while navigation and interactions remain familiar.",
            )}
          </p>
          <p className="kasa-capture-note">
            {tr("Real captures of the application at 390 px wide.")}
          </p>
        </div>
      </section>

      <section className="case-contact kasa-contact">
        <div className="shell kasa-reveal">
          <p className="eyebrow">{tr("YOUR NEXT DIGITAL SPACE")}</p>
          <h2 aria-label={`${tr("Make your next website")} ${tr("feel effortless.")}`}>
            <CaseWords text={tr("Make your next website")} />{" "}
            <em>
              <CaseWords text={tr("feel effortless.")} />
            </em>
          </h2>
          <p>
            {tr(
              "A clear structure, thoughtful interactions and a website that works across screens. Let’s discuss the right starting point for your business.",
            )}
          </p>
          <div className="case-contact-actions">
            <button className="button primary" onClick={onStart}>
              {tr("Start a website project")} <ArrowUpRight size={19} />
            </button>
            <a
              className="understated-link"
              href="https://existing-prog.github.io/projet-5/"
              target="_blank"
              rel="noreferrer"
            >
              {tr("Explore the Kasa demo")} <ArrowUpRight size={16} />
            </a>
          </div>
          <a className="case-back case-back-bottom" href="#work">
            <ArrowLeft size={16} /> {tr("Back to selected work")}
          </a>
        </div>
      </section>
    </article>
  );
}
