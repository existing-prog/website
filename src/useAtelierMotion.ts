import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

/** Le scroll reste natif. Le sticky est limité à la scène, sans pin plein écran.
 * Le film de la pizza possède sa propre chronologie et son cycle de chargement.
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
        // Entrée éditoriale : les titres ont des masques de mots et gardent leur
        // nom accessible complet. Les paragraphes restent des textes ordinaires.
        gsap.fromTo(
          page.querySelectorAll(
            ".atelier-intro-details, .atelier-intro > .atelier-project-note",
          ),
          { y: 14, opacity: 0.4 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.1,
            delay: 0.15,
            ease: "power2.out",
          },
        );
        page
          .querySelectorAll(".atelier-web h2, .atelier-editing h2, .atelier-contact h2")
          .forEach((title) => {
            gsap.fromTo(
              title.querySelectorAll(".case-word"),
              { yPercent: 110, rotationZ: 1.5 },
              {
                yPercent: 0,
                rotationZ: 0,
                stagger: 0.045,
                duration: 0.85,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: title,
                  start: "top 91%",
                  toggleActions: "play none none reverse",
                },
              },
            );
          });
        page
          .querySelectorAll(".atelier-section-copy, .atelier-contact > .shell")
          .forEach((copy) => {
            gsap.fromTo(
              copy.querySelectorAll(
                ":scope > .eyebrow, :scope > p:not(.eyebrow), :scope > .case-contact-actions",
              ),
              { y: desktop ? 20 : 12, opacity: 0.4 },
              {
                y: 0,
                opacity: 1,
                duration: 0.7,
                stagger: 0.13,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: copy,
                  start: "top 91%",
                  toggleActions: "play none none reverse",
                },
              },
            );
          });
        // Chaque bloc n’appartient qu’à une chorégraphie : éviter les doubles
        // translations sur les conteneurs déjà animés par leurs enfants.
        page
          .querySelectorAll(
            ".atelier-reveal:not(.atelier-section-copy):not(.atelier-checks):not(.atelier-contact > .shell), .atelier-guided-demo",
          )
          .forEach((el) =>
            gsap.fromTo(
              el,
              { y: desktop ? 26 : 14, opacity: 0.4 },
              {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: el,
                  start: "top 93%",
                  toggleActions: "play none none reverse",
                },
              },
            ),
          );
        page.querySelectorAll(".atelier-checks").forEach((list) =>
          gsap.fromTo(
            list.querySelectorAll("li"),
            { x: desktop ? 16 : 0, y: 10, opacity: 0.4 },
            {
              x: 0,
              y: 0,
              opacity: 1,
              duration: 0.65,
              stagger: 0.1,
              scrollTrigger: {
                trigger: list,
                start: "top 92%",
                toggleActions: "play none none reverse",
              },
            },
          ),
        );
        const viewport = page.querySelector(".atelier-site-viewport");
        if (desktop) {
          // L’ouverture suit la capture, dans ses limites ; aucun agrandissement
          // plein écran. Seule l’image est légèrement mise à l’échelle, sans contrôle.
          gsap.fromTo(
            viewport,
            { y: 30, rotationX: 2, clipPath: "inset(4% 2% 0% 2% round 10px)" },
            {
              y: 0,
              rotationX: 0,
              clipPath: "inset(0% 0% 0% 0% round 10px)",
              ease: "none",
              scrollTrigger: {
                trigger: viewport,
                start: "top 94%",
                end: "top 26%",
                scrub: 0.65,
              },
            },
          );
          gsap.fromTo(
            page.querySelector(".atelier-site-viewport img"),
            { scale: 1.025 },
            {
              scale: 1,
              ease: "none",
              scrollTrigger: {
                trigger: viewport,
                start: "top 94%",
                end: "top 26%",
                scrub: 0.65,
              },
            },
          );
        } else {
          gsap.fromTo(
            viewport,
            { y: 14, opacity: 0.5 },
            {
              y: 0,
              opacity: 1,
              duration: 0.75,
              scrollTrigger: {
                trigger: viewport,
                start: "top 93%",
                toggleActions: "play none none reverse",
              },
            },
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
