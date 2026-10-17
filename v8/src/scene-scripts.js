// Scene scripts: small, data-like choreographies that run inside real-time exploration (not cutscenes).
// A script owns a few scene actors (heroes or EXTRAS), can reveal the scene's `scripted:true` dinosaurs, point them
// at an actor instead of the player, and recruit heroes once the field is clear. The game stays fully playable the
// whole time; scripts never pause movement, change collision or touch story gates.
//
// Host contract (game.js): {player, enemies(), blocked(x,y), recruit(id), say(title,text), toast(text), sound(kind),
//  pose(actor,pose,{flip}), throwPower(actor), hitEnemy(enemy,source), joined(id)}.
(()=>{
 'use strict';
 const DIRS={right:[1,0],left:[-1,0],down:[0,1],up:[0,-1]};
 const facing=(dx,dy)=>Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const actor=(id,x,y,extra={})=>({id,x,y,direction:'down',frame:1,moving:false,clock:0,pose:null,poseTime:0,scripted:true,...extra});

 // Walk `a` toward (tx,ty) at `speed`; returns true when arrived. Slides along walls like the player does.
 function walkTo(a,tx,ty,speed,dt,blocked){
  const dx=tx-a.x,dy=ty-a.y,d=Math.hypot(dx,dy);
  if(d<4){a.moving=false;return true;}
  const step=Math.min(d,speed*dt),mx=dx/d*step,my=dy/d*step;
  if(!blocked(a.x+mx,a.y))a.x+=mx;if(!blocked(a.x,a.y+my))a.y+=my;
  a.direction=facing(dx,dy);a.moving=true;a.clock+=dt*9;a.frame=Math.floor(a.clock)%4;
  return false;
 }
 // Follow a closed loop of waypoints forever.
 function patrol(a,route,speed,dt,blocked){
  a.leg=a.leg||0;
  if(walkTo(a,route[a.leg][0],route[a.leg][1],speed,dt,blocked))a.leg=(a.leg+1)%route.length;
 }
 function setPose(a,pose){if(a.pose!==pose){a.pose=pose;a.poseTime=0;}a.moving=false;}

 // ---- Las Vegas · Encore pool party: Drew and Alex -----------------------------------------------------------------
 function vegasNorth(host){
  const drew=actor('drew',745,300,{direction:'down'}),alex=actor('alex',835,300,{direction:'down'});
  const fleeDrew=[[560,290],[300,280],[180,500],[200,760],[420,840]],fleeAlex=[[1020,280],[1280,290],[1380,520],[1340,760],[1100,840]];
  let phase='idle',clock=0,prey={};
  const scripted=()=>host.enemies().filter(e=>e.scripted);
  function reveal(){for(const e of scripted()){e.hidden=false;e.flash=.4;}host.sound('roar');}
  function hunt(){const list=scripted().filter(e=>e.alive);list.forEach((e,i)=>{e.prey=i%2?alex:drew;e.mode='chase';e.timer=99;});}
  function release(){for(const e of scripted()){e.prey=null;if(e.alive){e.mode='wander';e.timer=6;}}}
  return {
   actors(){return phase==='done'?[]:[drew,alex];},
   update(dt){
    clock+=dt;for(const a of [drew,alex])a.poseTime+=dt;
    if(phase==='idle'){
     if(Math.min(dist(host.player,drew),dist(host.player,alex))<150){phase='shock';clock=0;setPose(drew,'surprised');setPose(alex,'surprised');reveal();host.toast('Dinosaurs crash the pool party!');}
    }else if(phase==='shock'){
     if(clock>1.6){phase='flee';clock=0;drew.pose=alex.pose=null;drew.leg=alex.leg=0;hunt();}
    }else if(phase==='flee'){
     const doneA=drew.leg>=fleeDrew.length||walkTo(drew,...fleeDrew[Math.min(drew.leg,fleeDrew.length-1)],165,dt,host.blocked)&&++drew.leg>=fleeDrew.length;
     const doneB=alex.leg>=fleeAlex.length||walkTo(alex,...fleeAlex[Math.min(alex.leg,fleeAlex.length-1)],165,dt,host.blocked)&&++alex.leg>=fleeAlex.length;
     if((doneA&&doneB)||clock>9){phase='down';clock=0;setPose(drew,'hurt');setPose(alex,'hurt');release();host.toast('Drew and Alex are down! Clear out the dinosaurs.');}
    }else if(phase==='down'){
     if(scripted().every(e=>!e.alive)){
      phase='thanks';clock=0;drew.pose=alex.pose=null;drew.direction=alex.direction='down';
      host.say('Drew & Alex',"Whew… thank you! We thought we were dinosaur chow. Come by Tower Suite 3001 later — we're throwing the after-party, and you're the guest of honor.",'ENCORE POOL');
      host.recruit('drew');host.recruit('alex');
     }
    }else if(phase==='thanks'){
     if(clock>2.5)phase='done';
    }
    void prey;
   },
   get state(){return {phase,clock:Math.round(clock*10)/10};}
  };
 }

 // ---- Charlotte · Panthers Stadium: Kelce and Taylor ----------------------------------------------------------------
 function panthersStadium(host){
  const kelce=actor('kelce',330,940),taylor=actor('taylor',1120,940);
  const loopK=[[330,560],[560,560],[560,940],[330,940]],loopT=[[1120,560],[900,560],[900,940],[1120,940]];
  let phase='chase',clock=0;
  const scripted=()=>host.enemies().filter(e=>e.scripted);
  let armed=false;
  return {
   actors(){return phase==='done'?[]:[kelce,taylor];},
   update(dt){
    clock+=dt;for(const a of [kelce,taylor])a.poseTime+=dt;
    if(phase==='chase'){
     if(!armed){armed=true;scripted().forEach((e,i)=>{e.hidden=false;e.prey=i<2?kelce:taylor;e.mode='chase';e.timer=99;});}
     patrol(kelce,loopK,150,dt,host.blocked);patrol(taylor,loopT,150,dt,host.blocked);
     for(const e of scripted())if(e.alive&&e.prey){e.mode='chase';e.timer=99;}
     if(scripted().every(e=>!e.alive)){
      // Celebrate with the win animation for a few seconds, then thank the player and join the party.
      phase='celebrate';clock=0;for(const a of [kelce,taylor]){a.moving=false;a.direction='down';setPose(a,'win');}
     }
    }else if(phase==='celebrate'){
     if(clock>3.6){
      phase='thanks';clock=0;for(const a of [kelce,taylor]){a.pose=null;a.direction='down';}
      host.say('Kelce & Taylor',"Thank you! Those raptors were relentless. Kelce can throw a football through a brick wall, and Taylor's voice knocks dinosaurs flat — we're with you.",'PANTHERS STADIUM');
      host.recruit('kelce');host.recruit('taylor');
     }
    }else if(phase==='thanks'){if(clock>2.5)phase='done';}
   },
   get state(){return {phase};}
  };
 }

 // ---- Charlotte · Panthers Field: the ultimate battle -----------------------------------------------------------------
 // Wave 1: Bryce, seven Panthers and three Chiefs fight 20 compies, two T. rexes, a Triceratops, an Ankylosaurus, raptors and
 // a Dilophosaurus while the player roams free. Players lie hurt around the turf as set dressing and two fighters eventually
 // fall.
 // Wave 2: the Spinosaurus boss (a hidden, scripted enemy of the scene) crashes in as soon as the field is clear. It hunts the
 // football players too: most who tackle it, and everyone near its stomps, are flattened into the hurt pose (two always keep
 // fighting; Bryce can never fall). Bryce does his win animation when it falls, then joins the party.
 function panthersField(host){
  const bryce=actor('bryce-young',724,730,{direction:'up'});
  const squad=[
   ['panthersplayer',420,520],['panthersplayer',1030,520],['panthersplayer',480,690],['panthersplayer',980,690],
   ['panthersplayer',340,610],['panthersplayer',1110,610],['panthersplayer',724,500],
   ['chiefsplayer',590,560],['chiefsplayer',860,560],['chiefsplayer',724,640]
  ];
  const fall=new Set([4,8]); // one Panther and one Chief eventually go down; everyone else keeps charging
  const fighters=squad.map(([id,x,y],i)=>actor(id,x,y,{home:{x,y},state:'wait',timer:i*.45,tackles:0,limit:fall.has(i)?4:Infinity}));
  const down=[['panthersplayer',300,690],['panthersplayer',1170,520],['panthersplayer',640,760],
   ['chiefsplayer',390,470],['chiefsplayer',560,740],['chiefsplayer',900,470],['chiefsplayer',1090,740],['chiefsplayer',790,660]]
   .map(([id,x,y])=>actor(id,x,y,{pose:'hurt'}));
  const props=[{x:380,y:620},{x:1100,y:660}]; // hurt-panther props on the turf
  let phase='battle',clock=0,throwTimer=0,huntTimer=0,huntUntil=0;
  const living=()=>host.enemies().filter(e=>e.alive&&!e.hidden);
  const boss=()=>host.enemies().find(e=>e.boss);
  const nearest=(list,from)=>list.reduce((best,e)=>!best||dist(e,from)<dist(best,from)?e:best,null);
  const standing=()=>fighters.filter(f=>f.state!=='down');
  // Bryce is not in `fighters`: he can never be knocked out.
  const flatten=f=>{f.state='down';f.flatten=false;f.lift=0;f.moving=false;setPose(f,'hurt');host.sound('impact');};
  return {
   actors(){return phase==='done'?down.concat(fighters):[bryce].concat(fighters,down);},
   props(){return props;},
   update(dt){
    clock+=dt;throwTimer-=dt;
    for(const a of [bryce,...fighters,...down])a.poseTime+=dt;
    const enemies=living(),fighting=phase==='battle'||phase==='boss';
    // Bryce throws at the nearest dinosaur that is roughly on one of his four throwing lines.
    if(fighting&&enemies.length&&throwTimer<=0){
     const target=nearest(enemies,bryce),dx=target.x-bryce.x,dy=target.y-bryce.y,reach=(target.hitRadius||21)+13;
     bryce.direction=facing(dx,dy);
     if((Math.abs(dx)<reach||Math.abs(dy)<reach)&&host.throwPower(bryce)){throwTimer=.9;}else throwTimer=.25;
    }
    // Panthers and Chiefs float at the nearest dinosaur, bounce off on contact (FF6-style charge), then return to their spot.
    for(const f of fighters){
     if(f.state==='down')continue;
     f.timer-=dt;
     if(f.state==='wait'){f.moving=false;if(f.timer<=0&&enemies.length){f.target=nearest(enemies,f);f.state='charge';}}
     else if(f.state==='charge'){
      if(!f.target||!f.target.alive){f.state='return';continue;}
      const dx=f.target.x-f.x,dy=f.target.y-f.y,d=Math.hypot(dx,dy),step=320*dt,reach=18+(f.target.hitRadius||21)*.6;
      f.direction=facing(dx,dy);f.moving=true;f.clock+=dt*14;f.frame=Math.floor(f.clock)%4;f.lift=Math.sin(Math.min(1,d/140)*Math.PI)*10;
      if(d<=reach){
       host.hitEnemy(f.target,{x:f.x,y:f.y,dx:dx/d,dy:dy/d},f.target.boss?5:9);f.vx=-dx/d*260;f.vy=-dy/d*260;f.state='bounce';f.timer=.35;f.tackles++;
       // The boss retaliates hard against anyone who tackles it: most of them are knocked out after the bounce (never fewer than two left standing).
       if(f.target.boss&&standing().length>2&&Math.random()<.6){f.flatten=true;host.sound('impact');}
      }
      else{f.x+=dx/d*step;f.y+=dy/d*step;}
     }else if(f.state==='bounce'){
      f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=Math.exp(-6*dt);f.vy*=Math.exp(-6*dt);f.lift=Math.max(0,(f.lift||0)-dt*40);
      if(f.timer<=0){if(f.tackles>=f.limit||f.flatten)flatten(f);else f.state='return';}
     }else if(f.state==='return'){
      f.lift=0;if(walkTo(f,f.home.x,f.home.y,180,dt,()=>false)){f.state='wait';f.timer=(phase==='boss'?.3:.6)+Math.random()*(phase==='boss'?.7:1.2);}
     }
    }
    const spino=boss();
    if(phase==='battle'&&!enemies.length){
     if(spino&&spino.alive){
      phase='boss';clock=0;huntTimer=2.5;huntUntil=0;spino.hidden=false;spino.flash=.5;spino.mode='chase';spino.timer=99;
      host.sound('roar');host.toast('A Spinosaurus crashes onto the field!');
     }else phase='victory';
    }
    if(phase==='boss'&&spino){
     // The boss never loses interest: whenever it finishes an attack it turns back to chase.
     if(spino.alive&&spino.mode!=='chase'&&spino.windup<=0&&spino.stunned<=0){spino.mode='chase';spino.timer=6;}
     // Every few seconds it turns on the football players: it runs one down and stomps everyone around it.
     huntTimer-=dt;
     if(!spino.prey&&huntTimer<=0&&standing().length>2){
      const victim=nearest(standing(),spino);if(victim){spino.prey=victim;huntUntil=clock+2.4;}
     }
     if(spino.prey){
      const v=spino.prey;
      if(v.state==='down'||dist(spino,v)<100||clock>huntUntil){
       if(dist(spino,v)<125)for(const f of standing().sort((a,b)=>dist(a,spino)-dist(b,spino)))if(dist(f,spino)<125&&standing().length>2)flatten(f);
       spino.prey=null;spino.attackPose=.3;huntTimer=3.2+Math.random()*2;host.sound('roar');
      }
     }
     if(!spino.alive){spino.prey=null;phase='victory';}
    }
    if(phase==='victory'){
     // Bryce celebrates with his win animation before thanking the player.
     phase='celebrate';clock=0;bryce.direction='down';setPose(bryce,'win');
    }else if(phase==='celebrate'){
     if(clock>3.6){
      phase='thanks';clock=0;bryce.pose=null;bryce.direction='down';
      host.say('Bryce Young',"Field's clear — that was a goal-line stand for the ages. You've got an arm; let's team up. I'll bring the footballs.",'PANTHERS FIELD');
      host.recruit('bryce-young');
     }
    }else if(phase==='thanks'&&clock>2.5)phase='done';
   },
   get state(){const b=boss();return {phase,fighters:fighters.map(f=>f.state),boss:b?{alive:b.alive,hidden:b.hidden,hp:b.hp,maxHP:b.maxHP}:null};}
  };
 }

 // ---- The Philippines · Manny vs. the Pachycephalosaurus ----------------------------------------------------------------
 // A staged duel beside the plaza fountain; the player can roam but cannot interfere (the dinosaur is `duel`: ignored by
 // the player's powers and by enemy attacks). Manny trades punches, is headbutted to the ground three times, then lands
 // a finishing flurry, strikes his win pose and joins the party. `hpFloor` pins the dinosaur until the finale.
 function philippines(host){
  const manny=actor('manny',500,710,{direction:'right'}),baseX=500,rounds=3;
  let phase='idle',step='charge',clock=0,round=0,punches=0,backed=false,lunged=false,fallX=0,set=false;
  const pachy=()=>host.enemies().find(e=>e.duel);
  const gap=()=>manny.x+78;
  // Slide a dinosaur sideways toward tx, animating its legs; true once it has arrived.
  function approach(e,tx,speed,dt){
   const d=tx-e.x;
   if(Math.abs(d)<3){e.moving=false;return true;}
   e.x+=Math.sign(d)*Math.min(Math.abs(d),speed*dt);e.direction=d<0?'left':'right';e.facing=d<0?-1:1;e.moving=true;e.clock+=dt*13;
   return false;
  }
  function jab(p,damage){
   manny.pose='punch-right';manny.poseTime=0;manny.direction='right';manny.moving=false;
   host.hitEnemy(p,{x:manny.x,y:manny.y,dx:1,dy:0},damage);host.sound('strike');
  }
  const go=(next)=>{step=next;clock=0;punches=0;backed=false;lunged=false;};
  return {
   actors(){return phase==='done'?[]:[manny];},
   update(dt){
    const p=pachy();if(!p)return;
    if(!set){
     set=true;p.hpFloor=60;p.direction='left';p.facing=-1;
     if(host.joined('manny')){p.alive=false;p.hidden=true;phase='done';}
    }
    clock+=dt;manny.poseTime+=dt;
    if(manny.pose&&manny.pose.startsWith('punch')&&manny.poseTime>.35)manny.pose=null;
    if(phase==='idle'){
     if(clock>.5&&dist(host.player,manny)<340){phase='fight';go('charge');host.sound('roar');host.toast('Manny squares off with a Pachycephalosaurus!');}
    }else if(phase==='fight'){
     if(step==='charge'){
      if(approach(p,gap(),240,dt)&&clock>.4)go(round<rounds?'trade':'flurry');
     }else if(step==='trade'){
      if(!p.alive)return;
      approach(p,gap(),200,dt);
      if(punches===0&&clock>.25){jab(p,33);punches=1;}
      else if(punches===1&&clock>.8){jab(p,33);punches=2;}
      else if(punches===2&&clock>1.3)go('butt');
     }else if(step==='butt'){
      // The dinosaur rears back, then lunges and knocks Manny flat.
      if(!lunged){
       if(approach(p,gap()+90,220,dt)){backed=true;}
       if(backed&&clock>1)lunged=true;
      }else if(approach(p,manny.x+34,560,dt)){
       go('down');fallX=manny.x;setPose(manny,'hurt');host.sound('impact');
      }
     }else if(step==='down'){
      const to=fallX-70;if(!host.blocked(to,manny.y))manny.x+=(to-manny.x)*Math.min(1,dt*9);
      approach(p,manny.x+170,150,dt);
      if(clock>2.2){round++;manny.pose=null;go('rise');}
     }else if(step==='rise'){
      approach(p,baseX+170,150,dt);
      if(walkTo(manny,baseX,710,120,dt,host.blocked)){manny.direction='right';manny.moving=false;go('charge');}
     }else if(step==='flurry'){
      // The final combination: three jabs and a haymaker that drops it.
      p.hpFloor=0;approach(p,gap(),200,dt);
      const times=[.3,.65,1,1.6],damage=[18,18,18,200];
      if(punches<4&&clock>times[punches]){jab(p,damage[punches]);punches++;}
      if(!p.alive){phase='celebrate';clock=0;manny.direction='down';setPose(manny,'win');}
     }
    }else if(phase==='celebrate'){
     if(clock>3.6){
      phase='thanks';clock=0;manny.pose=null;manny.direction='down';
      host.say('Manny',"Whoa — that thing hit like a truck! Thanks for hanging around. Got a few more rounds in me if you need a sparring partner.",'THE PHILIPPINES');
      host.recruit('manny');
     }
    }else if(phase==='thanks'&&clock>2.5)phase='done';
   },
   get state(){const p=pachy();return {phase,step,round,boss:p?{alive:p.alive,hp:p.hp,maxHP:p.maxHP}:null};}
  };
 }

 const scripts={'vegas-north':vegasNorth,'panthers-stadium':panthersStadium,'panthers-field':panthersField,philippines};
 function create(host){
  const running={};
  return {
   enter(sceneId){if(scripts[sceneId]&&!running[sceneId])running[sceneId]=scripts[sceneId](host);},
   update(sceneId,dt){running[sceneId]?.update(dt);},
   actors(sceneId){return running[sceneId]?.actors()||[];},
   props(sceneId){return running[sceneId]?.props?.()||[];},
   state(sceneId){return running[sceneId]?.state||null;},
   has:sceneId=>!!scripts[sceneId]
  };
 }
 window.V8_SCENE_SCRIPTS={create,scenes:Object.keys(scripts)};
})();
