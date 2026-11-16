import * as THREE from "three";
import { createPizza } from "./pizza";
import { createHand } from "./hand";

export type PizzaScene = {
  setProgress: (progress: number) => void;
  resize: () => void;
  dispose: () => void;
};

const clamp = THREE.MathUtils.clamp;
const mix = THREE.MathUtils.lerp;
/** Interpolation déterministe : chaque pose dépend uniquement du scroll. */
function easeRange(progress: number, from: number, to: number) {
  const t = clamp((progress - from) / (to - from), 0, 1);
  return t * t * (3 - 2 * t);
}

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

  // Quelques miettes géométriques, calculées avec la même progression que la part.
  // Pas de particules physiques ni de tirage aléatoire pendant le défilement.
  const crumbGeometry = new THREE.TetrahedronGeometry(0.032);
  const crumbMaterial = new THREE.MeshStandardMaterial({
    color: "#b67832",
    roughness: 1,
  });
  const crumbs = Array.from({ length: 9 }, (_, index) => {
    const crumb = new THREE.Mesh(crumbGeometry, crumbMaterial);
    crumb.scale.setScalar(0.65 + (index % 3) * 0.28);
    crumb.visible = false;
    scene.add(crumb);
    return crumb;
  });
  const biteTimes = [0.7, 0.745, 0.79, 0.835, 0.88];
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
    const exit = easeRange(progress, 0.9, 0.97);
    const sideView = easeRange(progress, 0.44, 0.64);
    // Conserver une largeur de plateau constante, même sur un téléphone de 320 px.
    const phoneDistance =
      5 / (2 * Math.tan(THREE.MathUtils.degToRad(17)) * camera.aspect);
    const sideScale = (phoneDistance / 17.8) * 1.08;
    const bite = biteTimes.filter((time) => progress >= time).length;
    pizza.setBite(bite);
    hand.setGrip(grip);
    hand.group.position.set(mix(8, 2.65, enter), 0.5, 0);
    hand.group.rotation.z = mix(-0.06, 0, grip);
    hand.group.visible = progress > 0.12 && progress < 0.98;
    held.position.set(lift * 0.3 + exit * 6, lift * 1.35 + exit * 0.9, lift * -0.1);
    held.rotation.z = lift * 0.075;

    // Un petit recul à chaque bouchée suggère le croc hors champ, sans bouche.
    const lastBite = biteTimes[Math.max(0, bite - 1)];
    const recoil = bite > 0 ? Math.max(0, 1 - (progress - lastBite) / 0.033) : 0;
    held.position.x += recoil * 0.11;
    held.position.y += recoil * 0.055;
    const crumbPhase = bite > 0 ? (progress - lastBite) / 0.045 : 2;
    crumbs.forEach((crumb, index) => {
      crumb.visible = crumbPhase >= 0 && crumbPhase < 1;
      if (!crumb.visible) return;
      const fan = (index - 4) * 0.12;
      crumb.position.set(
        held.position.x + 0.3 + bite * 0.26 + fan * crumbPhase,
        held.position.y + 0.18 - crumbPhase * crumbPhase * 1.1,
        held.position.z + fan * 0.45 + (index % 2 ? 1 : -1) * crumbPhase * 0.18,
      );
      crumb.rotation.set(index + crumbPhase * 3, crumbPhase * 4, index * 0.6);
    });

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
    canvas.dataset.bite = String(bite);
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
      [floorGeometry, plateGeometry, crumbGeometry].forEach((geometry) =>
        geometry.dispose(),
      );
      [floorMaterial, plateMaterial, crumbMaterial].forEach((material) =>
        material.dispose(),
      );
      renderer.dispose();
    },
  };
}
