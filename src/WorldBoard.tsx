import { useEffect, useRef, useState } from 'react';
import { Flag, Minus, Plus, RotateCcw, Box, Map, Settings2 } from 'lucide-react';
import { CELLS, CELL_META, LEADERS, type Game } from './game';
import { Board as FlatBoard } from './Board2D';
import type { World } from './three/world';
import './world.css';
const explanations = {start:'途經桃園可領取 300 金軍餉。',recruit:'資金足夠時自動招募尚未擁有的武將；不足時協助城務賺取 80 金。',money:'抵達後領取 200 金補給。',event:'隨機遇見旅人、寶藏、流寇或百姓。',battle:'軍隊自動作戰，勝利獲得 280 金；可跳過動畫，結算不變。'};
function readQuality(){try{return localStorage.getItem('sanguo-quality')==='low'?'low':'standard';}catch{return 'standard';}}
export function Board({game,onStep,paused=false}:{game:Game;onStep:()=>void;paused?:boolean}) {
  const host=useRef<HTMLDivElement>(null);const world=useRef<World|null>(null);const latest=useRef(game);latest.current=game;
  const callback=useRef(onStep);callback.current=onStep;
  const [quality,setQuality]=useState(readQuality);const [fallback,setFallback]=useState(false);const [error,setError]=useState('');const [ready,setReady]=useState(false);
  const [names,setNames]=useState(true);
  const [selected,setSelected]=useState<number|null>(null);const [follow,setFollow]=useState(false);
  useEffect(()=>{
    if(fallback||!host.current)return;let cancelled=false;setReady(false);
    import('./three/world').then(({createWorld})=>{
      if(cancelled||!host.current)return;
      try{
        world.current=createWorld(host.current,latest.current,{low:quality==='low',reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,onStep:()=>callback.current(),onSelect:setSelected,onError:()=>{setError('3D 顯示中斷，已切換為可繼續遊玩的 2D 棋盤。');setFallback(true);}});
        setReady(true);
      }catch{setError('此瀏覽器無法啟動 WebGL 3D。已提供完整可玩的 2D 棋盤；可嘗試開啟 Chrome 圖形加速後重試。');setFallback(true);}
    }).catch(()=>{if(!cancelled){setError('3D 模組載入失敗，請檢查連線後重試。現在仍可使用 2D 棋盤繼續遊玩。');setFallback(true);}});
    return()=>{cancelled=true;world.current?.dispose();world.current=null;};
  },[quality,fallback]);
  useEffect(()=>{world.current?.update(game,()=>callback.current());},[game,ready]);
  useEffect(()=>{world.current?.setFollow(follow);},[follow,ready]);
  useEffect(()=>{world.current?.setNames(names);},[names,ready]);
  useEffect(()=>{world.current?.setPaused(paused);},[paused,ready]);
  useEffect(()=>{if(!fallback||paused||game.phase!=='moving')return;const timer=setTimeout(()=>callback.current(),800);return()=>clearTimeout(timer);},[fallback,game,paused]);
  function changeQuality(value:string){setQuality(value);try{localStorage.setItem('sanguo-quality',value);}catch{/* Preferences are optional. */}}
  return <section className={`world-panel ${fallback?'flat-mode':''}`} aria-label="三國微縮模型棋盤">
    <div className="world-heading"><div><span className="eyebrow">MINIATURE KINGDOMS · V3.5</span><h2><Flag size={17}/> 九州公仔棋局 <span>{fallback?'2D 備援':'WEBGL 3D'}</span></h2></div><span className="round-indicator">第 <b>{Math.min(12,Math.floor(game.turns/4)+1)}</b> / 12 輪</span></div>
    <div className="world-toolbar"><label><Settings2 size={14}/> 畫質<select aria-label="3D 畫質" value={quality} onChange={e=>changeQuality(e.target.value)}><option value="standard">標準 · 柔和陰影</option><option value="low">低畫質 · 省電</option></select></label><div className="camera-buttons"><button onClick={()=>world.current?.zoom(1.2)} aria-label="放大棋盤" disabled={fallback}><Plus size={15}/></button><button onClick={()=>world.current?.zoom(1/1.2)} aria-label="縮小棋盤" disabled={fallback}><Minus size={15}/></button><button onClick={()=>world.current?.reset()} aria-label="重設視角" disabled={fallback}><RotateCcw size={14}/></button></div><button className="view-mode focus-hero" disabled={fallback} onClick={()=>world.current?.focus()}>聚焦主公</button><button className="view-mode" onClick={()=>{setError('');setFallback(!fallback);}}>{fallback?<Box size={14}/>:<Map size={14}/>} {fallback?'重試 3D':'2D 備援'}</button></div>
    {error&&<p className="webgl-error" role="alert">{error}</p>}
    {fallback?<FlatBoard game={game}/>:<div className={`world-stage ${game.phase==='battle'?'battle-stage':''}`}><div className="webgl-host" ref={host}/>{!ready&&<div className="loading-world" role="status">正在搭建三國微縮模型…</div>}<span className="scene-caption">三國 · 山河入夢 <small>{LEADERS[game.players[game.active].leader].name}{game.phase==='moving'?'行軍中':'駐足於'+CELLS[game.players[game.active].pos].name}</small></span>{game.phase==='battle'&&<div className="battle-banner">⚔ 守軍來襲 · 戰鬥進行中</div>}</div>}
    <div className="world-controls"><span>拖曳旋轉 · 滾輪縮放 · 雙指縮放／平移</span><label><input type="checkbox" checked={names} onChange={e=>setNames(e.target.checked)}/> 主公姓名</label><label><input type="checkbox" checked={follow} onChange={e=>setFollow(e.target.checked)}/> 行軍鏡頭跟隨</label></div>
    <div className="location-inspector"><label htmlFor="location-select">探索地點</label><select id="location-select" aria-label="查看地點" value={selected??''} onChange={e=>setSelected(e.target.value===''?null:Number(e.target.value))}><option value="">點擊 3D 地形或在此選擇</option>{CELLS.map((c,i)=><option key={i} value={i}>{i+1}. {c.name} · {CELL_META[c.kind].label}</option>)}</select>{selected!==null&&<div className="location-detail"><strong>{CELLS[selected].name}<small>{CELL_META[CELLS[selected].kind].label}</small></strong><p>{explanations[CELLS[selected].kind]}</p></div>}</div>
    <div className="world-legend">{Object.entries(CELL_META).map(([kind,m])=><span key={kind}><i className={kind}/>{m.label}</span>)}<small>公仔腳下金環為目前主公</small></div>
  </section>;
}
