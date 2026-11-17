import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { tr } from "./i18n";
import { useAcademicScene } from "./useAcademicScene";
import { ORBITS, orbitPoint } from "./academicOrbits";

/* Contenu de la maquette : un article fictif, volontairement en anglais (langue
 * de publication courante). Toute la maquette est décorative (aria-hidden) ; le
 * message de la scène est porté par les légendes, qui sont du vrai texte. */
const ABSTRACT =
  "We investigate the long-term dynamical evolution of distant trans-Neptunian objects with numerical integrations over four billion years. A small population of detached orbits remains remarkably stable, shaped by resonances with Neptune and by the galactic tide.";
const PUBLICATIONS = [
  ["2026", "Detached orbits and the galactic tide", "Icarus"],
  ["2025", "Resonant sticking beyond Neptune", "AJ"],
  ["2024", "A census of stable distant objects", "MNRAS"],
];
const BEATS = [
  ["It starts as a paper.", "Dense, precise, and read by a handful of specialists."],
  [
    "Then it comes alive.",
    "Figures move and ideas breathe: your research becomes something people want to explore.",
  ],
  [
    "And becomes your portfolio.",
    "Research, publications, talks and CV, organised for the committees, collaborators and students who look you up.",
  ],
];

function Orbits({ live }: { live: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className={live ? "ac-orbits is-live" : "ac-orbits"}>
      {live && <circle className="ac-orbit-glow" cx="50" cy="50" r="30" />}
      {ORBITS.map((orbit, i) => {
        const point = orbitPoint(orbit, 0);
        return (
          <g key={i}>
            <ellipse
              cx="50"
              cy="50"
              rx={orbit.rx}
              ry={orbit.ry}
              transform={`rotate(${orbit.tilt} 50 50)`}
            />
            <circle
              className="ac-orbit-dot"
              data-orbit={i}
              cx={point.x}
              cy={point.y}
              r={live ? 1.8 : 1.3}
            />
          </g>
        );
      })}
      <circle className="ac-orbit-sun" cx="50" cy="50" r={live ? 4 : 2.4} />
      {!live && (
        <>
          <line x1="4" y1="96" x2="96" y2="96" />
          <line x1="4" y1="96" x2="4" y2="4" />
        </>
      )}
    </svg>
  );
}

/**
 * Scène signature de la page académique : un article devient un site.
 * Chaque bloc existe en deux versions superposées (papier / site) qui se croisent
 * pendant que le bloc glisse de sa place dans l’article à sa place dans le site.
 */
export default function AcademicPaperScene() {
  const root = useRef<HTMLElement>(null);
  const { i18n } = useTranslation();
  useAcademicScene(root, i18n.resolvedLanguage);
  return (
    <section
      className="ac-scene"
      ref={root}
      data-scene="static"
      aria-labelledby="ac-scene-title"
    >
      <div className="ac-track">
        <div className="ac-stage">
          <div className="ac-captions">
            <p className="eyebrow" id="ac-scene-title">
              {tr("FROM PAPER TO PORTFOLIO")}
            </p>
            <ol className="ac-beats">
              {BEATS.map(([title, text], i) => (
                <li className="ac-beat" key={title} data-beat={i}>
                  <span className="ac-beat-number">0{i + 1}</span>
                  <strong>{tr(title)}</strong>
                  <span>{tr(text)}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="ac-sheet-wrap" aria-hidden="true">
            <div className="ac-sheet">
              {/* La nuit se répand depuis le soleil de la figure et recouvre l’article. */}
              <div className="ac-night" />
              <div className="ac-chrome">
                <span className="ac-chrome-dots">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="ac-chrome-url">ada-lin.science</span>
              </div>
              <div className="ac-block ac-nav">
                <div className="ac-paper">PREPRINT · DEPARTMENT OF ASTRONOMY · 2026</div>
                <div className="ac-site">
                  <b>A. Lin</b>
                  <span>Research</span>
                  <span>Publications</span>
                  <span>Talks</span>
                  <span>CV</span>
                </div>
              </div>
              <div className="ac-block ac-head">
                <div className="ac-paper">
                  <h3>Long-term stability of distant trans-Neptunian orbits</h3>
                  <p>
                    A. Lin<sup>1</sup>, M. Okafor<sup>2</sup>, J. Duval<sup>1</sup>
                  </p>
                  <small>
                    ¹ Department of Astronomy · ² Institute for Planetary Science
                  </small>
                </div>
                <div className="ac-site">
                  <small>PLANETARY DYNAMICS · PHD CANDIDATE</small>
                  <h3>
                    Exploring the edge of the <em>Solar System.</em>
                  </h3>
                </div>
              </div>
              <div className="ac-block ac-abstract">
                <div className="ac-paper">
                  <b>Abstract.</b>{" "}
                  {ABSTRACT.split(" ").map((word, i) => (
                    <span className="ac-word" key={i}>
                      {word}{" "}
                    </span>
                  ))}
                </div>
                <div className="ac-site">
                  <p>
                    I study how distant objects beyond Neptune keep, or lose, their orbits
                    over billions of years.
                  </p>
                  <span className="ac-button">Download CV</span>
                </div>
              </div>
              <div className="ac-block ac-figure">
                <div className="ac-paper">
                  <Orbits live={false} />
                  <small>Fig. 1. Orbits of selected objects (simulation).</small>
                </div>
                <div className="ac-site">
                  <Orbits live />
                </div>
              </div>
              <div className="ac-block ac-refs">
                <div className="ac-paper">
                  <b>References</b>
                  {PUBLICATIONS.map(([year, title, journal]) => (
                    <span key={title}>
                      Lin A. et al. ({year}) {title}. <i>{journal}</i>.
                    </span>
                  ))}
                </div>
                <div className="ac-site">
                  <small>SELECTED PUBLICATIONS</small>
                  <div className="ac-cards">
                    {PUBLICATIONS.map(([year, title, journal]) => (
                      <span className="ac-card" key={title}>
                        <i>{year}</i>
                        <b>{title}</b>
                        <em>{journal}</em>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <span className="ac-hint" aria-hidden="true">
            {tr("SCROLL TO PUBLISH")}
            <span className="ac-progress">
              <span />
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}
