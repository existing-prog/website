import * as THREE from "three";
import { createPizza } from "./pizza";
import { createHand } from "./hand";
import { easeRange, mealPose, storyProgress } from "./choreography";

export type PizzaScene = {
  setProgress: (progress: number) => void;
  resize: () => void;
  dispose: () => void;
};

const clamp = THREE.MathUtils.clamp;
const mix = THREE.MathUtils.lerp;
/**
 * Scène volontairement séparée du site. La main CC0 est hébergée localement ;
 * la pizza réutilise sa texture existante. Aucune dépendance à un service 3D distant.
 * On ne rend une image que lorsqu’une pose ou la taille change (pas de boucle au repos).
 */
export async function createScene(
  canvas: HTMLCanvasElement,
  onContextLost: () => void,
): Promise<PizzaScene> {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth <= 760 ? 1.5 : 2));
  renderer.setClearColor("#f3efe6");
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#f3efe6");
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
  const returnOrbit = new THREE.Spherical();
  const sky = new THREE.HemisphereLight("#fff8e7", "#8d775b", 2.1);
  scene.add(sky);
  const key = new THREE.DirectionalLight("#fff7e7", 3.1);
  key.position.set(-3, 8, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, {
    left: -7,
    right: 7,
    top: 7,
    bottom: -7,
    near: 0.1,
    far: 25,
  });
  key.shadow.normalBias = 0.025;
  key.shadow.bias = -0.0002;
  key.shadow.radius = 4;
  scene.add(key);
  const fill = new THREE.DirectionalLight("#e2e8f0", 1.3);
  fill.position.set(5, 4, -5);
  scene.add(fill);

  // Deux fichiers locaux indépendants : texture de la pizza et main articulée.
  // En cas d’échec, libérer aussi celui qui a déjà fini de charger.
  const [imageResult, handResult] = await Promise.allSettled([
    new THREE.TextureLoader().loadAsync(
      `${import.meta.env.BASE_URL}assets/atelier-pizza-whole.webp`,
    ),
    createHand(),
  ]);
  if (imageResult.status === "rejected" || handResult.status === "rejected") {
    if (imageResult.status === "fulfilled") imageResult.value.dispose();
    if (handResult.status === "fulfilled") handResult.value.dispose();
    renderer.dispose();
    throw new Error("Impossible de charger les modèles du prototype.");
  }
  const texture = imageResult.value;
  const hand = handResult.value;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const pizza = createPizza(texture);
  scene.add(pizza.group);
  const held = new THREE.Group();
  held.name = "Prise commune — main et part montent ensemble";
  held.add(pizza.slice, hand.group);
  scene.add(held);

  const floorMaterial = new THREE.MeshStandardMaterial({
    color: "#f3efe6",
    roughness: 1,
  });
  const floorGeometry = new THREE.PlaneGeometry(200, 200);
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.14;
  floor.receiveShadow = true;
  scene.add(floor);
  const plateMaterial = new THREE.MeshStandardMaterial({
    color: "#ded2bd",
    roughness: 0.9,
  });
  const plateGeometry = new THREE.CylinderGeometry(2.15, 2.12, 0.07, 96);
  const plate = new THREE.Mesh(plateGeometry, plateMaterial);
  plate.position.y = -0.065;
  plate.castShadow = true;
  plate.receiveShadow = true;
  scene.add(plate);

  // Miettes posées dans l’empreinte de la part, sans simulation ni particules.
  // Les positions sont fixes pour conserver le même dessin au scroll arrière.
  const crumbGeometry = new THREE.DodecahedronGeometry(1, 0);
  const crumbMaterials = [
    new THREE.MeshStandardMaterial({
      color: "#bd7b35",
      roughness: 1,
      transparent: true,
      opacity: 0,
    }),
    new THREE.MeshStandardMaterial({
      color: "#e0b56d",
      roughness: 1,
      transparent: true,
      opacity: 0,
    }),
  ];
  const crumbPositions = [
    [1.57, 0.18, 0.032],
    [1.63, 0.21, 0.022],
    [1.52, 0.15, 0.015],
    [1.69, 0.13, 0.04],
    [1.61, 0.07, 0.016],
    [1.45, -0.21, 0.031],
    [1.5, -0.25, 0.019],
    [1.36, -0.19, 0.014],
    [1.12, 0.1, 0.02],
    [0.93, -0.08, 0.014],
    [0.64, 0.04, 0.012],
    [1.83, -0.12, 0.024],
  ];
  const crumbs = new THREE.Group();
  crumbs.name = "Miettes — trace de la part mangée sur l’assiette";
  crumbPositions.forEach(([x, z, size], index) => {
    const crumb = new THREE.Mesh(crumbGeometry, crumbMaterials[index % 2]);
    crumb.scale.set(size, size * 0.48, size * 0.72);
    crumb.position.set(x, -0.025 + size * 0.48, z);
    crumb.rotation.y = index * 1.7;
    crumb.receiveShadow = true;
    crumbs.add(crumb);
  });
  scene.add(crumbs);
  const finalPizzaBounds = new THREE.Box3()
    .setFromObject(plate)
    .union(new THREE.Box3().setFromObject(pizza.group));
  const finalPizzaCorners = Array.from(
    { length: 8 },
    (_, index) =>
      new THREE.Vector3(
        index & 1 ? finalPizzaBounds.max.x : finalPizzaBounds.min.x,
        index & 2 ? finalPizzaBounds.max.y : finalPizzaBounds.min.y,
        index & 4 ? finalPizzaBounds.max.z : finalPizzaBounds.min.z,
      ),
  );

  // La boîte de la part entière reste le repère même après les bouchées.
  // Utiliser sa taille maximale garantit la sortie de toute la nourriture.
  const fullSliceBounds = new THREE.Box3().setFromObject(pizza.slice);
  const corners = Array.from(
    { length: 8 },
    (_, index) =>
      new THREE.Vector3(
        index & 1 ? fullSliceBounds.max.x : fullSliceBounds.min.x,
        index & 2 ? fullSliceBounds.max.y : fullSliceBounds.min.y,
        index & 4 ? fullSliceBounds.max.z : fullSliceBounds.min.z,
      ),
  );
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  const point = new THREE.Vector3();
  const projected = new THREE.Vector3();
  const screenBounds = new THREE.Box2();
  const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  let progress = 0;
  let frame = 0;
  let disposed = false;
  function requestRender() {
    if (frame || disposed) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!disposed) renderer.render(scene, camera);
    });
  }

  function setProgress(value: number) {
    progress = clamp(value, 0, 1);
    const phone = canvas.clientWidth <= 760;
    const story = storyProgress(progress);
    const overhead = easeRange(progress, 0.86, 0.96);
    const enter = easeRange(story, 0.13, 0.31);
    const grip = easeRange(story, 0.29, 0.4);
    const lift = easeRange(story, 0.41, 0.61);
    const meal = mealPose(story);
    const sideView = easeRange(story, 0.44, 0.64);
    // Conserver une largeur de plateau constante, même sur un téléphone de 320 px.
    const phoneDistance =
      5 / (2 * Math.tan(THREE.MathUtils.degToRad(17)) * camera.aspect);
    const sideScale = (phoneDistance / 17.8) * 1.08;
    pizza.setBite(meal.bite);
    hand.setGrip(grip * (1 - meal.release * 0.55));
    hand.group.position.set(mix(8, 2.65, enter), 0.5, 0);
    hand.group.rotation.z = mix(-0.06, 0, grip);
    // La main est entièrement sortie avant que la caméra ne revienne au-dessus.
    hand.group.visible = story > 0.12 && story < 0.995;
    held.position.set(lift * 0.3, lift * 1.35, lift * -0.1);
    held.rotation.set(0, meal.twist, lift * 0.075 + meal.roll);

    // L’angle de caméra change, pas la forme de la pizza. Le modèle reste volumique.
    const target = new THREE.Vector3(
      mix(phone ? 0 : -1.35, 0.4, sideView),
      mix(0, 0.7, sideView),
      mix(phone ? -1.2 : 0, 0, sideView),
    );
    camera.position.set(
      mix(phone ? 0 : -1.35, phone ? 8.2 * sideScale : 5.8, sideView),
      mix(phone ? phoneDistance : 10.2, phone ? 8.0 * sideScale : 5.2, sideView),
      mix(phone ? -1.15 : 0.05, phone ? 13.2 * sideScale : 8.0, sideView),
    );
    // Le dernier cadrage réserve une vraie place au texte, au lieu de masquer
    // la pizza. Sur téléphone, la pizza est au-dessus du bloc de conclusion.
    const finalDistance = phone
      ? 6 / (2 * tangent * camera.aspect)
      : Math.max(10.2, 9.5 / (2 * tangent * camera.aspect));
    const finalWidth = 2 * finalDistance * tangent * camera.aspect;
    const finalHeight = 2 * finalDistance * tangent;
    const finalTarget = new THREE.Vector3(
      phone ? 0 : finalWidth * 0.23,
      0,
      phone ? finalHeight * 0.25 : 0,
    );
    if (overhead > 0) {
      // Interpoler aussi l’azimut évite un petit tour sec en arrivant à la
      // verticale : le mouvement décrit un arc doux jusqu’au cadrage final.
      returnOrbit.setFromVector3(point.copy(camera.position).sub(target));
      returnOrbit.radius = mix(
        returnOrbit.radius,
        Math.hypot(finalDistance, 0.05),
        overhead,
      );
      returnOrbit.phi = mix(returnOrbit.phi, Math.atan2(0.05, finalDistance), overhead);
      returnOrbit.theta = mix(returnOrbit.theta, 0, overhead);
      target.lerp(finalTarget, overhead);
      camera.position.setFromSpherical(returnOrbit).add(target);
    }
    const crumbOpacity = easeRange(progress, 0.86, 0.94);
    crumbs.visible = crumbOpacity > 0;
    crumbMaterials.forEach((material) => {
      material.opacity = crumbOpacity;
    });
    camera.lookAt(target);
    camera.updateMatrixWorld();
    held.updateMatrixWorld(true);

    // Le hors-champ est mesuré dans le repère de la caméra, pas en X monde.
    // Ainsi la part sort aussi complètement sur un écran très large ou étroit.
    // Sa gauche doit dépasser le bord droit de 12 % avant toute bouchée.
    right.setFromMatrixColumn(camera.matrixWorld, 0);
    up.setFromMatrixColumn(camera.matrixWorld, 1);
    let distanceRight = 0;
    let distanceUp = 0;
    for (const corner of corners) {
      point
        .copy(corner)
        .applyMatrix4(pizza.slice.matrixWorld)
        .applyMatrix4(camera.matrixWorldInverse);
      const depth = Math.max(0.1, -point.z);
      distanceRight = Math.max(
        distanceRight,
        1.12 * depth * tangent * camera.aspect - point.x,
      );
      distanceUp = Math.max(distanceUp, depth * tangent * 0.28);
    }
    held.position.addScaledVector(right, distanceRight * meal.travel);
    held.position.addScaledVector(up, distanceUp * meal.travel);
    held.updateMatrixWorld(true);

    // Bornes projetées conservatrices : utiles pour vérifier en maintenance
    // que chaque changement de géométrie se produit réellement hors du cadre.
    screenBounds.makeEmpty();
    for (const corner of corners) {
      projected.copy(corner).applyMatrix4(pizza.slice.matrixWorld).project(camera);
      screenBounds.expandByPoint(new THREE.Vector2(projected.x, projected.y));
    }
    canvas.dataset.fullSliceBounds = JSON.stringify([
      screenBounds.min.x,
      screenBounds.min.y,
      screenBounds.max.x,
      screenBounds.max.y,
    ]);
    screenBounds.makeEmpty();
    for (const corner of finalPizzaCorners) {
      projected.copy(corner).project(camera);
      screenBounds.expandByPoint(new THREE.Vector2(projected.x, projected.y));
    }
    canvas.dataset.pizzaBounds = JSON.stringify([
      screenBounds.min.x,
      screenBounds.min.y,
      screenBounds.max.x,
      screenBounds.max.y,
    ]);
    canvas.dataset.crumbs = String(crumbs.visible ? crumbPositions.length : 0);
    canvas.dataset.crumbOpacity = crumbOpacity.toFixed(3);
    canvas.dataset.bite = String(meal.bite);
    canvas.dataset.handPhase = meal.phase;
    canvas.dataset.mealTrip = String(meal.trip);
    canvas.dataset.view =
      overhead > 0.95 || sideView < 0.05
        ? "top"
        : overhead > 0 || sideView < 0.95
          ? "turning"
          : "side";
    requestRender();
  }

  function resize() {
    if (disposed) return;
    const { width, height } = canvas.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
    setProgress(progress);
  }
  function contextLost(event: Event) {
    event.preventDefault();
    onContextLost();
  }
  canvas.addEventListener("webglcontextlost", contextLost);
  resize();
  return {
    setProgress,
    resize,
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      canvas.removeEventListener("webglcontextlost", contextLost);
      pizza.dispose();
      hand.dispose();
      texture.dispose();
      crumbGeometry.dispose();
      crumbMaterials.forEach((material) => material.dispose());
      [floorGeometry, plateGeometry].forEach((geometry) => geometry.dispose());
      [floorMaterial, plateMaterial].forEach((material) => material.dispose());
      renderer.dispose();
    },
  };
}
