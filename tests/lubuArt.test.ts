import {describe,it,expect,vi} from 'vitest';
import {readFile} from 'node:fs/promises';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {ModelKit} from '../src/three/models';
import {createCharacter,animateCharacter} from '../src/three/characters';
import {preloadLubu} from '../src/three/lubuAsset';
import {createLubuPrototype} from '../src/three/lubuArt';
import {disposeScene} from '../src/three/resources';
const asset=async(detail:string)=>new Uint8Array(await readFile(new URL(`../src/assets/lubu-${detail}.glb`,import.meta.url)));

describe('呂布 GLB 樣板交付與關節相容性',()=>{
  it('兩份真實 glTF 2.0 二進位資產均可解碼，含完整關節與厚披風',async()=>{
    for(const detail of ['board','display']){
      const bytes=await asset(detail),header=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
      expect(header.getUint32(0,true)).toBe(0x46546c67);expect(header.getUint32(4,true)).toBe(2);expect(bytes.length).toBeLessThan(detail==='board'?700_000:1_500_000);
      const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length),'');
      try{
        const root=gltf.scene.getObjectByName('character-lvbu')!;expect(root.userData.artRevision).toBe('3.6.0');
        for(const name of ['whole-figure','torso','head','left-arm','right-arm','left-leg','right-leg','left-eye','right-eye','cape'])expect(root.getObjectByName(name),name).toBeTruthy();
        const cape=root.getObjectByName('cape')! as T.Mesh;expect(cape.geometry.attributes.position.count).toBeGreaterThan(200);
        const meshes:T.Mesh[]=[];root.traverse(o=>{if(o instanceof T.Mesh)meshes.push(o);});expect(meshes.length).toBeLessThanOrEqual(65);
        const triangles=meshes.reduce((n,m)=>n+(m.geometry.index?.count??m.geometry.attributes.position.count)/3,0);expect(triangles).toBeLessThan(detail==='board'?22_000:60_000);
        const sourceKit=new ModelKit(detail as 'board'|'display'),source=createLubuPrototype(sourceKit);source.root.updateMatrixWorld(true);root.updateMatrixWorld(true);
        const original=new T.Box3().setFromObject(source.root),loaded=new T.Box3().setFromObject(root);
        expect(loaded.min.distanceTo(original.min)).toBeLessThan(.0001);expect(loaded.max.distanceTo(original.max)).toBeLessThan(.0001);
        disposeScene(source.root);sourceKit.dispose();
      }finally{disposeScene(gltf.scene);}
    }
  });
  it('載入後每次實例皆擁有獨立資源；關閉後重開仍可擺動四肢、眨眼與旋轉',async()=>{
    vi.stubGlobal('ProgressEvent',class extends Event {constructor(type:string,init:ProgressEventInit){super(type);Object.assign(this,init);}});
    const bytes=await asset('board');const fetch=vi.fn(async()=>new Response(bytes,{headers:{'Content-Length':String(bytes.byteLength)}}));vi.stubGlobal('fetch',fetch);
    const kitA=new ModelKit('board'),kitB=new ModelKit('board');
    try{
      await Promise.all([preloadLubu('board'),preloadLubu('board')]);expect(fetch).toHaveBeenCalledTimes(1);
      const a=createCharacter(kitA,'lvbu'),b=createCharacter(kitB,'lvbu');expect(a.root.userData.source).toBe('glb');expect(a.grips).toHaveLength(2);expect(a.grips.every(Boolean)).toBe(true);expect(a.weapons).toHaveLength(1);expect(a.weapons[0].parent).toBe(a.grips[0]);
      const first=(f:typeof a)=>{let mesh!:T.Mesh;f.head.traverse(o=>{if(o instanceof T.Mesh)mesh=o;});return mesh;};
      expect(first(a).geometry).not.toBe(first(b).geometry);expect(first(a).material).not.toBe(first(b).material);
      const disposed=vi.spyOn(first(b).geometry,'dispose');disposeScene(a.root);kitA.dispose();expect(disposed).not.toHaveBeenCalled();
      animateCharacter(b,1,'walk',.125);expect(b.legs[0].rotation.x*b.legs[1].rotation.x).toBeLessThan(0);animateCharacter(b,.075,'idle');expect(b.eyes[0].scale.y).toBeCloseTo(.05);animateCharacter(b,1,'recruit',.4);expect(b.rig.rotation.y).toBeGreaterThan(Math.PI);expect(Number.isFinite(new T.Box3().setFromObject(b.root).max.y)).toBe(true);
      disposeScene(b.root);
    }finally{kitA.dispose();kitB.dispose();vi.unstubAllGlobals();}
  });
  it('呂布兩種細節的護肩與手臂在待機、行走及舉戟時不穿過臉部',()=>{
    for(const detail of ['board','display'] as const){
    const kit=new ModelKit(detail),f=createCharacter(kit,'lvbu');
    try{for(const [motion,t] of [['idle',0],['walk',.125],['walk',.375],['victory',.5],['recruit',.5]] as const){
      animateCharacter(f,1,motion,t);f.root.updateMatrixWorld(true);const inverse=f.head.matrixWorld.clone().invert();let nearest=Infinity;
      for(const arm of f.arms)arm.traverse(o=>{if(o instanceof T.Mesh){const transform=inverse.clone().multiply(o.matrixWorld),attr=o.geometry.attributes.position,index=o.geometry.index,count=index?index.count:attr.count;const triangle=new T.Triangle(),closest=new T.Vector3();for(let i=0;i<count;i+=3){[triangle.a,triangle.b,triangle.c].forEach((v,j)=>{v.fromBufferAttribute(attr,index?index.getX(i+j):i+j).applyMatrix4(transform);v.set(v.x/.34,(v.y+.02)/.333,(v.z-.044)/.282);});triangle.closestPointToPoint(new T.Vector3(),closest);nearest=Math.min(nearest,closest.lengthSq());}}});
      expect(nearest,`${motion} arms/shoulders touch face`).toBeGreaterThan(1);
    }}finally{disposeScene(f.root);kit.dispose();}
    }
  });

});
