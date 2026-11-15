import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  Monitor,
  Smartphone,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { asset, projects, ServiceId } from "./data";
import "./project-stories.scss";

gsap.registerPlugin(ScrollTrigger);
const desktopQuery =
  "(min-width: 1024px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)";
const directions: Record<
  string,
  { service: ServiceId; result: string; label: string }
> = {
  samantha: {
    service: "portfolio",
    label: "DESIGN & DEVELOPMENT",
    result: "A distinctive home for your expertise, with room to explore.",
  },
  kasa: {
    service: "website",
    label: "RESPONSIVE DEVELOPMENT",
    result: "A considered experience, wherever your visitors find you.",
  },
  nina: {
    service: "care",
    label: "PERFORMANCE & ACCESSIBILITY",
    result: "Give your existing website the attention its content deserves.",
  },
};
type Project = (typeof projects)[number];

function BrowserFrame({ project }: { project: Project }) {
  return (
    <div className="story-browser">
      <div className="story-browser-bar">
        <span className="story-browser-dots">
          <i />
          <i />
          <i />
        </span>
        <span>{project.name}</span>
        <ArrowUpRight size={12} />
      </div>
      <img
        src={asset(project.image)}
        alt=""
        width="1200"
        height={project.id === "samantha" ? 630 : 750}
        loading="lazy"
      />
    </div>
  );
}
function ProjectVisual({
  project,
  desktop = false,
}: {
  project: Project;
  desktop?: boolean;
}) {
  return (
    <div
      className={`story-scene scene-${project.id}`}
      data-scene={project.id}
      aria-hidden="true"
    >
      <span className="scene-corner">
        0{projects.indexOf(project) + 1} / {directions[project.id].label}
      </span>
      {project.id === "samantha" && (
        <>
          <div className="story-stars" />
          <div className="neptune-sphere" />
          <svg
            className="story-orbits"
            width="640"
            height="460"
            viewBox="0 0 640 460"
            fill="none"
          >
            <ellipse
              cx="382"
              cy="180"
              rx="208"
              ry="69"
              transform="rotate(-24 382 180)"
            />
            <ellipse
              cx="382"
              cy="180"
              rx="252"
              ry="108"
              transform="rotate(21 382 180)"
            />
            <ellipse
              cx="382"
              cy="180"
              rx="155"
              ry="132"
              transform="rotate(-54 382 180)"
            />
            <circle cx="570" cy="101" r="4" className="orbit-moon" />
          </svg>
          <BrowserFrame project={project} />
        </>
      )}
      {project.id === "kasa" && (
        <>
          <div className="kasa-blueprint" />
          <div className="kasa-tiles">
            {[0, 1, 2, 3].map((i) => (
              <div className={`kasa-tile tile-${i}`} key={i}>
                <img src={asset("kasa.webp")} alt="" loading="lazy" />
                <span />
              </div>
            ))}
          </div>
          <BrowserFrame project={project} />
          <div className="story-phone">
            <div className="phone-notch" />
            <img
              src={asset("kasa-mobile.webp")}
              alt=""
              width="600"
              height="1300"
              loading="lazy"
            />
          </div>
          <div className="device-caption">
            <Monitor size={15} />
            <span>One experience</span>
            <ArrowRight size={14} />
            <Smartphone size={14} />
          </div>
        </>
      )}
      {project.id === "nina" && (
        <>
          <div className="contact-sheet">
            {[1, 2, 3].map((i) => (
              <div className={`photo-print photo-${i}`} key={i}>
                <div className="photo-crop">
                  <img
                    src={asset(`nina-photo-${i}.webp`)}
                    alt=""
                    loading="lazy"
                  />
                </div>
                <span>0{i} / NINA CARDUCCI</span>
              </div>
            ))}
          </div>
          <BrowserFrame project={project} />
        </>
      )}
      {desktop && <div className="scene-vignette" />}
    </div>
  );
}

export default function ProjectStories({
  onStart,
}: {
  onStart: (service: ServiceId) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState("All work");
  const [active, setActive] = useState("samantha");
  const [desktop, setDesktop] = useState(
    () => matchMedia(desktopQuery).matches,
  );
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const visible = useMemo(
    () =>
      projects.filter(
        (_, i) =>
          filter === "All work" ||
          (filter === "Portfolios" ? i === 0 : i !== 0),
      ),
    [filter],
  );
  useEffect(() => {
    const mq = matchMedia(desktopQuery),
      rm = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setDesktop(mq.matches);
      setReduced(rm.matches);
    };
    mq.addEventListener("change", update);
    rm.addEventListener("change", update);
    return () => {
      mq.removeEventListener("change", update);
      rm.removeEventListener("change", update);
    };
  }, []);
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    let alive = true;
    setActive(visible[0].id);
    const context = gsap.context(() => {
      if (reduced) return;
      visible.forEach((project) => {
        const chapter = el.querySelector<HTMLElement>(
          `#chapter-${project.id}`,
        )!;
        const scene = desktop
          ? el.querySelector<HTMLElement>(
              `.story-stage [data-scene="${project.id}"]`,
            )!
          : chapter.querySelector<HTMLElement>(".story-scene")!;
        if (desktop)
          ScrollTrigger.create({
            trigger: chapter,
            start: "top 55%",
            end: "bottom 55%",
            onEnter: () => setActive(project.id),
            onEnterBack: () => setActive(project.id),
          });
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: chapter,
            start: desktop ? "top 88%" : "top 85%",
            end: desktop ? "center 40%" : "top 22%",
            scrub: desktop ? 0.65 : 0.35,
          },
        });
        const browser = scene.querySelector(".story-browser");
        if (project.id === "samantha") {
          const orbits = scene.querySelectorAll<SVGGeometryElement>(
            ".story-orbits ellipse",
          );
          orbits.forEach((path) => {
            const length = path.getTotalLength();
            gsap.set(path, {
              strokeDasharray: length,
              strokeDashoffset: length,
            });
            tl.to(
              path,
              { strokeDashoffset: 0, duration: 0.65, ease: "power1.inOut" },
              0,
            );
          });
          tl.fromTo(
            scene.querySelector(".neptune-sphere"),
            { scale: 0.55, y: 35, rotation: -25 },
            { scale: 1, y: 0, rotation: 0, duration: 0.8, ease: "power2.out" },
            0,
          );
          tl.fromTo(
            browser,
            { y: 90, rotationX: 12, rotationZ: -7, scale: 0.83, opacity: 0 },
            {
              y: 0,
              rotationX: 0,
              rotationZ: -3,
              scale: 1,
              opacity: 1,
              duration: 0.65,
              ease: "power2.out",
            },
            0.18,
          );
        } else if (project.id === "kasa") {
          tl.fromTo(
            scene.querySelectorAll(".kasa-tile"),
            {
              y: 80,
              rotation: () => gsap.utils.random(-14, 14),
              scale: 0.7,
              opacity: 0,
            },
            {
              y: 0,
              rotation: 0,
              scale: 1,
              opacity: 1,
              duration: 0.4,
              stagger: 0.07,
              ease: "power2.out",
            },
            0,
          );
          tl.fromTo(
            browser,
            { y: 55, scale: 0.82, rotationZ: -4, opacity: 0 },
            { y: 0, scale: 1, rotationZ: 0, opacity: 1, duration: 0.5 },
            0.15,
          );
          if (desktop)
            tl.to(
              browser,
              { scale: 0.82, x: -45, duration: 0.45, ease: "power2.inOut" },
              0.65,
            );
          tl.fromTo(
            scene.querySelector(".story-phone"),
            { y: 140, x: 65, rotationZ: 12, opacity: 0 },
            {
              y: 0,
              x: 0,
              rotationZ: 5,
              opacity: 1,
              duration: 0.5,
              ease: "power2.out",
            },
            0.6,
          );
        } else {
          tl.fromTo(
            scene.querySelectorAll(".photo-print"),
            { y: 80, rotationZ: 0, scale: 0.8, opacity: 0 },
            {
              y: 0,
              rotationZ: (i) => [-12, 8, -5][i],
              scale: 1,
              opacity: 1,
              duration: 0.45,
              stagger: 0.12,
              ease: "power2.out",
            },
            0,
          );
          tl.fromTo(
            scene.querySelectorAll(".photo-crop"),
            { clipPath: "inset(100% 0% 0% 0%)" },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 0.55,
              stagger: 0.1,
              ease: "power2.inOut",
            },
            0.1,
          );
          tl.fromTo(
            browser,
            { y: 90, scale: 0.86, rotationZ: 5, opacity: 0 },
            {
              y: 0,
              scale: 1,
              rotationZ: 0,
              opacity: 1,
              duration: 0.65,
              ease: "power2.out",
            },
            0.45,
          );
        }
      });
    }, el);
    const refresh = () => {
      if (alive) ScrollTrigger.refresh();
    };
    document.fonts.ready.then(refresh);
    const images = el.querySelectorAll("img");
    images.forEach((image) => image.addEventListener("load", refresh));
    return () => {
      alive = false;
      images.forEach((image) => image.removeEventListener("load", refresh));
      context.revert();
    };
  }, [visible, desktop, reduced]);
  const jump = (id: string) =>
    document.getElementById(`chapter-${id}`)?.scrollIntoView({
      behavior: reduced ? "instant" : "smooth",
      block: "center",
    });
  return (
    <div
      className="project-stories"
      data-enhanced={desktop}
      data-active={active}
      data-reduced-motion={reduced}
      ref={root}
    >
      <div className="work-filters" aria-label="Filter selected projects">
        {["All work", "Portfolios", "Frontend & performance"].map((f) => (
          <button
            key={f}
            className={filter === f ? "active" : ""}
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
        <a className="story-skip" href="#services">
          Skip to services <ArrowDown size={14} />
        </a>
      </div>
      <div className="story-layout">
        <div className="story-stage">
          <div className="story-stage-art">
            {visible.map((project) => (
              <ProjectVisual key={project.id} project={project} desktop />
            ))}
          </div>
          <div className="story-stage-footer">
            <span>
              <ArrowDown size={14} /> SCROLL TO EXPLORE
            </span>
            <nav aria-label="Jump to a project">
              {visible.map((project) => (
                <button
                  key={project.id}
                  onClick={() => jump(project.id)}
                  aria-label={`Show ${project.name}`}
                  aria-pressed={active === project.id}
                >
                  0{projects.indexOf(project) + 1}
                </button>
              ))}
            </nav>
          </div>
        </div>
        <div className="story-chapters">
          {visible.map((project) => (
            <article
              className={`project-chapter chapter-${project.id}`}
              id={`chapter-${project.id}`}
              key={project.id}
            >
              <div className="chapter-visual">
                <ProjectVisual project={project} />
              </div>
              <div className="chapter-content">
                <span className="chapter-number">
                  0{projects.indexOf(project) + 1}
                  <span> / 03</span>
                </span>
                <a
                  href={project.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`story-card project-card ${project.color} ${project.id === "samantha" ? "featured" : ""}`}
                  aria-labelledby={`project-${project.id}-title`}
                >
                  <div className="project-details">
                    <div>
                      <span className="eyebrow">{project.kind}</span>
                      <h3 id={`project-${project.id}-title`}>
                        {project.name}
                        <ArrowUpRight size={23} />
                      </h3>
                      <p id={`project-${project.id}-description`}>
                        {project.description}
                      </p>
                    </div>
                    <div className="project-tags">
                      {project.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </a>
                <p className="chapter-outcome">
                  <Check size={16} />
                  {directions[project.id].result}
                </p>
                <button
                  className="chapter-cta"
                  aria-label={`Start a project like ${project.name}`}
                  onClick={() => onStart(directions[project.id].service)}
                >
                  A project like this?
                  <ArrowUpRight size={18} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
