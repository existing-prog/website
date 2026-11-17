import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslation } from "react-i18next";
import { ArrowUpRight } from "lucide-react";
import { asset } from "./data";
import { tr } from "./i18n";
import { currentLang, pathFor } from "./routes";
import { ORBITS, orbitPoint } from "./academicOrbits";
import "./two-worlds.scss";
gsap.registerPlugin(ScrollTrigger);

/**
 * Scène d’accueil « Deux univers » : une carte unique pose la question, puis se
 * scinde au scroll en deux panneaux qui mènent chacun à sa page spécialisée.
 * Sans mouvement (préférence, téléphone, écran bas), les deux panneaux sont
 * simplement affichés, et ce sont de vrais liens dans tous les cas.
 */
export default function TwoWorlds() {
  const root = useRef<HTMLElement>(null);
  const { i18n } = useTranslation();
  const lang = currentLang();

  useLayoutEffect(() => {
    const section = root.current;
    if (!section) return;
    const q = (s: string) => section.querySelector<HTMLElement>(s)!;
    const media = gsap.matchMedia();
    media.add(
      "(min-width: 1024px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)",
      () => {
        section.dataset.scene = "animated";
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: q(".tw-track"),
            start: "top top",
            end: "bottom bottom",
            scrub: 0.6,
            invalidateOnRefresh: true,
            onUpdate: ({ progress }) => {
              section.dataset.phase =
                progress < 0.3 ? "question" : progress < 0.7 ? "split" : "worlds";
            },
          },
        });
        // 1. La question s’efface.
        tl.to(q(".tw-question"), { opacity: 0, scale: 0.92, duration: 0.25 }, 0.05);
        // 2. La carte se scinde : chaque moitié part de son côté et s’agrandit.
        tl.fromTo(
          q(".tw-world-academic"),
          {
            xPercent: 0,
            scale: 0.82,
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
          },
          {
            xPercent: -4,
            scale: 1,
            borderTopRightRadius: 24,
            borderBottomRightRadius: 24,
            duration: 0.45,
            ease: "power2.inOut",
          },
          0.2,
        ).fromTo(
          q(".tw-world-restaurants"),
          { xPercent: 0, scale: 0.82, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
          {
            xPercent: 4,
            scale: 1,
            borderTopLeftRadius: 24,
            borderBottomLeftRadius: 24,
            duration: 0.45,
            ease: "power2.inOut",
          },
          0.2,
        );
        // 3. Chaque univers apparaît : nuit et orbites à gauche, rouge tomate à droite.
        tl.fromTo(
          q(".tw-world-academic .tw-veil"),
          { opacity: 1 },
          { opacity: 0, duration: 0.25 },
          0.18,
        )
          .fromTo(
            q(".tw-world-restaurants .tw-veil"),
            { opacity: 1 },
            { opacity: 0, duration: 0.25 },
            0.18,
          )
          .fromTo(
            section.querySelectorAll(".tw-copy > *"),
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.03, duration: 0.12 },
            0.36,
          )
          .fromTo(
            q(".tw-pizza"),
            { rotation: -40, scale: 0.7 },
            { rotation: 0, scale: 1, duration: 0.5 },
            0.3,
          )
          .fromTo(
            q(".tw-orbits"),
            { rotation: 30, scale: 0.7 },
            { rotation: 0, scale: 1, duration: 0.5 },
            0.3,
          )
          .to({}, { duration: 0.08 }, 0.92);
        return () => {
          section.dataset.scene = "static";
          delete section.dataset.phase;
        };
      },
    );
    return () => media.revert();
  }, [i18n.resolvedLanguage]);

  return (
    <section
      className="tw-section"
      id="worlds"
      ref={root}
      data-scene="static"
      aria-labelledby="tw-title"
    >
      <div className="tw-track">
        <div className="tw-stage shell">
          <div className="tw-question">
            <p className="eyebrow">{tr("TWO WORLDS. THE SAME CARE.")}</p>
            <h2 id="tw-title">{tr("Who is your website for?")}</h2>
            <p>{tr("Scroll to choose your world.")}</p>
          </div>
          <div className="tw-worlds">
            <a
              className="tw-world tw-world-academic"
              href={pathFor({ kind: "landing", id: "academic" }, lang)}
            >
              <span className="tw-art" aria-hidden="true">
                <span className="tw-stars" />
                <svg className="tw-orbits" viewBox="0 0 100 100">
                  {ORBITS.map((orbit, i) => {
                    const point = orbitPoint(orbit, 0.15);
                    return (
                      <g key={i}>
                        <ellipse
                          cx="50"
                          cy="50"
                          rx={orbit.rx}
                          ry={orbit.ry}
                          transform={`rotate(${orbit.tilt} 50 50)`}
                        />
                        <circle cx={point.x} cy={point.y} r="1.6" />
                      </g>
                    );
                  })}
                  <circle className="tw-sun" cx="50" cy="50" r="4" />
                </svg>
              </span>
              <span className="tw-copy">
                <span className="eyebrow">{tr("FOR RESEARCHERS AND PHD STUDENTS")}</span>
                <strong>{tr("Your research deserves more than a PDF.")}</strong>
                <span className="tw-link">
                  {tr("Discover research portfolios")} <ArrowUpRight size={18} />
                </span>
              </span>
              <span className="tw-veil" aria-hidden="true" />
            </a>
            <a
              className="tw-world tw-world-restaurants"
              href={pathFor({ kind: "landing", id: "restaurants" }, lang)}
            >
              <span className="tw-art" aria-hidden="true">
                <img
                  className="tw-pizza"
                  src={asset("atelier-pizza-whole.webp")}
                  alt=""
                  loading="lazy"
                />
                <img
                  className="tw-basil tw-basil-1"
                  src={asset("pizza-burst/basil.webp")}
                  alt=""
                  loading="lazy"
                />
                <img
                  className="tw-basil tw-basil-2"
                  src={asset("pizza-burst/basil.webp")}
                  alt=""
                  loading="lazy"
                />
              </span>
              <span className="tw-copy">
                <span className="eyebrow">{tr("FOR RESTAURANTS AND SHOPS")}</span>
                <strong>{tr("Websites that make people hungry.")}</strong>
                <span className="tw-link">
                  {tr("Discover the restaurant offer")} <ArrowUpRight size={18} />
                </span>
              </span>
              <span className="tw-veil" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
