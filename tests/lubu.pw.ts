import {test,expect,type Page} from '@playwright/test';
import {createGame,SAVE_KEY} from '../src/game';
test.setTimeout(120000);
async function seed(page:Page,low=false){await page.goto('./');const g=createGame(0);g.players[0].army=[3];await page.evaluate(({key,g,low})=>{localStorage.setItem(key,JSON.stringify(g));if(low)localStorage.setItem('sanguo-quality','low');},{key:SAVE_KEY,g,low});await page.reload();}
async function open(page:Page){await page.getByRole('button',{name:'查看呂布詳細資訊'}).click();const canvas=page.locator('[data-engine="character-showroom"]');await expect(canvas).toHaveAttribute('data-character','lvbu',{timeout:20000});return canvas;}

test('呂布真實 GLB、三視圖、臉部特寫及四種動作；反覆開關不影響存檔',async({page})=>{
  const errors:string[]=[],requests:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('lubu-')&&r.url().endsWith('.glb')){expect(r.status()).toBe(200);requests.push(r.url());}});
  await seed(page);const saved=await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY);const canvas=await open(page);
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-pose'))!).source).toBe('glb');
  for(const label of ['正面','側面','背面','臉部特寫']){const before=JSON.parse((await canvas.getAttribute('data-pose'))!).camera;await page.getByRole('button',{name:label,exact:true}).click();await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-pose'))!).camera).not.toEqual(before);}
  await page.getByRole('button',{name:'重設公仔視角'}).click();
  await page.getByRole('button',{name:'行走',exact:true}).click();await expect(canvas).toHaveAttribute('data-motion','walk');await expect.poll(async()=>{const legs=JSON.parse((await canvas.getAttribute('data-pose'))!).legs;return legs[0]*legs[1];}).toBeLessThan(-.01);
  await page.getByRole('button',{name:'勝利',exact:true}).click();await expect.poll(async()=>Math.abs(JSON.parse((await canvas.getAttribute('data-pose'))!).arms[0])).toBeGreaterThan(.4);
  await page.getByRole('button',{name:'招募登場',exact:true}).click();await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-pose'))!).spin).toBeGreaterThan(.5);
  await page.getByRole('button',{name:'待機',exact:true}).click();await expect(canvas).toHaveAttribute('data-motion','idle');await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-pose'))!).spin).toBe(0);
  for(let i=0;i<2;i++){await page.getByRole('button',{name:'返回棋局'}).click();await expect(canvas).toHaveCount(0);await open(page);await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-pose'))!).source).toBe('glb');}
  await page.getByRole('button',{name:'返回棋局'}).click();expect(await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY)).toBe(saved);await expect(page.getByRole('button',{name:'擲骰子，出發！'})).toBeEnabled();expect(requests.filter(url=>url.includes('display'))).toHaveLength(1);expect(errors).toEqual([]);
});

test('呂布手機低畫質 GLB 可觸控旋轉、放大縮小與切換角度',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();
  try{await seed(page,true);const canvas=await open(page);await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-pose'))!).source).toBe('glb');const before=JSON.parse((await canvas.getAttribute('data-pose'))!).camera;
    const box=(await canvas.boundingBox())!;const session=await context.newCDPSession(page);const x=box.x+box.width*.45,y=box.y+box.height*.45;
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=5;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+i*15,y}]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-pose'))!).camera).not.toEqual(before);
    await page.getByRole('button',{name:'背面',exact:true}).tap();await page.getByRole('button',{name:'放大公仔'}).tap();await page.getByRole('button',{name:'縮小公仔'}).tap();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.getByRole('button',{name:'關閉人物展示'}).tap();await expect(page.getByRole('dialog')).toHaveCount(0);
  }finally{await context.close();}
});

test('呂布 GLB 下載失敗時明示同款曲面備援，仍能返回原棋局',async({page})=>{
  await page.route('**/lubu-*.glb',route=>route.abort());await seed(page);const saved=await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY);const canvas=await open(page);await expect(page.getByText('模型檔暫時無法載入，改用同款曲面模型展示。')).toBeVisible();await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-pose'))!).source).toBe('authored-surfaces');await page.getByRole('button',{name:'返回棋局'}).click();expect(await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY)).toBe(saved);await expect(page.getByRole('button',{name:'擲骰子，出發！'})).toBeEnabled();
});
