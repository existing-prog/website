/**
 * Moteur de « suite d’images au scroll » : une vidéo découpée en images WebP est
 * dessinée dans un <canvas> selon la progression du défilement (technique des
 * pages produits Apple). Indépendant de React et de GSAP : on lui donne une
 * progression entre 0 et 1, il affiche l’image correspondante.
 *
 * Chargement progressif : la première image d’abord, puis une image sur 8, sur 4,
 * sur 2 et enfin toutes. Tant qu’une image manque, la plus proche déjà chargée
 * est affichée : le scroll reste réactif même sur une connexion lente.
 */
export interface ScrollSequenceOptions {
  canvas: HTMLCanvasElement;
  frameCount: number;
  /** Adresse de l’image n° index (à partir de 0). */
  src: (index: number) => string;
  /** cover remplit le cadre (bords recadrés), contain montre toute l’image. */
  fit?: "cover" | "contain";
  /** Agrandissement supplémentaire, utile pour masquer un bord ou un filigrane. */
  zoom?: number;
  /** Fondu des bords de l’image vers la couleur de fond du canvas (fraction de la
   * largeur, par ex. 0.08). Masque un léger écart de teinte entre la vidéo et la page. */
  edgeFade?: number;
  /** Appelé quand la première image est prête (pour retirer un poster). */
  onReady?: () => void;
  /** Appelé à chaque nouvelle image chargée, avec la proportion chargée. */
  onProgress?: (loaded: number) => void;
}

export class ScrollSequence {
  private frames: (HTMLImageElement | null)[];
  private context: CanvasRenderingContext2D;
  private progress = 0;
  private drawn = -1;
  private frame = 0;
  private loadedCount = 0;
  private destroyed = false;
  private resizeObserver: ResizeObserver;

  constructor(private options: ScrollSequenceOptions) {
    this.frames = new Array(options.frameCount).fill(null);
    this.context = options.canvas.getContext("2d", { alpha: false })!;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(options.canvas);
    this.resize();
    void this.load();
  }

  /** Ordre de chargement : 0, puis des passes de plus en plus fines. */
  private order() {
    const { frameCount } = this.options;
    const seen = new Set<number>();
    const list: number[] = [];
    for (const stride of [frameCount, 8, 4, 2, 1])
      for (let i = 0; i < frameCount; i += stride)
        if (!seen.has(i)) {
          seen.add(i);
          list.push(i);
        }
    if (!seen.has(frameCount - 1)) list.push(frameCount - 1);
    return list;
  }

  private async load() {
    const queue = this.order();
    // Quatre téléchargements en parallèle : assez pour avancer vite, sans saturer.
    const worker = async () => {
      while (queue.length && !this.destroyed) {
        const index = queue.shift()!;
        const image = new Image();
        image.decoding = "async";
        image.src = this.options.src(index);
        try {
          await image.decode();
        } catch {
          continue; // une image manquante n’arrête pas la séquence
        }
        if (this.destroyed) return;
        this.frames[index] = image;
        this.loadedCount++;
        this.options.onProgress?.(this.loadedCount / this.options.frameCount);
        if (this.loadedCount === 1) this.options.onReady?.();
        this.schedule(true);
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
  }

  /** Progression du scroll entre 0 et 1. */
  render(progress: number) {
    this.progress = Math.min(1, Math.max(0, progress));
    this.schedule();
  }

  private schedule(force = false) {
    if (force) this.drawn = -1;
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.draw();
    });
  }

  /** Image chargée la plus proche de la cible, en cherchant des deux côtés. */
  private nearest(target: number) {
    for (let distance = 0; distance < this.frames.length; distance++) {
      if (this.frames[target - distance]) return target - distance;
      if (this.frames[target + distance]) return target + distance;
    }
    return -1;
  }

  private draw() {
    const target = Math.round(this.progress * (this.options.frameCount - 1));
    const index = this.nearest(target);
    if (index < 0 || index === this.drawn) return;
    const image = this.frames[index]!;
    const { canvas } = this.options;
    const { width, height } = canvas;
    const ratio =
      (this.options.fit === "contain" ? Math.min : Math.max)(
        width / image.naturalWidth,
        height / image.naturalHeight,
      ) * (this.options.zoom ?? 1);
    const w = image.naturalWidth * ratio;
    const h = image.naturalHeight * ratio;
    const x = (width - w) / 2;
    const y = (height - h) / 2;
    this.context.drawImage(image, x, y, w, h);
    if (this.options.edgeFade) this.fadeEdges(x, y, w, h);
    this.drawn = index;
    canvas.dataset.frame = String(index);
  }

  /** Dégradés transparents → couleur de fond sur les quatre bords de l’image. */
  private fadeEdges(x: number, y: number, w: number, h: number) {
    const ctx = this.context;
    const color = this.background();
    const size = Math.min(w, h) * this.options.edgeFade!;
    const transparent = color.replace(/rgb\((.*)\)/, "rgba($1, 0)");
    const band = (x0: number, y0: number, x1: number, y1: number) => {
      const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, transparent);
      return gradient;
    };
    ctx.fillStyle = band(x, 0, x + size, 0);
    ctx.fillRect(x, y, size, h);
    ctx.fillStyle = band(x + w, 0, x + w - size, 0);
    ctx.fillRect(x + w - size, y, size, h);
    ctx.fillStyle = band(0, y, 0, y + size);
    ctx.fillRect(x, y, w, size);
    ctx.fillStyle = band(0, y + h, 0, y + h - size);
    ctx.fillRect(x, y + h - size, w, size);
  }

  private background() {
    return getComputedStyle(this.options.canvas).backgroundColor || "rgb(0, 0, 0)";
  }

  private resize() {
    const { canvas } = this.options;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(canvas.clientWidth * dpr);
    const height = Math.round(canvas.clientHeight * dpr);
    if (width && height && (canvas.width !== width || canvas.height !== height)) {
      canvas.width = width;
      canvas.height = height;
      // Fond identique à la vidéo pendant le redimensionnement.
      this.context.fillStyle = this.background();
      this.context.fillRect(0, 0, width, height);
      this.schedule(true);
    }
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.frames = [];
  }
}
