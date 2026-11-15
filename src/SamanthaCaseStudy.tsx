import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowUpRight, ArrowRight, Check, PlayCircle } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { asset, projects } from "./data";
import { tr } from "./i18n";
import "./samantha-case-study.scss";

gsap.registerPlugin(ScrollTrigger);

/** Étude intégrée, chargée uniquement à l’ouverture de sa route.
 * Les médias sont des captures du vrai portfolio ; la vidéo reste à la demande.
 * Le formulaire et les brouillons appartiennent toujours à App.
 */
export default function SamanthaCaseStudy({ onStart }: { onStart: () => void }) {
  const root = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [demoReady, setDemoReady] = useState(false);
  const [demoError, setDemoError] = useState(false);
  // preload n’est qu’un indice navigateur. Ne donner la source qu’au clic garantit
  // l’absence de téléchargement anticipé, y compris sur WebKit.
  const playDemo = () => {
    const element = video.current;
    if (!element) return;
    element.src = asset("samantha-orbital-demo.mp4");
    setDemoReady(true);
    setDemoError(false);
    element.play().catch(() => setDemoError(true));
    requestAnimationFrame(() => video.current?.focus({ preventScroll: true }));
  };
  const { i18n } = useTranslation();
  useLayoutEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  useLayoutEffect(() => {
    const page = root.current;
    if (!page) return;
    let alive = true;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        page.querySelectorAll(".case-intro-reveal"),
        { y: 22, opacity: 0.25 },
        { y: 0, opacity: 1, duration: 0.85, stagger: 0.09, ease: "power2.out" },
      );
      page.querySelectorAll<HTMLElement>(".case-reveal").forEach((section) => {
        gsap.fromTo(
          section,
          { y: 32, opacity: 0.25 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: section,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          },
        );
      });
      // Redressement contenu dans le visuel. Ni pin ni espace de scroll ajouté.
      gsap.fromTo(
        page.querySelector(".case-hero-image"),
        { rotationX: 8, rotationY: -5, y: 24 },
        {
          rotationX: 0,
          rotationY: 0,
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: page.querySelector(".case-hero-art"),
            start: "top 85%",
            end: "top 22%",
            scrub: 0.55,
          },
        },
      );
    });
    const refresh = () => {
      if (alive) ScrollTrigger.refresh();
    };
    document.fonts.ready.then(refresh);
    const images = page.querySelectorAll("img");
    images.forEach((image) => image.addEventListener("load", refresh));
    return () => {
      alive = false;
      images.forEach((image) => image.removeEventListener("load", refresh));
      media.revert();
    };
  }, [i18n.resolvedLanguage]);

  return (
    <article className="case-study" ref={root} aria-labelledby="case-samantha-title">
      <section className="case-hero shell">
        <a className="case-back" href="#work">
          <ArrowLeft size={16} /> {tr("Back to selected work")}
        </a>
        <p className="eyebrow case-intro-reveal">
          {tr("SAMANTHA RAMSEY / SCIENTIFIC PORTFOLIO")}
        </p>
        <h1
          id="case-samantha-title"
          className="case-title case-intro-reveal"
          ref={heading}
          tabIndex={-1}
        >
          {tr("Research takes on a new")} <em>{tr("dimension.")}</em>
        </h1>
        <p className="case-lead case-intro-reveal">
          {tr(
            "A distinctive portfolio that brings research, publications and interactive exploration into one coherent experience.",
          )}
        </p>
        <dl className="case-meta case-intro-reveal">
          <div>
            <dt>{tr("Project")}</dt>
            <dd>{tr("Academic portfolio")}</dd>
          </div>
          <div>
            <dt>{tr("My role")}</dt>
            <dd>{tr("Interface design & frontend development")}</dd>
          </div>
          <div>
            <dt>{tr("Experience")}</dt>
            <dd>{tr("Desktop, mobile & interactive demonstrations")}</dd>
          </div>
        </dl>
        <figure className="case-hero-art">
          <img
            className="case-hero-image"
            src={asset("samantha-current.webp")}
            alt={tr("Samantha Ramsey portfolio homepage with its Neptune illustration")}
            width="1434"
            height="807"
            fetchPriority="high"
          />
          <figcaption>
            {tr("Samantha Ramsey — Astrodynamics & Celestial Mechanics Research")}
          </figcaption>
        </figure>
      </section>

      <section className="case-overview shell case-reveal">
        <div>
          <p className="eyebrow">{tr("01 / THE BRIEF")}</p>
          <h2>{tr("Make a scientific world approachable.")}</h2>
        </div>
        <div className="case-copy">
          <p>
            {tr(
              "Give Samantha’s research a personal, recognisable home, while making the journal, publications and simulations easy to explore.",
            )}
          </p>
          <p>
            {tr(
              "My work focused on the interface: visual identity, responsive layouts, navigation and the presentation of interactive content.",
            )}
          </p>
          <ul className="case-checks">
            {[
              "A clear route through different types of research content",
              "An identity inspired by the subject, with content in the foreground",
              "Consistent navigation across desktop and mobile",
            ].map((text) => (
              <li key={text}>
                <Check size={17} /> {tr(text)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="case-design shell">
        <div className="case-section-heading case-reveal">
          <p className="eyebrow">{tr("02 / DESIGN & READING")}</p>
          <h2>
            {tr("A sense of discovery.")}
            <br />
            <span>{tr("Room for the substance.")}</span>
          </h2>
          <p>
            {tr(
              "Orbital references and a restrained palette establish the atmosphere. Clear headings, spacing and page structure give the research room to be read.",
            )}
          </p>
        </div>
        <figure className="case-journal case-reveal">
          <img
            src={asset("samantha-journal.webp")}
            alt={tr(
              "Research journal page showing the portfolio’s typography and content structure",
            )}
            width="1280"
            height="850"
            loading="lazy"
          />
          <figcaption>
            {tr("A real view of the research journal, within the same visual identity.")}
          </figcaption>
        </figure>
      </section>

      <section className="case-demo">
        <div className="shell">
          <div className="case-section-heading case-reveal">
            <p className="eyebrow">{tr("03 / INTERACTION IN CONTEXT")}</p>
            <h2>{tr("Motion you can explore.")}</h2>
            <p>
              {tr(
                "The portfolio connects scientific explanations with interactive demonstrations. This recording shows the elliptical-orbit demo and its eccentricity control in use.",
              )}
            </p>
          </div>
          <figure className="case-demo-media case-reveal">
            <div className="case-video-wrap">
              <video
                ref={video}
                controls={demoReady}
                tabIndex={demoReady ? 0 : -1}
                muted
                playsInline
                loop
                preload="none"
                poster={asset("samantha-demo-poster.webp")}
                aria-label={tr(
                  "Recorded demonstration of the portfolio’s elliptical-orbit interaction",
                )}
              >
                {tr(
                  "Your browser cannot play this recording. You can explore the live portfolio instead.",
                )}
              </video>
              {!demoReady && (
                <button className="button primary case-demo-play" onClick={playDemo}>
                  <PlayCircle size={22} /> {tr("Play the demonstration")}
                </button>
              )}
            </div>
            {demoError && (
              <p className="case-media-error" role="status">
                {tr(
                  "The recording could not start. Try the original demonstration below.",
                )}
              </p>
            )}
            <figcaption>
              {tr(
                "Recorded from the real portfolio. Play or pause the demonstration using the video controls.",
              )}
            </figcaption>
          </figure>
          <a
            className="case-live-link"
            href="https://samantharamsey.github.io/portfolio_samantha/simulations/#ellipse"
            target="_blank"
            rel="noreferrer"
          >
            {tr("Try the original demonstration")} <ArrowUpRight size={17} />
          </a>
        </div>
      </section>

      <section className="case-mobile shell">
        <div className="case-mobile-copy case-reveal">
          <p className="eyebrow">{tr("04 / SMALLER SCREEN, SAME CARE")}</p>
          <h2>
            {tr("A complete portfolio.")}
            <br />
            <span>{tr("In your hand.")}</span>
          </h2>
          <p>
            {tr(
              "The layout adapts to a smaller screen: navigation remains accessible, headings reflow and content follows a readable vertical rhythm.",
            )}
          </p>
          <p>
            {tr(
              "A real mobile capture makes the layout and navigation on a phone easy to see.",
            )}
          </p>
        </div>
        <figure className="case-phone case-reveal">
          <img
            src={asset("samantha-mobile.webp")}
            alt={tr("Actual mobile view of Samantha Ramsey’s portfolio homepage")}
            width="390"
            height="844"
            loading="lazy"
          />
          <figcaption>{tr("Mobile view · captured at 390 px wide")}</figcaption>
        </figure>
      </section>

      <section className="case-contact">
        <div className="shell case-reveal">
          <p className="eyebrow">{tr("YOUR OWN NEXT CHAPTER")}</p>
          <h2>
            {tr("Your expertise deserves")} <em>{tr("its own space.")}</em>
          </h2>
          <p>
            {tr(
              "A personal portfolio, a clear story and an experience that feels like you. Let’s discuss what yours could become.",
            )}
          </p>
          <div className="case-contact-actions">
            <button className="button primary" onClick={onStart}>
              {tr("Start a portfolio project")} <ArrowUpRight size={19} />
            </button>
            <a
              className="understated-link"
              href={projects[0].url}
              target="_blank"
              rel="noreferrer"
            >
              {tr("Visit Samantha’s portfolio")} <ArrowUpRight size={16} />
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
