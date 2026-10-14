(() => {
 'use strict';
 const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d',{alpha:false});
 let town=window.SCENES.cocoRoom; const characters=window.CHARACTERS,ids=Object.keys(characters);
 const sceneImages={},sceneOverlays={},scenes=window.SCENES; let changing=false;
 const travel=window.V7_TRAVEL;
 const mapOpen=()=>$('world-map').open;
 const airborne=()=>town.id==='world'&&travel.model().flying;
 const keys=new Set(),sheets={},portraits={},buttons={},camera={x:0,y:0};
 const player={x:310,y:350,id:'coco',direction:'down',frame:1,moving:false,running:false,clock:0};
 let joining=null,pendingRecruit=null,viewScale=1,storyReturn=null;
 const storyBusy=()=>window.V5_EVENTS.active||window.V5_CINEMA.active;
 const arrivalPortals=new Set();
 const recreation=window.V4_RECREATION.create(),extraSheets={},flashSheets={};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const combat=V6_COMBAT.create({blocked,onSound:kind=>V4_SFX.play(kind),showNumbers:V6_SETTINGS.values.damageNumbers,reduced:()=>reduced.matches});
 const playerCombat=V6_PLAYER_COMBAT.create({getActor:()=>player,getMember:id=>V4_RPG.members[id],move,reduced:()=>reduced.matches,
  onHit:hit=>{resetInput();V4_SFX.play('player-hurt');toast(characters[hit.id].name+' took damage! Check HP in Menu.');},
  onFaint:()=>{resetInput();powers.clear();attacks.clear(encounterEnemies());combat.clearEffects();$('nearby').hidden=true;V4_SFX.play('faint');paintPower();},
  onRecover:recoverPlayer});
 const attacks=V6_ENEMY_ATTACKS.create({getActor:()=>player,blocked,onHit:(amount,source)=>playerCombat.damage(amount,source),onSound:kind=>V4_SFX.play(kind),isActive:()=>!playerCombat.locked});
 const gimmicks=V6_GIMMICKS.create({notify:toast,enabled:()=>V6_SETTINGS.values.busGag});
 function paintPreferences(){
  for(const [id,name,label] of [['damage-numbers','damageNumbers','Damage numbers'],['bus-gag','busGag','Bus gag']]){
   const button=$(id),value=V6_SETTINGS.values[name];
   button.textContent=label+': '+(value?'On':'Off');button.setAttribute('aria-pressed',String(value));
   button.onclick=()=>{
    const next=!V6_SETTINGS.values[name],stored=V6_SETTINGS.set(name,next);
    if(name==='damageNumbers')combat.setNumbers(next);
    paintPreferences();toast(label+(next?' enabled.':' disabled.')+(stored?'':' Preference is session-only because browser storage is unavailable.'));
   };
  }
 }
 paintPreferences();
 let loaded=false,previous=0,toastTimer=0,nearest=null,joyId=null,runId=null,joy={x:0,y:0},touchRun=false,background;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function updateCamera(){
  const bounds=town.viewBounds||{left:0,top:0,right:town.width,bottom:town.height};
  const worldWidth=bounds.right-bounds.left,worldHeight=bounds.bottom-bounds.top;
  const overview=flight.view().overview,fit=Math.min(canvas.width/worldWidth,canvas.height/worldHeight,.8);
  viewScale=1+(fit-1)*overview;
  const width=canvas.width/viewScale,height=canvas.height/viewScale;
  const touchSpace=document.body.classList.contains('touch')?Math.min(140,canvas.height*.28)/viewScale:0;
  camera.x=Math.round(width>=worldWidth?bounds.left+(worldWidth-width)/2:clamp(player.x-width/2,bounds.left,bounds.right-width));
  camera.y=Math.round(height>=worldHeight+touchSpace?bounds.top+(worldHeight+touchSpace-height)/2:clamp(player.y-height*.57,bounds.top,bounds.bottom+touchSpace-height));
  if(storyReturn){
   const p=clamp((performance.now()-storyReturn.at)/700,0,1),e=p*p*(3-2*p),from=storyReturn.camera;
   camera.x=from.x+(camera.x-from.x)*e;camera.y=from.y+(camera.y-from.y)*e;viewScale=from.scale+(viewScale-from.scale)*e;
   if(p===1)storyReturn=null;
  }
 }
 function resize(){
  const r=canvas.getBoundingClientRect(),scale=r.width<600?1.35:r.height<350?1.5:1.8;
  canvas.width=Math.max(200,Math.round(r.width/scale));canvas.height=Math.max(140,Math.round(r.height/scale));
  ctx.imageSmoothingEnabled=false;updateCamera();
 }
 const touch=()=>document.body.classList.add('touch');
 if(navigator.maxTouchPoints>0||matchMedia('(pointer:coarse)').matches)touch();
 window.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')touch();},{passive:true});
 function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2400);}
 function resetInput(){keys.clear();joy={x:0,y:0};joyId=null;runId=null;touchRun=false;$('stick').style.transform='';$('run').classList.remove('active');player.moving=false;player.running=false;player.clock=0;player.frame=1;}
 async function recoverPlayer(id){
  $('recovery').hidden=false;$('recovery-message').textContent='Getting you safely to Five Guys…';$('recovery-retry').hidden=true;
  const arrived=await enterScene('hq',[200/724*1000,450/543*1000],'up',true);
  if(!arrived){
   playerCombat.failed();$('recovery-message').textContent='Five Guys could not load. Your party and items are safe. Retry when ready.';$('recovery-retry').hidden=false;$('recovery-retry').focus();return;
  }
  playerCombat.recovered();$('recovery').hidden=true;V4_SFX.play('recover');
  showDialog(id==='gary'?'Gary is back on his feet!':'Gary patched you up!',
   id==='gary'?'Gary: "Good thing I keep an emergency first-aid kit here. Back on my feet!"':'Gary: "I found you unconscious and brought you back to Five Guys. I patched you up. Take a breath, grab a hamburger if you need one, and get back out there!"','FIVE GUYS · RECOVERY');
 }
 $('recovery-retry').addEventListener('click',()=>playerCombat.retry());
 document.addEventListener('v3-intro-start',resetInput);document.addEventListener('v3-intro-end',()=>{
  resetInput();
  V5_EVENTS.start();
 });
 document.addEventListener('v4-menu-open',resetInput);document.addEventListener('v4-menu-close',resetInput);
 document.addEventListener('v4-display-change',resetInput);
 document.addEventListener('v4-display-message',event=>toast(event.detail));
 window.addEventListener('blur',resetInput);document.addEventListener('visibilitychange',()=>{if(document.hidden)resetInput();previous=0;});
 function refreshParty(){for(const id of ids){buttons[id].hidden=!V4_RPG.members[id].joined;buttons[id].setAttribute('aria-pressed',String(player.id===id));}const objective=town.id==='world'?(airborne()?'Jet · Up forward · Left/right turn · Run boosts':'Earth · Board the jet to fly · Map / Q for destinations'):town.id==='nyc'?'New York · Explore the first blocks · Southern road returns to Earth':V4_STORY.objective();if($('objective').textContent!==objective)$('objective').textContent=objective;}
 function select(id){
  if(!characters[id])throw new Error('Unknown character: '+id);
  if(!V4_RPG.members[id].joined){toast('Find '+characters[id].name+' to add them to your party.');return false;}
  if(playerCombat.locked||storyBusy()||mapOpen()||window.V3_INTRO?.active||joining||pendingRecruit||flight.state.active){toast('Finish this moment before switching characters.');return false;}
  player.id=id;player.frame=1;player.clock=0;refreshParty();buttons[id].scrollIntoView({block:'nearest',inline:'nearest'});paintPower();$('status').textContent=characters[id].name+' · Ready for a walk';V4_SFX.play('select');canvas.focus({preventScroll:true});return true;
 }
 ids.forEach((id,i)=>{
  const button=document.createElement('button');button.className='character-button';button.dataset.character=id;
  button.hidden=!V4_RPG.members[id].joined;button.setAttribute('aria-label','Play as '+characters[id].name);button.setAttribute('aria-pressed',String(player.id===id));
  const portrait=document.createElement('canvas');portrait.width=48;portrait.height=56;portrait.setAttribute('aria-hidden','true');
  const name=document.createElement('span');name.textContent=characters[id].name;
  const shortcut=document.createElement('small');shortcut.textContent=i<10?(i+1)%10:'';
  button.append(portrait,name,shortcut);button.addEventListener('click',()=>select(id));$('party').append(button);portraits[id]=portrait;buttons[id]=button;
 });
 function blocked(x,y,rx=8,ry=4){if(town.id==='world')return travel.model().blocked(x,y,rx,ry);const b=town.bounds;if(x-rx<b.left||x+rx>b.right||y-ry<b.top||y+ry>b.bottom)return true;if(town.walkable){for(const [px,py] of [[x-rx,y-ry],[x+rx,y-ry],[x-rx,y+ry],[x+rx,y+ry]])if(!town.walkable.some(o=>px>=o.x&&px<=o.x+o.w&&py>=o.y&&py<=o.y+o.h)&&!(town.walkableEllipses||[]).some(o=>((px-o.x)/o.rx)**2+((py-o.y)/o.ry)**2<=1))return true;}if((town.blockedEllipses||[]).some(o=>((x-o.x)/(o.rx+rx))**2+((y-o.y)/(o.ry+ry))**2<1))return true;return town.obstacles.some(o=>x+rx>o.x&&x-rx<o.x+o.w&&y+ry>o.y&&y-ry<o.y+o.h);}
 let unicorn=window.FAMILY_UNICORN.create({blocked});
 const companions=window.V4_COMPANIONS.create({blocked,getEnemies:()=>activeEnemies(),clearLine:attacks.clearLine,onBite:(dog,target)=>{
  const dx=target.x-dog.x,dy=target.y-dog.y,d=Math.hypot(dx,dy)||1;
  combat.hit(target,{power:{kind:'bite',damage:6},x:dog.x,y:dog.y,dx:dx/d,dy:dy/d,owner:dog.id});V4_SFX.play('dog-bite');
 }});
 companions.enter(player);
 const flight=window.V4_FLIGHT.create({onGrab:()=>{resetInput();V4_SFX.play('screech');toast('A pterodactyl lift! Enjoy the view; you will land safely.');},onDrop:()=>{resetInput();V4_SFX.play('land');toast('A soft landing! You are fine.');}});
 flight.enter(town.id,player);
 new ResizeObserver(resize).observe($('stage'));
 function move(dx,dy){
  // Small steps prevent tunneling through scenery at run speed or on slow devices.
  const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/3));
  const rx=unicorn.riding?14:8,ry=unicorn.riding?7:4;
  for(let i=0;i<steps;i++){if(!blocked(player.x+dx/steps,player.y,rx,ry))player.x+=dx/steps;if(!blocked(player.x,player.y+dy/steps,rx,ry))player.y+=dy/steps;if(town.id==='world')player.x=travel.wrap(player.x,travel.width);}
 }

 const dinoHomes={north:{x:923,y:408},plaza:{x:910,y:370},district:{x:1850,y:1050},neighborhood:{x:305,y:800},recreation:{x:680,y:460}};
 const dinoKinds={north:'raptor',plaza:'trex',district:'raptor',neighborhood:'triceratops',recreation:'trex'};
 const dinosaurs=Object.fromEntries(Object.entries(dinoHomes).filter(([id])=>!scenes[id].indoor).map(([id,h])=>[id,V6_COMBAT.init({...h,kind:dinoKinds[id],direction:'down',facing:1,clock:0,stars:0,mode:'wander',timer:7,target:null,turnTimer:0,moving:false,stunned:0})]));
 const extraHomes={
  north:[['compy',767,820],['compy',770,960],['compy',767,650],['compy',767,1130],['compy',768,1270],['dilophosaurus',767,540],['ankylosaurus',767,1350]],
  plaza:[['compy',810,370],['compy',300,370],['compy',650,370],['compy',1200,370],['dilophosaurus',1400,620],['ankylosaurus',950,795]],
  district:[['compy',1700,750],['pterodactyl',2400,760],['compy',1700,370],['compy',2050,750],['compy',2200,1050],['dilophosaurus',2100,750],['ankylosaurus',2000,1050]],
  neighborhood:[['compy',330,800],['compy',500,800],['compy',900,800],['compy',1090,1100],['dilophosaurus',950,800],['ankylosaurus',150,1050]],
  recreation:[['compy',1000,180],['compy',100,550],['compy',1125,800],['compy',750,685],['dilophosaurus',100,900],['ankylosaurus',1125,450]]
 },extraEnemies={};
 function prepareEnemies(id){
  if(extraEnemies[id]||!extraHomes[id])return;
  extraEnemies[id]=extraHomes[id].map(([kind,x,y])=>{
   let home=null;
   for(const radius of [0,24,48,96,160]){
    for(let i=0;i<16;i++){
     const px=x+Math.cos(i*Math.PI/8)*radius,py=y+Math.sin(i*Math.PI/8)*radius;
     if(!blocked(px,py)){home={x:px,y:py};break;}
    }if(home)break;
   }
   if(!home)throw new Error('No safe '+kind+' spawn in '+id);
   return V6_COMBAT.init({...home,home,kind,direction:'right',facing:1,clock:0,stars:0,mode:'wander',timer:8,target:null,turnTimer:0,moving:false});
  });
 }
 function encounterEnemies(){return (dino?[dino]:[]).concat(extraEnemies[town.id]||[]);}
 function activeEnemies(){return encounterEnemies().filter(enemy=>!enemy.hidden);}
 let dinoHome=null,dino=null;
 let powers; function makePowers(){return window.FAMILY_POWERS.create({blocked,getTargets:()=>activeEnemies().filter(enemy=>enemy.alive),getActor:()=>player,getAbility:actor=>window.V4_RPG.members[actor.id].ability,getSwordImage:()=>extraSheets.sword,getTowelImage:()=>extraSheets.towel,getGrenadeImage:()=>extraSheets.grenade,onSound:kind=>V4_SFX.play(kind),onHit:(id,hit)=>{
  const alive=hit.target.alive;
  combat.hit(hit.target,{...hit,strength:V4_RPG.stats(hit.owner).strength});
  if(alive&&!hit.target.alive)toast(hit.target.mode==='retreat'?'That dinosaur has had enough! Watch it retreat.':'Poof! A little dinosaur defeated.');
 }});} powers=makePowers();
 const powerButton=$('power'),powerLabel=$('power-label'),powerHint=$('power-hint');
 function paintPower(){
  const power=window.FAMILY_POWERS.definitions[window.V4_RPG.members[player.id].ability];powerButton.hidden=!power||town.id==='world';
  if(!power)return;
  const remaining=powers.cooldown(player.id),ready=remaining===0;
  powerButton.disabled=!loaded||!ready||playerCombat.locked||playerCombat.staggered||airborne()||mapOpen()||storyBusy()||$('dialog').open||window.V4_MENU.active||!!joining||flight.state.active;
  powerLabel.textContent=power.label;powerHint.textContent=ready?'X · Ready':remaining.toFixed(1)+'s';
  powerButton.setAttribute('aria-label',characters[player.id].name+': '+power.name+(ready?'. Ready.':'. Recharging.'));
 }
 function activatePower(){
  if(!loaded||changing||document.hidden||town.id==='world'||mapOpen()||playerCombat.locked||playerCombat.staggered||storyBusy()||joining||flight.state.active||window.V3_INTRO?.active||$('dialog').open||window.V4_MENU.active)return false;
  if(window.V4_RPG.members[player.id].ability==='sword'&&window.V4_RPG.members[player.id].equipment.weapon!=='sword'){
   toast('Equip the Japanese sword to use Sword slash.');return false;
  }
  const used=powers.activate({...player,powerHeight:unicorn.riding?20:0});
  if(used){const scared=flight.scare(player);V4_SFX.play(window.FAMILY_POWERS.definitions[window.V4_RPG.members[player.id].ability].sound);toast(scared?'The pterodactyl got scared and flew away!':window.FAMILY_POWERS.definitions[window.V4_RPG.members[player.id].ability].name+'!');paintPower();}
  return used;
 }
 powerButton.addEventListener('pointerdown',e=>{e.preventDefault();activatePower();canvas.focus({preventScroll:true});});
 powerButton.addEventListener('click',e=>{if(e.detail===0)activatePower();});
 function dinoRest(message,enemy=dino){
  enemy.mode='wander';enemy.timer=14+Math.random()*12;enemy.target=null;
  if(message)toast(message);
 }
 function updateDino(dt,enemy,home){
  const dino=enemy,dinoHome=home;
  if(!dino.alive)return;
  dino.stars+=dt;
  if(dino.stunned>0){dino.stunned=Math.max(0,dino.stunned-dt);dino.moving=false;return;}
  if(dino.windup>0){dino.moving=false;return;}
  dino.timer-=dt;dino.turnTimer-=dt;
  const distance=Math.hypot(player.x-dino.x,player.y-dino.y);
  if(dino.mode==='chase'){
   if(dino.timer<=0)dinoRest(null,dino);
  }else if(dino.timer<=0&&distance<185){
   dino.mode='chase';dino.timer=5+Math.random()*2;dino.target=null;
   if(dino.kind!=='compy')toast('A dinosaur is approaching. Dodge the warning ring or use your power!');
  }
  if(dino.mode==='wander'&&(!dino.target||dino.turnTimer<=0||
    Math.hypot(dino.target.x-dino.x,dino.target.y-dino.y)<12)){
   dino.turnTimer=2+Math.random()*3;
   dino.target=null;
   for(let i=0;i<16;i++){
    const a=Math.random()*Math.PI*2,r=50+Math.random()*140;
    const x=dinoHome.x+Math.cos(a)*r,y=town.id==='plaza'?clamp(dinoHome.y+Math.sin(a)*r,355,390):dinoHome.y+Math.sin(a)*r;
    if(!blocked(x,y)){dino.target={x,y};break;}
   }
  }
  const target=dino.mode==='chase'?player:dino.target;
  dino.moving=false;
  if(!target)return;
  const angle=Math.atan2(target.y-dino.y,target.x-dino.x);
  const speed=(dino.mode==='chase'?158:68)*(dino.kind==='ankylosaurus'?.65:1),step=speed*dt;
  // Try nearby headings, checking small steps to respect all scenery.
  for(const turn of [0,.45,-.45,.9,-.9,1.4,-1.4,2,-2]){
   const dx=Math.cos(angle+turn)*step,dy=Math.sin(angle+turn)*step;
   const steps=Math.max(1,Math.ceil(step/2));
   let clear=true;
   for(let i=1;i<=steps;i++)if(blocked(dino.x+dx*i/steps,dino.y+dy*i/steps)){clear=false;break;}
   if(!clear)continue;
   dino.x+=dx;dino.y+=dy;dino.moving=step>0;
   if(Math.abs(dx)>.1)dino.facing=dx>0?1:-1;
   if(Math.hypot(dx,dy)>.1)dino.direction=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
   break;
  }
  if(!dino.moving)dino.turnTimer=0;
  if(dino.moving)dino.clock+=dt*(dino.mode==='chase'?13:7);
 }
 function drawDino(dino){
  const small=dino.kind==='compy',size=small?64:128,stride=Math.floor(dino.clock)%4;
  const dilo=dino.kind==='dilophosaurus';
  const row=small?(!dino.alive?5:dino.flash>0?4:dino.moving?1:0):dilo?(!dino.alive?6:dino.flash>0?5:dino.windup>0?3:dino.attackPose>0?4:dino.moving?(dino.mode==='chase'?2:1):0):{down:0,left:1,right:2,up:3}[dino.direction]+(dino.moving?4:0);
  ctx.save();ctx.translate(Math.round(dino.x),Math.round(dino.y));
  if(dino.mode==='retreat'){ctx.globalAlpha=Math.min(1,Math.max(0,(2.8-dino.defeatAge)/.4));if(dino.defeatAge<.4&&!reduced.matches)ctx.translate(Math.sin(dino.defeatAge*60)*2,0);}
  ctx.fillStyle='#182b3655';ctx.beginPath();ctx.ellipse(0,0,17,5,0,0,Math.PI*2);ctx.fill();
  if(dino.mode==='chase'){
   ctx.fillStyle='#ffde87';ctx.font='bold 14px system-ui';ctx.textAlign='center';ctx.fillText('!',0,-90);
  }
  if(dino.stunned>0){ctx.fillStyle='#ffdf79';ctx.font='bold 11px system-ui';ctx.textAlign='center';for(let i=0;i<3;i++){const a=dino.stars*5+i*Math.PI*2/3;ctx.fillText('✦',Math.cos(a)*20,-90+Math.sin(a)*6);}}
  if(small||dilo)ctx.scale(dino.facing<0?-1:1,1);
  ctx.drawImage(extraSheets[dino.kind],stride*size,row*size,size,size,-size/2,4-size,size,size);
  if(dino.flash>0){ctx.save();ctx.globalAlpha=reduced.matches?.2:dino.flash/.16*.75;ctx.drawImage(flashSheets[dino.kind],stride*size,row*size,size,size,-size/2,4-size,size,size);ctx.restore();}
  combat.drawFeedback(ctx,dino);
  ctx.restore();
 }

 // A rare, harmless squirrel surprise on a clear path near the family.
 const squirrel={active:false,x:0,y:0,facing:1,clock:0,progress:0,
  pause:0,cooldown:8,from:0,to:0};
 function beginSquirrel(){
  const margin=22,half=Math.min(80,(canvas.width-2*margin)/2);
  if(half<35)return false;
  for(const dy of [-45,30,-15,60]){
   const y=player.y+dy;
   const middle=clamp(player.x,camera.x+half+margin,camera.x+canvas.width-half-margin);
   const left=middle-half,right=middle+half;
   if(y<camera.y+margin||y>camera.y+canvas.height-margin)continue;
   let clear=true;
   for(let x=left;x<=right;x+=4)if(blocked(x,y)){clear=false;break;}
   if(!clear||blocked(right,y))continue;
   const facing=Math.random()<.5?1:-1;
   Object.assign(squirrel,{active:true,x:facing===1?left:right,y,facing,
    from:facing===1?left:right,to:facing===1?right:left,progress:0,clock:0,pause:0});
   const reactions={jason:'Jason: That squirrel definitely has somewhere to be.',
    connor:'Connor: Race you, squirrel!',coco:'Coco: Tiny fluffy dinosaur!',
    peachy:'Peachy: Even the squirrel is getting its steps in.'};
   toast(reactions[player.id]||characters[player.id].name+': Look at that squirrel go!');return true;
  }
  return false;
 }
 function updateSquirrel(dt){
  if(!squirrel.active){
   squirrel.cooldown=Math.max(0,squirrel.cooldown-dt);
   if(squirrel.cooldown===0&&player.moving&&dino.mode!=='chase'){
    if(!beginSquirrel())squirrel.cooldown=3;
   }
   return;
  }
  squirrel.clock+=dt;
  if(squirrel.pause>0){squirrel.pause=Math.max(0,squirrel.pause-dt);return;}
  const before=squirrel.progress;
  squirrel.progress=Math.min(1,before+dt*145/Math.abs(squirrel.to-squirrel.from));
  if(before<.5&&squirrel.progress>=.5){squirrel.progress=.5;squirrel.pause=.55;}
  squirrel.x=squirrel.from+(squirrel.to-squirrel.from)*squirrel.progress;
  if(squirrel.progress===1){squirrel.active=false;squirrel.cooldown=45+Math.random()*35;}
 }
 function drawSquirrel(){
  const sniff=squirrel.pause>0,bob=sniff?0:Math.floor(squirrel.clock*15)%2;
  ctx.save();ctx.translate(Math.round(squirrel.x),Math.round(squirrel.y));
  ctx.fillStyle='#182b3645';ctx.beginPath();ctx.ellipse(0,0,12,3,0,0,Math.PI*2);ctx.fill();
  ctx.scale(squirrel.facing,1);ctx.translate(-14,-22-bob);
  const rect=(color,x,y,w,h)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
  const dark='#62402d',brown='#b97843',light='#e5b579';
  // Curled tail, round body, pointed ears and alternating little feet.
  rect(dark,0,0,9,18);rect(brown,2,0,8,14);rect(light,3,2,4,8);
  rect(dark,6,11,17,10);rect(brown,8,11,13,8);rect(light,14,16,6,4);
  rect(dark,17,5,10,10);rect(brown,18,7,8,7);rect(dark,18,3,3,5);
  rect(light,20,8,3,3);rect('#162b2d',22,8,2,2);rect(dark,26,11,3,2);
  const step=sniff?0:bob*3;
  rect(dark,9+step,20,5,2);rect(dark,19-step,20,5,2);
  ctx.restore();
 }

 function landmarks(){return town.landmarks.filter(l=>(!l.pickup||!V4_RPG.discoveries[l.pickup])&&(l.id!=='dogs'||!V4_RPG.discoveries.dogs)&&(l.event!=='banquet'||V5_EVENTS.state.completed.includes('gary')&&!V5_EVENTS.state.completed.includes('banquet'))).concat(V4_STORY.encounters(town.id,player.id));}
 function goThrough(portal){
  if(airborne()){toast('Land before entering a destination.');return false;}
  if((town.id==='world'||town.id==='nyc')&&Math.hypot(player.x-portal.x,player.y-portal.y)>portal.radius+8){toast('Walk closer to '+portal.name+'.');return false;}
  if(unicorn.riding){toast('Hop off the unicorn before entering another area.');return false;}
  if(!V5_EVENTS.canTravel(portal.to))return false;
  enterScene(portal.to,portal.arrival,portal.arrivalDirection);return true;
 }
 function nearPortal(portal,x,y){
  return Math.hypot(portal.x-x,portal.y-y)<=portal.radius+8||(portal.roads||[]).some(r=>x>=r.x-8&&x<=r.x+r.w+8&&y>=r.y-8&&y<=r.y+r.h+8);
 }
 function crossesRoad(road,oldX,oldY,newX,newY){
  const horizontal=road.direction==='left'||road.direction==='right';
  const before=horizontal?oldX:oldY,after=horizontal?newX:newY,delta=after-before;
  const positive=road.direction==='right'||road.direction==='down';
  if(positive?delta<=0:delta>=0)return false;
  const start=horizontal?road.x:road.y,end=start+(horizontal?road.w:road.h);
  if(Math.max(before,after)<start||Math.min(before,after)>end)return false;
  const entry=positive?start:end,t=clamp((entry-before)/delta,0,1);
  const transverse=horizontal?oldY+(newY-oldY)*t:oldX+(newX-oldX)*t;
  const low=horizontal?road.y:road.x,high=low+(horizontal?road.h:road.w);
  return transverse>=low&&transverse<=high;
 }
 function checkZoneCrossing(oldX,oldY){
  const portals=town.landmarks.filter(l=>l.to);
  for(const portal of portals)if(!nearPortal(portal,oldX,oldY))arrivalPortals.delete(portal.id);
  if(!player.moving||unicorn.riding||airborne())return false;
  const portal=portals.find(l=>!arrivalPortals.has(l.id)&&(l.roads?l.roads.some(r=>crossesRoad(r,oldX,oldY,player.x,player.y)):Math.hypot(l.x-player.x,l.y-player.y)<=22));
  return portal?goThrough(portal):false;
 }
 function updateNearby(){
  paintTravel();
  if(airborne()){
   nearest=null;$('nearby').hidden=false;$('nearby-text').textContent='Jet airborne · Land on clear ground';$('interact').textContent='Land';$('interact').setAttribute('aria-label','Land the jet');return;
  }
  nearest=landmarks().filter(l=>Math.hypot(l.x-player.x,l.y-player.y)<l.radius).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0]||null;
  const ride=town.id==='plaza'&&unicorn.nearby(player),mounted=unicorn.riding;
  $('nearby').hidden=!nearest&&!ride&&!mounted;
  const phone=document.body.classList.contains('touch');
  $('nearby-text').textContent=mounted?(phone?'Tap Off to hop down':'Unicorn ride · Hop off when you like'):ride?(phone?'A unicorn! Tap Ride':'A unicorn! Hop on for a ride'):nearest?.name||'';
  $('interact').textContent=mounted?'Off':ride?'Ride':nearest?.to?'Go':nearest?.pickup?'Take':nearest?.event?'Celebrate':nearest?.recruit||nearest?.npc?'Talk':'Look';$('interact').setAttribute('aria-label',mounted?'Dismount unicorn':ride?'Ride unicorn':nearest?.pickup?'Pick up '+window.V4_RPG.items[nearest.pickup].name:nearest?'Look at '+nearest.name:'Look around');
  if(town.id==='world'&&!nearest&&travel.model().nearPlane(player)){$('nearby').hidden=false;$('nearby-text').textContent='Parked jet · Ready to board';$('interact').textContent='Board';$('interact').setAttribute('aria-label','Board the jet');}
 }
 function paintTravel(){
  const world=town.id==='world',available=world&&(travel.model().flying||travel.model().nearPlane(player));
  document.body.classList.toggle('v7-travel',world||town.id==='nyc');
  document.body.classList.toggle('v7-airborne',world&&travel.model().flying);
  $('open-world-map').hidden=!world&&town.id!=='nyc';$('travel-action').hidden=!available;
  $('travel-action').textContent=world&&travel.model().flying?'Land · E':'Board jet · E';
  $('travel-action').disabled=!loaded||changing||document.hidden||mapOpen()||storyBusy()||$('dialog').open||V4_MENU.active;
 }
 function useJet(){
  if(!loaded||changing||document.hidden||mapOpen()||town.id!=='world'||flight.state.active||playerCombat.locked||storyBusy()||$('dialog').open||V4_MENU.active||V3_INTRO.active)return;
  const result=travel.model().flying?travel.model().land(player):travel.model().board(player);
  toast(result.message);
  if(result.ok){resetInput();powers.clear();attacks.clear();V4_SFX.play(travel.model().flying?'door':'land');updateCamera();updateNearby();paintPower();refreshParty();}
 }
 $('travel-action').addEventListener('click',useJet);
 function openWorldMap(){
  if(!loaded||changing||document.hidden||playerCombat.locked||storyBusy()||V3_INTRO.active||$('dialog').open||V4_MENU.active||!['world','nyc'].includes(town.id))return;
  resetInput();travel.drawOverview($('world-overview'),town.id==='world'?player:travel.sites[1]);$('world-map').showModal();paintTravel();paintPower();
 }
 $('open-world-map').addEventListener('click',openWorldMap);
 $('close-world-map').addEventListener('click',()=>$('world-map').close());
 $('world-map').addEventListener('close',()=>{resetInput();paintTravel();paintPower();canvas.focus({preventScroll:true});});
 for(const site of travel.sites){
  const button=document.createElement('button');button.type='button';button.dataset.destination=site.id;
  button.textContent=site.name+(site.to?'':' · Future');button.onclick=()=>{
   const actor=town.id==='world'?player:travel.sites[1],dx=site.x-actor.x,dy=site.y-actor.y;
   $('world-map-message').textContent=site.name+': '+(Math.hypot(dx,dy)<60?'You are nearby.':(dy<0?'north':'south')+(dx<0?'west':'east')+' of your position.')+' '+(site.to?'Land nearby and walk to the town marker to enter.':'Mapped for a future chapter; no playable interior yet.');
  };$('world-destinations').append(button);
 }
 function showDialog(title,body,tag='MARKET SQUARE'){resetInput();$('dialog-title').textContent=title;$('dialog-body').textContent=body;$('dialog-tag').textContent=tag;$('world-actions').hidden=tag!=='HOW TO PLAY';if(!$('dialog').open)$('dialog').showModal();paintPower();}
 $('help').addEventListener('click',()=>{
  if(mapOpen()||playerCombat.locked||storyBusy()||window.V3_INTRO?.active)return;
  if(['world','nyc'].includes(town.id)){
   showDialog('Beyond the meteor','The road north of the meteor connects Gaithersburg to Earth. Walk with arrows / WASD or the joystick. On the world map, ocean and mountains block walking. Board the nearby jet with E / Board. W / Up flies forward into the camera view; S / Down reverses; A / D or Left / Right turns. The joystick uses the same forward/back and turning controls. Hold Shift / Run for faster flight and engine flames; normal flight has no flames. Flight crosses any terrain and wraps east-west around Earth. E / Land sets down only on open grass, sand or snow. Land near a gold town marker, then walk to it to enter. Q / Map opens a paused overview with directions. New York has a first walkable district; Paris, Egypt, Japan, Russia and Hawaii are clearly marked future chapters. The jet waits where you landed. Return through Gaithersburg to keep exploring your neighborhood. Party, HP and inventory are shared with the neighborhood. Progress is still session-only; refreshing starts over.','HOW TO PLAY');return;
  }
  showDialog("Coco's adventure","Find Connor next door, then go downstairs to Mom and Dad. Stories pause movement. Skip scene beside Expand fast-forwards the current cutscene with its normal one-time rewards. Coco remains the story protagonist when you switch heroes. Rescue neighbors at gold diamonds, then regroup near the family in Market Square. Gary waits inside Five Guys HQ and joins after his battle. The diamond north of the family meeting spot offers the Under the Lights banquet; Continue or Skip returns you as Gary. WASD / arrows move, Shift runs, E / Space interacts, X uses your power. Menu / M / Escape pauses for stats, items, equipment and one equipped ability. On a phone, drag the joystick and hold Run with another thumb. Home connects to Shops and Courts; Shops connects to Home and Market Square; Market Square connects to Shops and North Market. All trips are reversible. Indoors, dinosaurs appear only in cinematic window views. Find the sword downstairs, the reusable grenade north of Cinepolis, and Barney and Rosie on the northeast recreation street. Attacks damage wild dinosaurs: small ones disappear in smoke, large ones retreat. Chris uses a short-range Towel Whip. Strength and the sword boost damage. Wild dinosaurs warn before attacking; dodge their strikes and spit. A red flash and sound signal a hit. Check HP in Menu and heal with a hamburger. Fainting returns you safely to Five Guys without losing items or progress. Dogs rest when you stop, bite nearby dinosaurs and cannot be injured. Stories, flight and unicorn rides remain safe. Help toggles damage numbers and the once-per-playthrough Main Street bus gag; these preferences are remembered. Gameplay progress is session-only: refreshing starts over. Expand fills the browser; iPhone Home Screen mode can hide browser chrome.","HOW TO PLAY");
 });
 function interact(){
  if(!loaded||changing||document.hidden||mapOpen()||playerCombat.locked||storyBusy()||joining||flight.state.active||window.V3_INTRO?.active||$('dialog').open||window.V4_MENU.active)return;updateNearby();
  if(airborne()||(town.id==='world'&&!nearest&&travel.model().nearPlane(player))){useJet();return;}
  if(nearest?.event==='banquet'){
   if(unicorn.riding){toast('Hop off the unicorn before joining the banquet.');unicorn.interact(player);return;}
   V5_EVENTS.celebrate();return;
  }
  if(nearest?.recruit||nearest?.npc){
   V5_EVENTS.encounter(nearest.recruit||nearest.npc);return;
  }
  if(nearest?.id==='dogs'){
   const result=V4_RPG.findDogs();
   if(result.ok){companions.enter(player,true);V4_SFX.play('dogs');showDialog('Barney and Rosie found!','You found Barney and Rosie on the northeast street! '+result.message,'DOG COMPANIONS');}
   else toast(result.message);updateNearby();return;
  }
  if(nearest?.to){if(unicorn.riding){toast('Hop off the unicorn before entering another area.');unicorn.interact(player);return;} goThrough(nearest);return;}
  if(nearest?.pickup){
   const result=window.V4_RPG.collectPickup(nearest.pickup);
   if(result.ok){V4_SFX.play('pickup');showDialog(window.V4_RPG.items[nearest.pickup].name+' found!',result.message,nearest.pickup==='sword'?'DINO HOUSE':'MAIN STREET');}else toast(result.message);
   updateNearby();return;
  }
  if(town.id==='plaza'&&(unicorn.riding||unicorn.nearby(player))){
   if(unicorn.interact(player)){resetInput();updateCamera();updateNearby();toast(unicorn.riding?'Unicorn ride! Run to gallop.':'Back on your feet. The unicorn will wait here.');}
   else toast('Find a little more space to hop on or off.');return;
  }
  if(nearest)showDialog(nearest.name,nearest.text);else toast('Walk toward a gold diamond to look around.');
 }
 const close=()=>{$('dialog').close();resetInput();canvas.focus({preventScroll:true});};
 $('close-dialog').addEventListener('click',close);$('continue').addEventListener('click',close);
 $('dialog').addEventListener('close',()=>{
  resetInput();canvas.focus({preventScroll:true});
  if(pendingRecruit){
   const id=pendingRecruit,place=V4_STORY.locations[id];pendingRecruit=null;
   joining={id,x:place.x,y:place.y,from:{x:place.x,y:place.y},age:0,direction:'down',frame:1,moving:true};
  }
 });
 $('replay-intro').addEventListener('click',close);
 const movementKeys=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight','ShiftLeft','ShiftRight'];
 window.addEventListener('keydown',e=>{if(e.ctrlKey||e.altKey||e.metaKey||mapOpen()||playerCombat.locked||storyBusy()||joining||flight.state.active||$('dialog').open||window.V4_MENU.active||window.V3_INTRO?.active)return;if(e.code==='KeyQ'&&!e.repeat){e.preventDefault();openWorldMap();}if(movementKeys.includes(e.code)){e.preventDefault();keys.add(e.code);}if(['KeyE','Space'].includes(e.code)){e.preventDefault();if(!e.repeat)interact();}if(e.code==='KeyX'){e.preventDefault();if(!e.repeat)activatePower();}if(/^Digit[0-9]$/.test(e.code)&&!e.repeat){const digit=Number(e.code.slice(-1));select(ids[digit===0?9:digit-1]);}});
 window.addEventListener('keyup',e=>keys.delete(e.code));
 const joyEl=$('joystick');
 function setJoy(e){const r=joyEl.getBoundingClientRect(),max=r.width*.34,dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,len=Math.hypot(dx,dy),ratio=len>max?max/len:1,x=dx*ratio,y=dy*ratio;$('stick').style.transform=`translate(${x}px,${y}px)`;joy=len<max*.18?{x:0,y:0}:{x:x/max,y:y/max};}
 joyEl.addEventListener('pointerdown',e=>{if(playerCombat.locked||storyBusy()||joyId!==null)return;e.preventDefault();joyId=e.pointerId;joyEl.setPointerCapture(e.pointerId);setJoy(e);});
 joyEl.addEventListener('pointermove',e=>{if(e.pointerId===joyId){e.preventDefault();setJoy(e);}});
 function endJoy(e){if(e.pointerId!==joyId)return;joyId=null;joy={x:0,y:0};$('stick').style.transform='';}
 ['pointerup','pointercancel','lostpointercapture'].forEach(type=>joyEl.addEventListener(type,endJoy));
 $('run').addEventListener('pointerdown',e=>{if(playerCombat.locked||storyBusy()||runId!==null)return;e.preventDefault();runId=e.pointerId;$('run').setPointerCapture(e.pointerId);touchRun=true;$('run').classList.add('active');});
 function endRun(e){if(e.pointerId!==runId)return;runId=null;touchRun=false;$('run').classList.remove('active');}
 ['pointerup','pointercancel','lostpointercapture'].forEach(type=>$('run').addEventListener(type,endRun));
 $('interact').addEventListener('click',interact);
 canvas.addEventListener('pointerdown',e=>{
  canvas.focus({preventScroll:true});if(!loaded||changing||mapOpen()||playerCombat.locked||storyBusy()||joining||flight.state.active||$('dialog').open||window.V4_MENU.active||window.V3_INTRO?.active)return;
  if(airborne()){toast('Use Land before visiting a town.');return;}
  const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*canvas.width/r.width/viewScale+camera.x,y=(e.clientY-r.top)*canvas.height/r.height/viewScale+camera.y;
  const target=landmarks().filter(l=>Math.hypot(l.x-x,l.y-15-y)<23).sort((a,b)=>Math.hypot(a.x-x,a.y-15-y)-Math.hypot(b.x-x,b.y-15-y))[0];
  if(target?.to){goThrough(target);return;}
  if(target){if(Math.hypot(target.x-player.x,target.y-player.y)<target.radius){if(target.event==='banquet'){if(unicorn.riding){toast('Hop off the unicorn before joining the banquet.');unicorn.interact(player);return;}V5_EVENTS.celebrate();}else if(target.pickup||target.recruit||target.npc||target.id==='dogs')interact();else showDialog(target.name,target.text);}else toast('Walk closer to '+target.name+'.');}
 });
 function update(dt){
  if(!loaded||changing||document.hidden||mapOpen()||window.V3_INTRO?.active||$('dialog').open||window.V4_MENU.active)return;
  if(playerCombat.locked){playerCombat.update(dt);paintPower();return;}
  V5_EVENTS.check();
  if(storyBusy()){paintPower();return;}
  if(joining){
   joining.age+=dt;const progress=Math.min(1,joining.age/.8),ease=progress*progress*(3-2*progress);
   const dx=player.x-joining.from.x,dy=player.y-joining.from.y;
   joining.x=joining.from.x+dx*ease;joining.y=joining.from.y+dy*ease;joining.frame=Math.floor(joining.age*8)%4;
   joining.direction=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
   if(progress===1){const result=V4_RPG.recruit(joining.id);joining=null;refreshParty();updateNearby();V4_SFX.play('join');toast(result.message);}
   paintPower();return;
  }
  if(flight.state.active){flight.update(dt,player,town);updateCamera();paintPower();return;}
  playerCombat.update(dt);
  let x=joy.x+(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),y=joy.y+(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0);
  const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}
  const c=characters[player.id];player.running=touchRun||keys.has('ShiftLeft')||keys.has('ShiftRight');const oldX=player.x,oldY=player.y;
  if(airborne()){
   travel.model().update(dt,player,x,y,player.running);player.moving=Math.hypot(player.x-oldX,player.y-oldY)>.01;
   updateNearby();paintPower();refreshParty();$('area-label').textContent='EARTH · JET FLIGHT';$('status').textContent=c.name+' · '+(player.running?'Jet boost':'Flying');return;
  }
  if(length>.01&&!playerCombat.staggered){player.direction=Math.abs(x)>Math.abs(y)?(x>0?'right':'left'):(y>0?'down':'up');const speed=town.id==='world'?(player.running?125:75):unicorn.riding?(player.running?280:170):(player.running?c.runSpeed:c.speed);move(x*speed*dt,y*speed*dt);}
  if(town.id==='world')travel.model().update(dt,player,0,0);
  player.moving=Math.hypot(player.x-oldX,player.y-oldY)>.01;
  if(checkZoneCrossing(oldX,oldY))return;
  if(player.moving){player.clock+=dt*(player.running?c.runFPS:c.walkFPS);player.frame=Math.floor(player.clock)%4;}else{player.clock=0;player.frame=1;}
  unicorn.update(dt,player);powers.update(dt);combat.update(dt,activeEnemies());
  attacks.update(dt,activeEnemies());
  if(playerCombat.locked){paintPower();return;}
  for(const enemy of activeEnemies())updateDino(dt,enemy,enemy===dino?dinoHome:enemy.home);
  gimmicks.update(dt,town,player,camera,canvas.width/viewScale);
  if(town.id==='plaza')updateSquirrel(dt);paintPower();
  if(town.id==='recreation')recreation.update(dt,player);
  if(town.id!=='world')companions.update(dt,player);
  for(const cast of powers.state.casts)flight.scare(cast);
  flight.update(dt,player,town,!unicorn.riding);refreshParty();
  updateCamera();updateNearby();$('status').textContent=c.name+' · '+(unicorn.riding?(player.moving&&player.running?'Galloping':'Riding a unicorn'):player.moving?(player.running?'Running':'Walking'):'Taking it all in');$('area-label').textContent=town.id!=='plaza'?town.name:player.y<401?'CENTER POINT WAY':player.y<785?'THE GREEN':'THE PLAZA';
 }
 function sprite(actor,active){
  const c=characters[actor.id],x=Math.round(actor.x),y=Math.round(actor.y);
  if(town.id==='world'){ctx.save();ctx.translate(x,y);ctx.scale(.8,.8);ctx.translate(-x,-y);}
  ctx.fillStyle=active?'#182b365c':'#182b3645';ctx.beginPath();ctx.ellipse(x,y,actor.id==='coco'?10:13,4,0,0,Math.PI*2);ctx.fill();
  if(active){ctx.strokeStyle='#f9df89';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y+1,15,5,0,0,Math.PI*2);ctx.stroke();}
  const faint=active&&playerCombat.locked;
  const blast=active&&!faint&&actor.id==='gary'&&powers.state.casts.find(c=>c.owner==='gary'&&c.kind==='blaster'&&c.age<.5);
  if(blast&&['left','right'].includes(actor.direction)&&V5_CINEMA.drawPose(ctx,'gary','attack',x,y,blast.age,{flip:actor.direction==='left'})){powers.drawActor(ctx,actor);return;}
  const pose=faint?{lift:0,rotation:-Math.PI/2,frame:1}:active?powers.pose(actor):{lift:0,rotation:0},saddle=active&&unicorn.riding?20:0;
  if(saddle)unicorn.draw(ctx,actor);
  const air=active?flight.view().lift:0;
  ctx.save();ctx.translate(x,y-30-saddle-pose.lift-air);ctx.rotate(pose.rotation);
  const walking=characterWalkPose(c,pose.direction||actor.direction,!faint&&actor.moving);
  if(walking.flip)ctx.scale(-1,1);
  ctx.drawImage(sheets[actor.id],(pose.frame??actor.frame)*64,walking.row*64,64,64,-c.foot.x,30-c.foot.y,64,64);
  if(active&&!faint&&playerCombat.state.flash>0){ctx.strokeStyle='#ff9686';ctx.lineWidth=2;ctx.strokeRect(-17,-28,34,56);}
  ctx.restore();
  if(active)powers.drawActor(ctx,{...actor,y:actor.y-saddle});
  if(town.id==='world')ctx.restore();
 }
 function draw(){
  if(!loaded)return;if(V5_CINEMA.active){V5_CINEMA.render(ctx,canvas);return;}if(airborne()){travel.drawFlight(ctx,canvas,player);return;}ctx.fillStyle='#17383b';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.save();ctx.scale(viewScale,viewScale);ctx.translate(-camera.x,-camera.y);
  if(town.viewBounds){const b=town.viewBounds;ctx.save();ctx.beginPath();ctx.rect(b.left,b.top,b.right-b.left,b.bottom-b.top);ctx.clip();ctx.drawImage(background,0,0,town.width,town.height);ctx.restore();}
  else ctx.drawImage(background,0,0,town.width,town.height);
  if(town.overlay&&sceneOverlays[town.id]){const o=town.overlay;ctx.drawImage(sceneOverlays[town.id],...o.source,o.x,o.y,o.w,o.h);}
  for(const portal of town.landmarks)for(const road of portal.roads||[]){
   const horizontal=road.direction==='left'||road.direction==='right',length=horizontal?road.h:road.w;
   for(let offset=12;offset<length;offset+=24){
    const x=horizontal?road.x+road.w/2:road.x+offset,y=horizontal?road.y+offset:road.y+road.h/2;
    if(blocked(x,y,3,3))continue;
    ctx.save();ctx.translate(x,y);ctx.rotate(({right:0,down:Math.PI/2,left:Math.PI,up:-Math.PI/2})[road.direction]);
    ctx.strokeStyle='#f3dc98';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-3,-4);ctx.lineTo(2,0);ctx.lineTo(-3,4);ctx.stroke();ctx.restore();
   }
  }
  landmarks().forEach(l=>{
   if(l.pickup){
    if(!window.V4_RPG.discoveries[l.pickup])ctx.drawImage(extraSheets[l.pickup+'Icon'],l.x-16,l.y-34,32,32);
    return;
   }
   ctx.fillStyle=nearest===l?'#ffeda6':'#eedba2';ctx.strokeStyle='#705b35';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(l.x,l.y-21);ctx.lineTo(l.x+5,l.y-15);ctx.lineTo(l.x,l.y-9);ctx.lineTo(l.x-5,l.y-15);ctx.closePath();ctx.fill();ctx.stroke();
   if(l.to){
    ctx.font='10px system-ui';ctx.textAlign='center';
    const width=ctx.measureText(l.name).width+12;
    ctx.fillStyle='#17383be6';ctx.fillRect(l.x-width/2,l.y+5,width,17);
    ctx.fillStyle='#fff0c6';ctx.fillText(l.name,l.x,l.y+17);
   }
  });
  powers.drawGround(ctx);attacks.drawGround(ctx,activeEnemies());gimmicks.draw(ctx,extraSheets.bus,town.id);
  const unicornActor=unicorn.state;
  const activity=town.id==='recreation'?recreation.actors(player):[];
  const ambient=V4_STORY.actors(town.id,activity,player.id).filter(a=>a.id!==joining?.id)
   .concat(activity.filter(a=>recreation.dogData[a.id]),town.id==='world'?[]:companions.actors,town.id==='plaza'?(squirrel.active?[squirrel]:[]).concat(unicorn.riding?[]:[unicornActor]):[]);
  if(town.id==='world'){const plane=travel.model().state.plane;travel.drawPlane(ctx,plane.x,plane.y);}
  const enemies=activeEnemies();
  ambient.concat(enemies,joining?[joining]:[],player).sort((a,b)=>a.y-b.y).forEach(a=>{
   if(enemies.includes(a))drawDino(a);else if(a===squirrel)drawSquirrel();else if(a===unicornActor)unicorn.draw(ctx);
   else if(recreation.dogData[a.id]||a.swimming){
    drawSmallActor(a);
   }else{ctx.save();if(a===joining)ctx.globalAlpha=1-Math.max(0,(a.age-.6)/.2);sprite(a,a===player);ctx.restore();}
  });
  if(town.id==='recreation'&&(!V4_RPG.members.jeff.joined||!V4_RPG.members.ari.joined))recreation.drawBall(ctx);
  if(!town.indoor&&town.id!=='world'&&town.id!=='nyc'&&flight.state.visible){
   const bird=flight.state.bird,row={down:0,left:1,right:2,up:3}[bird.direction]+4;
   ctx.drawImage(extraSheets.pterodactyl,bird.frame*128,row*128,128,128,Math.round(bird.x)-64,Math.round(bird.y)-124,128,128);
  }
  powers.drawAir(ctx);attacks.drawAir(ctx);combat.drawEffects(ctx);ctx.restore();playerCombat.drawCover(ctx,canvas.width,canvas.height);
 }
 function drawSmallActor(a){
  if(a.pose&&extraSheets[a.id+'Poses']){
   ctx.save();ctx.translate(Math.round(a.x),Math.round(a.y));if(a.pose==='attack'&&a.direction==='right')ctx.scale(-1,1);
   ctx.drawImage(extraSheets[a.id+'Poses'],a.poseFrame*64,0,64,64,-32,-60,64,64);ctx.restore();return;
  }
  const rows={down:0,left:1,right:2,up:3},row=a.swimming?({down:0,up:1,left:2,right:3})[a.direction]:rows[a.direction]+4;
  ctx.drawImage(a.swimming?extraSheets.swim:extraSheets[a.id],a.frame*64,row*64,64,64,Math.round(a.x)-32,Math.round(a.y)-60,64,64);
 }
 function frame(time){const dt=previous?Math.min((time-previous)/1000,.05):0;previous=time;update(dt);draw();requestAnimationFrame(frame);}
 async function enterScene(id,arrival,direction='down',recovery=false){
  if(changing||!scenes[id])return false;
  if(airborne()){toast('Land before leaving the world map.');return false;}
  if(playerCombat.locked&&!recovery)return false;
  if(!V5_EVENTS.canTravel(id))return false;
  if(joining||pendingRecruit||flight.state.active){toast('Finish this moment before entering another area.');return false;}
  changing=true;resetInput();$('stage').classList.add('transitioning');
  const next=scenes[id],old=town,oldDino=dino,oldHome=dinoHome,oldBackground=background,oldPlayer={...player};
  try{
   const img=sceneImages[id]||travel.background(id)||await loadImage(next.image);sceneImages[id]=img;
   if(next.overlay&&!sceneOverlays[id])sceneOverlays[id]=await loadImage(next.overlay.image);
   attacks.clear(encounterEnemies());town=next;storyReturn=null;
   const x=arrival[0]*town.width/1000,y=arrival[1]*town.height/1000;
   if(blocked(x,y)){town=old;throw new Error('The entrance needs more space.');}
   dinoHome=town.indoor?null:dinoHomes[id]||null;dino=town.indoor?null:dinosaurs[id]||null;
   prepareEnemies(id);combat.clearEffects();
   background=img;Object.assign(player,{x,y,direction,frame:1,clock:0});
   arrivalPortals.clear();
   for(const portal of town.landmarks)if(portal.to&&nearPortal(portal,x,y))arrivalPortals.add(portal.id);
   powers=makePowers();unicorn=window.FAMILY_UNICORN.create({blocked});squirrel.active=false;
   companions.enter(player);flight.enter(id,player);V4_SFX.play('door');
   $('route-hint').textContent=town.hint;document.querySelector('.location strong').textContent=town.id==='world'?'Earth':town.id==='nyc'?'New York':'Kentlands';document.querySelector('.location small').textContent=town.id==='plaza'?'Market Square · Afternoon':town.name;nearest=null;updateCamera();updateNearby();toast(town.name);
   return true;
  }catch(error){town=old;dino=oldDino;dinoHome=oldHome;background=oldBackground;Object.assign(player,oldPlayer);toast('Could not open this area. Try again.');console.error(error);return false;}
  finally{changing=false;resetInput();$('stage').classList.remove('transitioning');if(!recovery)V5_EVENTS.check();if(!storyBusy())canvas.focus({preventScroll:true});}
 }
 $('return-plaza').addEventListener('click',()=>{if($('dialog').open)$('dialog').close();enterScene('plaza',[50,84.47265625].map(v=>v*10));});
 function loadImage(path){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Could not load '+path));img.src=window.EMBEDDED_ASSETS?.[path]||path;});}
 Promise.all([loadImage(town.image).then(img=>{background=img;sceneImages.cocoRoom=img;}),...ids.map(id=>loadImage(characters[id].sheet).then(img=>{sheets[id]=img;})),
  ...Object.entries({...Object.fromEntries(Object.entries(recreation.dogData).map(([id,data])=>[id,data.sheet])),...Object.fromEntries(['trex','raptor','triceratops','pterodactyl'].map(id=>[id,'../v4/assets/dinosaurs/'+id+'.png?v=cleanup-1'])),...Object.fromEntries(['dilophosaurus','ankylosaurus'].map(id=>[id,'../v6/assets/dinosaurs/'+id+'.png?v=danger-2'])),barneyPoses:'../v6/assets/companions/barney-poses.png?v=danger-1',rosiePoses:'../v6/assets/companions/rosie-poses.png?v=danger-1',grenade:'../v6/assets/items/grenade.png?v=danger-1',grenadeIcon:V4_RPG.items.grenade.image,compy:'../v6/assets/dinosaurs/compy.png?v=danger-2',towel:'../v6/assets/items/towel-whip.png?v=combat-1',bus:'../v6/assets/gimmicks/bus.png?v=combat-1',swim:'../v4/assets/characters/chris-swim.png',sword:'../v4/assets/items/sword-slash.png',swordIcon:window.V4_RPG.items.sword.image}).map(([id,path])=>loadImage(path).then(img=>{
   extraSheets[id]=img;
   if(V6_COMBAT.species[id]){const flash=document.createElement('canvas');flash.width=img.width;flash.height=img.height;const paint=flash.getContext('2d');paint.drawImage(img,0,0);paint.globalCompositeOperation='source-atop';paint.fillStyle='#fff5dc';paint.fillRect(0,0,flash.width,flash.height);flashSheets[id]=flash;}
  }))
 ,V5_CINEMA.preload(),travel.preload()]).then(()=>{
  ids.forEach(id=>{const p=portraits[id].getContext('2d');p.imageSmoothingEnabled=false;p.drawImage(sheets[id],64,0,64,64,-8,-5,64,64);});
  loaded=true;$('loading').hidden=true;resize();updateNearby();paintPower();refreshParty();$('route-hint').textContent=town.hint;document.querySelector('.location small').textContent=town.name;if(!storyBusy())canvas.focus({preventScroll:true});
 }).catch(error=>{$('loading').innerHTML='';const message=document.createElement('b');message.textContent=error.message;const help=document.createElement('span');help.textContent='Extract the full ZIP, then open index.html or the standalone play.html.';$('loading').append(message,help);console.error(error);});
 resize();requestAnimationFrame(frame);
 // Read-only diagnostic state for repeatable browser checks.
 V5_CINEMA.attach({
  capture:()=>({scene:town.id,player:{...player},actors:V4_STORY.actors(town.id,town.id==='recreation'?recreation.actors(player):[],player.id),camera:{...camera,scale:viewScale}}),
  drawAmbient(scene){if(scene===town.id)companions.actors.forEach(drawSmallActor);},
  release(context,scene,actors,view){
   const hero=scene===town.id&&actors.find(a=>a.id===player.id);
   if(hero){if(blocked(hero.x,hero.y))throw new Error('The story ended outside a walkable area.');Object.assign(player,{x:hero.x,y:hero.y,direction:hero.direction});}
   resetInput();storyReturn={at:performance.now(),camera:scene===town.id&&view?view:context.camera};updateCamera();updateNearby();canvas.focus({preventScroll:true});
  }
 });
 V5_EVENTS.attach({scene:()=>town.id,atMeeting:()=>Math.hypot(player.x-768,player.y-865)<150,atBanquet:()=>Math.hypot(player.x-768,player.y-760)<56,
  resumeGary(){if(!select('gary'))throw new Error('Gary could not resume after the banquet.');},reset:resetInput,notify:toast,refresh:()=>{refreshParty();updateNearby();paintPower();}});
 window.GAME={get ready(){return loaded&&!changing;},get busy(){return mapOpen()||playerCombat.locked||storyBusy()||!!joining||!!pendingRecruit||flight.state.active;},get state(){return{scene:town.id,player:{...player},travel:travel.model()?.state||null,map:mapOpen(),playerCombat:playerCombat.state,incoming:attacks.state,actors:V4_STORY.actors(town.id,town.id==='recreation'?recreation.actors(player):[],player.id),joining:joining&&{...joining},story:V5_EVENTS.state,cinema:V5_CINEMA.state,companions:companions.state,flight:flight.state,recreation:recreation.state,powers:powers.state,unicorn:unicorn.state,dinosaur:dino&&{...dino},enemies:encounterEnemies().map(enemy=>({...enemy})),combat:combat.state,gimmicks:gimmicks.state,squirrel:{...squirrel},camera:V5_CINEMA.active&&V5_CINEMA.state.camera||{...camera,scale:viewScale},nearest:nearest?.id||null,viewport:{width:canvas.width,height:canvas.height},dialog:$('dialog').open,menu:window.V4_MENU.active,input:{joy:{...joy},touchRun,keys:[...keys]}};},select,blocked};
})();


// Original village theme, synthesized locally with no external audio downloads.
(() => {
 'use strict';
 const stage=document.getElementById('stage');
 if(!stage||document.getElementById('music-toggle'))return;
 const button=document.createElement('button');
 button.id='music-toggle';button.type='button';button.className='quiet';
 button.style.cssText='position:absolute;top:10px;right:10px;z-index:3;min-height:44px;padding:8px 12px;background:#17383bee;border-color:#d3b16d;font:12px system-ui;border-radius:6px;touch-action:manipulation';
 stage.append(button);
 const Audio=window.AudioContext||window.webkitAudioContext;
 let enabled=true,context=null,buffer=null,source=null,offset=0,startedAt=0,generation=0,sourceMode='village',startCount=0;
 const buffers={},offsets={village:0,battle:0,cafe:0,omen:0};
 try{enabled=localStorage.getItem('village-music')!=='off';}catch(_){}
 function paint(){
  const playing=!!source&&context.state==='running';
  button.textContent=!Audio?'Music unavailable':!enabled?'♫ Music: Off':playing?'♫ Music: On':'♫ Tap for music';
  button.setAttribute('aria-pressed',String(enabled));
  button.setAttribute('aria-label',!Audio?'Music is unavailable in this browser':playing?'Turn background music off':!enabled?'Turn background music on':'Start background music');
  button.disabled=!Audio;
 }
 function compose(mode){
  const battle=mode==='battle',cafe=mode==='cafe',omen=mode==='omen',rate=22050,beat=60/(battle?164:cafe?116:omen?132:92),duration=16*4*beat;
  const result=context.createBuffer(1,Math.round(duration*rate),rate),data=result.getChannelData(0);
  function note(midi,at,length,volume,voice){
   const frequency=440*Math.pow(2,(midi-69)/12),start=Math.round(at*rate),count=Math.floor(length*rate);
   for(let i=0;i<count;i++){
    const t=i/rate,phase=2*Math.PI*frequency*t;
    const envelope=Math.min(1,t/.018)*Math.pow(1-i/count,2)*Math.exp(-t*(voice==='pad'?.3:2.4));
    const wave=Math.sin(phase)+(voice==='organ'?.38*Math.sin(phase*2)+.2*Math.sin(phase*4):voice==='brass'?.3*Math.sin(phase*3)+.12*Math.sin(phase*5):voice==='bell'?.24*Math.sin(phase*2):voice==='pluck'?.15*Math.sin(phase*3):0);
    data[(start+i)%data.length]+=wave*envelope*volume;
   }
  }
  const chords=omen?[[38,41,45,50],[34,38,41,46],[36,40,43,48],[33,37,40,45]]:cafe?[[48,52,55,57],[53,57,60,64],[50,53,57,60],[43,47,50,53]]:battle?[[41,44,48,53],[37,41,44,49],[39,43,46,51],[36,40,43,48]]:
   [[48,52,55,59],[43,47,50,57],[45,48,52,55],[41,45,48,52],[48,52,55,59],[43,47,50,57],[41,45,48,52],[43,47,50,55]];
  const melody=omen?Array.from({length:16},(_,bar)=>[[74,69,77,76],[70,65,74,73],[72,67,76,75],[69,64,73,72]][bar%4]):cafe?Array.from({length:16},(_,bar)=>[[72,76,79,81],[77,81,84,79],[74,77,81,79],[71,74,77,67]][bar%4]):battle?Array.from({length:16},(_,bar)=>[[65,68,72,75],[73,72,68,65],[67,70,74,77],[72,67,64,60]][bar%4]):
   [[76,79,83,79],[74,71,69,67],[72,76,79,76],[77,76,72,69],[79,83,84,83],[79,74,71,69],[77,76,72,76],[74,71,67,null],[76,79,83,86],[83,79,74,71],[72,76,81,79],[77,76,72,null],[79,83,84,79],[74,79,83,81],[77,76,72,69],[71,74,67,null]];
  function drum(at,snare){
   const start=Math.round(at*rate),count=Math.floor(rate*.16);
   for(let i=0;i<count;i++){const t=i/rate,noise=Math.sin(i*127.1)*Math.sin(i*311.7),wave=snare?noise:Math.sin(2*Math.PI*(90-240*t)*t);
    data[(start+i)%data.length]+=wave*Math.exp(-t*30)*(snare?.075:.14);}
  }
  for(let bar=0;bar<16;bar++){
   const chord=chords[bar%chords.length],at=bar*4*beat;
   chord.forEach(n=>note(n,at,4.5*beat,omen?.04:.055,omen?'organ':'pad'));
   note(chord[0]-12,at,2.7*beat,.12,'pad');
   [0,2,1,3,0,2,1,3].forEach((n,i)=>note(chord[n]+12,at+i*.5*beat,.85*beat,.095,'pluck'));
   melody[bar].forEach((n,i)=>{if(n!==null)note(n,at+i*beat,(battle||omen?.9:1.7)*beat,battle?.095:omen?.075:.13,omen?'organ':battle?'brass':'bell');});
   if(battle||omen)for(let i=0;i<8;i++)drum(at+i*.5*beat,i%4===2);
   if(cafe){drum(at+beat,true);drum(at+3*beat,true);}
  }
  return result;
 }
 function wantedMode(){
  if(window.V3_INTRO?.active||document.hidden)return null;
  const cinema=window.V5_CINEMA?.state;
  if(cinema?.waitingReturn)return null;
  return cinema?.event==='gary'?'battle':cinema?.event==='banquet'?(cinema.music||'cafe'):'village';
 }
 function stop(){
  generation++;
  if(source){offset=(context.currentTime-startedAt+offset)%buffer.duration;offsets[sourceMode]=offset;source.stop();source.disconnect();source=null;}
  paint();
 }
 async function start(){
  const mode=wantedMode();
  if(!mode||!Audio||!enabled)return;
  if(source&&context.state==='running'&&sourceMode===mode)return;
  if(source)stop();
  const token=++generation;
  try{
   if(!context){context=new Audio();context.addEventListener('statechange',paint);}
   // Resume immediately inside the gesture; iOS may require a started buffer too.
   const resuming=context.resume();
   const unlock=context.createBufferSource();
   unlock.buffer=context.createBuffer(1,1,context.sampleRate);
   unlock.connect(context.destination);unlock.onended=()=>unlock.disconnect();unlock.start(0);
   await resuming;
   if(token!==generation||!enabled||source||mode!==wantedMode()){paint();return;}
   buffer=buffers[mode]||(buffers[mode]=compose(mode));sourceMode=mode;offset=offsets[mode];
   source=context.createBufferSource();source.buffer=buffer;source.loop=true;
   source.connect(context.destination);startedAt=context.currentTime;source.start(0,offset);startCount++;paint();
  }catch(error){console.warn('Music can be retried with the music button.',error);paint();}
 }
 button.addEventListener('click',()=>{
  if(enabled&&source&&context.state==='running'){enabled=false;stop();}
  else{enabled=true;start();}
  try{localStorage.setItem('village-music',enabled?'on':'off');}catch(_){}
  paint();
 });
 function gesture(event){if(!button.contains(event.target)&&!event.repeat)start();}
 // Capture sees joystick touches even when their handlers prevent default.
 document.addEventListener('pointerdown',gesture,{passive:true,capture:true});
 document.addEventListener('touchend',gesture,{passive:true,capture:true});
 document.addEventListener('click',gesture,{passive:true,capture:true});
 document.addEventListener('keydown',gesture);
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden){stop();if(context)context.suspend().catch(error=>console.warn('Could not pause music:',error));}
  else if(context&&enabled)start();
 });
 document.addEventListener('v3-intro-start',stop);
 document.addEventListener('v3-intro-end',start);
 const syncMusic=()=>{if(wantedMode())start();else stop();};
 document.addEventListener('v5-cinema-start',syncMusic);
 document.addEventListener('v5-cinema-shot',syncMusic);
 document.addEventListener('v5-cinema-end',syncMusic);
 window.addEventListener('pagehide',()=>{stop();if(context)context.suspend().catch(error=>console.warn('Could not suspend music:',error));});
 window.addEventListener('pageshow',()=>{if(context&&enabled)start();});
 window.V5_MUSIC={get state(){return {enabled,mode:source?sourceMode:null,playing:!!source&&context?.state==='running',startCount};}};
 paint();
})();
