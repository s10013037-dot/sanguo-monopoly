import {useEffect,useState} from 'react';
import {CHARACTERS,type CharacterId} from './characterCatalog';
export function CharacterPortrait({id,small=false}:{id:CharacterId;small?:boolean}) {
  const [source,setSource]=useState<string|null>(null);const [failed,setFailed]=useState(false);
  useEffect(()=>{let cancelled=false;setSource(null);setFailed(false);import('./three/thumbnails').then(m=>m.getThumbnail(id)).then(url=>{if(!cancelled)setSource(url);}).catch(()=>{if(!cancelled)setFailed(true);});return()=>{cancelled=true;};},[id]);
  const p=CHARACTERS[id];
  return <div className={`character-portrait ${small?'small':''}`} style={{'--portrait-color':p.robe} as React.CSSProperties} data-character={id}>
    {source?<img src={source} alt={`${p.name}公仔模型頭像`} width="192" height="224"/>:<span role="img" aria-label={`${p.name}${failed?' 2D標記':'公仔載入中'}`}>{p.name[0]}<small>{failed?'2D':'…'}</small></span>}
  </div>;
}
