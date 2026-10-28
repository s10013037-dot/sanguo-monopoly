/** Rebuild the project's own articulated GLBs; no image conversion or external model downloads. */
import {mkdir,writeFile} from 'node:fs/promises';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {createLubuPrototype} from '../src/three/lubuArt.ts';
import {ModelKit} from '../src/three/models.ts';
import {disposeScene} from '../src/three/resources.ts';
// The exporter only needs Blob -> ArrayBuffer here (no textures or DOM).
globalThis.FileReader=class {
  result=null;
  readAsArrayBuffer(blob){blob.arrayBuffer().then(buffer=>{this.result=buffer;this.onloadend?.();});}
};
await mkdir(new URL('../src/assets/',import.meta.url),{recursive:true});
for(const detail of ['board','display']){
  const kit=new ModelKit(detail),figure=createLubuPrototype(kit);figure.root.updateMatrixWorld(true);
  figure.root.traverse(o=>{if(o.isMesh){const original=o.geometry;const key='export:'+original.uuid;o.geometry=kit.custom(key,()=>{const g=mergeVertices(original);g.normalizeNormals();return g;});}});
  try{
    const result=await new GLTFExporter().parseAsync(figure.root,{binary:true,onlyVisible:false});
    await writeFile(new URL(`../src/assets/lubu-${detail}.glb`,import.meta.url),Buffer.from(result));
    let triangles=0,draws=0;figure.root.traverse(o=>{if(o.isMesh){draws++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});
    console.log(`${detail}: ${Math.round(result.byteLength/1024)} KiB, ${triangles} triangles, ${draws} mesh parts`);
  }finally{disposeScene(figure.root);kit.dispose();}
}
