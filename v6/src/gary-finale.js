(() => {
 'use strict';
 const shot=(seconds,stage,scene,camera,text='',extra={})=>({seconds,stage,scene,camera,speaker:'gary',text,...extra});
 const waves=['flip','roof','spin','special'].map((style,wave)=>shot(7,'gary-wave','north',[767,590,1],
  ['Let me warm up.','Higher ground. Much better.','Was that supposed to hurt?','Okay. Everybody at once.'][wave],
  {wave,style,count:5,cue:'power'}));
 const shots=[
  shot(3,'gary-ready','hq',[200,350,1],"You got everyone? Good. Hold my water."),
  shot(2,'gary-exit','hq',[200,450,1],''),
  shot(4,'gary-depart','plaza',[1167,767,1],'',{cue:'door'}),
  shot(4,'gary-run','north',[767,900,1],''),
  ...waves,
  shot(3,'gary-win','north',[767,590,1],"That's twenty. Anyone else?",{cue:'join'}),
  shot(3,'gary-sit','north',[767,590,1],''),
  shot(4,'gary-drink','north',[767,590,1],"God bless the USA."),
  shot(1,'gary-return','plaza',[760,875,1],'',{returnView:true})
 ];
 const deathTimes=Array.from({length:5},(_,i)=>2.1+i*.75);
 function stage(s,t,api){
  const u=Math.min(1,t/s.seconds),reduced=api.reduced;
  if(s.stage==='gary-ready'||s.stage==='gary-talk'){
   api.human('gary',200,350,{pose:s.stage==='gary-ready'&&u<.45?'interact':'talk'});
  }else if(s.stage==='gary-exit'){
   const p=api.path([[200,350],[200,450],[200,500]],u);
   api.human('gary',p.x,p.y,{walk:true,dir:p.dir,pose:'run'});api.focus(p.x,p.y);
  }else if(s.stage==='gary-depart'){
   const p=api.path([[1167,767],[1385,767],[1385,365],[620,365],[620,310]],u);
   api.human('gary',p.x,p.y,{walk:true,dir:p.dir,pose:p.dir==='down'?'run':''});
   api.focus(p.x,p.y);
  }else if(s.stage==='gary-run'){
   const y=1428-838*api.ease(u);
   api.human('gary',767,y,{walk:true,dir:'up'});
   api.focus(767,y);
  }else if(s.stage==='gary-wave'){
   const jump=reduced?0:Math.sin(Math.min(1,t/1.8)*Math.PI);
   let x=767,y=590,lift=0,rotation=0,pose='attack';
   if(s.style==='flip'){x+=Math.sin(t*2)*45;lift=jump*85;rotation=reduced?0:t<1.8?t/1.8*Math.PI*2:0;}
   if(s.style==='roof'){
    const p=t<1.1?api.ease(t/1.1):t<3.6?1:1-api.ease((t-3.6)/1.1);
    x+=218*p;y+=135*p;lift=100*p+(reduced?0:Math.sin(p*Math.PI)*80);pose=t<1.1?'unique':'attack';
   }
   if(s.style==='spin'){rotation=reduced?0:Math.sin(t*2)*.4;pose=t<1?'hurt':t<1.8?'surprised':'special';}
   if(s.style==='special')pose=t<1?'interact':'special';
   const offsets=[[-115,20],[-70,80],[85,75],[125,5],[0,-65]];
   offsets.forEach(([dx,dy],i)=>{
    const id=s.wave*5+i,death=deathTimes[i],fade=t-death;
    const approach=api.ease(Math.min(1,t/1.5));
    const ex=s.style==='spin'&&i===0&&t<1?x+25:767+dx*(1.5-.5*approach),ey=s.style==='spin'&&i===0&&t<1?y+4:590+dy*(1.5-.5*approach);
    if(fade<0)api.dinosaur(i%2?'raptor':'trex',ex,ey,{id,dir:dx<0?'right':'left',scale:.58,walk:true});
    else if(fade<.8)api.smoke(ex,ey,fade,id);
    if(t>=death-.4&&t<death+.12)api.blast(x+(ex<x?-40:40),y-lift-32,ex,ey-30,t,id);
   });
   const poseTime=s.style==='spin'?Math.max(0,t-(t<1?0:t<1.8?1:1.8)):s.style==='special'?Math.max(0,t-(t<1?0:1)):s.style==='roof'?Math.max(0,t-(t<1.1?0:1.1)):t;
   const target=Math.max(0,deathTimes.findIndex(death=>t<death+.12)),dir=s.style==='roof'||offsets[target][0]<0?'left':'right';
   api.human('gary',x,y,{pose,lift,rotation,dir,poseTime});
  }else if(s.stage==='gary-win')api.human('gary',767,590,{pose:'win'});
  else if(s.stage==='gary-sit')api.human('gary',767,590,{pose:'sit'});
  else if(s.stage==='gary-drink')api.human('gary',767,590,{pose:'drink'});
  else if(s.stage==='gary-return'){
   for(const actor of api.context.actors)api.human(actor.id,actor.x,actor.y,{dir:actor.direction});
   api.human(api.context.player.id,api.context.player.x,api.context.player.y,{dir:api.context.player.direction});
  }
 }
 window.V5_GARY_FINALE={shots,deathTimes,stage,total:20};
})();
