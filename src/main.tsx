import { useTranslation } from "react-i18next";
import { tr, dateLocale } from "./i18n";
import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowDown,
  Plus,
  Minus,
  Check,
  X,
  Menu,
  Layers,
  Monitor,
  RefreshCw,
  MoveUpRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  FileText,
  Download,
  Copy,
  Mail,
  Trash2,
  ShieldCheck,
  MousePointer2,
} from "lucide-react";
import {
  asset,
  briefText,
  Draft,
  emptyDraft,
  loadDrafts,
  projects,
  projectHref,
  serviceName,
  services,
  ServiceId,
} from "./data";
import "./styles.scss";
import ProjectBuilder from "./ProjectBuilder";
import ProjectStories from "./ProjectStories";
import { useGlassMotion } from "./useGlassMotion";
import "./glass-theme.scss";
import LanguageSwitch from "./LanguageSwitch";
import HeroWorkTransition from "./HeroWorkTransition";
import { useScrollHeader } from "./useScrollHeader";
import "./interaction-polish.scss";
import HeroProjectBackdrop from "./HeroProjectBackdrop";

const SamanthaCaseStudy = lazy(() => import("./SamanthaCaseStudy"));
const KasaCaseStudy = lazy(() => import("./KasaCaseStudy"));

function Mark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`star-mark ${className}`}
      width="32"
      height="32"
      viewBox="0 0 40 40"
      aria-hidden="true"
    >
      <path
        d="M20 0v40M0 20h40M6 6l28 28M6 34 34 6"
        stroke="currentColor"
        strokeWidth="5"
      />
    </svg>
  );
}
/**
 * Point d’entrée : présentation des services et bureau de brouillons local.
 * Le hash change la vue ; les demandes restent des e-mails, pas des commandes serveur.
 */
function App() {
  const { i18n } = useTranslation();
  useGlassMotion();
  const [menu, setMenu] = useState(false);
  // Routes en hash : liens partageables et rechargements compatibles GitHub Pages.
  const [route, setRoute] = useState(location.hash);
  const workspace = route === "#workspace";
  const kasaCase = route === "#project/kasa";
  const caseStudy = route === "#project/samantha" || kasaCase;
  useScrollHeader(menu, workspace || caseStudy);
  const [drafts, setDrafts] = useState<Draft[]>(loadDrafts);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState(0);
  const previousFocus = useRef<HTMLElement | null>(null);
  // Conserver les ancres partageables et prendre en compte un hash chargé très tôt.
  useEffect(() => {
    const change = () => {
      setRoute(location.hash);
      setMenu(false);
      if (["#workspace", "#project/samantha", "#project/kasa"].includes(location.hash))
        window.scrollTo({ top: 0, behavior: "instant" });
    };
    change();
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    document.title = workspace
      ? tr("Project desk — Lucas Berdy")
      : kasaCase
        ? tr("Kasa — Case study · Lucas Berdy")
        : caseStudy
          ? tr("Samantha Ramsey — Case study · Lucas Berdy")
          : tr("Lucas Berdy — Your next chapter, online.");
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute("content", document.title);
    const description = kasaCase
      ? tr(
          "Kasa: a responsive React rental interface built by Lucas Berdy as a frontend training project.",
        )
      : caseStudy
        ? tr(
            "A scientific portfolio designed and developed by Lucas Berdy: visual identity, responsive interface and orbital demonstrations.",
          )
        : tr("meta.description");
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", description);
    document
      .querySelector('meta[property="og:description"]')
      ?.setAttribute("content", description);
  }, [workspace, caseStudy, kasaCase, i18n.resolvedLanguage]);
  useEffect(() => {
    if (workspace || caseStudy || !location.hash) return;
    const anchor = location.hash;
    let cancelled = false;
    // Les refresh initiaux de ScrollTrigger peuvent interrompre un scroll animé.
    // À l’ouverture d’une ancre, attendre les polices puis rejoindre directement
    // la cible ; les clics suivants conservent le défilement natif du navigateur.
    document.fonts.ready.then(() => {
      requestAnimationFrame(() => {
        if (!cancelled && location.hash === anchor)
          document
            .getElementById(anchor.slice(1))
            ?.scrollIntoView({ behavior: "instant" });
      });
    });
    return () => {
      cancelled = true;
    };
  }, [workspace, caseStudy]);
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, []);
  useEffect(() => {
    const update = () => setDrafts(loadDrafts());
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, []);
  // Révéler une seule fois les sections visibles, sans imposer de mouvement.
  // Le nettoyage évite de conserver des observateurs après un changement de vue.
  useEffect(() => {
    if (workspace || caseStudy) return;
    const nodes = document.querySelectorAll<HTMLElement>(".reveal");
    if (
      !("IntersectionObserver" in window) ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("seen");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.08 },
    );
    nodes.forEach((n) => {
      n.classList.add("pending");
      observer.observe(n);
    });
    return () => {
      observer.disconnect();
      nodes.forEach((n) => n.classList.remove("pending"));
    };
  }, [workspace, caseStudy]);
  const start = (service: ServiceId = "website") => {
    previousFocus.current = document.activeElement as HTMLElement;
    setEditing(emptyDraft(service));
    setMenu(false);
  };
  const resume = (draft: Draft) => {
    previousFocus.current = document.activeElement as HTMLElement;
    setEditing({ ...draft, extras: [...draft.extras] });
  };
  // Attendre la fermeture du dialogue natif pour rendre le focus au déclencheur.
  // preventScroll évite de revenir à une ancienne scène, notamment dans WebKit.
  const close = () => {
    setEditing(null);
    requestAnimationFrame(() => previousFocus.current?.focus({ preventScroll: true }));
  };
  /**
   * La mémoire React reste disponible si localStorage échoue (quota, mode privé…).
   * Le booléen renvoyé interdit d’afficher « enregistré » si l’écriture a échoué.
   */
  const persist = (next: Draft[]) => {
    setDrafts(next);
    try {
      localStorage.setItem("lb-project-drafts-v1", JSON.stringify(next));
      return true;
    } catch {
      setNotice(
        "Browser storage is unavailable. Changes are temporary and may be lost when this page closes. Download a copy of important briefs.",
      );
      return false;
    }
  };
  const save = (draft: Draft) => {
    const saved = {
      ...draft,
      id: draft.id || crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
    };
    const next = [saved, ...drafts.filter((d) => d.id !== saved.id)].slice(0, 50);
    const stored = persist(next);
    if (stored) setNotice("Draft saved on this device. It has not been sent to Lucas.");
    setEditing(saved);
    return { draft: saved, persisted: stored };
  };
  const remove = (id: string) => {
    const stored = persist(drafts.filter((d) => d.id !== id));
    if (stored) setNotice("Draft removed from this device.");
  };
  const showDesk = () => {
    close();
    location.hash = "workspace";
    setRoute("#workspace");
    window.scrollTo({ top: 0 });
  };
  return (
    <>
      <a className="skip-link" href="#main">
        {tr("Skip to content")}
      </a>
      <header className="site-header">
        <div className="shell header-inner">
          <a className="brand" href="#top" aria-label={tr("Lucas Berdy home")}>
            <span className="brand-symbol">
              lb<span>.</span>
            </span>
            <span className="brand-label">
              LUCAS BERDY<span>{tr("Independent frontend developer")}</span>
            </span>
          </a>
          <nav
            className={menu ? "main-nav open" : "main-nav"}
            id="main-nav"
            aria-label={tr("Main navigation")}
          >
            <a href="#services">{tr("Services")}</a>
            <a href="#work">{tr("Selected work")}</a>
            <a href="#approach">{tr("The approach")}</a>
            <a className={workspace ? "desk-link active" : "desk-link"} href="#workspace">
              <FolderOpen size={15} /> {tr("Project desk")}{" "}
              {drafts.length > 0 && <span className="count">{drafts.length}</span>}
            </a>
          </nav>
          <LanguageSwitch />
          <button className="header-cta" onClick={() => start()}>
            {tr("Start a project")} <ArrowUpRight size={17} />
          </button>
          <button
            className="menu-button"
            aria-label={menu ? tr("Close navigation") : tr("Open navigation")}
            aria-expanded={menu}
            aria-controls="main-nav"
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>
      <main id="main">
        {workspace ? (
          <section className="desk-page shell">
            <div className="desk-top">
              <div>
                <span className="eyebrow">
                  <FolderOpen size={14} /> {tr("YOUR PROJECT DESK")}
                </span>
                <h1>
                  {tr("A little space.")}
                  <br />
                  {tr("For your next big idea.")}
                </h1>
                <p>
                  {tr(
                    "Plan it, save it, come back to it. Your next website starts here.",
                  )}
                </p>
              </div>
              <button className="button primary" onClick={() => start()}>
                {tr("New project")} <Plus size={18} />
              </button>
            </div>
            <div className="desk-note">
              <ShieldCheck size={22} />
              <div>
                <strong>{tr("Your drafts. On this device.")}</strong>
                <p>
                  {tr(
                    "This desk saves drafts in this browser. Nothing is sent automatically. Secure client accounts, payments and order tracking are not connected yet.",
                  )}
                </p>
              </div>
            </div>
            {notice && (
              <p className="notice" role="status">
                {tr(notice)}
              </p>
            )}
            <div className="desk-heading">
              <h2>
                {tr("Project drafts")} <span>{drafts.length}</span>
              </h2>
              <span>{tr("Not submitted")}</span>
            </div>
            {drafts.length === 0 ? (
              <div className="empty-desk">
                <div className="folder-illustration">
                  <FolderOpen size={50} />
                  <Mark />
                </div>
                <h3>{tr("Good things start with a rough idea.")}</h3>
                <p>
                  {tr("Choose a service, tell me what you have in mind,")}
                  <br />
                  {tr("and build a brief at your own pace.")}
                </p>
                <button className="button primary" onClick={() => start()}>
                  {tr("Plan my first project")} <ArrowUpRight size={18} />
                </button>
              </div>
            ) : (
              <div className="draft-grid">
                {drafts.map((d) => (
                  <article className="draft-card glass-interactive" key={d.id}>
                    <div className="draft-card-top">
                      <FileText size={22} />
                      <span className="pill">{tr("Draft · not submitted")}</span>
                    </div>
                    <span className="eyebrow">{serviceName(d.service)}</span>
                    <h3>{d.company || d.name || tr("Untitled project")}</h3>
                    <p>{d.brief || tr("Your next website, taking shape.")}</p>
                    <small>
                      {tr("Saved")}{" "}
                      {new Intl.DateTimeFormat(dateLocale(), {
                        dateStyle: "medium",
                      }).format(new Date(d.updatedAt))}
                    </small>
                    <div className="draft-actions">
                      <button onClick={() => resume(d)}>
                        {tr("Continue project")} <ArrowUpRight size={16} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Delete ${d.company || d.name || tr("untitled")} draft`}
                        onClick={() => remove(d.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <a className="inline-link" href="#services">
              {tr("Back to the services")} <ArrowRight size={16} />
            </a>
          </section>
        ) : caseStudy ? (
          <Suspense
            fallback={
              <section className="shell section" role="status">
                {tr("Loading project…")}
              </section>
            }
          >
            {kasaCase ? (
              <KasaCaseStudy onStart={() => start("website")} />
            ) : (
              <SamanthaCaseStudy onStart={() => start("portfolio")} />
            )}
          </Suspense>
        ) : (
          <>
            <HeroWorkTransition />
            <section className="hero shell" id="top">
              <div className="studio-backdrop" aria-hidden="true">
                <div className="studio-glow glow-one" />
                <div className="studio-glow glow-two" />
              </div>
              <div className="hero-kicker">
                <span className="eyebrow">
                  <span className="status-dot" />{" "}
                  {tr("INDEPENDENT DEVELOPER. PERSONAL APPROACH.")}
                </span>
                <span className="hero-location">
                  {tr("BASED IN FRANCE / WORKING ONLINE")}
                </span>
              </div>
              <div className="hero-grid">
                <div className="hero-copy">
                  <h1 aria-label={tr("Your business. Impossible to ignore.")}>
                    <span className="hero-line">{tr("Your business.")}</span>
                    <span className="hero-line">{tr("Impossible")}</span>
                    <span className="hero-line">
                      {tr("to")}{" "}
                      <span className="hero-accent">
                        {tr("ignore")}
                        <svg
                          viewBox="0 0 340 22"
                          preserveAspectRatio="none"
                          aria-hidden="true"
                        >
                          <path d="M4 14Q160-7 333 9M15 21Q180 4 326 15" />
                        </svg>
                        .
                      </span>
                    </span>
                  </h1>
                  <p>
                    {tr(
                      "I design and build websites for independent businesses and professionals.",
                    )}
                  </p>
                  <div className="hero-actions">
                    <button className="button primary" onClick={() => start()}>
                      {tr("Start a project")} <ArrowUpRight size={19} />
                    </button>
                    <a className="understated-link" href="#work">
                      {tr("See the work")} <ArrowDown size={15} />
                    </a>
                  </div>
                  <div className="hero-footnote">
                    <span className="mini-monogram">lb.</span>
                    <span>
                      {tr("Work directly with Lucas.")}
                      <br />
                      <strong>{tr("From the first idea to the final detail.")}</strong>
                    </span>
                  </div>
                </div>
                <div className="hero-stage">
                  <HeroProjectBackdrop projectId={projects[preview].id} />
                  <div className="showcase-window glass-interactive">
                    <div className="window-toolbar">
                      <span className="window-dots">
                        <i />
                        <i />
                        <i />
                      </span>
                      <span>
                        {projects[preview].name.toLowerCase().replaceAll(" ", "-")}
                        .design
                      </span>
                      <ArrowUpRight size={12} />
                    </div>
                    <a
                      className={`showcase-image ${projects[preview].color}`}
                      href={projectHref(projects[preview])}
                      target={
                        projectHref(projects[preview]).startsWith("#")
                          ? undefined
                          : "_blank"
                      }
                      rel="noreferrer"
                      aria-label={tr("Explore {{name}}", {
                        name: projects[preview].name,
                      })}
                    >
                      <img
                        key={projects[preview].id}
                        src={asset(projects[preview].image)}
                        alt={tr("{{name}} website preview", {
                          name: projects[preview].name,
                        })}
                        width="1200"
                        height="630"
                      />
                      <span className="preview-live">
                        {tr("Explore the project")} <ArrowUpRight size={15} />
                      </span>
                    </a>
                    <div className="window-bottom">
                      <div>
                        <span className="eyebrow">{tr(projects[preview].kind)}</span>
                        <h2>{projects[preview].name}</h2>
                      </div>
                      <span className="window-index">
                        0{preview + 1}
                        <span>/ 03</span>
                      </span>
                    </div>
                  </div>
                  <div className="stage-note">
                    <MousePointer2 size={17} />
                    <span>{tr("Thoughtful on every screen.")}</span>
                  </div>
                  <div
                    className="preview-controls"
                    aria-label={tr("Choose a project preview")}
                  >
                    {projects.map((p, i) => (
                      <button
                        key={p.name}
                        className={preview === i ? "selected" : ""}
                        onClick={() => setPreview(i)}
                        aria-label={tr("Preview {{name}}", { name: p.name })}
                        aria-pressed={preview === i}
                      >
                        <span>0{i + 1}</span>
                        {i === preview && <span>{p.name}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
            <section className="work-section section" id="work">
              <div className="shell">
                <div className="section-heading reveal">
                  <div>
                    <span className="eyebrow">{tr("01 / SELECTED WORK")}</span>
                    <h2>
                      {tr("Different worlds.")}
                      <br />
                      <span>{tr("The same care.")}</span>
                    </h2>
                  </div>
                  <a
                    className="understated-link"
                    href="https://portfolio-swart-psi-26.vercel.app/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {tr("Explore my full portfolio")} <ArrowUpRight size={17} />
                  </a>
                </div>
                <ProjectStories onStart={start} />
              </div>
            </section>
            <section className="section shell services-section" id="services">
              <div className="section-heading reveal">
                <div>
                  <span className="eyebrow">{tr("02 / FIND YOUR STARTING POINT")}</span>
                  <h2>
                    {tr("You do your thing.")}
                    <br />
                    <span>{tr("I’ll build its home.")}</span>
                  </h2>
                </div>
                <p>
                  {tr("A first website. A better one. Or a little attention")}
                  <br className="desktop-break" /> {tr("for the one you already have.")}
                  <br />
                  {tr("There’s a good place to start.")}
                </p>
              </div>
              <div className="service-grid">
                {services.map((s, i) => (
                  <article
                    className={`service-card glass-interactive reveal ${i === 1 ? "highlight" : ""}`}
                    key={s.id}
                  >
                    <div className="service-card-top">
                      <span className="eyebrow">
                        {s.no} / {tr(s.short).toUpperCase()}
                      </span>
                      {i === 0 ? (
                        <Layers size={25} />
                      ) : i === 1 ? (
                        <Monitor size={25} />
                      ) : (
                        <RefreshCw size={25} />
                      )}
                    </div>
                    <div className="service-card-copy">
                      <h3>{tr(s.name)}</h3>
                      <span className="service-tagline">{tr(s.tagline)}</span>
                      <p>{tr(s.description)}</p>
                    </div>
                    <ul>
                      {s.features.map((f) => (
                        <li key={f}>
                          <Check size={14} />
                          {tr(f)}
                        </li>
                      ))}
                    </ul>
                    <div className="service-card-bottom">
                      <span>
                        <strong className="service-budget">{tr(s.budget)}</strong>
                        <small>{tr("Indicative · quote before approval")}</small>
                      </span>
                      <button
                        onClick={() => start(s.id)}
                        aria-label={tr("Start a {{service}} project", {
                          service: tr(s.short).toLowerCase(),
                        })}
                      >
                        <ArrowUpRight size={23} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              <div className="services-note">
                <span>
                  <ShieldCheck size={15} />{" "}
                  {tr("Scope, price and timeline agreed before we start.")}
                </span>
                <a href="#faq">
                  {tr("A few questions?")} <ArrowUpRight size={14} />
                </a>
              </div>
              <p className="pricing-disclaimer">
                {tr(
                  "Indicative EUR budgets for a focused starting scope. Larger projects, extra features, any applicable taxes, domain, hosting and third-party costs are confirmed separately in your written quote. Nothing is booked or charged without your approval.",
                )}
              </p>
            </section>
            <section className="section shell approach" id="approach">
              <div className="approach-intro reveal">
                <span className="eyebrow">
                  {tr("03 / LESS BACK-AND-FORTH. MORE FORWARD.")}
                </span>
                <h2>
                  {tr("A good website starts")}
                  <br />
                  {tr("with a good")} <span>{tr("conversation.")}</span>
                </h2>
                <p>
                  {tr(
                    "You shouldn’t need to speak developer to get the website you want.",
                  )}
                  <br className="desktop-break" />{" "}
                  {tr("We’ll keep the process clear, collaborative and focused on you.")}
                </p>
              </div>
              <div className="steps">
                {[
                  {
                    n: "01",
                    title: "Make it yours.",
                    text: "Choose a service and put your ideas into a brief. Save it to your project desk if you need a little more thinking time.",
                  },
                  {
                    n: "02",
                    title: "Get a clear plan.",
                    text: "Send your brief. We’ll discuss the details, then agree on the scope, quote and timeline before any work starts.",
                  },
                  {
                    n: "03",
                    title: "Watch it take shape.",
                    text: "I build, you stay involved. We refine the details together, check across screens and get your website ready to launch.",
                  },
                ].map((s) => (
                  <article className="step reveal" key={s.n}>
                    <div className="step-top">
                      <span>{s.n}</span>
                      <ArrowUpRight size={23} />
                    </div>
                    <h3>{tr(s.title)}</h3>
                    <p>{tr(s.text)}</p>
                  </article>
                ))}
              </div>
              <div className="process-banner glass-interactive">
                <div>
                  <FolderOpen size={25} />
                  <span>
                    {tr("Ideas need a little room.")}
                    <small>
                      {tr("Start a brief now. Pick it up later in your project desk.")}
                    </small>
                  </span>
                </div>
                <a href="#workspace">
                  {tr("Take a look")} <ArrowUpRight size={18} />
                </a>
              </div>
            </section>
            <section className="about-section">
              <div className="shell about-grid">
                <div className="identity-card glass-interactive reveal">
                  <div className="identity-top">
                    <span className="eyebrow">{tr("THE PERSON BEHIND THE PIXELS")}</span>
                    <span>FR / 01</span>
                  </div>
                  <div className="identity-monogram">
                    lb
                    <Mark />
                  </div>
                  <div className="identity-bottom">
                    <span>
                      LUCAS BERDY
                      <small>{tr("Independent frontend developer")}</small>
                    </span>
                    <span className="status-dot" />
                  </div>
                </div>
                <div className="about-copy reveal">
                  <span className="eyebrow">
                    {tr("A PERSON. NOT A PRODUCTION LINE.")}
                  </span>
                  <h2>
                    {tr("Small studio energy.")}
                    <br />
                    <span>{tr("Personal attention.")}</span>
                  </h2>
                  <p>
                    {tr(
                      "I’m Lucas, a frontend developer based in France. I love clean interfaces, expressive details and the moment a website starts to feel like the person behind it.",
                    )}
                  </p>
                  <p>
                    {tr(
                      "When we work together, you’re talking to the person building your website. I take the time to understand what matters to you, explain the choices and sweat the small stuff.",
                    )}
                  </p>
                  <div className="about-principles">
                    <span>
                      <Check size={15} /> {tr("Direct communication")}
                    </span>
                    <span>
                      <Check size={15} /> {tr("Thoughtful details")}
                    </span>
                    <span>
                      <Check size={15} /> {tr("Clean, considered code")}
                    </span>
                  </div>
                  <a
                    className="understated-link"
                    href="https://github.com/existing-prog"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {tr("Meet the code behind the work")} <ArrowUpRight size={17} />
                  </a>
                </div>
              </div>
            </section>
            <section className="section shell faq-section" id="faq">
              <div>
                <span className="eyebrow">{tr("BEFORE WE GET STARTED")}</span>
                <h2>
                  {tr("Good questions.")}
                  <br />
                  <span>{tr("Straight answers.")}</span>
                </h2>
              </div>
              <div className="faq-list">
                {[
                  {
                    q: "How much will my project cost?",
                    a: "As a guide, a focused portfolio is €600–€1,200, a small business website €1,200–€2,400, and frontend care €45/hour. Project guides use a €300/day development basis. Your actual scope, features, any applicable taxes and external costs are confirmed in a written quote, which you approve before work begins.",
                  },
                  {
                    q: "Can I order and pay directly here?",
                    a: "You can configure a project, save a draft and email a request from this site today. Online payment and confirmed bookings are not connected yet. Sending a request does not commit you to a purchase.",
                  },
                  {
                    q: "What happens in the project desk?",
                    a: "It keeps your project drafts in this browser, so you can revisit and edit them. It isn’t an online account: drafts do not sync across devices, and clearing your browser storage removes them. Download a copy if you’d like to keep a backup.",
                  },
                  {
                    q: "What if I already have a website?",
                    a: "That’s a good starting point. Choose Website care and share the URL, what’s working and what needs attention. I can help with content updates, frontend fixes, responsive layouts and performance improvements.",
                  },
                  {
                    q: "What will you need from me?",
                    a: "Your goals, a little about your audience and any text, images or brand material you already have. Reference websites and a preferred launch date help too. You don’t need a fully formed plan to start a conversation.",
                  },
                ].map((f) => (
                  <details key={f.q}>
                    <summary>
                      {tr(f.q)}
                      <Plus className="faq-plus" size={18} />
                      <Minus className="faq-minus" size={18} />
                    </summary>
                    <p>{tr(f.a)}</p>
                  </details>
                ))}
              </div>
            </section>
            <section className="closing-section">
              <div className="shell closing-inner">
                <span className="eyebrow">
                  <span className="status-dot" /> {tr("YOUR NEXT CHAPTER STARTS HERE")}
                </span>
                <div className="closing-heading">
                  <h2>
                    {tr("Let’s make your")}
                    <br />
                    {tr("next move a")} <em>{tr("good one.")}</em>
                  </h2>
                  <Mark />
                </div>
                <div className="closing-bottom">
                  <p>
                    {tr("Bring the idea. I’ll bring the care,")}
                    <br />
                    {tr("the code and a fresh perspective.")}
                  </p>
                  <button className="button dark" onClick={() => start()}>
                    {tr("Tell me what you’re building")} <ArrowUpRight size={20} />
                  </button>
                  <a href="mailto:lucasberdy@gmail.com">
                    {tr("Or just say hello")} <ArrowUpRight size={16} />
                  </a>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      <footer className="site-footer shell">
        <a href="#top" className="brand-symbol" aria-label={tr("Lucas Berdy home")}>
          lb<span>.</span>
        </a>
        <span>
          © {new Date().getFullYear()} LUCAS BERDY
          <br />
          <small>{tr("INDEPENDENT BY CHOICE. INTENTIONAL BY DESIGN.")}</small>
        </span>
        <div>
          <a href="https://github.com/existing-prog" target="_blank" rel="noreferrer">
            {tr("GitHub")} <ArrowUpRight size={13} />
          </a>
          <a
            href="https://portfolio-swart-psi-26.vercel.app/"
            target="_blank"
            rel="noreferrer"
          >
            {tr("Portfolio")} <ArrowUpRight size={13} />
          </a>
          <a href="mailto:lucasberdy@gmail.com">
            {tr("Email")} <ArrowUpRight size={13} />
          </a>
        </div>
      </footer>
      {editing && (
        <ProjectBuilder
          initial={editing}
          onClose={close}
          onSave={save}
          onDesk={showDesk}
          notice={notice}
        />
      )}
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
