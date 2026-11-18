import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUpRight } from "lucide-react";
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

/** Feuille de basilic photographiée (détourée), retournée une fois sur deux. */
function Leaf({ size, flip }: { size: number; flip: boolean }) {
  return (
    <img
      src={asset("pizza-burst/basil.webp")}
      width={Math.round(size * 0.58 * 1.3)}
      height={Math.round(size * 1.3)}
      alt=""
      draggable={false}
      style={flip ? { scale: "-1 1" } : undefined}
    />
  );
}

/**
 * Ouverture de la page restaurants : une pizza au repos sur un grand fond rouge,
 * un décor de basilic et de farine, un titre en contour. Au scroll, le décor
 * s’écarte et la pizza éclate (vidéo découpée en images, dessinée dans un canvas).
 * La section suivante glisse ensuite par-dessus la scène restée en place.
 */
export default function RestaurantBurstScene({ onStart }: { onStart: () => void }) {
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
                  filter:
                    leaf.depth >= 1
                      ? "blur(1.5px)"
                      : leaf.depth < 0.35
                        ? "blur(1px) brightness(0.75)"
                        : undefined,
                }}
              >
                <Leaf size={leaf.size} flip={i % 2 === 1} />
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
      {/* Ancré au premier écran de la piste : le bouton défile naturellement
       * pendant que la pizza reste collée et que le titre s’efface. */}
      <div className="rb-actions">
        <button className="button primary" onClick={onStart}>
          {tr("Talk about my restaurant")} <ArrowUpRight size={18} />
        </button>
      </div>
    </section>
  );
}
