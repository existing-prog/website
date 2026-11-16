import { useState } from "react";
import { ArrowRight, Check, RotateCcw } from "lucide-react";
import { asset } from "./data";
import { tr } from "./i18n";
import "./atelier-guided-demo.scss";

const actions = [
  {
    id: "price",
    label: "Change a price",
    before: "Margherita is listed at €9.50 for 29 cm.",
    after: "The saved price is now €10.50 on the menu.",
    editor: "The 29 cm price field changes from 9.50 to 10.50 in WordPress.",
    result: "The Margherita price updates on the website.",
  },
  {
    id: "visibility",
    label: "Hide a pizza",
    before: "La Reine is visible in the menu.",
    after: "La Reine is hidden and the other pizzas fill the space.",
    editor: "The visibility checkbox for La Reine is unchecked in WordPress.",
    result: "The saved menu no longer displays La Reine.",
  },
  {
    id: "closure",
    label: "Announce a closure",
    before: "No closure announcement is displayed.",
    after: "The saved closure announcement appears above the website.",
    editor: "A temporary closure message is added in WordPress.",
    result: "The closure announcement appears on the website.",
  },
];

/** Une comparaison guidée de vraies captures, sans formulaire ni écriture en ligne.
 * Les sélections ne modifient que les images affichées. Les états avant/après ont
 * été enregistrés depuis le prototype WordPress après de véritables sauvegardes.
 */
export default function AtelierGuidedDemo() {
  const [selected, setSelected] = useState(0);
  const [after, setAfter] = useState(false);
  const action = actions[selected];
  return (
    <div
      className="atelier-guided-demo"
      data-action={action.id}
      data-state={after ? "after" : "before"}
    >
      <div className="atelier-demo-label">
        <span />
        {tr("GUIDED DEMO / REAL WORDPRESS CAPTURES")}
      </div>
      <div
        className="atelier-action-options"
        role="group"
        aria-label={tr("Choose a menu update to explore")}
      >
        {actions.map((item, index) => (
          <button
            key={item.id}
            aria-pressed={selected === index}
            onClick={() => {
              setSelected(index);
              setAfter(false);
            }}
          >
            <span aria-hidden="true">0{index + 1}</span>
            {tr(item.label)}
          </button>
        ))}
      </div>
      <div className="atelier-comparison" key={action.id}>
        {(["admin", "site"] as const).map((side, index) => (
          <figure className="atelier-comparison-pane" key={side}>
            <div className="atelier-pane-heading">
              <span>0{index + 1}</span>
              <strong>{tr(side === "admin" ? "In WordPress" : "On the website")}</strong>
              {after && <Check size={17} aria-hidden="true" />}
            </div>
            <div className="atelier-capture-pair">
              {(["before", "after"] as const).map((phase) => (
                <a
                  key={phase}
                  className="atelier-capture-link"
                  data-active={(phase === "after") === after}
                  href={asset(`atelier-guide-${action.id}-${phase}-${side}.webp`)}
                  target="_blank"
                  rel="noreferrer"
                  tabIndex={(phase === "after") === after ? 0 : -1}
                  aria-hidden={(phase === "after") !== after}
                  aria-label={tr("Enlarge the {{side}} capture: {{phase}}", {
                    side: tr(side === "admin" ? "WordPress" : "website"),
                    phase: tr(phase === "after" ? "After" : "Before"),
                  })}
                >
                  <img
                    src={asset(`atelier-guide-${action.id}-${phase}-${side}.webp`)}
                    alt={tr(side === "admin" ? action.editor : action.result)}
                    width={side === "admin" ? 820 : 840}
                    height="380"
                    loading="lazy"
                  />
                  <span className="atelier-zoom-label">{tr("Enlarge capture")}</span>
                </a>
              ))}
            </div>
            <figcaption>
              {tr(
                side === "admin"
                  ? "Dedicated fields keep the layout protected."
                  : "Saved content appears in the public layout.",
              )}
            </figcaption>
          </figure>
        ))}
        <span className="atelier-comparison-arrow" aria-hidden="true">
          <ArrowRight size={21} />
        </span>
      </div>
      <div className="atelier-demo-controls">
        <div
          className="atelier-phase-options"
          role="group"
          aria-label={tr("Compare the recorded states")}
        >
          <button aria-pressed={!after} onClick={() => setAfter(false)}>
            {tr("Before")}
          </button>
          <button aria-pressed={after} onClick={() => setAfter(true)}>
            {tr("After")}
          </button>
        </div>
        <button className="button atelier-result-button" onClick={() => setAfter(!after)}>
          {after ? <RotateCcw size={17} /> : <ArrowRight size={17} />}
          {tr(after ? "Replay this example" : "See the saved result")}
        </button>
      </div>
      <p className="atelier-demo-result" role="status">
        <span className={after ? "is-saved" : ""}>
          {after ? (
            <Check size={17} aria-hidden="true" />
          ) : (
            <span aria-hidden="true">—</span>
          )}
        </span>
        {tr(after ? action.after : action.before)}
      </p>
      <p className="atelier-demo-disclosure">
        {tr(
          "This is a guided comparison of real captures from the local prototype. These controls do not edit a live restaurant website.",
        )}
      </p>
    </div>
  );
}
