export const LEADERS = [
  { name: '劉備', title: '仁德之主', color: '#588c73', icon: '🥬', quote: '與諸君攜手，共赴桃源。', perk: '初始武將：關羽' },
  { name: '曹操', title: '亂世梟雄', color: '#6681a3', icon: '🦅', quote: '天下英雄，唯使君與操耳。', perk: '初始武將：張遼' },
  { name: '孫權', title: '江東碧眼', color: '#c38a47', icon: '🐯', quote: '坐斷東南，且看江山如畫。', perk: '初始武將：周瑜' },
  { name: '董卓', title: '西涼霸主', color: '#a76b76', icon: '🐻', quote: '金戈鐵馬，天下盡入吾囊。', perk: '初始武將：呂布' },
];
export const GENERALS = [
  { name: '趙雲', title: '常山龍膽', power: 34, cost: 260, icon: '🐉', rarity: '傳說' },
  { name: '關羽', title: '美髯武聖', power: 32, cost: 240, icon: '🐲', rarity: '傳說' },
  { name: '張飛', title: '燕人猛將', power: 29, cost: 210, icon: '🐻', rarity: '史詩' },
  { name: '呂布', title: '無雙飛將', power: 38, cost: 300, icon: '🦁', rarity: '傳說' },
  { name: '周瑜', title: '江東美周郎', power: 30, cost: 220, icon: '🦊', rarity: '史詩' },
  { name: '張遼', title: '逍遙戰神', power: 28, cost: 200, icon: '🦅', rarity: '史詩' },
  { name: '黃忠', title: '百步穿楊', power: 27, cost: 190, icon: '🦉', rarity: '史詩' },
  { name: '馬超', title: '錦衣神威', power: 31, cost: 230, icon: '🐴', rarity: '史詩' },
];
export type CellKind = 'start' | 'recruit' | 'money' | 'event' | 'battle';
const names = ['桃園','涿郡','商隊','臥龍崗','虎牢關','許昌','金庫','洛陽','赤壁','江陵','隆中','建業','軍餉','會稽','長坂坡','成都','錦囊','漢中','官渡','西涼','糧倉','襄陽','祈福','夷陵'];
const kinds: CellKind[] = ['start','recruit','money','event','battle','recruit','money','recruit','battle','money','event','recruit','money','recruit','battle','recruit','event','money','battle','recruit','money','recruit','event','battle'];
export const CELLS = names.map((name, i) => ({ name, kind: kinds[i] }));
export const CELL_META = { start: { label: '起點', icon: '🌸' }, recruit: { label: '招賢', icon: '🏯' }, money: { label: '補給', icon: '🪙' }, event: { label: '奇遇', icon: '📜' }, battle: { label: '戰場', icon: '⚔️' } };
export interface Player { leader: number; pos: number; gold: number; army: number[]; laps: number }
export interface Battle { enemy: string; hp: number; maxHp: number; allyHp: number; round: number }
export interface Game { version: 1; players: Player[]; active: number; turns: number; phase: 'ready' | 'moving' | 'battle' | 'result' | 'finished'; dice: number; steps: number; logs: string[]; message: string; battle: Battle | null }
export type Action = { type: 'roll'; random?: number } | { type: 'step'; random?: number } | { type: 'fight'; skip?: boolean } | { type: 'next' };
export function createGame(leader: number): Game {
  const order = [leader, ...[0,1,2,3].filter(x => x !== leader)];
  return { version: 1, players: order.map(n => ({ leader: n, pos: 0, gold: 1000, army: [[1],[5],[4],[3]][n], laps: 0 })), active: 0, turns: 0, phase: 'ready', dice: 1, steps: 0, logs: ['桃園聚義，四位主公的天下之旅正式啟程。'], message: '山河為局，萌將為伴。擲出骰子，開啟你的三國冒險！', battle: null };
}
export const power = (p: Player) => 20 + p.army.reduce((sum, i) => sum + GENERALS[i].power, 0);
export const score = (p: Player) => p.gold + p.army.reduce((sum,i) => sum + GENERALS[i].cost, 0);
function log(s: Game, text: string) { s.message = text; s.logs = [text, ...s.logs].slice(0, 40); }
export function reducer(state: Game, action: Action): Game {
  const s: Game = structuredClone(state); const p = s.players[s.active]; const name = LEADERS[p.leader].name;
  if (action.type === 'roll' && s.phase === 'ready') {
    s.dice = Math.min(6, Math.max(1, Math.floor((action.random ?? Math.random()) * 6) + 1)); s.steps = s.dice; s.phase = 'moving';
  } else if (action.type === 'step' && s.phase === 'moving') {
    p.pos = (p.pos + 1) % 24; s.steps--;
    if (p.pos === 0) { p.gold += 300; p.laps++; log(s, `${name}途經桃園，領取 300 金軍餉。`); }
    if (s.steps === 0) {
      s.phase = 'result'; const c = CELLS[p.pos]; const r = action.random ?? Math.random();
      if (c.kind === 'recruit') {
        const choices = GENERALS.map((_,i) => i).filter(i => !p.army.includes(i));
        if (!choices.length) { p.gold += 120; log(s, `${name}名將齊聚！城民獻上 120 金。`); }
        else { const i = choices[Math.min(choices.length - 1, Math.floor(r * choices.length))]; const g = GENERALS[i];
          if (p.gold >= g.cost) { p.gold -= g.cost; p.army.push(i); log(s, `${name}於${c.name}招募了${g.name}！花費 ${g.cost} 金。`); }
          else { p.gold += 80; log(s, `${name}盤纏不足，暫別名將；協助城務獲得 80 金。`); }
        }
      } else if (c.kind === 'money') { p.gold += 200; log(s, `${name}抵達${c.name}，獲得補給 200 金！`); }
      else if (c.kind === 'event') {
        const events = [{ gold: 180, text: '巧遇雲遊商人，護送商隊獲得 180 金！' }, { gold: -120, text: '山路遭遇流寇，損失最多 120 金。' }, { gold: 250, text: '發現前朝寶藏，獲得 250 金！' }, { gold: 100, text: '施粥賑民，百姓回贈 100 金。' }];
        const e = events[Math.min(3, Math.floor(r*4))]; p.gold = Math.max(0,p.gold + e.gold); log(s, `${name}${e.text}`);
      } else if (c.kind === 'battle') {
        const hp = 70 + Math.floor(r * 65) + Math.floor(s.turns / 4) * 4;
        s.battle = { enemy: `${c.name}守軍`, hp, maxHp: hp, allyHp: 100, round: 0 }; s.phase = 'battle'; log(s, `${name}進入${c.name}，與守軍交鋒！`);
      } else log(s, `${name}重返桃園，整軍待發。`);
    }
  } else if (action.type === 'fight' && s.phase === 'battle' && s.battle) {
    const b = s.battle;
    do {
      b.round++; b.hp = Math.max(0, b.hp - Math.round(power(p) * .55));
      if (b.hp > 0) b.allyHp = Math.max(0, b.allyHp - 24);
    } while (action.skip && b.hp > 0 && b.allyHp > 0);
    if (b.hp === 0 || b.allyHp === 0) { const won = b.hp === 0; p.gold = Math.max(0,p.gold + (won ? 280 : -150)); s.phase = 'result'; log(s, won ? `${name}大獲全勝！獲得戰利品 280 金。` : `${name}暫避鋒芒，整軍損失最多 150 金。`); }
  } else if (action.type === 'next' && s.phase === 'result') {
    s.turns++; s.battle = null; s.phase = s.turns >= 48 ? 'finished' : 'ready'; s.active = (s.active + 1) % 4;
    if (s.phase === 'finished') log(s, '十二輪征途結束！以金錢與武將身價總和評定天下霸主。');
  }
  return s;
}
export const SAVE_KEY = 'sanguo-monopoly-v1';
export function loadGame(raw: string | null): Game | null {
  try {
    if (!raw) return null; const g = JSON.parse(raw) as Game;
    if (g.version !== 1 || !Array.isArray(g.players) || g.players.length !== 4 || !Number.isInteger(g.active) || g.active < 0 || g.active > 3 || !Number.isInteger(g.turns) || g.turns < 0 || g.turns > 48 || !['ready','moving','battle','result','finished'].includes(g.phase) || !Number.isInteger(g.dice) || g.dice < 1 || g.dice > 6 || !Number.isInteger(g.steps) || g.steps < 0 || g.steps > 6 || !Array.isArray(g.logs) || !g.logs.every(x=>typeof x==='string') || typeof g.message !== 'string') return null;
    if (!g.players.every(p => Number.isInteger(p.leader) && p.leader >= 0 && p.leader < 4 && Number.isInteger(p.pos) && p.pos >= 0 && p.pos < 24 && Number.isFinite(p.gold) && p.gold >= 0 && Number.isInteger(p.laps) && p.laps >= 0 && Array.isArray(p.army) && p.army.every(i => Number.isInteger(i) && i >= 0 && i < GENERALS.length))) return null;
    if (g.phase === 'moving' && g.steps < 1) return null;
    if (g.battle && ![g.battle.hp,g.battle.maxHp,g.battle.allyHp,g.battle.round].every(Number.isFinite)) return null;
    if (g.phase === 'battle' && (!g.battle || g.battle.hp <= 0 || g.battle.allyHp <= 0 || g.battle.maxHp <= 0)) return null;
    return g;
  } catch { return null; }
}
