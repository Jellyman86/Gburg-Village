return async function checkChapter(page,{width=1280,height=900,touch=false,artifactDir}={}){
 const assert=(value,message)=>{if(!value)throw new Error(message);};
 const errors=[],failed=[],onError=e=>errors.push(e.message),onResponse=r=>{if(r.status()>=400)failed.push(r.url());};
 const pattern='**/v4/src/game.js*',sfxPattern='**/v4/src/sfx.js*';
 page.on('pageerror',onError);page.on('response',onResponse);
 await page.route(pattern,async route=>{
  const response=await route.fetch(),source=await response.text();
  const hook='window.GAME={test:{enterScene,face(direction){player.direction=direction;},walkPath(path){for(const point of path){move(point.x-player.x,point.y-player.y);}resetInput();updateCamera();updateNearby();},tick(dt){update(dt);draw();},flightStep(dt,allowed=false){flight.update(dt,player,town,allowed);updateCamera();draw();},grab(){return flight.grab(player,town.id);}},';
  await route.fulfill({response,body:source.replace('window.GAME={',hook).replace('flight.update(dt,player,town,!unicorn.riding)','flight.update(dt,player,town,false)')});
 });
 await page.route(sfxPattern,async route=>{
  const response=await route.fetch(),source=await response.text();
  await route.fulfill({response,body:source.replace('window.V4_SFX={','window.V4_SFX={test:{get voices(){return voices.size;},get audio(){return audio?.state;}},')+
   "\nwindow.__pickupSounds=[];const originalPlay=V4_SFX.play;V4_SFX.play=kind=>{__pickupSounds.push(kind);return originalPlay(kind);};"});
 });
 const activate=async selector=>touch?page.locator(selector).tap():page.locator(selector).click();
 async function screenshot(name){if(artifactDir)await page.screenshot({path:artifactDir+'\\chapter-'+name+'-'+width+'x'+height+'.png'});}
 async function walkTo(x,y){
  const route=await page.evaluate(({x,y})=>{
   const state=GAME.state,scene=SCENES[state.scene],step=6,w=Math.ceil(scene.width/step),h=Math.ceil(scene.height/step);
   const start=[Math.round(state.player.x/step),Math.round(state.player.y/step)],goal=[Math.round(x/step),Math.round(y/step)];
   const parents=new Int32Array(w*h).fill(-1),queue=[start[1]*w+start[0]];parents[queue[0]]=queue[0];
   for(let i=0;i<queue.length;i++){
    const index=queue[i],a=index%w,b=Math.floor(index/w);if(a===goal[0]&&b===goal[1])break;
    for(const [nx,ny] of [[a+1,b],[a-1,b],[a,b+1],[a,b-1]]){
     const next=ny*w+nx;
     if(nx<0||ny<0||nx>=w||ny>=h||parents[next]!==-1||GAME.blocked(nx*step,ny*step))continue;
     parents[next]=index;queue.push(next);
    }
   }
   let cursor=goal[1]*w+goal[0];if(parents[cursor]===-1)throw new Error('Unreachable '+state.scene+' destination '+x+','+y);
   const result=[];while(cursor!==parents[cursor]){result.push({x:cursor%w*step,y:Math.floor(cursor/w)*step});cursor=parents[cursor];}
   result.reverse();result.push({x,y});return result;
  },{x,y});
  await page.evaluate(route=>GAME.test.walkPath(route),route);
  assert(await page.evaluate(({x,y})=>Math.hypot(GAME.state.player.x-x,GAME.state.player.y-y)<2,{x,y}),'Collision-respecting walk reached '+x+','+y);
 }
 async function portal(id){
  const port=await page.evaluate(id=>SCENES[GAME.state.scene].landmarks.find(l=>l.id===id),id);
  await walkTo(port.x,port.y);
  if(touch)await activate('#interact');else await page.keyboard.press('e');
  await page.waitForFunction(scene=>GAME.ready&&GAME.state.scene===scene,port.to);
 }
 async function recruit(id){
  const place=await page.evaluate(id=>V4_STORY.locations[id],id);
  assert(await page.evaluate(scene=>GAME.state.scene===scene,place.scene),'Correct recruit scene '+id);
  const approach=await page.evaluate(({x,y})=>[[x-35,y],[x,y+35],[x+35,y],[x,y-35]].find(([a,b])=>!GAME.blocked(a,b)),place);
  assert(approach,'Recruit has room to stand: '+id);await walkTo(...approach);
  if(touch)await activate('#interact');else await page.keyboard.press('e');
  assert((await page.locator('#dialog-body').textContent()).includes('I will join you, Coco!'),'Classic joining dialogue '+id+': '+await page.locator('#dialog-body').textContent());
  assert(await page.evaluate(id=>!V4_RPG.members[id].joined,id),'Not unlocked until joining animation '+id);
  await activate('#continue');await page.waitForFunction(()=>!!GAME.state.joining);
  const before=await page.evaluate(()=>GAME.state.joining);await page.waitForTimeout(250);
  const during=await page.evaluate(()=>GAME.state.joining);
  assert(during&&Math.hypot(during.x-before.x,during.y-before.y)>0,'Friend walks into hero: '+id);
  await page.waitForFunction(id=>V4_RPG.members[id].joined&&!GAME.state.joining,id);
  assert(await page.evaluate(id=>GAME.state.actors.every(a=>a.id!==id),id),'Recruited NPC disappears: '+id);
 }
 try{
  await page.goto(page.url().split('/v4/')[0]+'/v4/');await page.waitForFunction(()=>GAME.ready&&V3_INTRO.state.ready);
  await activate('#intro-skip');
  assert((await page.locator('#dialog-body').textContent()).includes('That flash sure was scary!'),'Coco wake-up line after movie/skip');
  await activate('#continue');
  assert(await page.evaluate(()=>GAME.state.scene==='cocoRoom'&&GAME.state.player.id==='coco'&&Object.values(V4_RPG.members).filter(m=>m.joined).length===1),'Fresh story starts with only Coco');
  assert(await page.locator('#party button:visible').count()===1,'Toolbar shows only recruited characters');
  await page.keyboard.press('1');
  assert(await page.evaluate(()=>GAME.state.player.id==='coco'&&!GAME.select('jason')&&!V4_RPG.equipAbility('coco','jason').ok),'Keyboard/API/abilities cannot bypass rescue lock');
  await activate('#open-menu');await activate('[data-member="connor"]');
  assert(await page.locator('#menu-play').isDisabled(),'Unfound roster entry cannot Play as');
  assert((await page.locator('#menu-detail').textContent()).includes('next door'),'Useful locked-character location hint');
  assert(await page.evaluate(()=>{
   const r=V4_RPG;r.collectSword();r.members.connor.hp=30;
   return !r.useItem('connor','hamburger').ok&&!r.equip('connor','weapon','sword').ok&&!r.equipAbility('connor','coco').ok&&r.inventory.hamburger===3&&r.inventory.sword===1&&r.members.connor.hp===30&&r.members.connor.ability==='connor';
  }),'Model rescue locks preserve items, health, equipment and abilities');
  await activate('#tab-items');assert(await page.locator('[data-item="hamburger"]').isDisabled(),'Missing friend cannot use a burger even below full HP');
  await activate('#tab-equip');assert(await page.locator('[data-equip="sword"]').isDisabled(),'Missing friend cannot equip an available sword');
  await activate('#tab-abilities');assert(await page.locator('[data-ability="coco"]').isDisabled(),'Missing friend cannot equip a rescued ability');
  await activate('[data-member="coco"]');assert(await page.locator('[data-ability="jason"]').isDisabled(),'Unrescued native ability cannot be borrowed');
  await page.evaluate(()=>{V4_RPG.inventory.sword=0;V4_RPG.discoveries.sword=false;V4_RPG.members.connor.hp=V4_RPG.members.connor.maxHP;});
  await activate('#tab-party');
  await activate('#close-menu');await screenshot('coco-start');
  await portal('hall');await screenshot('hallway');await portal('connor-room');await recruit('connor');
  await portal('hall');await portal('downstairs');
  assert(await page.evaluate(()=>SCENES.house.width===724&&SCENES.house.height===543&&!GAME.blocked(235,350)&&!GAME.blocked(320,350)&&GAME.blocked(275,340)),'House artwork is half-scale; chairs passable, dining table solid');
  await recruit('peachy');await recruit('jason');await screenshot('house-scale');
  await walkTo(390,307.5);if(touch)await activate('#interact');else await page.keyboard.press('e');
  assert(await page.evaluate(()=>V4_RPG.inventory.sword===1),'Sword remains reachable in scaled house');await activate('#continue');
  await portal('to-neighborhood');await recruit('adam');await portal('to-recreation');
  await recruit('jeff');await recruit('ari');await recruit('jaime');
  await walkTo(533,650);await walkTo(533,720);await screenshot('open-pool-gate');await walkTo(295,725);await walkTo(292,860);await walkTo(358,932);
  assert(await page.evaluate(()=>[[358,810],[875,735],[700,790],[600,880]].every(([x,y])=>GAME.blocked(x,y))),'Pool gate traversable; lap, raised/main and smaller pool water stay blocked');
  await recruit('chris');await screenshot('pool-access');
  await portal('rockband-house');await recruit('mark');await recruit('stephanie');await screenshot('rockband-house');await portal('outside');
  await walkTo(1125,360);if(touch)await activate('#interact');else await page.keyboard.press('e');
  assert(await page.evaluate(()=>V4_RPG.discoveries.dogs),'Dogs found');await activate('#continue');
  const followed=await page.evaluate(()=>{
   const start=GAME.state.player,path=[];
   for(let y=start.y;y<=620;y+=4)path.push({x:1125,y});
   for(const point of path){GAME.test.walkPath([point]);GAME.test.tick(.04);}
   for(let i=0;i<120;i++)GAME.test.tick(.02);
   return {player:GAME.state.player,dogs:GAME.state.companions.dogs.map(d=>({...d,blocked:GAME.blocked(d.x,d.y)}))};
  });
  assert(followed.dogs.every(d=>!d.hidden&&Math.hypot(d.x-followed.player.x,d.y-followed.player.y)>=85&&!d.blocked),'Following dogs leave comfortable spacing and stay on street');
  assert(followed.dogs[1].y<followed.dogs[0].y,'Rosie trails farther behind than Barney');await screenshot('dog-followers');
  await activate('#open-menu');const dogsPaused=await page.evaluate(()=>GAME.state.companions);await page.waitForTimeout(180);
  assert(await page.evaluate(before=>JSON.stringify(GAME.state.companions)===JSON.stringify(before),dogsPaused),'Menu pauses both dog positions and breadcrumb trail');
  await activate('[data-member="connor"]');await activate('#menu-play');
  assert(await page.evaluate(before=>GAME.state.player.id==='connor'&&JSON.stringify(GAME.state.companions)===JSON.stringify(before),dogsPaused),'Switching the hero preserves dog positions and trail');
  await page.evaluate(()=>GAME.select('coco'));
  const corner=await page.evaluate(()=>{
   const rects=[{x:0,y:0,w:300,h:36},{x:264,y:0,w:36,h:300}];
   const blocked=(x,y,rx=6,ry=3)=>[[x-rx,y-ry],[x+rx,y-ry],[x-rx,y+ry],[x+rx,y+ry]].some(([a,b])=>!rects.some(r=>a>=r.x&&a<=r.x+r.w&&b>=r.y&&b<=r.y+r.h));
   const dogs=V4_COMPANIONS.create({blocked}),actor={x:30,y:18};dogs.enter(actor);
   for(let x=33;x<=282;x+=3){actor.x=x;dogs.update(.03,actor);}
   for(let y=21;y<=282;y+=3){actor.y=y;dogs.update(.03,actor);}
   for(let i=0;i<120;i++)dogs.update(.02,actor);
   return dogs.state.dogs.map(d=>({...d,blocked:blocked(d.x,d.y),distance:Math.hypot(d.x-actor.x,d.y-actor.y)}));
  });
  assert(corner.every(d=>!d.hidden&&!d.blocked&&d.x>275&&d.distance>=85),'Both dogs negotiate tight right-angle routes without cutting walls or crowding');
  await portal('to-neighborhood');await portal('to-district');assert(await page.evaluate(()=>GAME.state.companions.dogs.every(d=>d.hidden)),'Dogs safely emerge behind you after area change');
  await recruit('vito');await portal('to-plaza');await recruit('brie');await portal('to-north');await recruit('kate');
  assert(await page.evaluate(()=>Object.values(V4_RPG.members).every(m=>m.joined)&&V4_STORY.objective().startsWith('Everyone')),'All fourteen are actually findable and recruitable');
  await activate('#open-menu');await activate('[data-member="mark"]');await activate('#menu-play');
  assert(await page.evaluate(()=>GAME.state.player.id==='mark'),'Rescued friend playable through UI');
  const flightResult=await page.evaluate(()=>{
   window.__pickupSounds.length=0;
   for(let i=0;i<410;i++)GAME.test.flightStep(.05);
   if(__pickupSounds.includes('screech'))throw new Error('Idle/approaching bird must not screech');
   const before=GAME.state.player,hp=V4_RPG.members[before.id].hp;
   if(!GAME.test.grab())throw new Error('Eligible outdoor grab rejected');
   const origin=GAME.state.flight.origin;
   if(GAME.test.grab())throw new Error('Duplicate grab accepted');
   if(__pickupSounds.filter(kind=>kind==='screech').length!==1)throw new Error('Successful pickup must screech exactly once; rejected grabs stay quiet');
   for(let i=0;i<28;i++)GAME.test.flightStep(.05);
   return {before,hp,origin,overview:GAME.state.camera.scale,lift:GAME.state.flight.lift};
  });
  assert(flightResult.overview<.7&&flightResult.lift>200,'Pterodactyl lifts player and reveals zoomed-out map');await screenshot('flight-overview');
  await activate('#open-menu');const frozen=await page.evaluate(()=>GAME.state.flight.age);await page.waitForTimeout(180);
  assert(await page.evaluate(age=>GAME.state.flight.age===age,frozen),'Menu freezes flight safely');
  assert(await page.locator('#menu-play').isDisabled(),'No midair character swap');await activate('#close-menu');
  const dropped=await page.evaluate(()=>{
   GAME.test.flightStep(Math.max(0,2.5-GAME.state.flight.age));
   return GAME.state.flight;
  });
  assert(dropped.released&&dropped.fleeing&&dropped.visible&&dropped.lift<220&&dropped.bird.x>dropped.origin.x&&dropped.bird.y<dropped.origin.y-255,'Bird releases the hero, flies independently up and away while the hero drops');
  await screenshot('flight-drop');
  const landed=await page.evaluate(()=>{
   GAME.test.flightStep(Math.max(0,3.125-GAME.state.flight.age));
   const bounce={scale:GAME.state.camera.scale,lift:GAME.state.flight.lift};
   for(let i=0;i<12;i++)GAME.test.flightStep(.05);
   return {bounce,state:GAME.state,hp:V4_RPG.members[GAME.state.player.id].hp,again:GAME.test.grab()};
  });
  assert(landed.bounce.scale===1&&landed.bounce.lift>0,'Camera cuts back for a small landing bounce: '+JSON.stringify(landed.bounce));
  assert(!landed.state.flight.active&&landed.state.player.x===flightResult.origin.x&&landed.state.player.y===flightResult.origin.y&&landed.hp===flightResult.hp&&!landed.again,'Exact harmless return; second grab blocked by cooldown');
  assert(await page.evaluate(()=>__pickupSounds.filter(kind=>kind==='screech').length===1),'Drop, escape, landing and cooldown rejection never repeat the pickup screech');
  const cooldown=await page.evaluate(()=>{
   for(let i=0;i<380;i++)GAME.test.flightStep(.05);
   const early=GAME.test.grab();for(let i=0;i<25;i++)GAME.test.flightStep(.05);return {early,ready:GAME.test.grab()};
  });
  assert(!cooldown.early&&cooldown.ready,'At least twenty seconds between completed flights');
  await page.evaluate(()=>{for(let i=0;i<72;i++)GAME.test.flightStep(.05);});
  const flightGuards=await page.evaluate(()=>{
   let grabs=0,drops=0;const actor={id:'coco',x:1125,y:360},f=V4_FLIGHT.create({onGrab:()=>grabs++,onDrop:()=>drops++});
   f.enter('house',actor);f.update(21,actor,SCENES.house);
   const indoor=f.grab(actor,'house');
   f.enter('recreation',actor);const bird=f.state.bird;
   f.update(1,actor,SCENES.recreation,false);const suppressed=f.state.bird.x===bird.x&&f.state.bird.y===bird.y&&grabs===0;
   for(let i=0;i<80&&!f.state.active;i++)f.update(.05,actor,SCENES.recreation);
   const approached=f.state.active&&grabs===1;
   f.update(3.5,actor,SCENES.recreation);f.enter('house',actor);
   const preserved=f.state.cooldown===20;f.update(19.9,actor,SCENES.house);f.enter('recreation',actor);
   const early=f.grab(actor,'recreation');f.update(.2,actor,SCENES.recreation,false);const ready=f.grab(actor,'recreation');
   return {indoor,suppressed,approached,preserved,early,ready,drops};
  });
  assert(!flightGuards.indoor&&flightGuards.suppressed&&flightGuards.approached&&flightGuards.preserved&&!flightGuards.early&&flightGuards.ready&&flightGuards.drops===1,'Natural outdoor approach; no indoor/unicorn approach; cooldown survives scene changes');
  const retreatChecks=await page.evaluate(()=>{
   const check=(value,message)=>{if(!value)throw new Error(message);};
   const actor={id:'coco',x:600,y:600},town=SCENES.plaza;
   const f=V4_FLIGHT.create({onGrab:()=>{},onDrop:()=>{}});
   f.enter('plaza',actor);
   check(!f.scare({x:f.state.bird.x+151,y:f.state.bird.y}),'Far attacks do not frighten the bird');
   check(f.scare({x:f.state.bird.x+150,y:f.state.bird.y}),'Attacks within 150px scare the bird');
   const before=f.state.bird;f.update(.5,actor,town);
   check(f.state.visible&&f.state.fleeing&&f.state.bird.x>before.x&&f.state.bird.y<before.y,'Scared bird visibly flies away');
   check(!f.scare(actor)&&!f.grab(actor,'plaza'),'Retreat cannot be restarted or interrupted by a grab');
   f.update(.5,actor,town);
   check(!f.state.visible&&f.state.hiddenFor===10,'Hidden timer starts after departure, not before');
   f.enter('recreation',actor);f.update(9.99,actor,SCENES.recreation);
   check(!f.state.visible&&!f.grab(actor,'recreation'),'Hidden bird stays absent for full ten seconds across portals');
   f.update(.02,actor,SCENES.recreation,false);
   check(f.state.visible&&!f.state.fleeing,'Bird returns after ten hidden seconds');
   f.update(20,actor,town,false);check(f.grab(actor,'plaza'),'Bird can eventually lift again');
   f.update(2.5,actor,town);
   check(f.state.released&&f.state.fleeing&&f.state.lift<220,'Hero drops while bird retreats');
   f.update(.8,actor,town);
   check(!f.state.visible&&Math.abs(f.state.hiddenFor-10)<.0001,'Post-drop departure hides the bird for ten seconds');
   f.update(.2,actor,town);
   check(!f.state.active&&f.state.cooldown===20,'Landing doubles the old pickup cooldown');
   f.update(9.79,actor,town,false);check(!f.state.visible,'Post-drop absence lasts ten seconds');
   f.update(.02,actor,town,false);check(f.state.visible&&f.state.cooldown>9,'Visibility does not bypass pickup cooldown');
   return true;
  });
  assert(retreatChecks,'Exact scare radius, independent departure, ten-second disappearance and doubled pickup cooldown');
  await page.evaluate(async()=>{
   for(let i=0;i<230;i++)GAME.test.flightStep(.05);
   await GAME.test.enterScene('plaza',[500,844.7265625]);GAME.select('coco');
  });
  if(touch)await activate('#power');else await page.keyboard.press('x');
  assert(await page.evaluate(()=>GAME.state.flight.fleeing),'Real keyboard/touch attack scares nearby flying dinosaur');
  await activate('#open-menu');const retreatPaused=await page.evaluate(()=>GAME.state.flight);await page.waitForTimeout(180);
  assert(await page.evaluate(before=>JSON.stringify(GAME.state.flight)===JSON.stringify(before),retreatPaused),'Menu safely pauses escape and disappearance timers');await activate('#close-menu');
  await page.evaluate(()=>{for(let i=0;i<21;i++)GAME.test.tick(.05);});
  assert(await page.evaluate(()=>!GAME.state.flight.visible&&GAME.state.flight.hiddenFor>9),'Attack makes the flying dinosaur disappear, not just stop chasing');
  await page.evaluate(async()=>{
   for(let i=0;i<230;i++)GAME.test.flightStep(.05);
   await GAME.test.enterScene('plaza',[500,844.7265625]);GAME.select('connor');
   V4_RPG.equipAbility('connor','connor');
   const bird=GAME.state.flight.bird;
   GAME.test.walkPath([{x:bird.x-200,y:bird.y}]);
   GAME.test.face('right');
  });
  await page.keyboard.press('x');
  await page.waitForFunction(()=>GAME.state.flight.fleeing,null,{timeout:2000});
  assert(await page.evaluate(()=>GAME.state.powers.casts.some(c=>c.owner==='connor')),'A projectile reaching the bird also scares it');
  assert(await page.evaluate(async()=>await V4_SFX.play('pickup')&&V4_SFX.test.voices>0),'Sound effects actually schedule original Web Audio voices');
  await activate('#help');await activate('#sfx-toggle');
  assert(await page.evaluate(()=>!V4_SFX.enabled&&V4_SFX.test.voices===0),'Separate SFX mute cancels current and scheduled effects');await activate('#continue');
  await page.waitForFunction(()=>V4_SFX.test.audio==='suspended');
  assert(await page.evaluate(()=>V4_SFX.play('join'))===false,'Muted sound effects do not play');
  const dimensions=await page.evaluate(async()=>{
   const output=[];for(const id of ['trex','raptor','triceratops','pterodactyl']){
    const image=new Image();image.src='assets/dinosaurs/'+id+'.png';await image.decode();output.push({id,w:image.width,h:image.height});
   }return output;
  });
  assert(dimensions.every(d=>d.w===512&&d.h===1024),'Four supplied dinosaur atlases integrated, with consistent directional frames');
  assert(errors.length===0&&failed.length===0,'Chapter errors/failed assets: '+errors.concat(failed).join('; '));
  return {recruited:14,dinosaurs:dimensions,errors,failed,results:['Coco start; all rescue locks, dialogues, absorption animations and playability','Actual collision-respecting routes through bedrooms/hall/stairs, scaled house, pool gate and Rock Band entrance','All 13 friends found across connected scenes; dogs follow with spacing and safe transitions','Pterodactyl drop/independent escape, 10s disappearance, nearby keyboard/touch/projectile scare and >=20s pickup cooldown; separate SFX mute']};
 }finally{await page.unroute(pattern);await page.unroute(sfxPattern);page.off('pageerror',onError);page.off('response',onResponse);}
};
