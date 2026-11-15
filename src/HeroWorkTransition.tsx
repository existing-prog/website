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
      // Les orbites et la lumière créent la profondeur autour du vrai aperçu.
      // Le cadre et ses boutons gardent leur taille et leur zone de clic.
      gsap.fromTo(
        stage,
        { "--orbit-turn": "0deg", "--orbit-rise": "0px", "--orbit-light": 0.6 },
        {
          "--orbit-turn": "65deg",
          "--orbit-rise": "-36px",
          "--orbit-light": 1,
          ease: "none",
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "bottom top",
            scrub: 0.6,
          },
        },
      );
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
