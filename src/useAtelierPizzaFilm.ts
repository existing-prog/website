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
        let suspended = document.hidden;
        let recoveryTimer = 0;
        let recoveryAttempts = 0;
        let resumeFrame = 0;

        const clearRecoveryTimer = () => {
          window.clearTimeout(recoveryTimer);
          recoveryTimer = 0;
        };
        const watchDecoder = (delay: number) => {
          // Un seul délai pour le chargement ou la recherche en cours. Il ne
          // tourne jamais en arrière-plan et ne s’accumule pas au scroll.
          if (recoveryTimer || document.hidden || suspended) return;
          recoveryTimer = window.setTimeout(() => {
            recoveryTimer = 0;
            recoverDecoder();
          }, delay);
        };

        function recoverDecoder() {
          if (!active || failed || !loaded || document.hidden || suspended) return;
          if (recoveryAttempts >= 2) {
            fail();
            return;
          }
          recoveryAttempts += 1;
          clearRecoveryTimer();
          cancelAnimationFrame(frame);
          frame = 0;
          delete section.dataset.videoReady;
          // load() libère les recherches abandonnées et recrée le décodeur
          // suspendu par le téléphone. La source garde son URL pour le cache ;
          // loadedmetadata/loadeddata réappliquent la dernière cible du scroll.
          video.pause();
          video.load();
          watchDecoder(8000);
        }

        const queueFrame = () => {
          if (frame || !active || failed) return;
          frame = requestAnimationFrame(() => {
            frame = 0;
            if (
              !active ||
              failed ||
              document.hidden ||
              suspended ||
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
                watchDecoder(2000);
              } catch {
                /* Le chargement reprendra au prochain événement média. */
              }
            } else if (!video.seeking && video.readyState >= 2) {
              section.dataset.videoReady = "true";
              clearRecoveryTimer();
              recoveryAttempts = 0;
            } else if (video.seeking) {
              watchDecoder(2000);
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
          clearRecoveryTimer();
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
          clearRecoveryTimer();
          if (video.readyState >= 2) section.dataset.videoReady = "true";
          queueFrame();
        };
        video.addEventListener("loadedmetadata", queueFrame, { signal: events.signal });
        video.addEventListener("loadeddata", queueFrame, { signal: events.signal });
        video.addEventListener("seeked", onSeeked, { signal: events.signal });
        video.addEventListener(
          "error",
          () => {
            // Une erreur pendant la suspension sera récupérée au retour, au
            // lieu de condamner l’animation pour toute la visite.
            if (!document.hidden && !suspended) fail();
          },
          { signal: events.signal },
        );

        const suspend = () => {
          suspended = true;
          clearRecoveryTimer();
          cancelAnimationFrame(frame);
          frame = 0;
          cancelAnimationFrame(resumeFrame);
          resumeFrame = 0;
          video.pause();
        };
        const resume = () => {
          if (!active || failed || document.hidden || !suspended || resumeFrame) return;
          // Plusieurs événements de retour peuvent arriver ensemble : une seule
          // remise en route du média à l’image suivante.
          resumeFrame = requestAnimationFrame(() => {
            resumeFrame = 0;
            if (!active || failed || document.hidden || !suspended) return;
            suspended = false;
            recoveryAttempts = 0;
            // Le système peut restaurer une autre position ou hauteur de viewport.
            // Resynchroniser la cible, même si l’utilisateur ne scrolle pas encore.
            trigger.refresh();
            smoothProgress.tween.pause();
            progress.value = requested = trigger.progress;
            section.dataset.filmProgress = requested.toFixed(3);
            recoverDecoder();
            queueFrame();
          });
        };
        document.addEventListener(
          "visibilitychange",
          () => {
            if (document.hidden) suspend();
            else resume();
          },
          {
            signal: events.signal,
          },
        );
        window.addEventListener("pagehide", suspend, { signal: events.signal });
        window.addEventListener(
          "pageshow",
          (event) => {
            if (event.persisted) suspended = true;
            resume();
          },
          { signal: events.signal },
        );
        // freeze/resume couvrent la suspension du processus ; focus ne recharge
        // rien sans suspension préalable (clics, clavier, traduction, etc.).
        document.addEventListener("freeze", suspend, { signal: events.signal });
        document.addEventListener("resume", resume, { signal: events.signal });
        window.addEventListener("focus", resume, { signal: events.signal });

        // Le film ne se télécharge qu’à proximité de la scène, et jamais en
        // mouvement réduit. La page d’accueil ne monte pas cette étude de cas.
        const load = () => {
          if (loaded || !active || failed) return;
          loaded = true;
          video.src = asset("atelier-film/pizza-scroll-v1.mp4");
          video.preload = "auto";
          video.load();
          watchDecoder(8000);
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
          clearRecoveryTimer();
          events.abort();
          observer.disconnect();
          resize.disconnect();
          cancelAnimationFrame(frame);
          cancelAnimationFrame(refreshFrame);
          cancelAnimationFrame(resumeFrame);
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
