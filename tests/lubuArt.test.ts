import {describe,it,expect,vi} from 'vitest';
import {readFile} from 'node:fs/promises';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {ModelKit} from '../src/three/models';
import {createCharacter,animateCharacter} from '../src/three/characters';
import {preloadLubu} from '../src/three/lubuAsset';
import {lubuBlink} from '../src/three/lubuAnimation';
import {createLubuPrototype} from '../src/three/lubuArt';
import {disposeScene} from '../src/three/resources';
const asset=async(detail:string)=>new Uint8Array(await readFile(new URL(`../src/assets/lubu-${detail}.glb`,import.meta.url)));

describe('呂布 GLB 樣板交付與關節相容性',()=>{
  it('兩份真實 glTF 2.0 二進位資產均可解碼，含完整關節與厚披風',async()=>{
    for(const detail of ['board','display']){
      const bytes=await asset(detail),header=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
      expect(header.getUint32(0,true)).toBe(0x46546c67);expect(header.getUint32(4,true)).toBe(2);expect(bytes.length).toBeLessThan(detail==='board'?1_600_000:3_300_000);
      const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length),'');
      try{
        const root=gltf.scene.getObjectByName('character-lvbu')!;expect(root.userData.artRevision).toBe('3.8.0');
        for(const name of ['whole-figure','torso','head','left-arm','right-arm','left-leg','right-leg','left-eye','right-eye','cape'])expect(root.getObjectByName(name),name).toBeTruthy();
        const cape=root.getObjectByName('cape')! as T.Mesh;expect(cape.geometry.attributes.position.count).toBeGreaterThan(200);
        const meshes:T.Mesh[]=[];root.traverse(o=>{if(o instanceof T.Mesh)meshes.push(o);});expect(meshes.length).toBeLessThanOrEqual(75);
        const triangles=meshes.reduce((n,m)=>n+(m.geometry.index?.count??m.geometry.attributes.position.count)/3,0);expect(triangles).toBeLessThan(detail==='board'?42_000:100_000);
        const sourceKit=new ModelKit(detail as 'board'|'display'),source=createLubuPrototype(sourceKit);source.root.updateMatrixWorld(true);root.updateMatrixWorld(true);
        const original=new T.Box3().setFromObject(source.root),loaded=new T.Box3().setFromObject(root);
        const tolerance=original.getSize(new T.Vector3()).length()*.02;
        expect(loaded.min.distanceTo(original.min)).toBeLessThan(tolerance);expect(loaded.max.distanceTo(original.max)).toBeLessThan(tolerance);
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
      animateCharacter(b,1,'walk',.125);expect(b.legs[0].rotation.x*b.legs[1].rotation.x).toBeLessThan(0);animateCharacter(b,2.85,'idle');expect(b.eyes[0].scale.y).toBeLessThanOrEqual(.05);animateCharacter(b,1,'recruit',.6);expect(b.rig.rotation.y).toBeGreaterThan(Math.PI);expect(Number.isFinite(new T.Box3().setFromObject(b.root).max.y)).toBe(true);
      disposeScene(b.root);
    }finally{kitA.dispose();kitB.dispose();vi.unstubAllGlobals();}
  });
  it('呂布兩種細節的護肩與手臂在待機、行走及舉戟時不穿過臉部',()=>{
    for(const detail of ['board','display'] as const){
    const kit=new ModelKit(detail),f=createCharacter(kit,'lvbu');
    try{for(const [motion,t] of [['idle',0],['walk',.125],['walk',.375],['victory',.5],['recruit',.5],['attack',0],['attack',.15],['attack',.3],['attack',.34],['attack',.4],['attack',.5],['attack',.65],['attack',.85]] as const){
      animateCharacter(f,1,motion,t);f.root.updateMatrixWorld(true);const inverse=f.head.matrixWorld.clone().invert();let nearest=Infinity;
      for(const arm of f.arms)arm.traverse(o=>{if(o instanceof T.Mesh){const transform=inverse.clone().multiply(o.matrixWorld),attr=o.geometry.attributes.position,index=o.geometry.index,count=index?index.count:attr.count;const triangle=new T.Triangle(),closest=new T.Vector3();for(let i=0;i<count;i+=3){[triangle.a,triangle.b,triangle.c].forEach((v,j)=>{v.fromBufferAttribute(attr,index?index.getX(i+j):i+j).applyMatrix4(transform);v.set(v.x/.36,(v.y+.02)/.35,(v.z-.035)/.311);});triangle.closestPointToPoint(new T.Vector3(),closest);nearest=Math.min(nearest,closest.lengthSq());}}});
      expect(nearest,`${motion} arms/shoulders touch face`).toBeGreaterThan(1);
    }}finally{disposeScene(f.root);kit.dispose();}
    }
  });

  it('新版模型的頭身比例、八成羽翎、貼合眼片與 PBR 材質可辨識',async()=>{
    const bytes=await asset('display');const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length),'');
    try{const root=gltf.scene.getObjectByName('character-lvbu')!;root.updateMatrixWorld(true);expect(root.userData.meshPipeline).toContain('Blender');
      for(const name of ['left-plume','right-plume'])expect(root.getObjectByName(name)!.scale.x).toBeCloseTo(.8);
      const face=root.getObjectByName('Face_PVC')! as T.Mesh,faceBox=new T.Box3().setFromObject(face),all=new T.Box3().setFromObject(root);
      const ratio=(faceBox.min.y-all.min.y)/(faceBox.max.y-faceBox.min.y);expect(ratio).toBeGreaterThan(1.22);expect(ratio).toBeLessThan(1.38);
      expect((face.material as T.MeshStandardMaterial).vertexColors).toBe(true);expect(face.geometry.getAttribute('color')).toBeTruthy();
      expect(faceBox.max.z-faceBox.min.z).toBeGreaterThan(.45);expect(Math.abs(all.min.y)).toBeLessThan(.005);
      let metal=false,lacquer=false;root.traverse(o=>{if(o instanceof T.Mesh){const m=o.material as T.MeshStandardMaterial;if(m.metalness>.7)metal=true;if(m.name.includes('24252d')&&m.roughness<.35)lacquer=true;}});expect(metal&&lacquer).toBe(true);
    }finally{disposeScene(gltf.scene);}
  });
  it('攻擊有前後不同揮戟姿勢，不規則眨眼及眉毛羽翎跟隨不消耗遊戲亂數',()=>{
    const kit=new ModelKit('board'),f=createCharacter(kit,'lvbu');const random=vi.spyOn(Math,'random').mockImplementation(()=>{throw new Error('人物動畫不可改變骰子亂數');});
    try{animateCharacter(f,1,'attack',.2);const before=f.grips[0].quaternion.clone();animateCharacter(f,1,'attack',.64);expect(before.angleTo(f.grips[0].quaternion)).toBeGreaterThan(.4);
      animateCharacter(f,1,'idle');const plume=f.ornaments!.plumes[0].rotation.z;animateCharacter(f,2,'idle');expect(f.ornaments!.plumes[0].rotation.z).not.toBe(plume);expect(Math.abs(plume)).toBeLessThan(.02);
      expect(lubuBlink(0)).toBe(1);for(const t of [2.85,6.3,6.58,11.2])expect(lubuBlink(t)).toBeLessThan(.05);expect(lubuBlink(4.2)).toBe(1);
      animateCharacter(f,2,'recruit',.4,true);expect(f.rig.rotation.y).toBe(0);expect(f.eyes[0].scale.y).toBe(1);
    }finally{random.mockRestore();disposeScene(f.root);kit.dispose();}
  });

  it('V3.8 匯出的眼片是杏仁形比例，月刃孔洞可真正透射光線',async()=>{
    const bytes=await asset('display'),gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length),'');
    try{gltf.scene.updateMatrixWorld(true);const eye=gltf.scene.getObjectByName('Eye_White_Almond')! as T.Mesh;expect(eye).toBeTruthy();eye.geometry.computeBoundingBox();const size=eye.geometry.boundingBox!.getSize(new T.Vector3());expect(size.x/size.y).toBeGreaterThan(1.4);
      const blade=gltf.scene.getObjectByName('MoonBlade_Pierced')! as T.Mesh;expect(blade).toBeTruthy();
      const cast=(x:number,y:number)=>{const origin=blade.localToWorld(new T.Vector3(x,y,.2)),target=blade.localToWorld(new T.Vector3(x,y,-.2));return new T.Raycaster(origin,target.sub(origin).normalize()).intersectObject(blade,false);};
      expect(cast(.16,.78)).toHaveLength(0);expect(cast(.29,.90).length).toBeGreaterThan(0);
    }finally{disposeScene(gltf.scene);}
  });

});
