import { useEffect } from "react";

/** Reflets délégués et carte flottante. Une boucle RAF uniquement pendant le mouvement,
 * sans rendu React. Les angles suivent une interpolation dépendant du temps, donc
 * l’inertie reste identique à 60 ou 120 Hz. Aucun suivi tactile ou en mouvement réduit.
 */
export function useGlassMotion() {
  useEffect(() => {
    const media = matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    const variables = [
      "--light-x",
      "--light-y",
      "--tilt-x",
      "--tilt-y",
      "--pointer-roll",
      "--pointer-x",
      "--pointer-y",
    ];
    const rest = () => ({
      pitch: 0,
      yaw: 0,
      roll: 0,
      x: 0,
      y: 0,
      lightX: 50,
      lightY: 50,
    });
    let current = rest(),
      target = rest();
    let active: HTMLElement | null = null;
    let frame = 0,
      previousTime = 0,
      x = 0,
      y = 0;
    let input = false,
      returning = false;
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
      if (active) variables.forEach((name) => active!.style.removeProperty(name));
      active = null;
      current = rest();
      target = rest();
      returning = false;
      input = false;
    };
    // L’ensemble du hero pilote l’aperçu, sans devoir viser une carte en mouvement.
    const resolve = (node: EventTarget | null): HTMLElement | null => {
      if (!(node instanceof Element)) return null;
      return (
        node.closest<HTMLElement>(".glass-interactive") ||
        node.closest(".hero")?.querySelector<HTMLElement>(".showcase-window") ||
        null
      );
    };
    const paint = (time: number) => {
      frame = 0;
      if (!active?.isConnected) {
        reset();
        return;
      }
      const preview = active.classList.contains("showcase-window");
      if (input) {
        input = false;
        // Mesurer le hero stable, jamais la carte transformée : pas de rétroaction
        // entre sa rotation et les coordonnées du pointeur (source de tremblements).
        const area = preview ? active.closest<HTMLElement>(".hero")! : active;
        const rect = area.getBoundingClientRect();
        const px = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
        const py = Math.max(0, Math.min(1, (y - rect.top) / rect.height));
        target = {
          pitch: (0.5 - py) * (preview ? 36 : 5),
          yaw: (px - 0.5) * (preview ? 56 : 6),
          roll: preview ? (px - 0.5) * 8 : 0,
          x: preview ? (px - 0.5) * 20 : 0,
          y: preview ? (py - 0.5) * 16 : 0,
          lightX: px * 100,
          lightY: py * 100,
        };
      }
      const delta = previousTime ? Math.min(64, time - previousTime) : 16.67;
      previousTime = time;
      const weight = preview ? 1 - Math.exp(-delta / 125) : 1;
      let unsettled = false;
      for (const key of Object.keys(current) as (keyof typeof current)[]) {
        current[key] += (target[key] - current[key]) * weight;
        if (Math.abs(target[key] - current[key]) > 0.015) unsettled = true;
      }
      if (!returning) {
        active.style.setProperty("--light-x", `${current.lightX}%`);
        active.style.setProperty("--light-y", `${current.lightY}%`);
      }
      active.style.setProperty("--tilt-x", `${current.pitch}deg`);
      active.style.setProperty("--tilt-y", `${current.yaw}deg`);
      active.style.setProperty("--pointer-roll", `${current.roll}deg`);
      active.style.setProperty("--pointer-x", `${current.x}px`);
      active.style.setProperty("--pointer-y", `${current.y}px`);
      if (unsettled) frame = requestAnimationFrame(paint);
      else if (returning) reset();
      else previousTime = 0;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const returnHome = () => {
      if (!active || returning) return;
      active.style.removeProperty("--light-x");
      active.style.removeProperty("--light-y");
      returning = true;
      input = false;
      target = rest();
      schedule();
    };
    const move = (event: PointerEvent) => {
      if (!media.matches || event.pointerType === "touch") return;
      const next = resolve(event.target);
      if (!next && active?.classList.contains("showcase-window")) {
        returnHome();
        return;
      }
      if (next !== active) {
        reset();
        active = next;
      }
      if (!active) return;
      returning = false;
      x = event.clientX;
      y = event.clientY;
      input = true;
      schedule();
    };
    const leave = (event: PointerEvent) => {
      if (!active || resolve(event.relatedTarget) === active) return;
      if (!active.classList.contains("showcase-window")) {
        reset();
        return;
      }
      // Retirer le reflet immédiatement mais laisser la carte revenir en douceur.
      returnHome();
    };
    const preference = () => {
      if (!media.matches) reset();
    };
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerout", leave, { passive: true });
    window.addEventListener("blur", reset);
    media.addEventListener("change", preference);
    return () => {
      reset();
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerout", leave);
      window.removeEventListener("blur", reset);
      media.removeEventListener("change", preference);
    };
  }, []);
}
