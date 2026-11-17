import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDown } from "lucide-react";
import { asset } from "./data";
import { tr } from "./i18n";
import CaseWords from "./CaseWords";
import { useAtelierBite } from "./useAtelierBite";
import { BITES, SLICE, STRANDS } from "./atelierBiteGeometry";
import "./atelier-bite.scss";

/**
 * Scène signature d’Atelier Pizza : une part sort de la pizza, se fait croquer
 * au fil du défilement, puis une étiquette de prix mise à jour prend sa place.
 * Toute l’image est décorative ; le titre et le texte restent du vrai contenu.
 */
export default function AtelierBiteScene() {
  const root = useRef<HTMLElement>(null);
  const { i18n } = useTranslation();
  useAtelierBite(root, i18n.resolvedLanguage);
  const price = new Intl.NumberFormat(
    i18n.resolvedLanguage === "en" ? "en-GB" : "fr-FR",
    {
      style: "currency",
      currency: "EUR",
    },
  );
  return (
    <section
      className="atelier-bite"
      ref={root}
      data-scene="static"
      data-bite="5"
      aria-labelledby="atelier-menu-title"
    >
      <div className="atelier-bite-track">
        <div className="atelier-bite-stage">
          <div className="atelier-bite-visual" aria-hidden="true">
            <svg className="atelier-bite-art" viewBox="0 0 1000 1000" overflow="visible">
              <defs>
                <mask
                  id="atelier-rest"
                  maskUnits="userSpaceOnUse"
                  x="-50"
                  y="-50"
                  width="1100"
                  height="1100"
                >
                  <rect x="-50" y="-50" width="1100" height="1100" fill="#fff" />
                  <path d={SLICE} fill="#000" />
                </mask>
                <clipPath id="atelier-slice-clip">
                  <path d={SLICE} />
                </clipPath>
                <mask
                  id="atelier-bites"
                  maskUnits="userSpaceOnUse"
                  x="-50"
                  y="-50"
                  width="1100"
                  height="1100"
                >
                  <rect x="-50" y="-50" width="1100" height="1100" fill="#fff" />
                  {BITES.map((bite, i) => (
                    <g className="atelier-bite-mark" key={i} fill="#000">
                      {/* Un grand cercle et deux petits : la trace irrégulière d’une dent. */}
                      <circle cx={bite.x} cy={bite.y} r={bite.r} />
                      <circle
                        cx={bite.x + bite.r * 0.78}
                        cy={bite.y - bite.r * 0.22}
                        r={bite.r * 0.32}
                      />
                      <circle
                        cx={bite.x - bite.r * 0.7}
                        cy={bite.y + bite.r * 0.4}
                        r={bite.r * 0.3}
                      />
                    </g>
                  ))}
                </mask>
                <filter
                  id="atelier-soft-shadow"
                  x="-30%"
                  y="-30%"
                  width="160%"
                  height="160%"
                >
                  <feGaussianBlur stdDeviation="18" />
                </filter>
              </defs>
              <g className="atelier-bite-pizza">
                <ellipse
                  className="atelier-bite-board"
                  cx="500"
                  cy="530"
                  rx="520"
                  ry="505"
                />
                <image
                  href={asset("atelier-pizza-whole.webp")}
                  width="1000"
                  height="1000"
                  mask="url(#atelier-rest)"
                />
                {STRANDS.map((offset) => (
                  <path
                    className="atelier-bite-strand"
                    key={offset}
                    data-offset={offset}
                    d="M500 500 L500 500"
                  />
                ))}
                <path
                  className="atelier-bite-shadow"
                  d={SLICE}
                  filter="url(#atelier-soft-shadow)"
                />
                <g className="atelier-bite-slice">
                  <g mask="url(#atelier-bites)">
                    <image
                      href={asset("atelier-pizza-whole.webp")}
                      width="1000"
                      height="1000"
                      clipPath="url(#atelier-slice-clip)"
                    />
                  </g>
                  {BITES.map((bite, i) => (
                    <g className="atelier-bite-crumbs" data-burst={i} key={i}>
                      {[0, 1, 2, 3].map((n) => (
                        <circle
                          key={n}
                          cx={bite.x + (n - 1.5) * bite.r * 0.35}
                          cy={bite.y + bite.r * 0.2}
                          r={5 + (n % 2) * 3}
                        />
                      ))}
                    </g>
                  ))}
                </g>
              </g>
            </svg>
            <div className="atelier-price-anchor">
              <div className="atelier-price-tag">
                <span className="atelier-price-name">Margherita</span>
                <span className="atelier-price-values">
                  <s className="atelier-price-old">{price.format(9.5)}</s>
                  <strong className="atelier-price-new">{price.format(10.5)}</strong>
                </span>
                <small>{tr("Updated")}</small>
              </div>
            </div>
          </div>
          <div className="atelier-bite-copy">
            <p className="eyebrow">{tr("01 / A MENU THAT MOVES WITH YOU")}</p>
            <p className="atelier-bite-tease" aria-hidden="true">
              {tr("A Margherita, eight slices.")} <em>{tr("Help yourself.")}</em>
            </p>
            <h2
              id="atelier-menu-title"
              aria-label={`${tr("Your menu.")} ${tr("In your hands.")}`}
            >
              <CaseWords text={tr("Your menu.")} />
              <br />
              <em>
                <CaseWords text={tr("In your hands.")} />
              </em>
            </h2>
            <p className="atelier-bite-text">
              {tr(
                "Change a price, hide an unavailable pizza or announce a closure. Save in WordPress, then refresh the website. The layout stays consistent.",
              )}
            </p>
            <a className="understated-link atelier-bite-link" href="#atelier-editing">
              {tr("See how it works")} <ArrowDown size={16} />
            </a>
          </div>
          <span className="atelier-bite-hint" aria-hidden="true">
            {tr("SCROLL FOR A TASTE")}
            <span className="atelier-bite-progress">
              <span />
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}
