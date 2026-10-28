import * as T from 'three';
import { ModelKit, batchGroup } from './models';
import { CHARACTERS, type CharacterId } from '../characterCatalog';
const wristRotation=new T.Quaternion();const wristEuler=new T.Euler();
export const CHIBI_PROPORTIONS={headCenterY:1.08,headRadiusY:.355,scale:.8} as const;
export type CharacterMotion = 'idle'|'walk'|'arrival'|'recruit'|'victory';
export interface Figure { id:CharacterId;root:T.Group;rig:T.Group;body:T.Group;head:T.Group;arms:T.Group[];legs:T.Group[];eyes:T.Group[];cape:T.Mesh;weapons:T.Group[];grips:T.Group[] }

function curved(kit:ModelKit,parent:T.Object3D,key:string,points:number[][],radius:number,color:string) {
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p as [number,number,number])));
  const geo=kit.custom(key,()=>new T.TubeGeometry(curve,kit.detail==='display'?24:10,radius,kit.detail==='display'?8:5,false));
  const mesh=new T.Mesh(geo,kit.material(color));mesh.castShadow=true;parent.add(mesh);return mesh;
}
function blade(kit:ModelKit,parent:T.Object3D,key:string,outline:number[][],color:string,depth=.035) {
  const geometry=kit.custom(key,()=>{
    const shape=new T.Shape();
    if(key==='crescent-blade'){
      shape.moveTo(0,.61);shape.lineTo(.015,.92);shape.quadraticCurveTo(.17,1.05,.34,1.23);shape.bezierCurveTo(.38,1.05,.26,.79,.11,.69);shape.lineTo(.1,.61);
    }else if(key==='halberd-crescent'){
      shape.moveTo(.02,.64);shape.quadraticCurveTo(.3,.57,.29,.98);shape.quadraticCurveTo(.21,.8,.09,.81);shape.lineTo(.02,.81);
     }else{
      // Rounded polygon corners keep even the tiny blades toy-like rather than needle-sharp.
      const corners=outline.map((point,i)=>{const previous=outline[(i+outline.length-1)%outline.length],next=outline[(i+1)%outline.length];return {point,enter:[point[0]+(previous[0]-point[0])*.16,point[1]+(previous[1]-point[1])*.16],exit:[point[0]+(next[0]-point[0])*.16,point[1]+(next[1]-point[1])*.16]};});
      shape.moveTo(...corners[0].enter as [number,number]);
      for(const c of corners){shape.lineTo(...c.enter as [number,number]);shape.quadraticCurveTo(c.point[0],c.point[1],c.exit[0],c.exit[1]);}
    }
    shape.closePath();
    const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:kit.detail==='display'?3:1,steps:1,bevelSize:.012,bevelThickness:.012});g.translate(0,0,-depth/2);return g;
  });const mesh=new T.Mesh(geometry,kit.material(color,true));mesh.castShadow=true;parent.add(mesh);return mesh;
}
function makeWeapon(kit:ModelKit,parent:T.Object3D,id:CharacterId) {
  const p=CHARACTERS[id];const g=new T.Group();g.name=p.weapon;parent.add(g);g.position.set(0,0,.005);g.scale.x=parent.userData.side;g.userData.gripOrigin=[0,0,.005];
  const pole=['silver','beard','wild','plume'].includes(p.silhouette);
  if(pole) {
    kit.mesh(g,'cylinder','#6f5140',[0,.3,0],[.025,1.22,.025]);
    for(const y of [-.28,-.12,.25,.55])kit.mesh(g,'cylinder',p.accent,[0,y,0],[.03,.035,.03],true);
    if(p.silhouette==='beard') {
      blade(kit,g,'crescent-blade',[[0,.6],[.06,1.08],[.32,1.21],[.3,1.02],[.13,.76],[.13,.63]],'#8fb6ab',.045);
      curved(kit,g,'dragon-blade-trim',[[.04,.65,.028],[.12,.84,.028],[.25,1.04,.028]],.014,p.accent);
    } else if(p.silhouette==='wild') {
      curved(kit,g,'snake-spear',[[0,.66,0],[-.06,.79,0],[.065,.9,0],[-.025,1.03,0],[.035,1.16,0]],.027,'#c6d8dc');
      blade(kit,g,'snake-tip',[[.035,1.1],[.015,1.25],[.085,1.16]],'#d5e6e7');
    } else {
      blade(kit,g,'spear-point',[[0,.57],[-.065,.78],[0,1.03],[.065,.78]],'#d9e5e8');
      if(p.silhouette==='plume') {
        blade(kit,g,'halberd-crescent',[[.02,.66],[.17,.73],[.25,.94],[.33,.78],[.26,.54],[.08,.51]],'#c5d6db',.04);
        kit.box(g,p.accent,[.12,.6,0],[.32,.035,.055]);
      }
    }
    curved(kit,g,'weapon-tassel-'+p.silhouette,[[0,.55,.02],[.12,.49,.025],[.19,.33,.02]],.032,p.silhouette==='silver'?'#55a6c4':'#b34748');
  } else {
    kit.mesh(g,'cylinder','#614433',[0,-.015,0],[.032,.18,.032]);kit.ball(g,p.accent,[0,-.12,0],[.046,.04,.045]);
    kit.box(g,p.accent,[0,.095,0],[.22,.05,.07]);
    if(p.silhouette==='heavy')blade(kit,g,'heavy-cleaver',[[-.055,.13],[-.055,.69],[.08,.85],[.21,.71],[.18,.13]],'#acb6bb',.06);
    else blade(kit,g,'hero-sword',[[-.039,.13],[-.039,.61],[0,.74],[.039,.61],[.039,.13]],'#d5e4e8');
    kit.box(g,p.accent,[0,.145,0],[.085,.07,.045]);
  }
  return g;
}

export function createCharacter(kit:ModelKit,id:CharacterId):Figure {
  const p=CHARACTERS[id];const s=p.silhouette;const root=new T.Group();root.name='character-'+id;
  const rig=new T.Group();rig.name='whole-figure';root.add(rig);const body=new T.Group();body.name='torso';rig.add(body);const head=new T.Group();head.name='head';head.position.y=CHIBI_PROPORTIONS.headCenterY;body.add(head);
  const heavy=s==='heavy'||s==='wild';const width=s==='heavy'?.305:s==='wild'?.285:s==='young'||s==='silver'?.215:.245;
  const longRobe=s==='benevolent'||s==='beard';
  const clothGeo=kit.custom('robe-'+s,()=>new T.LatheGeometry([new T.Vector2(width*1.08,.16),new T.Vector2(width*1.18,.23),new T.Vector2(width,.43),new T.Vector2(width*.85,.65),new T.Vector2(width*.68,.77)],kit.detail==='display'?28:14));
  const robe=new T.Mesh(clothGeo,kit.material(p.robe));robe.scale.z=.78;robe.castShadow=true;body.add(robe);
  kit.ball(body,p.armor,[0,.61,.025],[width*.96,.23,.19]);
  // Separated collar, chestplate, skirt lames, waist sash, bracers and boots.
  for(const side of [-1,1]){
    const collar=kit.box(body,p.accent,[side*.07,.75,.15],[.04,.25,.025]);collar.rotation.z=side*.55;
    const shoulder=kit.ball(body,p.armor,[side*(width+.025),.72,-.01],[heavy?.18:.12,.09,.18]);shoulder.rotation.z=side*-.18;
    kit.ball(body,p.accent,[side*(width+.035),.75,.01],[heavy?.155:.105,.035,.15]);
    if(heavy||s==='commander')for(const y of [.61,.57])kit.box(body,p.accent,[side*.16,y,.183],[.095,.014,.017]);
  }
  const rows=kit.detail==='display'?4:2;
  if(!longRobe)for(let i=0;i<rows;i++){
    const y=.22+i*(.2/rows);const radius=width*(1.22-(y-.22)*.9)+.012;const plate=kit.mesh(body,'cylinder',i%2?p.armor:p.robe,[0,y,0],[radius,.052,radius*.78+.006]);plate.rotation.y=.04*i;
  }
  else for(const side of [-1,1]){const trim=kit.box(body,p.accent,[side*.15,.33,.18],[.027,.26,.025]);trim.rotation.z=side*-.17;}
  kit.mesh(body,'cylinder','#69503c',[0,.43,0],[width*1.07,.065,.215]);
  kit.ball(body,p.accent,[0,.43,.218],[.065,.06,.02]);kit.ball(body,s==='young'?'#64b59a':'#92b393',[0,.43,.24],[.028,.03,.014]);
  curved(kit,body,'sash-'+s,[[.11,.43,.19],[.19,.29,.22],[.17,.14,.25]],.025,p.robe);
  const capeGeo=kit.custom('cape-'+s,()=>{
    const vertices:number[]=[];const indices:number[]=[];const cols=kit.detail==='display'?16:8;const rows=8;
    for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){
      const t=y/rows,u=x/cols*2-1;vertices.push(u*(.17+t*(heavy?.26:.18)),.78-t*(longRobe?.62:.53),-.18-t*.14-Math.cos(u*Math.PI*3)*.018*t);
    }
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const a=y*(cols+1)+x;indices.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2);}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
  });
  const capeMaterial=kit.surface(s==='young'?'#eee6d4':s==='silver'?'#f5f2e9':s==='heavy'?'#95465d':p.armor,'cloth').clone();capeMaterial.side=T.DoubleSide;
  const cape=new T.Mesh(capeGeo,capeMaterial);cape.castShadow=true;body.add(cape);
  const arms:T.Group[]=[],legs:T.Group[]=[],eyes:T.Group[]=[],weapons:T.Group[]=[],grips:T.Group[]=[];
  for(const side of [-1,1]){
    const arm=new T.Group();arm.name=side<0?'left-arm':'right-arm';arm.position.set(side*(width+.09),.69,0);body.add(arm);arms.push(arm);
    kit.ball(arm,p.robe,[side*.01,-.12,0],[s==='young'?.075:.095,.17,.1]);
    kit.mesh(arm,'cylinder',p.armor,[side*.01,-.23,.015],[.09,.09,.09]);
    kit.mesh(arm,'cylinder',p.accent,[side*.01,-.2,.015],[.093,.02,.093],true);
    kit.ball(arm,p.skin,[side*.045,-.305,.065],[.075,.075,.075]);
    kit.ball(arm,p.skin,[side*.095,-.29,.09],[.035,.04,.035]);
    for(let i=0;i<3;i++)kit.ball(arm,p.skin,[side*.045,-.335+i*.022,.125],[.048,.012,.019]);
    const grip=new T.Group();grip.name='palm-grip';grip.position.set(side*.045,-.305,.065);grip.userData.side=side;arm.add(grip);grips.push(grip);
    const leg=new T.Group();leg.name=side<0?'left-leg':'right-leg';leg.position.set(side*.12,.28,0);rig.add(leg);legs.push(leg);
    kit.mesh(leg,'cylinder',p.armor,[0,-.085,0],[.072,.17,.075]);kit.ball(leg,'#3d3531',[0,-.2,.045],[.095,.07,.135]);
    kit.box(leg,p.accent,[0,-.18,.14],[.09,.022,.018]);
  }
  // Sculpted head volumes, layered ears, swept hair locks, eyelids and eyebrows.
  kit.ball(head,p.hair,[0,.02,-.025],[.36,CHIBI_PROPORTIONS.headRadiusY,.305]);kit.ball(head,p.skin,[0,-.02,.045],[.335,.315,.29]);
  for(const side of [-1,1]){
    kit.ball(head,p.skin,[side*.335,-.02,.025],[.063,.09,.065]);kit.ball(head,'#ca8c73',[side*.36,-.022,.065],[.025,.053,.023]);
    const eye=new T.Group();eye.position.set(side*.126,.004,.32);head.add(eye);eyes.push(eye);
    kit.ball(eye,'#f5f0df',[0,0,-.005],[.058,.077,.021]);kit.ball(eye,s==='young'?'#386c64':'#302c32',[0,-.003,.017],[.039,.061,.017]);
    kit.ball(eye,'#ffffff',[-.012,.021,.032],[.013,.018,.007]);kit.ball(eye,'#e7f4f0',[.013,-.026,.031],[.006,.008,.005]);
    const brow=kit.ball(head,p.hair,[side*.13,.112,.3],[.07,s==='wild'?.022:.014,.02]);brow.rotation.z=side*(s==='commander'||s==='heavy'?.16:s==='wild'?.23:-.055);
    kit.ball(head,p.skin,[side*.218,-.065,.265],[.072,.062,.05]);kit.ball(head,'#e1a394',[side*.218,-.075,.312],[.042,.018,.008]);
    const lock=kit.ball(head,p.hair,[side*.276,.085,.12],[.06,.145,.075]);lock.rotation.z=side*-.3;
  }
  kit.ball(head,p.skin,[0,-.064,.342],[.025,.029,.025]);
  const smile=curved(kit,head,'smile-'+s,[[-.045,-.14,.318],[0,-.156,.324],[.045,-.137,.318]],.009,'#9a5e51');smile.name='smile';
  if(s==='wild'||s==='heavy'){
    kit.ball(head,p.hair,[0,-.205,.16],[.25,.15,.15]);
    for(const side of [-1,1])kit.ball(head,p.hair,[side*.08,-.14,.28],[.09,.035,.028]);
  }else if(s==='beard'){
    for(const x of [-.1,0,.1])curved(kit,head,'long-beard-'+x,[[x,-.19,.26],[x*.85,-.35,.32],[x*.45,-.56,.25]],.047,p.hair);
    for(const side of [-1,1])curved(kit,head,'mustache-'+side,[[side*.01,-.13,.31],[side*.07,-.12,.32],[side*.13,-.16,.29]],.017,p.hair);
  }else if(s==='benevolent'||s==='commander'){
    for(const x of [-.032,0,.032])curved(kit,head,'short-beard-'+s+x,[[x,-.23,.245],[x*.8,-.28,.25],[x*.3,-.31,.23]],.02,p.hair);
    for(const side of [-1,1])kit.ball(head,p.hair,[side*.04,-.15,.3],[.045,.015,.017]);
  }
  // Hair locks give the uncrowned silhouette structure instead of a plain sphere.
  for(let i=0;i<(kit.detail==='display'?7:4);i++){
    const a=-1.1+i*.32;const lock=kit.ball(head,p.hair,[Math.sin(a)*.23,.22,Math.cos(a)*.16],[.085,.12,.095]);lock.rotation.z=-a*.3;
  }
  const hatY=.255;
  if(s==='silver'||s==='generic'){
    kit.ball(head,p.armor,[0,.17,-.035],[.35,.23,.29]);
    kit.mesh(head,'torus',p.accent,[0,.12,0],[.32,.25,.025],true).rotation.x=Math.PI/2;
    for(const side of [-1,1]){const cheek=kit.box(head,p.armor,[side*.28,-.025,.04],[.055,.22,.11]);cheek.rotation.z=side*-.18;}
    kit.box(head,p.accent,[0,.22,.26],[.055,.18,.03]);
    curved(kit,head,'silver-plume',[[0,.3,-.08],[0,.55,-.17],[0,.57,-.42]],.055,s==='silver'?'#eaf0eb':p.robe);
  }else if(s==='beard'||s==='wild'){
    kit.mesh(head,'cylinder',p.robe,[0,.27,0],[.325,.11,.26]);
    kit.box(head,p.accent,[0,.27,.268],[.16,.06,.027]);
    const knot=kit.ball(head,p.robe,[s==='wild'?.19:0,.39,-.08],[.1,.1,.09]);knot.rotation.z=.3;
    if(s==='wild')curved(kit,head,'wild-ribbon',[[.23,.29,-.1],[.39,.18,-.16],[.42,.05,-.24]],.03,'#b64d43');
  }else{
    kit.mesh(head,'cylinder',p.armor,[0,hatY,0],[s==='heavy'?.365:.325,.11,.26]);
    kit.mesh(head,'cylinder',p.accent,[0,hatY-.045,0],[s==='heavy'?.369:.33,.025,.265],true);
    if(s==='benevolent'){
      kit.box(head,p.armor,[0,.39,0],[.15,.21,.13]);kit.ball(head,'#78c4a0',[0,.265,.278],[.05,.05,.025]);
      for(const side of [-1,1])curved(kit,head,'crown-arch-'+side,[[side*.055,.32,0],[side*.05,.48,0],[0,.5,0]],.012,p.accent);
    }else if(s==='commander'){
      kit.box(head,p.armor,[0,.41,-.015],[.26,.25,.19]);kit.box(head,p.accent,[0,.42,.09],[.035,.18,.02]);
      for(const side of [-1,1]){const wing=kit.box(head,p.armor,[side*.34,.31,-.02],[.22,.055,.1]);wing.rotation.z=side*.16;}
    }else if(s==='young'){
      for(const x of [-.21,0,.21]){kit.mesh(head,'cone',p.accent,[x,.38,0],[.075,.2,.07]);kit.ball(head,p.accent,[x,.48,0],[.024,.025,.024]);}
      kit.ball(head,'#4da996',[0,.28,.278],[.065,.065,.025]);
    }else{
      const plumage=s==='plume'?'#b5464d':'#9a4968';
      for(const side of [-1,1]){
        curved(kit,head,'feather-'+s+side,[[side*.12,.3,-.06],[side*.2,.58,-.1],[side*.31,s==='plume'?.91:.66,-.28],[side*.42,s==='plume'?.88:.63,-.43]],.04,plumage);
        if(kit.detail==='display')for(let i=0;i<4;i++)curved(kit,head,'feather-barb-'+s+side+i,[[side*(.18+i*.04),.5+i*.07,-.13],[side*(.28+i*.04),.46+i*.07,-.12]],.014,p.accent);
      }
      kit.ball(head,p.accent,[0,.27,.28],[.065,.06,.03]);
    }
  }
  weapons.push(makeWeapon(kit,grips[0],id));
  if(s==='benevolent')weapons.push(makeWeapon(kit,grips[1],id));
  // Shared character-only finishes leave all terrain materials unchanged.
  root.traverse(o=>{if(o instanceof T.Mesh&&o!==cape&&!Array.isArray(o.material)){
    const old=o.material as T.MeshStandardMaterial;const color='#'+old.color.getHexString();
    o.material=kit.surface(color,old.metalness>.1||color===p.accent?'satin-metal':color===p.robe?'cloth':color==='#3d3531'||color==='#69503c'?'leather':'vinyl');
  }});
  // Keep eyes, head, cape and limb pivots out of static batching for animation.
  for(const weapon of weapons)batchGroup(weapon);
  for(const arm of arms){const excluded=new Set<T.Object3D>();grips.filter(g=>g.parent===arm).forEach(g=>g.traverse(o=>excluded.add(o)));batchGroup(arm,excluded);}
  for(const leg of legs)batchGroup(leg);
  const headExclude=new Set<T.Object3D>();eyes.forEach(e=>e.traverse(o=>headExclude.add(o)));batchGroup(head,headExclude);
  const exclude=new Set<T.Object3D>([cape]);[head,...arms,...legs].forEach(g=>g.traverse(o=>exclude.add(o)));batchGroup(body,exclude);
  root.scale.setScalar(CHIBI_PROPORTIONS.scale);root.userData.characterId=id;root.userData.dedicated=p.dedicated;
  return {id,root,rig,body,head,arms,legs,eyes,cape,weapons,grips};
}

/** Visual-only joint poses. No random numbers, timers or game-rule callbacks. */
export function animateCharacter(f:Figure,time:number,motion:CharacterMotion='idle',progress=0,reduced=false) {
  const p=CHARACTERS[f.id];const phase=time*2;const stride=motion==='walk'&&!reduced?Math.sin(progress*Math.PI*4):0;
  const t=T.MathUtils.clamp(progress,0,1);const breathe=reduced?0:Math.sin(phase)*.012;
  f.rig.rotation.set(0,0,0);f.rig.position.y=0;
  f.body.position.y=breathe+Math.abs(stride)*.03;f.body.rotation.set(0,0,reduced?0:Math.sin(time*1.2)*.012);f.head.rotation.set(0,0,0);
  f.arms.forEach((a,i)=>{a.position.y=.69;a.rotation.set(stride*.4*(i?1:-1)+(reduced?0:Math.sin(phase+i)*.025),0,i?.035:-.035);});
  f.legs.forEach((l,i)=>l.rotation.x=stride*.5*(i?-1:1));
  f.cape.rotation.x=-.055+(reduced?0:Math.sin(time*2.2)*.025);f.cape.rotation.z=reduced?0:Math.sin(time*1.7)*.016;
  const blink=!reduced&&time%4.2<.15?Math.max(.05,Math.abs(time%4.2-.075)/.075):1;f.eyes.forEach(e=>{e.scale.set(1,blink,1);});
  if(motion==='idle'){
    if(p.silhouette==='young')f.head.rotation.y=reduced?0:Math.sin(time*.75)*.075;
    if(p.silhouette==='commander')f.arms[0].rotation.x=-.12;
    if(p.silhouette==='heavy'){f.body.position.y*=1.5;f.head.rotation.z=reduced?0:Math.sin(time*.9)*.025;}
  }
  if(motion==='victory'||motion==='recruit'){
    const envelope=Math.sin(t*Math.PI);const amount=reduced?.8:envelope;
    f.arms[0].position.y+=amount*.26;f.arms[0].rotation.x=-.9*amount;f.arms[0].rotation.z=-.2*amount;
    if(p.silhouette==='benevolent'){f.arms[1].position.y+=amount*.24;f.arms[1].rotation.x=-.85*amount;f.arms[1].rotation.z=.2*amount;}
    if(p.silhouette==='commander'){f.arms[0].rotation.x=-1.1*amount;f.head.rotation.y=-.1*amount;}
    if(p.silhouette==='young'){f.arms[1].position.y+=amount*.22;f.arms[1].rotation.z=.5*amount;}
    if(p.silhouette==='heavy'||p.silhouette==='wild')f.body.rotation.z=Math.sin(t*Math.PI*2)*.045*amount;
    f.body.position.y+=amount*.04;f.eyes.forEach(e=>e.scale.x=1+amount*.04);
    if(motion==='recruit'&&!reduced){f.rig.rotation.y=(1-Math.pow(1-t,3))*Math.PI*2;f.rig.position.y=Math.sin(t*Math.PI)*.055;}
  }
  // Wrist counter-rotation keeps the grip attached and the long blades outside the face.
  f.grips.forEach((grip,i)=>{
    const arm=f.arms[i];const side=i?1:-1;wristRotation.setFromEuler(wristEuler.set(0,0,-side*.055+(reduced?0:Math.sin(time*1.3+i)*.008)));
    grip.quaternion.copy(arm.quaternion).invert().multiply(wristRotation);
  });
  if(motion==='arrival'&&!reduced)f.rig.position.y+=Math.sin(t*Math.PI)*.07;
}
