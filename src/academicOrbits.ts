/** Orbites de la figure : demi-axes (en % de la figure) et phase de départ du point. */
export const ORBITS = [
  { rx: 18, ry: 10, tilt: -12, phase: 0.1, speed: 1.6 },
  { rx: 28, ry: 15, tilt: 8, phase: 0.55, speed: 1.1 },
  { rx: 38, ry: 21, tilt: -4, phase: 0.8, speed: 0.75 },
  { rx: 46, ry: 27, tilt: 14, phase: 0.3, speed: 0.5 },
];
/** Point d’une orbite inclinée, dans le repère 0–100 de la figure. */
export function orbitPoint(orbit: (typeof ORBITS)[number], turn: number) {
  const angle = (orbit.phase + turn * orbit.speed) * Math.PI * 2;
  const x = orbit.rx * Math.cos(angle);
  const y = orbit.ry * Math.sin(angle);
  const t = (orbit.tilt * Math.PI) / 180;
  return {
    x: 50 + x * Math.cos(t) - y * Math.sin(t),
    y: 50 + x * Math.sin(t) + y * Math.cos(t),
  };
}
