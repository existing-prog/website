import * as THREE from "three";

/** Contrat de la scène : le sol est XZ, Y est vertical et la part vise +X. */
export type PizzaModel = {
  group: THREE.Group;
  slice: THREE.Group;
  setBite: (index: number) => void;
  dispose: () => void;
};

const RADIUS = 2;
const HALF_SLICE = Math.PI / 8;
const SLICE_GAP = 0.006;
const THICKNESS = 0.17;
const BEVEL_HEIGHT = 0.014;
// La garniture doit dépasser le capuchon de mie, même sur ses bords sans relief.
const TOP_HEIGHT = THICKNESS + BEVEL_HEIGHT + 0.004;

/** Petit générateur stable : les matières gardent le même grain au rechargement. */
function seededRandom(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function canvasTexture(canvas: HTMLCanvasElement) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/** Dorure de surface : taches fondues et petites cloques plutôt que rayures. */
function bakedTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext("2d")!;
  const random = seededRandom(418);
  context.fillStyle = "#d9a466";
  context.fillRect(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < 440; index++) {
    const x = random() * canvas.width;
    const y = random() * canvas.height;
    const radius = 2 + random() * 24;
    const toasted = random() > 0.43;
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, toasted ? "#713b1655" : "#fff0bd99");
    gradient.addColorStop(1, toasted ? "#713b1600" : "#fff0bd00");
    context.fillStyle = gradient;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  // De rares marques plus foncées donnent l’aspect d’une cuisson au four.
  for (let index = 0; index < 110; index++) {
    context.beginPath();
    context.ellipse(
      random() * canvas.width,
      random() * canvas.height,
      0.6 + random() * 2.2,
      0.4 + random() * 1.5,
      random() * Math.PI,
      0,
      Math.PI * 2,
    );
    context.fillStyle = random() > 0.6 ? "#522c1b99" : "#9b652c88";
    context.fill();
  }
  return canvasTexture(canvas);
}

/** La tranche de mie reste pâle, avec de petites alvéoles irrégulières. */
function crumbTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext("2d")!;
  const random = seededRandom(720);
  context.fillStyle = "#f5dfb4";
  context.fillRect(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < 230; index++) {
    const x = random() * canvas.width;
    const y = random() * canvas.height;
    const width = 1 + random() * 9;
    const height = 0.8 + random() * 5;
    context.save();
    context.translate(x, y);
    context.rotate((random() - 0.5) * 0.7);
    context.scale(width, height);
    const gradient = context.createRadialGradient(0, 0, 0, 0, 0, 1);
    gradient.addColorStop(0, "#97704266");
    gradient.addColorStop(0.65, "#b48a5155");
    gradient.addColorStop(1, "#e0bd8500");
    context.fillStyle = gradient;
    context.fillRect(-1, -1, 2, 2);
    context.restore();
  }
  return canvasTexture(canvas);
}

/**
 * Les triangles sont subdivisés une fois à la création, puis partagés entre
 * sommets voisins. Le relief garde ainsi des normales douces et aucun trou.
 */
function toppingGeometry(shape: THREE.Shape): THREE.BufferGeometry {
  const flat = new THREE.ShapeGeometry(shape, 20);
  const positions = flat.getAttribute("position");
  const vertices = Array.from(
    { length: positions.count },
    (_, index) => new THREE.Vector3(positions.getX(index), 0, -positions.getY(index)),
  );
  let indices = Array.from(flat.index!.array);
  for (let pass = 0; pass < 3; pass++) {
    const midpoints = new Map<string, number>();
    const next: number[] = [];
    function midpoint(a: number, b: number) {
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      const saved = midpoints.get(key);
      if (saved !== undefined) return saved;
      const index = vertices.length;
      vertices.push(vertices[a].clone().add(vertices[b]).multiplyScalar(0.5));
      midpoints.set(key, index);
      return index;
    }
    for (let triangle = 0; triangle < indices.length; triangle += 3) {
      const [a, b, c] = indices.slice(triangle, triangle + 3);
      const ab = midpoint(a, b);
      const bc = midpoint(b, c);
      const ca = midpoint(c, a);
      next.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
    }
    indices = next;
  }
  flat.dispose();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      vertices.flatMap((vertex) => vertex.toArray()),
      3,
    ),
  );
  geometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute(new Float32Array(vertices.length * 2), 2),
  );
  geometry.setIndex(indices);
  return geometry;
}

/** Lire l’image déjà chargée permet de placer le relief sur sa vraie garniture. */
function imagePixels(texture: THREE.Texture): ImageData | undefined {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const context = canvas.getContext("2d")!;
    context.drawImage(texture.image as CanvasImageSource, 0, 0, 256, 256);
    return context.getImageData(0, 0, 256, 256);
  } catch {
    // Un autre type de texture peut être fourni : le relief de pâte suffit alors.
    return undefined;
  }
}

function edgeDistance(x: number, z: number, contour: THREE.Vector2[]) {
  let nearest = Infinity;
  for (let index = 0; index < contour.length; index++) {
    const a = contour[index];
    const b = contour[(index + 1) % contour.length];
    const dx = b.x - a.x;
    const dz = -b.y + a.y;
    const length = dx * dx + dz * dz;
    const t = length
      ? THREE.MathUtils.clamp(((x - a.x) * dx + (z + a.y) * dz) / length, 0, 1)
      : 0;
    nearest = Math.min(nearest, Math.hypot(x - a.x - dx * t, z + a.y - dz * t));
  }
  return nearest;
}

/**
 * Une croûte fermée à profil variable évite l’aspect de tuyau uniforme.
 * Les deux sections coupées utilisent la matière de mie, pas la dorure extérieure.
 */
function crustGeometry(angle: number): THREE.BufferGeometry {
  const segments = 48;
  const ringSegments = 12;
  const positions: number[] = [];
  const uv: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const pale = new THREE.Color("#fff2d5");
  const golden = new THREE.Color("#d39a59");
  for (let step = 0; step <= segments; step++) {
    const t = step / segments;
    const a = angle + THREE.MathUtils.lerp(-HALF_SLICE + 0.014, HALF_SLICE - 0.014, t);
    const wave = Math.sin(a * 17 + 0.8) * 0.5 + Math.sin(a * 29 - 0.4) * 0.5;
    const radius = 1.891 + Math.sin(a * 13) * 0.007;
    const width = 0.112 + wave * 0.009;
    const height = 0.103 + Math.sin(a * 11 + 0.7) * 0.009;
    const centerHeight = 0.158 + Math.sin(a * 9) * 0.006;
    for (let ring = 0; ring <= ringSegments; ring++) {
      const v = ring / ringSegments;
      const section = v * Math.PI * 2;
      const uneven = 1 + Math.sin(a * 37 + section * 3) * 0.025;
      const r = radius + Math.cos(section) * width * uneven;
      positions.push(
        Math.cos(a) * r,
        centerHeight + Math.sin(section) * height * uneven,
        Math.sin(a) * r,
      );
      uv.push(t + angle / (Math.PI / 4), v);
      // Le dessous est plus pâle et le sommet porte une dorure douce.
      const baked = THREE.MathUtils.clamp(
        0.45 + Math.sin(section) * 0.3 + wave * 0.08,
        0,
        1,
      );
      const color = pale.clone().lerp(golden, baked);
      colors.push(color.r, color.g, color.b);
    }
  }
  for (let step = 0; step < segments; step++) {
    for (let ring = 0; ring < ringSegments; ring++) {
      const a = step * (ringSegments + 1) + ring;
      const b = a + ringSegments + 1;
      indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const sideCount = indices.length;
  for (const [step, reversed] of [
    [0, true],
    [segments, false],
  ] as const) {
    const first = step * (ringSegments + 1);
    const centerIndex = positions.length / 3;
    let centerX = 0,
      centerY = 0,
      centerZ = 0;
    for (let ring = 0; ring < ringSegments; ring++) {
      centerX += positions[(first + ring) * 3];
      centerY += positions[(first + ring) * 3 + 1];
      centerZ += positions[(first + ring) * 3 + 2];
    }
    positions.push(
      centerX / ringSegments,
      centerY / ringSegments,
      centerZ / ringSegments,
    );
    colors.push(1, 1, 1);
    uv.push(0.5, 0.5);
    for (let ring = 0; ring <= ringSegments; ring++) {
      const index = (first + ring) * 3;
      positions.push(positions[index], positions[index + 1], positions[index + 2]);
      colors.push(1, 1, 1);
      uv.push(
        (Math.cos((ring / ringSegments) * Math.PI * 2) + 1) / 2,
        (Math.sin((ring / ringSegments) * Math.PI * 2) + 1) / 2,
      );
      if (ring < ringSegments) {
        const a = centerIndex + 1 + ring;
        if (reversed) indices.push(centerIndex, a + 1, a);
        else indices.push(centerIndex, a, a + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.addGroup(0, sideCount, 0);
  geometry.addGroup(sideCount, indices.length - sideCount, 1);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Les bouchées sont des contours réels, pas une transparence : le bord de mie
 * reste visible quand la caméra passe de la vue du dessus à la vue de côté.
 * Chaque contour conserve la croûte et retire progressivement la pointe.
 */
function sliceShape(bite: number): THREE.Shape {
  const half = HALF_SLICE - SLICE_GAP;
  const cuts = [0, 0.43, 0.83, 1.2, 1.65];
  const cut = cuts[bite];
  const shape = new THREE.Shape();
  // Shape travaille en XY ; le deuxième axe est inversé avant rotation vers XZ.
  const lowerZ = -cut * Math.tan(half);
  shape.moveTo(cut, -lowerZ);
  shape.lineTo(RADIUS * Math.cos(-half), -RADIUS * Math.sin(-half));
  for (let step = 1; step <= 32; step++) {
    const angle = -half + (half * 2 * step) / 32;
    shape.lineTo(RADIUS * Math.cos(angle), -RADIUS * Math.sin(angle));
  }
  const upperZ = cut * Math.tan(half);
  shape.lineTo(cut, -upperZ);
  if (bite > 0) {
    const depth = [0, 0.12, 0.18, 0.2, 0.12][bite];
    for (let step = 1; step < 30; step++) {
      const t = step / 30;
      const z = THREE.MathUtils.lerp(upperZ, lowerZ, t);
      // Trois lobes arrondis rappellent une morsure sans dessiner de dents.
      const scallop = 0.45 + 0.55 * Math.abs(Math.sin(t * Math.PI * 3));
      const x = cut + depth * Math.sin(t * Math.PI) * scallop;
      shape.lineTo(x, -z);
    }
  }
  shape.closePath();
  return shape;
}

export function createPizza(texture: THREE.Texture): PizzaModel {
  const group = new THREE.Group();
  group.name = "Pizza — sept parts fixes et une part mobile";
  const slice = new THREE.Group();
  slice.name = "Part saisie — pivot au centre de la pizza";
  group.add(slice);

  const bread = bakedTexture();
  const crumb = crumbTexture();
  const pixels = imagePixels(texture);
  const sideMaterial = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    map: crumb,
    bumpMap: crumb,
    bumpScale: 0.006,
    vertexColors: true,
    roughness: 0.97,
  });
  const crustMaterial = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    map: bread,
    bumpMap: bread,
    bumpScale: 0.009,
    vertexColors: true,
    roughness: 0.86,
  });
  const topMaterial = new THREE.MeshPhysicalMaterial({
    map: texture,
    bumpMap: texture,
    bumpScale: 0.012,
    roughness: 0.72,
    clearcoat: 0.12,
    clearcoatRoughness: 0.8,
    // L’alpha découpe seulement le bord photographié ; aucune bouchée n’en dépend.
    alphaTest: 0.15,
    side: THREE.FrontSide,
  });

  const geometries = new Set<THREE.BufferGeometry>();
  function remember<T extends THREE.BufferGeometry>(geometry: T): T {
    geometries.add(geometry);
    return geometry;
  }

  function makeSlice(angle: number, bite = 0): THREE.Group {
    const result = new THREE.Group();
    const shape = sliceShape(bite);
    const bodyGeometry = remember(
      new THREE.ExtrudeGeometry(shape, {
        depth: THICKNESS,
        bevelEnabled: true,
        bevelThickness: BEVEL_HEIGHT,
        // Une découpe de pizza n’a pas de rebord : le biseau reste presque nul.
        bevelSize: 0.002,
        bevelSegments: 2,
        steps: 1,
        curveSegments: 20,
      }),
    );
    bodyGeometry.rotateX(-Math.PI / 2);
    const bodyPosition = bodyGeometry.getAttribute("position");
    const bodyUV = bodyGeometry.getAttribute("uv");
    const bodyNormal = bodyGeometry.getAttribute("normal");
    const bodyColors: number[] = [];
    const baseColor = new THREE.Color("#c89b67");
    const freshColor = new THREE.Color("#ffffff");
    const toastedColor = new THREE.Color("#c79760");
    for (let vertex = 0; vertex < bodyPosition.count; vertex++) {
      const originalY = bodyPosition.getY(vertex);
      const radius = Math.hypot(bodyPosition.getX(vertex), bodyPosition.getZ(vertex));
      // La pâte s’amincit sous la croûte arrondie : aucun rebord vertical ne
      // dépasse à l’extérieur, même quand la caméra descend au niveau de la part.
      const edgeTaper = THREE.MathUtils.smoothstep(radius, 1.79, RADIUS);
      const y = originalY > 0 ? originalY * (1 - edgeTaper * 0.35) : originalY;
      bodyPosition.setY(vertex, y);
      bodyUV.setXY(
        vertex,
        (bodyPosition.getX(vertex) + bodyPosition.getZ(vertex)) * 1.1,
        y / THICKNESS,
      );
      const color = baseColor
        .clone()
        .lerp(freshColor, THREE.MathUtils.smoothstep(y, 0, 0.055));
      // La périphérie est cuite ; seules les véritables faces coupées montrent
      // la mie pâle. Le produit scalaire distingue le bord extérieur des coupes.
      const x = bodyPosition.getX(vertex);
      const z = bodyPosition.getZ(vertex);
      const outward =
        radius > 0
          ? (x * bodyNormal.getX(vertex) + z * bodyNormal.getZ(vertex)) / radius
          : 0;
      const toasted =
        THREE.MathUtils.smoothstep(radius, 1.72, 1.92) *
        THREE.MathUtils.smoothstep(outward, 0.5, 0.85);
      color.lerp(toastedColor, toasted);
      bodyColors.push(color.r, color.g, color.b);
    }
    bodyGeometry.setAttribute("color", new THREE.Float32BufferAttribute(bodyColors, 3));
    bodyGeometry.computeVertexNormals();
    const body = new THREE.Mesh(bodyGeometry, sideMaterial);
    body.rotation.y = -angle;
    body.castShadow = true;
    body.receiveShadow = true;
    result.add(body);

    const topGeometry = remember(toppingGeometry(shape));
    const contour = shape.extractPoints(20).shape;
    const position = topGeometry.getAttribute("position");
    const uv = topGeometry.getAttribute("uv");
    const rotation = angle + HALF_SLICE;
    for (let vertex = 0; vertex < position.count; vertex++) {
      const x = position.getX(vertex);
      const z = position.getZ(vertex);
      const radius = Math.hypot(x, z);
      const worldX = x * Math.cos(rotation) - z * Math.sin(rotation);
      const worldZ = x * Math.sin(rotation) + z * Math.cos(rotation);
      const u = 0.5 + worldX / 4.13;
      const v = 0.5 - worldZ / 4.13;
      uv.setXY(vertex, u, v);
      // Un peu de volume sur les feuilles et le fromage, puis zéro relief au
      // bord coupé : la garniture rejoint la mie sans fente visible.
      let leaf = 0;
      let cheese = 0;
      if (pixels) {
        const px = THREE.MathUtils.clamp(Math.round(u * 255), 0, 255);
        const py = THREE.MathUtils.clamp(Math.round((1 - v) * 255), 0, 255);
        const sample = (py * 256 + px) * 4;
        const red = pixels.data[sample];
        const green = pixels.data[sample + 1];
        const blue = pixels.data[sample + 2];
        leaf =
          THREE.MathUtils.clamp((green - red * 0.75) / 70, 0, 1) *
          (green > blue * 1.1 ? 1 : 0);
        cheese = THREE.MathUtils.clamp((red + green - 300) / 180, 0, 1);
      }
      const grain =
        (Math.sin(worldX * 17 + Math.sin(worldZ * 9)) +
          Math.sin(worldZ * 23 - worldX * 5)) *
        0.0035;
      const edge = THREE.MathUtils.smoothstep(edgeDistance(x, z, contour), 0, 0.1);
      const filling = (0.009 + cheese * 0.011 + leaf * 0.022 + grain) * edge;
      position.setY(vertex, TOP_HEIGHT + filling * (radius < 1.8 ? 1 : 0.5));
    }
    topGeometry.computeVertexNormals();
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.rotation.y = -angle;
    top.castShadow = true;
    top.receiveShadow = true;
    result.add(top);

    const crustShape = remember(crustGeometry(angle));
    const crust = new THREE.Mesh(crustShape, [crustMaterial, sideMaterial]);
    crust.castShadow = true;
    crust.receiveShadow = true;
    result.add(crust);
    return result;
  }

  for (let index = 1; index < 8; index++) group.add(makeSlice((index * Math.PI) / 4));
  const biteFrames = Array.from({ length: 5 }, (_, bite) => makeSlice(0, bite));
  biteFrames.forEach((frame, index) => {
    frame.visible = index === 0;
    slice.add(frame);
  });
  let currentBite = 0;
  return {
    group,
    slice,
    setBite(index) {
      const next = THREE.MathUtils.clamp(Math.round(index), 0, 5);
      if (next === currentBite) return;
      currentBite = next;
      biteFrames.forEach((frame, frameIndex) => {
        frame.visible = frameIndex === next;
      });
      slice.userData.bite = next;
    },
    dispose() {
      geometries.forEach((geometry) => geometry.dispose());
      sideMaterial.dispose();
      crustMaterial.dispose();
      topMaterial.dispose();
      bread.dispose();
      crumb.dispose();
      // La texture passée en argument appartient à la scène qui l’a chargée.
    },
  };
}
