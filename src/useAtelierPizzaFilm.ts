import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { asset } from "./data";

gsap.registerPlugin(ScrollTrigger);

/** Le scroll choisit une image du film, sans lecture automatique.
 * Une seule recherche est envoyée au décodeur à la fois ; les gestes rapides
 * remplacent la cible en attente plutôt que de créer une file de recherches.
 * Le hook reste monté lors d’une traduction pour conserver l’image courante.
 */
export function useAtelierPizzaFilm(root: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const page = root.current;
    if (!page) return;
    const section = page.querySelector<HTMLElement>(".atelier-unfold")!;
    const track = section.querySelector<HTMLElement>(".atelier-pizza-track")!;
    const visual = section.querySelector<HTMLElement>(".atelier-pizza-visual")!;
    const video = section.querySelector<HTMLVideoElement>(".atelier-pizza-film")!;
    const media = gsap.matchMedia();

    function release() {
      video.pause();
      video.removeAttribute("src");
      video.load();
      delete section.dataset.videoReady;
    }

    media.add(
      {
        all: "all",
        // Les ordinateurs peu hauts gardent la composition statique : leur
        // hauteur disponible ne permet pas le sticky et le texte côte à côte.
        animated:
          "(prefers-reduced-motion: no-preference) and (min-height: 700px), (prefers-reduced-motion: no-preference) and (max-width: 1023px) and (min-height: 600px)",
        wide: "(min-width: 1024px) and (min-height: 700px)",
      },
      (context) => {
        const { animated, wide } = context.conditions!;
        section.dataset.filmMode = "static";
        if (!animated || !video.canPlayType("video/mp4")) {
          release();
          return;
        }
        section.dataset.filmMode = "scroll";
        const events = new AbortController();
        let active = true;
        let failed = false;
        let requested = 0;
        let frame = 0;
        let refreshFrame = 0;
        let loaded = false;

        const queueFrame = () => {
          if (frame || !active || failed) return;
          frame = requestAnimationFrame(() => {
            frame = 0;
            if (
              !active ||
              failed ||
              document.hidden ||
              video.readyState < 1 ||
              !Number.isFinite(video.duration)
            )
              return;
            // Éviter l’extrémité exacte du fichier : certains décodeurs mobiles
            // affichent une image noire à duration, au lieu de la dernière image.
            const end = Math.max(0, video.duration - 1 / 30);
            const target = requested * end;
            if (!video.seeking && Math.abs(video.currentTime - target) > 1 / 48) {
              try {
                video.currentTime = target;
              } catch {
                /* Le chargement reprendra au prochain événement média. */
              }
            } else if (!video.seeking && video.readyState >= 2) {
              section.dataset.videoReady = "true";
            }
          });
        };
        const copy = section.querySelector<HTMLElement>(".atelier-reveal-copy")!;
        const hint = section.querySelector<HTMLElement>(".atelier-scroll-label")!;
        const opacity = gsap.quickSetter(copy, "opacity");
        const translate = gsap.quickSetter(copy, "y", "px");
        const hintOpacity = gsap.quickSetter(hint, "opacity");
        const progress = { value: 0 };
        const smoothProgress = gsap.quickTo(progress, "value", {
          duration: 0.2,
          ease: "power2.out",
          onUpdate: () => {
            if (!active || failed) return;
            requested = progress.value;
            section.dataset.filmProgress = requested.toFixed(3);
            queueFrame();
          },
        });
        const clearCopy = () => {
          copy.style.removeProperty("opacity");
          copy.style.removeProperty("transform");
          hint.style.removeProperty("opacity");
        };
        const update = (value: number) => {
          smoothProgress(value);
          const reveal = gsap.utils.clamp(0, 1, (value - 0.78) / 0.22);
          const eased = 1 - (1 - reveal) ** 3;
          opacity(eased);
          translate(26 * (1 - eased));
          hintOpacity(1 - gsap.utils.clamp(0, 1, (value - 0.02) / 0.08));
        };
        // La progression du film vient directement du déclencheur. Elle ne
        // dépend pas de l’initialisation d’une timeline au premier geste.
        const trigger = ScrollTrigger.create({
          trigger: wide ? section : track,
          start: wide ? "top 110px" : "top 80px",
          end: wide
            ? "bottom bottom"
            : () => `+=${Math.max(1, track.offsetHeight - visual.offsetHeight)}`,
          invalidateOnRefresh: true,
          onUpdate: (self) => update(self.progress),
          onRefresh: (self) => update(self.progress),
        });
        update(trigger.progress);

        const fail = () => {
          if (!active || failed) return;
          failed = true;
          trigger.kill();
          smoothProgress.tween.kill();
          clearCopy();
          section.dataset.filmMode = "fallback";
          delete section.dataset.videoReady;
          video.pause();
          video.removeAttribute("src");
          video.load();
          // Retirer aussi la longue piste si le réseau ou le codec échoue.
          refreshFrame = requestAnimationFrame(() => {
            if (active) ScrollTrigger.refresh();
          });
        };
        const onSeeked = () => {
          if (!active || failed) return;
          if (video.readyState >= 2) section.dataset.videoReady = "true";
          queueFrame();
        };
        video.addEventListener("loadedmetadata", queueFrame, { signal: events.signal });
        video.addEventListener("loadeddata", queueFrame, { signal: events.signal });
        video.addEventListener("seeked", onSeeked, { signal: events.signal });
        video.addEventListener("error", fail, { signal: events.signal });
        document.addEventListener("visibilitychange", queueFrame, {
          signal: events.signal,
        });

        // Le film ne se télécharge qu’à proximité de la scène, et jamais en
        // mouvement réduit. La page d’accueil ne monte pas cette étude de cas.
        const load = () => {
          if (loaded || !active || failed) return;
          loaded = true;
          video.src = asset("atelier-film/pizza-scroll-v1.mp4");
          video.preload = "auto";
          video.load();
        };
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
              load();
              observer.disconnect();
            }
          },
          { rootMargin: "700px 0px" },
        );
        observer.observe(section);
        const resize = new ResizeObserver(() => {
          if (!active) return;
          const height = `${visual.offsetHeight}px`;
          if (track.style.getPropertyValue("--atelier-film-height") === height) return;
          track.style.setProperty("--atelier-film-height", height);
          cancelAnimationFrame(refreshFrame);
          refreshFrame = requestAnimationFrame(() => {
            if (active) ScrollTrigger.refresh();
          });
        });
        resize.observe(visual);
        queueFrame();
        return () => {
          active = false;
          events.abort();
          observer.disconnect();
          resize.disconnect();
          cancelAnimationFrame(frame);
          cancelAnimationFrame(refreshFrame);
          trigger.kill();
          smoothProgress.tween.kill();
          clearCopy();
          track.style.removeProperty("--atelier-film-height");
          delete section.dataset.filmProgress;
          release();
        };
      },
    );
    return () => {
      media.revert();
      section.dataset.filmMode = "static";
      release();
    };
  }, [root]);
}
