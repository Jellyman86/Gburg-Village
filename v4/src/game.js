(() => {
 'use strict';
 const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d',{alpha:false});
 let town=window.SCENES.cocoRoom; const characters=window.CHARACTERS,ids=Object.keys(characters);
 const sceneImages={},sceneOverlays={},scenes=window.SCENES; let changing=false;
 const keys=new Set(),sheets={},portraits={},buttons={},camera={x:0,y:0};
 const player={x:310,y:350,id:'coco',direction:'down',frame:1,moving:false,running:false,clock:0};
 let joining=null,pendingRecruit=null,storyStarted=false,viewScale=1;
 const arrivalPortals=new Set();
 const recreation=window.V4_RECREATION.create(),extraSheets={};
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
 document.addEventListener('v3-intro-start',resetInput);document.addEventListener('v3-intro-end',()=>{
  resetInput();
  if(!storyStarted){storyStarted=true;showDialog('Coco wakes up','That flash sure was scary! I should find Connor in the next room.','DINO HOUSE');}
 });
 document.addEventListener('v4-menu-open',resetInput);document.addEventListener('v4-menu-close',resetInput);
 document.addEventListener('v4-display-change',resetInput);
 document.addEventListener('v4-display-message',event=>toast(event.detail));
 window.addEventListener('blur',resetInput);document.addEventListener('visibilitychange',()=>{if(document.hidden)resetInput();previous=0;});
 function refreshParty(){for(const id of ids){buttons[id].hidden=!V4_RPG.members[id].joined;buttons[id].setAttribute('aria-pressed',String(player.id===id));}const objective=V4_STORY.objective();if($('objective').textContent!==objective)$('objective').textContent=objective;}
 function select(id){
  if(!characters[id])throw new Error('Unknown character: '+id);
  if(!V4_RPG.members[id].joined){toast('Find '+characters[id].name+' to add them to your party.');return false;}
  if(joining||pendingRecruit||flight.state.active){toast('Finish this moment before switching characters.');return false;}
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
 function blocked(x,y,rx=8,ry=4){const b=town.bounds;if(x-rx<b.left||x+rx>b.right||y-ry<b.top||y+ry>b.bottom)return true;if(town.walkable){for(const [px,py] of [[x-rx,y-ry],[x+rx,y-ry],[x-rx,y+ry],[x+rx,y+ry]])if(!town.walkable.some(o=>px>=o.x&&px<=o.x+o.w&&py>=o.y&&py<=o.y+o.h)&&!(town.walkableEllipses||[]).some(o=>((px-o.x)/o.rx)**2+((py-o.y)/o.ry)**2<=1))return true;}if((town.blockedEllipses||[]).some(o=>((x-o.x)/(o.rx+rx))**2+((y-o.y)/(o.ry+ry))**2<1))return true;return town.obstacles.some(o=>x+rx>o.x&&x-rx<o.x+o.w&&y+ry>o.y&&y-ry<o.y+o.h);}
 let unicorn=window.FAMILY_UNICORN.create({blocked});
 const companions=window.V4_COMPANIONS.create({blocked});
 companions.enter(player);
 const flight=window.V4_FLIGHT.create({onGrab:()=>{resetInput();V4_SFX.play('lift');toast('A pterodactyl lift! Enjoy the view; you will land safely.');},onDrop:()=>{resetInput();V4_SFX.play('land');toast('A soft landing! You are fine.');}});
 flight.enter(town.id,player);
 new ResizeObserver(resize).observe($('stage'));
 function move(dx,dy){
  // Small steps prevent tunneling through scenery at run speed or on slow devices.
  const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/3));
  const rx=unicorn.riding?14:8,ry=unicorn.riding?7:4;
  for(let i=0;i<steps;i++){if(!blocked(player.x+dx/steps,player.y,rx,ry))player.x+=dx/steps;if(!blocked(player.x,player.y+dy/steps,rx,ry))player.y+=dy/steps;}
 }

 // A tiny pixel T-rex plays tag: short chases, long rests, no damage.
 const dinoHomes={north:{x:923,y:408},plaza:{x:910,y:370},district:{x:1850,y:1050},neighborhood:{x:305,y:800},recreation:{x:680,y:460}};
 const dinoKinds={north:'raptor',plaza:'trex',district:'raptor',neighborhood:'triceratops',recreation:'trex'};
 const dinosaurs=Object.fromEntries(Object.entries(dinoHomes).filter(([id])=>!scenes[id].indoor).map(([id,h])=>[id,{...h,kind:dinoKinds[id],direction:'down',facing:1,clock:0,stars:0,mode:'wander',timer:7,target:null,turnTimer:0,moving:false,stunned:0}]));
 let dinoHome=null,dino=null;
 let powers; function makePowers(){return window.FAMILY_POWERS.create({blocked,getTarget:()=>dino,getActor:()=>player,getAbility:actor=>window.V4_RPG.members[actor.id].ability,getSwordImage:()=>extraSheets.sword,onHit:()=>{
  dino.stunned=2;dino.mode='wander';dino.timer=6;dino.target=null;dino.moving=false;V4_SFX.play('hit');toast('Dazed for 2 seconds! Make your getaway.');
 }});} powers=makePowers();
 const powerButton=$('power'),powerLabel=$('power-label'),powerHint=$('power-hint');
 function paintPower(){
  const power=window.FAMILY_POWERS.definitions[window.V4_RPG.members[player.id].ability];powerButton.hidden=!power;
  if(!power)return;
  const remaining=powers.cooldown(player.id),ready=remaining===0;
  powerButton.disabled=!loaded||!ready||$('dialog').open||window.V4_MENU.active||!!joining||flight.state.active;
  powerLabel.textContent=power.label;powerHint.textContent=ready?'X · Ready':remaining.toFixed(1)+'s';
  powerButton.setAttribute('aria-label',characters[player.id].name+': '+power.name+(ready?'. Ready.':'. Recharging.'));
 }
 function activatePower(){
  if(!loaded||joining||flight.state.active||window.V3_INTRO?.active||$('dialog').open||window.V4_MENU.active)return false;
  if(window.V4_RPG.members[player.id].ability==='sword'&&window.V4_RPG.members[player.id].equipment.weapon!=='sword'){
   toast('Equip the Japanese sword to use Sword slash.');return false;
  }
  const used=powers.activate({...player,powerHeight:unicorn.riding?20:0});
  if(used){const scared=flight.scare(player);V4_SFX.play('power');toast(scared?'The pterodactyl got scared and flew away!':window.FAMILY_POWERS.definitions[window.V4_RPG.members[player.id].ability].name+'!');paintPower();}
  return used;
 }
 powerButton.addEventListener('pointerdown',e=>{e.preventDefault();activatePower();canvas.focus({preventScroll:true});});
 powerButton.addEventListener('click',e=>{if(e.detail===0)activatePower();});
 function dinoRest(message){
  dino.mode='wander';dino.timer=14+Math.random()*12;dino.target=null;
  if(message)toast(message);
 }
 function updateDino(dt){
  dino.stars+=dt;
  if(dino.stunned>0){dino.stunned=Math.max(0,dino.stunned-dt);dino.moving=false;return;}
  dino.timer-=dt;dino.turnTimer-=dt;
  const distance=Math.hypot(player.x-dino.x,player.y-dino.y);
  if(dino.mode==='chase'){
   if(distance<23)dinoRest('Boop! Rex tagged you. Back to exploring!');
   else if(dino.timer<=0)dinoRest('Rex needs a breather. You escaped!');
  }else if(dino.timer<=0&&distance<185){
   dino.mode='chase';dino.timer=5+Math.random()*2;dino.target=null;
   toast('Rex wants to play tag! Hold Run to escape!');
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
  const speed=dino.mode==='chase'?158:68,step=speed*dt;
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
 function drawDino(){
  const stride=Math.floor(dino.clock)%4,row={down:0,left:1,right:2,up:3}[dino.direction]+(dino.moving?4:0);
  ctx.save();ctx.translate(Math.round(dino.x),Math.round(dino.y));
  ctx.fillStyle='#182b3655';ctx.beginPath();ctx.ellipse(0,0,17,5,0,0,Math.PI*2);ctx.fill();
  if(dino.mode==='chase'){
   ctx.fillStyle='#ffde87';ctx.font='bold 14px system-ui';ctx.textAlign='center';ctx.fillText('!',0,-90);
  }
  if(dino.stunned>0){ctx.fillStyle='#ffdf79';ctx.font='bold 11px system-ui';ctx.textAlign='center';for(let i=0;i<3;i++){const a=dino.stars*5+i*Math.PI*2/3;ctx.fillText('✦',Math.cos(a)*20,-90+Math.sin(a)*6);}}
  ctx.drawImage(extraSheets[dino.kind],stride*128,row*128,128,128,-64,-124,128,128);
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

 function landmarks(){return town.landmarks.filter(l=>(!l.pickup||!V4_RPG.discoveries[l.pickup])&&(l.id!=='dogs'||!V4_RPG.discoveries.dogs)).concat(V4_STORY.encounters(town.id));}
 function goThrough(portal){
  if(unicorn.riding){toast('Hop off the unicorn before entering another area.');return false;}
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
  if(!player.moving||unicorn.riding)return false;
  const portal=portals.find(l=>!arrivalPortals.has(l.id)&&(l.roads?l.roads.some(r=>crossesRoad(r,oldX,oldY,player.x,player.y)):Math.hypot(l.x-player.x,l.y-player.y)<=22));
  return portal?goThrough(portal):false;
 }
 function updateNearby(){
  nearest=landmarks().filter(l=>Math.hypot(l.x-player.x,l.y-player.y)<l.radius).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0]||null;
  const ride=town.id==='plaza'&&unicorn.nearby(player),mounted=unicorn.riding;
  $('nearby').hidden=!nearest&&!ride&&!mounted;
  const phone=document.body.classList.contains('touch');
  $('nearby-text').textContent=mounted?(phone?'Tap Off to hop down':'Unicorn ride · Hop off when you like'):ride?(phone?'A unicorn! Tap Ride':'A unicorn! Hop on for a ride'):nearest?.name||'';
  $('interact').textContent=mounted?'Off':ride?'Ride':nearest?.to?'Go':nearest?.pickup?'Take':nearest?.recruit?'Talk':'Look';$('interact').setAttribute('aria-label',mounted?'Dismount unicorn':ride?'Ride unicorn':nearest?.pickup?'Pick up '+window.V4_RPG.items[nearest.pickup].name:nearest?'Look at '+nearest.name:'Look around');
 }
 function showDialog(title,body,tag='MARKET SQUARE'){resetInput();$('dialog-title').textContent=title;$('dialog-body').textContent=body;$('dialog-tag').textContent=tag;$('world-actions').hidden=tag!=='HOW TO PLAY';if(!$('dialog').open)$('dialog').showModal();paintPower();}
 function interact(){
  if(!loaded||changing||joining||flight.state.active||window.V3_INTRO?.active||$('dialog').open||window.V4_MENU.active)return;updateNearby();
  if(nearest?.recruit){
   pendingRecruit=nearest.recruit;showDialog(characters[pendingRecruit].name,'I will join you, '+characters[player.id].name+'! Let us find everyone together.','A FRIEND FOUND');return;
  }
  if(nearest?.id==='dogs'){
   const result=V4_RPG.findDogs();
   if(result.ok){companions.enter(player,true);V4_SFX.play('dogs');showDialog('Barney and Rosie found!','You found Barney and Rosie on the northeast street! '+result.message,'DOG COMPANIONS');}
   else toast(result.message);updateNearby();return;
  }
  if(nearest?.to){if(unicorn.riding){toast('Hop off the unicorn before entering another area.');unicorn.interact(player);return;} goThrough(nearest);return;}
  if(nearest?.pickup){
   const result=window.V4_RPG.collectSword();
   if(result.ok){V4_SFX.play('pickup');showDialog('Japanese sword found!',result.message,'DINO HOUSE');}else toast(result.message);
   updateNearby();return;
  }
  if(town.id==='plaza'&&(unicorn.riding||unicorn.nearby(player))){
   if(unicorn.interact(player)){resetInput();updateCamera();updateNearby();toast(unicorn.riding?'Unicorn ride! Run to gallop.':'Back on your feet. The unicorn will wait here.');}
   else toast('Find a little more space to hop on or off.');return;
  }
  if(nearest)showDialog(nearest.name,nearest.text);else toast('Walk toward a gold diamond to look around.');
 }
 $('help').addEventListener('click',()=>showDialog('A walk with the family','Start as Coco and find Connor next door. Follow the objective hint and talk to friends at gold diamonds to recruit them. Party shows missing friends and their locations. Move with WASD or arrows; hold Shift to run. E or Space interacts. Follow gold road arrows toward the next area: the whole road exit triggers travel, so you do not need to hit a diamond. Passing sideways along a road exit does not travel. Indoor door diamonds still activate by walking over them. Click/tap any zone diamond or use E / Go as an alternative. Arrivals clear input and prevent immediate bounce-back. From Courts & Pool, go north on the northeast/right street for Main Street Home, or on the northwest/left street for Main Street shops. Home returns to shops/courts from its south-left/south-right roads. Rock Band is on the right/east street. Houses have no dinosaurs. Menu or M / Escape pauses the world for stats, items, equipment and one equipped ability. Play as switches to a rescued friend; 1–9 and 0 select the first ten once found. On a phone, drag the left joystick and hold Run with your other thumb. Landscape gives a wider view. Use X or the power button; short cooldowns let you use powers often. Find Barney and Rosie on the northeast recreation street and they will follow at a comfortable distance. The pool gate is open, but water stays blocked. A pterodactyl may lift you for a map view, then drop you safely at the same spot and fly away. Pickups are at least 20 seconds apart; he disappears for 10 seconds after flying away. Attack near him to scare him off for 10 seconds, too! Dinosaur tag is harmless. Find the sparkling unicorn in the plaza: E / Ride mounts, Run gallops, and E / Off dismounts. Dismount before travelling between areas. Powers work while riding. Sound effects have a separate mute below. This preview is session-only; reloading starts fresh.','HOW TO PLAY'));
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
 window.addEventListener('keydown',e=>{if(e.ctrlKey||e.altKey||e.metaKey||joining||flight.state.active||$('dialog').open||window.V4_MENU.active||window.V3_INTRO?.active)return;if(movementKeys.includes(e.code)){e.preventDefault();keys.add(e.code);}if(['KeyE','Space'].includes(e.code)){e.preventDefault();if(!e.repeat)interact();}if(e.code==='KeyX'){e.preventDefault();if(!e.repeat)activatePower();}if(/^Digit[0-9]$/.test(e.code)&&!e.repeat){const digit=Number(e.code.slice(-1));select(ids[digit===0?9:digit-1]);}});
 window.addEventListener('keyup',e=>keys.delete(e.code));
 const joyEl=$('joystick');
 function setJoy(e){const r=joyEl.getBoundingClientRect(),max=r.width*.34,dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,len=Math.hypot(dx,dy),ratio=len>max?max/len:1,x=dx*ratio,y=dy*ratio;$('stick').style.transform=`translate(${x}px,${y}px)`;joy=len<max*.18?{x:0,y:0}:{x:x/max,y:y/max};}
 joyEl.addEventListener('pointerdown',e=>{if(joyId!==null)return;e.preventDefault();joyId=e.pointerId;joyEl.setPointerCapture(e.pointerId);setJoy(e);});
 joyEl.addEventListener('pointermove',e=>{if(e.pointerId===joyId){e.preventDefault();setJoy(e);}});
 function endJoy(e){if(e.pointerId!==joyId)return;joyId=null;joy={x:0,y:0};$('stick').style.transform='';}
 ['pointerup','pointercancel','lostpointercapture'].forEach(type=>joyEl.addEventListener(type,endJoy));
 $('run').addEventListener('pointerdown',e=>{if(runId!==null)return;e.preventDefault();runId=e.pointerId;$('run').setPointerCapture(e.pointerId);touchRun=true;$('run').classList.add('active');});
 function endRun(e){if(e.pointerId!==runId)return;runId=null;touchRun=false;$('run').classList.remove('active');}
 ['pointerup','pointercancel','lostpointercapture'].forEach(type=>$('run').addEventListener(type,endRun));
 $('interact').addEventListener('click',interact);
 canvas.addEventListener('pointerdown',e=>{
  canvas.focus({preventScroll:true});if(!loaded||changing||joining||flight.state.active||$('dialog').open||window.V4_MENU.active||window.V3_INTRO?.active)return;
  const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*canvas.width/r.width/viewScale+camera.x,y=(e.clientY-r.top)*canvas.height/r.height/viewScale+camera.y;
  const target=landmarks().filter(l=>Math.hypot(l.x-x,l.y-15-y)<23).sort((a,b)=>Math.hypot(a.x-x,a.y-15-y)-Math.hypot(b.x-x,b.y-15-y))[0];
  if(target?.to){goThrough(target);return;}
  if(target){if(Math.hypot(target.x-player.x,target.y-player.y)<target.radius){if(target.pickup||target.recruit||target.id==='dogs')interact();else showDialog(target.name,target.text);}else toast('Walk closer to '+target.name+'.');}
 });
 function update(dt){
  if(!loaded||changing||window.V3_INTRO?.active||$('dialog').open||window.V4_MENU.active)return;
  if(joining){
   joining.age+=dt;const progress=Math.min(1,joining.age/.8),ease=progress*progress*(3-2*progress);
   const dx=player.x-joining.from.x,dy=player.y-joining.from.y;
   joining.x=joining.from.x+dx*ease;joining.y=joining.from.y+dy*ease;joining.frame=Math.floor(joining.age*8)%4;
   joining.direction=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
   if(progress===1){const result=V4_RPG.recruit(joining.id);joining=null;refreshParty();updateNearby();V4_SFX.play('join');toast(result.message);}
   paintPower();return;
  }
  if(flight.state.active){flight.update(dt,player,town);updateCamera();paintPower();return;}
  let x=joy.x+(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),y=joy.y+(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0);
  const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}
  const c=characters[player.id];player.running=touchRun||keys.has('ShiftLeft')||keys.has('ShiftRight');const oldX=player.x,oldY=player.y;
  if(length>.01){player.direction=Math.abs(x)>Math.abs(y)?(x>0?'right':'left'):(y>0?'down':'up');const speed=unicorn.riding?(player.running?280:170):(player.running?c.runSpeed:c.speed);move(x*speed*dt,y*speed*dt);}
  player.moving=Math.hypot(player.x-oldX,player.y-oldY)>.01;
  if(checkZoneCrossing(oldX,oldY))return;
  if(player.moving){player.clock+=dt*(player.running?c.runFPS:c.walkFPS);player.frame=Math.floor(player.clock)%4;}else{player.clock=0;player.frame=1;}
  unicorn.update(dt,player);powers.update(dt);if(dino)updateDino(dt);if(town.id==='plaza')updateSquirrel(dt);paintPower();
  if(town.id==='recreation')recreation.update(dt,player);
  companions.update(dt,player);
  for(const cast of powers.state.casts)flight.scare(cast);
  flight.update(dt,player,town,!unicorn.riding);refreshParty();
  updateCamera();updateNearby();$('status').textContent=c.name+' · '+(unicorn.riding?(player.moving&&player.running?'Galloping':'Riding a unicorn'):player.moving?(player.running?'Running':'Walking'):'Taking it all in');$('area-label').textContent=town.id!=='plaza'?town.name:player.y<401?'CENTER POINT WAY':player.y<785?'THE GREEN':'THE PLAZA';
 }
 function sprite(actor,active){
  const c=characters[actor.id],x=Math.round(actor.x),y=Math.round(actor.y);
  ctx.fillStyle=active?'#182b365c':'#182b3645';ctx.beginPath();ctx.ellipse(x,y,actor.id==='coco'?10:13,4,0,0,Math.PI*2);ctx.fill();
  if(active){ctx.strokeStyle='#f9df89';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y+1,15,5,0,0,Math.PI*2);ctx.stroke();}
  const pose=active?powers.pose(actor):{lift:0,rotation:0},saddle=active&&unicorn.riding?20:0;
  if(saddle)unicorn.draw(ctx,actor);
  const air=active?flight.view().lift:0;
  ctx.save();ctx.translate(x,y-30-saddle-pose.lift-air);ctx.rotate(pose.rotation);
  const row=c.rows[pose.direction||actor.direction]+(actor.moving?(c.walkRowOffset||0):0);
  ctx.drawImage(sheets[actor.id],(pose.frame??actor.frame)*64,row*64,64,64,-c.foot.x,30-c.foot.y,64,64);ctx.restore();
  if(active)powers.drawActor(ctx,{...actor,y:actor.y-saddle});
 }
 function draw(){
  if(!loaded)return;ctx.fillStyle='#17383b';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.save();ctx.scale(viewScale,viewScale);ctx.translate(-camera.x,-camera.y);
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
    if(!window.V4_RPG.discoveries[l.pickup])ctx.drawImage(extraSheets.swordIcon,l.x-16,l.y-34,32,32);
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
  powers.drawGround(ctx);
  const unicornActor=unicorn.state;
  const activity=town.id==='recreation'?recreation.actors(player):[];
  const ambient=V4_STORY.actors(town.id,activity).filter(a=>a.id!==joining?.id)
   .concat(activity.filter(a=>recreation.dogData[a.id]),companions.actors,town.id==='plaza'?(squirrel.active?[squirrel]:[]).concat(unicorn.riding?[]:[unicornActor]):[]);
  ambient.concat(dino?[dino]:[],joining?[joining]:[],player).sort((a,b)=>a.y-b.y).forEach(a=>{
   if(a===dino)drawDino();else if(a===squirrel)drawSquirrel();else if(a===unicornActor)unicorn.draw(ctx);
   else if(recreation.dogData[a.id]||a.swimming){
    const rows={down:0,left:1,right:2,up:3},row=a.swimming?({down:0,up:1,left:2,right:3})[a.direction]:rows[a.direction]+4;
    ctx.drawImage(a.swimming?extraSheets.swim:extraSheets[a.id],a.frame*64,row*64,64,64,Math.round(a.x)-32,Math.round(a.y)-60,64,64);
   }else{ctx.save();if(a===joining)ctx.globalAlpha=1-Math.max(0,(a.age-.6)/.2);sprite(a,a===player);ctx.restore();}
  });
  if(town.id==='recreation'&&(!V4_RPG.members.jeff.joined||!V4_RPG.members.ari.joined))recreation.drawBall(ctx);
  if(!town.indoor&&flight.state.visible){
   const bird=flight.state.bird,row={down:0,left:1,right:2,up:3}[bird.direction]+4;
   ctx.drawImage(extraSheets.pterodactyl,bird.frame*128,row*128,128,128,Math.round(bird.x)-64,Math.round(bird.y)-124,128,128);
  }
  powers.drawAir(ctx);ctx.restore();
 }
 function frame(time){const dt=previous?Math.min((time-previous)/1000,.05):0;previous=time;update(dt);draw();requestAnimationFrame(frame);}
 async function enterScene(id,arrival,direction='down'){
  if(changing||!scenes[id])return false;
  if(joining||pendingRecruit||flight.state.active){toast('Finish this moment before entering another area.');return false;}
  changing=true;resetInput();$('stage').classList.add('transitioning');
  const next=scenes[id];
  try{
   const img=sceneImages[id]||await loadImage(next.image);sceneImages[id]=img;
   if(next.overlay&&!sceneOverlays[id])sceneOverlays[id]=await loadImage(next.overlay.image);
   const old=town;town=next;
   const x=arrival[0]*town.width/1000,y=arrival[1]*town.height/1000;
   if(blocked(x,y)){town=old;throw new Error('The entrance needs more space.');}
   dinoHome=town.indoor?null:dinoHomes[id]||null;dino=town.indoor?null:dinosaurs[id]||null;
   background=img;Object.assign(player,{x,y,direction,frame:1,clock:0});
   arrivalPortals.clear();
   for(const portal of town.landmarks)if(portal.to&&nearPortal(portal,x,y))arrivalPortals.add(portal.id);
   powers=makePowers();unicorn=window.FAMILY_UNICORN.create({blocked});squirrel.active=false;
   companions.enter(player);flight.enter(id,player);V4_SFX.play('door');
   $('route-hint').textContent=town.hint;document.querySelector('.location small').textContent=town.id==='plaza'?'Market Square · Afternoon':town.name;nearest=null;updateCamera();updateNearby();toast(town.name);
   return true;
  }catch(error){toast('Could not open this area. Try again.');console.error(error);return false;}
  finally{changing=false;resetInput();$('stage').classList.remove('transitioning');canvas.focus({preventScroll:true});}
 }
 $('return-plaza').addEventListener('click',()=>{if($('dialog').open)$('dialog').close();enterScene('plaza',[50,84.47265625].map(v=>v*10));});
 function loadImage(path){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Could not load '+path));img.src=window.EMBEDDED_ASSETS?.[path]||path;});}
 Promise.all([loadImage(town.image).then(img=>{background=img;sceneImages.cocoRoom=img;}),...ids.map(id=>loadImage(characters[id].sheet).then(img=>{sheets[id]=img;})),
  ...Object.entries({...Object.fromEntries(Object.entries(recreation.dogData).map(([id,data])=>[id,data.sheet])),...Object.fromEntries(['trex','raptor','triceratops','pterodactyl'].map(id=>[id,'assets/dinosaurs/'+id+'.png'])),swim:'assets/characters/chris-swim.png',sword:'assets/items/sword-slash.png',swordIcon:window.V4_RPG.items.sword.image}).map(([id,path])=>loadImage(path).then(img=>{extraSheets[id]=img;}))
 ]).then(()=>{
  ids.forEach(id=>{const p=portraits[id].getContext('2d');p.imageSmoothingEnabled=false;p.drawImage(sheets[id],64,0,64,64,-8,-5,64,64);});
  loaded=true;$('loading').hidden=true;resize();updateNearby();paintPower();refreshParty();$('route-hint').textContent=town.hint;document.querySelector('.location small').textContent=town.name;canvas.focus({preventScroll:true});
 }).catch(error=>{$('loading').innerHTML='';const message=document.createElement('b');message.textContent=error.message;const help=document.createElement('span');help.textContent='Extract the full ZIP, then open index.html or the standalone play.html.';$('loading').append(message,help);console.error(error);});
 resize();requestAnimationFrame(frame);
 // Read-only diagnostic state for repeatable browser checks.
 window.GAME={get ready(){return loaded&&!changing;},get busy(){return !!joining||!!pendingRecruit||flight.state.active;},get state(){return{scene:town.id,player:{...player},actors:V4_STORY.actors(town.id,town.id==='recreation'?recreation.actors(player):[]),joining:joining&&{...joining},companions:companions.state,flight:flight.state,recreation:recreation.state,powers:powers.state,unicorn:unicorn.state,dinosaur:dino&&{...dino},squirrel:{...squirrel},camera:{...camera,scale:viewScale},nearest:nearest?.id||null,viewport:{width:canvas.width,height:canvas.height},dialog:$('dialog').open,menu:window.V4_MENU.active,input:{joy:{...joy},touchRun,keys:[...keys]}};},select,blocked};
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
 let enabled=true,context=null,buffer=null,source=null,offset=0,startedAt=0;
 try{enabled=localStorage.getItem('village-music')!=='off';}catch(_){}
 function paint(){
  const playing=!!source&&context.state==='running';
  button.textContent=!Audio?'Music unavailable':!enabled?'♫ Music: Off':playing?'♫ Music: On':'♫ Tap for music';
  button.setAttribute('aria-pressed',String(enabled));
  button.setAttribute('aria-label',!Audio?'Music is unavailable in this browser':playing?'Turn background music off':!enabled?'Turn background music on':'Start background music');
  button.disabled=!Audio;
 }
 function compose(){
  const rate=22050,beat=60/92,duration=16*4*beat;
  const result=context.createBuffer(1,Math.round(duration*rate),rate),data=result.getChannelData(0);
  function note(midi,at,length,volume,voice){
   const frequency=440*Math.pow(2,(midi-69)/12),start=Math.round(at*rate),count=Math.floor(length*rate);
   for(let i=0;i<count;i++){
    const t=i/rate,phase=2*Math.PI*frequency*t;
    const envelope=Math.min(1,t/.018)*Math.pow(1-i/count,2)*Math.exp(-t*(voice==='pad'?.3:2.4));
    const wave=Math.sin(phase)+(voice==='bell'?.24*Math.sin(phase*2):voice==='pluck'?.15*Math.sin(phase*3):0);
    data[(start+i)%data.length]+=wave*envelope*volume;
   }
  }
  const chords=[[48,52,55,59],[43,47,50,57],[45,48,52,55],[41,45,48,52],[48,52,55,59],[43,47,50,57],[41,45,48,52],[43,47,50,55]];
  const melody=[[76,79,83,79],[74,71,69,67],[72,76,79,76],[77,76,72,69],[79,83,84,83],[79,74,71,69],[77,76,72,76],[74,71,67,null],[76,79,83,86],[83,79,74,71],[72,76,81,79],[77,76,72,null],[79,83,84,79],[74,79,83,81],[77,76,72,69],[71,74,67,null]];
  for(let bar=0;bar<16;bar++){
   const chord=chords[bar%8],at=bar*4*beat;
   chord.forEach(n=>note(n,at,4.5*beat,.055,'pad'));
   note(chord[0]-12,at,2.7*beat,.12,'pad');
   [0,2,1,3,0,2,1,3].forEach((n,i)=>note(chord[n]+12,at+i*.5*beat,.85*beat,.095,'pluck'));
   melody[bar].forEach((n,i)=>{if(n!==null)note(n,at+i*beat,1.7*beat,.13,'bell');});
  }
  return result;
 }
 function stop(){
  if(source){offset=(context.currentTime-startedAt+offset)%buffer.duration;source.stop();source.disconnect();source=null;}
  paint();
 }
 async function start(){
  if(window.V3_INTRO?.active||!Audio||!enabled||document.hidden||(source&&context.state==='running'))return;
  try{
   if(!context){context=new Audio();context.addEventListener('statechange',paint);}
   // Resume immediately inside the gesture; iOS may require a started buffer too.
   const resuming=context.resume();
   const unlock=context.createBufferSource();
   unlock.buffer=context.createBuffer(1,1,context.sampleRate);
   unlock.connect(context.destination);unlock.onended=()=>unlock.disconnect();unlock.start(0);
   await resuming;
   if(!enabled||document.hidden||source){paint();return;}
   if(!buffer)buffer=compose();
   source=context.createBufferSource();source.buffer=buffer;source.loop=true;
   source.connect(context.destination);startedAt=context.currentTime;source.start(0,offset);paint();
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
  if(document.hidden){stop();if(context)context.suspend().catch(()=>{});}
  else if(context&&enabled)start();
 });
 document.addEventListener('v3-intro-start',stop);
 document.addEventListener('v3-intro-end',start);
 window.addEventListener('pagehide',()=>{stop();if(context)context.suspend().catch(()=>{});});
 window.addEventListener('pageshow',()=>{if(context&&enabled)start();});
 paint();
})();
