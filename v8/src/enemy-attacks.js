((root) => {
 'use strict';
 const profiles=Object.freeze({
  compy:{damage:5,range:26,windup:.35,cooldown:2.5},
  raptor:{damage:10,range:30,windup:.4,cooldown:2.8},
  pterodactyl:{damage:9,range:30,windup:.45,cooldown:3},
  trex:{damage:18,range:38,windup:.6,cooldown:3.5},
  triceratops:{damage:14,range:38,windup:.6,cooldown:3.5},
  dilophosaurus:{damage:8,range:145,windup:.65,cooldown:3.8,spit:true},
  ankylosaurus:{damage:15,range:62,windup:.75,cooldown:3.8},
  // Boss-class dinosaurs hit hard and from farther away (their sprites are huge, so a 70 px reach felt like a miss).
  brontosaurus:{damage:24,range:105,windup:.55,cooldown:2.6},
  stegosaurus:{damage:28,range:105,windup:.6,cooldown:2.6},
  pachycephalosaurus:{damage:26,range:80,windup:.5,cooldown:2.4},
  spinosaurus:{damage:34,range:105,windup:.5,cooldown:2.2}
 });
 function create({getActor,blocked,onHit,onSound,isActive=()=>true}){
  const projectiles=[];
  function clearLine(a,b){
   const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/2));
   for(let i=1;i<=steps;i++)if(blocked(a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps,2,2))return false;
   return true;
  }
  function update(dt,enemies){
   const actor=getActor();
   for(const enemy of enemies){
    if(!isActive())return;
    enemy.attackCooldown=Math.max(0,enemy.attackCooldown-dt);enemy.attackPose=Math.max(0,enemy.attackPose-dt);
    if(!enemy.alive||enemy.hidden||enemy.stunned>0){enemy.windup=0;continue;}
    const p=profiles[enemy.kind];
    if(enemy.windup>0){
     enemy.windup=Math.max(0,enemy.windup-dt);enemy.moving=false;
     if(enemy.windup>0)continue;
     enemy.attackPose=.3;enemy.mode='wander';enemy.timer=4;enemy.target=null;
     if(p.spit){
      const dx=enemy.aim.x-enemy.x,dy=enemy.aim.y-enemy.y,d=Math.hypot(dx,dy)||1;
      if(projectiles.length>=16)projectiles.shift();
      projectiles.push({x:enemy.x,y:enemy.y,dx:dx/d,dy:dy/d,age:0,damage:p.damage});
      onSound('spit');
     }else if(Math.hypot(actor.x-enemy.x,actor.y-enemy.y)<=p.range&&clearLine(enemy,actor)){
      onHit(p.damage,enemy);
     }
    }else if(enemy.mode==='chase'&&enemy.attackCooldown===0&&Math.hypot(actor.x-enemy.x,actor.y-enemy.y)<=p.range&&clearLine(enemy,actor)){
     enemy.windup=p.windup;enemy.attackCooldown=p.cooldown;enemy.aim={x:actor.x,y:actor.y};enemy.moving=false;
    }
   }
   for(let i=projectiles.length-1;i>=0;i--){
    if(!isActive())return;
    const shot=projectiles[i];shot.age+=dt;const distance=190*dt,steps=Math.max(1,Math.ceil(distance/2));let done=shot.age>=1.5;
    for(let step=0;step<steps&&!done;step++){
     const x=shot.x+shot.dx*distance/steps,y=shot.y+shot.dy*distance/steps;
     if(blocked(x,y,2,2)){done=true;break;}
     shot.x=x;shot.y=y;
     if(Math.hypot(x-actor.x,y-actor.y)<17){onHit(shot.damage,shot);done=true;}
    }
    if(done)projectiles.splice(i,1);
   }
  }
  function drawGround(ctx,enemies){
   for(const enemy of enemies){
    if(!enemy.alive||enemy.windup<=0)continue;
    const p=profiles[enemy.kind];ctx.save();ctx.strokeStyle='#ffc16e';ctx.fillStyle='#e8693224';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(enemy.x,enemy.y,p.spit?23:p.range,0,Math.PI*2);ctx.fill();ctx.stroke();
    if(p.spit){ctx.beginPath();ctx.moveTo(enemy.x,enemy.y);ctx.lineTo(enemy.aim.x,enemy.aim.y);ctx.stroke();}
    ctx.restore();
   }
  }
  function drawAir(ctx){
   for(const shot of projectiles){ctx.fillStyle='#345b24';ctx.fillRect(Math.round(shot.x)-4,Math.round(shot.y)-22,8,6);ctx.fillStyle='#bce56d';ctx.fillRect(Math.round(shot.x)-2,Math.round(shot.y)-23,4,4);}
  }
  function clear(enemies=[]){projectiles.splice(0);for(const enemy of enemies){enemy.windup=0;enemy.attackPose=0;enemy.aim=null;}}
  return {update,drawGround,drawAir,clear,clearLine,get state(){return {projectiles:projectiles.map(p=>({...p}))};}};
 }
 const api=Object.freeze({profiles,create});root.V6_ENEMY_ATTACKS=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
