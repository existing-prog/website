import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { asset } from "./data";
import { tr } from "./i18n";
import { useRestaurantBurst } from "./useRestaurantBurst";

/** Feuilles de basilic du décor : position (en % de la scène), taille, angle, profondeur.
 * Les plus « proches » (depth élevé) sont plus grandes, plus floues et bougent plus. */
const LEAVES = [
  { x: 9, y: 22, size: 92, rotate: -28, depth: 1 },
  { x: 86, y: 14, size: 70, rotate: 35, depth: 0.6 },
  { x: 92, y: 62, size: 110, rotate: 120, depth: 1 },
  { x: 14, y: 76, size: 64, rotate: 200, depth: 0.5 },
  { x: 72, y: 88, size: 54, rotate: -150, depth: 0.4 },
  { x: 30, y: 8, size: 46, rotate: 80, depth: 0.3 },
  { x: 64, y: 30, size: 38, rotate: -60, depth: 0.25 },
  { x: 34, y: 64, size: 42, rotate: 150, depth: 0.3 },
];
/** Particules de farine, réparties autour du centre. */
const FLOUR = Array.from({ length: 18 }, (_, i) => {
  const angle = (i / 18) * Math.PI * 2 + (i % 3) * 0.4;
  const radius = 26 + ((i * 37) % 17);
  return {
    x: 50 + Math.cos(angle) * radius,
    y: 50 + Math.sin(angle) * radius * 0.9,
    size: 3 + (i % 4) * 2,
  };
});

function Leaf({ size, id }: { size: number; id: number }) {
  return (
    <svg viewBox="-50 -60 100 120" width={size} height={size * 1.2}>
      <defs>
        <linearGradient id={`leaf-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7fbf4d" />
          <stop offset="0.55" stopColor="#3f8f2f" />
          <stop offset="1" stopColor="#1f5a1c" />
        </linearGradient>
      </defs>
      <path
        d="M0 -56 C34 -42 40 12 0 56 C-40 12 -34 -42 0 -56 Z"
        fill={`url(#leaf-${id})`}
      />
      <path
        d="M0 -50 C3 -10 2 20 0 52"
        stroke="#c9e6a8"
        strokeOpacity="0.55"
        strokeWidth="2.4"
        fill="none"
      />
    </svg>
  );
}

/**
 * Ouverture de la page restaurants : une pizza au repos sur un grand fond rouge,
 * un décor de basilic et de farine, un titre en contour. Au scroll, le décor
 * s’écarte et la pizza éclate (vidéo découpée en images, dessinée dans un canvas).
 * La section suivante glisse ensuite par-dessus la scène restée en place.
 */
export default function RestaurantBurstScene() {
  const root = useRef<HTMLElement>(null);
  const { i18n } = useTranslation();
  useRestaurantBurst(root, i18n.resolvedLanguage);
  return (
    <section
      className="rb-scene"
      ref={root}
      data-scene="static"
      aria-labelledby="restaurants-title"
    >
      <div className="rb-track">
        <div className="rb-stage">
          <img
            className="rb-poster"
            src={asset("pizza-burst/final.webp")}
            width="720"
            height="1280"
            alt={tr(
              "A Margherita pizza bursting open on a red background, with basil and flour",
            )}
          />
          <canvas className="rb-canvas" aria-hidden="true" />
          <div className="rb-decor" aria-hidden="true">
            {FLOUR.map((speck, i) => (
              <i
                className="rb-flour"
                key={i}
                style={{
                  left: `${speck.x}%`,
                  top: `${speck.y}%`,
                  width: speck.size,
                  height: speck.size,
                }}
              />
            ))}
            {LEAVES.map((leaf, i) => (
              <span
                className="rb-leaf"
                key={i}
                data-depth={leaf.depth}
                style={{
                  left: `${leaf.x}%`,
                  top: `${leaf.y}%`,
                  rotate: `${leaf.rotate}deg`,
                  filter: leaf.depth >= 1 ? "blur(1.5px)" : undefined,
                }}
              >
                <Leaf size={leaf.size} id={i} />
              </span>
            ))}
          </div>
          <div className="rb-title">
            <p className="eyebrow">{tr("WEBSITES FOR RESTAURANTS AND SHOPS")}</p>
            <h1
              id="restaurants-title"
              tabIndex={-1}
              aria-label={`${tr("RESTAURANTS")} — ${tr("Websites that make people hungry.")}`}
            >
              <span className="rb-outline" aria-hidden="true">
                {tr("RESTAURANTS")}
              </span>
              <span className="rb-solid" aria-hidden="true">
                {tr("Websites that make people hungry.")}
              </span>
            </h1>
          </div>
          <span className="rb-hint" aria-hidden="true">
            {tr("SCROLL FOR A TASTE")}
            <span className="rb-progress">
              <span />
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}
