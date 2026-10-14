((root)=>{
 'use strict';
 const homes=[{x:35*32,y:27*32},{x:12*32,y:42*32},{x:69*32,y:30*32}];
 function create(width,height){
  const wrap=x=>((x%width)+width)%width,delta=x=>((x+width/2)%width+width)%width-width/2;
  let clock=0;
  const birds=homes.map((home,i)=>({x:home.x,y:home.y,home,mode:'wander',remaining:0,cooldown:6+i*4,direction:'right',frame:0}));
  function update(dt,actor,flying=false,heading=0){
   if(!Number.isFinite(dt)||dt<0)throw new Error('Invalid flyer timestep');
   clock+=dt;
   birds.forEach((bird,i)=>{
    bird.frame=Math.floor(clock*7+i)%4;bird.cooldown=Math.max(0,bird.cooldown-dt);
    const distance=Math.hypot(delta(actor.x-bird.x),actor.y-bird.y);
    if(bird.mode==='wander'&&bird.cooldown===0&&distance<240){
     bird.mode='follow';bird.remaining=3+dt;
    }
    if(bird.mode==='follow'||bird.mode==='depart'){
     bird.remaining-=dt;
     if(bird.remaining<=0){
      if(bird.mode==='follow'){bird.mode='depart';bird.remaining=3;bird.cooldown=30;}
      else{bird.mode='wander';bird.cooldown=Math.max(bird.cooldown,24);}
     }
    }
    let target={x:bird.home.x+Math.sin(clock*.24+i*2)*100,y:bird.home.y+Math.cos(clock*.24+i*2)*60},speed=55;
    if(bird.mode==='follow'){
     const side=i%2?80:-80;
     target=flying?{x:actor.x+Math.sin(heading)*190+Math.cos(heading)*side,y:actor.y-Math.cos(heading)*190+Math.sin(heading)*side}:
      {x:actor.x+side,y:actor.y-65};
     speed=flying?310:90;
    }else if(bird.mode==='depart'){
     target={x:bird.x+Math.cos(i*2)*400,y:bird.y-250};speed=flying?330:115;
    }
    const dx=delta(target.x-bird.x),dy=target.y-bird.y,d=Math.hypot(dx,dy),step=Math.min(d,speed*dt);
    if(d>.01){
     bird.x=wrap(bird.x+dx/d*step);bird.y=Math.max(16,Math.min(height-16,bird.y+dy/d*step));
     bird.direction=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
    }
   });
  }
  function draw(ctx,image,bird,x,y,size){
   const row={down:0,left:1,right:2,up:3}[bird.direction]+4;
   ctx.drawImage(image,bird.frame*128,row*128,128,128,x-size/2,y-size*.85,size,size);
  }
  return {update,
   get state(){return birds.map(({home,...bird})=>({...bird}));},
   drawOverhead(ctx,image){
    for(const bird of birds)for(const offset of [-width,0,width])draw(ctx,image,bird,bird.x+offset,bird.y-12,38);
   },
   drawFlight(ctx,image,output,actor,heading){
    const w=output.width,h=output.height,horizon=Math.floor(h*.24);
    for(const bird of birds){
     const dx=delta(bird.x-actor.x),dy=bird.y-actor.y;
     const depth=Math.sin(heading)*dx-Math.cos(heading)*dy,side=Math.cos(heading)*dx+Math.sin(heading)*dy;
     if(depth<60||depth>1030)continue;
     const t=Math.min(1,(1030-depth)/(5*depth+550)),span=120+depth*1.1;
     const x=w/2+side*w/span,size=Math.max(12,Math.min(44,48-depth*.03)),y=horizon+t*(h-horizon)-30;
     if(x>=-size&&x<=w+size)draw(ctx,image,bird,x,y,size);
    }
   }};
 }
 root.V8_WORLD_FLYERS=Object.freeze({create,homes});
 if(typeof module!=='undefined'&&module.exports)module.exports=root.V8_WORLD_FLYERS;
})(typeof window==='undefined'?globalThis:window);
