(() => {
 'use strict';
 const dogData={barney:{name:'Barney',sheet:'../v4/assets/companions/barney.png'},rosie:{name:'Rosie',sheet:'../v4/assets/companions/rosie.png'}};
 function create(){
  let clock=0,passes=0,lastPass=0;
  const friends=[{id:'jeff',x:385,y:345,direction:'right',frame:1,moving:true},{id:'ari',x:575,y:345,direction:'left',frame:1,moving:true}];
  const dogs=[{id:'barney',x:1110,y:320,direction:'down',frame:1,moving:true},{id:'rosie',x:1135,y:400,direction:'up',frame:1,moving:true}];
  const swimmer={id:'chris',x:358,y:817,direction:'up',frame:1,moving:true,swimming:true};
  const skater={id:'jaime',x:100,y:330,direction:'down',frame:1,moving:true};
  const ball={x:395,y:345,rotation:0,waiting:false};
  function update(dt,player){
   clock+=dt;
   friends.forEach((actor,i)=>{
    actor.y=345+Math.sin(clock*1.2+i*Math.PI)*7;
    actor.frame=Math.floor(clock*6)%4;
   });
   dogs.forEach((actor,i)=>{
    actor.x=(i?1135:1110)+Math.sin(clock*.6+i*Math.PI)*7;
    actor.y=(i?400:320)+Math.sin(clock*.6+i*Math.PI)*12;
    actor.direction=Math.cos(clock*.6+i*Math.PI)>=0?'down':'up';actor.frame=Math.floor(clock*7)%4;
   });
   swimmer.y=800+Math.sin(clock*.5)*65;swimmer.direction=Math.cos(clock*.5)>=0?'down':'up';swimmer.frame=Math.floor(clock*6)%4;
   skater.y=350+Math.sin(clock*.65)*110;skater.direction=Math.cos(clock*.65)>=0?'down':'up';skater.frame=Math.floor(clock*10)%4;
   const teammate=friends.find(actor=>actor.id===player.id);
   const onField=player.x>=330&&player.x<=620&&player.y>=290&&player.y<=401;
   ball.waiting=!!teammate&&!onField;
   if(ball.waiting){
    const other=friends.find(actor=>actor.id!==player.id);ball.x=other.x;ball.y=other.y+5;return;
   }
   const pass=Math.floor(clock/2.4);
   if(pass!==lastPass){passes++;lastPass=pass;}
   const from=friends[pass%2],to=friends[(pass+1)%2],a=from.id===player.id?player:from,b=to.id===player.id?player:to;
   const t=(clock%2.4)/2.4;
   ball.x=a.x+(b.x-a.x)*t;ball.y=a.y+(b.y-a.y)*t+5;ball.rotation=clock*7;
  }
  function actors(player){
   return friends.concat(swimmer,skater).filter(actor=>actor.id!==player.id&&!V4_RPG.members[actor.id].joined).concat(V4_RPG.discoveries.dogs?[]:dogs);
  }
  function drawBall(ctx){
   const x=Math.round(ball.x),y=Math.round(ball.y);
   ctx.fillStyle='#172b3645';ctx.beginPath();ctx.ellipse(x,y+2,7,3,0,0,Math.PI*2);ctx.fill();
   ctx.save();ctx.translate(x,y-4);ctx.rotate(ball.rotation);
   ctx.fillStyle='#edf1e7';ctx.beginPath();ctx.arc(0,0,6,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#253447';ctx.lineWidth=1;ctx.stroke();
   ctx.fillStyle='#253447';ctx.fillRect(-2,-2,4,4);ctx.fillRect(-5,-4,2,2);ctx.fillRect(3,3,2,2);ctx.restore();
  }
  return {update,actors,drawBall,dogData,get state(){return {clock,passes,ball:{...ball},friends:friends.map(actor=>({...actor})),dogs:dogs.map(actor=>({...actor})),swimmer:{...swimmer},skater:{...skater}};}};
 }
 window.V4_RECREATION={create,dogData};
})();
