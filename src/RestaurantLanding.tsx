import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BookOpen, Check, Clock, MapPin, Plus } from "lucide-react";
import { asset } from "./data";
import { tr } from "./i18n";
import { currentLang, pathFor } from "./routes";
import "./case-study.scss";
import "./landing.scss";
import "./restaurant-landing.scss";
gsap.registerPlugin(ScrollTrigger);

const INCLUDED = [
  [
    "A menu or catalogue you can update",
    "Update your dishes or products, prices and availability from simple fields.",
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
    "Keep key information easy to find when customers are on their way.",
  ],
  [
    "Show your space and what you offer",
    "Fast-loading photos of your space, dishes or products.",
  ],
  [
    "Booking and ordering links",
    "Connect the booking, ordering or pickup tools you already use.",
  ],
];
const QUESTIONS = [
  [
    "Can I update my menu or catalogue myself?",
    "Yes. Update your menu or catalogue, prices and opening hours from simple fields. I show you how it works at handover.",
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
const VISITOR_DETAILS = [
  { icon: Clock, label: "Opening hours" },
  { icon: MapPin, label: "Directions" },
  { icon: BookOpen, label: "Menu or catalogue" },
];

/** L’illustration réagit à un mouvement court, sans épingler le hero. Les
 * informations équivalentes restent disponibles dans le texte de la page. */
export default function RestaurantLanding({ onStart }: { onStart: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const visual = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    heading.current?.focus({ preventScroll: true });
    const windowFrame = visual.current;
    if (!windowFrame) return;
    const media = gsap.matchMedia();
    media.add(
      "(prefers-reduced-motion: no-preference)",
      () => {
        const timeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: windowFrame,
            start: () =>
              Math.max(
                0,
                windowFrame.getBoundingClientRect().top + scrollY - innerHeight * 0.84,
              ),
            end: "+=220",
            scrub: 0.3,
            invalidateOnRefresh: true,
          },
        });
        // Les deux panneaux coulissent vers les bords et dégagent les informations.
        timeline
          .fromTo(
            ".restaurant-pane-left",
            { xPercent: 0, visibility: "visible" },
            { xPercent: -101 },
            0,
          )
          .fromTo(
            ".restaurant-pane-right",
            { xPercent: 0, visibility: "visible" },
            { xPercent: 101 },
            0,
          )
          .from(
            windowFrame.querySelectorAll(".restaurant-visitor-detail"),
            { opacity: 0, y: 12, duration: 0.2, stagger: 0.08 },
            0.2,
          );
      },
      windowFrame,
    );
    return () => media.revert();
  }, []);
  const lang = currentLang();
  const atelier = pathFor({ kind: "case", id: "atelier-pizza" }, lang);
  return (
    <article className="landing restaurant-landing" aria-labelledby="restaurants-title">
      <section className="restaurant-hero" aria-labelledby="restaurants-title">
        <div className="shell restaurant-hero-grid">
          <div className="restaurant-hero-copy">
            <p className="eyebrow">{tr("WEBSITES FOR CAFÉS, RESTAURANTS AND SHOPS")}</p>
            <h1 id="restaurants-title" ref={heading} tabIndex={-1}>
              {tr("Give people a reason")} <em>{tr("to walk in.")}</em>
            </h1>
            <p className="lp-lead">
              {tr(
                "Make it easy to find your menu or catalogue, check opening hours, get directions or book. I build the site so you can update it yourself.",
              )}
            </p>
            <div className="lp-actions">
              <button className="button primary" onClick={onStart}>
                {tr("Talk about my website")}
              </button>
              <a className="understated-link" href="#restaurants-example">
                {tr("See how editing works")}
              </a>
            </div>
          </div>
          <div className="restaurant-window" ref={visual} aria-hidden="true">
            <div className="restaurant-photo">
              <picture>
                <source
                  media="(max-width: 640px)"
                  srcSet={asset("local-storefront-640.webp")}
                />
                <img
                  src={asset("local-storefront.webp")}
                  alt=""
                  width="1200"
                  height="800"
                  fetchPriority="high"
                />
              </picture>
              <div className="restaurant-pane restaurant-pane-left" />
              <div className="restaurant-pane restaurant-pane-right" />
            </div>
            <ul className="restaurant-visitor-details">
              {VISITOR_DETAILS.map(({ icon: Icon, label }) => (
                <li className="restaurant-visitor-detail" key={label}>
                  <Icon size={17} /> {tr(label)}
                </li>
              ))}
            </ul>
          </div>
        </div>
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

      <section
        className="restaurant-example shell"
        id="restaurants-example"
        aria-labelledby="restaurant-example-title"
      >
        <div>
          <p className="eyebrow">{tr("PERSONAL PROJECT")}</p>
          <h2 id="restaurant-example-title">{tr("See what you can update yourself")}</h2>
          <p>
            {tr(
              "In the Atelier Pizza demo, a restaurant owner can change a price, hide an unavailable dish or announce a closure in WordPress.",
            )}
          </p>
        </div>
        <a className="understated-link" href={atelier}>
          {tr("Explore Atelier Pizza")}
        </a>
      </section>

      <section className="lp-price shell">
        <div>
          <p className="eyebrow">{tr("BUDGET")}</p>
          <h2>{tr("€1,200–€2,400")}</h2>
          <p>
            {tr(
              "Example at around €1,200: a mobile-friendly site with opening hours, contact details and a menu or catalogue you can edit in WordPress. At handover, I show you how to make updates.",
            )}
          </p>
          <p>
            {tr(
              "Indicative budget for a restaurant or shop website. Your scope, timeline and final price are set out in a written quote, which you approve before work begins.",
            )}
          </p>
        </div>
        <button className="button primary" onClick={onStart}>
          {tr("Get a quote")}
        </button>
      </section>

      <section className="lp-faq shell" aria-labelledby="restaurants-faq-title">
        <h2 id="restaurants-faq-title">{tr("Questions about your website")}</h2>
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
          <h2>{tr("Let’s talk about your business")}</h2>
          <button className="button primary" onClick={onStart}>
            {tr("Talk about my website")}
          </button>
        </div>
      </section>
    </article>
  );
}
