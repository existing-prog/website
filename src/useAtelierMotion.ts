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
            page.querySelectorAll(".atelier-reveal-copy .case-word"),
            { yPercent: 110 },
            { yPercent: 0, duration: 0.2, stagger: 0.035, ease: "power2.out" },
            0.53,
          );
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
