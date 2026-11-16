import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createScene, type PizzaScene } from "./scene";
import "./style.scss";

gsap.registerPlugin(ScrollTrigger);
const element = <T extends HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!;
const experiment = element<HTMLElement>(".experiment");
const studio = element<HTMLElement>(".studio");
const canvas = element<HTMLCanvasElement>("#pizza-canvas");
const intro = element<HTMLElement>(".intro-copy");
const outro = element<HTMLElement>(".outro-copy");
const caption = element<HTMLElement>(".scene-caption");
const sceneLayer = element<HTMLElement>(".scene");
const slider = element<HTMLInputElement>("#scene-progress");
const output = element<HTMLOutputElement>("#progress-value");
const playButton = element<HTMLButtonElement>("#play");
const resetButton = element<HTMLButtonElement>("#reset");
const loading = element<HTMLElement>(".loading");
const status = element<HTMLElement>(".scene-status");
const chapters = [...document.querySelectorAll<HTMLButtonElement>("[data-progress]")];
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
const phases = [
  {
    at: 0,
    title: "Tout commence ici.",
    detail: "Une pizza. Un geste. Une autre perspective.",
  },
  {
    at: 0.12,
    title: "Un geste familier.",
    detail: "La main s’approche, puis saisit la croûte.",
  },
  {
    at: 0.36,
    title: "Changeons de perspective.",
    detail: "La part se soulève. La caméra accompagne le geste.",
  },
  {
    at: 0.62,
    title: "Un seul geste.",
    detail: "La part quitte le cadre. L’histoire continue hors champ.",
  },
  {
    at: 0.8,
    title: "Il reste une trace.",
    detail: "Retour à la carte. À vous de prendre la suite.",
  },
];
let scene: PizzaScene | undefined;
let trigger: ScrollTrigger | undefined;
const PLAYBACK_DURATION_MS = 9_000;
let playback: number | undefined;
let progress = 0;
let currentPhase = -1;
let ready = false;
let disposed = false;
const listeners = new AbortController();

function update(value: number) {
  progress = gsap.utils.clamp(0, 1, value);
  scene?.setProgress(progress);
  studio.dataset.progress = progress.toFixed(3);
  slider.value = String(progress * 100);
  output.value = `${Math.round(progress * 100)} %`;
  const introOpacity = 1 - gsap.utils.clamp(0, 1, (progress - 0.04) / 0.13);
  intro.style.opacity = String(introOpacity);
  intro.style.transform = `translateY(${-18 * (1 - introOpacity)}px)`;
  // La pizza reste visible : le texte accompagne le retour au cadrage du dessus.
  const endOpacity = gsap.utils.clamp(0, 1, (progress - 0.92) / 0.08);
  outro.style.opacity = String(endOpacity);
  outro.style.visibility = endOpacity > 0 ? "visible" : "hidden";
  outro.inert = endOpacity < 0.8;
  // Un seul contenu de conclusion accessible ; le titre initial reste dans le DOM.
  outro.setAttribute("aria-hidden", String(endOpacity < 0.8));
  sceneLayer.style.opacity = "1";
  caption.style.opacity = String(
    (innerWidth <= 760 ? gsap.utils.clamp(0, 1, (progress - 0.14) / 0.06) : 1) *
      (1 - gsap.utils.clamp(0, 1, (progress - 0.8) / 0.06)),
  );
  const phase = phases.filter(({ at }) => progress >= at).length - 1;
  if (phase !== currentPhase) {
    currentPhase = phase;
    element(".caption-number").textContent = `0${phase + 1}`;
    element(".caption-title").textContent = phases[phase].title;
    element(".caption-detail").textContent = phases[phase].detail;
  }
  chapters.forEach((button, index) => {
    if (index === Math.min(phase, chapters.length - 1))
      button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });
}

function stop() {
  if (playback !== undefined) cancelAnimationFrame(playback);
  playback = undefined;
  playButton.setAttribute("aria-label", "Lire la séquence");
  playButton.innerHTML = 'Lire la séquence <span aria-hidden="true">▷</span>';
  playButton.setAttribute("aria-pressed", "false");
}

/** Les contrôles déplacent le même scroll natif que le geste tactile.
 * En mouvement réduit, seuls les changements de pose demandés sont affichés.
 */
function seek(value: number, showScene: boolean) {
  stop();
  if (motionPreference.matches) {
    update(value);
    if (showScene) studio.scrollIntoView({ behavior: "instant" });
    return;
  }
  if (trigger)
    window.scrollTo({
      top: trigger.start + (trigger.end - trigger.start) * value,
      behavior: "instant",
    });
  update(value);
}
function configureMotion() {
  stop();
  trigger?.kill();
  trigger = undefined;
  const reduced = motionPreference.matches;
  document.body.dataset.reduced = String(reduced);
  playButton.hidden = reduced;
  element("#motion-note").textContent = reduced
    ? "Votre préférence de mouvement réduit est respectée. Les étapes et le curseur permettent d’examiner volontairement chaque pose, sans lecture automatique."
    : "Défilement naturel, lecture facultative et retour en arrière possible. Aucune modification de la page Atelier Pizza actuelle.";
  if (!ready) return;
  update(0);
  scene?.resize();
  if (!reduced) {
    trigger = ScrollTrigger.create({
      trigger: experiment,
      start: "top top",
      end: "bottom bottom",
      // Pas de pin, pas de capture des événements tactiles : CSS sticky seulement.
      onUpdate: (self) => update(self.progress),
      onRefresh: (self) => update(self.progress),
    });
  }
}

function fallback() {
  ready = false;
  stop();
  trigger?.kill();
  trigger = undefined;
  scene?.dispose();
  scene = undefined;
  resizeObserver.disconnect();
  sceneLayer.hidden = true;
  loading.hidden = true;
  document.body.dataset.renderer = "fallback";
  element(".fallback").hidden = false;
  slider.disabled = true;
  playButton.disabled = true;
  resetButton.disabled = true;
  chapters.forEach((button) => (button.disabled = true));
  status.textContent =
    "La scène 3D est indisponible. Le lien sous l’illustration permet de revenir au projet.";
}

slider.addEventListener("input", () => seek(Number(slider.value) / 100, false), {
  signal: listeners.signal,
});
resetButton.addEventListener("click", () => seek(0, true), { signal: listeners.signal });
chapters.forEach((button) =>
  button.addEventListener("click", () => seek(Number(button.dataset.progress), true), {
    signal: listeners.signal,
  }),
);
playButton.addEventListener(
  "click",
  () => {
    if (playback !== undefined) {
      stop();
      return;
    }
    if (!ready || !trigger) return;
    seek(0, true);
    playButton.setAttribute("aria-label", "Mettre en pause");
    playButton.innerHTML = 'Mettre en pause <span aria-hidden="true">Ⅱ</span>';
    playButton.setAttribute("aria-pressed", "true");
    status.textContent =
      "Lecture en cours. Défiler ou toucher l’écran interrompt la lecture.";
    // Le temps réel prime sur le nombre d’images rendues. Le lissage temporel
    // de GSAP allongeait la lecture sur les appareils qui perdent des images.
    // Cette boucle n’existe que pendant la lecture volontaire et reste annulable.
    const startedAt = performance.now();
    const playFrame = (now: number) => {
      if (playback === undefined || !trigger) return;
      const position = gsap.utils.clamp(0, 1, (now - startedAt) / PLAYBACK_DURATION_MS);
      window.scrollTo({
        top: trigger.start + (trigger.end - trigger.start) * position,
        behavior: "instant",
      });
      update(position);
      if (position >= 1) {
        stop();
        status.textContent =
          "Séquence terminée. Vous pouvez la rejouer ou revenir sur une étape.";
      } else {
        playback = requestAnimationFrame(playFrame);
      }
    };
    playback = requestAnimationFrame(playFrame);
  },
  { signal: listeners.signal },
);
// La lecture facultative cède immédiatement la place au visiteur.
for (const event of ["wheel", "touchstart", "pointerdown"] as const) {
  window.addEventListener(
    event,
    (e) => {
      if (e.target instanceof Node && playButton.contains(e.target)) return;
      if (playback !== undefined) {
        stop();
        status.textContent = "Lecture en pause.";
      }
    },
    { passive: true, signal: listeners.signal },
  );
}
window.addEventListener(
  "keydown",
  (event) => {
    if (["Escape", "ArrowDown", "ArrowUp", "PageDown", "PageUp", " "].includes(event.key))
      stop();
  },
  { signal: listeners.signal },
);
document.addEventListener(
  "visibilitychange",
  () => {
    if (document.hidden) stop();
  },
  { signal: listeners.signal },
);
motionPreference.addEventListener("change", configureMotion, {
  signal: listeners.signal,
});
const resizeObserver = new ResizeObserver(() => scene?.resize());
resizeObserver.observe(studio);
configureMotion();

createScene(canvas, fallback)
  .then((instance) => {
    if (disposed) {
      instance.dispose();
      return;
    }
    scene = instance;
    ready = true;
    loading.hidden = true;
    document.body.dataset.renderer = "ready";
    configureMotion();
    document.fonts.ready.then(() => {
      if (!disposed) ScrollTrigger.refresh();
    });
  })
  .catch((error: unknown) => {
    console.warn(
      "Prototype 3D indisponible :",
      error instanceof Error ? error.message : error,
    );
    fallback();
  });

// Nettoyage complet pour HMR, navigation et cache arrière/avant du navigateur.
function dispose() {
  disposed = true;
  stop();
  trigger?.kill();
  resizeObserver.disconnect();
  listeners.abort();
  scene?.dispose();
}
window.addEventListener(
  "pagehide",
  (event) => {
    if (event.persisted) {
      stop();
      return;
    }
    dispose();
  },
  { signal: listeners.signal },
);
if (import.meta.hot) import.meta.hot.dispose(dispose);
