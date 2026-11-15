import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Scène photo : cadrage d’entrée, assemblage d’une planche-contact et appareils.
 * Les animations suivent le scroll natif et se retirent via matchMedia.
 * Aucun compteur ne fabrique un audit : seules les barres décoratives s’animent.
 */
export function useNinaMotion(
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
        desktop: "(min-width: 1024px)",
        motion: "(prefers-reduced-motion: no-preference)",
        reduced: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { desktop, motion } = context.conditions!;
        if (!motion) return;
        page.dataset.motion = desktop ? "full" : "light";
        gsap.fromTo(
          page.querySelectorAll(".nina-title .case-word"),
          { yPercent: 110, rotationZ: 2 },
          { yPercent: 0, rotationZ: 0, stagger: 0.07, duration: 1, ease: "power3.out" },
        );
        gsap.fromTo(
          page.querySelectorAll(".nina-intro-reveal"),
          { y: 20, opacity: 0.3 },
          { y: 0, opacity: 1, stagger: 0.1, duration: 0.85 },
        );
        page.querySelectorAll("h2").forEach((title) => {
          gsap.fromTo(
            title.querySelectorAll(".case-word"),
            { yPercent: 110 },
            {
              yPercent: 0,
              stagger: 0.04,
              duration: 0.85,
              ease: "power3.out",
              scrollTrigger: {
                trigger: title,
                start: "top 92%",
                toggleActions: "play none none reverse",
              },
            },
          );
        });
        page.querySelectorAll(".nina-reveal").forEach((element) => {
          gsap.fromTo(
            element,
            { y: desktop ? 32 : 16, opacity: 0.35 },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              scrollTrigger: {
                trigger: element,
                start: "top 93%",
                toggleActions: "play none none reverse",
              },
            },
          );
        });
        gsap.fromTo(
          page.querySelector(".nina-cover-window"),
          { clipPath: "inset(5% 8% 5% 8% round 8px)" },
          {
            clipPath: "inset(0% 0% 0% 0% round 8px)",
            ease: "none",
            scrollTrigger: {
              trigger: page.querySelector(".nina-cover"),
              start: "top 95%",
              end: "top 15%",
              scrub: 0.7,
            },
          },
        );
        gsap.fromTo(
          page.querySelector(".nina-cover-photo"),
          { scale: 1.1, yPercent: -2 },
          {
            scale: 1,
            yPercent: 2,
            ease: "none",
            scrollTrigger: {
              trigger: page.querySelector(".nina-cover"),
              start: "top bottom",
              end: "bottom top",
              scrub: 0.8,
            },
          },
        );
        // Chaque tirage rejoint sa place dans la grille : pas de pin ni d’overlay.
        const prints = page.querySelectorAll(".nina-print");
        prints.forEach((print, index) => {
          gsap.fromTo(
            print,
            {
              y: desktop ? [110, 190, 135][index] : 28,
              rotationZ: desktop ? [-7, 5, -4][index] : 0,
            },
            {
              y: 0,
              rotationZ: 0,
              ease: "none",
              scrollTrigger: {
                trigger: desktop ? page.querySelector(".nina-contact-sheet") : print,
                start: desktop ? "top 90%" : "top 96%",
                end: desktop ? "center 48%" : "top 65%",
                scrub: 0.7,
              },
            },
          );
        });
        page.querySelectorAll(".nina-audit").forEach((audit) => {
          gsap.fromTo(
            audit.querySelector(".nina-audit-after"),
            { scaleX: 0 },
            {
              scaleX: 1,
              duration: 1.1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: audit,
                start: "top 90%",
                toggleActions: "play none none reverse",
              },
            },
          );
        });
        gsap.fromTo(
          page.querySelector(".nina-desktop"),
          { y: desktop ? 70 : 24, rotationY: desktop ? -6 : 0 },
          {
            y: 0,
            rotationY: 0,
            ease: "none",
            scrollTrigger: {
              trigger: page.querySelector(".nina-device-scene"),
              start: "top 95%",
              end: "center 50%",
              scrub: 0.7,
            },
          },
        );
        gsap.fromTo(
          page.querySelector(".nina-mobile"),
          { y: desktop ? 140 : 30, rotationZ: desktop ? 7 : 0 },
          {
            y: 0,
            rotationZ: 0,
            ease: "none",
            scrollTrigger: {
              trigger: page.querySelector(".nina-device-scene"),
              start: "top 90%",
              end: "center 40%",
              scrub: 0.8,
            },
          },
        );
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
