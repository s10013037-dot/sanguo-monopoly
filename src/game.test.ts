import { describe, it, expect } from 'vitest';
import { createGame, reducer, loadGame, GENERALS, score } from './game';
function land(pos:number, random=0, leader=0) {
  let g=createGame(leader); g.players[0].pos=pos-1; g=reducer(g,{type:'roll',random:0}); return reducer(g,{type:'step',random});
}
describe('三國旅程規則',()=>{
  it.each([0,1,2,3])('建立主公 %i 與三名不同的電腦玩家',leader=>{
    const g=createGame(leader); expect(g.players[0].leader).toBe(leader); expect(new Set(g.players.map(p=>p.leader)).size).toBe(4); expect(g.players.every(p=>p.army.length===1&&p.gold===1000)).toBe(true);
  });
  it('骰子限制於 1～6，逐格移動，抵達後才結算',()=>{
    let g=reducer(createGame(0),{type:'roll',random:.99}); expect(g.dice).toBe(6);
    for(let i=1;i<=5;i++){g=reducer(g,{type:'step'});expect(g.players[0].pos).toBe(i);expect(g.phase).toBe('moving');}
    g=reducer(g,{type:'step'});expect(g.phase).toBe('result');expect(g.players[0].gold).toBe(1200);
  });
  it('途經桃園發放一次軍餉',()=>{
    let g=createGame(0);g.players[0].pos=23;g=reducer(g,{type:'roll',random:0});g=reducer(g,{type:'step'});expect(g.players[0].gold).toBe(1300);expect(g.players[0].laps).toBe(1);
  });
  it('招募未擁有的武將並扣除正確金額',()=>{
    const g=land(1);expect(g.players[0].army).toEqual([1,0]);expect(g.players[0].gold).toBe(1000-GENERALS[0].cost);
  });
  it('招募資金不足及全武將收集都有可用的結算',()=>{
    let g=createGame(0);g.players[0].gold=0;g=reducer(g,{type:'roll',random:0});g=reducer(g,{type:'step',random:0});expect(g.players[0].gold).toBe(80);expect(g.players[0].army).toEqual([1]);
    g=createGame(0);g.players[0].army=GENERALS.map((_,i)=>i);g=reducer(g,{type:'roll',random:0});g=reducer(g,{type:'step'});expect(g.players[0].gold).toBe(1120);
  });
  it.each([[0,1180],[.3,880],[.6,1250],[.9,1100]])('奇遇亂數 %s 對應金額 %s',(r,gold)=>expect(land(3,r).players[0].gold).toBe(gold));
  it('跳過戰鬥與逐回合結算相同',()=>{
    const g=land(4); expect(g.phase).toBe('battle');let normal=g; while(normal.phase==='battle')normal=reducer(normal,{type:'fight'});
    const skipped=reducer(g,{type:'fight',skip:true});expect(skipped).toEqual(normal);expect(normal.players[0].gold).toBe(1280);
  });
  it('戰敗扣款不會變成負數',()=>{
    const g=land(4,.99);g.players[0].army=[];g.players[0].gold=50;const result=reducer(g,{type:'fight',skip:true});expect(result.phase).toBe('result');expect(result.players[0].gold).toBe(0);
  });
  it('不允許重複擲骰或未結算就換人',()=>{
    const g=reducer(createGame(0),{type:'roll',random:0});expect(reducer(g,{type:'roll'})).toEqual(g);expect(reducer(g,{type:'next'})).toEqual(g);
  });
  it('完整模擬 48 個回合，四人公平輪替並結束',()=>{
    let g=createGame(0);let moves=0;
    while(g.phase!=='finished'&&moves++<1000){
      if(g.phase==='ready')g=reducer(g,{type:'roll',random:.6});
      else if(g.phase==='moving')g=reducer(g,{type:'step',random:.4});
      else if(g.phase==='battle')g=reducer(g,{type:'fight',skip:true});
      else g=reducer(g,{type:'next'});
    }
    expect(g.phase).toBe('finished');expect(g.turns).toBe(48);expect(g.active).toBe(0);expect(g.players.every(p=>p.laps===2)).toBe(true);expect(score(g.players[0])).toBeGreaterThan(0);
  });
  it('行軍與戰鬥存檔可還原，破損資料安全拒絕',()=>{
    const moving=reducer(createGame(2),{type:'roll',random:.7});expect(loadGame(JSON.stringify(moving))).toEqual(moving);
    const battle=land(4);expect(loadGame(JSON.stringify(battle))).toEqual(battle);
    expect(loadGame('{broken')).toBeNull();expect(loadGame('{}')).toBeNull();expect(loadGame(JSON.stringify({...moving,active:8}))).toBeNull();expect(loadGame(JSON.stringify({...battle,battle:null}))).toBeNull();
  });
});
