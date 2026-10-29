import * as T from 'three';
import {ModelKit,batchGroup} from './models.ts';
import type {Figure} from './characters.ts';

/** Authored for this project. Curved, closed surfaces; no downloaded models or image billboards. */
export const LUBU_ART_REVISION='3.8.0';
export const LUBU_PROPORTIONS={headCenter:1.26,headRadius:.35,bodyStretch:1.16,armHeight:.80,legHeight:.30,plumeScale:.8} as const;
const C={skin:'#f5d0b2',cheek:'#db9d8c',hair:'#2d1d18',hairLight:'#52382b',black:'#24252d',red:'#8e2632',scarlet:'#bd2831',gold:'#c89b54',goldLight:'#ebc780',steel:'#bcc8ce',eye:'#b42d36',cloth:'#7c2533'};
const v=(p:number[])=>new T.Vector3(p[0],p[1],p[2]);
export function lubuFaceFront(x:number,y:number){
  const ny=(y+.02)/.35,w=.36*(1-.15*Math.max(0,-ny));
  const front=Math.sqrt(Math.max(.001,1-(x/w)**2-ny*ny));
  return front*.311+.035+Math.exp(-((x/.043)**2)-((y+.105)/.052)**2)*.052*front;
}
export function createLubuPrototype(kit:ModelKit):Figure {
  const high=kit.detail==='display';let serial=0;
  const root=new T.Group();root.name='character-lvbu';root.scale.setScalar(.8);
  root.userData={characterId:'lvbu',dedicated:true,artRevision:LUBU_ART_REVISION,source:'authored-surfaces',headToBody:1.3,plumeScale:.8};
  const rig=new T.Group();rig.name='whole-figure';root.add(rig);
  const body=new T.Group();body.name='torso';rig.add(body);
  const head=new T.Group();head.name='head';head.position.y=LUBU_PROPORTIONS.headCenter;body.add(head);
  const arms:T.Group[]=[],legs:T.Group[]=[],eyes:T.Group[]=[],grips:T.Group[]=[],weapons:T.Group[]=[],brows:T.Group[]=[],plumes:T.Group[]=[];
  const armor=new T.Group();armor.name='armor-shell';armor.scale.y=LUBU_PROPORTIONS.bodyStretch;body.add(armor);
  function material(color:string,finish:'vinyl'|'cloth'|'leather'|'satin-metal'='vinyl'){
    if(color===C.gold||color===C.goldLight||color===C.steel)finish='satin-metal';
    const key='premium:'+color+':'+finish;
    if(!kit.materials.has(key))kit.materials.set(key,new T.MeshStandardMaterial({name:'Lubu_'+color.slice(1)+'_'+finish,color,roughness:color===C.black?.29:color===C.hair?.48:color===C.gold||color===C.goldLight?.32:color===C.steel?.26:color==='#b52c3c'?.16:finish==='cloth'?.78:.65,metalness:color===C.gold||color===C.goldLight?.73:color===C.steel?.82:0}));
    return kit.materials.get(key)!;
  }
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
      const first=positions.length/3;positions.push(...curve.getPoint(0).toArray(),...curve.getPoint(1).toArray());for(let j=0;j<around;j++){indices.push(first,j+1,j,first+1,length*(around+1)+j,length*(around+1)+j+1);}
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
    });return mesh(parent,geo,color,finish,name);
  }
  function line(parent:T.Object3D,points:number[][],radius:number,color:string,finish:'vinyl'|'cloth'|'leather'|'satin-metal'='satin-metal'){
    return mesh(parent,kit.custom('lubu-line-'+serial++,()=>new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v)),high?10:7,radius,high?5:4,false)),color,finish);
  }
  function plate(parent:T.Object3D,outline:number[][],pos:number[],color:string,depth=.025,bevel=.012,holes:number[][][]=[]){
    const g=kit.custom('lubu-plate-'+serial++,()=>{const shape=new T.Shape();const corners=outline.map((p,i)=>{const a=outline[(i+outline.length-1)%outline.length],b=outline[(i+1)%outline.length];return {p,enter:[p[0]+(a[0]-p[0])*.13,p[1]+(a[1]-p[1])*.13],exit:[p[0]+(b[0]-p[0])*.13,p[1]+(b[1]-p[1])*.13]};});shape.moveTo(...corners[0].enter as [number,number]);for(const c of corners){shape.lineTo(...c.enter as [number,number]);shape.quadraticCurveTo(c.p[0],c.p[1],c.exit[0],c.exit[1]);}shape.closePath();for(const ring of holes){const h=new T.Path();h.moveTo(ring[0][0],ring[0][1]);ring.slice(1).forEach(p=>h.lineTo(p[0],p[1]));h.closePath();shape.holes.push(h);}const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:high?3:2,steps:1,curveSegments:high?5:3,bevelSize:bevel,bevelThickness:bevel});g.translate(0,0,-depth/2);return g;});
    const m=mesh(parent,g,color,'satin-metal');m.position.copy(v(pos));return m;
  }
  function jewel(parent:T.Object3D,pos:number[],scale=.065){
    plate(parent,[[0,1],[-.67,0],[0,-1],[.67,0]].map(([x,y])=>[x*scale*1.2,y*scale*1.2]),pos,C.gold,.018,.006);
    const gem=mesh(parent,kit.custom('lubu-gem',()=>new T.OctahedronGeometry(1,0)),'#b52c3c','satin-metal');gem.position.copy(v(pos)).z+=.021;gem.scale.set(scale*.67,scale,.022);
  }
  // Rounded tunic and chest shell; independently layered ornamental lamellar armor.
  const tunic=mesh(armor,kit.custom('lubu-tunic',()=>new T.LatheGeometry([new T.Vector2(.25,.15),new T.Vector2(.28,.22),new T.Vector2(.255,.37),new T.Vector2(.21,.58),new T.Vector2(.19,.76)],high?28:16)),C.red,'cloth');tunic.scale.z=.78;
  ball(armor,C.black,[0,.62,0],[.235,.205,.18]);
  const chestShape=[[-.18,.1],[-.14,.18],[.14,.18],[.18,.1],[.13,-.13],[0,-.19],[-.13,-.13]];
  plate(armor,chestShape,[0,.6,.155],C.gold,.024);
  plate(armor,chestShape.map(([x,y])=>[x*.9,y*.87]),[0,.6,.18],C.black,.024);
  const beast=new T.Group();beast.name='beast-relief';beast.position.set(0,.625,.226);armor.add(beast);
  ball(beast,C.gold,[0,.015,0],[.088,.087,.037],'satin-metal');
  for(const side of [-1,1]){
    for(let i=0;i<5;i++)leaf(beast,[[side*.055,.085-i*.035,-.008],[side*(.13-i*.006),.08-i*.033,.018],[side*.10,.03-i*.035,.027]],.021,.018,C.gold);
    leaf(beast,[[side*.018,.038,.032],[side*.054,.067,.050],[side*.096,.052,.018]],.023,.015,C.gold);
    leaf(beast,[[side*.04,.067,-.01],[side*.07,.11,.0],[side*.085,.10,-.008]],.022,.012,C.gold);
    ball(beast,C.gold,[side*.031,-.02,.043],[.034,.023,.026],'satin-metal');
    const eye=ball(armor,'#9c222b',[side*.045,.641,.283],[.014,.008,.008]);eye.name='Lion_Inset_Eye';
  }
  plate(armor,[[-.045,.018],[.045,.018],[.033,-.039],[0,-.052],[-.033,-.039]],[0,.583,.273],C.black,.012,.006);
  for(const side of [-1,1]){
    leaf(armor,[[side*.026,.597,.291],[side*.025,.58,.296],[side*.016,.571,.298]],.006,.005,C.goldLight);
    line(armor,[[side*.053,.591,.278],[side*.047,.567,.284],[0,.553,.280]],.008,C.gold);
  }
  ball(beast,C.goldLight,[0,.005,.068],[.026,.018,.019],'satin-metal');
  jewel(armor,[0,.528,.235],.024);
  // Separate overlapping tassets with raised scrollwork, rather than cylindrical skirt rings.
  for(const side of [-1,1]){
    const tasset=new T.Group();tasset.position.set(side*.145,.39,.142);tasset.rotation.set(-.12,side*.24,side*-.2);armor.add(tasset);
    const panel=[[-.092,.025],[.092,.025],[.11,-.19],[.035,-.24],[-.092,-.19]];
    plate(tasset,panel,[0,0,0],C.gold,.026);plate(tasset,panel.map(([x,y])=>[x*.87,y*.91]),[0,0,.018],C.red,.02);
    line(tasset,[[-.05,-.035,.040],[.014,-.055,.040],[.045,-.10,.040],[.018,-.14,.040],[-.02,-.115,.040],[0,-.085,.040]],.0055,C.gold);
    line(tasset,[[.04,-.16,.040],[.012,-.19,.040],[-.04,-.17,.040]],.0045,C.gold);
    for(const y of [-.05,-.12])ball(tasset,C.goldLight,[side*.065,y,.035],[.012,.012,.01],'satin-metal');
    const sidePlate=plate(armor,[[-.065,.02],[.065,.02],[.09,-.17],[0,-.23],[-.09,-.17]],[side*.245,.38,-.025],C.black,.022);sidePlate.rotation.y=side*.85;
  }
  for(const side of [-1,1])line(armor,[[side*.065,.775,.13],[side*.13,.74,.18],[side*.15,.69,.19],[side*.12,.665,.20],[side*.09,.69,.21]],.007,C.gold);
  const belt=mesh(armor,kit.custom('lubu-belt',()=>new T.TorusGeometry(.237,.033,6,high?40:20)),C.gold,'satin-metal');belt.position.y=.435;belt.scale.z=.8;belt.rotation.x=Math.PI/2;
  jewel(armor,[0,.43,.223],.051);
  // Thick closed cape: front and back surfaces plus stitched hem; folds built into the mesh.
  function capePoint(u:number,t:number,back=false){return [u*(.17+t*.39)+Math.sin(t*Math.PI)*.085,.79-t*.59+.025*Math.cos(u*Math.PI*2)*t,-.19-t*.3-Math.sin(t*Math.PI)*.12+Math.cos(u*Math.PI*3)*.026*t+(back?-.018:.0)];}
  const capeGeo=kit.custom('lubu-thick-cape',()=>{
    const cols=high?24:12,rows=high?18:9,positions:number[]=[],indices:number[]=[];const stride=(cols+1)*(rows+1);
    for(let face=0;face<2;face++)for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++)positions.push(...capePoint(x/cols*2-1,y/rows,face===1));
    for(let face=0;face<2;face++)for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const a=face*stride+y*(cols+1)+x,b=a+cols+1;indices.push(...(face?[a,a+1,b,a+1,b+1,b]:[a,b,a+1,a+1,b,b+1]));}
    const edge=(a:number,b:number)=>indices.push(a,b,a+stride,b,b+stride,a+stride);
    for(let x=0;x<cols;x++){edge(x+1,x);edge(rows*(cols+1)+x,rows*(cols+1)+x+1);}for(let y=0;y<rows;y++){edge(y*(cols+1),(y+1)*(cols+1));edge((y+1)*(cols+1)+cols,y*(cols+1)+cols);}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
  });
  const cape=mesh(armor,capeGeo,C.cloth,'cloth','cape');
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
    const arm=new T.Group();arm.name=side<0?'left-arm':'right-arm';arm.position.set(side*.39,LUBU_PROPORTIONS.armHeight,0);body.add(arm);arms.push(arm);
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
    line(shoulder,[[-.08,.026,.116],[-.015,.083,.123],[.06,.055,.12],[.03,.015,.13],[-.008,.03,.125],[.01,.055,.125]],.008,C.gold);
    jewel(shoulder,[side*.025,-.018,.13],.019);
    const leg=new T.Group();leg.name=side<0?'left-leg':'right-leg';leg.position.set(side*.12,LUBU_PROPORTIONS.legHeight,0);rig.add(leg);legs.push(leg);
    ball(leg,C.black,[0,-.095,0],[.078,.13,.085]);ball(leg,C.black,[0,-.227,.05],[.10,.073,.135],'leather');
    plate(leg,[[-.065,.065],[.065,.065],[.055,-.07],[0,-.1],[-.055,-.07]],[0,-.09,.085],C.gold,.015);
    ball(leg,C.gold,[0,-.245,.153],[.085,.029,.035],'satin-metal');
  }
  // Continuous, vertex-tinted PVC face; nose and cheek volumes are part of this mesh.
  const faceGeo=kit.custom('lubu-face',()=>{
    const geo=new T.SphereGeometry(1,high?40:28,high?28:20),attr=geo.attributes.position,colors:number[]=[];
    const skin=new T.Color(C.skin),pink=new T.Color('#ec9e9b');
    for(let i=0;i<attr.count;i++){
      const ny=attr.getY(i),x=attr.getX(i)*.36*(1-.15*Math.max(0,-ny)),y=ny*.35-.02,z=attr.getZ(i)*.311+.035;
      const front=Math.max(0,attr.getZ(i));const nose=Math.exp(-((x/.043)**2)-((y+.105)/.052)**2)*.052*front;
      attr.setXYZ(i,x,y,z+nose);
      const blush=Math.exp(-(((Math.abs(x)-.22)/.058)**2)-((y+.095)/.04)**2)*Math.max(0,front)*.37;
      const noseShade=Math.exp(-((x/.028)**2)-((y+.132)/.019)**2)*front*.09;
      const c=skin.clone().lerp(pink,blush).lerp(new T.Color('#be8a70'),noseShade);colors.push(c.r,c.g,c.b);
    }
    geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();return geo;
  });
  const face=mesh(head,faceGeo,'#ffffff','vinyl','Face_PVC');face.material=material('#ffffff').clone();face.material.vertexColors=true;face.userData.surfaceRole='smooth-face';
  // Each eye layer follows the same facial surface; no projecting eyeball spheres.
  function eyePatch(parent:T.Object3D,cx:number,cy:number,rx:number,ry:number,color:string,offset:number,gloss=false){
    const geo=kit.custom('lubu-eye-'+serial++,()=>{
      const positions:number[]=[cx-parent.position.x,cy-parent.position.y,lubuFaceFront(cx,cy)+offset+.004-parent.position.z],indices:number[]=[],rings=high?6:4,sectors=high?28:20;
      for(let r=1;r<=rings;r++)for(let j=0;j<=sectors;j++){
        const t=r/rings,a=j/sectors*Math.PI*2,x=cx+Math.cos(a)*rx*t;const almond=color==='#442c2b'||color==='#fff3e4';const dy=Math.sin(a)*ry*t*(almond?Math.pow(Math.abs(Math.sin(a)),.45):1);const y=cy+dy+(almond?Math.sign(cx)*(x-cx)*.13:0);
        positions.push(x-parent.position.x,y-parent.position.y,lubuFaceFront(x,y)+offset+(1-t*t)*.004-parent.position.z);
      }
      for(let j=0;j<sectors;j++)indices.push(0,j+1,j+2);
      for(let r=0;r<rings-1;r++)for(let j=0;j<sectors;j++){const k=1+r*(sectors+1)+j;indices.push(k,k+sectors+1,k+1,k+1,k+sectors+1,k+sectors+2);}
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
    });const m=mesh(parent,geo,color);if(gloss){const key='eye-gloss:'+color;if(!kit.materials.has(key))kit.materials.set(key,new T.MeshStandardMaterial({name:'Lubu_'+color.slice(1)+'_iris',color,roughness:.19,metalness:0}));m.material=kit.materials.get(key)!;}return m;
  }
  for(const side of [-1,1]){
    ball(head,C.skin,[side*.35,-.035,.025],[.05,.073,.048]);ball(head,'#ce9179',[side*.368,-.035,.055],[.018,.04,.013]);
    const cx=side*.133,cy=-.035,eye=new T.Group();eye.name=side<0?'left-eye':'right-eye';eye.position.set(cx,cy,lubuFaceFront(cx,cy));head.add(eye);eyes.push(eye);
    eyePatch(eye,cx,cy,.108,.066,'#442c2b',.001);
    eyePatch(eye,cx,cy-.003,.100,.058,'#fff3e4',.003).name='Eye_White_Almond';
    eyePatch(eye,cx,cy-.006,.054,.054,'#4e2526',.005,true);
    eyePatch(eye,cx,cy-.01,.048,.048,C.eye,.007,true);
    eyePatch(eye,cx,cy-.025,.032,.020,'#d65b45',.009,true);
    eyePatch(eye,cx,cy-.003,.024,.039,'#241e23',.011,true);
    eyePatch(eye,cx-.016,cy+.018,.012,.014,'#ffffff',.014,true);
    eyePatch(eye,cx+.018,cy-.025,.006,.007,'#ffe0ba',.014,true);
    const brow=new T.Group();brow.name=side<0?'left-brow':'right-brow';brow.position.set(cx,.103,lubuFaceFront(cx,.103));head.add(brow);brows.push(brow);
    const points=[[side*.055,.088],[side*.14,.142],[side*.236,.134]].map(([x,y])=>[x-cx,y-.103,lubuFaceFront(x,y)+.004-brow.position.z]);
    leaf(brow,points,.012,.005,C.hair);
  }
  const smile=[[-.045,-.198],[-.012,-.208],[.021,-.201],[.056,-.186]].map(([x,y])=>[x,y,lubuFaceFront(x,y)+.0015]);line(head,smile,.004,'#995349','vinyl');
  const hair=new T.Group();hair.name='hair-control';head.add(hair);
  const cap=mesh(hair,kit.custom('lubu-hair-cap',()=>new T.SphereGeometry(1,high?32:20,high?20:12)),C.hair);cap.scale.set(.357,.353,.303);cap.position.set(0,.027,-.04);
  function lock(points:number[][],width:number,depth:number,normal=new T.Vector3(0,0,1)){
    const curve=new T.CatmullRomCurve3(points.map(v)),length=high?16:9,cross=high?10:6;
    const geometry=kit.custom('lubu-hair-lock-'+serial++,()=>{
      const positions:number[]=[],indices:number[]=[];
      for(let layer=0;layer<2;layer++)for(let i=0;i<=length;i++)for(let j=0;j<=cross;j++){
        const t=i/length,u=j/cross*2-1,p=curve.getPoint(t),tangent=curve.getTangent(t).normalize();
        const across=new T.Vector3().crossVectors(tangent,normal).normalize(),out=new T.Vector3().crossVectors(across,tangent).normalize();
        const taper=.015+Math.pow(Math.sin(Math.PI*t),.55)*(1-t*.28),profile=Math.pow(Math.max(0,1-u*u),.65);
        const grooves=high?(Math.cos(u*Math.PI*3)-1)*.0035*profile*Math.sin(Math.PI*t):0;
        p.addScaledVector(across,u*width*taper).addScaledVector(out,(layer?-.25*depth:depth+grooves)*profile*taper);positions.push(...p.toArray());
      }
      const side=(length+1)*(cross+1);
      for(let layer=0;layer<2;layer++)for(let i=0;i<length;i++)for(let j=0;j<cross;j++){const a=layer*side+i*(cross+1)+j,b=a+cross+1;indices.push(...(layer?[a,b,a+1,a+1,b,b+1]:[a,a+1,b,a+1,b+1,b]));}
      const edge=(a:number,b:number)=>indices.push(a,b,a+side,b,b+side,a+side);
      for(let i=0;i<length;i++){edge(i*(cross+1),(i+1)*(cross+1));edge((i+1)*(cross+1)+cross,i*(cross+1)+cross);}for(let j=0;j<cross;j++){edge(j+1,j);edge(length*(cross+1)+j,length*(cross+1)+j+1);}
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
    });mesh(hair,geometry,C.hair);
  }
  // Five asymmetric swept bangs, side wings, and overlapping rear fans; tips curl out of the silhouette.
  const fringe=[
    [[-.04,.36,-.04],[-.07,.35,.17],[.01,.25,.30],[.025,.15,.315]],
    [[-.08,.35,-.02],[-.20,.34,.16],[-.32,.30,.23],[-.43,.34,.15]],
    [[.03,.36,-.035],[.18,.35,.15],[.30,.28,.24],[.41,.30,.20]],
    [[-.14,.29,-.04],[-.26,.23,.13],[-.32,.15,.22],[-.42,.20,.21]],
    [[.12,.30,-.06],[.29,.22,.09],[.36,.12,.17],[.43,.18,.16]],
  ];fringe.forEach((p,i)=>{
    lock(p,i===0?.075:.080,.022);
    if(high){const curve=new T.CatmullRomCurve3(p.map(v));const strand=Array.from({length:10},(_,j)=>{const t=.16+j/9*.66,q=curve.getPoint(t);q.z+=.022*Math.sin(Math.PI*t)+.001;return q.toArray();});line(hair,strand,.0014,'#4a3025','vinyl');}
  });
  for(const side of [-1,1])for(let i=0;i<3;i++)lock([[side*.24,.20-i*.10,-.04],[side*.34,.14-i*.09,.01],[side*.40,.08-i*.08,.12],[side*(.45-i*.025),.13-i*.10,.13]],.065,.020);
  function scalp(a:number,p:number){return [Math.sin(a)*Math.sin(p)*.38,Math.cos(p)*.37+.02,-Math.cos(a)*Math.sin(p)*.334-.045];}
  for(let row=0;row<2;row++)for(let i=0;i<7;i++){
    const a=-1.55+i*.515,p=row?.96:.2;const points=[scalp(a*.8,p),scalp(a+.10,p+.4),scalp(a+.22,p+.75),scalp(a+.32,p+.96)];
    lock(points,row?.078:.090,.027,new T.Vector3(Math.sin(a),0,-Math.cos(a)));
  }
  lock([[0,.28,-.16],[.02,.41,-.14],[.12,.45,-.12],[.15,.4,-.08]],.09,.035);
  const crown=new T.Group();crown.position.set(0,.36,.26);head.add(crown);
  plate(crown,[[-.12,-.045],[-.085,.04],[0,.025],[.085,.04],[.12,-.045],[0,-.08]],[0,0,0],C.black,.027,.006);
  for(const side of [-1,1]){
    plate(crown,[[side*.035,-.02],[side*.095,.045],[side*.11,.145],[side*.16,.20],[side*.15,.065],[side*.085,-.045]],[0,0,.01],C.gold,.018,.005);
    plate(crown,[[side*.085,-.025],[side*.17,.015],[side*.21,.095],[side*.17,.06],[side*.12,.025]],[0,0,.015],C.gold,.015,.004);
    line(crown,[[side*.065,-.005,.036],[side*.12,.056,.04],[side*.15,.032,.038],[side*.12,.006,.04]],.005,C.goldLight);
  }
  plate(crown,[[0,.16],[-.07,.035],[-.04,-.06],[0,-.085],[.04,-.06],[.07,.035]],[0,0,.03],C.gold,.020,.005);jewel(crown,[0,.025,.061],.053);
  // Two arched plumes, with overlapping lanceolate vanes and a fine raised rachis.
  for(const side of [-1,1]){
    const plume=new T.Group();plume.name=side<0?'left-plume':'right-plume';const anchor=new T.Vector3(side*.1,.37,-.065);plume.position.copy(anchor);plume.scale.setScalar(LUBU_PROPORTIONS.plumeScale);head.add(plume);plumes.push(plume);
    const plumeGeometry=new T.Group();plumeGeometry.position.copy(anchor).negate();plume.add(plumeGeometry);
    const path=new T.CatmullRomCurve3([[side*.1,.37,-.065],[side*.24,.79,-.08],[side*.46,.94,-.1],[side*.62,.67,-.14],[side*.65,.06,-.2]].map(v));
    const points=Array.from({length:18},(_,i)=>path.getPoint(i/17).toArray());leaf(plumeGeometry,points,.09,.017,C.scarlet);line(plumeGeometry,points.map(([x,y,z])=>[x,y,z+.018]),.008,C.red,'vinyl');
    const count=high?15:9;
    for(let i=0;i<count;i++){
      const t=i/(count-1)*.88,p=path.getPoint(t),tangent=path.getTangent(t).normalize(),perp=new T.Vector3(-tangent.y,tangent.x,0);
      for(const edge of [-1,1]){
        const end=p.clone().addScaledVector(tangent,.15).addScaledVector(perp,edge*.095*(1-t*.65));
        leaf(plumeGeometry,[p.clone().addScaledVector(tangent,-.04).toArray(),p.clone().addScaledVector(perp,edge*.055).addScaledVector(tangent,.05).toArray(),end.toArray()],.037*(1-t*.45),.008,(i+edge)%3===0?'#de4936':C.scarlet,new T.Vector3(0,0,1),'vinyl','feather-vane');
      }
    }
    const tip=path.getPoint(.82),end=path.getPoint(1);leaf(plumeGeometry,[tip.toArray(),path.getPoint(.92).toArray(),end.toArray()],.044,.014,C.scarlet);batchGroup(plumeGeometry);
  }
  // Double-edged Fangtian halberd with a leaf spear, moon blade, gilt socket and ruby boss.
  const weapon=new T.Group();weapon.name='方天畫戟';weapon.userData.artRole='held-weapon';weapon.position.z=.005;weapon.scale.x=-1;grips[0].add(weapon);weapons.push(weapon);
  const shaft=mesh(weapon,kit.geometry('cylinder'),C.black,'satin-metal');shaft.position.y=.26;shaft.scale.set(.025,1.17,.025);
  for(let i=0;i<9;i++){const collar=mesh(weapon,kit.geometry('cylinder'),i%2?C.gold:C.red,'satin-metal');collar.position.y=-.27+i*.12;collar.scale.set(.03,.024,.03);}
  plate(weapon,[[0,.61],[-.075,.80],[-.052,.88],[0,1.18],[.055,.91],[.082,.81]],[0,0,0],C.steel,.052,.010);
  plate(weapon,[[0,.65],[-.037,.8],[0,1.08],[.037,.81]],[0,0,.029],C.black,.014,.004);
  for(const side of [-1,1])line(weapon,[[side*.009,.7,.044],[side*.03,.79,.044],[side*.014,.9,.041],[0,1.065,.036]],.005,C.gold);
  const moon=[[.025,.61],[.10,.59],[.23,.68],[.33,.91],[.29,1.02],[.23,.90],[.16,.86],[.14,.98],[.08,.85]];
  const opening=[[.11,.71],[.18,.73],[.245,.87],[.19,.81],[.135,.81]];
  const piercedBlade=plate(weapon,moon,[0,0,0],C.gold,.045,.007,[opening]);piercedBlade.name='MoonBlade_Pierced';
  plate(weapon,[[.205,.71],[.27,.78],[.323,.92],[.29,.985],[.26,.88]],[0,0,.026],C.steel,.025,.005);
  plate(weapon,[[-.02,.62],[-.07,.68],[-.085,.86],[-.047,.81],[-.04,.9]],[0,0,0],C.steel,.036,.007);
  for(const side of [-1,1]){
    line(weapon,[[side*.012,.57,.038],[side*.07,.64,.05],[side*.055,.72,.043],[side*.022,.68,.052]],.006,C.gold);
    leaf(weapon,[[side*.025,.62,.03],[side*.07,.73,.03],[side*.1,.78,.015]],.018,.008,C.gold);
  }
  jewel(weapon,[0,.655,.055],.041);line(weapon,[[.018,.58,.02],[.12,.52,.04],[.16,.30,.05],[.13,.20,.07]],.019,C.red,'cloth');
  // Batching is per animated joint/material, not hundreds of independent meshes per frame.
  for(const w of weapons)batchGroup(w,new Set<T.Object3D>([piercedBlade]));
  for(const arm of arms){const exclude=new Set<T.Object3D>();grips.filter(g=>g.parent===arm).forEach(g=>g.traverse(o=>exclude.add(o)));batchGroup(arm,exclude);}
  for(const leg of legs)batchGroup(leg);batchGroup(cape);
  batchGroup(hair);hair.traverse(o=>{if(o instanceof T.Mesh)o.name='Hair_Locks';});
  batchGroup(beast);beast.traverse(o=>{if(o instanceof T.Mesh)o.name=o.material===material(C.gold,'satin-metal')?'Beast_Relief':'Lion_Detail';});
  const headExclude=new Set<T.Object3D>([face]);[...eyes,...brows,...plumes,hair].forEach(g=>g.traverse(o=>headExclude.add(o)));batchGroup(head,headExclude);
  const bodyExclude=new Set<T.Object3D>();[head,cape,...arms,beast].forEach(g=>g.traverse(o=>bodyExclude.add(o)));batchGroup(body,bodyExclude);
  return {id:'lvbu',root,rig,body,head,arms,legs,eyes,cape,weapons,grips,ornaments:{brows,plumes}};
}
