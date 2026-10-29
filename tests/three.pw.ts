import { test, expect, type Page } from '@playwright/test';
import { createGame, SAVE_KEY } from '../src/game';
async function start(page:Page, pos=0) {
  const g=createGame(0);g.players[0].pos=pos;
  await page.goto('./');await page.evaluate(({key,g})=>localStorage.setItem(key,JSON.stringify(g)),{key:SAVE_KEY,g});await page.reload();
  await expect(page.locator('canvas[data-engine="three-webgl"]')).toBeVisible({timeout:15000});
  await expect.poll(()=>page.locator('canvas').getAttribute('data-scene')).not.toBeNull();
}
async function snapshot(page:Page){return JSON.parse((await page.locator('canvas').getAttribute('data-scene'))!);}

test('真正 WebGL2 棋盤、四個完整模型、分散站位、可旋轉和縮放',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await start(page);
  const scene=await snapshot(page);expect(scene.webgl).toBe(true);expect(scene.tiles).toBe(24);
  expect(scene.heroes.map((h:{leader:number})=>h.leader)).toEqual([0,1,2,3]);expect(scene.heroes.every((h:{limbs:number})=>h.limbs===4)).toBe(true);
  for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)expect(Math.hypot(scene.heroes[i].position[0]-scene.heroes[j].position[0],scene.heroes[i].position[2]-scene.heroes[j].position[2])).toBeGreaterThan(.4);
  const canvas=page.locator('canvas');const before=await canvas.screenshot();await page.getByRole('button',{name:'放大棋盤'}).click();await page.waitForTimeout(300);expect(await canvas.screenshot()).not.toEqual(before);
  await page.getByRole('button',{name:'重設視角'}).click();
  const box=(await canvas.boundingBox())!;await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.7,box.y+box.height*.55,{steps:8});await page.mouse.up();
  await page.getByRole('combobox',{name:'查看地點'}).selectOption('4');await expect(page.locator('.location-detail')).toContainText('虎牢關');await expect(page.locator('.location-detail')).toContainText('自動作戰');
  expect(Number(await canvas.getAttribute('data-draw-calls'))).toBeLessThan(650);expect(errors).toEqual([]);
});

test('六點跨轉角：3D 真實位移、交替擺腿、到站後招募與存檔',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>.99;});await start(page,5);
  const positions:number[]=[];await page.evaluate(()=>{(window as Window&{visited:number[]}).visited=[];let old=5;const timer=setInterval(()=>{const g=JSON.parse(localStorage.getItem('sanguo-monopoly-v1')!);if(g.players[0].pos!==old){old=g.players[0].pos;(window as Window&{visited:number[]}).visited.push(old);}if(g.phase!=='moving'&&g.players[0].pos!==5)clearInterval(timer);},30);});
  const before=await snapshot(page);await page.getByRole('button',{name:'擲骰子，出發！'}).click();
  // Software WebGL can still expose the previous frame after a fixed 350 ms delay.
  // Wait for one rendered frame that proves motion, displacement and leg animation together.
  await expect.poll(async()=>{const during=await snapshot(page);return during.moving&&JSON.stringify(during.heroes[0].position)!==JSON.stringify(before.heroes[0].position)&&Math.abs(during.heroes[0].stride)>.001;},{timeout:3000,intervals:[50,100,150]}).toBe(true);
  await expect(page.getByRole('button',{name:/行軍中/})).toBeDisabled();
  const mid=JSON.parse((await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY))!);expect(mid.players[0].army).toEqual([1]);
  await expect(page.getByRole('button',{name:'結束回合'})).toBeVisible({timeout:15000});
  positions.push(...await page.evaluate(()=>(window as Window&{visited:number[]}).visited));expect(positions).toEqual([6,7,8,9,10,11]);
  const result=await snapshot(page);expect(result.heroes[0].yaw).toBeCloseTo(0,0);
  const saved=await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY);expect(JSON.parse(saved!).players[0].army.length).toBe(2);
  await page.reload();await expect(page.locator('canvas')).toBeVisible();await expect(page.getByRole('button',{name:'結束回合'})).toBeVisible();expect(await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY)).toBe(saved);
});

test('低畫質、手機版、武將兵種與詳細資訊可操作',async({page})=>{
  await page.setViewportSize({width:390,height:844});await start(page);
  await page.getByRole('combobox',{name:'3D 畫質'}).selectOption('low');await expect(page.locator('canvas')).toBeVisible();await expect.poll(()=>snapshot(page).then(s=>s.webgl)).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'查看關羽詳細資訊'}).click();await expect(page.getByRole('dialog')).toContainText('重騎兵');await expect(page.getByRole('dialog')).toContainText('240 金');await page.getByRole('button',{name:'返回棋局'}).click();
  await page.getByRole('button',{name:'擲骰子，出發！'}).click();await expect(page.getByRole('button',{name:/結束回合|跳過戰鬥/})).toBeVisible({timeout:15000});
});

test('WebGL 無法啟動可玩 2D 備援；存檔、招募與結算仍正常',async({page})=>{
  await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type:string,...args:unknown[]){if(type==='webgl'||type==='webgl2')return null;return get.apply(this,[type,...args] as never);} as typeof get;Math.random=()=>0;});
  await page.goto('./');await page.getByRole('button',{name:/啟程，逐鹿天下/}).click();await expect(page.getByRole('alert')).toContainText('無法啟動 WebGL');await expect(page.locator('.cell')).toHaveCount(24);
  await page.getByRole('button',{name:'擲骰子，出發！'}).click();await expect(page.getByRole('button',{name:'結束回合'})).toBeVisible();await expect(page.getByRole('heading',{name:'趙雲',exact:true})).toBeVisible();
});

test('行軍中 context lost 接續備援，招募事件只結算一次',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0;});await start(page);
  await page.getByRole('button',{name:'擲骰子，出發！'}).click();await page.waitForTimeout(200);
  await page.locator('canvas').evaluate((canvas:HTMLCanvasElement)=>canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true})));
  await expect(page.getByRole('alert')).toContainText('3D 顯示中斷');await expect(page.locator('.cell')).toHaveCount(24);
  await expect(page.getByRole('button',{name:'結束回合'})).toBeVisible();
  const save=JSON.parse((await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY))!);expect(save.players[0].pos).toBe(1);expect(save.players[0].army).toEqual([1,0]);expect(save.players[0].gold).toBe(740);expect(save.logs.filter((l:string)=>l.includes('招募了')).length).toBe(1);
});

test('手機觸控可縮放、旋轉且保留擲骰操作',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();
  try {
    await start(page);const before=await page.locator('canvas').screenshot();const button=await page.getByRole('button',{name:'放大棋盤'}).boundingBox();await page.touchscreen.tap(button!.x+button!.width/2,button!.y+button!.height/2);await page.waitForTimeout(200);expect(await page.locator('canvas').screenshot()).not.toEqual(before);
    await page.getByRole('button',{name:'重設視角'}).tap();await page.getByRole('button',{name:'擲骰子，出發！'}).tap();await expect(page.getByRole('button',{name:/結束回合|跳過戰鬥/})).toBeVisible({timeout:15000});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  } finally {await context.close();}
});
