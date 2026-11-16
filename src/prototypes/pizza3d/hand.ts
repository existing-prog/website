import * as THREE from "three";

/**
 * Main stylisée autonome : les rotations des phalanges sont pilotées par le scroll.
 * Repère local : poignet à (0, 0, 0), doigts vers -X, dos de la main vers +Y.
 * Aucun modèle distant ni boucle d’animation : setGrip est pur et réversible.
 */
export function createHand(): {
  group: THREE.Group;
  setGrip: (progress: number) => void;
  dispose: () => void;
} {
  const group = new THREE.Group();
  group.name = "Main — étude de préhension";
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();

  const clay = new THREE.MeshStandardMaterial({
    color: "#d7c6ae",
    roughness: 0.71,
    metalness: 0,
  });
  const nail = new THREE.MeshStandardMaterial({
    color: "#e4d5c2",
    roughness: 0.48,
    metalness: 0,
  });
  const fabric = new THREE.MeshStandardMaterial({
    color: "#36483e",
    roughness: 0.97,
    metalness: 0,
  });
  const cuff = new THREE.MeshStandardMaterial({
    color: "#293b31",
    roughness: 0.94,
    metalness: 0,
  });
  [clay, nail, fabric, cuff].forEach((material) => materials.add(material));

  function mesh(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    parent: THREE.Object3D,
  ): THREE.Mesh {
    geometries.add(geometry);
    const result = new THREE.Mesh(geometry, material);
    result.castShadow = true;
    result.receiveShadow = true;
    parent.add(result);
    return result;
  }

  // Les volumes se recouvrent légèrement : les articulations ne se détachent
  // jamais et les transitions gardent l’aspect d’une petite sculpture en argile.
  function ellipsoid(
    parent: THREE.Object3D,
    position: [number, number, number],
    scale: [number, number, number],
    material: THREE.Material = clay,
  ) {
    const result = mesh(new THREE.SphereGeometry(1, 24, 16), material, parent);
    result.position.set(...position);
    result.scale.set(...scale);
    return result;
  }

  const palm = ellipsoid(group, [-0.37, 0, 0], [0.53, 0.145, 0.36]);
  palm.rotation.z = -0.025;
  // Talon et éminence du pouce : une paume moins uniforme qu’un simple ovale.
  ellipsoid(group, [-0.12, -0.035, 0], [0.28, 0.14, 0.26]);
  ellipsoid(group, [-0.37, -0.025, 0.225], [0.29, 0.135, 0.205]);

  const wrist = mesh(new THREE.CylinderGeometry(0.225, 0.205, 0.76, 24), clay, group);
  wrist.rotation.z = Math.PI / 2;
  wrist.position.x = 0.35;
  wrist.scale.z = 1.07;

  // La manche sert aussi de cadre au geste ; sa fin reste hors champ pendant
  // l’entrée du bras. Son bord arrondi évite une coupure de cylindre trop dure.
  const sleeve = mesh(new THREE.CylinderGeometry(0.32, 0.39, 2.7, 32), fabric, group);
  sleeve.rotation.z = Math.PI / 2;
  sleeve.position.x = 1.87;
  sleeve.scale.z = 1.06;
  const sleeveCuff = mesh(new THREE.TorusGeometry(0.285, 0.052, 10, 32), cuff, group);
  sleeveCuff.rotation.y = Math.PI / 2;
  sleeveCuff.scale.y = 0.93;
  sleeveCuff.position.x = 0.53;

  type Articulation = {
    pivot: THREE.Group;
    relaxed: number;
    closed: number;
  };
  const articulations: Articulation[] = [];

  /** Une capsule suit -X ; son groupe parent reste placé sur l’articulation. */
  function phalanx(
    parent: THREE.Object3D,
    length: number,
    radius: number,
    relaxed: number,
    closed: number,
  ): THREE.Group {
    const pivot = new THREE.Group();
    parent.add(pivot);
    const body = mesh(
      new THREE.CapsuleGeometry(radius, Math.max(0.01, length - radius * 2), 5, 12),
      clay,
      pivot,
    );
    body.rotation.z = Math.PI / 2;
    body.position.x = -length / 2;
    body.scale.z = 0.92;
    articulations.push({ pivot, relaxed, closed });
    return pivot;
  }

  // Longueurs et éventail différents pour l’index, le majeur, l’annulaire et
  // l’auriculaire ; cette asymétrie rend la silhouette immédiatement lisible.
  const fingers = [
    { z: 0.25, base: -0.69, length: 0.57, width: 0.073, spread: -0.075 },
    { z: 0.082, base: -0.745, length: 0.66, width: 0.076, spread: -0.025 },
    { z: -0.092, base: -0.73, length: 0.61, width: 0.074, spread: 0.018 },
    { z: -0.252, base: -0.65, length: 0.46, width: 0.063, spread: 0.065 },
  ];
  for (const [index, finger] of fingers.entries()) {
    const root = new THREE.Group();
    root.position.set(finger.base, 0.005, finger.z);
    root.rotation.y = finger.spread;
    group.add(root);
    ellipsoid(root, [0.015, 0.015, 0], [0.1, 0.087, finger.width * 1.06]);

    const lengths = [finger.length * 0.46, finger.length * 0.31, finger.length * 0.23];
    const base = phalanx(root, lengths[0], finger.width, 0.035, 0.55 + index * 0.025);
    const middle = phalanx(base, lengths[1], finger.width * 0.88, 0.1, 1.02);
    middle.position.x = -lengths[0];
    const tip = phalanx(middle, lengths[2], finger.width * 0.78, 0.075, 0.66);
    tip.position.x = -lengths[1];
    const fingernail = ellipsoid(
      tip,
      [-lengths[2] * 0.48, finger.width * 0.7, 0],
      [lengths[2] * 0.33, 0.009, finger.width * 0.55],
      nail,
    );
    fingernail.rotation.z = 0.05;
  }

  // Le pouce arrive sous la croûte pendant que les quatre doigts se recourbent.
  // Il garde sa propre opposition, plutôt que de suivre le même éventail.
  const thumbRoot = new THREE.Group();
  thumbRoot.position.set(-0.33, -0.055, 0.315);
  group.add(thumbRoot);
  const thumbBase = phalanx(thumbRoot, 0.29, 0.093, -0.04, 0.24);
  const thumbTip = phalanx(thumbBase, 0.27, 0.079, 0.06, -0.19);
  thumbTip.position.x = -0.29;
  ellipsoid(thumbTip, [-0.14, 0.063, 0], [0.086, 0.01, 0.052], nail);

  function setGrip(progress: number) {
    const clamped = THREE.MathUtils.clamp(progress, 0, 1);
    // Courbe douce locale, sans mémoire : revenir au même scroll rend la même pose.
    const t = clamped * clamped * (3 - 2 * clamped);
    for (const { pivot, relaxed, closed } of articulations) {
      pivot.rotation.z = THREE.MathUtils.lerp(relaxed, closed, t);
    }
    thumbRoot.rotation.y = THREE.MathUtils.lerp(0.26, -0.71, t);
    thumbRoot.position.y = THREE.MathUtils.lerp(-0.055, -0.21, t);
    thumbRoot.position.x = THREE.MathUtils.lerp(-0.33, -0.41, t);
  }

  setGrip(0);
  return {
    group,
    setGrip,
    dispose() {
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
    },
  };
}
