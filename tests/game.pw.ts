import { test, expect } from '@playwright/test';
import { createGame, reducer, SAVE_KEY } from '../src/game';
test('選角、擲骰、招募、存檔與三位電腦輪替',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{Math.random=()=>0;});
  await page.goto('./');await page.getByRole('button',{name:/曹操 亂世梟雄/}).click();await page.getByRole('button',{name:/啟程，逐鹿天下/}).click();
  await expect(page.getByText('輪到你了，主公')).toBeVisible();
  await page.getByRole('button',{name:'擲骰子，出發！'}).click();
  await expect(page.getByRole('button',{name:'結束回合'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'趙雲',exact:true})).toBeVisible();
  const before=await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY);
  await page.reload();await expect(page.getByRole('heading',{name:'趙雲',exact:true})).toBeVisible();
  expect(await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY)).toBe(before);
  await page.getByRole('button',{name:'結束回合'}).click();
  await expect(page.getByText('輪到你了，主公')).toBeVisible({timeout:20000});
  const save=JSON.parse((await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY))!);expect(save.turns).toBe(4);expect(save.players.slice(1).every((p:{pos:number})=>p.pos===1)).toBe(true);expect(errors).toEqual([]);
});
test('重新整理接續戰鬥、跳過結算，重新開始有確認',async({page})=>{
  let g=createGame(0);g.players[0].pos=3;g=reducer(g,{type:'roll',random:0});g=reducer(g,{type:'step',random:.99});
  await page.goto('./');await page.evaluate(({key,g})=>localStorage.setItem(key,JSON.stringify(g)),{key:SAVE_KEY,g});await page.reload();
  await expect(page.getByRole('button',{name:/跳過戰鬥/})).toBeVisible();await page.reload();
  await page.getByRole('button',{name:/跳過戰鬥/}).click();await expect(page.getByRole('button',{name:'結束回合'})).toBeVisible();await expect(page.getByRole('status')).toContainText('大獲全勝');
  await page.getByRole('button',{name:'重新開始',exact:true}).click();await page.getByRole('button',{name:'繼續目前旅程'}).click();await expect(page.getByRole('button',{name:'結束回合'})).toBeVisible();
  await page.getByRole('button',{name:'重新開始',exact:true}).click();await page.getByRole('button',{name:'確認重新開始'}).click();await expect(page.getByRole('button',{name:'擲骰子，出發！'})).toBeVisible();
});
test('手機版無橫向溢出、24 格可見、說明可開關',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('./');await page.getByRole('button',{name:/啟程，逐鹿天下/}).click();
  expect(await page.locator('.cell').count()).toBe(24);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'遊戲說明'}).click();await expect(page.getByRole('dialog')).toContainText('十二輪');await page.getByRole('button',{name:'明白了，出發！'}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('完成遊戲顯示排名，損壞存檔回到選角',async({page})=>{
  let g=createGame(0);g.turns=47;g.active=3;g.phase='result';g=reducer(g,{type:'next'});
  await page.goto('./');await page.evaluate(({key,g})=>localStorage.setItem(key,JSON.stringify(g)),{key:SAVE_KEY,g});await page.reload();await expect(page.getByText('征途完成')).toBeVisible();await expect(page.getByRole('heading',{name:/稱霸天下/})).toBeVisible();
  await page.evaluate(key=>localStorage.setItem(key,'{"version":1}'),SAVE_KEY);await page.reload();await expect(page.getByRole('heading',{name:'主公，請入座。'})).toBeVisible();
});

test('第二版四位完整主公同格可分辨，與不同功能格的獨立美術',async({page})=>{
  await page.goto('./');await page.getByRole('button',{name:/啟程，逐鹿天下/}).click();
  const tokens=page.locator('.map-token');await expect(tokens).toHaveCount(4);
  const boxes=[];
  for(let i=0;i<4;i++) {
    const token=tokens.nth(i);await expect(token).toHaveAttribute('data-position','0');
    await expect(token.locator('.hero-head')).toBeVisible();await expect(token.locator('.hero-leg')).toHaveCount(2);await expect(token.locator('.hero-arm')).toHaveCount(2);
    boxes.push((await token.locator('.token-character').boundingBox())!);
  }
  for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)expect(Math.hypot(boxes[i].x-boxes[j].x,boxes[i].y-boxes[j].y)).toBeGreaterThan(20);
  await expect(page.locator('.tile-illustration')).toHaveCount(24);
  for(const kind of ['start','recruit','money','event','battle'])expect(await page.locator(`.illustration-${kind}`).count()).toBeGreaterThan(0);
});

test('六點逐格前進並跨轉角，擺腿動畫運作且抵達後才招募',async({page})=>{
  const g=createGame(0);g.players[0].pos=5;
  await page.addInitScript(()=>{Math.random=()=>.99;});
  await page.goto('./');await page.evaluate(({key,g})=>localStorage.setItem(key,JSON.stringify(g)),{key:SAVE_KEY,g});await page.reload();
  await page.evaluate(()=>{
    const token=document.querySelector('[data-player="0"]')!;
    (window as Window & {visited?:number[]}).visited=[];
    new MutationObserver(records=>{
      for(const record of records)if(record.attributeName==='data-position')
        (window as Window & {visited:number[]}).visited.push(Number(token.getAttribute('data-position')));
    }).observe(token,{attributes:true,attributeFilter:['data-position']});
  });
  await page.getByRole('button',{name:'擲骰子，出發！'}).click();
  const token=page.locator('.map-token[data-player="0"]');await expect(token).toHaveClass(/walking-token/);
  const leg=token.locator('.leg-left');const first=await leg.evaluate(el=>getComputedStyle(el).transform);
  await page.waitForTimeout(120);const second=await leg.evaluate(el=>getComputedStyle(el).transform);expect(second).not.toBe(first);
  await expect(token).toHaveAttribute('data-position','6');
  await expect(page.getByRole('button',{name:/行軍中/})).toBeDisabled();
  const midway=JSON.parse((await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY))!);expect(midway.players[0].army).toEqual([1]);
  await expect(page.getByRole('button',{name:'結束回合'})).toBeVisible({timeout:7000});
  expect(await page.evaluate(()=>(window as Window & {visited:number[]}).visited)).toEqual([6,7,8,9,10,11]);
  const result=JSON.parse((await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY))!);expect(result.players[0].army.length).toBe(2);
  await expect(token).not.toHaveClass(/walking-token/);
  const cell=(await page.locator('[data-cell="11"]').boundingBox())!;const hero=(await token.locator('.token-ground').boundingBox())!;
  expect(hero.x+hero.width/2).toBeGreaterThan(cell.x);expect(hero.x+hero.width/2).toBeLessThan(cell.x+cell.width);
  expect(hero.y+hero.height/2).toBeGreaterThan(cell.y);expect(hero.y+hero.height/2).toBeLessThan(cell.y+cell.height);
});

test('行走途中刷新仍逐格完成，減少動態效果不影響回合',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const g=reducer(createGame(2),{type:'roll',random:.45});
  await page.goto('./');await page.evaluate(({key,g})=>localStorage.setItem(key,JSON.stringify(g)),{key:SAVE_KEY,g});await page.reload();
  await expect(page.getByRole('button',{name:'結束回合'})).toBeVisible({timeout:5000});
  const result=JSON.parse((await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY))!);expect(result.players[0].pos).toBe(3);
  await expect(page.locator('.map-token[data-player="0"] .leg-left')).toHaveCSS('animation-name','none');
});

test('手機探索地圖會跟隨行動主公，頁面本身不橫向溢出',async({page})=>{
  await page.setViewportSize({width:390,height:844});const g=createGame(0);g.players[0].pos=10;
  await page.goto('./');await page.evaluate(({key,g})=>localStorage.setItem(key,JSON.stringify(g)),{key:SAVE_KEY,g});await page.reload();
  await expect.poll(()=>page.locator('.board-viewport').evaluate(el=>el.scrollLeft)).toBeGreaterThan(100);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const hero=(await page.locator('.map-token[data-player="0"] .token-character').boundingBox())!;expect(hero.x).toBeGreaterThan(0);expect(hero.x+hero.width).toBeLessThan(390);
});
