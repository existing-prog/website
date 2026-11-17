import AtelierProjectTeaser from "./AtelierProjectTeaser";
import ProjectQuestions from "./ProjectQuestions";
import { useTranslation } from "react-i18next";
import { tr, dateLocale, i18nReady, setLanguage } from "./i18n";
import { setHead } from "./head";
import {
  BASE,
  currentLang,
  legacyHashView,
  navigate,
  parsePath,
  pathFor,
  sameView,
  type View,
} from "./routes";
import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowDown,
  Plus,
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
  isInternalHref,
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
import "./readability.scss";
import HeroProjectBackdrop from "./HeroProjectBackdrop";

const SamanthaCaseStudy = lazy(() => import("./SamanthaCaseStudy"));
const KasaCaseStudy = lazy(() => import("./KasaCaseStudy"));
const NinaCaseStudy = lazy(() => import("./NinaCaseStudy"));
const AtelierPizzaCaseStudy = lazy(() => import("./AtelierPizzaCaseStudy"));
const AcademicLanding = lazy(() => import("./AcademicLanding"));

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
  const menuRef = useRef(menu);
  menuRef.current = menu;
  // Routes en hash : liens partageables et rechargements compatibles GitHub Pages.
  const [view, setView] = useState<View>(() => parsePath(location.pathname).view);
  const workspace = view.kind === "desk";
  const notFound = view.kind === "notfound";
  const caseId = view.kind === "case" ? view.id : null;
  const kasaCase = caseId === "kasa";
  const ninaCase = caseId === "nina";
  const atelierCase = caseId === "atelier-pizza";
  const caseStudy = caseId !== null;
  const landingId = view.kind === "landing" ? view.id : null;
  const lang = i18n.resolvedLanguage === "en" ? "en" : "fr";
  const home = pathFor({ kind: "home" }, lang);
  useScrollHeader(menu, workspace || caseStudy || notFound || landingId !== null);
  const [drafts, setDrafts] = useState<Draft[]>(loadDrafts);
  const draftsRef = useRef(drafts);
  useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState(0);
  const previousFocus = useRef<HTMLElement | null>(null);
  // Routes réelles : popstate (retour arrière) et navigate() mettent la vue à jour.
  // Les anciens liens en hash (#project/kasa, #workspace) sont redirigés.
  useEffect(() => {
    const change = () => {
      const parsed = parsePath(location.pathname);
      setView((previous) => (sameView(previous, parsed.view) ? previous : parsed.view));
      setMenu(false);
      void setLanguage(parsed.lang);
    };
    const closeMenu = () => setMenu(false);
    window.addEventListener("popstate", change);
    window.addEventListener("lb:navigate", change);
    window.addEventListener("hashchange", closeMenu);
    const legacy = legacyHashView(location.hash);
    if (legacy) navigate(pathFor(legacy, currentLang()), true);
    return () => {
      window.removeEventListener("popstate", change);
      window.removeEventListener("lb:navigate", change);
      window.removeEventListener("hashchange", closeMenu);
    };
  }, []);
  // Liens internes vers une autre page : navigation sans rechargement.
  // Les ancres de la page courante, les nouveaux onglets et le laboratoire restent natifs.
  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !url.pathname.startsWith(BASE)) return;
      if (url.pathname.startsWith(`${BASE}lab/`)) return;
      if (url.pathname === location.pathname) {
        // Depuis le menu mobile, sa fermeture interromprait le défilement natif :
        // fermer d’abord, puis rejoindre la section.
        const target = url.hash && document.getElementById(url.hash.slice(1));
        if (!menuRef.current || !target) return;
        e.preventDefault();
        history.pushState(history.state, "", url.hash);
        setMenu(false);
        requestAnimationFrame(() =>
          requestAnimationFrame(() => target.scrollIntoView({ behavior: "instant" })),
        );
        return;
      }
      if (parsePath(url.pathname).view.kind === "notfound") return;
      e.preventDefault();
      navigate(url.pathname + url.search + url.hash);
    };
    document.addEventListener("click", click);
    return () => document.removeEventListener("click", click);
  }, []);
  useEffect(() => {
    const title = notFound
      ? tr("Page not found — Lucas Berdy")
      : landingId === "academic"
        ? tr("Portfolio websites for researchers — Lucas Berdy")
        : workspace
          ? tr("Project desk — Lucas Berdy")
          : atelierCase
            ? tr("Atelier Pizza — Personal project · Lucas Berdy")
            : ninaCase
              ? tr("Nina Carducci — Case study · Lucas Berdy")
              : kasaCase
                ? tr("Kasa — Case study · Lucas Berdy")
                : caseStudy
                  ? tr("Samantha Ramsey — Case study · Lucas Berdy")
                  : tr("Lucas Berdy — Your next chapter, online.");
    const description =
      landingId === "academic"
        ? tr(
            "Portfolio websites for PhD students, postdocs and researchers: research, publications, talks and CV in one distinctive site, designed and developed by Lucas Berdy.",
          )
        : atelierCase
          ? tr(
              "Atelier Pizza: a personal restaurant website project with a custom WordPress menu editing interface by Lucas Berdy.",
            )
          : ninaCase
            ? tr(
                "Nina Carducci: frontend performance, SEO and accessibility improvements by Lucas Berdy, presented as a training project.",
              )
            : kasaCase
              ? tr(
                  "Kasa: a responsive React rental interface built by Lucas Berdy as a frontend training project.",
                )
              : caseStudy
                ? tr(
                    "A scientific portfolio designed and developed by Lucas Berdy: visual identity, responsive interface and orbital demonstrations.",
                  )
                : tr("meta.description");
    setHead({ title, description, view, lang });
  }, [
    view,
    lang,
    workspace,
    notFound,
    caseStudy,
    kasaCase,
    ninaCase,
    atelierCase,
    landingId,
  ]);
  // Première visite : le navigateur gère la position. Ensuite, une nouvelle page
  // commence en haut, sauf si le lien vise une section de l’accueil.
  const firstView = useRef(true);
  useEffect(() => {
    const first = firstView.current;
    firstView.current = false;
    if (view.kind !== "home" || !location.hash) {
      if (!first) window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
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
  }, [view]);
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
    draftsRef.current = next;
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
  // Un accusé positif de Formspree retire uniquement le brouillon envoyé.
  // La référence courante préserve les autres brouillons créés pendant la requête.
  const submitted = (draft: Draft) => {
    if (!draft.id) return true;
    const stored = persist(draftsRef.current.filter((item) => item.id !== draft.id));
    if (stored)
      setNotice("Request submitted. Its saved draft was removed from this device.");
    return stored;
  };
  const showDesk = () => {
    close();
    navigate(pathFor({ kind: "desk" }, lang));
  };
  return (
    <>
      <a className="skip-link" href="#main">
        {tr("Skip to content")}
      </a>
      <header className="site-header">
        <div className="shell header-inner">
          <a className="brand" href={`${home}#top`} aria-label={tr("Lucas Berdy home")}>
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
            <a href={`${home}#services`}>{tr("Services")}</a>
            <a href={`${home}#work`}>{tr("Selected work")}</a>
            <a href={`${home}#approach`}>{tr("The approach")}</a>
            <a href={`${home}#contact`}>{tr("Contact")}</a>
            {/* Le bureau n’apparaît que s’il contient des brouillons à reprendre. */}
            {(drafts.length > 0 || workspace) && (
              <a
                className={workspace ? "desk-link active" : "desk-link"}
                href={pathFor({ kind: "desk" }, lang)}
              >
                <FolderOpen size={15} /> {tr("Project desk")}{" "}
                {drafts.length > 0 && <span className="count">{drafts.length}</span>}
              </a>
            )}
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
        {notFound ? (
          <section className="desk-page shell not-found">
            <span className="eyebrow">404</span>
            <h1>{tr("This page doesn’t exist.")}</h1>
            <p>
              {tr("The link may be outdated. The rest of the website is still here.")}
            </p>
            <a className="button primary" href={home}>
              {tr("Back to the home page")} <ArrowRight size={18} />
            </a>
          </section>
        ) : workspace ? (
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
                        aria-label={tr("Delete the draft {{name}}", {
                          name: d.company || d.name || tr("Untitled project"),
                        })}
                        onClick={() => remove(d.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <a className="inline-link" href={`${home}#services`}>
              {tr("Back to the services")} <ArrowRight size={16} />
            </a>
          </section>
        ) : landingId ? (
          <Suspense
            fallback={
              <section className="shell section" role="status">
                {tr("Loading project…")}
              </section>
            }
          >
            <AcademicLanding onStart={() => start("portfolio")} />
          </Suspense>
        ) : caseStudy ? (
          <Suspense
            fallback={
              <section className="shell section" role="status">
                {tr("Loading project…")}
              </section>
            }
          >
            {atelierCase ? (
              <AtelierPizzaCaseStudy onStart={() => start("website")} />
            ) : ninaCase ? (
              <NinaCaseStudy onStart={() => start("care")} />
            ) : kasaCase ? (
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
                      <span>{new URL(projects[preview].url).hostname}</span>
                      <ArrowUpRight size={12} />
                    </div>
                    <a
                      className={`showcase-image ${projects[preview].color}`}
                      href={projectHref(projects[preview])}
                      target={
                        isInternalHref(projectHref(projects[preview]))
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
                        {String(preview + 1).padStart(2, "0")}
                        <span>/ {String(projects.length).padStart(2, "0")}</span>
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
                        <span>{String(i + 1).padStart(2, "0")}</span>
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
                <AtelierProjectTeaser />
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
                <a href="#questions">
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
                    title: "Start with a conversation.",
                    text: "Tell me what you do, who your website is for and what you want it to achieve. We’ll clarify the priorities and the content you already have.",
                  },
                  {
                    n: "02",
                    title: "Agree on a clear scope.",
                    text: "You receive a written quote covering the deliverables, review stages, price and timeline. Work begins after the scope and terms have been agreed.",
                  },
                  {
                    n: "03",
                    title: "Build, review, refine.",
                    text: "I develop the website and share progress at the agreed stages. Your feedback helps refine the details, with checks across screens before final validation.",
                  },
                  {
                    n: "04",
                    title: "Launch with a clear handover.",
                    text: "We validate the agreed work, prepare the launch and organise your access and handover. If you need ongoing updates, we can define a separate maintenance scope.",
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
              <div className="project-preparation reveal">
                <h3>{tr("What to bring to our first exchange")}</h3>
                <p>
                  {tr(
                    "Your goals, a few references, and any existing text, logo or photos. If something is missing, we’ll identify it together and clarify the responsibilities in your quote.",
                  )}
                </p>
                <a href="#questions">
                  {tr("Questions about content, hosting or revisions?")}
                </a>
              </div>
            </section>
            <ProjectQuestions onStart={() => start("website")} />
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
            <section className="closing-section" id="contact">
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
        <a
          href={`${home}#top`}
          className="brand-symbol"
          aria-label={tr("Lucas Berdy home")}
        >
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
          onSubmitted={submitted}
          onDesk={showDesk}
          notice={notice}
        />
      )}
    </>
  );
}

// Le HTML pré-rendu reste affiché pendant le chargement du catalogue de langue,
// puis React prend le relais en remplaçant ce contenu.
void i18nReady.then(() =>
  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  ),
);
