import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { cartoonMaterials } from "./materials";

/** Pizza adaptée du fichier « One slice. One gesture.html » fourni par Lucas.
 * Profil de croûte tourné, fromage bombé et garniture géométrique conservés.
 * Les éléments sont fusionnés par matière et séparés en sept parts fixes / une mobile.
 */
export function createPizza() {
  const palette = cartoonMaterials();
  const M = palette.toon;
  const doughM = M(0xe8b872),
    crustM = M(0xe5a247),
    cheeseM = M(0xffd363),
    blobM = M(0xffdf81),
    sauceM = M(0xd23a22),
    pepM = M(0xd85545),
    spotM = M(0x7a1d14),
    basilM = M(0x63965a),
    scorchM = M(0xb0642a),
    herbM = M(0x2f6a22);
  const INK = new THREE.MeshBasicMaterial({ color: 0x483127, side: THREE.BackSide });
  // Le semis reste identique au rechargement et au scroll arrière.
  let seed = 24819;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const prof = [[0.001, 0]];
  for (let k = 0; k <= 32; k++) {
    const t = -Math.PI / 2 + (k / 32) * 1.5 * Math.PI;
    prof.push([1.94 + 0.23 * Math.cos(t), 0.17 + 0.17 * Math.sin(t)]);
  }
  prof.push([0.001, 0.17]);
  const pts = prof.map((p) => new THREE.Vector2(p[0], p[1])),
    shape = new THREE.Shape(pts);
  const off = (3 * Math.PI) / 8,
    gap = 0.012,
    len = Math.PI / 4 - 2 * gap,
    rnd = (a: number, b: number) => a + random() * (b - a);
  function mk(g: THREE.BufferGeometry, m: THREE.Material, y?: number, sh?: number) {
    const o = new THREE.Mesh(g, m);
    o.castShadow = sh !== 0;
    o.receiveShadow = true;
    if (y !== undefined) o.position.y = y;
    return o;
  }
  function crustGeo(angle: number) {
    return new THREE.LatheGeometry(pts, 32, angle, len);
  }
  function buildSlice(i: number) {
    const g = new THREE.Group(),
      ts = (i * Math.PI) / 4 + off + gap,
      tc = ts + len / 2,
      P = (rr: number, a: number) => [rr * Math.sin(a), 0, rr * Math.cos(a)];
    const cr = mk(crustGeo(ts), crustM);
    g.add(cr);

    [ts, ts + len].forEach((a) =>
      g.add(mk(new THREE.ShapeGeometry(shape).rotateY(a - Math.PI / 2), doughM)),
    );
    g.add(
      mk(new THREE.CylinderGeometry(1.8, 1.8, 0.05, 22, 1, false, ts, len), sauceM, 0.19),
    );
    g.add(
      mk(
        new THREE.CylinderGeometry(1.68, 1.68, 0.08, 22, 1, false, ts, len),
        cheeseM,
        0.21,
      ),
    );
    for (let k = 0; k < 3; k++) {
      const o = mk(new THREE.SphereGeometry(1, 24, 16), blobM, 0.25, 0);
      o.scale.set(rnd(0.22, 0.34), 0.065, rnd(0.22, 0.34));
      const q = P(rnd(0.4, 1.6), ts + rnd(0.1, len - 0.1));
      o.position.set(q[0], 0.25, q[2]);
      g.add(o);
    }
    for (let k = 0; k < 3; k++) {
      const o = mk(
        new THREE.CylinderGeometry(rnd(0.05, 0.1), rnd(0.05, 0.1), 0.01, 8),
        scorchM,
        0.262,
        0,
      );
      const q = P(rnd(0.4, 1.6), ts + rnd(0.1, len - 0.1));
      o.position.set(q[0], 0.262, q[2]);
      g.add(o);
    }
    for (let k = 0; k < 2; k++) {
      const o = mk(new THREE.BoxGeometry(0.05, 0.012, 0.022), herbM, 0.27, 0);
      const q = P(rnd(0.3, 1.65), ts + rnd(0.05, len - 0.05));
      o.position.set(q[0], 0.27, q[2]);
      o.rotation.y = rnd(0, 3);
      g.add(o);
    }
    [
      [1.05, -0.1],
      [1.5, 0.12],
    ].forEach(([rr, da]) => {
      const p = new THREE.Group(),
        q = P(rr, tc + da);
      p.position.set(q[0], 0.27, q[2]);
      const d = mk(new THREE.SphereGeometry(1, 28, 16), pepM, 0);
      d.scale.set(0.3, 0.055, 0.3);
      p.add(d);
      for (let k = 0; k < 4; k++) {
        const s = mk(new THREE.CylinderGeometry(0.04, 0.04, 0.01, 8), spotM, 0.054, 0);
        s.position.x = rnd(-0.15, 0.15);
        s.position.z = rnd(-0.15, 0.15);
        p.add(s);
      }
      g.add(p);
    });
    [
      [0.72, 0.05],
      [1.25, -0.18],
    ].forEach(([rr, da]) => {
      const b = mk(new THREE.SphereGeometry(1, 24, 16), basilM, 0.28);
      b.scale.set(0.27, 0.065, 0.145);
      const q = P(rr, tc + da);
      b.position.set(q[0], 0.28, q[2]);
      b.rotation.y = rnd(0, 3);
      g.add(b);
    });
    return g;
  }

  const group = new THREE.Group(),
    slice = buildSlice(0);
  group.name = "Pizza cartoon — modèle du fichier fourni";
  group.add(slice);
  const fixed = new THREE.Group();
  group.add(fixed);
  for (let i = 1; i < 8; i++) fixed.add(buildSlice(i));
  const geometries = new Set<THREE.BufferGeometry>();
  // Fusionner les petits ingrédients limite le coût du rendu sur téléphone.
  for (const parent of [fixed, slice]) {
    parent.updateMatrixWorld(true);
    const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
    parent.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const geometry = object.geometry.clone().applyMatrix4(object.matrixWorld);
      // Contour en unités de scène : sa finesse reste constante même sur les
      // ingrédients aplatis. Les formes dessinées se lisent sans ombres réalistes.
      if (
        [crustM, cheeseM, pepM, basilM].includes(
          object.material as THREE.MeshToonMaterial,
        )
      ) {
        const ink = geometry.index ? geometry.toNonIndexed() : geometry.clone();
        const position = ink.attributes.position,
          normal = ink.attributes.normal;
        for (let i = 0; i < position.count; i++)
          position.setXYZ(
            i,
            position.getX(i) + normal.getX(i) * 0.012,
            position.getY(i) + normal.getY(i) * 0.012,
            position.getZ(i) + normal.getZ(i) * 0.012,
          );
        const outlineBatch = batches.get(INK) ?? [];
        outlineBatch.push(ink);
        batches.set(INK, outlineBatch);
      }
      const flat = geometry.index ? geometry.toNonIndexed() : geometry;
      if (flat !== geometry) geometry.dispose();
      if (!flat.attributes.uv)
        flat.setAttribute(
          "uv",
          new THREE.Float32BufferAttribute(
            new Float32Array(flat.attributes.position.count * 2),
            2,
          ),
        );
      if (!flat.attributes.color)
        flat.setAttribute(
          "color",
          new THREE.Float32BufferAttribute(
            new Float32Array(flat.attributes.position.count * 3).fill(1),
            3,
          ),
        );
      const material = object.material as THREE.Material;
      const batch = batches.get(material) ?? [];
      batch.push(flat);
      batches.set(material, batch);
      object.geometry.dispose();
    });
    parent.clear();
    for (const [material, parts] of batches) {
      for (const part of parts) {
        const count = part.attributes.position.count;
        if (!part.attributes.uv)
          part.setAttribute(
            "uv",
            new THREE.Float32BufferAttribute(new Float32Array(count * 2), 2),
          );
        if (!part.attributes.color)
          part.setAttribute(
            "color",
            new THREE.Float32BufferAttribute(new Float32Array(count * 3).fill(1), 3),
          );
      }
      const geometry = mergeGeometries(parts, false)!;
      parts.forEach((g) => g.dispose());
      geometries.add(geometry);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = material !== INK;
      mesh.receiveShadow = false;
      mesh.frustumCulled = false;
      parent.add(mesh);
    }
  }
  const flexible = slice.children.map((child) => {
    const geometry = (child as THREE.Mesh).geometry;
    return {
      geometry,
      rest: geometry.attributes.position.array.slice(),
      normals: geometry.attributes.normal.array.slice(),
    };
  });
  let lastFlex = -1;
  return {
    group,
    slice,
    setBite(index: number) {
      slice.visible = index < 5;
    },
    setFlex(amount: number) {
      if (Math.abs(lastFlex - amount) < 0.0001) return;
      lastFlex = amount;
      for (const { geometry, rest, normals } of flexible) {
        const position = geometry.attributes.position,
          normal = geometry.attributes.normal;
        for (let i = 0; i < position.count; i++) {
          const j = i * 3,
            d = THREE.MathUtils.clamp((1.55 - rest[j]) / 1.55, 0, 1);
          position.setY(i, rest[j + 1] - 0.18 * amount * d * d);
          const nx = normals[j] - ((0.36 * amount * d) / 1.55) * normals[j + 1],
            ny = normals[j + 1],
            nz = normals[j + 2],
            length = Math.hypot(nx, ny, nz) || 1;
          normal.setXYZ(i, nx / length, ny / length, nz / length);
        }
        position.needsUpdate = normal.needsUpdate = true;
      }
    },
    dispose() {
      geometries.forEach((g) => g.dispose());
      palette.dispose();
      INK.dispose();
    },
  };
}
