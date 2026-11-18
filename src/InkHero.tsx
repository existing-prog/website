import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { asset } from "./data";
import { tr } from "./i18n";
import { ScrollSequence } from "./scrollSequence";
import "./ink-hero.scss";
gsap.registerPlugin(ScrollTrigger);

const FRAMES = 37;

/**
 * Ouverture de l’accueil : une encre indigo et lavande éclot au scroll (vidéo
 * Kling découpée en images, à partir du moment où le nuage s’ouvre), derrière
 * l’accroche. Le titre s’efface en douceur, puis une phrase prend le relais.
 * Mouvement réduit, écran bas et pré-rendu : image fixe, sans piste de scroll.
 */
export default function InkHero({ onStart }: { onStart: () => void }) {
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
        const folder = `${import.meta.env.BASE_URL}assets/ink-bloom/${phone ? "mobile" : "desktop"}/`;
        const sequence = new ScrollSequence({
          canvas: q(".ink-canvas") as unknown as HTMLCanvasElement,
          frameCount: FRAMES,
          src: (i) => `${folder}${String(i + 1).padStart(3, "0")}.webp`,
          fit: "cover",
          edgeFade: phone ? 0 : 0.12,
          onReady: () => (hero.dataset.ready = "true"),
        });
        sequence.render(0);
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: q(".ink-track"),
            start: "top top",
            end: "bottom bottom",
            scrub: phone ? 0.3 : 0.5,
            invalidateOnRefresh: true,
            onUpdate: ({ progress }) => {
              sequence.render(progress);
              hero.style.setProperty("--ink-progress", progress.toFixed(3));
            },
          },
        });
        // L’accroche reste lisible au début, puis s’efface en remontant légèrement.
        tl.to(
          hero.querySelectorAll(".hero-copy, .hero-kicker"),
          { y: -60, opacity: 0, duration: 0.35, ease: "power1.in" },
          0.25,
        )
          .fromTo(
            q(".ink-end"),
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.2, ease: "power2.out" },
            0.62,
          )
          .to(q(".ink-hint"), { opacity: 0, duration: 0.08 }, 0.2)
          .to({}, { duration: 0.1 }, 0.9);
        return () => {
          sequence.destroy();
          hero.dataset.scene = "static";
          delete hero.dataset.ready;
          hero.style.removeProperty("--ink-progress");
        };
      },
    );
    document.fonts.ready.then(() => ScrollTrigger.refresh());
    return () => media.revert();
  }, [i18n.resolvedLanguage]);

  return (
    <section className="hero ink-hero" id="top" ref={root} data-scene="static">
      <div className="ink-track">
        <div className="ink-stage">
          <div className="ink-media" aria-hidden="true">
            <img className="ink-poster" src={asset("ink-bloom/poster.webp")} alt="" />
            <canvas className="ink-canvas" />
            <span className="ink-shade" />
          </div>
          <div className="shell ink-content">
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
                <h1 aria-label={tr("Living websites. That stay in your hands.")}>
                  <span className="hero-line">{tr("Living websites.")}</span>
                  <span className="hero-line">{tr("That stay")}</span>
                  <span className="hero-line">
                    {tr("in")}{" "}
                    <span className="hero-accent">
                      {tr("your hands")}
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
                  )}
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
            <p className="ink-end" aria-hidden="true">
              {tr("A website that comes alive")} <em>{tr("with every scroll.")}</em>
            </p>
          </div>
          <span className="ink-hint" aria-hidden="true">
            <ArrowDown size={14} /> {tr("SCROLL TO EXPLORE")}
          </span>
        </div>
      </div>
    </section>
  );
}
