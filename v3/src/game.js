(() => {
 'use strict';
 const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d',{alpha:false});
 let town=window.TOWN; const characters=window.CHARACTERS,ids=Object.keys(characters);
 const sceneImages={},sceneOverlays={},scenes=window.SCENES; let changing=false;
 const keys=new Set(),sheets={},portraits={},buttons={},camera={x:0,y:0};
 const player={...town.spawn,id:'jason',direction:'down',frame:1,moving:false,running:false,clock:0};
 const visitorSpawns={stephanie:{x:304,y:375},mark:{x:906,y:375},adam:{x:568,y:555},kate:{x:768,y:562},brie:{x:465,y:825},vito:{x:1167,y:780}};
 const family=ids.map((id,i)=>({id,...(visitorSpawns[id]||{x:town.spawn.x+(i-1.5)*42,y:town.spawn.y+34}),direction:'down',frame:1}));
 let loaded=false,previous=0,toastTimer=0,nearest=null,joyId=null,runId=null,joy={x:0,y:0},touchRun=false,background;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function updateCamera(){camera.x=Math.round(clamp(player.x-canvas.width/2,0,Math.max(0,town.width-canvas.width)));camera.y=Math.round(clamp(player.y-canvas.height*.57,0,Math.max(0,town.height-canvas.height)));}
 function resize(){
  const r=canvas.getBoundingClientRect(),scale=r.width<600?1.35:r.height<350?1.5:1.8;
  canvas.width=Math.max(200,Math.round(r.width/scale));canvas.height=Math.max(140,Math.round(r.height/scale));
  ctx.imageSmoothingEnabled=false;updateCamera();
 }
 new ResizeObserver(resize).observe($('stage'));
 const touch=()=>document.body.classList.add('touch');
 if(navigator.maxTouchPoints>0||matchMedia('(pointer:coarse)').matches)touch();
 window.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')touch();},{passive:true});
 function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2400);}
 function resetInput(){keys.clear();joy={x:0,y:0};joyId=null;runId=null;touchRun=false;$('stick').style.transform='';$('run').classList.remove('active');player.moving=false;player.running=false;player.clock=0;player.frame=1;}
 document.addEventListener('v3-intro-start',resetInput);document.addEventListener('v3-intro-end',resetInput);
 window.addEventListener('blur',resetInput);document.addEventListener('visibilitychange',()=>{if(document.hidden)resetInput();previous=0;});
 function select(id){if(!characters[id])return;player.id=id;player.frame=1;player.clock=0;for(const key of ids)buttons[key].setAttribute('aria-pressed',String(key===id));buttons[id].scrollIntoView({block:'nearest',inline:'nearest'});paintPower();$('status').textContent=characters[id].name+' · Ready for a walk';canvas.focus({preventScroll:true});}
 ids.forEach((id,i)=>{
  const button=document.createElement('button');button.className='character-button';button.dataset.character=id;
  button.setAttribute('aria-label','Play as '+characters[id].name);button.setAttribute('aria-pressed',String(i===0));
  const portrait=document.createElement('canvas');portrait.width=48;portrait.height=56;portrait.setAttribute('aria-hidden','true');
  const name=document.createElement('span');name.textContent=characters[id].name;
  const shortcut=document.createElement('small');shortcut.textContent=(i+1)%10;
  button.append(portrait,name,shortcut);button.addEventListener('click',()=>select(id));$('party').append(button);portraits[id]=portrait;buttons[id]=button;
 });
 function blocked(x,y,rx=8,ry=4){const b=town.bounds;if(x-rx<b.left||x+rx>b.right||y-ry<b.top||y+ry>b.bottom)return true;if(town.walkable){for(const [px,py] of [[x-rx,y-ry],[x+rx,y-ry],[x-rx,y+ry],[x+rx,y+ry]])if(!town.walkable.some(o=>px>=o.x&&px<=o.x+o.w&&py>=o.y&&py<=o.y+o.h)&&!(town.walkableEllipses||[]).some(o=>((px-o.x)/o.rx)**2+((py-o.y)/o.ry)**2<=1))return true;}if((town.blockedEllipses||[]).some(o=>((x-o.x)/(o.rx+rx))**2+((y-o.y)/(o.ry+ry))**2<1))return true;return town.obstacles.some(o=>x+rx>o.x&&x-rx<o.x+o.w&&y+ry>o.y&&y-ry<o.y+o.h);}
 let unicorn=window.FAMILY_UNICORN.create({blocked});
 function move(dx,dy){
  // Small steps prevent tunneling through scenery at run speed or on slow devices.
  const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/3));
  const rx=unicorn.riding?14:8,ry=unicorn.riding?7:4;
  for(let i=0;i<steps;i++){if(!blocked(player.x+dx/steps,player.y,rx,ry))player.x+=dx/steps;if(!blocked(player.x,player.y+dy/steps,rx,ry))player.y+=dy/steps;}
 }

 // A tiny pixel T-rex plays tag: short chases, long rests, no damage.
 const dinoHomes={north:{x:923,y:408},plaza:{x:910,y:370},district:{x:1850,y:1050},neighborhood:{x:305,y:700},recreation:{x:680,y:460},house:{x:780,y:720}};
 const dinosaurs=Object.fromEntries(Object.entries(dinoHomes).map(([id,h])=>[id,{...h,facing:1,clock:0,stars:0,mode:'wander',timer:7,target:null,turnTimer:0,moving:false,stunned:0}]));
 let dinoHome=dinoHomes.plaza,dino=dinosaurs.plaza;
 let powers; function makePowers(){return window.FAMILY_POWERS.create({blocked,getTarget:()=>dino,getActor:()=>player,onHit:()=>{
  dino.stunned=2;dino.mode='wander';dino.timer=6;dino.target=null;dino.moving=false;toast('Dazed for 2 seconds! Make your getaway.');
 }});} powers=makePowers();
 const powerButton=$('power'),powerLabel=$('power-label'),powerHint=$('power-hint');
 function paintPower(){
  const power=window.FAMILY_POWERS.definitions[player.id];powerButton.hidden=!power;
  if(!power)return;
  const remaining=powers.cooldown(player.id),ready=remaining===0;
  powerButton.disabled=!loaded||!ready||$('dialog').open;
  powerLabel.textContent=power.label;powerHint.textContent=ready?'X · Ready':remaining.toFixed(1)+'s';
  powerButton.setAttribute('aria-label',characters[player.id].name+': '+power.name+(ready?'. Ready.':'. Recharging.'));
 }
 function activatePower(){
  if(!loaded||window.V3_INTRO?.active||$('dialog').open)return false;
  const used=powers.activate({...player,powerHeight:unicorn.riding?20:0});
  if(used){toast(window.FAMILY_POWERS.definitions[player.id].name+'!');paintPower();}
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
   break;
  }
  if(!dino.moving)dino.turnTimer=0;
  if(dino.moving)dino.clock+=dt*(dino.mode==='chase'?13:7);
 }
 function drawDino(){
  const stride=Math.floor(dino.clock)%4,bob=dino.moving&&stride%2?1:0;
  ctx.save();ctx.translate(Math.round(dino.x),Math.round(dino.y));
  ctx.fillStyle='#182b3655';ctx.beginPath();ctx.ellipse(0,0,17,5,0,0,Math.PI*2);ctx.fill();
  if(dino.mode==='chase'){
   ctx.fillStyle='#ffde87';ctx.font='bold 14px system-ui';ctx.textAlign='center';ctx.fillText('!',0,-48);
  }
  if(dino.stunned>0){ctx.fillStyle='#ffdf79';ctx.font='bold 11px system-ui';ctx.textAlign='center';for(let i=0;i<3;i++){const a=dino.stars*5+i*Math.PI*2/3;ctx.fillText('✦',Math.cos(a)*15,-49+Math.sin(a)*5);}}
  ctx.scale(dino.facing,1);ctx.translate(-24,-42-bob);
  // Pixel blocks keep the silhouette crisp at the game's native resolution.
  const rect=(color,x,y,w,h)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
  const outline='#244b3b',green='#6fae52',light='#a6cf69',shade='#4b873f';
  rect(outline,26,2,19,3);rect(outline,23,5,26,17);
  rect(green,26,5,19,14);rect(light,29,5,16,4);
  rect(green,45,10,6,9);rect(outline,48,10,3,12);
  rect(outline,36,21,15,3);rect(light,36,18,12,3);
  rect('#fff3cc',38,8,6,6);rect('#17383b',41,8,3,4);
  rect(outline,17,17,19,20);rect(green,20,16,16,20);
  rect(light,29,23,7,13);rect(shade,17,24,9,12);
  rect(outline,5,28,15,9);rect(green,8,28,12,6);
  rect(outline,2,24,6,9);rect(green,5,25,3,5);
  rect(shade,14,20,5,6);rect(light,18,16,4,5);
  rect(outline,33,26,9,4);rect(green,33,25,7,3);
  const a=dino.moving?[0,3,0,-3][stride]:0;
  rect(outline,19+a,34,6,8);rect(shade,20+a,34,4,6);rect(outline,19+a,40,10,3);
  rect(outline,29-a,34,6,8);rect(green,30-a,34,4,6);rect(outline,29-a,40,10,3);
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

 function updateNearby(){
  nearest=town.landmarks.filter(l=>Math.hypot(l.x-player.x,l.y-player.y)<l.radius).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0]||null;
  const ride=town.id==='plaza'&&unicorn.nearby(player),mounted=unicorn.riding;
  $('nearby').hidden=!nearest&&!ride&&!mounted;
  const phone=document.body.classList.contains('touch');
  $('nearby-text').textContent=mounted?(phone?'Tap Off to hop down':'Unicorn ride · Hop off when you like'):ride?(phone?'A unicorn! Tap Ride':'A unicorn! Hop on for a ride'):nearest?.name||'';
  $('interact').textContent=mounted?'Off':ride?'Ride':nearest?.to?'Go':'Look';$('interact').setAttribute('aria-label',mounted?'Dismount unicorn':ride?'Ride unicorn':nearest?'Look at '+nearest.name:'Look around');
 }
 function showDialog(title,body,tag='MARKET SQUARE'){resetInput();$('dialog-title').textContent=title;$('dialog-body').textContent=body;$('dialog-tag').textContent=tag;if(!$('dialog').open)$('dialog').showModal();paintPower();}
 function interact(){
  if(!loaded||changing||window.V3_INTRO?.active||$('dialog').open)return;updateNearby();
  if(nearest?.to){if(unicorn.riding){toast('Hop off the unicorn before entering another area.');unicorn.interact(player);return;} enterScene(nearest.to,nearest.arrival);return;}
  if(town.id==='plaza'&&(unicorn.riding||unicorn.nearby(player))){
   if(unicorn.interact(player)){resetInput();updateCamera();updateNearby();toast(unicorn.riding?'Unicorn ride! Run to gallop.':'Back on your feet. The unicorn will wait here.');}
   else toast('Find a little more space to hop on or off.');return;
  }
  if(nearest)showDialog(nearest.name,nearest.text);else toast('Walk toward a gold diamond to look around.');
 }
 $('help').addEventListener('click',()=>showDialog('A walk with the family','Move with WASD or the arrow keys. Hold Shift to run. Press E or Space near a gold diamond to look around. Swipe the character row to see everyone, or use 1–9 and 0 to switch. On a phone, drag the left joystick and hold Run with your other thumb. Landscape gives you a wider view. Everyone has a special power: tap the action button or press X. Short cooldowns let you use it often. Attacks can briefly startle Rex. Find the sparkling unicorn on a side path: walk close and tap Ride or press E to hop on. Run to gallop; tap Off or E to dismount. Powers work while riding too. Rex the dinosaur sometimes plays tag! Hold Run or Shift to outrun him. Getting tagged is harmless.','HOW TO PLAY'));
 const close=()=>{$('dialog').close();resetInput();canvas.focus({preventScroll:true});};
 $('close-dialog').addEventListener('click',close);$('continue').addEventListener('click',close);$('dialog').addEventListener('close',()=>{resetInput();canvas.focus({preventScroll:true});});
 const movementKeys=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight','ShiftLeft','ShiftRight'];
 window.addEventListener('keydown',e=>{if(e.ctrlKey||e.altKey||e.metaKey||$('dialog').open)return;if(movementKeys.includes(e.code)){e.preventDefault();keys.add(e.code);}if(['KeyE','Space'].includes(e.code)){e.preventDefault();if(!e.repeat)interact();}if(e.code==='KeyX'){e.preventDefault();if(!e.repeat)activatePower();}if(/^Digit[0-9]$/.test(e.code)&&!e.repeat){const digit=Number(e.code.slice(-1));select(ids[digit===0?9:digit-1]);}});
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
  canvas.focus({preventScroll:true});if(!loaded||$('dialog').open)return;
  const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*canvas.width/r.width+camera.x,y=(e.clientY-r.top)*canvas.height/r.height+camera.y;
  const target=town.landmarks.find(l=>Math.hypot(l.x-x,l.y-15-y)<23);
  if(target){if(Math.hypot(target.x-player.x,target.y-player.y)<target.radius){if(target.to)interact();else showDialog(target.name,target.text);}else toast('Walk closer to '+target.name+'.');}
 });
 function update(dt){
  if(!loaded||changing||window.V3_INTRO?.active||$('dialog').open)return;
  let x=joy.x+(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),y=joy.y+(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0);
  const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}
  const c=characters[player.id];player.running=touchRun||keys.has('ShiftLeft')||keys.has('ShiftRight');const oldX=player.x,oldY=player.y;
  if(length>.01){player.direction=Math.abs(x)>Math.abs(y)?(x>0?'right':'left'):(y>0?'down':'up');const speed=unicorn.riding?(player.running?280:170):(player.running?c.runSpeed:c.speed);move(x*speed*dt,y*speed*dt);}
  player.moving=Math.hypot(player.x-oldX,player.y-oldY)>.01;
  if(player.moving){player.clock+=dt*(player.running?c.runFPS:c.walkFPS);player.frame=Math.floor(player.clock)%4;}else{player.clock=0;player.frame=1;}
  unicorn.update(dt,player);powers.update(dt);updateDino(dt);if(town.id==='plaza')updateSquirrel(dt);paintPower();
  updateCamera();updateNearby();$('status').textContent=c.name+' · '+(unicorn.riding?(player.moving&&player.running?'Galloping':'Riding a unicorn'):player.moving?(player.running?'Running':'Walking'):'Taking it all in');$('area-label').textContent=town.id!=='plaza'?town.name:player.y<401?'CENTER POINT WAY':player.y<785?'THE GREEN':'THE PLAZA';
 }
 function sprite(actor,active){
  const c=characters[actor.id],x=Math.round(actor.x),y=Math.round(actor.y);
  ctx.fillStyle=active?'#182b365c':'#182b3645';ctx.beginPath();ctx.ellipse(x,y,actor.id==='coco'?10:13,4,0,0,Math.PI*2);ctx.fill();
  if(active){ctx.strokeStyle='#f9df89';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y+1,15,5,0,0,Math.PI*2);ctx.stroke();}
  const pose=active?powers.pose(actor):{lift:0,rotation:0},saddle=active&&unicorn.riding?20:0;
  if(saddle)unicorn.draw(ctx,actor);
  ctx.save();ctx.translate(x,y-30-saddle-pose.lift);ctx.rotate(pose.rotation);
  ctx.drawImage(sheets[actor.id],(pose.frame??actor.frame)*64,c.rows[pose.direction||actor.direction]*64,64,64,-c.foot.x,30-c.foot.y,64,64);ctx.restore();
  if(active)powers.drawActor(ctx,{...actor,y:actor.y-saddle});
 }
 function draw(){
  if(!loaded)return;ctx.fillStyle='#17383b';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.save();ctx.translate(-camera.x,-camera.y);ctx.drawImage(background,0,0,town.width,town.height);
  if(town.overlay&&sceneOverlays[town.id]){const o=town.overlay;ctx.drawImage(sceneOverlays[town.id],...o.source,o.x,o.y,o.w,o.h);}
  town.landmarks.forEach(l=>{ctx.fillStyle=nearest===l?'#ffeda6':'#eedba2';ctx.strokeStyle='#705b35';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(l.x,l.y-21);ctx.lineTo(l.x+5,l.y-15);ctx.lineTo(l.x,l.y-9);ctx.lineTo(l.x-5,l.y-15);ctx.closePath();ctx.fill();ctx.stroke();});
  powers.drawGround(ctx);
  const unicornActor=unicorn.state;
  (town.id==='plaza'?family.filter(a=>a.id!==player.id).concat(squirrel.active?squirrel:[],unicorn.riding?[]:unicornActor):[]).concat(dino,player).sort((a,b)=>a.y-b.y).forEach(a=>a===dino?drawDino():a===squirrel?drawSquirrel():a===unicornActor?unicorn.draw(ctx):sprite(a,a===player));powers.drawAir(ctx);ctx.restore();
 }
 function frame(time){const dt=previous?Math.min((time-previous)/1000,.05):0;previous=time;update(dt);draw();requestAnimationFrame(frame);}
 async function enterScene(id,arrival){
  if(changing||!scenes[id])return false;
  changing=true;resetInput();$('stage').classList.add('transitioning');
  const next=scenes[id];
  try{
   const img=sceneImages[id]||await loadImage(next.image);sceneImages[id]=img;
   if(next.overlay&&!sceneOverlays[id])sceneOverlays[id]=await loadImage(next.overlay.image);
   const old=town;town=next;
   const x=arrival[0]*town.width/1000,y=arrival[1]*town.height/1000;
   if(blocked(x,y)){town=old;throw new Error('The entrance needs more space.');}
   dinoHome=dinoHomes[id];dino=dinosaurs[id];
   background=img;Object.assign(player,{x,y,direction:'down',frame:1,clock:0});
   powers=makePowers();unicorn=window.FAMILY_UNICORN.create({blocked});squirrel.active=false;
   $('route-hint').textContent=town.hint;document.querySelector('.location small').textContent=town.id==='plaza'?'Market Square · Afternoon':town.name;nearest=null;updateCamera();updateNearby();toast(town.name);
   return true;
  }catch(error){toast('Could not open this area. Try again.');console.error(error);return false;}
  finally{changing=false;resetInput();$('stage').classList.remove('transitioning');canvas.focus({preventScroll:true});}
 }
 $('return-plaza').addEventListener('click',()=>{if($('dialog').open)$('dialog').close();enterScene('plaza',[50,84.47265625].map(v=>v*10));});
 function loadImage(path){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Could not load '+path));img.src=window.EMBEDDED_ASSETS?.[path]||path;});}
 Promise.all([loadImage(town.image).then(img=>{background=img;sceneImages.plaza=img;}),...ids.map(id=>loadImage(characters[id].sheet).then(img=>{sheets[id]=img;}))]).then(()=>{
  ids.forEach(id=>{const p=portraits[id].getContext('2d');p.imageSmoothingEnabled=false;p.drawImage(sheets[id],64,0,64,64,-8,-5,64,64);});
  loaded=true;$('loading').hidden=true;resize();updateNearby();paintPower();canvas.focus({preventScroll:true});
 }).catch(error=>{$('loading').innerHTML='';const message=document.createElement('b');message.textContent=error.message;const help=document.createElement('span');help.textContent='Extract the full ZIP, then open index.html or the standalone play.html.';$('loading').append(message,help);console.error(error);});
 resize();requestAnimationFrame(frame);
 // Read-only diagnostic state for repeatable browser checks.
 window.GAME={get ready(){return loaded&&!changing;},get state(){return{scene:town.id,player:{...player},actors:family.map(actor=>({...actor})),powers:powers.state,unicorn:unicorn.state,dinosaur:{...dino},squirrel:{...squirrel},camera:{...camera},nearest:nearest?.id||null,viewport:{width:canvas.width,height:canvas.height},dialog:$('dialog').open,input:{joy:{...joy},touchRun,keys:[...keys]}};},select,blocked};
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
