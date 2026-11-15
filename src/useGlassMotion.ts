import { useEffect } from "react";

/**
 * Lumière au pointeur : au plus une mise à jour par image, sans rendu React.
 * La délégation couvre aussi les cartes ajoutées après navigation ou ouverture du bureau.
 * Aucun effet sur écran tactile ou lorsque la réduction des mouvements est demandée.
 */
export function useGlassMotion() {
  useEffect(() => {
    const media = matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    let active: HTMLElement | null = null;
    let frame = 0;
    let x = 0,
      y = 0;
    // Retirer les variables laisse les valeurs de repos définies par le thème CSS.
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      if (active) {
        active.style.removeProperty("--light-x");
        active.style.removeProperty("--light-y");
        active.style.removeProperty("--tilt-x");
        active.style.removeProperty("--tilt-y");
        active = null;
      }
    };
    // Une seule lecture géométrique par frame, puis des écritures de variables CSS.
    const paint = () => {
      frame = 0;
      if (!active || !active.isConnected) return;
      const r = active.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const px = Math.max(0, Math.min(1, (x - r.left) / r.width)),
        py = Math.max(0, Math.min(1, (y - r.top) / r.height));
      active.style.setProperty("--light-x", `${px * 100}%`);
      active.style.setProperty("--light-y", `${py * 100}%`);
      // Amplifier uniquement l’aperçu principal, pas les autres cartes du site.
      const preview = active.classList.contains("showcase-window");
      active.style.setProperty("--tilt-x", `${(0.5 - py) * (preview ? 12 : 5)}deg`);
      active.style.setProperty("--tilt-y", `${(px - 0.5) * (preview ? 20 : 6)}deg`);
    };
    const move = (event: PointerEvent) => {
      if (!media.matches || event.pointerType === "touch") return;
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>(".glass-interactive")
          : null;
      if (target !== active) {
        reset();
        active = target;
      }
      if (!active) return;
      x = event.clientX;
      y = event.clientY;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const leave = (event: PointerEvent) => {
      if (
        active &&
        !(event.relatedTarget instanceof Node && active.contains(event.relatedTarget))
      )
        reset();
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
