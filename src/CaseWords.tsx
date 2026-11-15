import { Fragment } from "react";

/** Masques visuels partagés par les études. Le titre parent porte son nom
 * accessible complet, afin que le lecteur d’écran ne lise pas mot par mot.
 */
export default function CaseWords({ text }: { text: string }) {
  return (
    <>
      {text.split(/\s+/).map((word, index) => (
        <Fragment key={`${text}-${index}`}>
          {index > 0 && " "}
          <span className="case-word-mask" aria-hidden="true">
            <span className="case-word">{word}</span>
          </span>
        </Fragment>
      ))}
    </>
  );
}
