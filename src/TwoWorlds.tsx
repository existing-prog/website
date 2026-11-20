import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslation } from "react-i18next";
import { ArrowUpRight } from "lucide-react";
import { asset } from "./data";
import { tr } from "./i18n";
import { currentLang, pathFor } from "./routes";
import { HEATWAVES, chartArea, chartLine, chartPoints } from "./academicChart";
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
        // 3. Chaque univers apparaît : courbe de recherche à gauche, devanture à droite.
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
          .fromTo(q(".tw-storefront"), { scale: 1.12 }, { scale: 1, duration: 0.5 }, 0.3)
          .fromTo(
            q(".tw-chart"),
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
                {/* Même univers que la maquette de la page chercheurs : une courbe de données. */}
                <svg className="tw-chart" viewBox="0 0 100 60">
                  <defs>
                    <linearGradient id="tw-area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#f1c27d" stopOpacity="0.4" />
                      <stop offset="1" stopColor="#f1c27d" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={chartArea} fill="url(#tw-area)" />
                  <path className="tw-chart-line" d={chartLine} />
                  {HEATWAVES.map((i) => (
                    <circle key={i} cx={chartPoints[i].x} cy={chartPoints[i].y} r="1.6" />
                  ))}
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
                  className="tw-storefront"
                  src={asset("local-storefront-640.webp")}
                  alt=""
                  width="640"
                  height="427"
                  decoding="async"
                  loading="lazy"
                />
              </span>
              <span className="tw-copy">
                <span className="eyebrow">{tr("FOR RESTAURANTS AND SHOPS")}</span>
                <strong>
                  {tr("Give people a reason")} {tr("to walk in.")}
                </strong>
                <span className="tw-link">
                  {tr("Discover websites for restaurants and shops")}
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
