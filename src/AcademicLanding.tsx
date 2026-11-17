import { useLayoutEffect, useRef } from "react";
import { ArrowDown, ArrowUpRight, Check, Plus } from "lucide-react";
import { asset } from "./data";
import { tr } from "./i18n";
import { currentLang, pathFor } from "./routes";
import CaseWords from "./CaseWords";
import AcademicPaperScene from "./AcademicPaperScene";
import "./case-study.scss";
import "./landing.scss";
import "./academic-scene.scss";

const INCLUDED = [
  [
    "Research, explained",
    "Your questions, methods and results, written for people outside your subfield too.",
  ],
  [
    "Publications that stay current",
    "A clear list with links to the paper, the preprint and the data.",
  ],
  ["Talks, teaching and CV", "Slides, courses and a downloadable CV, all in one place."],
  [
    "Interactive figures",
    "When it helps, a figure becomes something visitors can explore.",
  ],
  [
    "Found under your name",
    "Search-friendly pages, so committees find you rather than an old profile.",
  ],
  ["Yours to keep", "A domain and accounts in your name, with a clear handover."],
];
const QUESTIONS = [
  [
    "I’m not technical. Can I update it myself?",
    "Yes, if you want to. We agree on what you need to edit, such as publications, news or your CV, and I choose a setup that lets you change it without touching the layout.",
  ],
  [
    "Can you start from my CV or my Google Scholar profile?",
    "Yes. Send what you already have: CV, publication list, photos, slides. I turn it into a structure, and we refine the wording together.",
  ],
  [
    "Do I need my own domain name?",
    "It’s recommended but not required. A domain in your name looks professional and follows you between institutions. I can help you choose and set one up.",
  ],
  [
    "Can we work remotely, in English or French?",
    "Yes. I work remotely in English and French, with feedback stages agreed at the start.",
  ],
];

/**
 * Page spécialisée « portfolios académiques » : une promesse, la scène signature,
 * un exemple réel, ce qui est inclus, un repère de prix et une FAQ courte.
 */
export default function AcademicLanding({ onStart }: { onStart: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  const lang = currentLang();
  return (
    <article className="landing academic-landing" aria-labelledby="academic-title">
      <section className="lp-hero shell">
        <p className="eyebrow">{tr("PORTFOLIO WEBSITES FOR RESEARCHERS")}</p>
        <h1
          className="case-title"
          id="academic-title"
          ref={heading}
          tabIndex={-1}
          aria-label={`${tr("Your research deserves")} ${tr("more than a PDF.")}`}
        >
          <CaseWords text={tr("Your research deserves")} />{" "}
          <em>
            <CaseWords text={tr("more than a PDF.")} />
          </em>
        </h1>
        <p className="lp-lead">
          {tr(
            "A personal website that presents your research, publications and CV as clearly as a good talk. For PhD students, postdocs and researchers.",
          )}
        </p>
        <div className="lp-actions">
          <button className="button primary" onClick={onStart}>
            {tr("Start my portfolio")} <ArrowUpRight size={18} />
          </button>
          <a className="understated-link" href="#academic-example">
            {tr("See a real example")} <ArrowDown size={16} />
          </a>
        </div>
      </section>

      <AcademicPaperScene />

      <section className="lp-example shell" id="academic-example">
        <div className="lp-example-copy">
          <p className="eyebrow">{tr("A REAL PROJECT")}</p>
          <h2>{tr("Samantha Ramsey, PhD candidate in astrodynamics.")}</h2>
          <p>
            {tr(
              "A research portfolio with its own visual identity, publications, and interactive orbital demonstrations that make her work tangible.",
            )}
          </p>
          <a
            className="understated-link"
            href={pathFor({ kind: "case", id: "samantha" }, lang)}
          >
            {tr("Read the case study")} <ArrowUpRight size={16} />
          </a>
        </div>
        <a
          className="lp-example-visual"
          href={pathFor({ kind: "case", id: "samantha" }, lang)}
          aria-label={tr("Read the case study")}
        >
          <img
            src={asset("samantha-current.webp")}
            alt={tr("Samantha Ramsey website preview")}
            width="1200"
            height="630"
            loading="lazy"
          />
        </a>
      </section>

      <section className="lp-included shell">
        <p className="eyebrow">{tr("WHAT YOUR PORTFOLIO CAN INCLUDE")}</p>
        <h2>{tr("Everything people look for when they look you up.")}</h2>
        <ul className="lp-grid">
          {INCLUDED.map(([title, text]) => (
            <li key={title}>
              <Check size={18} aria-hidden="true" />
              <strong>{tr(title)}</strong>
              <span>{tr(text)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="lp-price shell">
        <div>
          <p className="eyebrow">{tr("BUDGET")}</p>
          <h2>{tr("€600–€1,200")}</h2>
          <p>
            {tr(
              "Indicative budget for a focused research portfolio. Your scope, timeline and final price are set out in a written quote, which you approve before work begins.",
            )}
          </p>
        </div>
        <button className="button primary" onClick={onStart}>
          {tr("Get a quote")} <ArrowUpRight size={18} />
        </button>
      </section>

      <section className="lp-faq shell" aria-labelledby="academic-faq-title">
        <h2 id="academic-faq-title">{tr("Questions researchers ask.")}</h2>
        <div>
          {QUESTIONS.map(([q, a]) => (
            <details key={q}>
              <summary>
                {tr(q)}
                <Plus size={18} aria-hidden="true" />
              </summary>
              <p>{tr(a)}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="lp-closing">
        <div className="shell">
          <h2>{tr("Let’s turn your research into a website.")}</h2>
          <button className="button primary" onClick={onStart}>
            {tr("Start my portfolio")} <ArrowUpRight size={18} />
          </button>
        </div>
      </section>
    </article>
  );
}
