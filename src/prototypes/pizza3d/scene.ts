import * as THREE from "three";
import { createPizza } from "./pizza";
import { createHand } from "./hand";
import { easeRange, mealPose } from "./choreography";

export type PizzaScene = {
  setProgress: (progress: number) => void;
  resize: () => void;
  dispose: () => void;
};

const clamp = THREE.MathUtils.clamp;
const mix = THREE.MathUtils.lerp;
/**
 * Scène volontairement séparée du site : aucun asset 3D tiers ni modèle à installer.
 * La pizza réutilise sa texture existante ; seuls lumière, géométrie et geste changent.
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

  const texture = await new THREE.TextureLoader()
    .loadAsync(`${import.meta.env.BASE_URL}assets/atelier-pizza-whole.webp`)
    .catch((error) => {
      renderer.dispose();
      throw error;
    });
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const pizza = createPizza(texture);
  scene.add(pizza.group);
  const hand = createHand();
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
    const enter = easeRange(progress, 0.13, 0.31);
    const grip = easeRange(progress, 0.29, 0.4);
    const lift = easeRange(progress, 0.41, 0.61);
    const meal = mealPose(progress);
    const sideView = easeRange(progress, 0.44, 0.64);
    // Conserver une largeur de plateau constante, même sur un téléphone de 320 px.
    const phoneDistance =
      5 / (2 * Math.tan(THREE.MathUtils.degToRad(17)) * camera.aspect);
    const sideScale = (phoneDistance / 17.8) * 1.08;
    pizza.setBite(meal.bite);
    hand.setGrip(grip * (1 - meal.release * 0.55));
    hand.group.position.set(mix(8, 2.65, enter), 0.5, 0);
    hand.group.rotation.z = mix(-0.06, 0, grip);
    hand.group.visible = progress > 0.12;
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
    canvas.dataset.bite = String(meal.bite);
    canvas.dataset.handPhase = meal.phase;
    canvas.dataset.mealTrip = String(meal.trip);
    canvas.dataset.view = sideView > 0.95 ? "side" : sideView < 0.05 ? "top" : "turning";
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
      [floorGeometry, plateGeometry].forEach((geometry) => geometry.dispose());
      [floorMaterial, plateMaterial].forEach((material) => material.dispose());
      renderer.dispose();
    },
  };
}
