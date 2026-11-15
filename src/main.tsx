import React, { useEffect, useRef, useState } from "react";
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
  serviceName,
  services,
  ServiceId,
} from "./data";
import "./styles.scss";
import ProjectBuilder from "./ProjectBuilder";

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
function App() {
  const [menu, setMenu] = useState(false);
  const [workspace, setWorkspace] = useState(location.hash === "#workspace");
  const [drafts, setDrafts] = useState<Draft[]>(loadDrafts);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState(0);
  const [filter, setFilter] = useState("All work");
  const previousFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const change = () => {
      setWorkspace(location.hash === "#workspace");
      setMenu(false);
      if (location.hash === "#workspace") window.scrollTo({ top: 0 });
    };
    change();
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    document.title = workspace
      ? "Project desk — Lucas Berdy"
      : "Lucas Berdy — Your next chapter, online.";
  }, [workspace]);
  useEffect(() => {
    if (!workspace && location.hash) {
      requestAnimationFrame(() =>
        document.getElementById(location.hash.slice(1))?.scrollIntoView(),
      );
    }
  }, [workspace]);
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
  useEffect(() => {
    if (workspace) return;
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
  }, [workspace]);
  const start = (service: ServiceId = "website") => {
    previousFocus.current = document.activeElement as HTMLElement;
    setEditing(emptyDraft(service));
    setMenu(false);
  };
  const resume = (draft: Draft) => {
    previousFocus.current = document.activeElement as HTMLElement;
    setEditing({ ...draft, extras: [...draft.extras] });
  };
  const close = () => {
    setEditing(null);
    requestAnimationFrame(() => previousFocus.current?.focus());
  };
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
    const next = [saved, ...drafts.filter((d) => d.id !== saved.id)].slice(
      0,
      50,
    );
    const stored = persist(next);
    if (stored)
      setNotice("Draft saved on this device. It has not been sent to Lucas.");
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
    setWorkspace(true);
    window.scrollTo({ top: 0 });
  };
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="shell header-inner">
          <a className="brand" href="#top" aria-label="Lucas Berdy home">
            <span className="brand-symbol">
              lb<span>.</span>
            </span>
            <span className="brand-label">
              LUCAS BERDY<span>Independent frontend developer</span>
            </span>
          </a>
          <nav
            className={menu ? "main-nav open" : "main-nav"}
            id="main-nav"
            aria-label="Main navigation"
          >
            <a href="#services">Services</a>
            <a href="#work">Selected work</a>
            <a href="#approach">The approach</a>
            <a
              className={workspace ? "desk-link active" : "desk-link"}
              href="#workspace"
            >
              <FolderOpen size={15} /> Project desk{" "}
              {drafts.length > 0 && (
                <span className="count">{drafts.length}</span>
              )}
            </a>
          </nav>
          <button className="header-cta" onClick={() => start()}>
            Start a project <ArrowUpRight size={17} />
          </button>
          <button
            className="menu-button"
            aria-label={menu ? "Close navigation" : "Open navigation"}
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
                  <FolderOpen size={14} /> YOUR PROJECT DESK
                </span>
                <h1>
                  A little space.
                  <br />
                  For your next big idea.
                </h1>
                <p>
                  Plan it, save it, come back to it. Your next website starts
                  here.
                </p>
              </div>
              <button className="button lime" onClick={() => start()}>
                New project <Plus size={18} />
              </button>
            </div>
            <div className="desk-note">
              <ShieldCheck size={22} />
              <div>
                <strong>Your drafts. On this device.</strong>
                <p>
                  This desk saves drafts in this browser. Nothing is sent
                  automatically. Secure client accounts, payments and order
                  tracking are not connected yet.
                </p>
              </div>
            </div>
            {notice && (
              <p className="notice" role="status">
                {notice}
              </p>
            )}
            <div className="desk-heading">
              <h2>
                Project drafts <span>{drafts.length}</span>
              </h2>
              <span>Not submitted</span>
            </div>
            {drafts.length === 0 ? (
              <div className="empty-desk">
                <div className="folder-illustration">
                  <FolderOpen size={50} />
                  <Mark />
                </div>
                <h3>Good things start with a rough idea.</h3>
                <p>
                  Choose a service, tell me what you have in mind,
                  <br />
                  and build a brief at your own pace.
                </p>
                <button className="button lime" onClick={() => start()}>
                  Plan my first project <ArrowUpRight size={18} />
                </button>
              </div>
            ) : (
              <div className="draft-grid">
                {drafts.map((d) => (
                  <article className="draft-card" key={d.id}>
                    <div className="draft-card-top">
                      <FileText size={22} />
                      <span className="pill">Draft · not submitted</span>
                    </div>
                    <span className="eyebrow">{serviceName(d.service)}</span>
                    <h3>{d.company || d.name || "Untitled project"}</h3>
                    <p>{d.brief || "Your next website, taking shape."}</p>
                    <small>
                      Saved{" "}
                      {new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                      }).format(new Date(d.updatedAt))}
                    </small>
                    <div className="draft-actions">
                      <button onClick={() => resume(d)}>
                        Continue project <ArrowUpRight size={16} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Delete ${d.company || d.name || "untitled"} draft`}
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
              Back to the services <ArrowRight size={16} />
            </a>
          </section>
        ) : (
          <>
            <section className="hero shell" id="top">
              <div className="hero-kicker">
                <span className="eyebrow">
                  <span className="status-dot" /> INDEPENDENT DEVELOPER.
                  PERSONAL APPROACH.
                </span>
                <span className="hero-location">
                  BASED IN FRANCE / WORKING ONLINE
                </span>
              </div>
              <div className="hero-grid">
                <div className="hero-copy">
                  <div className="hero-overline">
                    A SMALL STUDIO FOR YOUR NEXT BIG THING
                  </div>
                  <h1>
                    Your business.
                    <br />
                    Impossible
                    <br />
                    to{" "}
                    <span>
                      ignore
                      <svg
                        viewBox="0 0 340 22"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                      >
                        <path d="M4 14Q160-7 333 9M15 21Q180 4 326 15" />
                      </svg>
                      .
                    </span>
                  </h1>
                  <p>
                    Websites with personality. Development with care.
                    <br className="desktop-break" /> I help independent people
                    turn what they do
                    <br className="desktop-break" /> into a website worth
                    choosing.
                  </p>
                  <div className="hero-actions">
                    <button className="button lime" onClick={() => start()}>
                      Let’s build your next chapter <ArrowUpRight size={19} />
                    </button>
                    <a className="understated-link" href="#work">
                      See the work <ArrowDown size={15} />
                    </a>
                  </div>
                  <div className="hero-footnote">
                    <span className="mini-monogram">lb.</span>
                    <span>
                      Work directly with Lucas.
                      <br />
                      <strong>From the first idea to the final detail.</strong>
                    </span>
                  </div>
                </div>
                <div className="hero-stage">
                  <div className="stage-grid" />
                  <Mark className="stage-star" />
                  <span className="stage-label">
                    <span className="status-dot" /> A LITTLE OF WHAT’S POSSIBLE
                  </span>
                  <div className="showcase-window">
                    <div className="window-toolbar">
                      <span className="window-dots">
                        <i />
                        <i />
                        <i />
                      </span>
                      <span>
                        {projects[preview].name
                          .toLowerCase()
                          .replaceAll(" ", "-")}
                        .design
                      </span>
                      <ArrowUpRight size={12} />
                    </div>
                    <a
                      className={`showcase-image ${projects[preview].color}`}
                      href={projects[preview].url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Explore ${projects[preview].name}`}
                    >
                      <img
                        src={asset(projects[preview].image)}
                        alt={`${projects[preview].name} website preview`}
                        width="1200"
                        height="630"
                      />
                      <span className="preview-live">
                        Explore the project <ArrowUpRight size={15} />
                      </span>
                    </a>
                    <div className="window-bottom">
                      <div>
                        <span className="eyebrow">
                          {projects[preview].kind}
                        </span>
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
                    <span>Thoughtful on every screen.</span>
                  </div>
                  <div
                    className="preview-controls"
                    aria-label="Choose a project preview"
                  >
                    {projects.map((p, i) => (
                      <button
                        key={p.name}
                        className={preview === i ? "selected" : ""}
                        onClick={() => setPreview(i)}
                        aria-label={`Preview ${p.name}`}
                        aria-pressed={preview === i}
                      >
                        <span>0{i + 1}</span>
                        {i === preview && <span>{p.name}</span>}
                      </button>
                    ))}
                  </div>
                  <div className="stage-caption">
                    REAL PROJECTS. DIFFERENT POSSIBILITIES.
                  </div>
                </div>
              </div>
              <div className="hero-bottom">
                <span>
                  GOOD DESIGN GETS NOTICED. GOOD DEVELOPMENT MAKES IT LAST.
                </span>
                <a href="#services">
                  FIND YOUR STARTING POINT <ArrowDown size={14} />
                </a>
              </div>
            </section>
            <div
              className="service-ribbon"
              aria-label="Portfolios, business websites and website care"
            >
              <div>
                <span>PERSONAL PORTFOLIOS</span>
                <Mark />
                <span>BUSINESS WEBSITES</span>
                <Mark />
                <span>ONGOING WEBSITE CARE</span>
                <Mark />
                <span>YOUR NEXT CHAPTER, ONLINE</span>
                <Mark />
              </div>
            </div>
            <section className="section shell services-section" id="services">
              <div className="section-heading reveal">
                <div>
                  <span className="eyebrow">01 / FIND YOUR STARTING POINT</span>
                  <h2>
                    You do your thing.
                    <br />
                    <span>I’ll build its home.</span>
                  </h2>
                </div>
                <p>
                  A first website. A better one. Or a little attention
                  <br className="desktop-break" /> for the one you already have.
                  <br />
                  There’s a good place to start.
                </p>
              </div>
              <div className="service-grid">
                {services.map((s, i) => (
                  <article
                    className={`service-card reveal ${i === 1 ? "highlight" : ""}`}
                    key={s.id}
                  >
                    <div className="service-card-top">
                      <span className="eyebrow">
                        {s.no} / {s.short.toUpperCase()}
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
                      <h3>{s.name}</h3>
                      <span className="service-tagline">{s.tagline}</span>
                      <p>{s.description}</p>
                    </div>
                    <ul>
                      {s.features.map((f) => (
                        <li key={f}>
                          <Check size={14} />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="service-card-bottom">
                      <span>
                        <strong className="service-budget">{s.budget}</strong>
                        <small>Indicative · quote before approval</small>
                      </span>
                      <button
                        onClick={() => start(s.id)}
                        aria-label={`Start a ${s.short.toLowerCase()} project`}
                      >
                        <ArrowUpRight size={23} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              <div className="services-note">
                <span>
                  <ShieldCheck size={15} /> Scope, price and timeline agreed
                  before we start.
                </span>
                <a href="#faq">
                  A few questions? <ArrowUpRight size={14} />
                </a>
              </div>
              <p className="pricing-disclaimer">
                Indicative EUR budgets for a focused starting scope. Larger
                projects, extra features, any applicable taxes, domain, hosting
                and third-party costs are confirmed separately in your written
                quote. Nothing is booked or charged without your approval.
              </p>
            </section>
            <section className="work-section section" id="work">
              <div className="shell">
                <div className="section-heading reveal">
                  <div>
                    <span className="eyebrow">02 / THE WORK SPEAKS FIRST</span>
                    <h2>
                      Different worlds.
                      <br />
                      <span>The same care.</span>
                    </h2>
                  </div>
                  <a
                    className="understated-link"
                    href="https://portfolio-swart-psi-26.vercel.app/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Explore my full portfolio <ArrowUpRight size={17} />
                  </a>
                </div>
                <div
                  className="work-filters"
                  aria-label="Filter selected projects"
                >
                  {["All work", "Portfolios", "Frontend & performance"].map(
                    (f) => (
                      <button
                        key={f}
                        className={filter === f ? "active" : ""}
                        aria-pressed={filter === f}
                        onClick={() => setFilter(f)}
                      >
                        {f}
                      </button>
                    ),
                  )}
                </div>
                <div className="project-grid">
                  {projects
                    .filter(
                      (_, i) =>
                        filter === "All work" ||
                        (filter === "Portfolios" ? i === 0 : i !== 0),
                    )
                    .map((p) => (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        key={p.name}
                        className={`project-card ${p.color} ${p.name === "Samantha Ramsey" ? "featured" : ""}`}
                      >
                        <div className="project-visual">
                          <img
                            src={asset(p.image)}
                            alt={`${p.name} website preview`}
                            loading="lazy"
                            width="1200"
                            height={p.image === "samantha.webp" ? 630 : 750}
                          />
                          <span className="visit-project">
                            <ArrowUpRight size={22} />
                          </span>
                        </div>
                        <div className="project-details">
                          <div>
                            <span className="eyebrow">{p.kind}</span>
                            <h3>{p.name}</h3>
                            <p>{p.description}</p>
                          </div>
                          <div className="project-tags">
                            {p.tags.map((t) => (
                              <span key={t}>{t}</span>
                            ))}
                          </div>
                        </div>
                      </a>
                    ))}
                </div>
              </div>
            </section>
            <section className="section shell approach" id="approach">
              <div className="approach-intro reveal">
                <span className="eyebrow">
                  03 / LESS BACK-AND-FORTH. MORE FORWARD.
                </span>
                <h2>
                  A good website starts
                  <br />
                  with a good <span>conversation.</span>
                </h2>
                <p>
                  You shouldn’t need to speak developer to get the website you
                  want.
                  <br className="desktop-break" /> We’ll keep the process clear,
                  collaborative and focused on you.
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
                    <h3>{s.title}</h3>
                    <p>{s.text}</p>
                  </article>
                ))}
              </div>
              <div className="process-banner">
                <div>
                  <FolderOpen size={25} />
                  <span>
                    Ideas need a little room.
                    <small>
                      Start a brief now. Pick it up later in your project desk.
                    </small>
                  </span>
                </div>
                <a href="#workspace">
                  Take a look <ArrowUpRight size={18} />
                </a>
              </div>
            </section>
            <section className="about-section">
              <div className="shell about-grid">
                <div className="identity-card reveal">
                  <div className="identity-top">
                    <span className="eyebrow">
                      THE PERSON BEHIND THE PIXELS
                    </span>
                    <span>FR / 01</span>
                  </div>
                  <div className="identity-monogram">
                    lb
                    <Mark />
                  </div>
                  <div className="identity-bottom">
                    <span>
                      LUCAS BERDY<small>Independent frontend developer</small>
                    </span>
                    <span className="status-dot" />
                  </div>
                </div>
                <div className="about-copy reveal">
                  <span className="eyebrow">
                    A PERSON. NOT A PRODUCTION LINE.
                  </span>
                  <h2>
                    Small studio energy.
                    <br />
                    <span>Personal attention.</span>
                  </h2>
                  <p>
                    I’m Lucas, a frontend developer based in France. I love
                    clean interfaces, expressive details and the moment a
                    website starts to feel like the person behind it.
                  </p>
                  <p>
                    When we work together, you’re talking to the person building
                    your website. I take the time to understand what matters to
                    you, explain the choices and sweat the small stuff.
                  </p>
                  <div className="about-principles">
                    <span>
                      <Check size={15} /> Direct communication
                    </span>
                    <span>
                      <Check size={15} /> Thoughtful details
                    </span>
                    <span>
                      <Check size={15} /> Clean, considered code
                    </span>
                  </div>
                  <a
                    className="understated-link"
                    href="https://github.com/existing-prog"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Meet the code behind the work <ArrowUpRight size={17} />
                  </a>
                </div>
              </div>
            </section>
            <section className="section shell faq-section" id="faq">
              <div>
                <span className="eyebrow">BEFORE WE GET STARTED</span>
                <h2>
                  Good questions.
                  <br />
                  <span>Straight answers.</span>
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
                      {f.q}
                      <Plus className="faq-plus" size={18} />
                      <Minus className="faq-minus" size={18} />
                    </summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
            <section className="closing-section">
              <div className="shell closing-inner">
                <span className="eyebrow">
                  <span className="status-dot" /> YOUR NEXT CHAPTER STARTS HERE
                </span>
                <h2>
                  Let’s make your
                  <br />
                  next move a <em>good one.</em>
                  <Mark />
                </h2>
                <div className="closing-bottom">
                  <p>
                    Bring the idea. I’ll bring the care,
                    <br />
                    the code and a fresh perspective.
                  </p>
                  <button className="button dark" onClick={() => start()}>
                    Tell me what you’re building <ArrowUpRight size={20} />
                  </button>
                  <a href="mailto:lucasberdy@gmail.com">
                    Or just say hello <ArrowUpRight size={16} />
                  </a>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      <footer className="site-footer shell">
        <a href="#top" className="brand-symbol" aria-label="Lucas Berdy home">
          lb<span>.</span>
        </a>
        <span>
          © {new Date().getFullYear()} LUCAS BERDY
          <br />
          <small>INDEPENDENT BY CHOICE. INTENTIONAL BY DESIGN.</small>
        </span>
        <div>
          <a
            href="https://github.com/existing-prog"
            target="_blank"
            rel="noreferrer"
          >
            GitHub <ArrowUpRight size={13} />
          </a>
          <a
            href="https://portfolio-swart-psi-26.vercel.app/"
            target="_blank"
            rel="noreferrer"
          >
            Portfolio <ArrowUpRight size={13} />
          </a>
          <a href="mailto:lucasberdy@gmail.com">
            Email <ArrowUpRight size={13} />
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
