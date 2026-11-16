import * as THREE from "three";

/**
 * Main sculptée en surfaces continues, autonome et réversible.
 * Le poignet reste à l’origine : avant-bras vers +X, doigts vers -X, dos vers +Y.
 * setGrip déforme des buffers déjà alloués ; aucune géométrie n’est reconstruite.
 */
export function createHand(): {
  group: THREE.Group;
  setGrip: (progress: number) => void;
  dispose: () => void;
} {
  const group = new THREE.Group();
  group.name = "Main — paume sculptée et doigts continus";
  const geometries = new Set<THREE.BufferGeometry>();
  const textures = new Set<THREE.Texture>();
  const materials = new Set<THREE.Material>();

  /** Grain très fin : une matière mate, sans effet peau photographique. */
  function grainTexture(fabric = false) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const context = canvas.getContext("2d")!;
    const pixels = context.createImageData(128, 128);
    let seed = fabric ? 271 : 839;
    for (let index = 0; index < 128 * 128; index++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const x = index % 128;
      const y = Math.floor(index / 128);
      const warp = x % 4 < 2;
      const weft = y % 4 < 2;
      const weave = fabric ? (warp !== weft ? 12 : -12) : 0;
      const value = 130 + (seed / 4294967296 - 0.5) * 24 + weave;
      for (let channel = 0; channel < 3; channel++)
        pixels.data[index * 4 + channel] = value;
      pixels.data[index * 4 + 3] = 255;
    }
    context.putImageData(pixels, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    textures.add(texture);
    return texture;
  }

  const skin = new THREE.MeshStandardMaterial({
    color: "#c9b195",
    roughness: 0.67,
    metalness: 0,
    bumpMap: grainTexture(),
    bumpScale: 0.0025,
    vertexColors: true,
  });
  const nailMaterial = new THREE.MeshStandardMaterial({
    color: "#e2ccb5",
    roughness: 0.44,
    metalness: 0,
  });
  const fabric = new THREE.MeshStandardMaterial({
    color: "#39443d",
    roughness: 0.98,
    bumpMap: grainTexture(true),
    bumpScale: 0.006,
    vertexColors: true,
  });
  [skin, nailMaterial, fabric].forEach((material) => materials.add(material));

  function mesh(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    parent = group,
  ) {
    geometries.add(geometry);
    const result = new THREE.Mesh(geometry, material);
    result.castShadow = true;
    result.receiveShadow = true;
    parent.add(result);
    return result;
  }

  type Profile = { x: number; y: number; width: number; height: number };
  /** Une seule enveloppe raccorde l’avant-bras, le poignet et la paume. */
  function loft(profiles: Profile[], rings: number, radial = 28, cloth = false) {
    const positions: number[] = [];
    const uvs: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    for (let ring = 0; ring <= rings; ring++) {
      const t = (ring / rings) * (profiles.length - 1);
      const section = Math.min(profiles.length - 2, Math.floor(t));
      const a = profiles[section];
      const b = profiles[section + 1];
      const u = t - section;
      const eased = u * u * (3 - 2 * u);
      const x = THREE.MathUtils.lerp(a.x, b.x, u);
      const centerY = THREE.MathUtils.lerp(a.y, b.y, eased);
      const width = THREE.MathUtils.lerp(a.width, b.width, eased);
      const height = THREE.MathUtils.lerp(a.height, b.height, eased);
      for (let side = 0; side <= radial; side++) {
        const angle = (side / radial) * Math.PI * 2;
        const cosine = Math.cos(angle);
        const sine = Math.sin(angle);
        const fold = cloth
          ? Math.sin(x * 22 + sine * 2) * Math.exp(-Math.max(0, x - 0.55) * 2) * 0.006
          : 0;
        // Les sections légèrement aplaties dessinent une paume, plutôt qu’un ovale.
        const z =
          Math.sign(sine) * Math.pow(Math.abs(sine), cloth ? 1 : 0.86) * (width + fold);
        const knuckle = cloth
          ? 0
          : Math.exp(-Math.pow((x + 0.66) / 0.12, 2)) *
            Math.max(0, cosine) ** 5 *
            Math.cos(z * 34) *
            0.007;
        // Le coussinet sous le pouce relie sa racine à la paume fermée.
        // Il appartient au même maillage : pas de petite boule détachée.
        const thenar = cloth
          ? 0
          : Math.exp(-Math.pow((x + 0.37) / 0.25, 2)) *
            Math.pow(Math.max(0, sine), 3) *
            Math.sqrt(Math.max(0, -cosine)) *
            0.2;
        positions.push(x, centerY + cosine * (height + fold) + knuckle - thenar, z);
        uvs.push((ring / rings) * (cloth ? 8 : 3), (side / radial) * 3);
        const shade = 0.97 + Math.max(0, cosine) * 0.03;
        colors.push(shade, shade, shade);
      }
    }
    for (let ring = 0; ring < rings; ring++) {
      for (let side = 0; side < radial; side++) {
        const a = ring * (radial + 1) + side;
        const b = a + radial + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  mesh(
    loft(
      [
        { x: 0.86, y: 0, width: 0.24, height: 0.18 },
        { x: 0.48, y: 0, width: 0.22, height: 0.145 },
        { x: 0.16, y: 0, width: 0.205, height: 0.12 },
        { x: -0.1, y: -0.005, width: 0.25, height: 0.125 },
        { x: -0.34, y: -0.012, width: 0.335, height: 0.14 },
        { x: -0.57, y: -0.008, width: 0.35, height: 0.13 },
        { x: -0.73, y: -0.006, width: 0.31, height: 0.085 },
        { x: -0.82, y: -0.018, width: 0.24, height: 0.018 },
        { x: -0.85, y: -0.018, width: 0.005, height: 0.004 },
      ],
      40,
    ),
    skin,
  );

  // Le bord de manche est intégré au profil, sans bague cylindrique détachée.
  mesh(
    loft(
      [
        { x: 3.3, y: 0, width: 0.39, height: 0.35 },
        { x: 2.45, y: 0, width: 0.365, height: 0.33 },
        { x: 1.48, y: 0, width: 0.32, height: 0.29 },
        { x: 0.86, y: 0, width: 0.29, height: 0.265 },
        { x: 0.63, y: 0, width: 0.267, height: 0.245 },
        { x: 0.58, y: 0, width: 0.272, height: 0.25 },
        { x: 0.53, y: 0, width: 0.258, height: 0.235 },
      ],
      42,
      28,
      true,
    ),
    fabric,
  );

  type Finger = {
    root: THREE.Group;
    geometry: THREE.BufferGeometry;
    nail: THREE.Mesh;
    length: number;
    radius: number;
    relaxed: [number, number, number];
    closed: [number, number, number];
  };
  const fingers: Finger[] = [];
  const ringCount = 24;
  const radialCount = 14;
  const nailGeometry = new THREE.SphereGeometry(1, 16, 10);
  geometries.add(nailGeometry);

  /** Surface continue autour d’une ligne de flexion à trois articulations. */
  function finger(
    root: THREE.Group,
    length: number,
    radius: number,
    relaxed: Finger["relaxed"],
    closed: Finger["closed"],
  ) {
    const count = (ringCount + 1) * (radialCount + 1);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(
        THREE.DynamicDrawUsage,
      ),
    );
    geometry.setAttribute(
      "normal",
      new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(
        THREE.DynamicDrawUsage,
      ),
    );
    const uv = new Float32Array(count * 2);
    const color = new Float32Array(count * 3).fill(1);
    const indices: number[] = [];
    for (let ring = 0; ring <= ringCount; ring++) {
      for (let side = 0; side <= radialCount; side++) {
        const vertex = ring * (radialCount + 1) + side;
        uv[vertex * 2] = (ring / ringCount) * 3;
        uv[vertex * 2 + 1] = side / radialCount;
        if (ring < ringCount && side < radialCount) {
          const next = vertex + radialCount + 1;
          indices.push(vertex, next, vertex + 1, next, next + 1, vertex + 1);
        }
      }
    }
    geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    geometry.setAttribute("color", new THREE.BufferAttribute(color, 3));
    geometry.setIndex(indices);
    // Ce volume couvre les poses ouverte et fermée sans recalcul au scroll.
    geometry.boundingSphere = new THREE.Sphere(
      new THREE.Vector3(-length * 0.45, -length * 0.28, 0),
      length * 0.85 + radius,
    );
    mesh(geometry, skin, root);
    const nail = new THREE.Mesh(nailGeometry, nailMaterial);
    nail.scale.set(length * 0.105, 0.008, radius * 0.6);
    root.add(nail);
    fingers.push({ root, geometry, nail, length, radius, relaxed, closed });
  }

  const fingerProfiles = [
    { x: -0.69, z: 0.25, length: 0.57, radius: 0.073, spread: -0.075 },
    { x: -0.745, z: 0.082, length: 0.66, radius: 0.076, spread: -0.025 },
    { x: -0.73, z: -0.092, length: 0.61, radius: 0.074, spread: 0.018 },
    { x: -0.65, z: -0.252, length: 0.46, radius: 0.063, spread: 0.065 },
  ];
  fingerProfiles.forEach((profile, index) => {
    const root = new THREE.Group();
    root.position.set(profile.x, 0.005, profile.z);
    root.rotation.y = profile.spread;
    group.add(root);
    finger(
      root,
      profile.length,
      profile.radius,
      [0.025, 0.1, 0.06],
      [0.43 + index * 0.025, 0.87, 0.55],
    );
  });

  // Le pouce passe sous le bord ; son opposition se règle indépendamment des doigts.
  const thumbRoot = new THREE.Group();
  group.add(thumbRoot);
  finger(thumbRoot, 0.57, 0.09, [0.02, 0.08, 0.03], [0.25, 0.28, 0.08]);

  const smooth = (value: number) => {
    const t = THREE.MathUtils.clamp(value, 0, 1);
    return t * t * (3 - 2 * t);
  };
  let lastGrip = Number.NaN;
  function setGrip(progress: number) {
    const grip = smooth(progress);
    // La caméra et la part bougent souvent sans changer la prise : aucun travail
    // sur les sommets n’est alors nécessaire, même pendant le défilement.
    if (grip === lastGrip) return;
    lastGrip = grip;
    thumbRoot.position.set(
      THREE.MathUtils.lerp(-0.32, -0.43, grip),
      THREE.MathUtils.lerp(-0.055, -0.23, grip),
      0.315,
    );
    thumbRoot.rotation.y = THREE.MathUtils.lerp(0.32, -0.58, grip);
    for (const digit of fingers) {
      const position = digit.geometry.getAttribute("position") as THREE.BufferAttribute;
      const normal = digit.geometry.getAttribute("normal") as THREE.BufferAttribute;
      let centerX = 0;
      let centerY = 0;
      const baseAngle = THREE.MathUtils.lerp(digit.relaxed[0], digit.closed[0], grip);
      const middleAngle = THREE.MathUtils.lerp(digit.relaxed[1], digit.closed[1], grip);
      const tipAngle = THREE.MathUtils.lerp(digit.relaxed[2], digit.closed[2], grip);
      for (let ring = 0; ring <= ringCount; ring++) {
        const t = ring / ringCount;
        const angle =
          baseAngle +
          middleAngle * smooth((t - 0.31) / 0.22) +
          tipAngle * smooth((t - 0.66) / 0.22);
        if (ring > 0) {
          centerX -= (Math.cos(angle) * digit.length) / ringCount;
          centerY -= (Math.sin(angle) * digit.length) / ringCount;
        }
        const tipRound = Math.sqrt(
          Math.max(0.001, 1 - Math.max(0, (t - 0.85) / 0.15) ** 2),
        );
        const radius = digit.radius * (1 - t * 0.22) * tipRound;
        for (let side = 0; side <= radialCount; side++) {
          const theta = (side / radialCount) * Math.PI * 2;
          const cosine = Math.cos(theta);
          const sine = Math.sin(theta);
          const index = ring * (radialCount + 1) + side;
          position.setXYZ(
            index,
            centerX - Math.sin(angle) * radius * cosine,
            centerY + Math.cos(angle) * radius * cosine,
            radius * sine * 0.94,
          );
          normal.setXYZ(index, -Math.sin(angle) * cosine, Math.cos(angle) * cosine, sine);
        }
        if (ring === 21) {
          digit.nail.position.set(
            centerX - Math.sin(angle) * radius * 0.96,
            centerY + Math.cos(angle) * radius * 0.96,
            0,
          );
          digit.nail.rotation.z = angle;
        }
      }
      position.needsUpdate = true;
      normal.needsUpdate = true;
    }
  }

  setGrip(0);
  return {
    group,
    setGrip,
    dispose() {
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
    },
  };
}
