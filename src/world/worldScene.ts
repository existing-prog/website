import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

/**
 * « Le fil » : un monde 3D continu derrière les sections sombres de l’accueil.
 * La caméra suit une spline (une étape par section) au rythme du scroll ; un fil
 * lumineux se dessine devant elle et change de forme selon la section :
 * poussière d’ouverture, deux brins (chercheurs / commerces), trois cristaux
 * (les offres), quatre jalons sur le fil (la démarche) et une aube pour le contact.
 *
 * Contrat : ce module n’est chargé qu’à la demande (import dynamique), jamais en
 * mouvement réduit ni pendant le pré-rendu. `destroy()` libère tout le GPU.
 */

/** Sections suivies, dans l’ordre de la page. Une absente est ignorée. */
export const ANCHORS = [
  "#top", // 0 ouverture
  "#work", // 1 réalisations (fond clair : on ne dessine pas)
  "#worlds", // 2 deux univers
  "#services", // 3 offres
  "#approach", // 4 démarche
  "#questions", // 5 questions
  "#contact", // 6 contact
] as const;

/** Une position de caméra par section. Y négatif = on descend, comme la page. */
const KEYS: [number, number, number][] = [
  [0, 0, 0],
  [5, -3, -55],
  [0, -6, -110],
  [-5, -4, -165],
  [0, -2, -220],
  [3, 0, -285],
  [0, 3, -335],
];
const LAST = KEYS.length - 1;

const SILVER = new THREE.Color("#dce6f6");
const BLUE = new THREE.Color("#7e9dcd");
const TEAL = new THREE.Color("#4fc1b2");
const AMBER = new THREE.Color("#f0b35a");
const DAWN = new THREE.Color("#f3d7b4");

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** Cloche : 0 hors de [a, d], 1 entre b et c. */
const bell = (a: number, b: number, c: number, d: number, v: number) =>
  smooth(a, b, v) * (1 - smooth(c, d, v));
const rand = (i: number, salt: number) => {
  const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

export interface WorldOptions {
  canvas: HTMLCanvasElement;
  /** Écran étroit : moins de particules, pas de bloom, pas de parallaxe souris. */
  light: boolean;
}

/* -------------------------------------------------------------- shaders -- */

const fogChunk = /* glsl */ `
  float fogFade(float depth) { return 1.0 - smoothstep(18.0, 70.0, depth); }
`;

const dustVertex = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uPixel;
  varying vec3 vColor;
  varying float vAlpha;
  ${fogChunk}
  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.18 + aPhase * 6.28) * 0.35;
    p.y += cos(uTime * 0.14 + aPhase * 4.0) * 0.35;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float depth = -mv.z;
    gl_PointSize = aSize * uPixel * (14.0 / max(depth, 0.5));
    gl_Position = projectionMatrix * mv;
    float twinkle = 0.65 + 0.35 * sin(uTime * (0.8 + aPhase) + aPhase * 20.0);
    vAlpha = fogFade(depth) * twinkle * smoothstep(0.5, 3.0, depth);
    vColor = aColor;
  }
`;

const dustFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor * a * vAlpha, a * vAlpha);
  }
`;

/** Fil qui se dessine jusqu’à `uDraw` (0 → 1 le long du tube). */
const threadVertex = /* glsl */ `
  varying float vU;
  varying float vDepth;
  void main() {
    vU = uv.x;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const threadFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uDraw;
  uniform float uTime;
  uniform float uIntensity;
  uniform vec2 uRes;
  varying float vU;
  varying float vDepth;
  ${fogChunk}
  void main() {
    float drawn = smoothstep(uDraw + 0.004, uDraw - 0.012, vU);
    // Tête lumineuse au bout du tracé, et légers influx qui parcourent le fil.
    float head = exp(-pow((vU - uDraw) * 90.0, 2.0)) * 1.1;
    float pulse = 0.75 + 0.25 * sin(vU * 160.0 - uTime * 2.2);
    // Fondu près de la caméra : le fil ne barre jamais un titre en gros plan.
    float near = smoothstep(4.0, 11.0, vDepth);
    // Zone calme au centre de l’écran, là où se posent les titres.
    vec2 q = (gl_FragCoord.xy / uRes - 0.5) * vec2(1.0, 1.3);
    float calm = smoothstep(0.14, 0.42, length(q));
    float a = (drawn * pulse + head) * fogFade(vDepth) * near * calm * uIntensity;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

/** Volume dépoli : bords lumineux (Fresnel), cœur presque transparent. */
const crystalVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vDepth;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const crystalFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vDepth;
  ${fogChunk}
  void main() {
    float f = pow(1.0 - abs(dot(normalize(vNormal), vView)), 2.5);
    float a = (0.05 + f * 0.9) * uIntensity * fogFade(vDepth);
    gl_FragColor = vec4(uColor * a, a);
  }
`;

/** Lumière d’aube : dégradé radial sur un grand plan au fond. */
const dawnFragment = /* glsl */ `
  uniform vec3 uWarm;
  uniform vec3 uCool;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - vec2(0.5, 0.18);
    p.x *= 0.55;
    float d = length(p);
    float glow = exp(-d * 4.5);
    vec3 c = mix(uCool, uWarm, smoothstep(0.55, 0.05, d));
    float a = glow * uIntensity;
    gl_FragColor = vec4(c * a, a);
  }
`;

/* ----------------------------------------------------------------- scene -- */

export class WorldScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
  private composer?: EffectComposer;
  private bloom?: UnrealBloomPass;
  private timer = new THREE.Timer();
  private path: THREE.CatmullRomCurve3;
  private threadCurve: THREE.CatmullRomCurve3;
  private threadLengths: number[];

  private dustMat: THREE.ShaderMaterial;
  private threadMat: THREE.ShaderMaterial;
  private strands: { mat: THREE.ShaderMaterial; from: number; to: number }[] = [];
  private crystals: { group: THREE.Group; mats: THREE.Material[]; spin: number }[] = [];
  private milestones: {
    sprite: THREE.Sprite;
    material: THREE.SpriteMaterial;
    s: number;
  }[] = [];
  private glows: {
    sprite: THREE.Sprite;
    zone: [number, number, number, number];
    base: number;
  }[] = [];
  private dawnMat: THREE.ShaderMaterial;

  /** Progression en « sections » : 0 = ouverture, 6 = contact. */
  private target = 0;
  private current = 0;
  private velocity = 0;
  private pointer = new THREE.Vector2();
  private pointerEased = new THREE.Vector2();
  private frame = 0;
  private running = false;
  private visible = true;
  /** Taille du tampon de rendu en pixels, partagée par les shaders du fil. */
  private resolution = { value: new THREE.Vector2(1, 1) };
  private width = 1;
  private height = 1;

  constructor(private options: WorldOptions) {
    const { canvas, light } = options;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !light,
      // Canvas transparent : le fond uni vient de la page, la teinte est donc
      // toujours exacte, avec ou sans post-traitement.
      alpha: true,
      premultipliedAlpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, light ? 1 : 1.5));

    this.path = new THREE.CatmullRomCurve3(
      KEYS.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
      false,
      "centripetal",
    );
    // Le fil court en contrebas, à droite de la trajectoire, pour rester visible
    // sans passer derrière les titres (alignés à gauche ou centrés).
    this.threadCurve = new THREE.CatmullRomCurve3(
      KEYS.map(
        ([x, y, z], i) =>
          new THREE.Vector3(x + 3.6, y - 2.7 + Math.sin(i * 1.7) * 0.5, z - 4),
      ),
      false,
      "centripetal",
    );
    this.threadLengths = this.threadCurve.getLengths(600);

    this.dustMat = this.makeDust(light ? 1800 : 5200);
    this.threadMat = this.makeThread();
    this.makeStrands();
    this.makeCrystals();
    this.makeMilestones();
    this.makeGlows();
    this.dawnMat = this.makeDawn();

    if (!light) {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.45, 0.25);
      this.composer.addPass(this.bloom);
      this.composer.addPass(new OutputPass());
    }
    this.resize();
    // Compiler tous les shaders d’emblée : aucun à-coup en arrivant sur une section.
    this.renderer.compile(this.scene, this.camera);
  }

  /* ------------------------------------------------------------ builders -- */

  private makeDust(count: number) {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const p = new THREE.Vector3();
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      // Répartie dans un tube autour de la trajectoire, un peu au-delà des extrémités.
      const t = rand(i, 1) * 1.08 - 0.02;
      this.path.getPoint(clamp01(t), p);
      if (t > 1) p.z -= (t - 1) * 120;
      if (t < 0) p.z -= t * 120;
      const angle = rand(i, 2) * Math.PI * 2;
      const radius = 3 + Math.pow(rand(i, 3), 0.7) * 26;
      p.x += Math.cos(angle) * radius;
      p.y += Math.sin(angle) * radius * 0.7;
      p.z += (rand(i, 4) - 0.5) * 8;
      positions.set([p.x, p.y, p.z], i * 3);
      sizes[i] = 0.6 + Math.pow(rand(i, 5), 3) * 2.4;
      phases[i] = rand(i, 6);
      // Teinte selon la section traversée : argent, puis sarcelle / ambre, puis aube.
      const s = clamp01(t) * LAST;
      c.copy(SILVER).lerp(BLUE, rand(i, 7) * 0.6);
      const worlds = bell(1.4, 1.8, 2.4, 2.9, s);
      if (worlds > 0) c.lerp(rand(i, 8) > 0.5 ? TEAL : AMBER, worlds * 0.7);
      const dawn = smooth(5.3, 6, s);
      if (dawn > 0) c.lerp(DAWN, dawn * 0.6 * rand(i, 9));
      colors.set([c.r, c.g, c.b], i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    const material = new THREE.ShaderMaterial({
      vertexShader: dustVertex,
      fragmentShader: dustFragment,
      uniforms: { uTime: { value: 0 }, uPixel: { value: 1 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.scene.add(new THREE.Points(geometry, material));
    return material;
  }

  private threadMaterial(color: THREE.Color, intensity: number) {
    return new THREE.ShaderMaterial({
      vertexShader: threadVertex,
      fragmentShader: threadFragment,
      uniforms: {
        uColor: { value: color.clone() },
        uDraw: { value: 0 },
        uTime: { value: 0 },
        uIntensity: { value: intensity },
        uRes: this.resolution,
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }

  private makeThread() {
    const material = this.threadMaterial(SILVER, 0.5);
    const tube = new THREE.TubeGeometry(this.threadCurve, 900, 0.028, 6, false);
    this.scene.add(new THREE.Mesh(tube, material));
    // Halo large et diffus : donne la lueur sur mobile, où le bloom est coupé.
    const halo = this.threadMaterial(BLUE, this.options.light ? 0.22 : 0.08);
    halo.uniforms.uDraw = material.uniforms.uDraw;
    halo.uniforms.uTime = material.uniforms.uTime;
    const haloTube = new THREE.TubeGeometry(this.threadCurve, 450, 0.16, 6, false);
    this.scene.add(new THREE.Mesh(haloTube, halo));
    return material;
  }

  /** Deux univers : le fil se dédouble (sarcelle à gauche, ambre à droite). */
  private makeStrands() {
    const from = 1.55;
    const to = 2.75;
    const a = this.threadCurve.getPoint(from / LAST);
    const b = this.threadCurve.getPoint(to / LAST);
    [
      { side: -1, color: TEAL },
      { side: 1, color: AMBER },
    ].forEach(({ side, color }) => {
      const points = [0, 0.25, 0.5, 0.75, 1].map((k) => {
        const p = a.clone().lerp(b, k);
        const spread = Math.sin(k * Math.PI);
        p.x += side * spread * 7.5 - 2.6 * spread;
        p.y += spread * (side > 0 ? 1.2 : 2.2);
        return p;
      });
      const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
      const mat = this.threadMaterial(color, 0.75);
      this.scene.add(
        new THREE.Mesh(new THREE.TubeGeometry(curve, 300, 0.034, 6, false), mat),
      );
      this.strands.push({ mat, from: from - 0.35, to: to - 0.35 });
    });
  }

  /** Trois offres : trois cristaux de taille croissante, à droite du titre. */
  private makeCrystals() {
    const anchor = this.path.getPoint(3 / LAST);
    const specs = [
      { geo: new THREE.OctahedronGeometry(0.9, 0), at: [7, 6.2, -20], spin: 0.35 },
      { geo: new THREE.IcosahedronGeometry(1.3, 0), at: [11.5, 4.2, -24], spin: -0.25 },
      {
        geo: new THREE.TorusKnotGeometry(0.9, 0.26, 90, 10, 2, 3),
        at: [15, 7.5, -28],
        spin: 0.2,
      },
    ];
    specs.forEach(({ geo, at, spin }, i) => {
      const group = new THREE.Group();
      const shell = new THREE.ShaderMaterial({
        vertexShader: crystalVertex,
        fragmentShader: crystalFragment,
        uniforms: {
          uColor: { value: i === 1 ? SILVER.clone() : BLUE.clone().lerp(SILVER, 0.5) },
          uIntensity: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      group.add(new THREE.Mesh(geo, shell));
      if (i < 2) {
        const edges = new THREE.LineBasicMaterial({
          color: SILVER,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edges));
        this.crystals.push({ group, mats: [shell, edges], spin });
      } else {
        this.crystals.push({ group, mats: [shell], spin });
      }
      group.position.set(anchor.x + at[0], anchor.y + at[1], anchor.z + at[2]);
      group.rotation.set(rand(i, 11) * 3, rand(i, 12) * 3, 0);
      this.scene.add(group);
    });
  }

  /**
   * Démarche : quatre jalons posés sur le fil, un par étape. Chacun s’allume
   * quand la tête du fil l’atteint, puis reste doucement éclairé (étape franchie).
   */
  private makeMilestones() {
    const texture = this.glowTexture();
    [3.85, 4.2, 4.55, 4.9].forEach((s) => {
      const material = new THREE.SpriteMaterial({
        map: texture,
        color: SILVER,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(material);
      sprite.position.copy(this.threadCurve.getPoint(Math.min(1, s / LAST + 0.02)));
      sprite.scale.setScalar(0.4);
      this.scene.add(sprite);
      this.milestones.push({ sprite, material, s });
    });
  }

  private glowTexture() {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const g = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,255,255,0.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /** Nébuleuses : grandes lueurs douces, chacune visible dans sa section. */
  private makeGlows() {
    const texture = this.glowTexture();
    const add = (
      color: THREE.Color,
      s: number,
      offset: [number, number, number],
      scale: number,
      zone: [number, number, number, number],
      base: number,
    ) => {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: texture,
          color,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      const p = this.path.getPoint(s / LAST);
      sprite.position.set(p.x + offset[0], p.y + offset[1], p.z + offset[2]);
      sprite.scale.setScalar(scale);
      this.scene.add(sprite);
      this.glows.push({ sprite, zone, base });
    };
    // Ouverture : un halo bleu lointain, derrière le nuage de particules du hero.
    add(BLUE, 0, [7, 1, -38], 46, [-1, -0.5, 0.6, 1.2], 0.2);
    // Deux univers : une source par brin.
    add(TEAL, 2, [-16, 3, -42], 30, [1.5, 1.9, 2.4, 2.9], 0.14);
    add(AMBER, 2, [16, 0, -42], 30, [1.5, 1.9, 2.4, 2.9], 0.12);
    // Offres : reflet froid derrière les cristaux.
    add(BLUE, 3, [14, 6, -40], 28, [2.6, 2.95, 3.4, 3.9], 0.08);
    // Questions : une lueur calme dans la colonne vide de gauche.
    add(SILVER, 5, [-14, 1, -40], 24, [4.5, 4.9, 5.4, 5.9], 0.035);
  }

  private makeDawn() {
    const material = new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: dawnFragment,
      uniforms: {
        uWarm: { value: DAWN.clone() },
        uCool: { value: BLUE.clone() },
        uIntensity: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const end = this.path.getPoint(1);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(160, 90), material);
    plane.position.set(end.x, end.y + 4, end.z - 60);
    this.scene.add(plane);
    return material;
  }

  /* ------------------------------------------------------------- runtime -- */

  /** Position de scroll exprimée en sections (0 → 6). */
  setTarget(progress: number) {
    this.target = Math.min(LAST, Math.max(0, progress));
  }

  /** Coordonnées normalisées (-1 → 1) du pointeur. */
  setPointer(x: number, y: number) {
    if (this.options.light) return;
    this.pointer.set(x, y);
  }

  /** Faux quand une section opaque couvre tout l’écran : on ne dessine rien. */
  setVisible(visible: boolean) {
    this.visible = visible;
  }

  resize() {
    const canvas = this.options.canvas;
    this.width = canvas.clientWidth || window.innerWidth;
    this.height = canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    // Écran portrait : on recule le champ pour garder les objets dans le cadre.
    this.camera.fov = this.camera.aspect < 1 ? 70 : 55;
    this.camera.updateProjectionMatrix();
    const pr = this.renderer.getPixelRatio();
    this.resolution.value.set(this.width * pr, this.height * pr);
    this.dustMat.uniforms.uPixel.value = pr * Math.min(1.4, this.height / 700);
    if (this.composer && this.bloom) {
      this.composer.setPixelRatio(pr);
      this.composer.setSize(this.width, this.height);
      // Bloom à demi-résolution : même rendu, quatre fois moins de pixels.
      this.bloom.resolution.set(this.width / 2, this.height / 2);
    }
  }

  /** Jump directement à la cible (premier affichage, retour d’onglet). */
  snap() {
    this.current = this.target;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.timer.reset();
    const loop = () => {
      if (!this.running) return;
      this.frame = requestAnimationFrame(loop);
      this.tick();
    };
    this.frame = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.frame);
  }

  private look = new THREE.Vector3();
  private tmp = new THREE.Vector3();

  private tick() {
    this.timer.update();
    const dt = Math.min(this.timer.getDelta(), 0.05);
    const time = this.timer.getElapsed();
    // Lissage exponentiel indépendant du framerate, comme dans Dreamscape.
    const previous = this.current;
    this.current += (this.target - this.current) * (1 - Math.exp(-dt * 3.2));
    this.velocity +=
      ((this.current - previous) / Math.max(dt, 1e-3) - this.velocity) * 0.1;
    if (!this.visible) return;

    const s = this.current;
    const t = s / LAST;

    // Caméra : spline + dérive lente + parallaxe souris.
    this.path.getPoint(t, this.camera.position);
    this.pointerEased.lerp(this.pointer, 1 - Math.exp(-dt * 2.5));
    this.camera.position.x += Math.sin(time * 0.11) * 0.5 + this.pointerEased.x * 1.1;
    this.camera.position.y += Math.cos(time * 0.09) * 0.35 + this.pointerEased.y * 0.7;
    if (t < 0.985) this.path.getPoint(Math.min(1, t + 0.015), this.look);
    else {
      this.path.getTangent(1, this.tmp);
      this.look.copy(this.path.getPoint(1)).addScaledVector(this.tmp, 10);
    }
    // Au contact, le regard se lève vers l’aube.
    this.look.y += smooth(5.2, 6, s) * 2.5;
    this.camera.lookAt(this.look);
    // En vol rapide, le champ s’élargit légèrement (sensation de vitesse).
    const baseFov = this.camera.aspect < 1 ? 70 : 55;
    const fov = baseFov + Math.min(Math.abs(this.velocity) * 4, 9);
    if (Math.abs(fov - this.camera.fov) > 0.05) {
      this.camera.fov += (fov - this.camera.fov) * 0.12;
      this.camera.updateProjectionMatrix();
    }

    // Fil principal : dessiné un peu au-delà de la caméra.
    const lead = clamp01(t + 0.026);
    const index = Math.round(lead * (this.threadLengths.length - 1));
    this.threadMat.uniforms.uDraw.value =
      this.threadLengths[index] / this.threadLengths[this.threadLengths.length - 1];
    this.threadMat.uniforms.uTime.value = time;
    this.dustMat.uniforms.uTime.value = time;

    for (const strand of this.strands) {
      strand.mat.uniforms.uDraw.value = smooth(strand.from, strand.to, s) * 1.02;
      strand.mat.uniforms.uTime.value = time;
    }

    const crystals = bell(2.5, 2.95, 3.45, 3.95, s);
    this.crystals.forEach(({ group, mats, spin }, i) => {
      group.rotation.y += dt * spin;
      group.rotation.x += dt * spin * 0.4;
      group.position.y += Math.sin(time * 0.6 + i * 2) * dt * 0.25;
      const shown = crystals * smooth(2.5 + i * 0.12, 2.95 + i * 0.12, s);
      (mats[0] as THREE.ShaderMaterial).uniforms.uIntensity.value = shown * 0.55;
      if (mats[1]) (mats[1] as THREE.LineBasicMaterial).opacity = shown * 0.3;
    });

    // Jalons : allumage au passage du fil, bref éclat, puis lueur calme
    // jusqu’à la fin de la démarche.
    const approach = 1 - smooth(5.05, 5.5, s);
    for (const m of this.milestones) {
      const reached = smooth(m.s - 0.3, m.s - 0.05, s);
      const flash = Math.exp(-Math.pow((s - m.s + 0.05) * 6, 2));
      m.material.opacity = (reached * 0.3 + flash * 0.35) * approach;
      m.sprite.scale.setScalar(0.4 + flash * 0.25);
    }

    for (const glow of this.glows) {
      const [a, b, c, d] = glow.zone;
      (glow.sprite.material as THREE.SpriteMaterial).opacity =
        bell(a, b, c, d, s) * glow.base * (0.9 + 0.1 * Math.sin(time * 0.5));
    }

    const dawn = smooth(5.2, 6, s);
    this.dawnMat.uniforms.uIntensity.value = dawn * 0.2;

    if (this.composer) this.composer.render(dt);
    else this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.stop();
    this.scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) material.forEach((m) => m.dispose());
      else if (material) {
        (material as THREE.SpriteMaterial).map?.dispose();
        material.dispose();
      }
    });
    this.composer?.dispose();
    this.renderer.dispose();
  }
}

/* ----------------------------------------------------------- DOM wiring -- */

/**
 * Relie la scène à la page : position de scroll → progression en sections,
 * pointeur, redimensionnement, onglet masqué. Renvoie la fonction de nettoyage.
 */
export function mountWorld(
  canvas: HTMLCanvasElement,
  light: boolean,
  onReady: () => void,
) {
  const world = new WorldScene({ canvas, light });
  let tops: { index: number; top: number }[] = [];
  const opaque = document.querySelector<HTMLElement>("#work");

  const measure = () => {
    const y = window.scrollY;
    tops = ANCHORS.flatMap((selector, index) => {
      const el = document.querySelector<HTMLElement>(selector);
      return el ? [{ index, top: el.getBoundingClientRect().top + y }] : [];
    });
    // Le contact est en bas de page : son « arrivée » est le bas du document,
    // pour que la dernière étape (l’aube) se termine exactement en fin de scroll.
    const last = tops[tops.length - 1];
    if (tops.length > 1) {
      const end = document.documentElement.scrollHeight - window.innerHeight * 0.5;
      last.top = Math.max(end, tops[tops.length - 2].top + 1);
    }
  };

  // Le milieu de l’écran sert de repère : une section « commence » quand son
  // haut atteint le centre de la fenêtre.
  const progressAt = (y: number) => {
    if (!tops.length) return 0;
    const line = y + window.innerHeight * 0.5;
    if (line <= tops[0].top) return tops[0].index;
    for (let i = 0; i < tops.length - 1; i++) {
      const a = tops[i];
      const b = tops[i + 1];
      if (line < b.top)
        return a.index + ((line - a.top) / (b.top - a.top)) * (b.index - a.index);
    }
    return tops[tops.length - 1].index;
  };

  const update = () => {
    world.setTarget(progressAt(window.scrollY));
    if (opaque) {
      const r = opaque.getBoundingClientRect();
      world.setVisible(!(r.top <= 0 && r.bottom >= window.innerHeight));
    }
  };

  const onPointer = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    world.setPointer(
      (e.clientX / window.innerWidth) * 2 - 1,
      -((e.clientY / window.innerHeight) * 2 - 1),
    );
  };
  const onResize = () => {
    world.resize();
    measure();
    update();
  };
  const onVisibility = () => {
    if (document.hidden) world.stop();
    else {
      world.snap();
      world.start();
    }
  };

  // La hauteur de la page change (polices, images, pistes de scroll GSAP) :
  // on remesure à chaque variation du document.
  const bodyObserver = new ResizeObserver(() => {
    measure();
    update();
  });
  bodyObserver.observe(document.body);
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", onResize);
  window.addEventListener("pointermove", onPointer, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);

  measure();
  update();
  world.snap();
  world.start();
  requestAnimationFrame(() => onReady());

  return () => {
    bodyObserver.disconnect();
    window.removeEventListener("scroll", update);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("pointermove", onPointer);
    document.removeEventListener("visibilitychange", onVisibility);
    world.destroy();
  };
}
