import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

/** Le scroll reste natif. Le sticky est limité à la scène, sans pin plein écran.
 * Une seule chronologie synchronise déplacement, six états de bouchées et révélation.
 * matchMedia retire tous les styles/attributs lors d’un changement de mode.
 */
export function useAtelierMotion(
  root: RefObject<HTMLElement | null>,
  language: string | undefined,
) {
  useLayoutEffect(() => {
    const page = root.current;
    if (!page) return;
    let alive = true;
    const media = gsap.matchMedia();
    media.add(
      {
        desktop: "(min-width: 1024px) and (min-height: 700px)",
        motion: "(prefers-reduced-motion: no-preference)",
        reduced: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { desktop, motion } = context.conditions!;
        if (!motion) return;
        page.dataset.motion = desktop ? "full" : "light";
        gsap.fromTo(
          page.querySelectorAll(".case-title .case-word"),
          { yPercent: 110 },
          { yPercent: 0, duration: 0.9, stagger: 0.06, ease: "power3.out" },
        );
        page.querySelectorAll(".atelier-reveal").forEach((el) =>
          gsap.fromTo(
            el,
            { y: desktop ? 26 : 14, opacity: 0.4 },
            {
              y: 0,
              opacity: 1,
              duration: 0.7,
              scrollTrigger: {
                trigger: el,
                start: "top 93%",
                toggleActions: "play none none reverse",
              },
            },
          ),
        );
        if (desktop) {
          const scene = page.querySelector(".atelier-unfold");
          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: scene,
              start: "top 110px",
              end: "bottom bottom",
              scrub: 0.8,
            },
          });
          timeline.fromTo(
            page.querySelector(".atelier-pizza-visual"),
            { xPercent: 45, rotation: -8 },
            { xPercent: 0, rotation: 0, duration: 0.5, ease: "power2.inOut" },
            0,
          );
          const slice = page.querySelector<SVGGElement>(".atelier-pizza-slice")!;
          const frames = page.querySelectorAll<SVGImageElement>(".atelier-slice-frame");
          timeline.to(
            slice,
            { x: 48, y: 20, svgOrigin: "500 500", rotation: 6, duration: 0.22 },
            0.15,
          );
          // Les pauses entre états font lire les bouchées ; aucun fondu de texture.
          [0.38, 0.51, 0.64, 0.77, 0.9].forEach((time, i) => {
            timeline.set(frames, { visibility: "hidden" }, time);
            timeline.set(frames[i + 1], { visibility: "visible" }, time);
            timeline.set(slice, { attr: { "data-bite-frame": i + 1 } }, time);
            // Trois miettes discrètes suivent la même progression que la bouchée.
            // Elles restent invisibles sans animation ou en mouvement réduit.
            const crumbs = page.querySelector(`[data-burst="${i}"]`);
            timeline.set(crumbs, { opacity: 1 }, time);
            timeline.fromTo(
              crumbs,
              { x: 0, y: 0 },
              { x: 15, y: 65, duration: 0.105, ease: "power1.in" },
              time,
            );
            timeline.to(crumbs, { opacity: 0, duration: 0.035 }, time + 0.07);
            timeline.to(
              slice,
              { x: 55, y: 23, duration: 0.035, ease: "power1.in" },
              time - 0.035,
            );
            timeline.to(
              slice,
              { x: 48, y: 20, duration: 0.065, ease: "power2.out" },
              time,
            );
          });
          timeline.fromTo(
            page.querySelector(".atelier-reveal-copy"),
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.35 },
            0.55,
          );
          timeline.to(
            page.querySelector(".atelier-scroll-label"),
            { opacity: 0, duration: 0.15 },
            0,
          );
        }
        gsap.fromTo(
          page.querySelector(".case-reading-progress span"),
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: {
              trigger: page,
              start: "top top",
              end: "bottom bottom",
              scrub: true,
            },
          },
        );
        return () => {
          delete page.dataset.motion;
          page
            .querySelector(".atelier-pizza-slice")
            ?.setAttribute("data-bite-frame", "0");
        };
      },
    );
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
  }, [root, language]);
}
