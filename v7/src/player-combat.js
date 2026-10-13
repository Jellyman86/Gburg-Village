((root) => {
 'use strict';
 function create({getActor,getMember,move,onHit,onFaint,onRecover,reduced=()=>false}){
  let invulnerable=0,stagger=0,flash=0,phase='ready',age=0,hero=null,lastHit=null;
  function damage(raw,source){
   if(!Number.isFinite(raw)||raw<=0||!Number.isFinite(source.x)||!Number.isFinite(source.y))throw new Error('Invalid incoming attack.');
   if(phase!=='ready'||invulnerable>0)return false;
   const actor=getActor(),member=getMember(actor.id);
   const amount=Math.min(member.hp,Math.max(1,Math.round(raw-member.defense*.22)));
   member.hp-=amount;invulnerable=1.1;stagger=.18;flash=.4;lastHit={id:actor.id,amount,hp:member.hp};
   const dx=actor.x-source.x,dy=actor.y-source.y,d=Math.hypot(dx,dy);
   if(d&&!reduced())move(dx/d*12,dy/d*12);
   onHit({...lastHit});
   if(member.hp===0){hero=actor.id;phase='faint';age=0;onFaint(hero);}
   return true;
  }
  function recover(){phase='recovering';onRecover(hero);}
  function update(dt){
   invulnerable=Math.max(0,invulnerable-dt);stagger=Math.max(0,stagger-dt);flash=Math.max(0,flash-dt);
   if(phase==='faint'){age+=dt;if(age>=1.35)recover();}
  }
  function failed(){if(phase!=='recovering')throw new Error('Recovery is not in progress.');phase='retry';}
  function retry(){if(phase!=='retry')return false;recover();return true;}
  function recovered(){
   if(phase!=='recovering')throw new Error('Recovery is not in progress.');
   const member=getMember(hero);member.hp=member.maxHP;phase='ready';age=0;hero=null;invulnerable=1.8;stagger=0;flash=0;
  }
  function drawCover(ctx,width,height){
   if(phase==='ready')return;
   const progress=phase==='faint'?Math.max(0,(age-.65)/.7):1;
   ctx.fillStyle='#101521';
   for(let y=0;y<height;y+=24)for(let x=0;x<width;x+=24){
    const threshold=((x/24*73+y/24*151+19)%257)/257;
    if(threshold<progress)ctx.fillRect(x,y,24,24);
   }
  }
  return {damage,update,failed,retry,recovered,drawCover,
   get locked(){return phase!=='ready';},get staggered(){return stagger>0;},
   get state(){return {phase,age,hero,locked:phase!=='ready',invulnerable,stagger,flash,lastHit:lastHit&&{...lastHit}};}};
 }
 const api=Object.freeze({create});root.V6_PLAYER_COMBAT=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
