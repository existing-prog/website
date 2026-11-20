import { useEffect, useRef } from "react";
import "./world.scss";

/**
 * Fond 3D de l’accueil (« le fil »). Le composant ne fait qu’afficher un canvas
 * fixe : Three.js et la scène sont chargés à part, une fois la page au repos,
 * et seulement si le mouvement est permis et WebGL disponible. Sinon, le site
 * reste exactement tel qu’avant (fond uni, animations existantes).
 */
export default function WorldBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    let idle = 0;

    const supportsWebGL = () => {
      try {
        const probe = document.createElement("canvas");
        return !!(probe.getContext("webgl2") || probe.getContext("webgl"));
      } catch {
        return false;
      }
    };

    const load = () => {
      if (cleanup || cancelled || !motion.matches || !supportsWebGL()) return;
      const light = window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;
      import("./worldScene")
        .then(({ mountWorld }) => {
          if (cancelled || !motion.matches || cleanup) return;
          cleanup = mountWorld(canvas, light, () => {
            document.documentElement.classList.add("has-world");
          });
        })
        .catch(() => {
          // Pas de 3D (chunk indisponible, contexte refusé) : le site reste intact.
        });
    };

    const unload = () => {
      document.documentElement.classList.remove("has-world");
      cleanup?.();
      cleanup = undefined;
    };

    // Attendre que la page soit au repos : la 3D ne retarde jamais le contenu.
    const schedule = () => {
      if ("requestIdleCallback" in window) {
        idle = window.requestIdleCallback(load, { timeout: 2000 });
      } else {
        idle = globalThis.setTimeout(load, 800) as unknown as number;
      }
    };
    const onMotionChange = () => (motion.matches ? schedule() : unload());

    schedule();
    motion.addEventListener("change", onMotionChange);
    return () => {
      cancelled = true;
      if ("cancelIdleCallback" in window) window.cancelIdleCallback(idle);
      else globalThis.clearTimeout(idle);
      motion.removeEventListener("change", onMotionChange);
      unload();
    };
  }, []);

  return <canvas ref={canvasRef} className="world-canvas" aria-hidden="true" />;
}
