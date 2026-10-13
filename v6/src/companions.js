((root) => {
 'use strict';
 function create({blocked,getEnemies=()=>[],clearLine,onBite,found=()=>root.V4_RPG.discoveries.dogs}){
  const dogs=[{id:'barney',lag:90},{id:'rosie',lag:140}].map((d,i)=>({...d,x:0,y:0,cursor:0,direction:'down',frame:1,moving:false,hidden:true,rest:0,pose:null,attack:0,biteCooldown:2.5+i*.8}));
  let trail=[],clock=0,travel=0;
  function enter(player,found=false){
   trail=[{x:player.x,y:player.y}];travel=0;
   for(const [i,dog] of dogs.entries())Object.assign(dog,{x:player.x,y:player.y,cursor:0,hidden:true,moving:false,rest:0,pose:null,attack:0,biteCooldown:2.5+i*.8});
   if(found){Object.assign(dogs[0],{x:1110,y:320,hidden:false});Object.assign(dogs[1],{x:1135,y:400,hidden:false});}
  }
  function update(dt,player){
   if(!found())return;
   clock+=dt;const last=trail[trail.length-1],span=Math.hypot(player.x-last.x,player.y-last.y);
   if(span>=3){trail.push({x:player.x,y:player.y});travel+=span;}
   for(const dog of dogs){
    dog.biteCooldown=Math.max(0,dog.biteCooldown-dt);dog.attack=Math.max(0,dog.attack-dt);
    let remaining=0,limit=trail.length-1;
    if(player.moving)while(limit>0&&remaining<dog.lag){remaining+=Math.hypot(trail[limit].x-trail[limit-1].x,trail[limit].y-trail[limit-1].y);limit--;}
    if(travel>=dog.lag)dog.hidden=false;
    dog.moving=false;if(dog.hidden)continue;
    let budget=dt*185;
    while(dog.cursor<=limit&&budget>0){
     const point=trail[dog.cursor],dx=point.x-dog.x,dy=point.y-dog.y,d=Math.hypot(dx,dy);
     if(d<1){dog.cursor++;continue;}
     const step=Math.min(2,d,budget),mx=dx/d*step,my=dy/d*step;
     if(Math.hypot(dog.x+mx-player.x,dog.y+my-player.y)<(dog.id==='barney'?38:50))break;
     if(blocked(dog.x+mx,dog.y+my,6,3))break;
     dog.x+=mx;dog.y+=my;budget-=step;dog.moving=true;
     dog.direction=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
    }
    const nearby=getEnemies().filter(e=>e.alive&&!e.hidden&&Math.hypot(e.x-player.x,e.y-player.y)<=120&&Math.hypot(e.x-dog.x,e.y-dog.y)<=90);
    const target=dog.biteCooldown===0&&nearby.find(e=>clearLine(dog,e));
    if(target&&!player.moving){
     const dx=target.x-dog.x,dy=target.y-dog.y,d=Math.hypot(dx,dy),steps=Math.ceil(dt*135/2);
     for(let i=0;i<steps&&Math.hypot(target.x-dog.x,target.y-dog.y)>26;i++){
      const x=dog.x+dx/d*Math.min(2,dt*135/steps),y=dog.y+dy/d*Math.min(2,dt*135/steps);
      if(blocked(x,y,6,3)||Math.hypot(x-player.x,y-player.y)>120)break;
      dog.x=x;dog.y=y;dog.moving=true;dog.direction=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
     }
    }
    if(target&&Math.hypot(target.x-dog.x,target.y-dog.y)<=28){
     dog.biteCooldown=3.8;dog.attack=.3;onBite(dog,target);
    }
    if(player.moving||dog.moving||nearby.length||dog.attack>0)dog.rest=0;
    else if(Math.hypot(dog.x-player.x,dog.y-player.y)<=65)dog.rest+=dt;
    else dog.rest=0;
    dog.pose=dog.attack>0?'attack':dog.rest>=4?'sleep':dog.rest>=2?'lie':dog.rest>=1?'sit':null;
    dog.poseFrame=dog.pose==='attack'?Math.min(1,Math.floor((.3-dog.attack)/.15)):({sit:2,lie:3,sleep:4})[dog.pose];
    dog.frame=dog.moving?Math.floor(clock*8)%4:1;
   }
   const trim=Math.min(...dogs.map(d=>d.cursor));
   if(trim>100){trail.splice(0,trim);dogs.forEach(d=>d.cursor-=trim);}
  }
  return {enter,update,get actors(){return dogs.filter(d=>!d.hidden);},get state(){return {travel,dogs:dogs.map(d=>({...d})),trail:trail.map(p=>({...p}))};}};
 }
 const api={create};root.V4_COMPANIONS=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
