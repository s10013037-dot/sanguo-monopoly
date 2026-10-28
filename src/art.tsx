import { useId } from 'react';
import { LEADERS, type CellKind } from './game';

const palettes = [
  { robe: '#5a9a70', dark: '#2d6350', trim: '#eac87c', hat: '#3b6b51', hair: '#39372e' },
  { robe: '#6086b1', dark: '#344b75', trim: '#e7c98c', hat: '#34415e', hair: '#302f3b' },
  { robe: '#d49546', dark: '#9c542e', trim: '#ffde8a', hat: '#a76c35', hair: '#854c2d' },
  { robe: '#a15d79', dark: '#67394e', trim: '#e5b56a', hat: '#55364d', hair: '#3c2a36' },
];

/** Local vector characters: the same full-body design is used on the map and in portraits. */
export function Hero({ leader, walking = false }: { leader: number; walking?: boolean }) {
  const p = palettes[leader];
  return <svg viewBox="0 0 100 132" className={`hero-art ${walking ? 'is-walking' : ''}`} aria-hidden="true">
    <ellipse className="hero-shadow" cx="50" cy="121" rx="27" ry="6" fill="#233d3940"/>
    <g className="hero-leg leg-left"><path d="M35 99v18" stroke={p.dark} strokeWidth="12" strokeLinecap="round"/><path d="M36 116h-9q-7 7 1 8h13v-6" fill="#393b43"/><path d="M29 120h10" stroke="#d0b476" strokeWidth="2"/></g>
    <g className="hero-leg leg-right"><path d="M63 99v18" stroke={p.dark} strokeWidth="12" strokeLinecap="round"/><path d="M62 116h9q7 7-1 8H57v-6" fill="#393b43"/><path d="M60 120h10" stroke="#d0b476" strokeWidth="2"/></g>
    <g className="hero-torso">
      <path d="M28 74q22-12 44 0l7 31q-29 14-58 0z" fill={p.dark} stroke="#263c3d" strokeWidth="1.5"/>
      <path d="M30 74q20-7 40 0l3 28q-22 8-46 0z" fill={p.robe}/>
      <path d="m39 72 13 18 12-18M51 90v18" fill="none" stroke={p.trim} strokeWidth="4"/>
      <path d="M27 93h47v7H27z" fill={p.dark}/><rect x="44" y="92" width="12" height="9" rx="2" fill={p.trim}/>
      <path d="M29 100 25 110l20 1 5-10M69 100l6 10-19 1-5-10" fill={p.robe} stroke={p.dark} strokeWidth="1.5"/>
      <g className="hero-arm arm-left"><path d="M29 75Q15 78 15 93" fill="none" stroke={p.dark} strokeWidth="14" strokeLinecap="round"/><path d="M27 77Q18 81 17 90" fill="none" stroke={p.robe} strokeWidth="11" strokeLinecap="round"/><circle cx="16" cy="95" r="6" fill="#ffd4a7"/>
        {leader === 0 && <g transform="translate(0 86)"><path d="m17 20 1-26" stroke="#92733d" strokeWidth="3"/><path d="M18 0Q-1-15 3-26q10 0 15 15 5-15 15-15 3 13-15 26" fill="#dce8b8" stroke="#7e9b69" strokeWidth="1.5"/></g>}
        {leader === 1 && <g><path d="m17 97-8-42 6-10 5 9-1 43" fill="#d7e6e9" stroke="#74909b" strokeWidth="1.5"/><path d="m10 94 16-3" stroke={p.trim} strokeWidth="5"/></g>}
        {leader === 2 && <g><path d="m14 98-8-37 7-14 7 11-3 38" fill="#ecdeaf" stroke="#b9924b" strokeWidth="1.5"/><path d="m9 96 15-3" stroke={p.trim} strokeWidth="5"/></g>}
        {leader === 3 && <g><path d="m15 108-4-70" stroke="#a87946" strokeWidth="4"/><path d="m11 57-8-10 7-20 13 11-8 10 10 3z" fill="#bdd3d1" stroke="#698e91" strokeWidth="2"/></g>}
      </g>
      <g className="hero-arm arm-right"><path d="M71 76q15 4 14 17" fill="none" stroke={p.dark} strokeWidth="14" strokeLinecap="round"/><path d="M73 78q10 4 10 12" fill="none" stroke={p.robe} strokeWidth="11" strokeLinecap="round"/><circle cx="84" cy="96" r="6" fill="#ffd4a7"/></g>
      <g className="hero-head"><path d="M20 38q0-23 30-23t31 23v29q-4 13-17 16H34Q19 77 20 62z" fill={p.hair}/>
        <ellipse cx="22" cy="51" rx="6" ry="9" fill="#edb18a"/><ellipse cx="78" cy="51" rx="6" ry="9" fill="#edb18a"/>
        <path d="M23 36q27-17 54 0v17q0 25-27 25T23 53z" fill="#ffdab0" stroke="#d4a37a" strokeWidth="1.2"/>
        <path d="M25 36q11 3 16-10 18 13 35 11-3-17-24-17T25 36" fill={p.hair}/>
        <ellipse cx="32" cy="58" rx="7" ry="3.5" fill="#edac94" opacity=".7"/><ellipse cx="69" cy="58" rx="7" ry="3.5" fill="#edac94" opacity=".7"/>
        <path d="m31 43 10-2m18 0 10 2" stroke={p.hair} strokeWidth="3" strokeLinecap="round"/>
        <ellipse cx="37" cy="51" rx="3.1" ry="4.6" fill="#36353b"/><ellipse cx="63" cy="51" rx="3.1" ry="4.6" fill="#36353b"/><circle cx="38" cy="49" r="1" fill="white"/><circle cx="64" cy="49" r="1" fill="white"/>
        <path d="m46 61 4 3 4-3" fill="none" stroke="#ac6b58" strokeWidth="1.8" strokeLinecap="round"/>
        {leader !== 2 && <path d={leader===3?'M32 64q18 14 36 0l-5 15q-13 12-26-1z':'M39 69q11 5 22 0l-4 17-8 8-6-10z'} fill={p.hair}/>}
        {leader === 2 && <><path d="m43 69 7 6 7-6" fill={p.hair}/><path d="M31 42h9m20 0h9" stroke="#8b552f" strokeWidth="3"/></>}
        {leader === 0 && <g><path d="M20 32v-9Q50 8 80 23v9z" fill={p.hat} stroke={p.dark} strokeWidth="2"/><path d="M23 26h54" stroke={p.trim} strokeWidth="5"/><path d="M43 19V5h14v14" fill={p.hat} stroke={p.trim} strokeWidth="2"/><circle cx="50" cy="25" r="4" fill="#9acbac"/></g>}
        {leader === 1 && <g><path d="M19 32V20l8-5h9V4h28v11h9l8 5v12z" fill={p.hat} stroke="#242f49" strokeWidth="2"/><path d="M20 28h60" stroke={p.trim} strokeWidth="4"/><path d="m42 10 8-4 8 4-8 12z" fill={p.trim}/></g>}
        {leader === 2 && <g><path d="M19 31 23 17l10 2 7-10 10 5 10-5 7 10 10-2 4 14z" fill={p.hat} stroke={p.dark} strokeWidth="2"/><path d="M24 27h52" stroke={p.trim} strokeWidth="5"/><path d="m42 24 8-8 8 8-8 9z" fill="#81a691"/><path d="m24 21 6 3m46-3-6 3" stroke="#fbd787" strokeWidth="2"/></g>}
        {leader === 3 && <g><path d="M18 32V21Q22 9 50 10t32 11v11z" fill={p.hat} stroke="#47273d" strokeWidth="2"/><path d="M20 29h60" stroke={p.trim} strokeWidth="5"/><path d="M53 17Q47-5 35 4q2 14 18 17M57 16Q66-5 75 2q-1 13-18 18" fill="#c66f76" stroke="#8d445d" strokeWidth="1.5"/><circle cx="52" cy="26" r="5" fill="#e8b95f"/></g>}
      </g>
    </g>
  </svg>;
}

export function Portrait({ leader, small = false }: { leader: number; small?: boolean }) {
  return <div className={`portrait full-portrait portrait-${leader} ${small ? 'small' : ''}`} role="img" aria-label={`${LEADERS[leader].name} Q版人物`}><Hero leader={leader}/></div>;
}

function Tree({ x, y, scale = 1, pink = false }: { x: number; y: number; scale?: number; pink?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}><ellipse cy="5" rx="16" ry="6" fill="#395d4633"/><path d="M0 3v-25m0 15-7-6m7 1 8-7" stroke="#866e4d" strokeWidth="4" strokeLinecap="round"/>{pink?<g fill="#e9a6ae" stroke="#c57e91" strokeWidth="1"><circle cy="-30" r="14"/><circle cx="-10" cy="-20" r="12"/><circle cx="11" cy="-20" r="13"/><circle cx="4" cy="-38" r="10" fill="#f4bfbe"/></g>:<><path d="m0-53-19 29h10l-16 20q25 12 50 0L9-24h10z" fill="#4b8369"/><path d="M0-51v48q-12-1-22-4l15-17h-9z" fill="#6da17a"/><path d="m0-42 10 18H0m0 7 13 13H0" fill="#8ab18b" opacity=".5"/></>}</g>;
}

/** Miniature cities vary their towers, roofs, walls and banners by board index. */
function City({ variant = 0 }: { variant?: number }) {
  const roofs = ['#547b6e','#637ca1','#ba7c58','#8b708e']; const roof=roofs[variant%4];
  return <g strokeLinejoin="round"><ellipse cx="60" cy="86" rx="46" ry="12" fill="#304e3a24"/>
    {variant%3===1&&<><path d="M68 28h20v33H68z" fill="#e2d3b0"/><path d="m62 29 15-12 16 12z" fill={roof}/><path d="M72 40h4m5 0h4M72 49h4m5 0h4" stroke="#b3a788" strokeWidth="3"/></>}
    <path d="m18 62 44-18 42 20-44 23z" fill="#e5d6a8"/>
    <path d="M18 62v22l42 17V80z" fill="#b9ad87" stroke="#9b9679"/><path d="m60 80 44-16v20l-44 17z" fill="#d1c9a8" stroke="#9b9679"/>
    <path d="m18 61 8 3v-5l8 3v6l8 3v-5l8 3v6l10 4 10-4v-6l8-3v5l8-3v-6l8-3v5l10-4v9L60 86 18 69z" fill="#e6ddbd" stroke="#9f9f83"/>
    <path d="M48 43h25v29L48 82z" fill="#dfd2ad"/><path d="m31 48 28-20 32 12-24 16z" fill={roof} stroke="#3d5b59"/><path d="m31 48 28-13 32 5-24 16z" fill="#ffffff20"/>
    {variant%3===2&&<><path d="M47 28h22v19l-22 7z" fill="#ead8ac"/><path d="m36 29 22-18 27 10-20 14z" fill={roof} stroke="#735f54"/></>}
    <path d="M31 73q9-9 15 5v17l-15-6z" fill="#6c7265"/><path d="m76 80 8-3v10l-8 3zM90 75l7-3v10l-7 3z" fill="#9a9f87"/>
    <path d="M59 30V8" stroke="#87714f" strokeWidth="2"/><path className="map-flag" d="M60 8h19l-5 7H60z" fill={variant%2?'#deaa53':'#bf6d5d'}/>
    <path d="m22 78 9 4m-5 4 7 3m36 5 6-2m15-9 9-3" stroke="#949479" strokeWidth="1"/>
  </g>;
}

export function TileArt({ kind, index }: { kind: CellKind; index: number }) {
  return <svg viewBox="0 0 120 110" className={`tile-illustration illustration-${kind}`} aria-hidden="true">
    <path d="m4 78 54-20 58 20-54 28z" fill="#a4b886" opacity=".35"/>
    {kind==='recruit'?<City variant={index}/>:kind==='money'?<g strokeLinejoin="round"><ellipse cx="60" cy="88" rx="42" ry="11" fill="#87723c22"/><path d="m19 49 32-12 34 13v34L51 99 19 82z" fill="#bda46a"/><path d="m51 62 34-12v34L51 99z" fill="#e1cd94"/><path d="M11 49 48 27l45 18-40 20z" fill="#ad9057"/><path d="m13 46 35-20 45 18-40 16z" fill="#c2ab71"/><path d="m21 43 28-13 33 13m-57 5 25-12 25 10" fill="none" stroke="#e4d194" strokeWidth="2"/><path d="M33 69v18l14 5V74z" fill="#6c714f"/><g fill="#e5ba4e" stroke="#b58c35" strokeWidth="2"><ellipse cx="91" cy="88" rx="14" ry="6"/><path d="M77 80v8q14 8 28 0v-8"/><ellipse cx="91" cy="80" rx="14" ry="6" fill="#f3d979"/><path d="M80 73v7q12 8 23 0v-7"/><ellipse cx="91" cy="73" rx="12" ry="5" fill="#f9df87"/></g><path d="m87 72 5-1 4 2-5 2z" fill="#b78d37"/><path d="m94 52 3 5 6 2-6 2-3 6-2-6-6-2 6-2z" fill="#fff2ba"/></g>:kind==='battle'?<g><ellipse cx="60" cy="88" rx="41" ry="11" fill="#754e3b22"/><path d="m19 82 17-39 21 42z" fill="#a9745c"/><path d="m36 43 24 30-3 12z" fill="#c28c6a"/><path d="m18 81 17-3 22 7-20 8z" fill="#765e4b"/><path d="m77 15 3 72" stroke="#6c5444" strokeWidth="3"/><path className="map-flag" d="m79 17 31 4-10 11 9 10-28-6z" fill="#a7544f"/><path d="m38 94 32-52m-23 4 37 44" stroke="#6c6359" strokeWidth="4"/><path d="m64 46 4-19 12-2-4 14-10 10M48 46l-3-18-11-6 1 16 10 13" fill="#d8e5df" stroke="#7d9a96" strokeWidth="2"/><path d="m56 57 9 5m-23-6 9-7" stroke="#caa457" strokeWidth="5"/><path d="m87 80-5 13 16-1 3-10z" fill="#858e78"/><path d="m21 91 5 3m57-39 5 3" stroke="#ce9d70" strokeWidth="3"/></g>:kind==='event'?<g><Tree x={21} y={86} scale={.9}/><path d="m40 77 24-14 34 13-26 17z" fill="#8caa8c"/><path d="m40 77v10l32 15V89z" fill="#749875"/><path d="m72 89 26-13v10l-26 16z" fill="#a5bd93"/><path d="M47 41q5-5 13-1l28 11v30L58 70q-8-5-11 0z" fill="#f2dca6" stroke="#ba985b" strokeWidth="2"/><path d="M49 40q-10-6-10 2t10 5m37 4q10-3 10 6t-9 3v22q10-4 10 3t-11 4L57 78q-9-4-9-12" fill="#efd9a1" stroke="#ba985b" strokeWidth="2"/><path d="m59 50 19 7m-19 1 16 6m-16 1 9 4" stroke="#af9867" strokeWidth="2"/><path className="event-spark" d="m91 17 3 8 8 3-8 3-3 9-3-9-8-3 8-3zM61 13l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#d5b05c"/></g>:<g><Tree x={31} y={87} pink scale={1.2}/><Tree x={86} y={78} pink scale={.9}/><path d="m44 82 16-13 16 7-17 13z" fill="#e6c896"/><path d="m44 82 15 7v9l-15-7z" fill="#ac8e65"/><path d="m59 89 17-13v10L59 98z" fill="#c2ac82"/><path d="m45 62 16-9 15 6v17l-16 9-15-5z" fill="#e4d4ad"/><path d="m36 63 24-20 25 13-22 17z" fill="#648b70"/><path d="m44 62 16-13 17 8-14 10z" fill="#8caf84"/><path d="m59 72 5 2v7l-5 2z" fill="#a5885d"/><path d="m13 83 6 3m75 9 5-2m-48-1 5 2" stroke="#ecb1af" strokeWidth="3"/></g>}
  </svg>;
}

export function Landscape() {
  const id=useId().replace(/:/g,'');
  return <svg className="landscape fantasy-landscape" viewBox="0 0 800 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>
    <linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor="#dfe9d0"/><stop offset="1" stopColor="#f3e9bc"/></linearGradient>
    <linearGradient id={`${id}-water`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#8bc9c2"/><stop offset="1" stopColor="#54a6a6"/></linearGradient>
    <linearGradient id={`${id}-rock`}><stop stopColor="#c5caa0"/><stop offset="1" stopColor="#8baf8e"/></linearGradient>
    <pattern id={`${id}-field`} width="14" height="12" patternUnits="userSpaceOnUse"><path d="m0 12 14-12M7 12l7-6" stroke="#cfb667" strokeWidth="1.5"/></pattern>
  </defs>
    <path d="M0 0H800V700H0z" fill={`url(#${id}-sky)`}/><circle cx="655" cy="106" r="57" fill="#f9e6a1"/><circle cx="655" cy="106" r="68" fill="none" stroke="#fff2c6" strokeWidth="2" opacity=".5"/>
    <g fill="#faf8df" opacity=".7"><path d="M42 123q20-16 52-4t63 1q33-8 48 5zM495 63q20-15 38-3 30-6 53 8h-96zM615 187q24-21 55-9 33-8 65 12H603z"/></g>
    <path d="M0 297 72 210l37 31 58-122 57 95 48-42 58 120 76-68 56 73 76-122 53 68 66-69 143 149v95H0" fill="#b8ccab"/>
    <path d="m111 316 59-161 72 173-54-36zM313 344l95-110 58 115-70-45zM529 355l80-161 71 164-70-37z" fill={`url(#${id}-rock)`}/>
    <path d="m170 156 24 57-24-15-19 14zM609 195l22 52-20-16-17 17z" fill="#eff0cd"/>
    <path d="m170 210-19 112 36-30 31 19zM610 243l-42 109 42-31 44 24z" fill="#759c7c" opacity=".6"/>
    <path d="M0 399Q152 295 294 361t208 8Q658 297 800 389v311H0" fill="#b3c88e"/>
    <path d="M0 457q153-101 289-28t218-23q152-45 293 47v247H0" fill="#93b47e"/>
    <path d="M651 302q-27 37-101 66-122 44-62 98t-51 92q-119 32-61 142h213q-95-88 0-117 163-65 20-155-62-26 16-66 49-18 43-60" fill="#d5dcaa"/>
    <path d="M653 304q-35 46-104 75-100 43-45 83t-48 106q-106 33-56 132h164q-91-88 3-128 144-55 24-131-79-32 32-78 42-21 30-59" fill={`url(#${id}-water)`}/>
    <g fill="none" stroke="#c1e6d4" strokeWidth="3" opacity=".8"><path d="m529 399 29-9m-45 32 29-8m13 72 28 10m-133 96 30-10m-46 40 23-7m48 51 31-2"/></g>
    <path d="M649 297v53q-6 9-13 10v-52" fill="#ccece0" opacity=".75"/><path d="m641 312-1 37" stroke="#f4ffed" strokeWidth="3"/>
    <path d="M26 700q92-112 164-166t153-58q70-3 154 46" fill="none" stroke="#73916744" strokeWidth="21"/><path d="M24 700q92-112 164-166t153-58q70-3 154 46" fill="none" stroke="#e2cd9e" strokeWidth="14"/>
    <path d="m471 491 67 10 3 38-70-12z" fill="#b39c70" stroke="#8f845e" strokeWidth="2"/><path d="m473 495 62 12m-62-4 63 12m-62-4 62 12m-61-4 62 12" stroke="#e1c994" strokeWidth="3"/><path d="M474 484v40m62-28v40m-62-46 62 11" stroke="#8d815e" strokeWidth="3"/>
    <g transform="translate(240 400) scale(1.7)"><City variant={2}/></g>
    <g transform="translate(610 460) scale(.95)"><City variant={5}/></g>
    <g transform="translate(55 420)"><path d="m0 38 60-25 52 24-60 27z" fill="#d5c677" stroke="#a1ab65" strokeWidth="3"/><path d="m0 38 60-25 52 24-60 27z" fill={`url(#${id}-field)`}/><path d="m13 40 46-19 38 17-45 20z" fill="none" stroke="#ece1a0" strokeWidth="2"/></g>
    <g transform="translate(180 530)"><path d="m0 20 54-18 36 19-55 22z" fill="#b5c67d"/><path d="m0 20 54-18 36 19-55 22z" fill={`url(#${id}-field)`}/></g>
    {[[52,385,1.1],[86,364,.8],[109,394,.9],[713,369,1],[746,406,1.3],[687,400,.8],[80,574,1.1],[119,597,.85],[171,642,1.25],[230,620,.9],[684,633,1.3],[722,592,1.1],[641,603,.85],[276,352,.75],[316,373,.8]].map(([x,y,scale],i)=><Tree key={i} x={x} y={y} scale={scale}/>)}
    {[[262,540,.9],[291,569,.8],[323,559,.75],[151,462,.75]].map(([x,y,scale],i)=><Tree key={i} x={x} y={y} scale={scale} pink/>)}
    <g fill="#dbe6bd" stroke="#819a79" strokeWidth="2"><path d="m72 630 9-12 20-3 9 14-17 8zM654 443l9-12 17 6-3 13zM356 643l8-9 19 3 4 10-20 4z"/></g>
    <g fill="none" stroke="#5f7e6d" strokeWidth="2" strokeLinecap="round"><path d="m524 166 8-4 8 4m18-13 8-4 8 4m-269 62 7-4 7 4"/></g>
    <g fill="#fff0c5"><circle cx="227" cy="552" r="2"/><circle cx="182" cy="430" r="2"/><circle cx="632" cy="572" r="2"/></g>
  </svg>;
}
