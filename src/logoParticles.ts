import logo from "./logoPaths.json";

/**
 * Particules qui forment le logo « lb. » au fil du scroll. Les cibles sont
 * échantillonnées dans les vrais tracés du logo (Space Grotesk 600) : on dessine
 * le logo hors écran, puis on garde un point sur une grille régulière là où il
 * est opaque. Rendu en canvas 2D, sans dépendance.
 */
interface Particle {
  tx: number; // cible (dans le logo)
  ty: number;
  sx: number; // départ (nuage dispersé)
  sy: number;
  delay: number; // décalage d’arrivée (0 → 0,3)
  phase: number; // phase de la dérive
  size: number;
  dot: boolean; // appartient au point du logo (couleur d’accent)
  ox: number; // décalage dû au pointeur, lissé
  oy: number;
}

const INK = "#eef2f8";
const DOT = "#c6d4e9";

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** Pseudo-hasard stable : la même disposition à chaque visite. */
const rand = (i: number, salt: number) => {
  const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

export interface LogoParticlesOptions {
  canvas: HTMLCanvasElement;
  /** Zone du logo dans le canvas, en fractions (0 → 1) de sa largeur / hauteur. */
  area: { x: number; y: number; width: number; height: number };
  /** Pas de la grille d’échantillonnage en pixels CSS (plus petit = plus de points). */
  step: number;
  /** Réaction au pointeur (souris uniquement). */
  pointer?: boolean;
}

export class LogoParticles {
  private particles: Particle[] = [];
  private context: CanvasRenderingContext2D;
  private progress = 0;
  private frame = 0;
  private running = false;
  private pointer = { x: -9999, y: -9999 };
  private dpr = 1;
  private width = 0;
  private height = 0;
  private resizeObserver: ResizeObserver;
  private removePointer?: () => void;

  constructor(private options: LogoParticlesOptions) {
    this.context = options.canvas.getContext("2d")!;
    this.resizeObserver = new ResizeObserver(() => this.layout());
    this.resizeObserver.observe(options.canvas);
    if (options.pointer) {
      const move = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        const r = options.canvas.getBoundingClientRect();
        this.pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
      };
      const leave = () => (this.pointer = { x: -9999, y: -9999 });
      window.addEventListener("pointermove", move, { passive: true });
      document.addEventListener("pointerleave", leave);
      this.removePointer = () => {
        window.removeEventListener("pointermove", move);
        document.removeEventListener("pointerleave", leave);
      };
    }
    this.layout();
  }

  /** Recalcule les cibles quand la taille du canvas change. */
  private layout() {
    const { canvas, area, step } = this.options;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = canvas.clientWidth;
    this.height = canvas.clientHeight;
    if (!this.width || !this.height) return;
    canvas.width = Math.round(this.width * this.dpr);
    canvas.height = Math.round(this.height * this.dpr);

    // Logo dessiné hors écran, à sa taille d’affichage, pour l’échantillonner.
    const [vx, vy, vw, vh] = logo.viewBox;
    const boxW = this.width * area.width;
    const boxH = this.height * area.height;
    const scale = Math.min(boxW / vw, boxH / vh);
    const left = this.width * area.x + (boxW - vw * scale) / 2;
    const top = this.height * area.y + (boxH - vh * scale) / 2;
    const off = document.createElement("canvas");
    off.width = Math.ceil(vw * scale);
    off.height = Math.ceil(vh * scale);
    const octx = off.getContext("2d", { willReadFrequently: true })!;
    octx.setTransform(scale, 0, 0, scale, -vx * scale, -vy * scale);
    octx.fillStyle = "#f00"; // lettres en rouge, point en bleu : on les distingue
    octx.fill(new Path2D(logo.letters));
    octx.fillStyle = "#00f";
    octx.fill(new Path2D(logo.dot));
    const data = octx.getImageData(0, 0, off.width, off.height).data;

    const particles: Particle[] = [];
    for (let y = 0; y < off.height; y += step)
      for (let x = 0; x < off.width; x += step) {
        const i = (Math.floor(y) * off.width + Math.floor(x)) * 4;
        if (data[i + 3] < 128) continue;
        const n = particles.length;
        // Départ : un nuage large autour de la zone, comme une poussière d’étoiles.
        // Plus dense au centre (galaxie) : on voit une forme dès l’arrivée.
        const angle = rand(n, 1) * Math.PI * 2;
        const radius = 0.12 + Math.pow(rand(n, 2), 1.6) * 0.75;
        particles.push({
          tx: left + x + (rand(n, 3) - 0.5) * step * 0.6,
          ty: top + y + (rand(n, 4) - 0.5) * step * 0.6,
          sx:
            this.width * (area.x + area.width / 2) +
            Math.cos(angle) * radius * boxW * 0.9,
          sy:
            this.height * (area.y + area.height / 2) +
            Math.sin(angle) * radius * boxH * 1.1,
          delay: rand(n, 5) * 0.3,
          phase: rand(n, 6) * Math.PI * 2,
          size: 1.3 + rand(n, 7) * 1.5,
          dot: data[i + 2] > data[i],
          ox: 0,
          oy: 0,
        });
      }
    this.particles = particles;
    this.options.canvas.dataset.particles = String(particles.length);
    this.draw(performance.now());
  }

  /** Progression du scroll entre 0 (dispersé) et 1 (logo formé). */
  setProgress(progress: number) {
    this.progress = Math.min(1, Math.max(0, progress));
    if (!this.running) this.draw(performance.now());
  }

  /** Dérive continue et réaction au pointeur, seulement quand la scène est visible. */
  start() {
    if (this.running) return;
    this.running = true;
    const loop = (now: number) => {
      if (!this.running) return;
      this.draw(now);
      this.frame = requestAnimationFrame(loop);
    };
    this.frame = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.frame);
  }

  private draw(now: number) {
    const ctx = this.context;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    const time = now / 1000;
    const { x: px, y: py } = this.pointer;
    let formed = 0;
    for (const p of this.particles) {
      const t = ease(Math.min(1, Math.max(0, (this.progress - p.delay) / 0.45)));
      if (t >= 1) formed++;
      // Dérive : ample dans le nuage, presque nulle une fois en place.
      const drift = 14 * (1 - t) + 0.6;
      let x = p.sx + (p.tx - p.sx) * t + Math.sin(time * 0.6 + p.phase) * drift;
      let y = p.sy + (p.ty - p.sy) * t + Math.cos(time * 0.5 + p.phase * 1.3) * drift;
      // Le pointeur écarte doucement les particules proches, qui reviennent ensuite.
      const dx = x - px;
      const dy = y - py;
      const d2 = dx * dx + dy * dy;
      let fx = 0;
      let fy = 0;
      if (d2 < 6400) {
        const force = (1 - Math.sqrt(d2) / 80) * 18;
        const d = Math.sqrt(d2) || 1;
        fx = (dx / d) * force;
        fy = (dy / d) * force;
      }
      p.ox += (fx - p.ox) * 0.12;
      p.oy += (fy - p.oy) * 0.12;
      x += p.ox;
      y += p.oy;
      ctx.globalAlpha = 0.55 + 0.45 * t;
      ctx.fillStyle = p.dot ? DOT : INK;
      ctx.fillRect(x - p.size / 2, y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    this.options.canvas.dataset.formed = String(
      this.particles.length ? +(formed / this.particles.length).toFixed(2) : 0,
    );
  }

  destroy() {
    this.stop();
    this.resizeObserver.disconnect();
    this.removePointer?.();
    this.particles = [];
  }
}
