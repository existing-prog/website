import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { tr } from "./i18n";
import { useAcademicScene } from "./useAcademicScene";
import { CHART, HEATWAVES, chartArea, chartLine, chartPoints } from "./academicChart";

/* Contenu de la maquette : un article fictif, volontairement en anglais (langue
 * de publication courante). Toute la maquette est décorative (aria-hidden) ; le
 * message de la scène est porté par les légendes, qui sont du vrai texte. */
const ABSTRACT =
  "We combine thirty years of sea surface temperature records with repeated reef surveys across the western Pacific. Reefs exposed to frequent but moderate heat stress recover faster than reefs hit by rare, extreme events, suggesting that thermal history shapes resilience.";
// Types de publication génériques : aucune revue réelle n’est attribuée à un travail fictif.
const PUBLICATIONS = [
  ["2026", "Thermal history and reef recovery", "Journal article"],
  ["2025", "Thirty years of reef surveys, openly shared", "Dataset"],
  ["2024", "When heatwaves repeat", "Preprint"],
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

/** Courbe de température : version article (traits fins, axes) ou site (vivante). */
function Chart({ live }: { live: boolean }) {
  return (
    <svg viewBox="0 0 100 60" className={live ? "ac-chart is-live" : "ac-chart"}>
      {live && (
        <defs>
          <linearGradient id="ac-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f1c27d" stopOpacity="0.45" />
            <stop offset="1" stopColor="#f1c27d" stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      <line className="ac-axis" x1={CHART.X0} y1={CHART.Y0} x2={CHART.X1} y2={CHART.Y0} />
      {!live && (
        <line
          className="ac-axis"
          x1={CHART.X0}
          y1={CHART.Y0}
          x2={CHART.X0}
          y2={CHART.Y1 - 2}
        />
      )}
      {live && <path className="ac-chart-area" d={chartArea} fill="url(#ac-area)" />}
      <path className="ac-chart-line" d={chartLine} pathLength={1} />
      {(live ? HEATWAVES : []).map((i) => (
        <circle
          className="ac-chart-dot"
          key={i}
          cx={chartPoints[i].x}
          cy={chartPoints[i].y}
          r="1.6"
        />
      ))}
      <text className="ac-chart-label" x={CHART.X0} y={CHART.Y0 + 6}>
        1995
      </text>
      <text className="ac-chart-label" x={CHART.X1} y={CHART.Y0 + 6} textAnchor="end">
        2025
      </text>
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
              {/* La marée monte depuis le bas de la feuille et recouvre l’article. */}
              <div className="ac-tide" />
              <div className="ac-chrome">
                <span className="ac-chrome-dots">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="ac-chrome-url">ines-morel.science</span>
              </div>
              <div className="ac-block ac-nav">
                <div className="ac-paper">
                  PREPRINT · MARINE SCIENCES INSTITUTE · 2026
                </div>
                <div className="ac-site">
                  <b>I. Morel</b>
                  <span>Research</span>
                  <span>Publications</span>
                  <span>Fieldwork</span>
                  <span>CV</span>
                </div>
              </div>
              <div className="ac-block ac-head">
                <div className="ac-paper">
                  <h3>Coral reef resilience under three decades of ocean warming</h3>
                  <p>
                    I. Morel<sup>1</sup>, K. Tanaka<sup>2</sup>, A. Diallo<sup>1</sup>
                  </p>
                  <small>
                    ¹ Marine Sciences Institute · ² Department of Oceanography
                  </small>
                </div>
                <div className="ac-site">
                  <small>MARINE ECOLOGY · POSTDOCTORAL RESEARCHER</small>
                  <h3>
                    Reading the ocean’s <em>long memory.</em>
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
                    I study how coral reefs respond to decades of warming, from field
                    surveys to long-term data.
                  </p>
                  <span className="ac-button">Download CV</span>
                </div>
              </div>
              <div className="ac-block ac-figure">
                <div className="ac-paper">
                  <Chart live={false} />
                  <small>Fig. 1. Sea surface temperature anomaly, 1995–2025.</small>
                </div>
                <div className="ac-site">
                  <Chart live />
                </div>
              </div>
              <div className="ac-block ac-refs">
                <div className="ac-paper">
                  <b>References</b>
                  {PUBLICATIONS.map(([year, title, journal]) => (
                    <span key={title}>
                      Morel I. et al. ({year}) {title}. <i>{journal}</i>.
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
