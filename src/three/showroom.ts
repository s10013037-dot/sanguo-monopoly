import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {createLubuEnvironment} from './lubuLighting';
import { ModelKit } from './models';
import { createCharacter,animateCharacter,type CharacterMotion } from './characters';
import { type CharacterId } from '../characterCatalog';
export {preloadLubu} from './lubuAsset';
import { disposeScene } from './resources';
export function createShowroom(host:HTMLElement,id:CharacterId,low:boolean,onError:()=>void) {
  const kit=new ModelKit(low?'board':'display');const scene=new T.Scene();scene.background=new T.Color('#e8e8db');
  const renderer=new T.WebGLRenderer({antialias:!low,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,low?1:1.5));
  renderer.shadowMap.enabled=!low;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.domElement.dataset.engine='character-showroom';renderer.domElement.setAttribute('aria-label','可旋轉的 3D 全身公仔');renderer.domElement.setAttribute('role','img');host.append(renderer.domElement);
  const camera=new T.PerspectiveCamera(28,1,.1,30);camera.position.set(1.8,1.55,3.35);
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.83,0);controls.enablePan=false;controls.enableDamping=true;controls.minDistance=2.4;controls.maxDistance=6.5;controls.minPolarAngle=.35;controls.maxPolarAngle=1.75;controls.update();controls.saveState();
  const ambient=new T.HemisphereLight('#fff7e7','#8792a3',2.25);scene.add(ambient);
  const key=new T.DirectionalLight('#ffeedb',2.2);key.position.set(-3,6,4);key.castShadow=!low;key.shadow.mapSize.set(512,512);key.shadow.camera.left=-2;key.shadow.camera.right=2;key.shadow.camera.top=3;key.shadow.camera.bottom=-2;key.shadow.normalBias=.04;key.shadow.bias=-.0002;scene.add(key);
  const rim=new T.DirectionalLight('#c6e1ed',1.3);rim.position.set(3,3,-3);scene.add(rim);
  const podium=kit.mesh(scene,'cylinder','#5d786c',[0,-.07,0],[.68,.12,.68]);const podiumRim=kit.mesh(scene,'cylinder','#d1b777',[0,-.13,0],[.69,.035,.69],true);
  let currentId=id;let modelKit=new ModelKit(low?'board':'display');let figure=createCharacter(modelKit,id);scene.add(figure.root);
  const halo=kit.mesh(scene,'torus','#e1c17b',[0,.015,0],[.53,.53,.53],true);halo.rotation.x=-Math.PI/2;halo.visible=false;
  const floor=kit.box(scene,'#e1e2d5',[0,-.19,0],[100,.1,100]);floor.castShadow=false;
  const defaultPodium=podium.material,defaultRim=podiumRim.material;
  const stageRing=new T.Mesh(kit.custom('lubu-stage-ring',()=>new T.TorusGeometry(.59,.006,6,64)),kit.surface('#c39d63','satin-metal'));stageRing.rotation.x=-Math.PI/2;stageRing.position.y=-.006;
  const extraFill=new T.DirectionalLight('#fff1dc',.7);extraFill.position.set(2,2,4);
  let studio:T.WebGLRenderTarget|undefined;
  function styleCharacter(){const lubu=currentId==='lvbu';scene.background=new T.Color(lubu?'#ded8cb':'#e8e8db');controls.minDistance=lubu?.8:2.4;key.shadow.mapSize.set(lubu?1024:512,lubu?1024:512);if(lubu){if(!studio)studio=createLubuEnvironment(renderer,low);scene.environment=studio.texture;scene.environmentIntensity=.35;ambient.intensity=.9;key.intensity=1.9;key.shadow.normalBias=.012;extraFill.intensity=.45;scene.add(extraFill,stageRing);figure.root.traverse(o=>{if(o instanceof T.Mesh&&o.name==='Face_PVC')o.receiveShadow=false;});podium.material=kit.surface('#403b3c');podiumRim.material=kit.surface('#b89557','satin-metal');}else{scene.environment=null;ambient.intensity=2.25;key.intensity=2.2;key.shadow.normalBias=.04;extraFill.removeFromParent();stageRing.removeFromParent();podium.material=defaultPodium;podiumRim.material=defaultRim;}}
  styleCharacter();
  let framed=false;
  function frameCharacter(){figure.root.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(figure.root),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());const distance=Math.max(size.y,size.x/camera.aspect)/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)))*1.25;controls.target.set(center.x,center.y,0);camera.position.copy(controls.target).add(new T.Vector3(1.35,.65,3.4).normalize().multiplyScalar(T.MathUtils.clamp(distance,2.7,5)));controls.update();controls.saveState();framed=true;}
  let motion:CharacterMotion='idle';let motionStart=performance.now();let frame=0;let stopped=false;let last=0;let elapsed=0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();if(!framed)frameCharacter();}
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  const lost=(e:Event)=>{e.preventDefault();onError();};renderer.domElement.addEventListener('webglcontextlost',lost);
  function facingWeapon(){return figure.grips[0]?.quaternion.toArray();}
  function tick(now:number){if(stopped)return;frame=requestAnimationFrame(tick);if(document.hidden)return;if(low&&now-last<32)return;elapsed+=Math.min((now-last)/1000,.05);last=now;
    try{
      const progress=Math.min(1,(now-motionStart)/2200);animateCharacter(figure,elapsed,motion,progress,reduced);
      figure.root.position.y=(currentId==='lvbu'?-.01:0)+(motion==='recruit'&&!reduced?Math.sin(progress*Math.PI)*.13:0);
      halo.visible=motion==='recruit';halo.scale.setScalar(.53+(reduced?0:Math.sin(elapsed*3)*.035));
      if(motion!=='idle'&&progress>=1){motion='idle';figure.root.position.y=currentId==='lvbu'?-.01:0;halo.visible=false;}
      controls.update();renderer.render(scene,camera);
      renderer.domElement.dataset.character=currentId;renderer.domElement.dataset.motion=motion;
      renderer.domElement.dataset.pose=JSON.stringify({eyes:figure.eyes.map(e=>e.scale.y),arms:figure.arms.map(a=>a.rotation.x),head:figure.head.rotation.y,spin:figure.rig.rotation.y,...(currentId==='lvbu'?{legs:figure.legs.map(l=>l.rotation.x),source:figure.root.userData.source,revision:figure.root.userData.artRevision,brows:figure.ornaments?.brows.map(o=>o.rotation.z),plumes:figure.ornaments?.plumes.map(o=>o.rotation.z),weapon:facingWeapon()}:{}),vertices:renderer.info.render.triangles,limbs:figure.arms.length+figure.legs.length,camera:camera.position.toArray()});
    }catch{cancelAnimationFrame(frame);onError();}
  }
  frame=requestAnimationFrame(tick);
  return {setCharacter(nextId:CharacterId){if(nextId===currentId)return;scene.remove(figure.root);disposeScene(figure.root);modelKit.dispose();modelKit=new ModelKit(low?'board':'display');figure=createCharacter(modelKit,nextId);scene.add(figure.root);currentId=nextId;motion='idle';motionStart=performance.now();halo.visible=false;styleCharacter();frameCharacter();},play(value:CharacterMotion){motion=value;motionStart=performance.now();},reset(){controls.reset();},zoom(factor:number){camera.position.sub(controls.target).multiplyScalar(factor).clampLength(currentId==='lvbu'?.8:2.4,6.5).add(controls.target);controls.update();},
    view(angle:'front'|'side'|'back'){if(currentId!=='lvbu')return;controls.reset();const distance=camera.position.distanceTo(controls.target);const direction=angle==='front'?new T.Vector3(0,.13,1):angle==='side'?new T.Vector3(-1,.13,0):new T.Vector3(0,.13,-1);camera.position.copy(controls.target).addScaledVector(direction.normalize(),distance);controls.update();},
    face(){if(currentId!=='lvbu')return;controls.target.set(0,1.01,.05);camera.position.set(0,1.07,1.9);controls.update();},
    dispose(){stopped=true;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();renderer.domElement.removeEventListener('webglcontextlost',lost);scene.environment=null;studio?.dispose();disposeScene(scene);modelKit.dispose();kit.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}
  };
}
export type Showroom=ReturnType<typeof createShowroom>;
