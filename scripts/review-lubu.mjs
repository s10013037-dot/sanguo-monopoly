/** Capture the actual production app, never a replacement illustration. Node.js 24 + Chromium. */
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {chromium,expect} from '@playwright/test';
import {createGame,SAVE_KEY} from '../src/game.ts';
const dist=new URL('../dist/',import.meta.url),out=new URL('../docs/v3-7/screenshots/',import.meta.url),prefix='/sanguo-monopoly/';
const server=createServer(async(req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(!pathname.startsWith(prefix)){res.writeHead(404).end();return;}
  const file=pathname.slice(prefix.length)||'index.html';
  const url=new URL(file,dist);if(!url.href.startsWith(dist.href)){res.writeHead(403).end();return;}
  try{const data=await readFile(url);res.setHeader('Content-Type',file.endsWith('.glb')?'model/gltf-binary':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html; charset=utf-8');res.end(data);}catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));await mkdir(out,{recursive:true});
const base=`http://127.0.0.1:${server.address().port}${prefix}`;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
try{
  const page=await browser.newPage({viewport:{width:1440,height:1100},reducedMotion:'reduce'}),errors=[],assets=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('requestfailed',r=>errors.push(r.url()));
  page.on('response',r=>{if(['script','stylesheet'].includes(r.request().resourceType())||r.url().endsWith('.glb'))assets.push({path:new URL(r.url()).pathname,status:r.status()});});
  await page.goto(base);const g=createGame(0);g.players[0].army=[3];await page.evaluate(({g,key})=>localStorage.setItem(key,JSON.stringify(g)),{g,key:SAVE_KEY});await page.reload();
  const card=page.getByRole('button',{name:'查看呂布詳細資訊'});await expect(card.locator('img')).toHaveAttribute('src',/^data:image\/png/,{timeout:20000});
  const saved=await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY);await card.click();
  const canvas=page.locator('[data-engine="character-showroom"]');await expect(canvas).toHaveAttribute('data-character','lvbu',{timeout:20000});
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-pose'))||'{}').source).toBe('glb');
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-pose'))||'{}').revision).toBe('3.7.0');
  await page.getByRole('dialog').screenshot({path:fileURLToPath(new URL('hero.png',out))});console.log('Captured hero');
  for(const [label,file] of [['正面','front'],['左側面','left'],['背面','back'],['臉部特寫','face']]){
    await page.getByRole('button',{name:label,exact:true}).click();await page.waitForTimeout(350);
    await page.getByRole('dialog').screenshot({path:fileURLToPath(new URL(file+'.png',out))});console.log('Captured',file);
  }
  await page.getByRole('button',{name:'返回棋局'}).click();expect(await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY)).toBe(saved);await expect(page.getByRole('button',{name:'擲骰子，出發！'})).toBeEnabled();
  expect(errors).toEqual([]);expect(assets.some(a=>/lubu-display.*\.glb/.test(a.path))).toBe(true);expect(assets.some(a=>/lubu-board.*\.glb/.test(a.path))).toBe(true);expect(assets.every(a=>a.path.startsWith(prefix)&&a.status===200)).toBe(true);
  const manifest=JSON.parse(await readFile(new URL('../docs/v3-7/model-build.json',import.meta.url),'utf8'));
  for(const detail of ['board','display']){const asset=assets.find(a=>a.path.includes('lubu-'+detail));const response=await page.request.get(new URL(asset.path,base).href);expect(createHash('sha256').update(await response.body()).digest('hex')).toBe(manifest.assets[detail].sha256);}
  await writeFile(new URL('verification.json',out),JSON.stringify({revision:'3.7.0',sha256Matched:true,engine:'Chromium WebGL / SwiftShader',productionBase:prefix,model:'actual GLB',screenshots:['hero','front','left','back','face'],screenshotReducedMotion:true,saveUnchanged:true,errors,assets},null,2)+'\n');
  console.log('PASS: actual production GLBs and scripts/CSS load under Pages prefix; five screenshots; save unchanged; no console/page/network errors.');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
