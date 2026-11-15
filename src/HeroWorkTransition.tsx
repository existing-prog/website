import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./hero-work-transition.scss";

gsap.registerPlugin(ScrollTrigger);

/**
 * Accompagner la sortie de l’accueil avec un mouvement local et discret.
 * Seul le parent du cadre bouge : le lien, les contrôles et le reflet au pointeur
 * conservent leur fonctionnement. Aucun double, calque fixe ou espace ajouté.
 */
export default function HeroWorkTransition() {
  useLayoutEffect(() => {
    const hero = document.querySelector<HTMLElement>(".hero");
    const stage = hero?.querySelector<HTMLElement>(".hero-stage");
    if (!hero || !stage) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        stage,
        { "--arrival-lift": "0px" },
        {
          "--arrival-lift": "-24px",
          ease: "none",
          scrollTrigger: {
            trigger: stage,
            start: "top 35%",
            end: "bottom top",
            scrub: 0.35,
            invalidateOnRefresh: true,
          },
        },
      );
    });
    // Retirer aussi les variables CSS lors d’un changement de préférence ou de vue.
    return () => media.revert();
  }, []);
  return null;
}
