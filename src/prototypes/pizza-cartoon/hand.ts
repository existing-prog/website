import * as THREE from "three";
import { cartoonMaterials } from "./materials";

/** Main nue de personnage : volumes arrondis continus et cinq doigts distincts.
 * Les quatre doigts soutiennent la pâte ; le pouce se referme sur la croûte.
 * Les poses ouvertes/fermées sont préparées une fois, puis interpolées au scroll.
 */
export async function createHand() {
  const group = new THREE.Group();
  group.name = "Main cartoon — quatre doigts dessous, pouce dessus";
  const palette = cartoonMaterials();
  const skin = palette.toon("#efb38b");
  const cloth = palette.toon("#426e7e");
  const geometries = new Set<THREE.BufferGeometry>();
  function add(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    position: number[],
    scale: number[],
  ) {
    geometries.add(geometry);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.fromArray(position);
    mesh.scale.fromArray(scale);
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    group.add(mesh);
    return mesh;
  }
  // Une paume ovale et un poignet étroit remplacent les dalles plates du fichier.
  add(new THREE.SphereGeometry(1, 32, 20), skin, [0.24, 0, 0], [0.48, 0.14, 0.42]);
  add(new THREE.SphereGeometry(1, 24, 16), skin, [0.65, 0, 0], [0.38, 0.13, 0.26]);
  const sleeve = new THREE.CylinderGeometry(0.21, 0.27, 3.4, 24);
  sleeve.rotateZ(-Math.PI / 2);
  add(sleeve, cloth, [2.55, 0, 0], [1, 1, 1]);

  type Finger = {
    geometry: THREE.BufferGeometry;
    open: Float32Array;
    closed: Float32Array;
    openNormals: Float32Array;
    closedNormals: Float32Array;
  };
  const fingers: Finger[] = [];
  function finger(open: number[][], closed: number[][], radius: number) {
    function shape(points: number[][]) {
      const curve = new THREE.CatmullRomCurve3(
        points.map((p) => new THREE.Vector3().fromArray(p)),
      );
      return new THREE.TubeGeometry(curve, 24, radius, 12, false);
    }
    const geometry = shape(open),
      target = shape(closed);
    fingers.push({
      geometry,
      open: geometry.attributes.position.array.slice() as Float32Array,
      closed: target.attributes.position.array.slice() as Float32Array,
      openNormals: geometry.attributes.normal.array.slice() as Float32Array,
      closedNormals: target.attributes.normal.array.slice() as Float32Array,
    });
    // Les bouts sont arrondis par de petites sphères qui suivent la même pose.
    const tip = add(
      new THREE.SphereGeometry(radius, 16, 12),
      skin,
      open.at(-1)!,
      [1, 1, 1],
    );
    tips.push({
      mesh: tip,
      open: new THREE.Vector3().fromArray(open.at(-1)!),
      closed: new THREE.Vector3().fromArray(closed.at(-1)!),
    });
    target.dispose();
    const mesh = add(geometry, skin, [0, 0, 0], [1, 1, 1]);
    mesh.frustumCulled = false;
  }
  const tips: { mesh: THREE.Mesh; open: THREE.Vector3; closed: THREE.Vector3 }[] = [];
  [-0.32, -0.105, 0.105, 0.32].forEach((z, index) => {
    const length = [0.8, 1.02, 0.96, 0.76][index];
    finger(
      [
        [-0.04, 0, z],
        [-0.35, -0.07, z],
        [-length, -0.1, z],
      ],
      [
        [-0.04, 0, z],
        [-0.39, -0.025, z],
        [-length, 0.025, z * 0.88],
      ],
      0.075,
    );
  });
  // Deux phalanges courtes autour d’un vrai point d’articulation remplacent
  // l’ancien tube courbé : le pouce ne dessine plus une anse au-dessus de la part.
  const thumbOpen = [
    new THREE.Vector3(0.08, 0.12, -0.28),
    new THREE.Vector3(0.02, 0.27, -0.4),
    new THREE.Vector3(-0.2, 0.3, -0.43),
  ];
  const thumbClosed = [
    new THREE.Vector3(0.08, 0.2, -0.28),
    new THREE.Vector3(-0.09, 0.42, -0.22),
    new THREE.Vector3(-0.4, 0.46, -0.1),
  ];
  // La base charnue relie le pouce à la paume et adoucit la silhouette du joint.
  add(new THREE.SphereGeometry(1, 24, 16), skin, [0.1, 0.08, -0.23], [0.22, 0.2, 0.19]);
  const thumbPoints = thumbOpen.map((point) => point.clone());
  const thumbJoints = [0.13, 0.105, 0.09].map((radius, index) =>
    add(
      new THREE.SphereGeometry(radius, 24, 16),
      skin,
      thumbOpen[index].toArray(),
      [1, 1, 1],
    ),
  );
  const thumbSegments = [0.11, 0.095].map((radius) =>
    add(new THREE.CylinderGeometry(radius, radius, 1, 20), skin, [0, 0, 0], [1, 1, 1]),
  );
  const vertical = new THREE.Vector3(0, 1, 0),
    direction = new THREE.Vector3();
  let previous = -1;
  return {
    group,
    setGrip(value: number) {
      const t = THREE.MathUtils.smoothstep(value, 0, 1);
      if (previous === t) return;
      previous = t;
      for (const finger of fingers) {
        const position = finger.geometry.attributes.position;
        const normal = finger.geometry.attributes.normal;
        for (let i = 0; i < position.array.length; i++) {
          position.array[i] = THREE.MathUtils.lerp(finger.open[i], finger.closed[i], t);
          normal.array[i] = THREE.MathUtils.lerp(
            finger.openNormals[i],
            finger.closedNormals[i],
            t,
          );
        }
        position.needsUpdate = normal.needsUpdate = true;
      }
      tips.forEach((tip) => tip.mesh.position.lerpVectors(tip.open, tip.closed, t));
      thumbPoints.forEach((point, index) => {
        point.lerpVectors(thumbOpen[index], thumbClosed[index], t);
        thumbJoints[index].position.copy(point);
      });
      thumbSegments.forEach((segment, index) => {
        direction.subVectors(thumbPoints[index + 1], thumbPoints[index]);
        const length = direction.length();
        segment.position
          .copy(thumbPoints[index])
          .add(thumbPoints[index + 1])
          .multiplyScalar(0.5);
        segment.quaternion.setFromUnitVectors(vertical, direction.normalize());
        segment.scale.y = length;
      });
    },
    dispose() {
      geometries.forEach((g) => g.dispose());
      palette.dispose();
    },
  };
}
