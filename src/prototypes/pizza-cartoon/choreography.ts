/**
 * Variante C : une seule prise, puis une sortie définitive vers le haut à droite.
 * La part reste entière jusqu’à être entièrement hors champ. Aucun trajet retour,
 * aucun état intermédiaire de bouchée, même lorsque la caméra revient au-dessus.
 * La pose dépend uniquement du scroll pour permettre de rembobiner proprement.
 */
export function easeRange(progress: number, from: number, to: number) {
  const t = Math.min(1, Math.max(0, (progress - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

export function takeawayPose(progress: number) {
  const travel = easeRange(progress, 0.62, 0.74);
  let phase = "pickup";
  if (progress >= 0.62) phase = "outward";
  if (progress >= 0.74) phase = "outside";
  if (progress >= 0.8) phase = "overhead";
  return {
    travel,
    // Changer la géométrie pendant la respiration hors champ, avant la caméra.
    bite: progress >= 0.77 ? 5 : 0,
    roll: travel * 0.07,
    twist: travel * -0.04,
    handVisible: progress > 0.1 && progress < 0.795,
    phase,
  };
}
