import * as THREE from "three";

/** Palette et ombres par paliers adaptées du HTML fourni par Lucas.
 * Chaque modèle possède sa rampe pour pouvoir libérer ses propres ressources.
 */
export function cartoonMaterials() {
  const ramp = new THREE.DataTexture(
    new Uint8Array([95, 165, 220, 255]),
    4,
    1,
    THREE.RedFormat,
  );
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter;
  ramp.needsUpdate = true;
  const materials = new Set<THREE.Material>();
  function toon(color: THREE.ColorRepresentation, vertexColors = false) {
    const material = new THREE.MeshToonMaterial({
      color,
      vertexColors,
      gradientMap: ramp,
      side: THREE.DoubleSide,
    });
    materials.add(material);
    return material;
  }
  return {
    toon,
    dispose() {
      materials.forEach((m) => m.dispose());
      ramp.dispose();
    },
  };
}
