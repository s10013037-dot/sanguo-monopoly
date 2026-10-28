import { GENERALS, LEADERS } from './game';
export const LEADER_IDS = ['liubei','caocao','sunquan','dongzhuo'] as const;
export const GENERAL_IDS = ['zhaoyun','guanyu','zhangfei','lvbu','zhouyu','zhangliao','huangzhong','machao'] as const;
export type CharacterId = typeof LEADER_IDS[number] | typeof GENERAL_IDS[number];
export type Silhouette = 'benevolent'|'commander'|'young'|'heavy'|'silver'|'beard'|'wild'|'plume'|'generic';
export interface CharacterProfile { id:CharacterId; name:string; faction:string; unit:string; weapon:string; description:string; silhouette:Silhouette; robe:string; armor:string; accent:string; hair:string; skin:string; dedicated:boolean }
const definitions: Omit<CharacterProfile,'id'|'name'>[] = [
  {faction:'蜀漢',unit:'仁德君主',weapon:'雙股劍',description:'以仁德聚人心的君主。翠綠長袍、玉石冠與雙股劍，兼具溫和與英雄氣質。',silhouette:'benevolent',robe:'#287856',armor:'#174936',accent:'#dcb66c',hair:'#34302a',skin:'#f3cfaa',dedicated:true},
  {faction:'曹魏',unit:'統帥',weapon:'倚天佩劍',description:'冷靜果決的亂世梟雄。高冠、寬肩玄甲與黑色披風勾勒統帥輪廓。',silhouette:'commander',robe:'#2f4b72',armor:'#18273e',accent:'#cba65b',hair:'#23242d',skin:'#ebc4a1',dedicated:true},
  {faction:'東吳',unit:'江東君主',weapon:'江東佩劍',description:'年輕自信的江東霸主。碧玉金冠、白袖與輕盈金甲，帶著少年意氣。',silhouette:'young',robe:'#ece1c5',armor:'#b47831',accent:'#edc772',hair:'#744629',skin:'#f5cea5',dedicated:true},
  {faction:'群雄',unit:'西涼軍閥',weapon:'重型霸刀',description:'身披厚重紫黑鎧甲的霸主。寬闊肩甲、猩紅披風與重刀，氣勢威嚴。',silhouette:'heavy',robe:'#792e43',armor:'#33273c',accent:'#c39b50',hair:'#30232b',skin:'#e7b78f',dedicated:true},
  {faction:'蜀漢',unit:'龍騎兵',weapon:'龍膽亮銀槍',description:'常山趙子龍，白甲銀盔、藍色飄帶與長槍，英俊敏捷，膽識過人。',silhouette:'silver',robe:'#e8edf0',armor:'#a7bcc8',accent:'#74b9d3',hair:'#343c49',skin:'#f4d3b1',dedicated:true},
  {faction:'蜀漢',unit:'重騎兵',weapon:'青龍偃月刀',description:'美髯公關雲長，長鬚綠袍與青龍偃月刀，是忠義與沉穩的象徵。',silhouette:'beard',robe:'#28704c',armor:'#1c453c',accent:'#cfaf62',hair:'#292e29',skin:'#d89478',dedicated:true},
  {faction:'蜀漢',unit:'重步兵',weapon:'丈八蛇矛',description:'燕人張翼德，圓睜雙眼、濃密鬍鬚、重甲與蛇矛，豪邁勇猛。',silhouette:'wild',robe:'#79604b',armor:'#28333b',accent:'#b7a173',hair:'#252829',skin:'#dfac84',dedicated:true},
  {faction:'群雄',unit:'飛騎兵',weapon:'方天畫戟',description:'無雙飛將，雙翎高冠、黑紅金甲與方天畫戟，一身張揚的猛將氣勢。',silhouette:'plume',robe:'#a3343b',armor:'#242a37',accent:'#e2b257',hair:'#282b36',skin:'#ecc4a0',dedicated:true},
  {faction:'東吳',unit:'都督',weapon:'佩劍（通用）',description:'江東美周郎。目前採用統一風格的通用公仔，後續可擴充專屬造型。',silhouette:'generic',robe:'#8e5853',armor:'#614254',accent:'#d6b27c',hair:'#343240',skin:'#f1cfad',dedicated:false},
  {faction:'曹魏',unit:'突擊騎兵',weapon:'長劍（通用）',description:'逍遙戰神。目前採用通用甲士公仔，保留原本能力數值。',silhouette:'generic',robe:'#4d688c',armor:'#344354',accent:'#c7ae7a',hair:'#30323b',skin:'#ebc7a4',dedicated:false},
  {faction:'蜀漢',unit:'弓兵',weapon:'佩劍（通用展示；專屬弓待製作）',description:'百步穿楊的老將。目前為通用展示公仔，專屬弓與老將造型待擴充。',silhouette:'generic',robe:'#9a8250',armor:'#605d48',accent:'#d7be86',hair:'#9d9a8e',skin:'#e4c19d',dedicated:false},
  {faction:'蜀漢',unit:'西涼騎兵',weapon:'長劍（通用）',description:'錦衣神威。目前為通用甲士公仔，專屬西涼造型待擴充。',silhouette:'generic',robe:'#a5abb7',armor:'#657888',accent:'#d6c5a0',hair:'#343743',skin:'#f0cda9',dedicated:false},
];
export const CHARACTERS = Object.fromEntries([...LEADER_IDS,...GENERAL_IDS].map((id,i)=>[id,{...definitions[i],id,name:i<4?LEADERS[i].name:GENERALS[i-4].name}])) as Record<CharacterId,CharacterProfile>;
export const characterSkill = (id:CharacterId) => {
  const leader=LEADER_IDS.indexOf(id as typeof LEADER_IDS[number]);
  if(leader>=0)return LEADERS[leader].perk+'；無額外專屬技能，沿用既有規則。';
  return `軍隊支援：全隊戰力 +${GENERALS[GENERAL_IDS.indexOf(id as typeof GENERAL_IDS[number])].power}（既有加成，無額外觸發技能）。`;
};
