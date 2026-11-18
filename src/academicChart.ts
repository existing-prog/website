/**
 * Figure de la maquette académique : anomalie de température de surface de la mer,
 * 1995–2025 (données fictives, tendance réaliste). Repère SVG 100 × 60.
 */
const VALUES = [
  -0.12, -0.05, 0.02, 0.18, -0.02, 0.04, 0.1, 0.16, 0.12, 0.08, 0.2, 0.17, 0.14, 0.22,
  0.19, 0.31, 0.24, 0.27, 0.33, 0.38, 0.52, 0.47, 0.41, 0.45, 0.5, 0.58, 0.49, 0.55, 0.66,
  0.74, 0.71,
];
/** Années de vagues de chaleur marquantes (indices dans VALUES). */
export const HEATWAVES = [3, 9, 14, 20, 28];

const X0 = 6;
const X1 = 96;
const Y0 = 52; // bas du graphique
const Y1 = 8; // haut du graphique
const MIN = -0.2;
const MAX = 0.8;

export const chartPoints = VALUES.map((value, i) => ({
  x: X0 + ((X1 - X0) * i) / (VALUES.length - 1),
  y: Y0 - ((value - MIN) / (MAX - MIN)) * (Y0 - Y1),
}));

/** Courbe lissée (segments de Bézier quadratiques entre les points). */
export const chartLine = chartPoints
  .map((p, i, all) => {
    if (i === 0) return `M${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    const prev = all[i - 1];
    const mx = ((prev.x + p.x) / 2).toFixed(2);
    const my = ((prev.y + p.y) / 2).toFixed(2);
    return `Q${prev.x.toFixed(2)} ${prev.y.toFixed(2)} ${mx} ${my}`;
  })
  .join(" ")
  .concat(` L${chartPoints.at(-1)!.x.toFixed(2)} ${chartPoints.at(-1)!.y.toFixed(2)}`);

/** Surface sous la courbe, fermée sur l’axe horizontal. */
export const chartArea = `${chartLine} L${X1} ${Y0} L${X0} ${Y0} Z`;

export const CHART = { X0, X1, Y0, Y1 };
