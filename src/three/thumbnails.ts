import * as T from 'three';
import {createLubuEnvironment} from './lubuLighting';
import { ModelKit } from './models';
import { createCharacter,animateCharacter } from './characters';
import {preloadLubu} from './lubuAsset';
import { disposeScene } from './resources';
import { type CharacterId } from '../characterCatalog';
const cache=new Map<CharacterId,string>();const waiting=new Map<CharacterId,{resolve:(s:string)=>void;reject:(e:unknown)=>void;promise:Promise<string>}>();let scheduled=false;
/** One temporary WebGL context per batch, never one context per card. Only PNG strings are cached. */
export function getThumbnail(id:CharacterId):Promise<string> {
  if(id==='lvbu'&&!cache.has(id))return preloadLubu('board').catch(()=>{/* Same authored surface fallback. */}).then(()=>queueThumbnail(id));
  return queueThumbnail(id);
}
function queueThumbnail(id:CharacterId):Promise<string>{
  if(cache.has(id))return Promise.resolve(cache.get(id)!);if(waiting.has(id))return waiting.get(id)!.promise;
  let resolve!:(s:string)=>void,reject!:(e:unknown)=>void;const promise=new Promise<string>((yes,no)=>{resolve=yes;reject=no;});waiting.set(id,{resolve,reject,promise});
  if(!scheduled){scheduled=true;requestAnimationFrame(flush);}return promise;
}
function flush(){scheduled=false;const tasks=[...waiting.entries()];let renderer:T.WebGLRenderer|undefined,studio:T.WebGLRenderTarget|undefined;
  try{
    renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setSize(192,224);renderer.setPixelRatio(1);renderer.toneMapping=T.ACESFilmicToneMapping;
    for(const [id,task] of tasks){const kit=new ModelKit('board');const scene=new T.Scene();
      try{
        if(id==='lvbu'){if(!studio)studio=createLubuEnvironment(renderer,true);scene.environment=studio.texture;scene.environmentIntensity=.35;}
        const figure=createCharacter(kit,id);animateCharacter(figure,1,'idle',0,true);scene.add(figure.root);scene.add(new T.HemisphereLight('#fff7df','#788799',2));const light=new T.DirectionalLight('#ffe5bd',2.5);light.position.set(-3,5,5);scene.add(light);
        const camera=new T.PerspectiveCamera(31,192/224,.1,20);camera.position.set(1.2,1.35,2.45);camera.lookAt(0,.94,0);renderer.render(scene,camera);
        const url=renderer.domElement.toDataURL('image/png');cache.set(id,url);task.resolve(url);
      }catch(e){task.reject(e);}finally{disposeScene(scene);kit.dispose();waiting.delete(id);}
    }
  }catch(e){tasks.forEach(([id,t])=>{t.reject(e);waiting.delete(id);});}finally{studio?.dispose();renderer?.dispose();renderer?.forceContextLoss();}
}
