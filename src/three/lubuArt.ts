import * as T from 'three';
import {ModelKit,batchGroup} from './models.ts';
import type {Figure} from './characters.ts';

/** Authored for this project. Curved, closed surfaces; no downloaded models or image billboards. */
export const LUBU_ART_REVISION='3.6.0';
const C={skin:'#f1c6a3',cheek:'#db9d8c',hair:'#33251f',hairLight:'#52382b',black:'#24232b',red:'#8e2632',scarlet:'#c83d43',gold:'#c99c50',goldLight:'#ebc780',steel:'#bcc8ce',eye:'#89352f',cloth:'#7c2533'};
const v=(p:number[])=>new T.Vector3(p[0],p[1],p[2]);
export function createLubuPrototype(kit:ModelKit):Figure {
  const high=kit.detail==='display';let serial=0;
  const root=new T.Group();root.name='character-lvbu';root.scale.setScalar(.8);
  root.userData={characterId:'lvbu',dedicated:true,artRevision:LUBU_ART_REVISION,source:'authored-surfaces',headBodyRatio:2.1};
  const rig=new T.Group();rig.name='whole-figure';root.add(rig);
  const body=new T.Group();body.name='torso';rig.add(body);
  const head=new T.Group();head.name='head';head.position.y=1.08;body.add(head);
  const arms:T.Group[]=[],legs:T.Group[]=[],eyes:T.Group[]=[],grips:T.Group[]=[],weapons:T.Group[]=[];
  function material(color:string,finish:'vinyl'|'cloth'|'leather'|'satin-metal'='vinyl'){return kit.surface(color,finish);}
  function mesh(parent:T.Object3D,geo:T.BufferGeometry,color:string,finish:'vinyl'|'cloth'|'leather'|'satin-metal'='vinyl',name=''){
    if(!geo.getAttribute('uv'))geo.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(geo.attributes.position.count*2),2));
    const m=new T.Mesh(geo,material(color,finish));m.castShadow=true;m.receiveShadow=true;m.name=name;parent.add(m);return m;
  }
  function ball(parent:T.Object3D,color:string,pos:number[],scale:number[],finish:'vinyl'|'cloth'|'leather'|'satin-metal'='vinyl'){
    const m=mesh(parent,kit.custom('lubu-round-detail',()=>new T.SphereGeometry(1,high?20:12,high?14:8)),color,finish);m.position.copy(v(pos));m.scale.copy(v(scale));return m;
  }
  // Tapered swept volume with a smooth elliptical cross-section. Used for sculpted locks and feather vanes.
  function leaf(parent:T.Object3D,points:number[][],width:number,depth:number,color:string,normal=new T.Vector3(0,0,1),finish:'vinyl'|'cloth'|'leather'|'satin-metal'='vinyl',name=''){
    const curve=new T.CatmullRomCurve3(points.map(v));const length=high?12:7,around=high?8:6;
    const geo=kit.custom('lubu-leaf-'+serial++,()=>{
      const positions:number[]=[],indices:number[]=[];
      for(let i=0;i<=length;i++){
        const t=i/length,p=curve.getPoint(t),tangent=curve.getTangent(t).normalize();
        const across=new T.Vector3().crossVectors(tangent,normal).normalize();const out=new T.Vector3().crossVectors(across,tangent).normalize();
        const profile=.025+Math.pow(Math.sin(Math.PI*t),.65)*(1-t*.25);
        for(let j=0;j<=around;j++){const a=j/around*Math.PI*2;const q=p.clone().addScaledVector(across,Math.cos(a)*width*profile).addScaledVector(out,Math.sin(a)*depth*profile);positions.push(q.x,q.y,q.z);}
      }
      for(let i=0;i<length;i++)for(let j=0;j<around;j++){const a=i*(around+1)+j,b=a+around+1;indices.push(a,b,a+1,a+1,b,b+1);}
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
    });return mesh(parent,geo,color,finish,name);
  }
  function line(parent:T.Object3D,points:number[][],radius:number,color:string,finish:'vinyl'|'cloth'|'leather'|'satin-metal'='satin-metal'){
    return mesh(parent,kit.custom('lubu-line-'+serial++,()=>new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v)),high?12:7,radius,high?5:4,false)),color,finish);
  }
  function plate(parent:T.Object3D,outline:number[][],pos:number[],color:string,depth=.025,bevel=.012){
    const g=kit.custom('lubu-plate-'+serial++,()=>{const shape=new T.Shape();shape.moveTo(outline[0][0],outline[0][1]);for(let i=1;i<outline.length;i++)shape.lineTo(outline[i][0],outline[i][1]);shape.closePath();const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:high?2:1,steps:1,bevelSize:bevel,bevelThickness:bevel});g.translate(0,0,-depth/2);return g;});
    const m=mesh(parent,g,color,'satin-metal');m.position.copy(v(pos));return m;
  }
  function jewel(parent:T.Object3D,pos:number[],scale=.065){
    plate(parent,[[0,1],[-.67,0],[0,-1],[.67,0]].map(([x,y])=>[x*scale*1.2,y*scale*1.2]),pos,C.gold,.018,.006);
    const gem=mesh(parent,kit.custom('lubu-gem',()=>new T.OctahedronGeometry(1,0)),'#b52c3c','satin-metal');gem.position.copy(v(pos)).z+=.021;gem.scale.set(scale*.67,scale,.022);
  }
  // Rounded tunic and chest shell; independently layered ornamental lamellar armor.
  const tunic=mesh(body,kit.custom('lubu-tunic',()=>new T.LatheGeometry([new T.Vector2(.25,.15),new T.Vector2(.28,.22),new T.Vector2(.255,.37),new T.Vector2(.21,.58),new T.Vector2(.19,.76)],high?28:16)),C.red,'cloth');tunic.scale.z=.78;
  ball(body,C.black,[0,.62,0],[.235,.205,.18]);
  const chestShape=[[-.18,.1],[-.14,.18],[.14,.18],[.18,.1],[.13,-.13],[0,-.19],[-.13,-.13]];
  plate(body,chestShape,[0,.6,.155],C.gold,.024);
  plate(body,chestShape.map(([x,y])=>[x*.9,y*.87]),[0,.6,.18],C.black,.024);
  // Raised stylized lion mask, not a texture pretending to be relief.
  ball(body,C.gold,[0,.61,.223],[.102,.099,.035],'satin-metal');
  for(const side of [-1,1]){
    leaf(body,[[side*.015,.65,.247],[side*.06,.684,.255],[side*.11,.67,.238]],.022,.012,C.goldLight);
    ball(body,'#9e3734',[side*.043,.637,.254],[.018,.011,.01]);
    leaf(body,[[side*.015,.59,.251],[side*.062,.585,.26],[side*.088,.615,.24]],.021,.012,C.gold);
    line(body,[[side*.065,.61,.258],[side*.12,.605,.23],[side*.13,.645,.21]],.009,C.gold);
  }
  ball(body,C.goldLight,[0,.611,.265],[.027,.022,.022],'satin-metal');jewel(body,[0,.554,.247],.025);
  // Separate overlapping tassets with raised scrollwork, rather than cylindrical skirt rings.
  for(const side of [-1,1]){
    const tasset=new T.Group();tasset.position.set(side*.145,.39,.142);tasset.rotation.set(-.12,side*.24,side*-.2);body.add(tasset);
    const panel=[[-.092,.025],[.092,.025],[.11,-.19],[.035,-.24],[-.092,-.19]];
    plate(tasset,panel,[0,0,0],C.gold,.026);plate(tasset,panel.map(([x,y])=>[x*.87,y*.91]),[0,0,.018],C.red,.02);
    line(tasset,[[0,-.025,.036],[-.035,-.08,.036],[.035,-.12,.036],[0,-.19,.036]],.008,C.gold);
    for(const y of [-.05,-.12])ball(tasset,C.goldLight,[side*.065,y,.035],[.012,.012,.01],'satin-metal');
    const sidePlate=plate(body,[[-.065,.02],[.065,.02],[.09,-.17],[0,-.23],[-.09,-.17]],[side*.245,.38,-.025],C.black,.022);sidePlate.rotation.y=side*.85;
  }
  const belt=mesh(body,kit.custom('lubu-belt',()=>new T.TorusGeometry(.237,.033,6,high?40:20)),C.gold,'satin-metal');belt.position.y=.435;belt.scale.z=.8;belt.rotation.x=Math.PI/2;
  jewel(body,[0,.43,.223],.051);
  // Thick closed cape: front and back surfaces plus stitched hem; folds built into the mesh.
  function capePoint(u:number,t:number,back=false){return [u*(.17+t*.31)+Math.sin(t*Math.PI)*.055,.79-t*.59+.025*Math.cos(u*Math.PI*2)*t,-.19-t*.3-Math.sin(t*Math.PI)*.12+Math.cos(u*Math.PI*3)*.026*t+(back?-.018:.0)];}
  const capeGeo=kit.custom('lubu-thick-cape',()=>{
    const cols=high?24:12,rows=high?18:9,positions:number[]=[],indices:number[]=[];const stride=(cols+1)*(rows+1);
    for(let face=0;face<2;face++)for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++)positions.push(...capePoint(x/cols*2-1,y/rows,face===1));
    for(let face=0;face<2;face++)for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const a=face*stride+y*(cols+1)+x,b=a+cols+1;indices.push(...(face?[a,a+1,b,a+1,b+1,b]:[a,b,a+1,a+1,b,b+1]));}
    const edge=(a:number,b:number)=>indices.push(a,b,a+stride,b,b+stride,a+stride);
    for(let x=0;x<cols;x++){edge(x+1,x);edge(rows*(cols+1)+x,rows*(cols+1)+x+1);}for(let y=0;y<rows;y++){edge(y*(cols+1),(y+1)*(cols+1));edge((y+1)*(cols+1)+cols,y*(cols+1)+cols);}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
  });
  const cape=mesh(body,capeGeo,C.cloth,'cloth','cape');
  // Decoration lives on the cape mesh and follows its animation as one unit.
  for(const side of [-1,1]){
    line(cape,Array.from({length:9},(_,i)=>capePoint(side,i/8,true)),.009,C.gold);
    if(high)for(let i=0;i<3;i++){const t=.42+i*.16,u=side*.55;const p=capePoint(u,t,true);line(cape,[[p[0]-.03,p[1]+.024,p[2]-.006],[p[0]+.018,p[1]+.01,p[2]-.02],[p[0]+.03,p[1]-.03,p[2]-.008]],.006,C.gold);}
  }
  line(cape,Array.from({length:17},(_,i)=>capePoint(i/8-1,1,true)),.01,C.gold);
  const medallion=capePoint(0,.57,true);const capeSeal=new T.Group();capeSeal.position.copy(v(medallion)).z-=.016;capeSeal.rotation.y=Math.PI;cape.add(capeSeal);jewel(capeSeal,[0,0,0],.052);
  // Curved heraldic scrolls conform to the folded back instead of floating as a flat decal.
  for(const side of [-1,1])for(const offset of [0,.19]){
    const motif=[[side*.08,.39+offset],[side*.23,.33+offset],[side*.43,.4+offset],[side*.29,.47+offset],[side*.43,.54+offset],[side*.62,.49+offset]];
    line(cape,motif.map(([u,t])=>{const p=capePoint(u,t,true);p[2]-=.012;return p;}),.0055,C.gold);
  }
  // Full articulated short limbs, bracers and tiny plated boots.
  for(const side of [-1,1]){
    const arm=new T.Group();arm.name=side<0?'left-arm':'right-arm';arm.position.set(side*.375,.69,0);body.add(arm);arms.push(arm);
    ball(arm,C.red,[0,-.125,0],[.083,.16,.09], 'cloth');
    ball(arm,C.black,[0,-.235,.015],[.091,.074,.093]);
    for(const y of [-.19,-.266]){const cuff=mesh(arm,kit.geometry('torus'),C.gold,'satin-metal');cuff.position.set(0,y,.012);cuff.scale.set(.086,.086,.072);cuff.rotation.x=Math.PI/2;}
    plate(arm,[[-.055,.05],[.055,.05],[.065,-.045],[0,-.07],[-.065,-.045]],[0,-.23,.092],C.gold,.014);
    ball(arm,C.skin,[side*.045,-.305,.065],[.075,.075,.075]);ball(arm,C.skin,[side*.095,-.29,.09],[.035,.04,.035]);
    for(let i=0;i<3;i++)ball(arm,C.skin,[side*.045,-.335+i*.022,.125],[.048,.012,.019]);
    const grip=new T.Group();grip.name='palm-grip';grip.position.set(side*.045,-.305,.065);grip.userData.side=side;arm.add(grip);grips.push(grip);
    const shoulder=new T.Group();shoulder.position.set(side*.005,.022,-.005);shoulder.rotation.z=side*-.12;arm.add(shoulder);
    for(let i=0;i<2;i++){
      const outline=[[-.13,.025],[-.075,.11],[.08,.09],[.145,.025],[.1,-.045],[-.09,-.045]];
      plate(shoulder,outline,[side*.025,-i*.048,.045],C.gold,.07);plate(shoulder,outline.map(([x,y])=>[x*.88,y*.8]),[side*.025,-i*.048,.09],C.black,.025);plate(shoulder,outline.map(([x,y])=>[x*.85,y*.78]),[side*.025,-i*.048,-.003],C.black,.014);
    }
    line(shoulder,[[-.075,.026,.116],[0,.069,.123],[.075,.026,.116]],.012,C.gold);
    const leg=new T.Group();leg.name=side<0?'left-leg':'right-leg';leg.position.set(side*.12,.28,0);rig.add(leg);legs.push(leg);
    ball(leg,C.black,[0,-.095,0],[.078,.13,.085]);ball(leg,C.black,[0,-.205,.05],[.1,.073,.135],'leather');
    plate(leg,[[-.065,.065],[.065,.065],[.055,-.07],[0,-.1],[-.055,-.07]],[0,-.09,.085],C.gold,.015);
    ball(leg,C.gold,[0,-.224,.153],[.085,.029,.035],'satin-metal');
  }
  // Slightly flattened, pear-like face with a softly narrowed chin (not a spherical head).
  const faceGeo=kit.custom('lubu-face',()=>{
    const geo=new T.SphereGeometry(1,high?32:20,high?24:14);const a=geo.attributes.position;
    for(let i=0;i<a.count;i++){const y=a.getY(i);const cheek=1-.13*Math.max(0,-y);a.setXYZ(i,a.getX(i)*.34*cheek,y*.333-.02,a.getZ(i)*.282+.044);}
    geo.computeVertexNormals();return geo;
  });mesh(head,faceGeo,C.skin);
  for(const side of [-1,1]){
    ball(head,C.skin,[side*.325,-.035,.025],[.06,.085,.06]);ball(head,'#ce9179',[side*.348,-.035,.065],[.026,.05,.02]);
    const eye=new T.Group();eye.name=side<0?'left-eye':'right-eye';eye.position.set(side*.128,.0,.307);eye.rotation.y=side*.12;head.add(eye);eyes.push(eye);
    ball(eye,'#fff6e9',[0,0,0],[.078,.078,.024]);
    ball(eye,'#542b29',[0,-.003,.023],[.052,.065,.012]);ball(eye,C.eye,[0,-.009,.035],[.045,.051,.01]);ball(eye,'#bc6850',[0,-.026,.043],[.033,.024,.006]);
    ball(eye,'#221c20',[0,.001,.046],[.025,.046,.008]);ball(eye,'#ffffff',[-.016,.022,.055],[.015,.019,.006]);ball(eye,'#f5d5be',[.02,-.022,.052],[.007,.009,.004]);
    line(head,[[side*.052,.059,.306],[side*.126,.086,.307],[side*.203,.047,.281]],.012,C.hair,'vinyl');
    leaf(head,[[side*.055,.114,.307],[side*.132,.143,.3],[side*.22,.122,.269]],.024,.012,C.hair);
    ball(head,C.cheek,[side*.223,-.095,.275],[.042,.016,.009]);
  }
  ball(head,C.skin,[0,-.07,.33],[.023,.025,.023]);line(head,[[-.044,-.151,.305],[0,-.161,.316],[.047,-.14,.3]],.008,'#9b5548','vinyl');
  // Swept locks with creased secondary strands; the rear hair shell is fully covered with locks.
  const cap=mesh(head,kit.custom('lubu-hair-cap',()=>new T.SphereGeometry(1,high?32:20,high?20:12,0,Math.PI*2,0,Math.PI*.63)),C.hair);cap.scale.set(.355,.35,.3);cap.position.set(0,.025,-.035);
  const fringe=[
    [[-.04,.35,-.03],[-.095,.31,.13],[-.06,.24,.25],[.015,.125,.31]],
    [[-.09,.34,-.02],[-.19,.3,.12],[-.22,.23,.23],[-.15,.15,.295]],
    [[.035,.35,-.035],[.14,.3,.11],[.23,.23,.22],[.31,.22,.245]],
    [[-.16,.3,-.02],[-.27,.25,.10],[-.32,.19,.20],[-.35,.185,.19]],
    [[.15,.30,-.04],[.26,.24,.075],[.33,.18,.16],[.39,.22,.15]],
  ];
  fringe.forEach((points,i)=>leaf(head,points,i===0?.09:.083,.03,C.hair));
  for(const side of [-1,1])for(let i=0;i<3;i++){
    leaf(head,[[side*.23,.23-i*.085,-.01],[side*.34,.16-i*.07,.04],[side*.40,.1-i*.06,.08],[side*(.43-i*.018),.15-i*.09,.12]],.071,.027,C.hair);
  }
  // Two overlapping fans of swept rear locks follow the scalp and break up the bowl silhouette.
  function scalp(a:number,p:number){return [Math.sin(a)*Math.sin(p)*.372,Math.cos(p)*.365+.025,-Math.cos(a)*Math.sin(p)*.323-.035];}
  for(let row=0;row<2;row++)for(let i=0;i<7;i++){
    const a=-1.45+i*.4833,p=row?.95:.25;
    const points=[scalp(a*.75,p),scalp(a,p+.35),scalp(a+.14,p+.65),scalp(a+.22,p+.9)];
    leaf(head,points,row?.075:.08,.024,C.hair,new T.Vector3(Math.sin(a),0,-Math.cos(a)));
  }
  ball(head,C.hair,[0,.38,-.09],[.105,.1,.11]);
  // Small gold crown with inset ruby and layered flame-shaped wings.
  const crown=new T.Group();crown.position.set(0,.31,.18);head.add(crown);
  for(const side of [-1,1]){
    plate(crown,[[0,-.03],[side*.085,.11],[side*.21,.2],[side*.16,.04],[side*.07,-.065]],[0,0,0],C.gold,.022);
    plate(crown,[[side*.055,0],[side*.105,.07],[side*.155,.12],[side*.125,.03]],[0,0,.023],C.black,.012);
  }
  plate(crown,[[0,.21],[-.085,.045],[-.05,-.08],[0,-.11],[.05,-.08],[.085,.045]],[0,0,.025],C.gold,.024);jewel(crown,[0,.045,.057],.061);
  // Two arched plumes, with overlapping lanceolate vanes and a fine raised rachis.
  for(const side of [-1,1]){
    const path=new T.CatmullRomCurve3([[side*.1,.37,-.065],[side*.24,.79,-.08],[side*.46,.94,-.1],[side*.62,.67,-.14],[side*.68,.22,-.2]].map(v));
    const points=Array.from({length:18},(_,i)=>path.getPoint(i/17).toArray());leaf(head,points,.09,.017,C.scarlet);line(head,points.map(([x,y,z])=>[x,y,z+.018]),.008,C.red,'vinyl');
    const count=high?11:7;
    for(let i=0;i<count;i++){
      const t=i/(count-1)*.88,p=path.getPoint(t),tangent=path.getTangent(t).normalize(),perp=new T.Vector3(-tangent.y,tangent.x,0);
      for(const edge of [-1,1]){
        const end=p.clone().addScaledVector(tangent,.15).addScaledVector(perp,edge*.095*(1-t*.65));
        leaf(head,[p.clone().addScaledVector(tangent,-.04).toArray(),p.clone().addScaledVector(perp,edge*.055).addScaledVector(tangent,.05).toArray(),end.toArray()],.051*(1-t*.45),.014,(i+edge)%3===0?'#e15a50':C.scarlet,new T.Vector3(0,0,1),'vinyl','feather-vane');
      }
    }
    const tip=path.getPoint(.82),end=path.getPoint(1);leaf(head,[tip.toArray(),path.getPoint(.92).toArray(),end.toArray()],.044,.014,C.scarlet);
  }
  // Double-edged Fangtian halberd with a leaf spear, moon blade, gilt socket and ruby boss.
  const weapon=new T.Group();weapon.name='方天畫戟';weapon.userData.artRole='held-weapon';weapon.position.z=.005;weapon.scale.x=-1;grips[0].add(weapon);weapons.push(weapon);
  const shaft=mesh(weapon,kit.geometry('cylinder'),C.black,'satin-metal');shaft.position.y=.26;shaft.scale.set(.025,1.17,.025);
  for(let i=0;i<9;i++){const collar=mesh(weapon,kit.geometry('cylinder'),i%2?C.gold:C.red,'satin-metal');collar.position.y=-.27+i*.12;collar.scale.set(.03,.024,.03);}
  const spearOutline=[[0,.6],[-.085,.8],[-.055,.88],[0,1.16],[.055,.88],[.085,.8]];
  plate(weapon,spearOutline,[0,0,0],C.steel,.036,.009);
  plate(weapon,[[0,.68],[-.022,.81],[0,1.08],[.022,.81]],[0,0,.025],C.gold,.009,.003);
  plate(weapon,[[.035,.59],[.12,.62],[.27,.7],[.32,.91],[.24,.83],[.15,.82],[.13,.94],[.08,.85]],[0,0,0],C.gold,.04,.01);
  plate(weapon,[[.12,.67],[.23,.72],[.29,.86],[.21,.8],[.14,.79]],[0,0,.027],C.steel,.022,.008);
  plate(weapon,[[-.025,.6],[-.067,.65],[-.09,.82],[-.055,.79],[-.045,.85]],[0,0,0],C.gold,.035,.008);
  jewel(weapon,[0,.66,.042],.048);line(weapon,[[.018,.59,.02],[.12,.53,.04],[.15,.31,.05],[.12,.23,.07]],.022,C.red,'cloth');
  // Batching is per animated joint/material, not hundreds of independent meshes per frame.
  for(const w of weapons)batchGroup(w);
  for(const arm of arms){const exclude=new Set<T.Object3D>();grips.filter(g=>g.parent===arm).forEach(g=>g.traverse(o=>exclude.add(o)));batchGroup(arm,exclude);}
  for(const leg of legs)batchGroup(leg);batchGroup(cape);
  const headExclude=new Set<T.Object3D>();eyes.forEach(e=>e.traverse(o=>headExclude.add(o)));batchGroup(head,headExclude);
  const bodyExclude=new Set<T.Object3D>();[head,cape,...arms].forEach(g=>g.traverse(o=>bodyExclude.add(o)));batchGroup(body,bodyExclude);
  return {id:'lvbu',root,rig,body,head,arms,legs,eyes,cape,weapons,grips};
}
