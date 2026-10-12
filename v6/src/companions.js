(() => {
 'use strict';
 function create({blocked}){
  const dogs=[{id:'barney',lag:90},{id:'rosie',lag:140}].map(d=>({...d,x:0,y:0,cursor:0,direction:'down',frame:1,moving:false,hidden:true}));
  let trail=[],clock=0,travel=0;
  function enter(player,found=false){
   trail=[{x:player.x,y:player.y}];travel=0;
   for(const dog of dogs)Object.assign(dog,{x:player.x,y:player.y,cursor:0,hidden:true,moving:false});
   if(found){Object.assign(dogs[0],{x:1110,y:320,hidden:false});Object.assign(dogs[1],{x:1135,y:400,hidden:false});}
  }
  function update(dt,player){
   if(!V4_RPG.discoveries.dogs)return;
   clock+=dt;const last=trail[trail.length-1],span=Math.hypot(player.x-last.x,player.y-last.y);
   if(span>=3){trail.push({x:player.x,y:player.y});travel+=span;}
   for(const dog of dogs){
    let remaining=0,limit=trail.length-1;
    while(limit>0&&remaining<dog.lag){remaining+=Math.hypot(trail[limit].x-trail[limit-1].x,trail[limit].y-trail[limit-1].y);limit--;}
    if(travel>=dog.lag)dog.hidden=false;
    dog.moving=false;if(dog.hidden||remaining<dog.lag)continue;
    let budget=dt*185;
    while(dog.cursor<=limit&&budget>0){
     const point=trail[dog.cursor],dx=point.x-dog.x,dy=point.y-dog.y,d=Math.hypot(dx,dy);
     if(d<1){dog.cursor++;continue;}
     const step=Math.min(2,d,budget),mx=dx/d*step,my=dy/d*step;
     if(Math.hypot(dog.x+mx-player.x,dog.y+my-player.y)<50)break;
     if(blocked(dog.x+mx,dog.y+my,6,3))break;
     dog.x+=mx;dog.y+=my;budget-=step;dog.moving=true;
     dog.direction=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
    }
    dog.frame=dog.moving?Math.floor(clock*8)%4:1;
   }
   const trim=Math.min(...dogs.map(d=>d.cursor));
   if(trim>100){trail.splice(0,trim);dogs.forEach(d=>d.cursor-=trim);}
  }
  return {enter,update,get actors(){return dogs.filter(d=>!d.hidden);},get state(){return {travel,dogs:dogs.map(d=>({...d})),trail:trail.map(p=>({...p}))};}};
 }
 window.V4_COMPANIONS={create};
})();
