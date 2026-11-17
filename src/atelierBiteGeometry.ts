/* Géométrie dans le repère 1000 × 1000 de la photo : la part retirée est le
 * secteur haut-droit, entre la découpe verticale et la diagonale. Sa pointe est
 * le centre de la pizza (500, 500), qui sert aussi de pivot aux animations. */
export const SLICE = "M500 500 L500 -12 A512 512 0 0 1 862 138 Z";
/** Bissectrice du secteur (‑67,5°) : direction dans laquelle la part s’éloigne. */
export const AXIS = { x: 0.383, y: -0.924 };
/** Cinq bouchées de la pointe vers la croûte, légèrement décalées à gauche puis à droite. */
export const BITES = [70, 150, 225, 295, 355].map((distance, index) => {
  const side = index % 2 ? 1 : -1;
  return {
    x: 500 + AXIS.x * distance + side * 14 * 0.924,
    y: 500 + AXIS.y * distance + side * 14 * 0.383,
    // La dernière bouchée s’arrête avant la croûte (rayon de la pizza ≈ 500).
    r: [62, 80, 92, 100, 104][index],
  };
});
/** Décalages horizontaux des fils de fromage étirés entre la pizza et la part. */
export const STRANDS = [-16, 2, 18];
