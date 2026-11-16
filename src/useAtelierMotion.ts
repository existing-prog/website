import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

/** Le scroll reste natif. Le sticky est limité à la scène, sans pin plein écran.
 * Une seule chronologie synchronise déplacement, trois bouchées et révélation.
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
          timeline.to(
            page.querySelector(".atelier-pizza-slice"),
            { x: 22, y: 15, svgOrigin: "500 500", rotation: 4, duration: 0.2 },
            0.22,
          );
          timeline.to(
            page.querySelector(".bite-one"),
            { attr: { r: 110 }, duration: 0.15 },
            0.42,
          );
          timeline.to(
            page.querySelector(".bite-two"),
            { attr: { r: 175 }, duration: 0.18 },
            0.55,
          );
          timeline.to(
            page.querySelector(".bite-three"),
            { attr: { r: 290 }, duration: 0.2 },
            0.72,
          );
          timeline.to(
            page.querySelector(".atelier-pizza-slice"),
            { opacity: 0, duration: 0.12 },
            0.85,
          );
          timeline.fromTo(
            page.querySelector(".atelier-reveal-copy"),
            { autoAlpha: 0, y: 30 },
            { autoAlpha: 1, y: 0, duration: 0.35 },
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
