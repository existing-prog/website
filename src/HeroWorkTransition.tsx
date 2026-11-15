import { useLayoutEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { asset, projects } from "./data";
import { tr } from "./i18n";
import { ArrowUpRight } from "lucide-react";
import "./hero-work-transition.scss";

gsap.registerPlugin(ScrollTrigger);

/**
 * Passage du hero aux réalisations, sans espace ajouté ni défilement intercepté.
 * Un double purement décoratif porte la caméra : le vrai lien et les animations
 * au pointeur conservent leur DOM et leurs transformations. Le contexte GSAP
 * restaure la présentation statique à chaque démontage ou changement de média.
 */
export default function HeroWorkTransition({ preview }: { preview: number }) {
  const layer = useRef<HTMLDivElement>(null);
  const keyboardSuspended = useRef(false);
  const { i18n } = useTranslation();
  const project = projects[preview];

  useLayoutEffect(() => {
    const overlay = layer.current;
    const hero = document.querySelector<HTMLElement>(".hero");
    const source = hero?.querySelector<HTMLElement>(".showcase-window");
    const work = document.querySelector<HTMLElement>("#work");
    const frame = overlay?.querySelector<HTMLElement>(".handoff-frame");
    if (!overlay || !hero || !source || !work || !frame) return;

    let alive = true;
    const media = gsap.matchMedia();
    media.add(
      {
        desktop: "(min-width: 1024px) and (min-height: 650px)",
        motion: "(prefers-reduced-motion: no-preference)",
        reduced: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { desktop, motion } = context.conditions!;
        overlay.dataset.mode = motion ? (desktop ? "desktop" : "mobile") : "static";
        overlay.dataset.progress = "0";
        if (!motion) return;

        if (!desktop) {
          // Sur téléphone, une respiration locale remplace le passage plein cadre.
          // Animer le parent préserve l’inclinaison propre au cadre et les contrôles.
          const stage = hero.querySelector<HTMLElement>(".hero-stage")!;
          gsap.fromTo(
            stage,
            { "--arrival-lift": "0px", "--arrival-scale": 1 },
            {
              "--arrival-lift": "-14px",
              "--arrival-scale": 1.025,
              ease: "none",
              scrollTrigger: {
                id: "hero-work-mobile",
                trigger: stage,
                start: "top 75%",
                end: "bottom 20%",
                scrub: true,
                invalidateOnRefresh: true,
              },
            },
          );
          return;
        }

        const camera = { progress: 0 };
        let geometry = { x: 0, y: 0, width: 0, height: 0, angle: -5, end: 1 };
        const clamp = gsap.utils.clamp(0, 1);
        const ease = gsap.parseEase("power2.inOut");
        const mix = gsap.utils.interpolate;

        // Mesurer seulement au refresh : aucune lecture géométrique dans le scroll.
        const measure = () => {
          const rect = source.getBoundingClientRect();
          const matrix = new DOMMatrixReadOnly(getComputedStyle(source).transform);
          const anchorInset =
            parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
          geometry = {
            x: rect.left + rect.width / 2 - source.offsetWidth / 2,
            y: rect.top + scrollY + rect.height / 2 - source.offsetHeight / 2,
            width: source.offsetWidth,
            height: source.offsetHeight,
            angle: (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI,
            end: Math.max(
              1,
              work.getBoundingClientRect().top + scrollY - Math.max(80, anchorInset),
            ),
          };
        };

        const draw = () => {
          const p = camera.progress;
          const active = !keyboardSuspended.current && p > 0.001 && p < 0.999;
          overlay.dataset.progress = p.toFixed(4);
          overlay.style.visibility = active ? "visible" : "hidden";
          hero.dataset.handoff = active ? "active" : "rest";
          hero.style.setProperty("--handoff-dim", active ? `${clamp(p * 3)}` : "0");
          if (!active) return;

          const opening = ease(clamp(p / 0.64));
          const departure = ease(clamp((p - 0.61) / 0.39));
          const width = Math.min(innerWidth - 80, 1600);
          const height = Math.min(innerHeight - 100, width * 0.62);
          const x = mix(geometry.x, (innerWidth - width) / 2, opening);
          const y = mix(geometry.y - scrollY, (innerHeight - height) / 2, opening);

          // Une seule surface isolée change de taille. L’image reste nette et les
          // textes du vrai site ne sont jamais étirés. La fermeture est un volet
          // ascendant : elle dévoile la section au lieu de retarder son arrivée.
          frame.style.width = `${mix(geometry.width, width, opening)}px`;
          frame.style.height = `${mix(geometry.height, height, opening)}px`;
          frame.style.transform = `translate3d(${x}px, ${y - departure * 40}px, 0) rotate(${mix(geometry.angle, 0, opening)}deg)`;
          frame.style.clipPath = `inset(0 0 ${departure * 100}% 0 round ${mix(13, 20, opening)}px)`;
          frame.style.setProperty("--handoff-glint", `${Math.sin(opening * Math.PI)}`);
          overlay.style.setProperty("--handoff-shade", `${Math.sin(p * Math.PI) * 0.94}`);
        };

        measure();
        // Lisser les crans d’une molette sans lisser ni détourner le scroll réel.
        // Aux extrémités et au refresh, rejoindre immédiatement l’état exact :
        // une ancre ou un retour en haut ne doit jamais laisser de volet résiduel.
        const follow = gsap.quickTo(camera, "progress", {
          duration: 0.28,
          ease: "power2.out",
          onUpdate: draw,
        });
        const settle = (trigger: ScrollTrigger) => {
          follow.tween.pause();
          camera.progress = trigger.progress;
          draw();
        };
        ScrollTrigger.create({
          id: "hero-work-desktop",
          start: 0,
          end: () => geometry.end,
          onRefreshInit: measure,
          onUpdate: (trigger) => {
            if (trigger.progress <= 0.001 || trigger.progress >= 0.999) settle(trigger);
            else follow(trigger.progress);
          },
          onRefresh: settle,
        });
        draw();

        // Ne jamais laisser une couche décorative masquer un élément au clavier.
        // La suspension persiste aussi après un changement de projet ou de langue.
        const suspend = (event: KeyboardEvent | FocusEvent) => {
          if (event instanceof KeyboardEvent && event.key !== "Tab") return;
          if (
            event instanceof FocusEvent &&
            (!(event.target instanceof Element) ||
              !event.target.matches(":focus-visible"))
          )
            return;
          keyboardSuspended.current = true;
          draw();
        };
        document.addEventListener("keydown", suspend);
        hero.addEventListener("focusin", suspend);
        return () => {
          document.removeEventListener("keydown", suspend);
          hero.removeEventListener("focusin", suspend);
          overlay.style.visibility = "hidden";
          overlay.style.removeProperty("--handoff-shade");
          hero.removeAttribute("data-handoff");
          hero.style.removeProperty("--handoff-dim");
        };
      },
    );

    // Les dimensions sont recalculées après le chargement des polices et images.
    const refresh = () => {
      if (alive) ScrollTrigger.refresh();
    };
    document.fonts.ready.then(refresh);
    const image = source.querySelector("img");
    image?.addEventListener("load", refresh);
    return () => {
      alive = false;
      image?.removeEventListener("load", refresh);
      media.revert();
    };
  }, [preview, i18n.resolvedLanguage]);

  return (
    <div className="hero-handoff" ref={layer} aria-hidden="true" inert>
      <div className="handoff-atmosphere" />
      <div className="handoff-frame">
        <div className="handoff-toolbar">
          <span className="handoff-dots">
            <i />
            <i />
            <i />
          </span>
          <span>{project.name.toLowerCase().replaceAll(" ", "-")}.design</span>
          <ArrowUpRight size={12} />
        </div>
        <div className="handoff-image">
          <img src={asset(project.image)} alt="" width="1200" height="630" />
        </div>
        <div className="handoff-caption">
          <div>
            <span>{tr(project.kind)}</span>
            <strong>{project.name}</strong>
          </div>
          <span className="handoff-index">
            0{preview + 1}
            <small>/ 03</small>
          </span>
        </div>
        <div className="handoff-glint" />
      </div>
    </div>
  );
}
