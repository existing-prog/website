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
    name: "Samantha Ramsey",
    kind: "Academic portfolio",
    caption: "Research with a sense of discovery.",
    description:
      "An academic portfolio bringing research, publications and interactive orbital mechanics together in one distinctive experience.",
    image: "samantha.webp",
    url: "https://samantharamsey.github.io/portfolio_samantha/",
    tags: ["Academic portfolio", "Interactive experience"],
    color: "violet",
  },
  {
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
  services.find((s) => s.id === id)?.short ?? "Website project";
export const budgetGuide = (id: ServiceId) =>
  services.find((s) => s.id === id)?.budget ?? "Custom quote";
export function briefText(d: Draft) {
  return `PROJECT REQUEST — ${serviceName(d.service)}\n\nName: ${d.name}\nEmail: ${d.email}\nBusiness: ${d.company || "Not provided"}\nExisting website: ${d.website || "Not provided"}\nPages / scope: ${d.pages}\nInterested in: ${d.extras.join(", ") || "Core service"}\nPreferred timeline: ${d.timeline}\n\nPROJECT BRIEF\n${d.brief}\n\nINDICATIVE SERVICE BUDGET GUIDE\n${budgetGuide(d.service)} — a starter-scope guide, not a quote or a confirmed total. Larger scopes, optional features, applicable taxes and external costs are confirmed in the written quote.\n\nPlease review my requirements and send a tailored quote. I understand that scope, price and dates need to be agreed before work starts.`;
}
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
export const asset = (name: string) =>
  `${import.meta.env.BASE_URL}assets/${name}`;
