import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
/** Self-contained studio reflections from Three.js's MIT-licensed room. No downloaded HDRI. */
export function createLubuEnvironment(renderer:T.WebGLRenderer,low:boolean){
  const generator=new T.PMREMGenerator(renderer),room=new RoomEnvironment();
  try{return generator.fromScene(room,.045,.1,20,{size:low?64:128});}
  finally{room.dispose();generator.dispose();}
}
