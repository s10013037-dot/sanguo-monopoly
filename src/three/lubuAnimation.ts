import * as T from 'three';
import type {Figure,CharacterMotion} from './characters';
import {LUBU_PROPORTIONS} from './lubuArt';
const wrist=new T.Quaternion(),rotation=new T.Euler();
const ease=(x:number)=>{const t=T.MathUtils.clamp(x,0,1);return t*t*(3-2*t);};
/** An irregular deterministic rhythm, including an occasional double blink. Never consumes game RNG. */
export function lubuBlink(time:number){
  const local=((time%26.3)+26.3)%26.3;
  let open=1;for(const at of [2.85,6.3,6.58,11.2,15.75,21.1,24.9])open=Math.min(open,1-Math.max(0,1-Math.abs(local-at)/.105));
  return Math.max(.035,open);
}
export function animatePremiumLubu(f:Figure,time:number,motion:CharacterMotion,progress:number,reduced:boolean){
  const t=T.MathUtils.clamp(progress,0,1),stride=motion==='walk'&&!reduced?Math.sin(t*Math.PI*4):0;
  const celebrate=motion==='victory'||motion==='recruit',amount=celebrate?(reduced?.72:Math.sin(t*Math.PI)):0;
  const attack=motion==='attack';
  // Slow anticipation, fast outward/downward strike, then weighted recovery.
  const strike=attack?(t<.34?-.22*ease(t/.34):t<.64?-.22+.95*ease((t-.34)/.30):.73*(1-ease((t-.64)/.36))):0;
  f.rig.position.set(0,motion==='arrival'&&!reduced?Math.sin(t*Math.PI)*.06:0,0);f.rig.rotation.set(0,0,0);
  if(motion==='recruit'&&!reduced){f.rig.rotation.y=ease(t)*Math.PI*2;f.rig.position.y=Math.sin(t*Math.PI)*.07;}
  f.body.position.set(0,(reduced?0:Math.sin(time*1.65)*.007)+Math.abs(stride)*.018,0);
  f.body.rotation.set(0,attack?strike*.10:0,reduced?0:Math.sin(time*.9)*.008);
  f.head.rotation.set(0,attack?-strike*.06:0,reduced?0:Math.sin(time*.66)*.012);
  f.arms.forEach((arm,i)=>{
    const side=i?1:-1;arm.position.y=LUBU_PROPORTIONS.armHeight;
    arm.rotation.set(stride*.34*(i?1:-1)+(reduced?0:Math.sin(time*1.45+i)*.018),0,side*.035);
  });
  f.legs.forEach((leg,i)=>{
    leg.rotation.x=stride*.42*(i?-1:1);const a=leg.rotation.x,c=Math.cos(a),s=Math.sin(a);
    const sole=-.227*c-.05*s-Math.hypot(.073*c,.135*s),toe=-.245*c-.153*s-Math.hypot(.029*c,.035*s);
    leg.position.y=Math.max(LUBU_PROPORTIONS.legHeight,-Math.min(sole,toe));
  });
  if(celebrate){f.arms[0].rotation.x=-.80*amount;f.arms[0].rotation.z=-.10*amount;f.arms[0].position.y+=amount*.018;f.arms[1].rotation.x=-.25*amount;}
  if(attack){f.arms[0].rotation.x=-.25-strike*.20;f.arms[0].rotation.z=-.08-Math.max(0,strike)*.06;f.arms[1].rotation.x=.13+strike*.2;}
  // The wrist compensates arm motion; the attack arc stays outside and in front of the face.
  f.grips.forEach((grip,i)=>{
    const side=i?1:-1;
    rotation.set(i===0&&attack?Math.max(0,strike)*.82:0,0,-side*.075+(i===0&&attack?.045+strike*.32:0));
    wrist.setFromEuler(rotation);grip.quaternion.copy(f.arms[i].quaternion).invert().multiply(wrist);
  });
  f.cape.rotation.set(reduced?0:-.035+Math.sin(time*1.4-.35)*.018,attack?-strike*.08:0,reduced?0:Math.sin(time*1.1-.5)*.012);
  f.eyes.forEach(eye=>eye.scale.set(1,reduced?1:lubuBlink(time),1));
  f.ornaments?.brows.forEach((brow,i)=>{const side=i?1:-1;brow.rotation.z=side*(amount*.04+(attack?strike*.045:reduced?0:Math.sin(time*.63)*.012));});
  f.ornaments?.plumes.forEach((plume,i)=>{plume.rotation.set(reduced?0:Math.sin(time*1.3+i)*.012,0,reduced?0:Math.sin(time*1.1+i*.7)*.009+(attack?strike*.015:0));});
}
