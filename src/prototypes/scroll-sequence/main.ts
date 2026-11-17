import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSequence } from "../../scrollSequence";
import "./style.scss";
gsap.registerPlugin(ScrollTrigger);

// Essai interne : images extraites de la vidéo Kling (non versionnées).
const FRAMES = 61;
const section = document.querySelector<HTMLElement>(".sequence")!;
const canvas = section.querySelector("canvas")!;
const phone = matchMedia("(max-width: 760px)").matches;
const folder = `${import.meta.env.BASE_URL}assets/sequence-test/${phone ? "mobile" : "desktop"}/`;
const sequence = new ScrollSequence({
  canvas,
  frameCount: FRAMES,
  src: (i) => `${folder}${String(i + 1).padStart(3, "0")}.webp`,
  fit: "cover",
  // Léger agrandissement : le filigrane du coin passe hors cadre sur téléphone.
  zoom: phone ? 1.08 : 1.04,
  onReady: () => (section.dataset.state = "ready"),
  onProgress: (loaded) => section.style.setProperty("--loaded", loaded.toFixed(2)),
});

const tl = gsap.timeline({
  defaults: { ease: "none" },
  scrollTrigger: {
    trigger: ".sequence-track",
    start: "top top",
    end: "bottom bottom",
    scrub: 0.4,
    onUpdate: ({ progress }) => {
      sequence.render(progress);
      section.style.setProperty("--progress", progress.toFixed(3));
    },
  },
});
// Le titre en contour grandit et s’efface pendant que la pizza s’ouvre ;
// la phrase finale arrive quand les ingrédients sont en suspension.
tl.fromTo(
  ".outline",
  { scale: 1, opacity: 1 },
  { scale: 1.6, opacity: 0, duration: 0.35 },
  0.05,
)
  .fromTo(".solid", { y: 0, opacity: 1 }, { y: -40, opacity: 0, duration: 0.2 }, 0.05)
  .fromTo(
    ".sequence-end",
    { y: 40, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.15 },
    0.8,
  )
  .to({}, { duration: 0.05 }, 0.95);
