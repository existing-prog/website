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
    const track = section.querySelector<HTMLElement>(".atelier-scene-track")!;
    const stage = section.querySelector<HTMLElement>(".atelier-pizza-stage")!;
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
      },
      (context) => {
        const { animated } = context.conditions!;
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
        const beats = section.querySelectorAll<HTMLElement>(".atelier-scene-beat");
        const progressLine = gsap.quickSetter(
          section.querySelector(".atelier-scene-progress > span"),
          "scaleX",
        );
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
        // Le titre et la légende restent visibles dès le début. Seul le repère
        // narratif change ; aucune moitié de l’écran ne reste volontairement vide.
        const update = (value: number) => {
          smoothProgress(value);
          progressLine(value);
          const step = value < 0.32 ? 0 : value < 0.76 ? 1 : 2;
          beats.forEach((beat, index) => {
            beat.dataset.active = String(index === step);
          });
        };
        const clearScene = () => {
          beats.forEach((beat) => delete beat.dataset.active);
          section
            .querySelector(".atelier-scene-progress > span")
            ?.removeAttribute("style");
        };
        // La progression du film vient directement du déclencheur. Elle ne
        // dépend pas de l’initialisation d’une timeline au premier geste.
        const trigger = ScrollTrigger.create({
          trigger: track,
          start: "top 80px",
          end: () => `+=${Math.max(1, track.offsetHeight - stage.offsetHeight)}`,
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
          clearScene();
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
        // Les changements de largeur/hauteur recalculent la même scène CSS,
        // sans reconstruire la vidéo ni modifier la position de défilement.
        const resize = new ResizeObserver(() => {
          cancelAnimationFrame(refreshFrame);
          refreshFrame = requestAnimationFrame(() => {
            if (active) ScrollTrigger.refresh();
          });
        });
        resize.observe(stage);
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
          clearScene();
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
