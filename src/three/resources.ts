import * as T from 'three';
/** Dispose owned objects once. ModelKit also owns cached geometries not in the scene. */
export function disposeScene(scene:T.Object3D) {
  const geometries=new Set<T.BufferGeometry>();const materials=new Set<T.Material>();const textures=new Set<T.Texture>();
  scene.traverse(o=>{if(o instanceof T.Mesh){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});
  materials.forEach(m=>{const map=(m as T.MeshStandardMaterial).map;if(map)textures.add(map);m.dispose();});
  geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());
}
