import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Flag, Footprints } from 'lucide-react';
import { CELLS, CELL_META, LEADERS, type Game, type Player } from './game';
import { Hero, Landscape, TileArt } from './art';
import './board.css';

const positions = Array.from({ length: 24 }, (_, i) => i < 7 ? [0, i] : i < 13 ? [i - 6, 6] : i < 19 ? [6, 18 - i] : [24 - i, 0]);
export const STEP_DURATION = 560;
// Animate toward the next tile before committing the step and its landing event.
function visiblePosition(game: Game, index: number) {
  const pos = game.players[index].pos;
  return game.active === index && game.phase === 'moving' ? (pos + 1) % CELLS.length : pos;
}

function BoardToken({ player, index, game }: { player: Player; index: number; game: Game }) {
  const target = visiblePosition(game, index);
  const previous = useRef(target);
  const [arriving, setArriving] = useState(false);
  const [facing, setFacing] = useState(player.pos >= 12 && player.pos < 19 ? 'left' : 'right');
  useEffect(() => {
    if (previous.current === target) return;
    const from = positions[previous.current]; const to = positions[target];
    setFacing(to[1] < from[1] || (to[0] < from[0] && to[1] === from[1]) ? 'left' : 'right');
    previous.current = target;
    setArriving(true);
    const timer = setTimeout(() => setArriving(false), STEP_DURATION - 30);
    return () => clearTimeout(timer);
  }, [target]);
  const occupants = game.players.map((_, i) => visiblePosition(game, i) === target ? i : -1).filter(i => i >= 0);
  const slot = occupants.indexOf(index);
  const walking = (game.active === index && game.phase === 'moving') || arriving;
  const current = game.active === index;
  const leader = LEADERS[player.leader];
  const style = {
    left: `${(positions[target][1] + .5) / 7 * 100}%`,
    top: `${(positions[target][0] + .67) / 7 * 100}%`,
    '--leader-color': leader.color,
    '--slot-x': `${occupants.length === 1 ? 0 : occupants.length === 2 ? (slot === 0 ? -23 : 23) : (slot % 2 === 0 ? -22 : 22)}px`,
    '--slot-y': `${occupants.length <= 2 ? 0 : slot < 2 ? -17 : 13}px`,
  } as CSSProperties;
  return <div className={`map-token group-${occupants.length} ${current ? 'active-token' : ''} ${walking ? 'walking-token' : ''}`} style={style} data-player={index} data-position={player.pos} data-target={target} data-facing={facing} role="img" aria-label={`${leader.name}，目前在第${player.pos + 1}格${CELLS[player.pos].name}${walking ? '，行軍中' : ''}`}>
    <div className="token-offset"><div className="token-ground"/><div className="token-character"><Hero leader={player.leader} walking={walking}/></div><span className="token-name">{current && <i/>}{leader.name}</span><span className="step-dust dust-a"/><span className="step-dust dust-b"/></div>
  </div>;
}

export function Board({ game }: { game: Game }) {
  const viewport = useRef<HTMLDivElement>(null);
  const current = game.players[game.active];
  const target = visiblePosition(game, game.active);
  useEffect(() => {
    const el = viewport.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    const x = (positions[target][1] + .5) / 7 * el.scrollWidth;
    if (x < el.scrollLeft + 60 || x > el.scrollLeft + el.clientWidth - 60) {
      el.scrollTo({ left: Math.max(0, x - el.clientWidth / 2), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
  }, [target, game.active]);
  return <section className="board-panel fantasy-board-panel">
    <div className="panel-top"><span><Flag size={15}/> 九州幻境 · 山河遊歷圖</span><span>第 <b>{Math.min(12, Math.floor(game.turns / 4) + 1).toString().padStart(2, '0')}</b> / 12 輪</span></div>
    <div className="map-scroll-hint"><Footprints size={13}/> {game.phase === 'moving' ? `${LEADERS[current.leader].name}行軍中 · 逐格前進` : `${LEADERS[current.leader].name}駐足於${CELLS[current.pos].name}`}<span>↔ 小螢幕可左右探索地圖</span></div>
    <div className="board-viewport" ref={viewport} tabIndex={0} role="region" aria-label="九州棋盤，可左右捲動探索">
      <div className="board fantasy-board">
        <div className="board-center"><Landscape/><div className="map-title"><span>山 河 入 夢</span><h2>三國幻境</h2><i>一方天地，萬里征途</i></div><div className="map-tag"><span/> 桃園 · 九州起點</div><span className="map-compass" aria-hidden="true">北<br/>✥</span></div>
        {CELLS.map((c, i) => <div key={i} className={`cell ${c.kind} ${current.pos === i ? 'active-cell' : ''}`} style={{ gridRow: positions[i][0] + 1, gridColumn: positions[i][1] + 1 }} aria-label={`第${i + 1}格 ${c.name} ${CELL_META[c.kind].label}`} data-cell={i}>
          <div className="tile-top"><span className="cell-number">{String(i + 1).padStart(2, '0')}</span><strong>{c.name}</strong><small>{CELL_META[c.kind].label}</small></div>
          <TileArt kind={c.kind} index={i}/><div className="tile-path"/><span className="tile-corner"/>
        </div>)}
        <div className="tokens">{game.players.map((p, i) => <BoardToken key={i} player={p} index={i} game={game}/>)}</div>
      </div>
    </div>
    <div className="legend">{Object.entries(CELL_META).map(([kind, m]) => <span key={kind}><i className={kind}/>{m.label}</span>)}<small>途經桃園 +300 金</small></div>
  </section>;
}
