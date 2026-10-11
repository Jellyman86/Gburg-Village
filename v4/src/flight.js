(() => {
 'use strict';
 function create({onGrab,onDrop}){
  let clock=0,cooldown=10,age=0,active=false,origin=null,scene=null;
  const bird={x:0,y:0,direction:'left',frame:0};
  function enter(id,player){scene=id;bird.x=player.x+100;bird.y=player.y-30;}
  function grab(player,id){
   if(active||cooldown>0||!SCENES[id]||SCENES[id].indoor)return false;
   origin={x:player.x,y:player.y,id:player.id,scene:id};age=0;active=true;cooldown=10;onGrab();return true;
  }
  function update(dt,player,town,allowed=true){
   clock+=dt;cooldown=Math.max(0,cooldown-dt);bird.frame=Math.floor(clock*8)%4;
   if(active){
    age+=dt;bird.x=origin.x;bird.y=origin.y-35;
    if(age>=3.5){active=false;cooldown=10;Object.assign(player,{x:origin.x,y:origin.y});onDrop();}
    return;
   }
   if(town.indoor||!allowed)return;
   const goal=cooldown===0?player:{x:player.x+100+Math.sin(clock*.7)*40,y:player.y-40+Math.cos(clock*.5)*20};
   const dx=goal.x-bird.x,dy=goal.y-bird.y,d=Math.hypot(dx,dy),step=Math.min(d,dt*90);
   if(d>0){bird.x+=dx/d*step;bird.y+=dy/d*step;bird.direction=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');}
   if(cooldown===0&&d<22)grab(player,town.id);
  }
  function view(){
   if(!active)return {overview:0,lift:0};
   const overview=age<1?age:age<3?1:0;
   const lift=age<1?Math.sin(age*Math.PI/2)*220:age<2.3?220:age<3?220*(3-age)/.7:Math.abs(Math.sin((age-3)*Math.PI*4))*12*(1-(age-3)/.5);
   return {overview:matchMedia('(prefers-reduced-motion: reduce)').matches?(age>=1&&age<3?1:0):overview,lift};
  }
  return {enter,grab,update,view,get state(){return {active,age,cooldown,clock,scene,origin:origin&&{...origin},bird:{...bird},...view()};}};
 }
 window.V4_FLIGHT={create};
})();
