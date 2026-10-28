import {useEffect,useRef,useState} from 'react';
import {X,RotateCcw,Plus,Minus,Play,Sparkles,Crown} from 'lucide-react';
import {CHARACTERS,LEADER_IDS,GENERAL_IDS,characterSkill,type CharacterId} from './characterCatalog';
import {GENERALS} from './game';
import {CharacterPortrait} from './CharacterPortrait';
import type {Showroom} from './three/showroom';
import './characters.css';
export type GallerySelection={kind:'leader'|'general';index:number};
export function CharacterGallery({selection,onLeader,onClose}:{selection:GallerySelection;onLeader:(index:number)=>void;onClose:()=>void}) {
  const id:CharacterId=selection.kind==='leader'?LEADER_IDS[selection.index]:GENERAL_IDS[selection.index];const p=CHARACTERS[id];
  const currentId=useRef(id);currentId.current=id;const close=useRef(onClose);close.current=onClose;
  const host=useRef<HTMLDivElement>(null);const dialog=useRef<HTMLElement>(null);const viewer=useRef<Showroom|null>(null);
  const [assetNotice,setAssetNotice]=useState('');
  const [ready,setReady]=useState(false);const [error,setError]=useState('');const [motion,setMotion]=useState('待機展示');
  useEffect(()=>{const previous=document.activeElement as HTMLElement|null;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.current?.focus();const handle=(event:KeyboardEvent)=>{
    if(event.key==='Escape'){event.preventDefault();close.current();}
    if(event.key==='Tab'){
      const items=[...(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),select,[tabindex="0"]')??[])];const first=items[0],last=items.at(-1);
      if(event.shiftKey&&(document.activeElement===first||document.activeElement===dialog.current)){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }
  };document.addEventListener('keydown',handle);return()=>{document.removeEventListener('keydown',handle);document.body.style.overflow=overflow;previous?.focus();};},[]);
  useEffect(()=>{let cancelled=false;setReady(false);setError('');setMotion('待機展示');
    let low=false;try{low=localStorage.getItem('sanguo-quality')==='low';}catch{/* standard */}
    import('./three/showroom').then(async m=>{if(currentId.current==='lvbu'){try{await m.preloadLubu(low?'board':'display');}catch{if(!cancelled)setAssetNotice('模型檔暫時無法載入，改用同款曲面模型展示。');}}if(cancelled||!host.current)return;try{viewer.current=m.createShowroom(host.current,currentId.current,low,()=>setError('3D 展示已中斷。請關閉後重試；遊戲存檔與操作不受影響。'));setReady(true);}catch{setError('無法啟動角色 WebGL 展示，仍可閱讀下方資料並返回棋局。');}}).catch(()=>{if(!cancelled)setError('展示模組載入失敗，請稍後重試。');});
    return()=>{cancelled=true;viewer.current?.dispose();viewer.current=null;};
  },[]);
  useEffect(()=>{if(!ready)return;try{viewer.current?.setCharacter(id);setMotion('待機展示');}catch{setError('模型切換失敗，請關閉展示後重試。');}},[id,ready]);
  function play(value:'idle'|'walk'|'victory'|'recruit'){viewer.current?.play(value);setMotion(value==='idle'?'待機展示':value==='walk'?'短腿行軍':value==='victory'?'勝利演武':'招募登場');}
  return <div className="modal-backdrop gallery-backdrop" onClick={onClose}><section className={`character-gallery ${id==='lvbu'?'lubu-gallery':''}`} role="dialog" aria-modal="true" aria-labelledby="gallery-title" ref={dialog} tabIndex={-1} onClick={e=>e.stopPropagation()}>
    <div className="gallery-header"><div><span className="eyebrow">{id==='lvbu'?'LÜ BU · ART PROTOTYPE · V3.6':'COLLECTIBLE HEROES · V3.5'}</span><h2 id="gallery-title">{selection.kind==='leader'?'主公圖鑑':'武將展示'}<small>公仔工坊</small></h2></div><button className="icon-button" onClick={onClose} aria-label="關閉人物展示"><X size={20}/></button></div>
    {selection.kind==='leader'&&<div className="gallery-tabs" role="tablist" aria-label="選擇展示主公">{LEADER_IDS.map((key,i)=><button role="tab" aria-selected={selection.index===i} key={key} onClick={()=>onLeader(i)}><CharacterPortrait id={key} small/><span>{CHARACTERS[key].name}</span></button>)}</div>}
    <div className="gallery-content"><div className="gallery-visual"><div className="showroom-host" ref={host}/>{!ready&&!error&&<div className="showroom-loading" role="status">正在雕琢公仔場景…</div>}{error&&<div className="showroom-error" role="alert"><CharacterPortrait id={id}/><p>{error}</p></div>}<div className="showroom-label"><span>{p.faction} · {p.dedicated?'專屬造型':'通用公仔'}</span><strong>{p.name}</strong></div><div className="showroom-camera"><button onClick={()=>viewer.current?.zoom(1/1.12)} disabled={!ready||!!error} aria-label="放大公仔"><Plus size={16}/></button><button onClick={()=>viewer.current?.zoom(1.12)} disabled={!ready||!!error} aria-label="縮小公仔"><Minus size={16}/></button><button onClick={()=>viewer.current?.reset()} disabled={!ready||!!error} aria-label="重設公仔視角"><RotateCcw size={15}/></button></div></div>
    <div className="gallery-info"><div className="eyebrow">{p.dedicated?'CHARACTER EDITION':'EXPANDABLE COLLECTION'}</div><h3>{p.name}<span>{p.faction}</span></h3><p>{p.description}</p>{!p.dedicated&&<p className="generic-notice">通用模型 · 專屬造型待後續擴充</p>}<dl><div><dt>兵種／定位</dt><dd>{p.unit}</dd></div><div><dt>代表武器</dt><dd>{p.weapon}</dd></div>{selection.kind==='general'&&<><div><dt>武將戰力</dt><dd>{GENERALS[selection.index].power}</dd></div><div><dt>招募身價</dt><dd>{GENERALS[selection.index].cost} 金</dd></div><div><dt>稀有度</dt><dd>{GENERALS[selection.index].rarity}</dd></div></>}</dl><div className="character-ability"><strong>既有能力／技能</strong><p>{characterSkill(id)}</p></div>{id==='lvbu'&&<><div className="lubu-view-controls" aria-label="呂布觀察角度">{(['front','side','back'] as const).map((angle,i)=><button key={angle} disabled={!ready||!!error} onClick={()=>viewer.current?.view(angle)}>{['正面','側面','背面'][i]}</button>)}<button disabled={!ready||!!error} onClick={()=>viewer.current?.face()}>臉部特寫</button></div>{assetNotice&&<p role="status" className="generic-notice">{assetNotice}</p>}</>}<div className="pose-controls"><button disabled={!ready||!!error} onClick={()=>play('idle')}><Play size={14}/> 待機</button>{id==='lvbu'&&<button disabled={!ready||!!error} onClick={()=>play('walk')}><Play size={14}/> 行走</button>}<button disabled={!ready||!!error} onClick={()=>play('victory')}><Crown size={14}/> 勝利</button><button disabled={!ready||!!error} onClick={()=>play('recruit')}><Sparkles size={14}/> 招募登場</button></div><p className="pose-status" aria-live="polite">{motion} · 演武結束後自動回到待機</p><p className="gallery-note">拖曳／單指旋轉 · 滾輪／雙指縮放<br/>展示期間棋局暫停；展示動作不會觸發遊戲事件。</p><button className="primary wide" onClick={onClose}>返回棋局</button></div></div>
  </section></div>;
}
