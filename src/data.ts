import { tr } from "./i18n";
import { currentLang, pathFor } from "./routes";
/**
 * Contrat de données : ne pas traduire les identifiants ni les valeurs enregistrées.
 * Les libellés anglais servent de clés vers FR.json / ENG.json au moment de l’affichage.
 */
export type ServiceId = "portfolio" | "website" | "care";
export const services = [
  {
    id: "portfolio" as const,
    no: "01",
    name: "The personal statement.",
    short: "Portfolio",
    budget: "€600–€1,200",
    budgetScope: "Focused portfolio · approx. 2–4 development days",
    tagline: "For the work only you can do.",
    description:
      "A distinctive home for your work, your story and your next opportunity. Make every introduction count.",
    features: [
      "A design that feels like you",
      "Thoughtful project showcases",
      "Mobile-first, from the start",
    ],
    includes: "Personal portfolios · Creative showcases",
  },
  {
    id: "website" as const,
    no: "02",
    name: "The next big move.",
    short: "Business website",
    budget: "€1,200–€2,400",
    budgetScope: "Small brochure website · approx. 4–8 development days",
    tagline: "For the business you’re building.",
    description:
      "Turn a first impression into a next step. A considered website that makes your offer clear and your business memorable.",
    features: [
      "Landing pages or a complete website",
      "A clear path from visitor to enquiry",
      "Performance & SEO foundations",
    ],
    includes: "Small businesses · Freelancers · New ventures",
  },
  {
    id: "care" as const,
    no: "03",
    name: "The ongoing attention.",
    short: "Website care",
    budget: "€45 / hour",
    budgetScope: "Frontend updates · time and scope agreed in advance",
    tagline: "For a website that keeps getting better.",
    description:
      "The launch is just the beginning. Get a helping hand with updates, frontend fixes and the details that need attention.",
    features: [
      "Content and layout updates",
      "Responsive & accessibility fixes",
      "Frontend performance improvements",
    ],
    includes: "Existing websites · One-off fixes · Ongoing care",
  },
];
export const projects = [
  {
    id: "samantha",
    name: "Samantha Ramsey",
    kind: "Academic portfolio",
    caption: "Research with a sense of discovery.",
    description:
      "I designed and developed a responsive academic portfolio, bringing research, publications and interactive orbital mechanics together in one distinctive experience.",
    image: "samantha-current.webp",
    url: "https://samantharamsey.github.io/portfolio_samantha/",
    tags: ["Academic portfolio", "Interactive experience"],
    color: "violet",
  },
  {
    id: "kasa",
    name: "Kasa",
    kind: "Training project",
    caption: "A place to feel at home.",
    description:
      "A responsive rental interface built with React, with reusable components and dynamic property pages.",
    image: "kasa.webp",
    url: "https://portfolio-swart-psi-26.vercel.app/projects/kasa",
    tags: ["React", "Responsive UI"],
    color: "sand",
  },
  {
    id: "nina",
    name: "Nina Carducci",
    kind: "Training project",
    caption: "A sharper digital picture.",
    description:
      "Frontend performance, SEO and accessibility improvements for a photography portfolio.",
    image: "nina.webp",
    url: "https://portfolio-swart-psi-26.vercel.app/projects/nina-carducci",
    tags: ["Performance", "SEO & accessibility"],
    color: "sage",
  },
];
/** Un seul point pour les liens de projet : étude interne ou site externe. */
export const projectHref = (project: (typeof projects)[number]) =>
  project.id === "samantha" || project.id === "kasa" || project.id === "nina"
    ? pathFor({ kind: "case", id: project.id }, currentLang())
    : project.url;
export const isInternalHref = (href: string) => !/^https?:/.test(href);

/** Brouillon local uniquement : aucun état « payé » ou « reçu » n’est simulé. */
export interface Draft {
  id: string;
  updatedAt: string;
  service: ServiceId;
  pages: string;
  extras: string[];
  name: string;
  email: string;
  company: string;
  website: string;
  timeline: string;
  brief: string;
}
export const emptyDraft = (service: ServiceId = "website"): Draft => ({
  id: "",
  updatedAt: "",
  service,
  pages: "Not sure yet",
  extras: [],
  name: "",
  email: "",
  company: "",
  website: "",
  timeline: "Flexible",
  brief: "",
});
export const serviceName = (id: ServiceId) =>
  tr(services.find((s) => s.id === id)?.short ?? "Website project");
export const budgetGuide = (id: ServiceId) =>
  tr(services.find((s) => s.id === id)?.budget ?? "Custom quote");
/** Traduire les étiquettes du brief, jamais le texte personnel rédigé par le visiteur. */
export function briefText(d: Draft) {
  return tr("export.body", {
    service: serviceName(d.service),
    name: d.name,
    email: d.email,
    company: d.company || tr("Not provided"),
    website: d.website || tr("Not provided"),
    pages: tr(d.pages),
    extras: d.extras.map((x) => tr(x)).join(", ") || tr("Core service"),
    timeline: tr(d.timeline),
    brief: d.brief,
    budget: budgetGuide(d.service),
  });
}
/** Valider aussi le stockage local : une ancienne version ou une saisie corrompue ne doit pas casser l’interface. */
export function loadDrafts(): Draft[] {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem("lb-project-drafts-v1") || "[]",
    );
    if (!Array.isArray(value)) return [];
    return value
      .filter(
        (d): d is Draft =>
          !!d &&
          typeof d === "object" &&
          ["portfolio", "website", "care"].includes(d.service) &&
          [
            "id",
            "updatedAt",
            "pages",
            "name",
            "email",
            "company",
            "website",
            "timeline",
            "brief",
          ].every((k) => typeof d[k] === "string") &&
          Number.isFinite(Date.parse(d.updatedAt)) &&
          Array.isArray(d.extras) &&
          d.extras.every((x: unknown) => typeof x === "string"),
      )
      .slice(0, 50);
  } catch {
    return [];
  }
}
export const asset = (name: string) => `${import.meta.env.BASE_URL}assets/${name}`;
