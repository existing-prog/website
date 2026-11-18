import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

/** Place de chaque bloc dans l’article (en % de la feuille). Le CSS porte la place
 * finale dans le site : c’est l’état affiché sans animation et dans le pré-rendu. */
const PAPER_LAYOUT: Record<string, gsap.TweenVars> = {
  ".ac-nav": { left: "8%", top: "4%", width: "84%", height: "4%" },
  // Hauteurs réglées pour que la ligne d’affiliations et la légende de la figure
  // tiennent entières dans leur bloc (sinon elles apparaissent coupées).
  ".ac-head": { left: "8%", top: "10%", width: "84%", height: "19.5%" },
  ".ac-abstract": { left: "8%", top: "30.5%", width: "84%", height: "19%" },
  ".ac-figure": { left: "18%", top: "50.5%", width: "64%", height: "32.5%" },
  ".ac-refs": { left: "8%", top: "84%", width: "84%", height: "13%" },
};
const PAPER = "#fbfaf6";
const OCEAN = "#0b2a2c";

/** Bord supérieur ondulé de la marée, à une hauteur donnée (en % de la feuille). */
function tideShape(level: number, phase: number) {
  const points: string[] = [];
  for (let i = 0; i <= 12; i++) {
    const x = (i / 12) * 100;
    const y = level + Math.sin(i * 0.9 + phase) * 2.2;
    points.push(`${x.toFixed(1)}% ${y.toFixed(2)}%`);
  }
  return `polygon(${points.join(", ")}, 100% 100%, 0% 100%)`;
}

/** Pseudo-hasard stable : les mots s’envolent toujours de la même façon. */
const scatter = (i: number, salt: number) => {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v) - 0.5;
};

/**
 * Chronologie unique, pilotée par le défilement (scrub, réversible) :
 * 1. la feuille arrive ; 2. les mots du résumé s’envolent ; 3. la courbe se trace
 * et la marée monte sur l’article ; 4. les blocs rejoignent leur place dans le site ;
 * 5. la feuille devient une fenêtre de navigateur, les publications apparaissent.
 */
export function useAcademicScene(root: RefObject<HTMLElement | null>, language?: string) {
  useLayoutEffect(() => {
    const scene = root.current;
    if (!scene) return;
    const q = (selector: string) => scene.querySelector<HTMLElement>(selector)!;
    const all = (selector: string) => scene.querySelectorAll<HTMLElement>(selector);
    const media = gsap.matchMedia();
    media.add(
      {
        desktop: "(min-width: 1024px)",
        motion: "(prefers-reduced-motion: no-preference) and (min-height: 560px)",
      },
      (context) => {
        const { desktop, motion } = context.conditions!;
        if (!motion) return;
        scene.dataset.scene = "animated";
        scene.dataset.phase = "paper";
        const sheet = q(".ac-sheet");
        const beats = all(".ac-beat");
        const tide = q(".ac-tide");
        const liveLine = q(".ac-chart.is-live .ac-chart-line");
        const dots = all(".ac-chart.is-live .ac-chart-dot");
        const cards = all(".ac-card");

        gsap.set(all(".ac-paper"), { opacity: 1 });
        gsap.set(all(".ac-site"), { opacity: 0 });
        gsap.set(sheet, { backgroundColor: PAPER, borderRadius: 6 });
        gsap.set(q(".ac-chrome"), { height: 0, opacity: 0 });
        const water = { level: 108, phase: 0 };
        const drawTide = () => {
          tide.style.clipPath = tideShape(water.level, water.phase);
        };
        drawTide();
        gsap.set(liveLine, { strokeDasharray: 1, strokeDashoffset: 1 });
        gsap.set(dots, { opacity: 0, scale: 0, transformOrigin: "50% 50%" });
        gsap.set(q(".ac-chart.is-live .ac-chart-area"), { opacity: 0 });
        gsap.set(beats, { opacity: 0, y: 18 });
        gsap.set(beats[0], { opacity: 1, y: 0 });
        gsap.set(cards, { opacity: 0, y: 18 });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: q(".ac-track"),
            start: "top top",
            end: "bottom bottom",
            scrub: desktop ? 0.6 : 0.3,
            invalidateOnRefresh: true,
            onUpdate: ({ progress }) => {
              scene.dataset.phase =
                progress < 0.3
                  ? "paper"
                  : progress < 0.45
                    ? "alive"
                    : progress < 0.75
                      ? "layout"
                      : "site";
              scene.style.setProperty("--ac-progress", progress.toFixed(3));
            },
          },
        });

        // 1. La feuille se pose.
        tl.fromTo(
          sheet,
          // Sur téléphone, pas de décalage vertical : la légende est juste en dessous.
          { rotationX: 24, y: desktop ? 70 : 0, scale: 0.9, transformPerspective: 1400 },
          { rotationX: 0, y: 0, scale: 1, duration: 0.1, ease: "power2.out" },
          0,
        );
        // 2. Les mots du résumé s’envolent, chacun dans sa direction.
        tl.to(
          all(".ac-word"),
          {
            x: (i) => scatter(i, 1) * 520,
            y: (i) => -160 - Math.abs(scatter(i, 2)) * 420,
            rotation: (i) => scatter(i, 3) * 90,
            opacity: 0,
            duration: 0.1,
            stagger: { amount: 0.14 },
            ease: "power1.in",
          },
          0.1,
        ).to(q(".ac-abstract .ac-paper"), { opacity: 0, duration: 0.04 }, 0.3);
        // 3. La courbe se trace, la marée monte et recouvre l’article.
        tl.to(q(".ac-figure .ac-paper"), { opacity: 0, duration: 0.08 }, 0.33)
          .to(q(".ac-figure .ac-site"), { opacity: 1, duration: 0.08 }, 0.33)
          .to(
            water,
            {
              level: -6,
              phase: 6,
              duration: 0.2,
              ease: "power1.inOut",
              onUpdate: drawTide,
            },
            0.32,
          )
          .set(sheet, { backgroundColor: OCEAN }, 0.52)
          .to(
            liveLine,
            { strokeDashoffset: 0, duration: 0.3, ease: "power1.inOut" },
            0.36,
          )
          .to(q(".ac-chart.is-live .ac-chart-area"), { opacity: 1, duration: 0.15 }, 0.5)
          .to(
            dots,
            { opacity: 1, scale: 1, stagger: 0.04, duration: 0.05, ease: "back.out(3)" },
            0.46,
          );
        // 4. Chaque bloc glisse vers sa place dans le site en changeant de peau.
        Object.entries(PAPER_LAYOUT).forEach(([selector, layout]) => {
          tl.from(q(selector), { ...layout, duration: 0.27, ease: "power2.inOut" }, 0.45);
        });
        ["nav", "head", "refs"].forEach((name) => {
          tl.to(q(`.ac-${name} .ac-paper`), { opacity: 0, duration: 0.08 }, 0.48).to(
            q(`.ac-${name} .ac-site`),
            { opacity: 1, duration: 0.1 },
            0.52,
          );
        });
        tl.to(q(".ac-abstract .ac-site"), { opacity: 1, duration: 0.08 }, 0.62);
        // 5. La feuille devient une fenêtre, les publications se rangent en cartes.
        tl.to(q(".ac-chrome"), { height: "5%", opacity: 1, duration: 0.1 }, 0.7)
          .to(sheet, { borderRadius: 16, duration: 0.1 }, 0.7)
          .to(cards, { opacity: 1, y: 0, stagger: 0.03, duration: 0.06 }, 0.8)
          .to(q(".ac-hint"), { opacity: 0, duration: 0.04 }, 0.9);
        // Légendes : une étape à la fois.
        [0.3, 0.64].forEach((time, i) => {
          tl.to(beats[i], { opacity: 0, y: -18, duration: 0.04 }, time).to(
            beats[i + 1],
            { opacity: 1, y: 0, duration: 0.05 },
            time + 0.03,
          );
        });
        tl.to({}, { duration: 0.02 }, 0.98);

        return () => {
          scene.dataset.scene = "static";
          delete scene.dataset.phase;
          scene.style.removeProperty("--ac-progress");
        };
      },
    );
    document.fonts.ready.then(() => ScrollTrigger.refresh());
    return () => media.revert();
  }, [root, language]);
}
