/* Géométrie dans le repère 1000 × 1000 de la photo, mesurée sur l’image :
 * les découpes se croisent en (496, 496) ; la part retirée est le secteur
 * haut-droit, entre la découpe verticale (≈ -89,5°) et la diagonale (≈ -46,5°).
 * Sa pointe (le centre) sert de pivot aux animations. */
export const APEX = { x: 496, y: 496 };
export const PIVOT = `${APEX.x} ${APEX.y}`;
export const SLICE = "M496 496 L497 -34 A530 530 0 0 1 861 112 Z";
/** Bissectrice du secteur (‑68°) : direction dans laquelle la part s’éloigne. */
export const AXIS = { x: 0.3746, y: -0.9272 };
/** Cinq bouchées de la pointe vers la croûte, légèrement décalées à gauche puis à droite. */
export const BITES = [70, 150, 225, 295, 355].map((distance, index) => {
  const side = index % 2 ? 1 : -1;
  return {
    x: APEX.x + AXIS.x * distance - side * 14 * AXIS.y,
    y: APEX.y + AXIS.y * distance + side * 14 * AXIS.x,
    // La dernière bouchée s’arrête avant la croûte (rayon de la pizza ≈ 500).
    r: [62, 80, 92, 100, 104][index],
  };
});
