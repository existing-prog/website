import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Chorégraphie propre à l’étude : titres, cadres et changements de profondeur.
 * Le scroll reste natif. Le mode mobile réduit les amplitudes et le mode sans
 * mouvement ne crée aucune timeline. matchMedia restaure tous les styles.
 */
export function useCaseStudyMotion(
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
        if (!context.conditions!.motion) return;
        const desktop = context.conditions!.desktop;
        page.dataset.motion = desktop ? "full" : "light";
        gsap.fromTo(
          page.querySelectorAll(".case-intro-reveal:not(.case-title)"),
          { y: 20, opacity: 0.3 },
          { y: 0, opacity: 1, duration: 0.85, stagger: 0.09, ease: "power2.out" },
        );
        gsap.fromTo(
          page.querySelectorAll(".case-title .case-word"),
          { yPercent: 110, rotationZ: 3 },
          {
            yPercent: 0,
            rotationZ: 0,
            duration: 1.1,
            stagger: 0.055,
            ease: "power3.out",
          },
        );
        page.querySelectorAll("h2").forEach((title) => {
          gsap.fromTo(
            title.querySelectorAll(".case-word"),
            { yPercent: 110, rotationZ: 2 },
            {
              yPercent: 0,
              rotationZ: 0,
              duration: 0.9,
              stagger: 0.045,
              ease: "power3.out",
              scrollTrigger: {
                trigger: title,
                start: "top 88%",
                toggleActions: "play none none reverse",
              },
            },
          );
        });
        // Texte et listes : la lecture redevient entièrement visible après l’entrée,
        // même si le visiteur arrête de défiler au milieu d’un chapitre.
        page.querySelectorAll(".case-reveal:not(.case-phone)").forEach((section) => {
          gsap.fromTo(
            section,
            { y: desktop ? 35 : 18, opacity: 0.35 },
            {
              y: 0,
              opacity: 1,
              duration: 0.85,
              ease: "power2.out",
              scrollTrigger: {
                trigger: section,
                start: "top 92%",
                toggleActions: "play none none reverse",
              },
            },
          );
        });
        gsap.fromTo(
          page.querySelectorAll(".case-checks li"),
          { x: desktop ? 22 : 0, opacity: 0.3 },
          {
            x: 0,
            opacity: 1,
            duration: 0.65,
            stagger: 0.12,
            scrollTrigger: {
              trigger: page.querySelector(".case-checks"),
              start: "top 88%",
              toggleActions: "play none none reverse",
            },
          },
        );
        // Le cadre s’ouvre dans sa place réservée : aucune surimpression sur le texte.
        gsap.fromTo(
          page.querySelector(".case-hero-viewport"),
          {
            clipPath: desktop
              ? "inset(12% 12% 0% 12% round 24px)"
              : "inset(5% 5% 0% 5% round 14px)",
          },
          {
            clipPath: "inset(0% 0% 0% 0% round 10px)",
            ease: "none",
            scrollTrigger: {
              trigger: page.querySelector(".case-hero-art"),
              start: "top 92%",
              end: "top 18%",
              scrub: 0.65,
            },
          },
        );
        gsap.fromTo(
          page.querySelector(".case-hero-image"),
          {
            rotationX: desktop ? 12 : 3,
            rotationY: desktop ? -6 : 0,
            y: desktop ? 55 : 18,
            scale: 1.06,
          },
          {
            rotationX: 0,
            rotationY: 0,
            y: 0,
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: page.querySelector(".case-hero-art"),
              start: "top 92%",
              end: "top 18%",
              scrub: 0.65,
            },
          },
        );
        // Le journal se déplace à l’intérieur de son masque. Le texte reste sticky
        // en CSS sur grand écran ; aucune hauteur de pin artificielle n’est ajoutée.
        gsap.fromTo(
          page.querySelector(".case-journal img"),
          { yPercent: 0, scale: 1 },
          {
            yPercent: -12,
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: page.querySelector(".case-journal-window"),
              start: "top bottom",
              end: "bottom top",
              scrub: 0.7,
            },
          },
        );
        gsap.fromTo(
          page.querySelector(".case-video-wrap"),
          {
            clipPath: "inset(6% 7% 0% 7% round 24px)",
          },
          {
            clipPath: "inset(0% 0% 0% 0% round 10px)",
            ease: "none",
            scrollTrigger: {
              trigger: page.querySelector(".case-demo-media"),
              start: "top 95%",
              end: "top 55%",
              scrub: 0.45,
            },
          },
        );
        gsap.fromTo(
          page.querySelector(".case-phone"),
          {
            y: desktop ? 100 : 24,
            rotationZ: desktop ? -7 : 0,
            rotationY: desktop ? -14 : 0,
          },
          {
            y: 0,
            rotationZ: 0,
            rotationY: 0,
            ease: "none",
            scrollTrigger: {
              trigger: page.querySelector(".case-mobile"),
              start: "top 85%",
              end: "center 45%",
              scrub: 0.7,
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
