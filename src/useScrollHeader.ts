import { useEffect } from "react";

/** Navigation persistante : petits mouvements ignorés, remontée immédiatement lisible.
 * Une seule lecture par frame ; aucun changement de hauteur ni de position du contenu.
 */
export function useScrollHeader(menuOpen: boolean, workspace: boolean) {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    if (!header) return;
    let previous = Math.max(0, scrollY);
    let distance = 0;
    let frame = 0;
    const show = () => {
      header.dataset.hidden = "false";
    };
    const update = () => {
      frame = 0;
      const current = Math.max(0, scrollY);
      const delta = current - previous;
      previous = current;
      distance = Math.sign(delta) === Math.sign(distance) ? distance + delta : delta;
      const keyboardFocus = header.querySelector(":focus-visible");
      if (current < 128 || menuOpen || keyboardFocus) show();
      else if (distance < -8) show();
      else if (distance > 12) header.dataset.hidden = "true";
      header.dataset.scrolled = String(current > 24);
    };
    const scroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    show();
    window.addEventListener("scroll", scroll, { passive: true });
    header.addEventListener("focusin", show);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scroll);
      header.removeEventListener("focusin", show);
      delete header.dataset.hidden;
      delete header.dataset.scrolled;
    };
  }, [menuOpen, workspace]);
}
