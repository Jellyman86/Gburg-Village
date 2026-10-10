// Small, independent powers: walking sprites and movement stay in game.js.
(() => {
 'use strict';
 const definitions=Object.freeze({
  connor:Object.freeze({name:'Throw football',label:'Throw',cooldown:1.3}),
  coco:Object.freeze({name:'Crying shockwaves',label:'Cry',cooldown:2.8})
 });
 const directions={down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0},up:{x:0,y:-1}};
 function create({blocked,getTarget,onHit}){
  const cooldowns={connor:0,coco:0},casts=[];
  let serial=0;
  function activate(actor){
   const power=definitions[actor.id];
   if(!power||cooldowns[actor.id]>0)return false;
   cooldowns[actor.id]=power.cooldown;
   const dir=directions[actor.direction]||directions.down;
   casts.push({serial:++serial,id:actor.id,x:actor.x,y:actor.y,dx:dir.x,dy:dir.y,age:0,hit:false,landed:false});
   return true;
  }
  function hit(cast){if(!cast.hit){cast.hit=true;onHit(cast.id);}}
  function update(dt){
   for(const id of Object.keys(cooldowns))cooldowns[id]=Math.max(0,cooldowns[id]-dt);
   const target=getTarget();
   for(const cast of casts){
    const previous=cast.age;cast.age+=dt;
    if(cast.id==='connor'&&!cast.landed){
     // A short wind-up, then a low arc. Ground coordinates govern collisions.
     const travel=Math.max(0,cast.age-.15)-Math.max(0,previous-.15),distance=travel*265;
     const steps=Math.max(1,Math.ceil(distance/3));
     for(let i=0;i<steps&&distance>0;i++){
      const x=cast.x+cast.dx*distance/steps,y=cast.y+cast.dy*distance/steps;
      if(blocked(x,y)){cast.landed=true;break;}
      cast.x=x;cast.y=y;
      if(target&&Math.hypot(cast.x-target.x,cast.y-target.y)<21){hit(cast);cast.landed=true;break;}
     }
     if(cast.age>=1.18)cast.landed=true;
    }else if(cast.id==='coco'&&target){
     const radius=Math.min(125,Math.max(0,cast.age-.08)*150);
     if(Math.hypot(cast.x-target.x,(cast.y-target.y)/.58)<=radius+16)hit(cast);
    }
   }
   for(let i=casts.length-1;i>=0;i--)if(casts[i].age> (casts[i].id==='connor'?1.4:1.25))casts.splice(i,1);
  }
  function drawGround(ctx){
   for(const cast of casts){
    if(cast.id!=='coco')continue;
    ctx.save();ctx.lineWidth=2;
    for(const delay of [.08,.24,.4]){
     const t=cast.age-delay;if(t<0||t>.84)continue;
     const radius=Math.min(125,t*150);
     ctx.globalAlpha=Math.max(0,1-t/.84);
     ctx.strokeStyle='#72d6fa';ctx.beginPath();ctx.ellipse(cast.x,cast.y,radius,radius*.58,0,0,Math.PI*2);ctx.stroke();
     ctx.strokeStyle='#d9f5ff';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(cast.x,cast.y,Math.max(0,radius-3),Math.max(0,radius*.58-2),0,0,Math.PI*2);ctx.stroke();ctx.lineWidth=2;
    }
    ctx.restore();
   }
  }
  function drawActor(ctx,actor){
   const cast=casts.find(c=>c.id===actor.id&&c.age<.9);
   if(!cast)return;
   ctx.save();
   if(actor.id==='coco'){
    // Pixel tear streams sit at the sides of her face, in every facing direction.
    const drop=Math.floor(cast.age*24)%8;
    for(const side of [-1,1]){
     const x=Math.round(actor.x)+side*6,y=Math.round(actor.y)-29+drop;
     ctx.fillStyle='#c9f5ff';ctx.fillRect(x,y,2,3);ctx.fillStyle='#55bde9';ctx.fillRect(x,y+3,2,3);
    }
   }else if(cast.age<.3){
    // A raised throwing hand; the original hat and walking atlas remain intact.
    ctx.fillStyle='#e8a76d';ctx.fillRect(Math.round(actor.x)+cast.dx*10-2,Math.round(actor.y)-27+cast.dy*3,4,4);
   }
   ctx.restore();
  }
  function drawAir(ctx){
   for(const cast of casts){
    if(cast.id!=='connor')continue;
    const t=Math.max(0,cast.age-.15),height=cast.landed?2:22+Math.sin(Math.min(1,t/1.03)*Math.PI)*18;
    ctx.save();ctx.globalAlpha=Math.min(1,(1.4-cast.age)/.2);
    ctx.fillStyle='#16343944';ctx.beginPath();ctx.ellipse(Math.round(cast.x),Math.round(cast.y),5,2,0,0,Math.PI*2);ctx.fill();
    ctx.translate(Math.round(cast.x),Math.round(cast.y-height));ctx.rotate(Math.atan2(cast.dy,cast.dx)+t*9);
    ctx.fillStyle='#482b23';ctx.fillRect(-6,-2,12,4);ctx.fillRect(-4,-4,8,8);
    ctx.fillStyle='#a96535';ctx.fillRect(-4,-2,8,4);ctx.fillRect(-2,-3,4,6);
    ctx.fillStyle='#f8e8c9';ctx.fillRect(-3,-1,6,1);for(const x of [-2,0,2])ctx.fillRect(x,-2,1,3);
    ctx.restore();
   }
  }
  return {activate,update,drawGround,drawActor,drawAir,
   cooldown:id=>cooldowns[id]||0,
   get state(){return {cooldowns:{...cooldowns},casts:casts.map(c=>({...c}))};}};
 }
 window.FAMILY_POWERS=Object.freeze({definitions,create});
})();
