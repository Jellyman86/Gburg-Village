// Independent action effects; original walking atlases remain reusable.
(() => {
 'use strict';
 const definitions=Object.freeze(Object.fromEntries(Object.entries({
  jason:{name:'Punch',label:'Punch',kind:'punch',cooldown:.3,duration:.32,range:46},
  connor:{name:'Throw football',label:'Throw',kind:'football',cooldown:.45,duration:1.4,speed:265},
  coco:{name:'Crying shockwaves',label:'Cry',kind:'wave',cooldown:.85,duration:1.25,range:125},
  peachy:{name:'Spinning kick',label:'Kick',kind:'kick',cooldown:.5,duration:.55,range:58},
  stephanie:{name:'Paper airplane',label:'Plane',kind:'plane',cooldown:.45,duration:1.25,speed:315},
  mark:{name:'Espresso martini',label:'Martini',kind:'martini',cooldown:.55,duration:1.4,speed:245},
  adam:{name:'Tennis racket swing',label:'Swing',kind:'racket',cooldown:.4,duration:.42,range:63},
  kate:{name:'Turtle shot',label:'Turtle',kind:'turtle',cooldown:.6,duration:1.5,speed:230},
  brie:{name:'Salad toss',label:'Salad',kind:'salad',cooldown:.5,duration:1.4,speed:250},
  vito:{name:'Flip',label:'Flip',kind:'flip',cooldown:.65,duration:.65,range:48},
  jaime:{name:'Skate tornado',label:'Tornado',kind:'tornado',cooldown:1.1,duration:.9,range:72},
  chris:{name:'Towel Whip',label:'Whip',kind:'towel',cooldown:.5,duration:.5,range:76},
  jeff:{name:'Throw baseball',label:'Baseball',kind:'baseball',cooldown:.6,duration:1.4,speed:285},
  ari:{name:'Soccer volley',label:'Volley',kind:'soccer',cooldown:.6,duration:1.4,speed:265},
  gary:{name:'Patriot blaster',label:'Blast',kind:'blaster',cooldown:.65,duration:.8,range:260,width:11,extendSpeed:800},
  kelce:{name:'Throw football',label:'Throw',kind:'football',cooldown:.45,duration:1.4,speed:265},
  'bryce-young':{name:'Throw football',label:'Throw',kind:'football',cooldown:.45,duration:1.4,speed:265},
  // Josh (Niagara) is a non-playable extra: only his scene script casts this.
  josh:{name:'Throw football',label:'Throw',kind:'football',cooldown:.5,duration:1.4,speed:265},
  taylor:{name:'Singing shockwaves',label:'Sing',kind:'song',cooldown:.85,duration:1.25,range:125},
  drew:{name:'Singing shockwaves',label:'Sing',kind:'song',cooldown:.85,duration:1.25,range:125},
  alex:{name:'Singing shockwaves',label:'Sing',kind:'song',cooldown:.85,duration:1.25,range:125},
  manny:{name:'Boxing combo',label:'Punch',kind:'punch',cooldown:.24,duration:.32,range:54,damage:24},
  sword:{name:'Sword slash',label:'Slash',kind:'sword',cooldown:.6,duration:.45,range:55},
  grenade:{name:'Grenade toss',label:'Grenade',kind:'grenade',cooldown:.6,duration:1.45,range:80,speed:175}
 }).map(([id,power])=>[id,Object.freeze({...power,damage:power.damage??({punch:16,football:18,wave:12,song:12,kick:18,plane:16,martini:18,racket:18,turtle:20,salad:16,flip:20,tornado:16,towel:20,baseball:18,soccer:18,blaster:26,sword:24,grenade:34})[power.kind],
  sound:({punch:'strike',kick:'strike',flip:'strike',racket:'slash',sword:'slash',towel:'whip',wave:'wave',song:'wave',tornado:'swirl',blaster:'blast'})[power.kind]||'throw'})])));
 const directions={down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0},up:{x:0,y:-1}};
 const projectile=power=>!!power.speed;
 // Singing is the crying shockwave with musical notes instead of tears: same ring, same reach.
 const isWave=kind=>kind==='wave'||kind==='song';
 function create({blocked,getTarget=()=>null,getTargets=()=>{const target=getTarget();return target?[target]:[];},onHit,getActor=()=>null,getAbility=actor=>actor.id,getSwordImage=()=>null,getTowelImage=()=>null,getGrenadeImage=()=>null,onSound=()=>{}}){
  const cooldowns=Object.fromEntries(Object.keys(definitions).map(id=>[id,0])),casts=[];
  let serial=0;
  function activate(actor){
   const ability=getAbility(actor),power=definitions[ability];if(!power||cooldowns[actor.id]>0)return false;
   cooldowns[actor.id]=power.cooldown;const dir=directions[actor.direction]||directions.down;
   casts.push({serial:++serial,id:ability,owner:actor.id,kind:power.kind,x:actor.x,y:actor.y,dx:dir.x,dy:dir.y,direction:actor.direction,lift:actor.powerHeight||0,age:0,hit:false,hits:new Set(),landed:false});return true;
  }
  function hit(cast,target){if(!cast.hits.has(target)){cast.hits.add(target);cast.hit=true;onHit(cast.id,{target,owner:cast.owner,power:definitions[cast.id],x:cast.x,y:cast.y,dx:cast.dx,dy:cast.dy,serial:cast.serial});}}
  function clearLine(cast,target){
   const steps=Math.max(1,Math.ceil(Math.hypot(target.x-cast.x,target.y-cast.y)/3));
   for(let i=1;i<=steps;i++)if(blocked(cast.x+(target.x-cast.x)*i/steps,cast.y+(target.y-cast.y)*i/steps,2,2))return false;
   return true;
  }
  function update(dt){
   for(const id of Object.keys(cooldowns))cooldowns[id]=Math.max(0,cooldowns[id]-dt);
   const targets=getTargets().filter(target=>target.alive!==false&&!target.hidden),actor=getActor();
   for(const cast of casts){
    const power=definitions[cast.id],previous=cast.age;cast.age+=dt;
    if(!projectile(power)&&!isWave(cast.kind)&&actor?.id===cast.owner){cast.x=actor.x;cast.y=actor.y;}
    if(cast.kind==='grenade'){
     if(!cast.landed){
      const distance=(Math.min(.65,Math.max(.1,cast.age))-Math.min(.65,Math.max(.1,previous)))*power.speed,steps=Math.max(1,Math.ceil(distance/3));
      for(let i=0;i<steps&&distance>0;i++){
       const x=cast.x+cast.dx*distance/steps,y=cast.y+cast.dy*distance/steps;
       if(blocked(x,y,2,2)){cast.landed=true;break;}cast.x=x;cast.y=y;
      }
      if(cast.age>=.65)cast.landed=true;
     }
     if(cast.age>=.85&&!cast.exploded){
      cast.exploded=true;onSound('explode');
      for(const target of targets)if(target.alive!==false&&Math.hypot(target.x-cast.x,target.y-cast.y)<=power.range&&clearLine(cast,target))hit(cast,target);
     }
    }else if(cast.kind==='water-beam'||cast.kind==='blaster'){
     const reach=Math.min(power.range,Math.max(0,cast.age-.08)*power.extendSpeed);
     cast.length=0;
     for(let distance=2;distance<=reach;distance+=2){
      const x=cast.x+cast.dx*distance,y=cast.y+cast.dy*distance;
      if(blocked(x,y,2,2))break;
      cast.length=distance;
      for(const target of targets)if(target.alive!==false&&(target.x-cast.x)*cast.dx+(target.y-cast.y)*cast.dy>=0&&Math.hypot(x-target.x,y-target.y)<=power.width+16+((target.hitRadius||21)-21))hit(cast,target);
     }
    }else if(projectile(power)&&!cast.landed){
     const travel=Math.max(0,cast.age-.1)-Math.max(0,previous-.1),distance=travel*power.speed,steps=Math.max(1,Math.ceil(distance/3));
     for(let i=0;i<steps&&distance>0;i++){
      const x=cast.x+cast.dx*distance/steps,y=cast.y+cast.dy*distance/steps;
      if(blocked(x,y)){cast.landed=true;break;}cast.x=x;cast.y=y;
      const target=targets.find(target=>target.alive!==false&&Math.hypot(cast.x-target.x,cast.y-target.y)<(target.hitRadius||21));
      if(target){hit(cast,target);cast.landed=true;break;}
     }
     if(cast.age>=power.duration-.22)cast.landed=true;
    }else if(!projectile(power)&&cast.age>=.08&&cast.age<=power.duration){
     for(const target of targets){
      if(target.alive===false)continue;
      const dx=target.x-cast.x,dy=(target.y-cast.y)/.58,distance=Math.hypot(dx,dy);
      const range=isWave(cast.kind)?Math.min(power.range,Math.max(0,cast.age-.08)*150):power.range;
      const facing=!['punch','racket','sword','towel'].includes(cast.kind)||dx*cast.dx+dy*cast.dy>=distance*.2;
      if(distance<=range+16+((target.hitRadius||21)-21)&&facing&&clearLine(cast,target))hit(cast,target);
     }
    }
   }
   for(let i=casts.length-1;i>=0;i--)if(casts[i].age>definitions[casts[i].id].duration)casts.splice(i,1);
  }
  function activeCast(actor){return casts.slice().reverse().find(c=>c.owner===actor.id&&c.age<Math.min(.9,definitions[c.id].duration));}
  function pose(actor){
   const cast=activeCast(actor);if(!cast)return {lift:0,rotation:0};
   const phase=Math.min(1,cast.age/definitions[cast.id].duration);
   if(cast.kind==='flip')return {lift:Math.sin(phase*Math.PI)*30,rotation:phase*Math.PI*2*(cast.dx<0?-1:1),frame:1};
   if(cast.kind==='tornado'){
    const rows=['down','left','up','right'],start=Math.max(0,rows.indexOf(cast.direction));
    return {lift:Math.sin(phase*Math.PI)*5,rotation:0,direction:rows[(start+Math.floor(phase*12))%4],frame:Math.floor(phase*12)%4};
   }
   if(cast.kind==='kick'){const rows=['down','left','up','right'],start=Math.max(0,rows.indexOf(cast.direction));return {lift:Math.sin(phase*Math.PI)*3,rotation:0,direction:rows[(start+Math.floor(phase*4))%4],frame:2};}
   return {lift:0,rotation:0};
  }
  function spark(ctx,x,y,color,size=4){ctx.fillStyle=color;ctx.fillRect(x-size,y-1,size*2,2);ctx.fillRect(x-1,y-size,2,size*2);}
  function drawGround(ctx){
   for(const cast of casts){
    if(isWave(cast.kind)){
     const song=cast.kind==='song';
     ctx.save();ctx.lineWidth=2;
     for(const delay of [.08,.24,.4]){
      const t=cast.age-delay;if(t<0||t>.84)continue;const radius=Math.min(125,t*150);
      ctx.globalAlpha=Math.max(0,1-t/.84);ctx.strokeStyle=song?'#f6c1ff':'#72d6fa';ctx.beginPath();ctx.ellipse(cast.x,cast.y,radius,radius*.58,0,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle=song?'#fff0fb':'#d9f5ff';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(cast.x,cast.y,Math.max(0,radius-3),Math.max(0,radius*.58-2),0,0,Math.PI*2);ctx.stroke();ctx.lineWidth=2;
     }ctx.restore();
    }else if(cast.kind==='tornado'){
     const phase=cast.age/definitions[cast.id].duration;
     ctx.save();ctx.globalAlpha=Math.min(1,phase*6,1-phase);ctx.strokeStyle='#bce9f2';ctx.lineWidth=2;
     ctx.beginPath();ctx.ellipse(cast.x,cast.y,30+phase*35,12+phase*14,0,cast.age*18,cast.age*18+Math.PI*1.6);ctx.stroke();ctx.restore();
    }else if(cast.kind==='kick'||cast.kind==='flip'){
     const phase=cast.age/definitions[cast.id].duration;ctx.save();ctx.globalAlpha=1-phase;ctx.strokeStyle=cast.kind==='kick'?'#ffe8a8':'#9ddfff';ctx.lineWidth=2;
     ctx.beginPath();ctx.ellipse(cast.x,cast.y,20+phase*22,8+phase*12,phase*Math.PI,0,Math.PI*1.6);ctx.stroke();ctx.restore();
    }
   }
  }
  function drawActor(ctx,actor){
   const cast=activeCast(actor);if(!cast)return;
   const power=definitions[cast.id],phase=cast.age/power.duration;ctx.save();
   if(cast.kind==='tornado'){
    ctx.translate(Math.round(actor.x),Math.round(actor.y));
    ctx.globalAlpha=Math.min(1,phase*8,(1-phase)*5);ctx.lineWidth=2;
    for(let i=0;i<5;i++){
     const radius=14+i*5,angle=cast.age*20+i*1.3;
     ctx.strokeStyle=i%2?'#d5f5fb':'#8fc7db';ctx.beginPath();ctx.ellipse(0,-8-i*10,radius,4+i,0,angle,angle+Math.PI*1.6);ctx.stroke();
     spark(ctx,Math.cos(angle)*radius,-8-i*10+Math.sin(angle)*(4+i),'#eefaff',2);
    }
    ctx.fillStyle='#ace7ff';ctx.fillRect(-14,-2,10,3);ctx.fillRect(5,-2,10,3);
   }else if(cast.kind==='towel'){
    const image=getTowelImage();
    if(image){
     ctx.translate(Math.round(actor.x)+cast.dx*10,Math.round(actor.y)-24+cast.dy*6);
     ctx.rotate(Math.atan2(cast.dy,cast.dx)-.65+phase*1.3);ctx.scale(1.3,1.3);
     const frame=Math.min(7,Math.floor(phase*8));
     ctx.drawImage(image,frame*96,0,96,64,-12,-40,96,64);
    }
   }else if(cast.kind==='sword'){
    const image=getSwordImage();
    if(image){
     ctx.translate(Math.round(actor.x),Math.round(actor.y)-24);ctx.rotate(Math.atan2(cast.dy,cast.dx)+.65);
     ctx.drawImage(image,Math.min(2,Math.floor(phase*3))*64,0,64,64,-8,-32,64,64);
    }
   }else if(cast.kind==='wave'){
    const drop=Math.floor(cast.age*24)%8;for(const side of [-1,1]){const x=Math.round(actor.x)+side*6,y=Math.round(actor.y)-29+drop;ctx.fillStyle='#c9f5ff';ctx.fillRect(x,y,2,3);ctx.fillStyle='#55bde9';ctx.fillRect(x,y+3,2,3);}
   }else if(cast.kind==='song'){
    // Little eighth notes float up and out from the singer's head while the shockwave rings spread.
    for(let i=0;i<3;i++){
     const t=(cast.age*1.6+i/3)%1,side=i%2?1:-1,x=Math.round(actor.x)+side*(8+t*14),y=Math.round(actor.y)-34-t*22;
     ctx.save();ctx.globalAlpha=1-t;ctx.fillStyle=i===1?'#ffd6fb':'#f1a9ff';
     ctx.fillRect(x-2,y-1,4,3);ctx.fillRect(x+1,y-8,1,8);ctx.fillRect(x+1,y-8,3,1);ctx.restore();
    }
   }else if(cast.kind==='punch'){
    ctx.translate(Math.round(actor.x),Math.round(actor.y)-24);ctx.rotate(Math.atan2(cast.dy,cast.dx));const reach=10+Math.sin(phase*Math.PI)*18;
    ctx.fillStyle='#202e35';ctx.fillRect(4,-4,8,7);ctx.fillStyle='#e8a76d';ctx.fillRect(10,-3,reach-6,5);ctx.fillRect(reach,-5,7,8);
    if(phase>.25&&phase<.8)spark(ctx,reach+12,0,'#ffdf84',5);
   }else if(cast.kind==='kick'){
    const angle=phase*Math.PI*2,x=actor.x+Math.cos(angle)*20,y=actor.y-8+Math.sin(angle)*8;
    ctx.translate(Math.round(x),Math.round(y));ctx.rotate(angle);ctx.fillStyle='#345b89';ctx.fillRect(-15,-3,17,6);ctx.fillStyle='#f5eee0';ctx.fillRect(0,-4,9,7);spark(ctx,12,0,'#ffde89',3);
   }else if(cast.kind==='racket'){
    ctx.translate(Math.round(actor.x),Math.round(actor.y)-23);const angle=Math.atan2(cast.dy,cast.dx)-1.1+phase*2.2;ctx.rotate(angle);
    ctx.strokeStyle='#b6eeff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,38,-.8,.5);ctx.stroke();ctx.fillStyle='#e7b28a';ctx.fillRect(6,-3,8,6);ctx.fillStyle='#e7e6d4';ctx.fillRect(12,-2,15,4);
    ctx.strokeStyle='#55c7e7';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(33,0,10,7,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#edf9f9';ctx.lineWidth=1;
    for(const y of [-3,0,3]){ctx.beginPath();ctx.moveTo(26,y);ctx.lineTo(40,y);ctx.stroke();}for(const x of [29,33,37]){ctx.beginPath();ctx.moveTo(x,-5);ctx.lineTo(x,5);ctx.stroke();}
   }else if(cast.kind==='flip'){
    for(const side of [-1,1])spark(ctx,actor.x+side*16,actor.y-10-phase*20,'#a7e6fc',3);
   }else if(cast.age<.25){ctx.fillStyle='#e8a76d';ctx.fillRect(Math.round(actor.x)+cast.dx*10-2,Math.round(actor.y)-27+cast.dy*3,4,4);}
   ctx.restore();
  }
  function drawProjectile(ctx,cast){
   const rect=(color,x,y,w,h)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
   if(cast.kind==='baseball'){
    ctx.fillStyle='#f9f2dc';ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#33424b';ctx.lineWidth=1;ctx.stroke();
    ctx.strokeStyle='#d45447';ctx.beginPath();ctx.arc(-4,0,4,-1.2,1.2);ctx.stroke();ctx.beginPath();ctx.arc(4,0,4,Math.PI-1.2,Math.PI+1.2);ctx.stroke();
   }else if(cast.kind==='soccer'){
    ctx.fillStyle='#eef2ea';ctx.beginPath();ctx.arc(0,0,6,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#253447';ctx.lineWidth=1;ctx.stroke();rect('#253447',-2,-2,4,4);rect('#253447',-5,-4,2,2);rect('#253447',3,3,2,2);
   }else if(cast.kind==='football'){
    rect('#482b23',-6,-2,12,4);rect('#482b23',-4,-4,8,8);rect('#a96535',-4,-2,8,4);rect('#a96535',-2,-3,4,6);rect('#f8e8c9',-3,-1,6,1);for(const x of [-2,0,2])rect('#f8e8c9',x,-2,1,3);
   }else if(cast.kind==='plane'){
    ctx.fillStyle='#d1eafa';ctx.beginPath();ctx.moveTo(11,0);ctx.lineTo(-9,-8);ctx.lineTo(-5,0);ctx.lineTo(-9,8);ctx.closePath();ctx.fill();ctx.strokeStyle='#456c88';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='#fff8e8';ctx.beginPath();ctx.moveTo(11,0);ctx.lineTo(-8,-7);ctx.lineTo(-2,0);ctx.closePath();ctx.fill();
   }else if(cast.kind==='martini'){
    rect('#dcf0ef',-7,-7,14,2);rect('#bce4ec',-5,-5,10,3);rect('#573627',-4,-5,8,2);rect('#e2c3a0',-3,-7,6,1);rect('#e4f6f7',-2,-2,4,2);rect('#e4f6f7',-1,0,2,7);rect('#d3ecef',-5,7,10,2);for(const x of [-3,0,3])rect('#39251b',x,-6,2,1);
   }else if(cast.kind==='turtle'){
    rect('#3b6b43',-6,-6,12,12);rect('#76bb59',-5,-4,10,8);rect('#b4d57a',-2,-4,4,8);rect('#b4d57a',-5,-1,10,2);rect('#65aa51',6,-3,5,6);rect('#fdf3d4',9,-2,2,2);rect('#17383b',10,-2,1,1);const stride=Math.floor(cast.age*15)%2;for(const x of [-5,3]){rect('#74b659',x,-8+stride,3,3);rect('#74b659',x,5-stride,3,3);}
   }else if(cast.kind==='salad'){
    rect('#426b34',-8,-4,16,5);for(const [x,y] of [[-7,-5],[-3,-7],[2,-6],[5,-5]])rect('#8cd55c',x,y,4,4);rect('#e86545',-4,-4,3,3);rect('#e5c665',3,-5,3,2);rect('#d8e5df',-8,0,16,3);rect('#a6c3c5',-6,3,12,3);rect('#edf3db',-4,6,8,2);
   }
  }
  function drawAir(ctx){
   for(const cast of casts){
    const power=definitions[cast.id];
    if(cast.kind==='grenade'){
     const image=getGrenadeImage();
     if(image){
      const frame=cast.exploded?Math.min(3,Math.floor((cast.age-.85)/.15)):Math.floor(cast.age*12)%4;
      const size=cast.exploded?128:32,height=cast.landed?8:18+Math.sin(Math.min(1,cast.age/.65)*Math.PI)*24;
      ctx.drawImage(image,frame*64,cast.exploded?64:0,64,64,Math.round(cast.x)-size/2,Math.round(cast.y)-height-size/2,size,size);
     }
     continue;
    }
    if(cast.kind==='water-beam'||cast.kind==='blaster'){
     const length=cast.length||0;if(length===0)continue;
     ctx.save();ctx.globalAlpha=Math.min(1,(power.duration-cast.age)/.2);
     ctx.translate(Math.round(cast.x),Math.round(cast.y)-24-cast.lift);ctx.rotate(Math.atan2(cast.dy,cast.dx));
     ctx.fillStyle='#368cd7';ctx.fillRect(0,-power.width,length,power.width*2);
     ctx.fillStyle='#74d6f2';ctx.fillRect(0,-5,length,10);ctx.fillStyle='#d2f9ff';ctx.fillRect(0,-2,length,3);
     for(let x=10;x<length-3;x+=16){const offset=Math.sin(cast.age*24+x)*4;ctx.fillStyle='#eafcff';ctx.fillRect(x,offset,4,2);}
     spark(ctx,length-3,0,'#baf5ff',5);ctx.restore();continue;
    }
    if(!projectile(power))continue;
    const t=Math.max(0,cast.age-.1),flight=power.duration-.32,height=cast.landed?2:22+cast.lift+Math.sin(Math.min(1,t/flight)*Math.PI)*18;
    ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,(power.duration-cast.age)/.18));ctx.fillStyle='#16343944';ctx.beginPath();ctx.ellipse(Math.round(cast.x),Math.round(cast.y),5,2,0,0,Math.PI*2);ctx.fill();
    ctx.translate(Math.round(cast.x),Math.round(cast.y-height));const spin=['football','baseball','salad','martini'].includes(cast.kind)?t*8:0;ctx.rotate(Math.atan2(cast.dy,cast.dx)+spin);drawProjectile(ctx,cast);if(cast.landed)spark(ctx,0,0,'#ffe9a8',7);ctx.restore();
   }
  }
  return {activate,update,drawGround,drawActor,drawAir,pose,clear:()=>casts.splice(0),cooldown:id=>cooldowns[id]||0,
   get state(){return {cooldowns:{...cooldowns},casts:casts.map(c=>({...c}))};}};
 }
 window.FAMILY_POWERS=Object.freeze({definitions,create});
})();
