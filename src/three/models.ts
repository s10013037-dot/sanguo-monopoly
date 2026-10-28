import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** All models are authored here from reusable geometry; no downloaded model assets. */
export class ModelKit {
  geometries = new Map<string, T.BufferGeometry>();
  materials = new Map<string, T.MeshStandardMaterial>();
  constructor(readonly detail: 'board'|'display' = 'board') {}
  custom(key:string, create:()=>T.BufferGeometry) { if(!this.geometries.has(key))this.geometries.set(key,create());return this.geometries.get(key)!; }
  geometry(kind: string) {
    if (!this.geometries.has(kind)) {
      const geometry = kind === 'sphere' ? new T.SphereGeometry(1, this.detail==='display'?32:16, this.detail==='display'?24:12)
        : kind === 'cone' ? new T.ConeGeometry(1, 1, 6)
        : kind === 'cylinder' ? new T.CylinderGeometry(1, 1, 1, this.detail==='display'?24:12)
        : kind === 'torus' ? new T.TorusGeometry(1, .09, 6, 32)
        : new RoundedBoxGeometry(1, 1, 1, this.detail==='display'?2:1, .065);
      this.geometries.set(kind, geometry);
    }
    return this.geometries.get(kind)!;
  }
  material(color: string, metal = false) {
    const key = color + metal;
    if (!this.materials.has(key)) this.materials.set(key, new T.MeshStandardMaterial({ color, roughness: metal ? .4 : .78, metalness: metal ? .45 : .04 }));
    return this.materials.get(key)!;
  }
  mesh(parent: T.Object3D, kind: string, color: string, position: number[], scale: number[], metal = false) {
    const mesh = new T.Mesh(this.geometry(kind), this.material(color, metal));
    mesh.position.set(position[0], position[1], position[2]); mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  box(p: T.Object3D, c: string, xyz: number[], size: number[]) { return this.mesh(p, 'box', c, xyz, size); }
  ball(p: T.Object3D, c: string, xyz: number[], size: number[]) { return this.mesh(p, 'sphere', c, xyz, size); }
  dispose() { this.geometries.forEach(g => g.dispose()); this.materials.forEach(m => m.dispose()); }
}
export function city(kit: ModelKit, parent: T.Object3D, variant: number, scale = 1) {
  const g = new T.Group(); g.scale.setScalar(scale); parent.add(g);
  const roof = ['#467d74', '#536c98', '#a95646', '#87608b'][variant % 4];
  kit.box(g, '#ded1b1', [0, .17, 0], [1.08, .32, .62]);
  for (const x of [-.46, .46]) {
    kit.box(g, '#c4bca2', [x, .3, 0], [.23, .58, .66]);
    const top = kit.mesh(g, 'cone', roof, [x, .68, 0], [.25, .25, .4]); top.rotation.y = Math.PI / 4;
  }
  kit.box(g, '#635f50', [0, .16, .324], [.2, .29, .018]);
  for (let i = -2; i <= 2; i++) kit.box(g, '#e7d9b5', [i * .15, .38, .22], [.09, .13, .15]);
  kit.box(g, '#e2c8a0', [0, .49, -.06], [.45, .43, .43]);
  const roofMesh = kit.mesh(g, 'cone', roof, [0, .82, -.06], [.46, .3, .4]); roofMesh.rotation.y = Math.PI / 4;
  if (variant % 3 === 0) {
    kit.box(g, '#e4d0a5', [0, .91, -.06], [.27, .26, .29]);
    const r = kit.mesh(g, 'cone', roof, [0, 1.12, -.06], [.34, .2, .32]); r.rotation.y = Math.PI / 4;
  }
  flag(kit, g, .32, .7, -.2, variant % 2 ? '#d5a249' : '#bc5a59'); return g;
}
export function flag(kit: ModelKit, g: T.Object3D, x: number, y: number, z: number, color: string) {
  kit.mesh(g, 'cylinder', '#795b40', [x, y, z], [.017, .85, .017]);
  const f = kit.box(g, color, [x + .15, y + .28, z], [.3, .2, .025]); f.rotation.z = -.08;
  kit.box(g, '#e6bb66', [x + .15, y + .28, z + .015], [.024, .14, .01]); return f;
}
export function tileDecoration(kit: ModelKit, g: T.Group, kind: string, variant: number) {
  if (kind === 'recruit') { city(kit, g, variant, .82); return; }
  if (kind === 'money') {
    kit.box(g, '#95683c', [-.15, .22, 0], [.65, .4, .42]);
    kit.mesh(g, 'cylinder', '#a57640', [-.15, .44, 0], [.21, .65, .21]).rotation.z = Math.PI / 2;
    for (const x of [-.36, .04]) kit.box(g, '#e5b755', [x, .29, .23], [.065, .43, .02]);
    kit.box(g, '#eac664', [-.15, .3, .25], [.08, .12, .035]);
    for (let i = 0; i < 3; i++) kit.mesh(g, 'cylinder', '#edc65d', [.39, .07 + i * .07, .16], [.15, .06, .15], true);
    for (const z of [-.28, 0]) kit.ball(g, '#cbbd82', [.39, .16, z - .2], [.15, .2, .14]);
  } else if (kind === 'battle') {
    kit.mesh(g, 'cone', '#ba735a', [-.18, .28, -.15], [.46, .56, .42]).rotation.y = Math.PI / 4;
    kit.box(g, '#674b45', [-.18, .1, .13], [.15, .2, .02]); flag(kit, g, .4, .48, -.25, '#a63c48');
    for (const side of [-1, 1]) { const s = kit.box(g, '#d1dce0', [side * .15, .3, .32], [.05, .6, .03]); s.rotation.z = side * -.6; }
    kit.mesh(g, 'cylinder', '#887461', [.3, .1, .34], [.14, .16, .14]);
  } else if (kind === 'event') {
    kit.box(g, '#87978f', [0, .07, 0], [.64, .14, .52]);
    kit.box(g, '#a9c1b4', [0, .39, -.05], [.38, .55, .16]).rotation.z = -.08;
    for (let i = 0; i < 3; i++) kit.box(g, '#e9d793', [0, .24 + i * .12, .04], [.15, .025, .025]);
    kit.box(g, '#f0d8a3', [.35, .18, .22], [.32, .03, .25]).rotation.z = -.12;
    for (const z of [.08, .36]) kit.mesh(g, 'cylinder', '#b79861', [.35, .2, z], [.035, .35, .035]).rotation.z = Math.PI / 2;
  } else {
    for (const side of [-1, 1]) {
      kit.mesh(g, 'cylinder', '#826849', [side * .35, .29, -.1], [.06, .58, .06]);
      kit.ball(g, '#e9a7b6', [side * .35, .7, -.1], [.32, .29, .28]);
      kit.ball(g, '#f5c5c7', [side * .5, .79, -.06], [.2, .18, .2]);
    }
    kit.box(g, '#c39d67', [0, .12, .18], [.35, .1, .3]);
  }
}

/** Merge static descendants by material; callers exclude animated joints. */
export function batchGroup(group: T.Object3D, exclude = new Set<T.Object3D>()) {
  group.updateWorldMatrix(true, true);
  const inverse = group.matrixWorld.clone().invert();
  const batches = new Map<T.Material, T.Mesh[]>();
  group.traverse(o => {
    if (!(o instanceof T.Mesh) || o instanceof T.InstancedMesh || exclude.has(o) || Array.isArray(o.material)) return;
    const list = batches.get(o.material) ?? []; list.push(o); batches.set(o.material, list);
  });
  for (const [material, meshes] of batches) {
    if (meshes.length < 2) continue;
    const copies = meshes.map(m => {
      const transformed=m.geometry.clone().applyMatrix4(inverse.clone().multiply(m.matrixWorld));
      // Extruded weapons are non-indexed, while spheres/tubes are indexed. Normalize before merging.
      if(transformed.index){const plain=transformed.toNonIndexed();transformed.dispose();return plain;}
      return transformed;
    });
    const geometry = mergeGeometries(copies); copies.forEach(g => g.dispose());
    if (!geometry) continue;
    const combined = new T.Mesh(geometry, material); combined.castShadow = meshes.some(m => m.castShadow); combined.receiveShadow = true;
    meshes.forEach(m => m.removeFromParent()); group.add(combined);
  }
}
