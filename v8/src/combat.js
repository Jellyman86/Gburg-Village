// Gameplay encounters only. Story dinosaurs remain owned by the cinematic director.
((root) => {
 'use strict';
 const species=Object.freeze({
  compy:Object.freeze({hp:20,armor:0,outcome:'puff',height:38,sound:'hurt-compy'}),
  raptor:Object.freeze({hp:48,armor:0,outcome:'puff',height:82,sound:'hurt-raptor'}),
  pterodactyl:Object.freeze({hp:38,armor:0,outcome:'puff',height:82,sound:'hurt-pterodactyl'}),
  trex:Object.freeze({hp:110,armor:2,outcome:'retreat',height:84,sound:'hurt-trex'}),
  triceratops:Object.freeze({hp:100,armor:3,outcome:'retreat',height:82,sound:'hurt-triceratops'}),
  dilophosaurus:Object.freeze({hp:58,armor:0,outcome:'puff',height:82,sound:'hurt-dilophosaurus'}),
  ankylosaurus:Object.freeze({hp:130,armor:6,outcome:'retreat',height:82,sound:'hurt-ankylosaurus'}),
  // Big sheets: `size` is the sheet cell, `hitRadius` widens the target for projectiles and melee, `barWidth` the health bar.
  brontosaurus:Object.freeze({hp:160,armor:4,outcome:'retreat',height:128,size:192,hitRadius:36,markHeight:140,barWidth:56,speed:.6,sound:'hurt-ankylosaurus'}),
  // The Panthers Field boss: 2.5 T. rexes of health, drawn well above T. rex size.
  spinosaurus:Object.freeze({hp:275,armor:2,outcome:'retreat',height:170,size:224,hitRadius:44,markHeight:190,barWidth:84,speed:.95,sound:'hurt-trex'})
 });
 function init(enemy){
  const profile=species[enemy.kind];if(!profile)throw new Error('Unknown combat dinosaur: '+enemy.kind);
  Object.assign(enemy,{hp:profile.hp,maxHP:profile.hp,alive:true,hidden:false,flash:0,bar:0,knockX:0,knockY:0,defeatAge:0,stunned:0,windup:0,attackPose:0,attackCooldown:1.2,aim:null,hitRadius:profile.hitRadius||21});
  return enemy;
 }
 function create({blocked,onSound,showNumbers=true,reduced=()=>false}){
  const effects=[];let defeats=0,lastHit=null;
  function move(enemy,dx,dy){
   const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/2));
   for(let i=0;i<steps;i++){
    if(!blocked(enemy.x+dx/steps,enemy.y))enemy.x+=dx/steps;
    if(!blocked(enemy.x,enemy.y+dy/steps))enemy.y+=dy/steps;
   }
  }
  function add(effect){if(effects.length>=32)effects.shift();effects.push({...effect,age:0});}
  function hit(enemy,{power,strength=0,x,y,dx,dy,serial,owner}){
   if(!enemy.alive||enemy.hidden)return false;
   if(!Number.isFinite(power.damage)||power.damage<=0||!Number.isFinite(strength))throw new Error('Invalid attack damage.');
   const profile=species[enemy.kind],amount=Math.min(enemy.hp,Math.max(1,Math.round(power.damage+strength*.25-profile.armor)));
   const distance=Math.hypot(enemy.x-x,enemy.y-y);
   const direction=power.kind==='wave'||power.kind==='song'||power.kind==='tornado'?{x:distance?(enemy.x-x)/distance:dx,y:distance?(enemy.y-y)/distance:dy}:{x:dx,y:dy};
   enemy.hp-=amount;enemy.flash=.16;enemy.bar=2;enemy.stunned=.24;enemy.windup=0;enemy.attackPose=0;enemy.aim=null;enemy.attackCooldown=Math.max(enemy.attackCooldown,1.2);
   const force=(power.kind==='bite'?55:power.kind==='towel'?190:power.kind==='sword'?170:135)*(profile.outcome==='retreat'?.65:1);
   enemy.knockX=direction.x*force;enemy.knockY=direction.y*force;enemy.mode='wander';enemy.timer=4;enemy.target=null;enemy.moving=false;
   lastHit={kind:enemy.kind,amount,serial,owner};onSound(profile.sound);
   add({type:'spark',x:enemy.x,y:enemy.y-20,lifetime:.2});
   if(showNumbers)add({type:'number',amount,x:enemy.x,y:enemy.y-profile.height,lifetime:.75});
   if(enemy.hp===0){
    enemy.alive=false;enemy.defeatAge=0;enemy.mode=profile.outcome;enemy.retreatX=direction.x;enemy.retreatY=direction.y;defeats++;
    onSound(profile.outcome==='puff'?'puff':'retreat');
   }
   return true;
  }
  function update(dt,enemies){
   for(const enemy of enemies){
    enemy.flash=Math.max(0,enemy.flash-dt);enemy.bar=Math.max(0,enemy.bar-dt);
    move(enemy,enemy.knockX*dt,enemy.knockY*dt);
    const drag=Math.exp(-14*dt);enemy.knockX*=drag;enemy.knockY*=drag;
    if(enemy.alive||enemy.hidden)continue;
    const before=enemy.defeatAge;enemy.defeatAge+=dt;
    if(enemy.mode==='puff'&&enemy.defeatAge>=.22){
     enemy.hidden=true;add({type:'smoke',x:enemy.x,y:enemy.y-18,lifetime:.65});
    }else if(enemy.mode==='retreat'&&enemy.defeatAge>.4){
     const angle=Math.atan2(enemy.retreatY,enemy.retreatX),step=Math.min(dt,enemy.defeatAge-.4)*205;
     enemy.moving=false;
     for(const turn of [0,.6,-.6,1.2,-1.2,1.8,-1.8,Math.PI]){
      const dx=Math.cos(angle+turn)*step,dy=Math.sin(angle+turn)*step,steps=Math.max(1,Math.ceil(step/2));
      let clear=true;for(let i=1;i<=steps;i++)if(blocked(enemy.x+dx*i/steps,enemy.y+dy*i/steps)){clear=false;break;}
      if(!clear)continue;
      move(enemy,dx,dy);enemy.retreatX=Math.cos(angle+turn);enemy.retreatY=Math.sin(angle+turn);
      enemy.direction=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
      enemy.facing=dx>=0?1:-1;enemy.clock+=dt*13;enemy.moving=true;break;
     }
     if(before<2.8&&enemy.defeatAge>=2.8)enemy.hidden=true;
    }
   }
   for(let i=effects.length-1;i>=0;i--){effects[i].age+=dt;if(effects[i].age>=effects[i].lifetime)effects.splice(i,1);}
  }
  function drawFeedback(ctx,enemy){
   const p=species[enemy.kind],half=(p.barWidth||34)/2;
   if((enemy.bar>0||enemy.boss)&&enemy.alive){
    ctx.fillStyle='#112831';ctx.fillRect(-half,-p.height-9,half*2,5);
    ctx.fillStyle=enemy.boss?'#e8744f':'#f0d78b';ctx.fillRect(-half+1,-p.height-8,(half*2-2)*enemy.hp/enemy.maxHP,3);
   }
   if(enemy.flash>0){
    ctx.strokeStyle='#fff5dc';ctx.lineWidth=2;
    ctx.strokeRect(-half+1,-p.height+10,half*2-2,p.height-18);
   }
  }
  function drawEffects(ctx){
   for(const effect of effects){
    const t=effect.age/effect.lifetime;ctx.save();ctx.globalAlpha=Math.min(1,(1-t)*3);
    if(effect.type==='number'){
     ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#172431';ctx.fillStyle='#fff1a6';
     const y=effect.y-(reduced()?0:t*22);ctx.strokeText(String(effect.amount),effect.x,y);ctx.fillText(String(effect.amount),effect.x,y);
    }else if(effect.type==='spark'){
     ctx.fillStyle='#fff4cb';const span=5+t*7;
     ctx.fillRect(effect.x-span,effect.y-1,span*2,2);ctx.fillRect(effect.x-1,effect.y-span,2,span*2);
    }else{
     for(let i=0;i<7;i++){
      const angle=i*Math.PI*2/7,radius=(reduced()?8:5+t*20),size=Math.max(2,Math.round(9*(1-t)));
      ctx.fillStyle=i%2?'#fff3de':'#b9c9c8';ctx.fillRect(Math.round(effect.x+Math.cos(angle)*radius)-size/2,Math.round(effect.y+Math.sin(angle)*radius*.6)-size/2,size,size);
     }
    }ctx.restore();
   }
  }
  return {hit,update,drawFeedback,drawEffects,clearEffects:()=>effects.splice(0),
   setNumbers(value){showNumbers=!!value;if(!showNumbers)for(let i=effects.length-1;i>=0;i--)if(effects[i].type==='number')effects.splice(i,1);},
   get state(){return {showNumbers,defeats,lastHit:lastHit&&{...lastHit},effects:effects.map(e=>({...e}))};}};
 }
 const api=Object.freeze({species,init,create});root.V6_COMBAT=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
