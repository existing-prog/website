import {
  useLayoutEffect,
  type RefObject,
  type Dispatch,
  type SetStateAction,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Chorégraphie Kasa : assemblage des appareils et parcours produit sticky.
 * L’état actif change seulement à l’entrée d’un chapitre, jamais à chaque frame.
 * Le mobile et le mode sans mouvement gardent toutes les captures dans le flux.
 */
export function useKasaMotion(
  root: RefObject<HTMLElement | null>,
  language: string | undefined,
  setStep: Dispatch<SetStateAction<number>>,
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
        setStep(0);
        if (!motion) return;
        page.dataset.motion = desktop ? "full" : "light";
        gsap.fromTo(
          page.querySelectorAll(".kasa-title .case-word"),
          { yPercent: 110, rotationZ: 3 },
          {
            yPercent: 0,
            rotationZ: 0,
            stagger: 0.06,
            duration: 1.05,
            ease: "power3.out",
          },
        );
        gsap.fromTo(
          page.querySelectorAll(".kasa-intro-reveal"),
          { y: 20, opacity: 0.3 },
          { y: 0, opacity: 1, stagger: 0.1, duration: 0.85, ease: "power2.out" },
        );
        page.querySelectorAll("h2").forEach((title) =>
          gsap.fromTo(
            title.querySelectorAll(".case-word"),
            { yPercent: 110 },
            {
              yPercent: 0,
              stagger: 0.04,
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: {
                trigger: title,
                start: "top 90%",
                toggleActions: "play none none reverse",
              },
            },
          ),
        );
        page.querySelectorAll(".kasa-reveal").forEach((element) =>
          gsap.fromTo(
            element,
            { y: desktop ? 32 : 16, opacity: 0.35 },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              ease: "power2.out",
              scrollTrigger: {
                trigger: element,
                start: "top 92%",
                toggleActions: "play none none reverse",
              },
            },
          ),
        );
        gsap.fromTo(
          page.querySelector(".kasa-hero-browser"),
          {
            rotationY: desktop ? -9 : 0,
            rotationZ: desktop ? -3 : 0,
            y: desktop ? 45 : 18,
            clipPath: "inset(6% 7% 0% 0% round 14px)",
          },
          {
            rotationY: 0,
            rotationZ: 0,
            y: 0,
            clipPath: "inset(0% 0% 0% 0% round 14px)",
            ease: "none",
            scrollTrigger: {
              trigger: page.querySelector(".kasa-hero-art"),
              start: "top 92%",
              end: "top 18%",
              scrub: 0.65,
            },
          },
        );
        if (desktop) {
          gsap.fromTo(
            page.querySelector(".kasa-hero-phone"),
            { x: -20, y: 90, rotationZ: 8 },
            {
              x: 0,
              y: 0,
              rotationZ: 3,
              ease: "none",
              scrollTrigger: {
                trigger: page.querySelector(".kasa-hero-art"),
                start: "top 85%",
                end: "center 40%",
                scrub: 0.8,
              },
            },
          );
          page
            .querySelectorAll<HTMLElement>(".kasa-flow-chapter")
            .forEach((chapter, index) => {
              ScrollTrigger.create({
                trigger: chapter,
                start: "top 55%",
                end: "bottom 55%",
                onEnter: () => setStep(index),
                onEnterBack: () => setStep(index),
              });
              gsap.fromTo(
                chapter.querySelector(".kasa-chapter-copy"),
                { y: 24, opacity: 0.4 },
                {
                  y: 0,
                  opacity: 1,
                  duration: 0.7,
                  scrollTrigger: {
                    trigger: chapter,
                    start: "top 85%",
                    toggleActions: "play none none reverse",
                  },
                },
              );
            });
        } else {
          page.querySelectorAll(".kasa-flow-chapter").forEach((chapter) =>
            gsap.fromTo(
              chapter,
              { y: 18, opacity: 0.4 },
              {
                y: 0,
                opacity: 1,
                duration: 0.75,
                scrollTrigger: {
                  trigger: chapter,
                  start: "top 92%",
                  toggleActions: "play none none reverse",
                },
              },
            ),
          );
        }
        page.querySelectorAll(".kasa-device").forEach((device, index) =>
          gsap.fromTo(
            device,
            {
              y: desktop ? 90 + index * 45 : 24,
              rotationZ: desktop ? (index ? 9 : -9) : 0,
            },
            {
              y: 0,
              rotationZ: desktop ? (index ? 3 : -3) : 0,
              ease: "none",
              scrollTrigger: {
                trigger: page.querySelector(".kasa-responsive"),
                start: "top 88%",
                end: "center 45%",
                scrub: 0.65,
              },
            },
          ),
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
  }, [root, language, setStep]);
}
