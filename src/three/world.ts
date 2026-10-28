import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CELLS, CELL_META, LEADERS, type Game } from '../game';
import { ModelKit, createFigure, city, tileDecoration, type Figure, batchGroup } from './models';

export const STEP_MS = 800;
export const tilePoint = (i: number) => {
  const [row, col] = i < 7 ? [0, i] : i < 13 ? [i - 6, 6] : i < 19 ? [6, 18 - i] : [24 - i, 0];
  return new T.Vector3((col - 3) * 1.85, .48, (row - 3) * 1.85);
};
const colors = { start: '#deacb3', recruit: '#b5c5a0', money: '#e2c772', event: '#8db7b1', battle: '#c98e79' };
export interface WorldOptions { low: boolean; reduced: boolean; onStep: () => void; onSelect: (i: number) => void; onError: () => void }
export function createWorld(host: HTMLElement, initial: Game, options: WorldOptions) {
  const kit = new ModelKit(); const textures: T.Texture[] = []; const sprites: T.SpriteMaterial[] = [];
  const scene = new T.Scene(); scene.background = new T.Color('#e9eadc'); scene.fog = new T.Fog('#e9eadc', 35, 68);
  const renderer = new T.WebGLRenderer({ antialias: !options.low, alpha: false, powerPreference: options.low ? 'low-power' : 'default' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, options.low ? 1 : 1.5));
  renderer.shadowMap.enabled = !options.low; renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.domElement.setAttribute('aria-label', '真正 WebGL 3D 三國棋盤'); renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.dataset.engine = 'three-webgl'; host.append(renderer.domElement);
  const camera = new T.OrthographicCamera(-10, 10, 10, -10, .1, 100); camera.position.set(12, 17, 18);
  const controls = new OrbitControls(camera, renderer.domElement); controls.target.set(0, .3, 0);
  controls.enableDamping = true; controls.dampingFactor = .09; controls.minZoom = .7; controls.maxZoom = 2.3;
  controls.minPolarAngle = Math.PI * .18; controls.maxPolarAngle = Math.PI * .39;
  controls.maxTargetRadius = 5; controls.update(); controls.saveState();
  scene.add(new T.HemisphereLight('#fff6d8', '#7d9281', 1.6));
  const sun = new T.DirectionalLight('#fff0ce', 2.6); sun.position.set(-7, 16, 9); sun.castShadow = !options.low;
  sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -10; sun.shadow.camera.right = 10; sun.shadow.camera.top = 10; sun.shadow.camera.bottom = -10;
  sun.shadow.normalBias = .04; sun.shadow.bias = -.0002; scene.add(sun);
  const fill = new T.DirectionalLight('#bcdde8', 1); fill.position.set(8, 8, -10); scene.add(fill);
  const floor = kit.box(scene, '#dedfcf', [0, -.75, 0], [200, .2, 200]); floor.castShadow = false;
  kit.box(scene, '#5f7961', [0, -.2, 0], [13.7, .65, 13.7]);
  kit.box(scene, '#c1d1a5', [0, .12, 0], [13.5, .2, 13.5]);
  kit.box(scene, '#8eae7d', [0, .25, 0], [9.15, .12, 9.15]);
  function label(text: string, sub: string, bg = '#fff7dc') {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 96;
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(1, 1, 254, 94, 16); ctx.fill();
    ctx.strokeStyle = '#ac9a6b'; ctx.lineWidth = 3; ctx.stroke(); ctx.textAlign = 'center';
    ctx.fillStyle = '#344b42'; ctx.font = 'bold 34px "Microsoft JhengHei", sans-serif'; ctx.fillText(text, 128, 40);
    ctx.fillStyle = '#8a7754'; ctx.font = '23px "Microsoft JhengHei", sans-serif'; ctx.fillText(sub, 128, 77);
    const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace; textures.push(texture);
    const material = new T.SpriteMaterial({ map: texture, depthTest: false, transparent: true }); sprites.push(material);
    const sprite = new T.Sprite(material); sprite.scale.set(1.35, .51, 1); sprite.renderOrder = 5; return sprite;
  }
  const pickables: T.Mesh[] = []; const platforms: T.Mesh[] = []; const flags: T.Mesh[] = [];
  CELLS.forEach((cell, i) => {
    const point = tilePoint(i); const g = new T.Group(); g.position.copy(point); scene.add(g);
    const platform = kit.box(g, colors[cell.kind], [0, -.2, 0], [1.7, .4, 1.7]);
    // Each hoverable tile has its own material so highlighting cannot affect another tile.
    platform.material = (platform.material as T.MeshStandardMaterial).clone(); platform.userData.cell = i; pickables.push(platform); platforms.push(platform);
    kit.box(g, '#f1dfb1', [0, -.4, 0], [1.73, .08, 1.73]);
    const detail = new T.Group(); detail.position.set(0, .02, -.2); detail.scale.setScalar(.8); g.add(detail); tileDecoration(kit, detail, cell.kind, i);
    detail.traverse(o => { if (o instanceof T.Mesh && o.geometry === kit.geometry('box') && o.scale.z === .025) flags.push(o); });
    const plaque = label(`${String(i + 1).padStart(2, '0')} ${cell.name}`, CELL_META[cell.kind].label);
    plaque.position.set(0, .11, .78); g.add(plaque);
  });
  // Central miniature: faceted mountains, a winding water ribbon, fields, bridge and fortress.
  for (let i = 0; i < 7; i++) {
    const x = -3.8 + i * 1.15; const height = 1.2 + (i % 3) * .65;
    const mountain = kit.mesh(scene, 'cone', i % 2 ? '#839e7c' : '#a2b493', [x, .35 + height / 2, -3.2 + (i % 2) * .4], [1.05, height, .85]); mountain.rotation.y = i * .6;
    kit.mesh(scene, 'cone', '#dddcc1', [x, .35 + height * .86, -3.2 + (i % 2) * .4], [.31, height * .3, .26]).rotation.y = i * .6;
  }
  const riverCurve = new T.CatmullRomCurve3([new T.Vector3(2.8,.34,-4.4),new T.Vector3(1.4,.34,-2),new T.Vector3(2.3,.34,0),new T.Vector3(.2,.34,2),new T.Vector3(1,.34,4.5)]);
  const water = new T.Mesh(new T.TubeGeometry(riverCurve, 48, .38, 6, false), new T.MeshStandardMaterial({color:'#63bfc4',roughness:.27,metalness:.22}));
  water.scale.y = .1; water.position.y = .32; scene.add(water);
  const waterHighlights: T.Mesh[] = [];
  for(let i=0;i<10;i++){ const p=riverCurve.getPoint(i/10); const rip=kit.box(scene,'#bee9df',[p.x,.383,p.z],[.2,.01,.025]);waterHighlights.push(rip); }
  const road = kit.box(scene, '#d8c69a', [-1.2,.35,1.3], [4.7,.06,.32]);road.rotation.y=-.3;
  const bridge=kit.box(scene,'#b78f61',[1.25,.47,1.3],[1.25,.18,.65]);bridge.rotation.y=-.3;
  for(const z of [.95,1.65]){ kit.box(scene,'#856a4d',[1.25,.72,z],[1.35,.05,.05]);for(const x of [.7,1.8])kit.box(scene,'#856a4d',[x,.58,z],[.05,.35,.05]); }
  const castle=new T.Group();castle.position.set(-1.5,.38,-.35);scene.add(castle);city(kit,castle,0,1.7);
  const hamlet=new T.Group();hamlet.position.set(-3.2,.35,2.7);scene.add(hamlet);city(kit,hamlet,2,.75);
  for(let i=0;i<3;i++){const field=kit.box(scene,'#cbbb72',[-2.7+i*.3,.37,1.95],[.15,.04,.85]);field.rotation.y=-.3;}
  // Instanced trees and rocks keep draw calls bounded, even on mobile.
  const count = options.low ? 22 : 46;
  const trunks=new T.InstancedMesh(kit.geometry('cylinder'),kit.material('#886747'),count);
  const leaves=new T.InstancedMesh(kit.geometry('cone'),kit.material('#4e8d70'),count);
  const leafTops=new T.InstancedMesh(kit.geometry('cone'),kit.material('#76a679'),count);
  const matrix=new T.Matrix4();const q=new T.Quaternion();
  for(let i=0;i<count;i++){
    const angle=i*2.39996;const radius=2.8+(i%4)*.35;const x=Math.cos(angle)*radius;const z=Math.sin(angle)*radius;
    const s=.7+(i%3)*.15;
    matrix.compose(new T.Vector3(x,.57,z),q,new T.Vector3(.055,.5,.055));trunks.setMatrixAt(i,matrix);
    matrix.compose(new T.Vector3(x,.94,z),q,new T.Vector3(.28*s,.73*s,.28*s));leaves.setMatrixAt(i,matrix);
    matrix.compose(new T.Vector3(x,1.2,z),q,new T.Vector3(.21*s,.56*s,.21*s));leafTops.setMatrixAt(i,matrix);
  }
  for(const mesh of [trunks,leaves,leafTops]){mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);}
  for(let i=0;i<8;i++)kit.ball(scene,'#a3aa95',[-3.9+(i%4)*2.3,.42,-1.7+Math.floor(i/4)*4.7],[.2,.16,.18]);
  batchGroup(scene, new Set<T.Object3D>([...platforms, ...flags, ...waterHighlights]));
  const figures: Figure[] = initial.players.map(p=>createFigure(kit,p.leader));
  const nameTags=initial.players.map(p=>{const tag=label(LEADERS[p.leader].name,'主公');tag.scale.set(.65,.25,1);tag.renderOrder=7;scene.add(tag);return tag;});
  figures.forEach(f=>scene.add(f.root));
  const ring = kit.mesh(scene,'torus','#ffe293',[0,.53,0],[.7,.7,.7],true);ring.rotation.x=-Math.PI/2;ring.castShadow=false;
  const particles = new T.InstancedMesh(kit.geometry('sphere'), kit.material('#ffdc86',true), 20); particles.visible=false; scene.add(particles);
  const dice=new T.Group();dice.position.set(-3.1,1,3.4);scene.add(dice);
  kit.box(dice,'#fff3d9',[0,0,0],[.7,.7,.7]);
  const pipPositions=[[0,0],[.17,.17],[-.17,-.17],[.17,-.17],[-.17,.17],[0,.18]];
  const pips=pipPositions.map(([x,y])=>kit.ball(dice,'#425951',[x,y,.36],[.045,.045,.018]));
  let game=initial;let onStep=options.onStep;let animationKey='';let step: {start:number;from:T.Vector3;to:T.Vector3;index:number;angle:number;called:boolean}|null=null;
  let effectUntil=0;let effectPosition=new T.Vector3();let previousArmy=initial.players.map(p=>p.army.length);
  let follow=false;let stopped=false;let hovered=-1;let pointerDown=new T.Vector2();let elapsed=0;let lastTime=0;let frame=0;
  function figurePosition(index:number,pos=game.players[index].pos){const point=tilePoint(pos);point.x+=(index%2===0?-.39:.39);point.z+=(index<2?-.15:.58);return point;}
  figures.forEach((f,i)=>f.root.position.copy(figurePosition(i)));
  function update(next:Game, callback=onStep){
    game=next;onStep=callback;
    // A restart may select a different ruler without reusing the old model.
    figures.forEach((f,i)=>{f.root.userData.leader=game.players[i].leader;});
    const key=`${game.turns}:${game.active}:${game.players[game.active].pos}:${game.steps}`;
    if(game.phase==='moving'&&key!==animationKey){
      animationKey=key;const index=game.active;const from=figurePosition(index);const to=figurePosition(index,(game.players[index].pos+1)%24);
      step={start:performance.now(),from,to,index,angle:Math.atan2(to.x-from.x,to.z-from.z),called:false};
    }else if(game.phase!=='moving'){step=null;animationKey='';figures.forEach((f,i)=>f.root.position.copy(figurePosition(i)));}
    game.players.forEach((p,i)=>{if(p.army.length>previousArmy[i]){effectPosition.copy(figurePosition(i));effectUntil=performance.now()+1800;} });
    previousArmy=game.players.map(p=>p.army.length);
    const patterns = [[], [[0,0]], [[-.17,.17],[.17,-.17]], [[-.17,.17],[0,0],[.17,-.17]], [[-.17,-.17],[-.17,.17],[.17,-.17],[.17,.17]], [[-.17,-.17],[-.17,.17],[.17,-.17],[.17,.17],[0,0]], [[-.17,-.2],[-.17,0],[-.17,.2],[.17,-.2],[.17,0],[.17,.2]]];
    pips.forEach((pip,i)=>{pip.visible=i<game.dice;const p=patterns[game.dice][i];if(p)pip.position.set(p[0],p[1],.36);});
  }
  update(initial);
  const raycaster=new T.Raycaster();const pointer=new T.Vector2();
  function pick(event:PointerEvent){const bounds=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(pickables)[0]?.object.userData.cell as number|undefined;}
  function pointerMove(event:PointerEvent){hovered=pick(event)??-1;renderer.domElement.style.cursor=hovered>=0?'pointer':'grab';}
  function down(event:PointerEvent){pointerDown.set(event.clientX,event.clientY);}
  function up(event:PointerEvent){if(pointerDown.distanceTo(new T.Vector2(event.clientX,event.clientY))<7){const i=pick(event);if(i!==undefined)options.onSelect(i);}}
  renderer.domElement.addEventListener('pointermove',pointerMove);renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);
  function contextLost(event:Event){event.preventDefault();options.onError();}renderer.domElement.addEventListener('webglcontextlost',contextLost);
  function resize(){const w=host.clientWidth;const h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);const aspect=w/h;const span=aspect<1?9.1/aspect:9.1;camera.left=-span*aspect;camera.right=span*aspect;camera.top=span;camera.bottom=-span;camera.updateProjectionMatrix();}
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  function render(now:number){
    if(stopped)return;frame=requestAnimationFrame(loop);
    if(document.hidden)return;
    if(options.low&&now-lastTime<32)return;const dt=Math.min((now-lastTime)/1000,.05);lastTime=now;elapsed+=dt;
    const active=game.active;
    figures.forEach((f,i)=>{
      const moving=step?.index===i&&game.phase==='moving';let stride=0;
      if(moving&&step){
        const t=T.MathUtils.clamp((now-step.start)/STEP_MS,0,1);f.root.position.lerpVectors(step.from,step.to,t);
        const delta=Math.atan2(Math.sin(step.angle-f.root.rotation.y),Math.cos(step.angle-f.root.rotation.y));f.root.rotation.y+=delta*Math.min(1,dt*15);
        stride=options.reduced?0:Math.sin(t*Math.PI*4);
        f.root.position.y+=options.reduced?0:Math.abs(stride)*.07+Math.sin(Math.max(0,t-.78)/.22*Math.PI)*.07;
        if(t>=1&&!step.called){step.called=true;f.root.position.copy(step.to);onStep();}
      }else{f.root.position.y=figurePosition(i).y+(options.reduced?0:Math.sin(elapsed*2+i)*.012);}
      f.arms.forEach((a,j)=>a.rotation.x=stride*.4*(j?1:-1));f.legs.forEach((l,j)=>l.rotation.x=stride*.5*(j?-1:1));
      f.body.position.y=options.reduced?0:Math.abs(stride)*.025;f.cape.rotation.x=-.15+(options.reduced?0:Math.sin(elapsed*3+i)*.04);
      nameTags[i].visible=i===active;nameTags[i].position.copy(f.root.position).add(new T.Vector3(0,1.55,0));
    });
    const point=figures[active].root.position;ring.position.set(point.x,.52,point.z);ring.scale.setScalar(.65+(options.reduced?0:Math.sin(elapsed*3)*.03));
    const battle=game.phase==='battle';(ring.material as T.MeshStandardMaterial).color.set(battle?'#ff7a59':'#ffe293');
    platforms.forEach((p,i)=>{const m=p.material as T.MeshStandardMaterial;m.emissive.set(i===hovered?'#635c26':i===game.players[active].pos?(battle?'#652b1c':'#3b4216'):'#000000');});
    if(follow&&step){const desired=new T.Vector3(point.x*.16,.3,point.z*.16);const shift=desired.sub(controls.target).multiplyScalar(.035);controls.target.add(shift);camera.position.add(shift);}
    const effectRemaining=effectUntil-now;particles.visible=effectRemaining>0&&!options.reduced;
    if(particles.visible){const t=1-effectRemaining/1800;for(let i=0;i<20;i++){const a=i*2.4;matrix.compose(effectPosition.clone().add(new T.Vector3(Math.cos(a)*t,.3+t*2,Math.sin(a)*t)),q,new T.Vector3(.035,.035,.035));particles.setMatrixAt(i,matrix);}particles.instanceMatrix.needsUpdate=true;}
    if(!options.reduced){flags.forEach((f,i)=>f.rotation.y=Math.sin(elapsed*2+i)*.1);waterHighlights.forEach((w,i)=>w.position.y=.386+Math.sin(elapsed*2+i)*.004);}
    if(game.phase==='moving'&&!options.reduced){dice.rotation.x+=dt*6;dice.rotation.y+=dt*5;}else dice.rotation.set(0,.3,0);
    controls.update();renderer.render(scene,camera);
    renderer.domElement.dataset.drawCalls=String(renderer.info.render.calls);
    // Small, non-secret runtime diagnostics support browser acceptance tests and troubleshooting.
    renderer.domElement.dataset.scene=JSON.stringify({tiles:24,heroes:figures.map(f=>({leader:f.root.userData.leader,position:f.root.position.toArray(),yaw:f.root.rotation.y,limbs:f.arms.length+f.legs.length,stride:f.legs[0].rotation.x})),moving:game.phase==='moving',selected:hovered,webgl:renderer.getContext() instanceof WebGL2RenderingContext});
  }
  function loop(now:number){try{render(now);}catch{cancelAnimationFrame(frame);options.onError();}}
  frame=requestAnimationFrame(loop);
  return {
    update, focus(){const point=figures[game.active].root.position;const shift=point.clone().sub(controls.target);controls.target.copy(point);camera.position.add(shift);camera.zoom=2.1;camera.updateProjectionMatrix();}, reset(){controls.reset();}, zoom(factor:number){camera.zoom=T.MathUtils.clamp(camera.zoom*factor,.7,2.3);camera.updateProjectionMatrix();}, setFollow(value:boolean){follow=value;},
    dispose(){stopped=true;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();renderer.domElement.removeEventListener('webglcontextlost',contextLost);renderer.domElement.removeEventListener('pointermove',pointerMove);renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',up);const geometries=new Set<T.BufferGeometry>();const materials=new Set<T.Material>();scene.traverse(o=>{if(o instanceof T.Mesh){geometries.add(o.geometry);const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>materials.add(m));}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());sprites.forEach(s=>s.dispose());textures.forEach(t=>t.dispose());kit.dispose();renderer.dispose();renderer.domElement.remove();}
  };
}
export type World = ReturnType<typeof createWorld>;
