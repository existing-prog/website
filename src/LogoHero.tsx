import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { tr } from "./i18n";
import { LogoParticles } from "./logoParticles";
import "./logo-hero.scss";
gsap.registerPlugin(ScrollTrigger);

/**
 * Ouverture de l’accueil : une poussière de particules se rassemble au scroll
 * pour former le logo « lb. », derrière l’accroche. Le titre s’efface en douceur,
 * puis une phrase prend le relais. Les particules dérivent doucement et
 * s’écartent au passage de la souris.
 * Mouvement réduit, écran bas et pré-rendu : logo fixe, sans piste de scroll.
 */
export default function LogoHero({ onStart }: { onStart: () => void }) {
  const root = useRef<HTMLElement>(null);
  const { i18n } = useTranslation();

  useLayoutEffect(() => {
    const hero = root.current;
    if (!hero) return;
    const q = (s: string) => hero.querySelector<HTMLElement>(s)!;
    const media = gsap.matchMedia();
    media.add(
      {
        phone: "(max-width: 760px)",
        motion: "(prefers-reduced-motion: no-preference) and (min-height: 560px)",
      },
      (context) => {
        const { phone, motion } = context.conditions!;
        if (!motion) return;
        hero.dataset.scene = "animated";
        const copyFadeStart = 0.25;
        const copyFadeDuration = 0.35;
        // La zone du logo est définie une seule fois, en CSS (.lh-logo-area) :
        // le logo fixe et les particules arrivent exactement au même endroit.
        const canvas = q(".lh-canvas") as unknown as HTMLCanvasElement;
        const zone = q(".lh-logo-area").getBoundingClientRect();
        const frame = canvas.getBoundingClientRect();
        const particles = new LogoParticles({
          canvas,
          area: {
            x: (zone.left - frame.left) / frame.width,
            y: (zone.top - frame.top) / frame.height,
            width: zone.width / frame.width,
            height: zone.height / frame.height,
          },
          step: phone ? 5 : 6,
          pointer: !phone,
        });
        particles.setProgress(0);
        hero.dataset.ready = "true";
        // La dérive ne tourne que lorsque l’ouverture est à l’écran.
        const visibility = new IntersectionObserver(([entry]) =>
          entry.isIntersecting ? particles.start() : particles.stop(),
        );
        visibility.observe(q(".lh-stage"));
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: q(".lh-track"),
            start: "top top",
            end: "bottom bottom",
            scrub: phone ? 0.3 : 0.5,
            invalidateOnRefresh: true,
            onUpdate: ({ progress }) => {
              // Le logo est entièrement formé aux trois quarts de la piste.
              particles.setProgress(progress / 0.75);
              hero.style.setProperty("--lh-progress", progress.toFixed(3));
            },
          },
        });
        // L’accroche reste lisible au début, puis s’efface en remontant légèrement.
        tl.to(
          hero.querySelectorAll(".hero-copy, .hero-kicker"),
          { y: -60, opacity: 0, duration: copyFadeDuration, ease: "power1.in" },
          copyFadeStart,
        )
          // Retirer les boutons du parcours clavier quand ils deviennent invisibles,
          // puis les restaurer au retour. Le titre reste exposé aux lecteurs d’écran.
          .set(
            q(".hero-actions"),
            { visibility: "hidden" },
            copyFadeStart + copyFadeDuration,
          )
          .fromTo(
            q(".lh-end"),
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.2, ease: "power2.out" },
            0.62,
          )
          .to(q(".lh-hint"), { opacity: 0, duration: 0.08 }, 0.2)
          .to({}, { duration: 0.1 }, 0.9);
        return () => {
          visibility.disconnect();
          particles.destroy();
          hero.dataset.scene = "static";
          delete hero.dataset.ready;
          hero.style.removeProperty("--lh-progress");
        };
      },
    );
    document.fonts.ready.then(() => ScrollTrigger.refresh());
    return () => media.revert();
  }, [i18n.resolvedLanguage]);

  return (
    <section className="hero lh-hero" id="top" ref={root} data-scene="static">
      <div className="lh-track">
        <div className="lh-stage">
          <div className="lh-media" aria-hidden="true">
            <span className="lh-glow" />
            <span className="lh-logo-area">
              <img
                className="lh-poster"
                src={`${import.meta.env.BASE_URL}brand/lb-logo-dark-bg.svg`}
                alt=""
              />
            </span>
            <canvas className="lh-canvas" />
            <span className="lh-shade" />
          </div>
          <div className="shell lh-content">
            <div className="hero-kicker">
              <span className="eyebrow">
                <span className="status-dot" />{" "}
                {tr("INDEPENDENT DEVELOPER. PERSONAL APPROACH.")}
              </span>
              <span className="hero-location">
                {tr("BASED IN FRANCE / WORKING ONLINE")}
              </span>
            </div>
            <div className="hero-grid">
              <div className="hero-copy">
                <h1 aria-label={tr("Websites for independents and restaurants.")}>
                  <span className="hero-line">{tr("Websites for")}</span>
                  <span className="hero-line">{tr("independents")}</span>
                  <span className="hero-line">
                    {tr("and")}{" "}
                    <span className="hero-accent">
                      {tr("restaurants")}
                      <svg
                        viewBox="0 0 340 22"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                      >
                        <path d="M4 14Q160-7 333 9M15 21Q180 4 326 15" />
                      </svg>
                      .
                    </span>
                  </span>
                </h1>
                <p>
                  {tr(
                    "I design and build websites that stand out from the first scroll, for independent businesses, restaurants and researchers.",
                  )}{" "}
                  <strong>{tr("Projects from €600.")}</strong>
                </p>
                <div className="hero-actions">
                  <button className="button primary" onClick={onStart}>
                    {tr("Start a project")} <ArrowUpRight size={19} />
                  </button>
                  <a className="understated-link" href="#work">
                    {tr("See the work")} <ArrowDown size={15} />
                  </a>
                </div>
                <div className="hero-footnote">
                  <span className="mini-monogram">lb.</span>
                  <span>
                    {tr("Work directly with Lucas.")}
                    <br />
                    <strong>{tr("From the first idea to the final detail.")}</strong>
                  </span>
                </div>
              </div>
            </div>
            <p className="lh-end" aria-hidden="true">
              {tr("A website that comes alive")} <em>{tr("with every scroll.")}</em>
            </p>
          </div>
          <span className="lh-hint" aria-hidden="true">
            <ArrowDown size={14} /> {tr("SCROLL TO EXPLORE")}
          </span>
        </div>
      </div>
    </section>
  );
}
