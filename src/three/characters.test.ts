import {describe,it,expect,vi} from 'vitest';
import * as T from 'three';
import {LEADER_IDS,GENERAL_IDS,CHARACTERS} from '../characterCatalog';
import {ModelKit} from './models';
import {createCharacter,animateCharacter,CHIBI_PROPORTIONS} from './characters';
import {disposeScene} from './resources';
describe('可擴充的角色模型與視覺動畫',()=>{
  it('八位專屬模型具有四肢、頭部、武器與不同幾何輪廓',()=>{
    const fingerprints=new Set<string>();
    for(const id of [...LEADER_IDS,...GENERAL_IDS.slice(0,4)]){
      const kit=new ModelKit('board');const f=createCharacter(kit,id);
      try{
        expect(f.arms).toHaveLength(2);expect(f.legs).toHaveLength(2);expect(f.eyes).toHaveLength(2);expect(f.weapons.length).toBeGreaterThan(0);expect(f.weapons.every(w=>w.children.length>0)).toBe(true);expect(f.head.parent).toBe(f.body);expect(CHARACTERS[id].dedicated).toBe(true);
        f.root.updateMatrixWorld(true);const box=new T.Box3().setFromObject(f.root);expect(box.min.y).toBeGreaterThan(-.08);expect(box.max.y).toBeGreaterThan(1.1);
        let vertices=0;f.root.traverse(o=>{if(o instanceof T.Mesh)vertices+=o.geometry.attributes.position.count;});fingerprints.add(`${vertices}:${box.max.x.toFixed(3)}:${box.max.y.toFixed(3)}`);
      }finally{disposeScene(f.root);kit.dispose();}
    }
    expect(fingerprints.size).toBe(8);
  });
  it('其餘武將明確使用通用模型，不宣稱專屬造型',()=>{for(const id of GENERAL_IDS.slice(4))expect(CHARACTERS[id].dedicated).toBe(false);});
  it('眨眼、左右腳相反擺動、勝利和減少動態效果可靠，無遊戲亂數',()=>{
    const kit=new ModelKit();const f=createCharacter(kit,'liubei');
    try{
      const random=vi.spyOn(Math,'random').mockImplementation(()=>{throw new Error('動畫不可消耗規則亂數');});
      try{animateCharacter(f,.075,'idle');expect(f.eyes[0].scale.y).toBeCloseTo(.05);animateCharacter(f,1,'walk',.125);expect(f.legs[0].rotation.x*f.legs[1].rotation.x).toBeLessThan(0);animateCharacter(f,1,'victory',.5);expect(f.arms[0].position.y).toBeGreaterThan(.9);expect(f.arms[1].position.y).toBeGreaterThan(.9);animateCharacter(f,1,'idle',0,true);expect(f.eyes[0].scale.y).toBe(1);expect(f.legs[0].rotation.x).toBe(0);}finally{random.mockRestore();}
    }finally{disposeScene(f.root);kit.dispose();}
  });
  it('展示模型比棋盤模型細緻，棋盤保留較低細節',()=>{
    const low=new ModelKit('board'),high=new ModelKit('display');const a=createCharacter(low,'lvbu'),b=createCharacter(high,'lvbu');
    const count=(root:T.Object3D)=>{let n=0;root.traverse(o=>{if(o instanceof T.Mesh)n+=o.geometry.attributes.position.count;});return n;};
    try{expect(count(b.root)).toBeGreaterThan(count(a.root));}finally{disposeScene(a.root);disposeScene(b.root);low.dispose();high.dispose();}
  });
  it('統一約兩頭身，所有角色的武器固定在掌心且常用姿勢不穿過臉部',()=>{
    const ratio=(CHIBI_PROPORTIONS.headCenterY+CHIBI_PROPORTIONS.headRadiusY)/(2*CHIBI_PROPORTIONS.headRadiusY);
    expect(ratio).toBeGreaterThanOrEqual(2);expect(ratio).toBeLessThanOrEqual(2.5);
    for(const id of [...LEADER_IDS,...GENERAL_IDS.slice(0,4)]){
      const kit=new ModelKit('board'),f=createCharacter(kit,id);
      try{
        for(const [motion,progress] of [['idle',0],['walk',.125],['walk',.375],['victory',.25],['victory',.5],['victory',.75],['recruit',.5]] as const){
          animateCharacter(f,1,motion,progress);f.root.updateMatrixWorld(true);
          const inverseHead=f.head.matrixWorld.clone().invert();
          for(const weapon of f.weapons){
            expect(weapon.parent?.name).toBe('palm-grip');expect(weapon.position.length()).toBeLessThan(.01);
            let nearest=Infinity;
            weapon.traverse(o=>{if(o instanceof T.Mesh){const transform=inverseHead.clone().multiply(o.matrixWorld);const attr=o.geometry.attributes.position,index=o.geometry.index;const count=index?index.count:attr.count;const triangle=new T.Triangle(),origin=new T.Vector3(),closest=new T.Vector3();
              for(let i=0;i<count;i+=3){
                [triangle.a,triangle.b,triangle.c].forEach((v,j)=>{v.fromBufferAttribute(attr,index?index.getX(i+j):i+j).applyMatrix4(transform);v.set(v.x/.335,(v.y+.02)/.315,(v.z-.045)/.29);});
                triangle.closestPointToPoint(origin,closest);nearest=Math.min(nearest,closest.lengthSq());
              }
            }});
            expect(nearest,`${id} ${motion}: blade/shaft penetrates face`).toBeGreaterThan(1);
          }
        }
      }finally{disposeScene(f.root);kit.dispose();}
    }
  });
  it('招募時全身旋轉，待機會歸位，並遵守減少動態效果',()=>{
    const kit=new ModelKit(),f=createCharacter(kit,'zhaoyun');
    try{animateCharacter(f,1,'recruit',.4);expect(f.rig.rotation.y).toBeGreaterThan(Math.PI);expect(f.legs[0].parent).toBe(f.rig);animateCharacter(f,1,'idle');expect(f.rig.rotation.y).toBe(0);animateCharacter(f,1,'recruit',.4,true);expect(f.rig.rotation.y).toBe(0);}finally{disposeScene(f.root);kit.dispose();}
  });

});
