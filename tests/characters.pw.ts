import {test,expect,type Page} from '@playwright/test';
import {createGame,SAVE_KEY} from '../src/game';
// Switching and repeatedly opening high-detail models is slower under software WebGL.
test.setTimeout(90000);
async function show(page:Page){await page.goto('./');await page.getByRole('button',{name:'開啟主公圖鑑'}).click();await expect(page.locator('[data-engine="character-showroom"]')).toBeVisible({timeout:15000});}
async function seed(page:Page){const g=createGame(0);g.players[0].army=[0,1,2,3,4];await page.goto('./');await page.evaluate(({key,g})=>localStorage.setItem(key,JSON.stringify(g)),{key:SAVE_KEY,g});await page.reload();await expect(page.locator('[data-engine="three-webgl"]')).toBeVisible({timeout:15000});}

test('主公圖鑑四個獨立角色，旋轉、縮放、勝利與待機可操作',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await show(page);
  for(const [name,id] of [['劉備','liubei'],['曹操','caocao'],['孫權','sunquan'],['董卓','dongzhuo']]){
    await page.getByRole('tab',{name:new RegExp(name)}).click();const canvas=page.locator('[data-engine="character-showroom"]');await expect(canvas).toHaveAttribute('data-character',id,{timeout:10000});
    const pose=JSON.parse((await canvas.getAttribute('data-pose'))!);expect(pose.limbs).toBe(4);expect(pose.vertices).toBeGreaterThan(1000);
    await page.getByRole('button',{name:'勝利',exact:true}).click();await expect(canvas).toHaveAttribute('data-motion','victory');
    await expect.poll(async()=>Math.abs(JSON.parse((await canvas.getAttribute('data-pose'))!).arms[0])).toBeGreaterThan(.5);
    await page.getByRole('button',{name:'待機',exact:true}).click();await expect(canvas).toHaveAttribute('data-motion','idle');
  }
  const canvas=page.locator('[data-engine="character-showroom"]');const before=JSON.parse((await canvas.getAttribute('data-pose'))!).camera;await page.getByRole('button',{name:'放大公仔'}).click();await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-pose'))!).camera).not.toEqual(before);
  const box=(await canvas.boundingBox())!;await page.mouse.move(box.x+box.width*.45,box.y+box.height*.55);await page.mouse.down();await page.mouse.move(box.x+box.width*.8,box.y+box.height*.55,{steps:10});await page.mouse.up();
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-pose'))!).camera).not.toEqual(before);
  await page.getByRole('button',{name:'返回棋局'}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.getByRole('button',{name:/啟程，逐鹿天下/})).toBeVisible();expect(await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY)).toBeNull();expect(errors).toEqual([]);
});

test('四位專屬武將、通用模型標示、同模型卡片頭像與招募動作',async({page})=>{
  await seed(page);const before=await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY);
  for(const [name,id,weapon] of [['趙雲','zhaoyun','龍膽亮銀槍'],['關羽','guanyu','青龍偃月刀'],['張飛','zhangfei','丈八蛇矛'],['呂布','lvbu','方天畫戟'],['周瑜','zhouyu','通用']]){
    const button=page.getByRole('button',{name:`查看${name}詳細資訊`});await expect(button.locator('img')).toHaveAttribute('src',/^data:image\/png/,{timeout:15000});
    await button.click();const canvas=page.locator('[data-engine="character-showroom"]');await expect(canvas).toHaveAttribute('data-character',id,{timeout:15000});await expect(page.getByRole('dialog')).toContainText(weapon);
    if(id==='zhouyu')await expect(page.getByText('通用模型 · 專屬造型待後續擴充')).toBeVisible();
    await page.getByRole('button',{name:'招募登場',exact:true}).click();await expect(canvas).toHaveAttribute('data-motion','recruit');await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-pose'))!).spin).toBeGreaterThan(.5);await page.getByRole('button',{name:'返回棋局'}).click();
  }
  expect(await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY)).toBe(before);
});

test('行軍途中開圖鑑會暫停，關閉後繼續且招募只結算一次',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0;});const g=createGame(0);await page.goto('./');await page.evaluate(({g,key})=>localStorage.setItem(key,JSON.stringify(g)),{g,key:SAVE_KEY});await page.reload();await expect(page.locator('[data-engine="three-webgl"]')).toBeVisible();
  await page.getByRole('button',{name:'擲骰子，出發！'}).click();await page.getByRole('button',{name:'開啟主公圖鑑'}).click();const paused=await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY);await page.waitForTimeout(1300);expect(await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY)).toBe(paused);
  await page.getByRole('button',{name:'返回棋局'}).click();await expect(page.getByRole('button',{name:'結束回合'})).toBeVisible({timeout:8000});const save=JSON.parse((await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY))!);expect(save.players[0].pos).toBe(1);expect(save.players[0].army).toEqual([1,0]);expect(save.players[0].gold).toBe(740);
});

test('反覆開關展示釋放 WebGL context，棋盤與卡片不新增常駐 context',async({page})=>{
  await page.addInitScript(()=>{
    const contexts:WebGL2RenderingContext[]=[];(window as Window&{viewContexts:WebGL2RenderingContext[]}).viewContexts=contexts;const original=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(type:string,...args:unknown[]){const ctx=original.apply(this,[type,...args] as never);if(type==='webgl2'&&ctx&&!contexts.includes(ctx as WebGL2RenderingContext))contexts.push(ctx as WebGL2RenderingContext);return ctx;} as typeof original;
  });await seed(page);
  for(let i=0;i<5;i++){await page.getByRole('button',{name:'開啟主公圖鑑'}).click();await expect(page.locator('[data-engine="character-showroom"]')).toHaveAttribute('data-character','liubei');await page.getByRole('button',{name:'返回棋局'}).click();await expect(page.locator('[data-engine="character-showroom"]')).toHaveCount(0);}
  await expect.poll(()=>page.evaluate(()=>{const contexts=(window as Window&{viewContexts:WebGL2RenderingContext[]}).viewContexts.filter(c=>(c.canvas as HTMLCanvasElement).dataset.engine==='character-showroom');return contexts.length>=5&&contexts.every(c=>c.isContextLost());})).toBe(true);
  await expect(page.locator('canvas')).toHaveCount(1);await expect(page.getByRole('button',{name:'擲骰子，出發！'})).toBeEnabled();
});

test('手機觸控圖鑑與低畫質模型展示可用',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();
  try{await page.goto('./');await page.evaluate(()=>localStorage.setItem('sanguo-quality','low'));await page.getByRole('button',{name:'開啟主公圖鑑'}).tap();await expect(page.locator('[data-engine="character-showroom"]')).toHaveAttribute('data-character','liubei',{timeout:15000});await page.getByRole('tab',{name:/孫權/}).tap();await expect(page.locator('[data-engine="character-showroom"]')).toHaveAttribute('data-character','sunquan');await page.getByRole('button',{name:'放大公仔'}).tap();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.getByRole('button',{name:'關閉人物展示'}).tap();await expect(page.getByRole('dialog')).toHaveCount(0);}finally{await context.close();}
});
