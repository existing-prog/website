import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AXIS, PIVOT } from "./atelierBiteGeometry";
gsap.registerPlugin(ScrollTrigger);

/** Repères de la chronologie (0 → 1), partagés par l’animation et les attributs de test. */
const AT = {
  lift: 0.1,
  snap: 0.27,
  bites: [0.38, 0.47, 0.56, 0.65, 0.74],
  drop: 0.8,
  tag: 0.84,
  reveal: 0.86,
};

/**
 * Le défilement reste natif : la scène est un sticky CSS dans une piste haute,
 * et une seule chronologie GSAP suit la progression (scrub, donc réversible).
 * Sans mouvement (préférence, écran trop bas), la scène reste dans son état final.
 */
export function useAtelierBite(root: RefObject<HTMLElement | null>, language?: string) {
  useLayoutEffect(() => {
    const scene = root.current;
    if (!scene) return;
    const q = <T extends Element = HTMLElement>(selector: string) =>
      scene.querySelector<T>(selector)!;
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
        scene.dataset.bite = "0";
        scene.dataset.phase = "intro";
        const slice = q<SVGGElement>(".atelier-bite-slice");
        const shadow = q<SVGPathElement>(".atelier-bite-shadow");
        const marks = scene.querySelectorAll<SVGGElement>(".atelier-bite-mark");
        const words = scene.querySelectorAll(".atelier-bite-copy h2 .case-word");

        // Pointe de la part = pivot : sa position suit directement x/y.
        gsap.set([slice, shadow], { svgOrigin: PIVOT });
        // Bouchées fermées : rayon nul tant qu’elles n’ont pas eu lieu. On anime
        // l’attribut r, car un élément de <mask> n’a pas de boîte pour un transform.
        const circles = [...marks].map((mark) => [...mark.querySelectorAll("circle")]);
        circles.flat().forEach((circle) => {
          circle.dataset.r = circle.getAttribute("r")!;
        });
        gsap.set(circles.flat(), { attr: { r: 0 } });
        // Les tweens échelonnés n’appliquent leur état initial qu’au premier élément :
        // les états de départ du texte sont donc posés explicitement.
        gsap.set(words, { yPercent: 110 });
        gsap.set(scene.querySelectorAll(".atelier-bite-text, .atelier-bite-link"), {
          opacity: 0,
          y: 24,
        });
        gsap.set(scene.querySelectorAll(".atelier-bite-crumbs"), { opacity: 0 });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: q(".atelier-bite-track"),
            start: "top top",
            end: "bottom bottom",
            scrub: desktop ? 0.6 : 0.3,
            invalidateOnRefresh: true,
            onUpdate: ({ progress }) => {
              const bite = AT.bites.filter((t) => progress >= t).length;
              scene.dataset.bite = String(bite);
              scene.dataset.phase =
                progress < AT.lift
                  ? "intro"
                  : progress < AT.bites[0]
                    ? "lift"
                    : progress < AT.drop
                      ? "bite"
                      : "reveal";
              scene.style.setProperty("--bite-progress", progress.toFixed(3));
            },
          },
        });

        // 1. La pizza entre en tournant.
        tl.fromTo(
          q(".atelier-bite-pizza"),
          { rotation: -24, scale: 0.84, svgOrigin: PIVOT },
          { rotation: 0, scale: 1, duration: AT.lift, ease: "power2.out" },
          0,
        );
        // L’accroche laisse la place au titre dès que la part commence à être croquée.
        tl.fromTo(
          q(".atelier-bite-tease"),
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.06 },
          0.02,
        ).to(
          q(".atelier-bite-tease"),
          { opacity: 0, y: -20, duration: 0.06 },
          AT.drop - 0.04,
        );
        // 2. La part se soulève et s’écarte de la pizza.
        const lifted = { x: AXIS.x * 95, y: AXIS.y * 95 };
        tl.to(
          slice,
          {
            ...lifted,
            rotation: 7,
            scale: 1.06,
            duration: AT.snap - AT.lift,
            ease: "power2.inOut",
          },
          AT.lift,
        ).to(
          shadow,
          {
            x: lifted.x + 26,
            y: lifted.y + 46,
            opacity: 0.42,
            duration: AT.snap - AT.lift,
          },
          AT.lift,
        );
        // 3. La part s’approche pour être croquée.
        const bitePosition = { x: AXIS.x * 120 + 70, y: AXIS.y * 120 + 40 };
        tl.to(
          slice,
          {
            ...bitePosition,
            rotation: 16,
            scale: 1.12,
            duration: AT.bites[0] - AT.snap - 0.02,
            ease: "power1.inOut",
          },
          AT.snap,
        ).to(
          shadow,
          {
            x: bitePosition.x + 34,
            y: bitePosition.y + 60,
            opacity: 0.32,
            duration: AT.bites[0] - AT.snap - 0.02,
          },
          AT.snap,
        );
        // 4. Cinq bouchées nettes : un léger recul, la trace apparaît, des miettes tombent.
        AT.bites.forEach((time, i) => {
          tl.to(
            slice,
            {
              x: bitePosition.x + 10,
              y: bitePosition.y + 8,
              duration: 0.02,
              ease: "power1.in",
            },
            time - 0.02,
          )
            .to(slice, { ...bitePosition, duration: 0.04, ease: "back.out(3)" }, time)
            .to(
              circles[i],
              {
                attr: { r: (_: number, c: SVGCircleElement) => Number(c.dataset.r) },
                duration: 0.012,
              },
              time - 0.006,
            );
          // L’ombre s’allège à mesure que la part rétrécit.
          tl.to(shadow, { opacity: 0.3 * (1 - (i + 1) / 6), duration: 0.02 }, time);
          const crumbs = scene.querySelector(`[data-burst="${i}"]`)!;
          tl.set(crumbs, { opacity: 1 }, time)
            .fromTo(
              crumbs.children,
              { x: 0, y: 0 },
              {
                x: (n) => (n - 1.5) * 26,
                y: (n) => 150 + (n % 2) * 70,
                duration: 0.07,
                ease: "power2.in",
              },
              time,
            )
            .to(crumbs, { opacity: 0, duration: 0.02 }, time + 0.06);
        });
        // 5. Il ne reste que la croûte : elle tombe, la place libre accueille le nouveau prix.
        tl.to(
          slice,
          {
            x: bitePosition.x + 320,
            y: bitePosition.y + 760,
            rotation: 55,
            opacity: 0,
            duration: 0.07,
            ease: "power2.in",
          },
          AT.drop,
        )
          .to(shadow, { opacity: 0, duration: 0.04 }, AT.drop)
          .to(q(".atelier-bite-hint"), { opacity: 0, duration: 0.04 }, AT.drop)
          .fromTo(
            q(".atelier-price-tag"),
            { opacity: 0, scale: 0.4, rotation: -18 },
            { opacity: 1, scale: 1, rotation: -6, duration: 0.06, ease: "back.out(2)" },
            AT.tag,
          )
          .fromTo(
            q(".atelier-price-new"),
            { opacity: 0, yPercent: 60 },
            { opacity: 1, yPercent: 0, duration: 0.04, ease: "back.out(2)" },
            AT.tag + 0.07,
          );
        // 6. Le texte se révèle, mot par mot.
        tl.to(
          words,
          { yPercent: 0, stagger: 0.012, duration: 0.05, ease: "power3.out" },
          AT.reveal,
        )
          .to(
            scene.querySelectorAll(".atelier-bite-text, .atelier-bite-link"),
            { opacity: 1, y: 0, stagger: 0.02, duration: 0.05 },
            AT.reveal + 0.05,
          )
          .to({}, { duration: 0.04 }, 0.96);

        return () => {
          scene.dataset.scene = "static";
          scene.dataset.bite = "5";
          delete scene.dataset.phase;
          scene.style.removeProperty("--bite-progress");
        };
      },
    );
    const refresh = () => ScrollTrigger.refresh();
    document.fonts.ready.then(refresh);
    return () => media.revert();
  }, [root, language]);
}
