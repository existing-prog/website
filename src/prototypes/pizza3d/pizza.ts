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
const THICKNESS = 0.16;

/**
 * Une texture de pain générée localement évite un modèle ou une image externe.
 * Le hasard est déterministe : recharger le prototype conserve les mêmes taches.
 */
function bakedTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#c58b44";
  context.fillRect(0, 0, canvas.width, canvas.height);
  let seed = 418;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let index = 0; index < 650; index++) {
    const x = random() * canvas.width;
    const y = random() * canvas.height;
    const radius = 1 + random() * 11;
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    const toasted = random() > 0.55;
    gradient.addColorStop(0, toasted ? "#59301399" : "#f9d18b88");
    gradient.addColorStop(1, toasted ? "#59301300" : "#f9d18b00");
    context.fillStyle = gradient;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
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

/** Un arc irrégulier donne une épaisseur douce à la croûte. */
class CrustCurve extends THREE.Curve<THREE.Vector3> {
  constructor(private readonly angle: number) {
    super();
  }

  getPoint(t: number, target = new THREE.Vector3()): THREE.Vector3 {
    const a =
      this.angle + THREE.MathUtils.lerp(-HALF_SLICE + 0.018, HALF_SLICE - 0.018, t);
    const radius = 1.9 + Math.sin(t * Math.PI * 7) * 0.008;
    return target.set(
      Math.cos(a) * radius,
      0.155 + Math.sin(t * Math.PI * 4) * 0.008,
      Math.sin(a) * radius,
    );
  }
}

export function createPizza(texture: THREE.Texture): PizzaModel {
  const group = new THREE.Group();
  group.name = "Pizza — sept parts fixes et une part mobile";
  const slice = new THREE.Group();
  slice.name = "Part saisie — pivot au centre de la pizza";
  group.add(slice);

  const bread = bakedTexture();
  const sideMaterial = new THREE.MeshStandardMaterial({
    color: "#eed4a1",
    map: bread,
    roughness: 0.96,
  });
  const crustMaterial = new THREE.MeshStandardMaterial({
    color: "#f3c680",
    map: bread,
    bumpMap: bread,
    bumpScale: 0.018,
    roughness: 0.87,
  });
  const topMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    bumpMap: texture,
    bumpScale: 0.028,
    roughness: 0.86,
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
        bevelThickness: 0.018,
        bevelSize: 0.018,
        bevelSegments: 2,
        steps: 1,
        curveSegments: 20,
      }),
    );
    bodyGeometry.rotateX(-Math.PI / 2);
    const body = new THREE.Mesh(bodyGeometry, sideMaterial);
    body.rotation.y = -angle;
    body.castShadow = true;
    body.receiveShadow = true;
    result.add(body);

    const topGeometry = remember(new THREE.ShapeGeometry(shape, 20));
    topGeometry.rotateX(-Math.PI / 2);
    const position = topGeometry.getAttribute("position");
    const uv = topGeometry.getAttribute("uv");
    const rotation = angle + HALF_SLICE;
    for (let vertex = 0; vertex < position.count; vertex++) {
      const x = position.getX(vertex);
      const z = position.getZ(vertex);
      const radius = Math.hypot(x, z);
      // Le relief reste léger pour conserver les détails de la vraie capture.
      const height = THICKNESS + 0.02 + Math.max(0, radius - 1.55) * 0.055;
      position.setY(vertex, height);
      const worldX = x * Math.cos(rotation) - z * Math.sin(rotation);
      const worldZ = x * Math.sin(rotation) + z * Math.cos(rotation);
      uv.setXY(vertex, 0.5 + worldX / 4.13, 0.5 - worldZ / 4.13);
    }
    topGeometry.computeVertexNormals();
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.rotation.y = -angle;
    top.castShadow = true;
    top.receiveShadow = true;
    result.add(top);

    const crustGeometry = remember(
      new THREE.TubeGeometry(new CrustCurve(angle), 28, 0.105, 8, false),
    );
    const crust = new THREE.Mesh(crustGeometry, crustMaterial);
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
      // La texture passée en argument appartient à la scène qui l’a chargée.
    },
  };
}
