import { test, expect } from '@playwright/test';
import { createGame, reducer, SAVE_KEY } from '../src/game';
test('選角、擲骰、招募、存檔與三位電腦輪替',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{Math.random=()=>0;});
  await page.goto('/');await page.getByRole('button',{name:/曹操 亂世梟雄/}).click();await page.getByRole('button',{name:/啟程，逐鹿天下/}).click();
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
  await page.goto('/');await page.evaluate(({key,g})=>localStorage.setItem(key,JSON.stringify(g)),{key:SAVE_KEY,g});await page.reload();
  await expect(page.getByRole('button',{name:/跳過戰鬥/})).toBeVisible();await page.reload();
  await page.getByRole('button',{name:/跳過戰鬥/}).click();await expect(page.getByRole('button',{name:'結束回合'})).toBeVisible();await expect(page.getByRole('status')).toContainText('大獲全勝');
  await page.getByRole('button',{name:'重新開始',exact:true}).click();await page.getByRole('button',{name:'繼續目前旅程'}).click();await expect(page.getByRole('button',{name:'結束回合'})).toBeVisible();
  await page.getByRole('button',{name:'重新開始',exact:true}).click();await page.getByRole('button',{name:'確認重新開始'}).click();await expect(page.getByRole('button',{name:'擲骰子，出發！'})).toBeVisible();
});
test('手機版無橫向溢出、24 格可見、說明可開關',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/');await page.getByRole('button',{name:/啟程，逐鹿天下/}).click();
  expect(await page.locator('.cell').count()).toBe(24);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'遊戲說明'}).click();await expect(page.getByRole('dialog')).toContainText('十二輪');await page.getByRole('button',{name:'明白了，出發！'}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('完成遊戲顯示排名，損壞存檔回到選角',async({page})=>{
  let g=createGame(0);g.turns=47;g.active=3;g.phase='result';g=reducer(g,{type:'next'});
  await page.goto('/');await page.evaluate(({key,g})=>localStorage.setItem(key,JSON.stringify(g)),{key:SAVE_KEY,g});await page.reload();await expect(page.getByText('征途完成')).toBeVisible();await expect(page.getByRole('heading',{name:/稱霸天下/})).toBeVisible();
  await page.evaluate(key=>localStorage.setItem(key,'{"version":1}'),SAVE_KEY);await page.reload();await expect(page.getByRole('heading',{name:'主公，請入座。'})).toBeVisible();
});
