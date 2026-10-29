/** Rebuild the project's own articulated GLBs; no image conversion or external model downloads. */
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
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
const rawDir=new URL('../node_modules/.cache/lubu-control/',import.meta.url);
await mkdir(rawDir,{recursive:true});
for(const detail of ['board','display']){
  const kit=new ModelKit(detail),figure=createLubuPrototype(kit);figure.root.updateMatrixWorld(true);
  figure.root.traverse(o=>{if(o.isMesh){const original=o.geometry;const key='export:'+original.uuid;o.geometry=kit.custom(key,()=>{const g=mergeVertices(original);g.normalizeNormals();return g;});}});
  try{
    const result=await new GLTFExporter().parseAsync(figure.root,{binary:true,onlyVisible:false});
    await writeFile(new URL(`lubu-${detail}.glb`,rawDir),Buffer.from(result));
    let triangles=0,draws=0;figure.root.traverse(o=>{if(o.isMesh){draws++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});
    console.log(`${detail}: ${Math.round(result.byteLength/1024)} KiB, ${triangles} triangles, ${draws} mesh parts`);
  }finally{disposeScene(figure.root);kit.dispose();}
}

execFileSync(process.env.BLENDER_PATH||'blender',['--background','--factory-startup','--python-exit-code','1','--python',fileURLToPath(new URL('./polish-lubu.py',import.meta.url)),'--','--input-dir',fileURLToPath(rawDir),'--output-dir',fileURLToPath(new URL('../src/assets/',import.meta.url)),'--report',fileURLToPath(new URL('../docs/v3-7/model-build.json',import.meta.url))],{stdio:'inherit'});
