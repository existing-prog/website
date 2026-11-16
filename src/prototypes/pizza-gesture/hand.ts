import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export type HandModel = {
  group: THREE.Group;
  setGrip: (progress: number) => void;
  dispose: () => void;
};

/**
 * Main de personnage à partir du squelette CC0 MakeHuman/Innerscene.
 * La matière unie et les doigts légèrement épaissis prolongent le style
 * de la pizza. Le GLB et l’ancien prototype restent conservés tels quels.
 */
export async function createHand(): Promise<HandModel> {
  const gltf = await new GLTFLoader().loadAsync(
    `${import.meta.env.BASE_URL}assets/models/anatomical-hand.glb`,
  );
  const group = new THREE.Group();
  group.name = "Main stylisée — prise latérale autour de la croûte";
  // Présenter le pouce côté caméra. Le miroir conserve les proportions du
  // modèle et le roulis rend la prise lisible sans plaquer la paume sur la pizza.
  group.scale.z = -1;
  group.rotation.x = -Math.PI / 3;
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const sourceMaterials = new Set<THREE.Material>();
  // Une seule couleur mate : les détails photographiques de peau créaient
  // un décalage avec les ingrédients sculptés et les formes douces de la pizza.
  const skin = new THREE.MeshStandardMaterial({
    color: "#d59c78",
    roughness: 0.9,
    side: THREE.DoubleSide,
  });
  const forearm = skin;
  const cloth = new THREE.MeshStandardMaterial({ color: "#39443d", roughness: 0.97 });
  materials.add(skin);
  materials.add(forearm);
  materials.add(cloth);

  // Adaptation du repère de cet export glTF : poignet à l’origine, doigts vers
  // -X et dos de la main vers +Y. L’échelle uniforme conserve son anatomie.
  const normalized = new THREE.Group();
  normalized.quaternion.set(-0.02298459, 0.76889286, 0.04186606, 0.63759134);
  normalized.position.set(0.15295006, -0.38279729, 0.12114368);
  normalized.scale.setScalar(7.1018864);
  normalized.add(gltf.scene);
  group.add(normalized);
  const skinnedMeshes: THREE.SkinnedMesh[] = [];
  gltf.scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    const original = Array.isArray(object.material) ? object.material : [object.material];
    original.forEach((material) => sourceMaterials.add(material));
    object.material = skin;
    object.castShadow = true;
    object.receiveShadow = true;
    // Les doigts déplacent la surface hors de sa boîte de repos. Le modèle est
    // petit ; garder le maillage actif évite de couper une phalange pendant la prise.
    object.frustumCulled = false;
    if (object instanceof THREE.SkinnedMesh) skinnedMeshes.push(object);
  });
  sourceMaterials.forEach((material) => material.dispose());

  // Le GLB est fermé au poignet. Retirer ce capuchon interne évite qu’il ne
  // projette une ligne d’ombre sur le prolongement d’avant-bras ajouté ici.
  // Le fichier d’origine reste intact ; seules ses faces de fermeture sont filtrées.
  group.updateMatrixWorld(true);
  for (const mesh of skinnedMeshes) {
    mesh.skeleton.update();
    const geometry = mesh.geometry;
    const indices = geometry.getIndex();
    if (!indices) continue;
    const vertices = Array.from(
      { length: geometry.getAttribute("position").count },
      (_, index) =>
        mesh.getVertexPosition(index, new THREE.Vector3()).applyMatrix4(mesh.matrixWorld),
    );
    const kept: number[] = [];
    const edgeA = new THREE.Vector3();
    const edgeB = new THREE.Vector3();
    for (let index = 0; index < indices.count; index += 3) {
      const a = indices.getX(index),
        b = indices.getX(index + 1),
        c = indices.getX(index + 2);
      const centerX = (vertices[a].x + vertices[b].x + vertices[c].x) / 3;
      const normal = edgeA
        .subVectors(vertices[b], vertices[a])
        .cross(edgeB.subVectors(vertices[c], vertices[a]))
        .normalize();
      if (centerX > -0.17 && Math.abs(normal.x) > 0.85) continue;
      kept.push(a, b, c);
    }
    geometry.setIndex(kept);
  }

  // Épaissir les doigts autour de leurs axes de repos, sans les allonger.
  // Les poids du squelette mélangent les corrections aux articulations : pas
  // de boules ajoutées ni de séparation visible entre les phalanges.
  for (const mesh of skinnedMeshes) {
    const geometry = mesh.geometry;
    const position = geometry.getAttribute("position");
    const weights = geometry.getAttribute("skinWeight");
    const boneIndices = geometry.getAttribute("skinIndex");
    // Les positions du fichier sont dans l’espace de liaison du squelette,
    // pas dans le repère monde après normalisation du GLB. L’inverse de
    // bindMatrix reste celui du fichier ; bindMatrixInverse évolue en mode Attached.
    const centers = mesh.skeleton.boneInverses.map((inverse) =>
      new THREE.Vector3().setFromMatrixPosition(
        mesh.bindMatrix.clone().invert().multiply(inverse.clone().invert()),
      ),
    );
    const segments = mesh.skeleton.bones.map((bone, index) => {
      if (!/^(index|middle|ring|pinky|thumb)_/.test(bone.name)) return null;
      const next = bone.children.find((child) => child instanceof THREE.Bone);
      const endIndex = mesh.skeleton.bones.indexOf((next ?? bone.parent) as THREE.Bone);
      if (endIndex < 0) return null;
      return {
        center: centers[index],
        axis: centers[endIndex].clone().sub(centers[index]).normalize(),
      };
    });
    const point = new THREE.Vector3();
    const radial = new THREE.Vector3();
    const correction = new THREE.Vector3();
    for (let index = 0; index < position.count; index++) {
      point.fromBufferAttribute(position, index);
      correction.set(0, 0, 0);
      for (let influence = 0; influence < 4; influence++) {
        const segment = segments[boneIndices.getComponent(index, influence)];
        if (!segment) continue;
        radial.subVectors(point, segment.center);
        radial.addScaledVector(segment.axis, -radial.dot(segment.axis));
        correction.addScaledVector(radial, weights.getComponent(index, influence) * 0.16);
      }
      point.add(correction);
      position.setXYZ(index, point.x, point.y, point.z);
    }
    position.needsUpdate = true;
    // Conserver les normales lissées de l’export aux coutures UV de la main.
  }

  /** Avant-bras et manche raccordés au poignet de la main importée. */
  function sleeveSurface(
    profiles: Array<{ x: number; width: number; height: number; y?: number; z?: number }>,
    material: THREE.Material,
  ) {
    const positions: number[] = [];
    const indices: number[] = [];
    const rings = 36;
    const sides = 28;
    for (let ring = 0; ring <= rings; ring++) {
      const position = (ring / rings) * (profiles.length - 1);
      const index = Math.min(profiles.length - 2, Math.floor(position));
      const a = profiles[index];
      const b = profiles[index + 1];
      const t = position - index;
      const smooth = t * t * (3 - 2 * t);
      const x = THREE.MathUtils.lerp(a.x, b.x, t);
      const width = THREE.MathUtils.lerp(a.width, b.width, smooth);
      const height = THREE.MathUtils.lerp(a.height, b.height, smooth);
      const centerY = THREE.MathUtils.lerp(a.y ?? 0, b.y ?? 0, smooth);
      const centerZ = THREE.MathUtils.lerp(a.z ?? 0, b.z ?? 0, smooth);
      for (let side = 0; side <= sides; side++) {
        const angle = (side / sides) * Math.PI * 2;
        positions.push(
          x,
          centerY + Math.cos(angle) * height,
          centerZ + Math.sin(angle) * width,
        );
      }
    }
    for (let ring = 0; ring < rings; ring++) {
      for (let side = 0; side < sides; side++) {
        const a = ring * (sides + 1) + side;
        const b = a + sides + 1;
        indices.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometries.add(geometry);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  sleeveSurface(
    [
      { x: -0.2, width: 0.17, height: 0.1, y: -0.006, z: -0.026 },
      { x: 0.1, width: 0.186, height: 0.112, y: -0.006, z: -0.026 },
      { x: 0.45, width: 0.22, height: 0.15 },
      { x: 0.8, width: 0.24, height: 0.18 },
    ],
    forearm,
  );
  sleeveSurface(
    [
      // La coupe du GLB n'est pas un cercle régulier. Le poignet reste engagé
      // dans la manche : ce chevauchement masque son bord sans étirer la peau.
      { x: -0.18, width: 0.25, height: 0.168, y: -0.015, z: 0.025 },
      { x: -0.1, width: 0.253, height: 0.17, y: -0.015, z: 0.025 },
      { x: 0.13, width: 0.25, height: 0.18 },
      { x: 0.7, width: 0.26, height: 0.23 },
      { x: 1.4, width: 0.31, height: 0.28 },
      { x: 2.4, width: 0.36, height: 0.32 },
      { x: 3.3, width: 0.39, height: 0.35 },
    ],
    cloth,
  );

  type Joint = { bone: THREE.Bone; rest: THREE.Quaternion; flex: number; oppose: number };
  const joints: Joint[] = [];
  const poses: Record<string, readonly number[]> = {
    index: [0.16, 0.3, 0.1],
    middle: [0.2, 0.36, 0.14],
    // Les deux derniers doigts restent repliés sous la paume plutôt que de
    // pendre vers l’assiette. L’index et le majeur assurent le soutien de la part.
    ring: [0.55, 0.85, 0.5],
    pinky: [0.65, 0.95, 0.55],
    thumb: [0.04, 0.08, 0.04],
  };
  for (const [finger, flexions] of Object.entries(poses)) {
    flexions.forEach((flex, index) => {
      const name = `${finger}_0${index + 1}_r`;
      const bone = gltf.scene.getObjectByName(name);
      if (!(bone instanceof THREE.Bone))
        throw new Error(`Articulation absente : ${name}`);
      joints.push({
        bone,
        rest: bone.quaternion.clone(),
        flex,
        oppose: finger === "thumb" && index === 0 ? 0.6 : 0,
      });
    });
  }
  // Cet export possède un repère interne inversé : -Z ferme les doigts vers
  // la paume. Le pouce oppose sa base autour de son axe local X.
  const flexAxis = new THREE.Vector3(0, 0, -1);
  const opposeAxis = new THREE.Vector3(1, 0, 0);
  const delta = new THREE.Quaternion();
  let lastGrip = Number.NaN;
  function setGrip(value: number) {
    const grip = THREE.MathUtils.clamp(value, 0, 1);
    const eased = grip * grip * (3 - 2 * grip);
    if (lastGrip === eased) return;
    lastGrip = eased;
    for (const joint of joints) {
      joint.bone.quaternion.copy(joint.rest);
      joint.bone.quaternion.multiply(
        delta.setFromAxisAngle(flexAxis, joint.flex * eased),
      );
      if (joint.oppose)
        joint.bone.quaternion.multiply(
          delta.setFromAxisAngle(opposeAxis, joint.oppose * eased),
        );
    }
  }
  setGrip(0);
  return {
    group,
    setGrip,
    dispose() {
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      skinnedMeshes.forEach((mesh) => mesh.skeleton.dispose());
    },
  };
}
