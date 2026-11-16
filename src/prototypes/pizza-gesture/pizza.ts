import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export type PizzaModel = {
  group: THREE.Group;
  slice: THREE.Group;
  setBite: (index: number) => void;
  dispose: () => void;
};

type Point = { x: number; z: number };
type CheesePatch = Point & { radius: number; phase: number };
const HALF_SLICE = Math.PI / 8;
const CUT_GAP = 0.003;
const DOUGH_TOP = 0.108;
const SAUCE_TOP = 0.133;

/** Les ingrédients ne changent pas de place lors d’un rechargement ou du rewind. */
function randomSequence(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function radialPoint(radius: number, angle: number): Point {
  return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius };
}

function sectorShape(radius: number, angle: number): THREE.Shape {
  const shape = new THREE.Shape();
  const half = HALF_SLICE - CUT_GAP;
  shape.moveTo(0, 0);
  for (let step = 0; step <= 40; step++) {
    const a = angle - half + (step / 40) * half * 2;
    shape.lineTo(Math.cos(a) * radius, -Math.sin(a) * radius);
  }
  shape.closePath();
  return shape;
}

/** Découpe un contour dans un demi-plan, sans photographies ni masque alpha. */
function clipPolygon(polygon: Point[], distance: (point: Point) => number): Point[] {
  const result: Point[] = [];
  for (let index = 0; index < polygon.length; index++) {
    const a = polygon[index];
    const b = polygon[(index + 1) % polygon.length];
    const da = distance(a),
      db = distance(b);
    if (da >= 0) result.push(a);
    if (da >= 0 !== db >= 0) {
      const t = da / (da - db);
      result.push({
        x: THREE.MathUtils.lerp(a.x, b.x, t),
        z: THREE.MathUtils.lerp(a.z, b.z, t),
      });
    }
  }
  return result;
}

function clipToSlice(contour: Point[], angle: number): Point[] {
  const half = HALF_SLICE - CUT_GAP;
  const upper = angle + half,
    lower = angle - half;
  let clipped = clipPolygon(
    contour,
    (p) => Math.sin(upper) * p.x - Math.cos(upper) * p.z,
  );
  clipped = clipPolygon(clipped, (p) => -Math.sin(lower) * p.x + Math.cos(lower) * p.z);
  // La mozzarella reste à l’intérieur de la croûte, même quand elle touche une coupe.
  for (let step = 0; step < 40 && clipped.length > 2; step++) {
    const a = (step / 40) * Math.PI * 2;
    clipped = clipPolygon(clipped, (p) => 1.77 - Math.cos(a) * p.x - Math.sin(a) * p.z);
  }
  return clipped;
}

function planarUV(geometry: THREE.BufferGeometry) {
  const position = geometry.getAttribute("position");
  const uv = new Float32Array(position.count * 2);
  for (let index = 0; index < position.count; index++) {
    uv[index * 2] = 0.5 + position.getX(index) / 4;
    uv[index * 2 + 1] = 0.5 - position.getZ(index) / 4;
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

/** Subdivision initiale seulement : les nappes de fromage gardent un vrai bombé. */
function subdividedShape(shape: THREE.Shape, passes = 2): THREE.BufferGeometry {
  const source = new THREE.ShapeGeometry(shape);
  const attribute = source.getAttribute("position");
  const vertices = Array.from(
    { length: attribute.count },
    (_, i) => new THREE.Vector3(attribute.getX(i), 0, -attribute.getY(i)),
  );
  let indices = Array.from(source.index!.array);
  for (let pass = 0; pass < passes; pass++) {
    const lookup = new Map<string, number>();
    const next: number[] = [];
    function midpoint(a: number, b: number) {
      const key = a < b ? `${a}/${b}` : `${b}/${a}`;
      let index = lookup.get(key);
      if (index === undefined) {
        index = vertices.length;
        vertices.push(vertices[a].clone().add(vertices[b]).multiplyScalar(0.5));
        lookup.set(key, index);
      }
      return index;
    }
    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i],
        b = indices[i + 1],
        c = indices[i + 2];
      const ab = midpoint(a, b),
        bc = midpoint(b, c),
        ca = midpoint(c, a);
      next.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
    }
    indices = next;
  }
  source.dispose();
  const result = new THREE.BufferGeometry();
  result.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      vertices.flatMap((v) => v.toArray()),
      3,
    ),
  );
  result.setIndex(indices);
  return result;
}

/**
 * Pizza intégralement volumique pour la variante B.
 * L’ancienne illustration n’est pas utilisée comme un autocollant : les couches,
 * tomates, mozzarella et feuilles possèdent chacune leur propre géométrie.
 * Deux lots de géométries partagent les matériaux : sept parts fixes et la prise.
 */
export function createPizza(_legacyTexture?: THREE.Texture): PizzaModel {
  const group = new THREE.Group();
  group.name = "Pizza — pâte, sauce, mozzarella et garniture en volume";
  const slice = new THREE.Group();
  slice.name = "Part mobile complète";
  group.add(slice);
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const finalGeometries = new Set<THREE.BufferGeometry>();
  const batches = [
    new Map<THREE.Material, THREE.BufferGeometry[]>(),
    new Map<THREE.Material, THREE.BufferGeometry[]>(),
  ];

  function texture(kind: "crust" | "crumb" | "cheese" | "sauce") {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    const context = canvas.getContext("2d")!;
    const random = randomSequence(
      { crust: 418, crumb: 729, cheese: 961, sauce: 329 }[kind],
    );
    context.fillStyle = {
      crust: "#d5ae76",
      crumb: "#e9cb91",
      cheese: "#ecd7a1",
      sauce: "#9e3827",
    }[kind];
    context.fillRect(0, 0, 512, 512);
    const count = kind === "crumb" ? 550 : kind === "cheese" ? 330 : 430;
    for (let index = 0; index < count; index++) {
      const x = random() * 512,
        y = random() * 512;
      const radius = kind === "crumb" ? 1 + random() * 5 : 2 + random() * 22;
      const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
      const color =
        kind === "crumb"
          ? "#80603970"
          : kind === "sauce"
            ? "#da542855"
            : kind === "cheese"
              ? index % 5
                ? "#fff5d58a"
                : "#bd7a306e"
              : index % 3
                ? "#fff0bb88"
                : "#66341477";
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, color.slice(0, 7) + "00");
      context.fillStyle = gradient;
      context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    if (kind === "crust" || kind === "cheese") {
      for (let index = 0; index < (kind === "crust" ? 240 : 120); index++) {
        const x = random() * 512,
          y = random() * 512;
        context.fillStyle =
          kind === "crust"
            ? index % 4 === 0
              ? "#35251ecc"
              : "#85532a91"
            : index % 3 === 0
              ? "#75401cbd"
              : "#b56a2b8a";
        context.beginPath();
        context.ellipse(
          x,
          y,
          kind === "crust" ? 1 + random() * 5 : 2 + random() * 9,
          kind === "crust" ? 0.6 + random() * 3.4 : 1 + random() * 5,
          random() * Math.PI,
          0,
          Math.PI * 2,
        );
        context.fill();
      }
    }
    // Grain fin de cuisson : variation locale de couleur et de relief, sans image externe.
    const pixels = context.getImageData(0, 0, 512, 512);
    for (let index = 0; index < pixels.data.length; index += 4) {
      const grain = (random() - 0.5) * (kind === "crumb" ? 16 : 10);
      pixels.data[index] += grain;
      pixels.data[index + 1] += grain;
      pixels.data[index + 2] += grain;
    }
    context.putImageData(pixels, 0, 0);
    const result = new THREE.CanvasTexture(canvas);
    result.colorSpace = THREE.SRGBColorSpace;
    result.wrapS = result.wrapT = THREE.RepeatWrapping;
    textures.add(result);
    return result;
  }
  function standard(options: THREE.MeshStandardMaterialParameters) {
    const material = new THREE.MeshStandardMaterial(options);
    materials.add(material);
    return material;
  }
  const crustMap = texture("crust"),
    crumbMap = texture("crumb"),
    cheeseMap = texture("cheese"),
    sauceMap = texture("sauce");
  const dough = standard({
    map: crumbMap,
    color: "#fff4d7",
    roughness: 0.94,
    bumpMap: crumbMap,
    bumpScale: 0.006,
    vertexColors: true,
  });
  const crust = standard({
    map: crustMap,
    color: "#fff9e9",
    roughness: 0.86,
    bumpMap: crustMap,
    bumpScale: 0.013,
    vertexColors: true,
  });
  const sauce = standard({
    color: "#fff2d9",
    map: sauceMap,
    roughness: 0.72,
    bumpMap: sauceMap,
    bumpScale: 0.004,
  });
  const cheese = standard({
    color: "#fff9e5",
    map: cheeseMap,
    roughness: 0.55,
    bumpMap: cheeseMap,
    bumpScale: 0.012,
    vertexColors: true,
  });
  const blister = standard({ color: "#c49248", roughness: 0.65, map: cheeseMap });
  const tomatoSkin = standard({ color: "#b43121", roughness: 0.34, metalness: 0 });
  const tomatoPulp = standard({ color: "#df6540", roughness: 0.48 });
  const tomatoGel = standard({ color: "#a94423", roughness: 0.23 });
  const seed = standard({ color: "#d6bb79", roughness: 0.48 });
  const basil = standard({
    color: "#ffffff",
    roughness: 0.7,
    side: THREE.DoubleSide,
    vertexColors: true,
  });
  const vein = standard({ color: "#80a24b", roughness: 0.78 });

  /** Normaliser les attributs permet de fusionner les ingrédients d’un même matériau. */
  function add(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    mobile: boolean,
  ) {
    const flat = geometry.index ? geometry.toNonIndexed() : geometry;
    if (flat !== geometry) geometry.dispose();
    const count = flat.getAttribute("position").count;
    if (!flat.getAttribute("normal")) flat.computeVertexNormals();
    if (!flat.getAttribute("uv"))
      flat.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(count * 2), 2));
    if (!flat.getAttribute("color"))
      flat.setAttribute(
        "color",
        new THREE.BufferAttribute(new Float32Array(count * 3).fill(1), 3),
      );
    const map = batches[mobile ? 1 : 0];
    const bucket = map.get(material) ?? [];
    bucket.push(flat);
    map.set(material, bucket);
  }
  function extrude(shape: THREE.Shape, thickness: number, bottom: number, bevel = 0.003) {
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: bevel > 0,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 2,
      steps: 1,
      curveSegments: 16,
    });
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, bottom, 0);
    return geometry;
  }

  const random = randomSequence(9201);
  const patches: CheesePatch[] = [];
  for (let index = 0; index < 28; index++) {
    const angle = index * 2.399963 + (random() - 0.5) * 0.3;
    const radius = 0.27 + Math.sqrt((index + 1) / 29) * 1.12;
    patches.push({
      ...radialPoint(radius, angle),
      radius: 0.25 + random() * 0.16,
      phase: random() * Math.PI * 2,
    });
  }
  // Une nappe supplémentaire traverse la part soulevée : sa tranche montre
  // bien le fromage au-dessus de la sauce, et non un bloc de mie uniforme.
  patches.push({ x: 0.85, z: 0.02, radius: 0.43, phase: 0.8 });
  patches.push({ x: -0.05, z: 0.03, radius: 0.45, phase: 2.1 });

  function cheeseHeight(patch: CheesePatch, x: number, z: number) {
    const a = Math.atan2(z - patch.z, x - patch.x);
    const outline =
      patch.radius *
      (1 + Math.sin(a * 3 + patch.phase) * 0.1 + Math.sin(a * 5 - patch.phase) * 0.055);
    const distance = Math.hypot(x - patch.x, z - patch.z) / outline;
    const dome = Math.max(0, 1 - distance * distance);
    return (
      0.136 +
      dome * 0.058 +
      Math.sin(x * 26 + z * 9) * Math.sin(z * 31 - x * 7) * dome * 0.009
    );
  }
  function cheesePatch(contour: Point[], patch: CheesePatch, mobile: boolean) {
    if (contour.length < 3) return;
    const shape = new THREE.Shape(contour.map((p) => new THREE.Vector2(p.x, -p.z)));
    const geometry = subdividedShape(shape);
    const position = geometry.getAttribute("position");
    for (let index = 0; index < position.count; index++) {
      position.setY(
        index,
        cheeseHeight(patch, position.getX(index), position.getZ(index)),
      );
    }
    const colors: number[] = [];
    for (let vertex = 0; vertex < position.count; vertex++) {
      const irregularity = Math.sin(
        position.getX(vertex) * 31 + position.getZ(vertex) * 37,
      );
      const color = new THREE.Color("#fff9de").lerp(
        new THREE.Color("#d8ac65"),
        Math.max(0, irregularity) * 0.14,
      );
      colors.push(color.r, color.g, color.b);
    }
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    planarUV(geometry);
    geometry.computeVertexNormals();
    add(geometry, cheese, mobile);
    // Le bord fermé fait apparaître une vraie épaisseur fondue dans la coupe.
    const sides: number[] = [];
    for (let index = 0; index < contour.length; index++) {
      const a = contour[index],
        b = contour[(index + 1) % contour.length];
      const ay = cheeseHeight(patch, a.x, a.z),
        by = cheeseHeight(patch, b.x, b.z);
      sides.push(
        a.x,
        0.133,
        a.z,
        a.x,
        ay,
        a.z,
        b.x,
        0.133,
        b.z,
        b.x,
        0.133,
        b.z,
        a.x,
        ay,
        a.z,
        b.x,
        by,
        b.z,
      );
    }
    const sideGeometry = new THREE.BufferGeometry();
    sideGeometry.setAttribute("position", new THREE.Float32BufferAttribute(sides, 3));
    planarUV(sideGeometry);
    sideGeometry.computeVertexNormals();
    add(sideGeometry, cheese, mobile);
  }

  for (let index = 0; index < 8; index++) {
    const angle = (index * Math.PI) / 4;
    const mobile = index === 0;
    const body = extrude(sectorShape(1.985, angle), DOUGH_TOP - 0.012, 0.012, 0.004);
    const positions = body.getAttribute("position");
    const colors: number[] = [];
    const normals = body.getAttribute("normal");
    const uv = body.getAttribute("uv");
    for (let vertex = 0; vertex < positions.count; vertex++) {
      const x = positions.getX(vertex),
        z = positions.getZ(vertex),
        originalY = positions.getY(vertex);
      const radius = Math.hypot(x, z);
      const y =
        originalY > 0
          ? originalY * (1 - THREE.MathUtils.smoothstep(radius, 1.7, 1.985) * 0.58)
          : originalY;
      positions.setY(vertex, y);
      uv.setXY(vertex, (x + z) * 1.6, y * 7);
      const outside = radius
        ? Math.max(0, (x * normals.getX(vertex) + z * normals.getZ(vertex)) / radius)
        : 0;
      const toasted = Math.max(
        1 - THREE.MathUtils.smoothstep(y, 0.018, 0.045),
        outside * THREE.MathUtils.smoothstep(radius, 1.75, 1.96),
      );
      const color = new THREE.Color("#fff6de").lerp(
        new THREE.Color("#b37b43"),
        toasted * 0.8,
      );
      colors.push(color.r, color.g, color.b);
    }
    body.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    body.computeVertexNormals();
    add(body, dough, mobile);

    const sauceBody = extrude(
      sectorShape(1.8, angle),
      SAUCE_TOP - DOUGH_TOP,
      DOUGH_TOP + 0.002,
      0.002,
    );
    planarUV(sauceBody);
    add(sauceBody, sauce, mobile);
    // La pulpe cuite garde un léger relief : la sauce n’est pas un aplat rouge.
    const sauceSurface = subdividedShape(sectorShape(1.79, angle), 2);
    const saucePositions = sauceSurface.getAttribute("position");
    for (let vertex = 0; vertex < saucePositions.count; vertex++) {
      const x = saucePositions.getX(vertex),
        z = saucePositions.getZ(vertex);
      const pulp = Math.sin(x * 37 + Math.sin(z * 19)) * Math.cos(z * 41 - x * 11);
      saucePositions.setY(vertex, SAUCE_TOP + 0.004 + pulp * 0.006);
    }
    planarUV(sauceSurface);
    sauceSurface.computeVertexNormals();
    add(sauceSurface, sauce, mobile);

    // Profil de cornicione irrégulier, fermé sur ses deux coupes.
    const segments = 36,
      radial = 12;
    const crustPositions: number[] = [],
      crustColors: number[] = [],
      crustUV: number[] = [],
      crustIndices: number[] = [];
    for (let step = 0; step <= segments; step++) {
      const t = step / segments;
      const a = angle - HALF_SLICE + 0.004 + t * (Math.PI / 4 - 0.008);
      const ripple = Math.sin(a * 13 + 1.2) * 0.008 + Math.sin(a * 29) * 0.005;
      const centerRadius = 1.86 + Math.sin(a * 9) * 0.008;
      const width = 0.165 + Math.sin(a * 17 + 0.2) * 0.014;
      const height = 0.124 + Math.sin(a * 11) * 0.008;
      for (let side = 0; side <= radial; side++) {
        const theta = (side / radial) * Math.PI * 2;
        const swelling = 1 + Math.sin(a * 37 + theta * 2) * 0.035;
        const radius = centerRadius + Math.cos(theta) * width * swelling;
        crustPositions.push(
          Math.cos(a) * radius,
          0.145 + Math.sin(theta) * height * swelling + ripple,
          Math.sin(a) * radius,
        );
        crustUV.push((a / (Math.PI * 2)) * 3, theta / (Math.PI * 2));
        const baked = THREE.MathUtils.clamp(
          0.45 + Math.sin(theta) * 0.25 + Math.sin(a * 23 + theta) * 0.09,
          0,
          1,
        );
        const color = new THREE.Color("#fff5d8").lerp(new THREE.Color("#ddbc88"), baked);
        crustColors.push(color.r, color.g, color.b);
      }
    }
    for (let step = 0; step < segments; step++)
      for (let side = 0; side < radial; side++) {
        const a = step * (radial + 1) + side,
          b = a + radial + 1;
        crustIndices.push(a, a + 1, b, b, a + 1, b + 1);
      }
    const crustSurface = new THREE.BufferGeometry();
    crustSurface.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(crustPositions, 3),
    );
    crustSurface.setAttribute("color", new THREE.Float32BufferAttribute(crustColors, 3));
    crustSurface.setAttribute("uv", new THREE.Float32BufferAttribute(crustUV, 2));
    crustSurface.setIndex(crustIndices);
    crustSurface.computeVertexNormals();
    add(crustSurface, crust, mobile);
    // Les extrémités sont de vraies sections de mie, pas des trous dans la croûte.
    for (const end of [0, segments]) {
      const center = new THREE.Vector3();
      for (let side = 0; side < radial; side++)
        center.add(
          new THREE.Vector3(
            ...(crustPositions.slice(
              (end * (radial + 1) + side) * 3,
              (end * (radial + 1) + side) * 3 + 3,
            ) as [number, number, number]),
          ),
        );
      center.divideScalar(radial);
      const cap: number[] = [];
      for (let side = 0; side < radial; side++) {
        const a = (end * (radial + 1) + side) * 3,
          b = a + 3;
        const first = crustPositions.slice(a, a + 3),
          second = crustPositions.slice(b, b + 3);
        cap.push(
          ...center.toArray(),
          ...(end === 0 ? second : first),
          ...(end === 0 ? first : second),
        );
      }
      const capGeometry = new THREE.BufferGeometry();
      capGeometry.setAttribute("position", new THREE.Float32BufferAttribute(cap, 3));
      const capPositions = capGeometry.getAttribute("position");
      const capUV: number[] = [];
      for (let vertex = 0; vertex < capPositions.count; vertex++) {
        capUV.push(
          Math.hypot(capPositions.getX(vertex), capPositions.getZ(vertex)) * 3,
          capPositions.getY(vertex) * 4,
        );
      }
      capGeometry.setAttribute("uv", new THREE.Float32BufferAttribute(capUV, 2));
      capGeometry.computeVertexNormals();
      add(capGeometry, dough, mobile);
    }

    for (const patch of patches) {
      const contour = Array.from({ length: 28 }, (_, step) => {
        const a = (step / 28) * Math.PI * 2;
        const radius =
          patch.radius *
          (1 +
            Math.sin(a * 3 + patch.phase) * 0.1 +
            Math.sin(a * 5 - patch.phase) * 0.055);
        return { x: patch.x + Math.cos(a) * radius, z: patch.z + Math.sin(a) * radius };
      });
      cheesePatch(clipToSlice(contour, angle), patch, mobile);
    }

    // Les petites cloques brunies sont des volumes, posés sur le fromage.
    // On écarte les coupes pour que rien ne flotte dans l’espace de la part retirée.
    for (let spot = 0; spot < 9; spot++) {
      const point = radialPoint(0.4 + random() * 1.13, angle + (random() - 0.5) * 0.48);
      const patch = patches.find(
        (p) => Math.hypot(point.x - p.x, point.z - p.z) < p.radius * 0.65,
      );
      if (!patch) continue;
      const bubble = new THREE.SphereGeometry(0.018 + random() * 0.024, 10, 6);
      bubble.scale(1, 0.16, 0.7 + random() * 0.5);
      bubble.translate(point.x, cheeseHeight(patch, point.x, point.z) - 0.001, point.z);
      add(bubble, blister, mobile);
    }

    // La répartition asymétrique évite de répéter huit fois le même motif.
    // Les demi-tomates reposent sur le fromage, avec peau, chair, gel et graines.
    const tomatoCount = [1, 0, 2, 1, 1, 0, 1, 2][index];
    for (let tomatoIndex = 0; tomatoIndex < tomatoCount; tomatoIndex++) {
      const tomatoRadius = 0.18 + random() * 0.035;
      const tomatoPoint = radialPoint(
        0.77 + tomatoIndex * 0.45 + random() * 0.23,
        angle + (random() - 0.5) * 0.18,
      );
      const tomatoTilt = new THREE.Euler(
        (random() - 0.5) * 0.65,
        random() * Math.PI * 2,
        (random() - 0.5) * 0.65,
      );
      const tomatoMatrix = new THREE.Matrix4().compose(
        new THREE.Vector3(tomatoPoint.x, 0.262, tomatoPoint.z),
        new THREE.Quaternion().setFromEuler(tomatoTilt),
        new THREE.Vector3(1, 1, 1),
      );
      function tomatoPart(geometry: THREE.BufferGeometry, material: THREE.Material) {
        geometry.applyMatrix4(tomatoMatrix);
        add(geometry, material, mobile);
      }
      const skinGeometry = new THREE.SphereGeometry(
        tomatoRadius,
        20,
        10,
        0,
        Math.PI * 2,
        Math.PI / 2,
        Math.PI / 2,
      );
      skinGeometry.scale(1, 0.58, 0.87);
      tomatoPart(skinGeometry, tomatoSkin);
      const flesh = new THREE.CircleGeometry(tomatoRadius * 0.96, 24);
      flesh.rotateX(-Math.PI / 2);
      flesh.scale(1, 0.87, 1);
      flesh.translate(0, 0.001, 0);
      tomatoPart(flesh, tomatoPulp);
      for (const chamber of [-1, 1]) {
        const gel = new THREE.SphereGeometry(1, 14, 8);
        gel.scale(tomatoRadius * 0.34, 0.009, tomatoRadius * 0.57);
        gel.translate(chamber * tomatoRadius * 0.39, 0.004, 0);
        tomatoPart(gel, tomatoGel);
        for (let n = 0; n < 4; n++) {
          const seedShape = new THREE.SphereGeometry(1, 8, 5);
          const z = (n - 1.5) * tomatoRadius * 0.24;
          seedShape.scale(0.009, 0.004, 0.014);
          seedShape.rotateY((random() - 0.5) * 0.5);
          seedShape.translate(
            chamber * tomatoRadius * (0.31 + random() * 0.13),
            0.014,
            z + (random() - 0.5) * 0.014,
          );
          tomatoPart(seedShape, seed);
        }
      }
    }

    // Feuilles en surface courbe, avec une nervure centrale géométrique.
    for (let leafIndex = 0; leafIndex < (index % 3 === 0 ? 2 : 1); leafIndex++) {
      const leafPoint = radialPoint(
        0.78 + leafIndex * 0.38 + random() * 0.13,
        angle + (random() - 0.5) * 0.12,
      );
      const leafBase =
        Math.max(
          0.17,
          ...patches
            .filter((p) => Math.hypot(leafPoint.x - p.x, leafPoint.z - p.z) < p.radius)
            .map((p) => cheeseHeight(p, leafPoint.x, leafPoint.z)),
        ) + 0.006;
      const length = 0.34 + random() * 0.09;
      const width = 0.19 + random() * 0.045;
      const direction = angle + (random() - 0.5) * 2;
      const points: number[] = [],
        leafColors: number[] = [],
        leafIndices: number[] = [];
      const lengthSteps = 14,
        widthSteps = 6;
      function leafPosition(t: number, v: number) {
        const x = (t - 0.5) * length;
        const z =
          (Math.sin(t * Math.PI) ** 0.72 * v * width * (1 + Math.sin(t * 32) * 0.035)) /
          2;
        const y =
          leafBase +
          Math.sin(t * Math.PI) * 0.025 +
          Math.abs(v) ** 1.6 * 0.012 +
          t * 0.008;
        return new THREE.Vector3(
          leafPoint.x + Math.cos(direction) * x - Math.sin(direction) * z,
          y,
          leafPoint.z + Math.sin(direction) * x + Math.cos(direction) * z,
        );
      }
      for (let along = 0; along <= lengthSteps; along++)
        for (let across = 0; across <= widthSteps; across++) {
          const t = along / lengthSteps,
            v = (across / widthSteps) * 2 - 1;
          points.push(...leafPosition(t, v).toArray());
          const color = new THREE.Color("#366b2e").lerp(
            new THREE.Color("#74a147"),
            (1 - Math.abs(v)) * 0.14 + t * 0.05,
          );
          leafColors.push(color.r, color.g, color.b);
        }
      for (let along = 0; along < lengthSteps; along++)
        for (let across = 0; across < widthSteps; across++) {
          const a = along * (widthSteps + 1) + across,
            b = a + widthSteps + 1;
          leafIndices.push(a, a + 1, b, b, a + 1, b + 1);
        }
      const leaf = new THREE.BufferGeometry();
      leaf.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
      leaf.setAttribute("color", new THREE.Float32BufferAttribute(leafColors, 3));
      leaf.setIndex(leafIndices);
      leaf.computeVertexNormals();
      add(leaf, basil, mobile);
      const spine = new THREE.CatmullRomCurve3(
        Array.from({ length: 9 }, (_, n) =>
          leafPosition(n / 8, 0).add(new THREE.Vector3(0, 0.003, 0)),
        ),
      );
      add(new THREE.TubeGeometry(spine, 12, 0.003, 5, false), vein, mobile);
      for (const t of [0.27, 0.43, 0.6, 0.75]) {
        for (const side of [-1, 1]) {
          const branch = new THREE.CatmullRomCurve3([
            leafPosition(t, 0).add(new THREE.Vector3(0, 0.002, 0)),
            leafPosition(t + 0.06, side * 0.45).add(new THREE.Vector3(0, 0.002, 0)),
            leafPosition(Math.min(0.95, t + 0.12), side * 0.85).add(
              new THREE.Vector3(0, 0.002, 0),
            ),
          ]);
          add(new THREE.TubeGeometry(branch, 4, 0.001, 3, false), vein, mobile);
        }
      }
    }
  }

  for (const [index, map] of batches.entries()) {
    const parent = index === 1 ? slice : group;
    for (const [material, parts] of map) {
      const merged = mergeGeometries(parts, false);
      parts.forEach((part) => part.dispose());
      if (!merged) throw new Error("Impossible d’assembler les ingrédients de la pizza.");
      finalGeometries.add(merged);
      const mesh = new THREE.Mesh(merged, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
    }
  }
  let currentBite = 0;
  return {
    group,
    slice,
    setBite(index: number) {
      const next = index >= 5 ? 5 : 0;
      if (next === currentBite) return;
      currentBite = next;
      slice.visible = next === 0;
      slice.userData.bite = next;
    },
    dispose() {
      finalGeometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      textures.forEach((item) => item.dispose());
    },
  };
}
