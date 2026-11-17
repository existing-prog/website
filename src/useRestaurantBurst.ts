import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSequence } from "./scrollSequence";
gsap.registerPlugin(ScrollTrigger);

const FRAMES = 61;

/**
 * Chronologie de l’ouverture restaurants. La piste mesure 100vh de plus que
 * l’animation : pendant ce dernier écran, la section suivante glisse par-dessus
 * la scène, qui reste collée et affiche la pizza éclatée.
 */
export function useRestaurantBurst(
  root: RefObject<HTMLElement | null>,
  language?: string,
) {
  useLayoutEffect(() => {
    const scene = root.current;
    if (!scene) return;
    const q = (selector: string) => scene.querySelector<HTMLElement>(selector)!;
    const media = gsap.matchMedia();
    media.add(
      {
        phone: "(max-width: 760px)",
        motion: "(prefers-reduced-motion: no-preference) and (min-height: 560px)",
      },
      (context) => {
        const { phone, motion } = context.conditions!;
        if (!motion) return;
        scene.dataset.scene = "animated";
        const track = q(".rb-track");
        const folder = `${import.meta.env.BASE_URL}assets/pizza-burst/${phone ? "mobile" : "desktop"}/`;
        const sequence = new ScrollSequence({
          canvas: q(".rb-canvas") as unknown as HTMLCanvasElement,
          frameCount: FRAMES,
          src: (i) => `${folder}${String(i + 1).padStart(3, "0")}.webp`,
          fit: "contain",
          edgeFade: 0.08,
          onReady: () => (scene.dataset.ready = "true"),
        });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: track,
            start: "top top",
            // L’éclatement se termine un écran avant la fin de la piste.
            end: () => `+=${Math.max(1, track.offsetHeight - 2 * innerHeight)}`,
            scrub: phone ? 0.3 : 0.5,
            invalidateOnRefresh: true,
            onUpdate: ({ progress }) => {
              sequence.render(progress);
              scene.dataset.phase =
                progress < 0.2 ? "rest" : progress < 0.95 ? "burst" : "open";
              scene.style.setProperty("--rb-progress", progress.toFixed(3));
            },
          },
        });
        sequence.render(0);

        // Le titre s’efface : le contour grandit, la phrase remonte.
        tl.to(q(".rb-outline"), { scale: 1.45, opacity: 0, duration: 0.35 }, 0)
          .to(q(".rb-solid"), { y: -50, opacity: 0, duration: 0.25 }, 0.03)
          .to(q(".rb-title .eyebrow"), { opacity: 0, duration: 0.15 }, 0)
          .to(q(".rb-hint"), { opacity: 0, duration: 0.1 }, 0.9);
        // Le décor tourne autour de la pizza et s’écarte, d’autant plus qu’il est proche.
        tl.to(q(".rb-decor"), { rotation: 28, duration: 1 }, 0);
        scene.querySelectorAll<HTMLElement>(".rb-leaf").forEach((leaf) => {
          const depth = Number(leaf.dataset.depth);
          const dx = (parseFloat(leaf.style.left) - 50) / 50;
          const dy = (parseFloat(leaf.style.top) - 50) / 50;
          tl.to(
            leaf,
            {
              x: () => dx * innerWidth * 0.35 * depth,
              y: () => dy * innerHeight * 0.35 * depth,
              rotation: `+=${140 * depth}`,
              scale: 1 + 0.5 * depth,
              duration: 1,
              ease: "power1.in",
            },
            0,
          );
        });
        tl.to(
          scene.querySelectorAll(".rb-flour"),
          { scale: 2.2, opacity: 0, duration: 0.5, stagger: { amount: 0.2 } },
          0.3,
        );

        return () => {
          sequence.destroy();
          scene.dataset.scene = "static";
          delete scene.dataset.ready;
          delete scene.dataset.phase;
          scene.style.removeProperty("--rb-progress");
        };
      },
    );
    document.fonts.ready.then(() => ScrollTrigger.refresh());
    return () => media.revert();
  }, [root, language]);
}
