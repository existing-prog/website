import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, Check, Plus } from "lucide-react";
import { asset } from "./data";
import { tr } from "./i18n";
import { currentLang, pathFor } from "./routes";
import RestaurantBurstScene from "./RestaurantBurstScene";
import "./case-study.scss";
import "./landing.scss";
import "./restaurant-scene.scss";
gsap.registerPlugin(ScrollTrigger);

const INCLUDED = [
  [
    "A menu you edit yourself",
    "Dishes, prices and availability change in simple fields, without touching the layout.",
  ],
  [
    "Opening hours and closures",
    "Update your hours or announce an exceptional closure in a few seconds.",
  ],
  [
    "Found on Google and Maps",
    "Search-friendly pages, and help with your Google Business Profile.",
  ],
  [
    "Fast on a phone",
    "Most visitors check the menu on their phone, often on the way to you.",
  ],
  [
    "Photos that do your food justice",
    "Optimised images that load quickly and make people want to come.",
  ],
  [
    "Booking and ordering links",
    "Connect the reservation or delivery tools you already use.",
  ],
];
const QUESTIONS = [
  [
    "Can I really change the menu myself?",
    "Yes. The menu, prices and opening hours are edited in simple fields, and the layout stays consistent. I show you how it works at handover.",
  ],
  [
    "Can customers book or order online?",
    "The website can link to the booking or ordering service you already use. A custom ordering system is a separate, larger project.",
  ],
  [
    "Do you take care of Google?",
    "I build search-friendly pages and can help you set up or tidy your Google Business Profile. Nobody can honestly guarantee a ranking.",
  ],
  [
    "I already have a website. Can you improve it?",
    "Yes. I review it first, then propose targeted improvements or a redesign, depending on your goals and budget.",
  ],
];
const STATEMENT = [
  "Your menu changes.",
  "Your website keeps up, without waiting for anyone.",
];

/** Mots du grand texte : ils passent du gris à l’encre au fil du défilement. */
function useWordReveal(section: React.RefObject<HTMLElement | null>, language?: string) {
  useLayoutEffect(() => {
    const el = section.current;
    if (!el) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        el.querySelectorAll(".lp-statement-word"),
        { opacity: 0.16 },
        {
          opacity: 1,
          stagger: 0.1,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top 75%", end: "top 15%", scrub: true },
        },
      );
    });
    return () => media.revert();
  }, [section, language]);
}

/**
 * Page spécialisée « restaurants et commerces » : ouverture vidéo au scroll,
 * promesse, exemple Atelier Pizza, inclus, budget, FAQ et appels à l’action.
 */
export default function RestaurantLanding({ onStart }: { onStart: () => void }) {
  const reveal = useRef<HTMLElement>(null);
  const { i18n } = useTranslation();
  useWordReveal(reveal, i18n.resolvedLanguage);
  useLayoutEffect(() => {
    document.getElementById("restaurants-title")?.focus({ preventScroll: true });
  }, []);
  const lang = currentLang();
  const atelier = pathFor({ kind: "case", id: "atelier-pizza" }, lang);
  return (
    <article className="landing restaurant-landing" aria-labelledby="restaurants-title">
      <RestaurantBurstScene onStart={onStart} />

      <section className="lp-reveal" ref={reveal} aria-labelledby="restaurants-statement">
        <div className="shell">
          <h2
            id="restaurants-statement"
            aria-label={STATEMENT.map((line) => tr(line)).join(" ")}
          >
            {STATEMENT.map((line, l) => (
              <span className="lp-statement-line" key={line} aria-hidden="true">
                {tr(line)
                  .split(" ")
                  .map((word, i) => (
                    <span
                      className={l ? "lp-statement-word is-accent" : "lp-statement-word"}
                      key={i}
                    >
                      {word}{" "}
                    </span>
                  ))}
              </span>
            ))}
          </h2>
          <div className="lp-reveal-bottom">
            <p>
              {tr(
                "A website that makes people want to come, and that you keep up to date yourself: new dish, new price, exceptional closure.",
              )}
            </p>
            <div className="lp-actions">
              <button className="button dark" onClick={onStart}>
                {tr("Talk about my restaurant")} <ArrowUpRight size={18} />
              </button>
              <a className="understated-link" href="#restaurants-example">
                {tr("See a real example")}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-example shell" id="restaurants-example">
        <div className="lp-example-copy">
          <p className="eyebrow">{tr("PERSONAL PROJECT")}</p>
          <h2>{tr("Atelier Pizza, a menu the owner updates.")}</h2>
          <p>
            {tr(
              "A restaurant website with a custom WordPress editing interface: change a price, hide a pizza or announce a closure, and the website follows.",
            )}
          </p>
          <a className="understated-link" href={atelier}>
            {tr("Read the case study")} <ArrowUpRight size={16} />
          </a>
        </div>
        <a
          className="lp-example-visual"
          href={atelier}
          aria-label={tr("Read the case study")}
        >
          <img
            src={asset("atelier-guide-price-after-site.webp")}
            alt={tr("The Atelier Pizza menu after a price update")}
            loading="lazy"
          />
        </a>
      </section>

      <section className="lp-included shell">
        <p className="eyebrow">{tr("WHAT YOUR WEBSITE CAN INCLUDE")}</p>
        <h2>{tr("Everything your customers look for before they come.")}</h2>
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
          <h2>{tr("€1,200–€2,400")}</h2>
          <p>
            {tr(
              "Example at around €1,200: a mobile-friendly site with opening hours, contact details and a WordPress menu you can update yourself. At handover, I show you how to edit the menu.",
            )}
          </p>
          <p>
            {tr(
              "Indicative budget for a restaurant or shop website. Your scope, timeline and final price are set out in a written quote, which you approve before work begins.",
            )}
          </p>
        </div>
        <button className="button primary" onClick={onStart}>
          {tr("Get a quote")} <ArrowUpRight size={18} />
        </button>
      </section>

      <section className="lp-faq shell" aria-labelledby="restaurants-faq-title">
        <h2 id="restaurants-faq-title">{tr("Questions restaurant owners ask.")}</h2>
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
          <h2>{tr("Let’s give your customers an appetite.")}</h2>
          <button className="button primary" onClick={onStart}>
            {tr("Talk about my restaurant")} <ArrowUpRight size={18} />
          </button>
        </div>
      </section>
    </article>
  );
}
