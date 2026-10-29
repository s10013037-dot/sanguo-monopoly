import * as T from 'three';
import type {Figure} from './characters';
import {ModelKit} from './models';
import {createLubuPrototype,LUBU_ART_REVISION} from './lubuArt';
// Immutable CPU templates: never added to a renderer. Every instance owns cloned GPU resources.
const templates=new Map<string,T.Object3D>();
const pending=new Map<string,Promise<void>>();
export function preloadLubu(detail:'board'|'display'):Promise<void>{
  if(templates.has(detail))return Promise.resolve();
  if(pending.has(detail))return pending.get(detail)!;
  const url=detail==='display'?new URL('../assets/lubu-display.glb',import.meta.url).href:new URL('../assets/lubu-board.glb',import.meta.url).href;
  const promise=import('three/addons/loaders/GLTFLoader.js').then(async({GLTFLoader})=>{
    const gltf=await new GLTFLoader().loadAsync(url);const model=gltf.scene.getObjectByName('character-lvbu');
    if(model&&model.userData.artRevision!==LUBU_ART_REVISION)throw new Error('呂布模型版本不符，請重新整理以取得最新資產');
    if(!model)throw new Error('呂布 GLB 缺少角色根節點');
    for(const name of ['whole-figure','torso','head','left-arm','right-arm','left-leg','right-leg','left-eye','right-eye','cape','left-brow','right-brow','left-plume','right-plume'])if(!model.getObjectByName(name))throw new Error('呂布 GLB 關節結構不完整：'+name);
    for(const side of ['left-arm','right-arm']){let found=false;model.getObjectByName(side)!.traverse(o=>{if(o.name.startsWith('palm-grip'))found=true;});if(!found)throw new Error('呂布 GLB 缺少掌心握點');}
    templates.set(detail,model);
  }).finally(()=>pending.delete(detail));
  pending.set(detail,promise);return promise;
}
export function instantiateLubu(kit:ModelKit):Figure {
  const template=templates.get(kit.detail);
  if(!template)return createLubuPrototype(kit);
  const root=template.clone(true) as T.Group;
  root.traverse(o=>{if(o instanceof T.Mesh){
    const original=o.geometry;o.geometry=kit.custom('lubu-glb:'+original.uuid,()=>original.clone());
    const cloneMaterial=(m:T.Material)=>{const key='lubu-glb:'+m.uuid;if(!kit.materials.has(key))kit.materials.set(key,m.clone() as T.MeshStandardMaterial);return kit.materials.get(key)!;};
    o.material=Array.isArray(o.material)?o.material.map(cloneMaterial):cloneMaterial(o.material);o.castShadow=true;o.receiveShadow=true;
  }});
  root.userData.source='glb';
  const group=(name:string)=>root.getObjectByName(name)! as T.Group;
  const arms=[group('left-arm'),group('right-arm')],legs=[group('left-leg'),group('right-leg')],eyes=[group('left-eye'),group('right-eye')];
  const grips=arms.map(arm=>{let grip!:T.Group;arm.traverse(o=>{if(o.name.startsWith('palm-grip'))grip=o as T.Group;});return grip;});
  // GLTFLoader may represent empty authored joints as Object3D instead of Group.
  const weapons=grips.flatMap(g=>g.children.filter(c=>c.userData.artRole==='held-weapon')) as T.Group[];
  return {id:'lvbu',root,rig:group('whole-figure'),body:group('torso'),head:group('head'),cape:root.getObjectByName('cape')! as T.Mesh,arms,legs,eyes,grips,weapons,ornaments:{brows:[group('left-brow'),group('right-brow')],plumes:[group('left-plume'),group('right-plume')]}};
}
