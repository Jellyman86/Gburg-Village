(() => {
 'use strict';
 function create({notify,enabled}){
  let seen=false,age=0,bus=null;
  function update(dt,town,player,camera,width){
   if(!enabled()){bus=null;return;}
   if(bus){age+=dt;if(age>=7||bus.scene!==town.id)bus=null;return;}
   if(seen||town.id!=='district')return;
   const road=town.walkable.filter(r=>r.w>500&&r.w>r.h*4&&player.x>=r.x&&player.x<=r.x+r.w&&Math.abs(player.y-(r.y+r.h/2))<100)
    .sort((a,b)=>Math.abs(player.y-a.y)-Math.abs(player.y-b.y))[0];
   if(!road)return;
   const from=Math.max(road.x-256,camera.x-256),to=Math.min(road.x+road.w+256,camera.x+width+256);
   seen=true;age=0;bus={scene:town.id,from,to,y:road.y+road.h/2};notify('The dinosaur bus is NOT stopping for school today!');
  }
  function draw(ctx,image,scene){
   if(!bus||bus.scene!==scene)return;
   const x=bus.from+(bus.to-bus.from)*age/7,frame=Math.floor(age*7)%5;
   ctx.drawImage(image,frame*256,0,256,128,Math.round(x)-128,Math.round(bus.y)-124,256,128);
  }
  return {update,draw,get state(){return {seen,active:!!bus,age};}};
 }
 window.V6_GIMMICKS={create};
})();
