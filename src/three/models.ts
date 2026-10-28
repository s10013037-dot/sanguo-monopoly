import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** All models are authored here from reusable geometry; no downloaded model assets. */
export class ModelKit {
  geometries = new Map<string, T.BufferGeometry>();
  materials = new Map<string, T.MeshStandardMaterial>();
  geometry(kind: string) {
    if (!this.geometries.has(kind)) {
      const geometry = kind === 'sphere' ? new T.SphereGeometry(1, 16, 12)
        : kind === 'cone' ? new T.ConeGeometry(1, 1, 6)
        : kind === 'cylinder' ? new T.CylinderGeometry(1, 1, 1, 12)
        : kind === 'torus' ? new T.TorusGeometry(1, .09, 6, 32)
        : new RoundedBoxGeometry(1, 1, 1, 1, .045);
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
export interface Figure { root: T.Group; body: T.Group; arms: T.Group[]; legs: T.Group[]; cape: T.Mesh }
const palettes = [
  ['#469477', '#235a4a', '#e5bd6b', '#253c35'],
  ['#42658e', '#202c49', '#d9b96c', '#20212e'],
  ['#d29a45', '#75482d', '#ffdc83', '#6e432b'],
  ['#8e3d64', '#3e263d', '#d6ac63', '#30232c'],
];
export function createFigure(kit: ModelKit, leader: number): Figure {
  const [robe, dark, gold, hair] = palettes[leader]; const root = new T.Group(); root.name = `hero-${leader}`;
  const body = new T.Group(); root.add(body);
  const heavy = leader === 3 ? 1.13 : 1;
  kit.mesh(body, 'cylinder', dark, [0, .46, 0], [.23 * heavy, .38, .19]);
  kit.ball(body, robe, [0, .54, 0], [.25 * heavy, .27, .19]);
  const cape = kit.ball(body, dark, [0, .45, -.18], [.3, .32, .07]); cape.rotation.x = -.15;
  kit.mesh(body, 'cylinder', gold, [0, .42, 0], [.255 * heavy, .055, .205]);
  kit.box(body, gold, [0, .43, .207], [.085, .07, .035]);
  const trim = kit.box(body, gold, [0, .59, .181], [.035, .26, .025]); trim.rotation.z = .35;
  if (leader !== 0) for (const x of [-.17, .17]) kit.ball(body, gold, [x, .68, .02], [.12, .07, .18]);
  const arms: T.Group[] = []; const legs: T.Group[] = [];
  for (const side of [-1, 1]) {
    const arm = new T.Group(); arm.position.set(side * .28 * heavy, .66, 0); body.add(arm); arms.push(arm);
    kit.ball(arm, robe, [0, -.11, 0], [.095, .17, .1]);
    kit.mesh(arm, 'cylinder', gold, [0, -.22, 0], [.09, .05, .09]);
    kit.ball(arm, '#f6c89b', [0, -.28, .01], [.075, .08, .075]);
    const leg = new T.Group(); leg.position.set(side * .12, .31, 0); root.add(leg); legs.push(leg);
    kit.mesh(leg, 'cylinder', dark, [0, -.1, 0], [.075, .19, .07]);
    kit.ball(leg, '#2c303a', [0, -.23, .035], [.095, .08, .135]);
    kit.box(leg, gold, [0, -.22, .149], [.11, .025, .015]);
  }
  // Large head and small body give a 2–2.5-head-high vinyl-figure silhouette.
  kit.ball(body, hair, [0, 1.02, -.025], [.35, .35, .3]);
  kit.ball(body, '#f6d1ac', [0, .99, .047], [.32, .305, .285]);
  for (const x of [-.32, .32]) kit.ball(body, '#e8b28b', [x, .99, .04], [.055, .09, .065]);
  for (const x of [-.12, .12]) {
    kit.ball(body, '#282833', [x, 1.02, .306], [.026, .043, .013]);
    kit.ball(body, '#ffffff', [x - .007, 1.038, .318], [.009, .012, .006]);
    const brow = kit.box(body, hair, [x, 1.095, .292], [.09, .018, .025]); brow.rotation.z = x * -1.4;
    kit.ball(body, '#eeb49d', [x * 1.5, .94, .285], [.05, .025, .008]);
  }
  kit.ball(body, '#ecb98e', [0, .975, .33], [.028, .033, .025]);
  kit.box(body, '#a56458', [0, .897, .31], [.065, .014, .015]);
  if (leader !== 2) kit.mesh(body, 'cone', hair, [0, .8, .23], [leader === 3 ? .18 : .105, .18, .065]);
  kit.mesh(body, 'cylinder', dark, [0, 1.255, 0], [.34, .13, .27]);
  kit.mesh(body, 'cylinder', gold, [0, 1.23, 0], [.35, .035, .28]);
  if (leader === 0) {
    kit.box(body, dark, [0, 1.38, 0], [.15, .19, .13]);
    kit.ball(body, '#9ee0ab', [0, 1.26, .285], [.055, .06, .025]);
  } else if (leader === 1) {
    kit.box(body, dark, [0, 1.39, 0], [.27, .2, .19]);
    kit.box(body, gold, [0, 1.4, .108], [.035, .15, .018]);
  } else if (leader === 2) {
    for (const x of [-.23, 0, .23]) kit.mesh(body, 'cone', gold, [x, 1.37, 0], [.09, .18, .07]);
    kit.ball(body, '#65c5af', [0, 1.27, .28], [.065, .07, .03]);
  } else {
    for (const x of [-.16, .16]) { const plume = kit.ball(body, '#ce647d', [x, 1.49, -.025], [.065, .24, .05]); plume.rotation.z = -x * 2; }
    kit.ball(body, gold, [0, 1.26, .28], [.07, .06, .035]);
  }
  // Modelled weapons with hilts, blades and guards, attached to animated hands.
  const hand = arms[0];
  const count = leader === 0 ? 2 : 1;
  for (let i = 0; i < count; i++) {
    const weapon = new T.Group(); weapon.position.set(i * .12 - .04, -.24, .08); weapon.rotation.z = -.15 + i * .35; hand.add(weapon);
    kit.mesh(weapon, 'cylinder', dark, [0, -.08, 0], [.024, .16, .024]);
    kit.box(weapon, gold, [0, .02, 0], [.17, .035, .05]);
    kit.box(weapon, '#cedee2', [0, .23, 0], [.055, .4, .022]);
    kit.mesh(weapon, 'cone', '#e4ece8', [0, .46, 0], [.04, .08, .02]);
  }
  if (leader === 3) kit.box(hand, gold, [-.04, .22, .08], [.24, .08, .05]);
  for (const limb of [...arms, ...legs]) batchGroup(limb);
  const exclude = new Set<T.Object3D>([cape]);
  for (const limb of [...arms, ...legs]) limb.traverse(o => exclude.add(o));
  batchGroup(body, exclude);
  root.scale.setScalar(.83); return { root, body, arms, legs, cape };
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

/** Merge only direct static children, preserving every animated joint. */
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
    const copies = meshes.map(m => m.geometry.clone().applyMatrix4(inverse.clone().multiply(m.matrixWorld)));
    const geometry = mergeGeometries(copies); copies.forEach(g => g.dispose());
    if (!geometry) continue;
    const combined = new T.Mesh(geometry, material); combined.castShadow = meshes.some(m => m.castShadow); combined.receiveShadow = true;
    meshes.forEach(m => m.removeFromParent()); group.add(combined);
  }
}
