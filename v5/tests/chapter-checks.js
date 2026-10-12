return async function checkChapter(page,{width=1280,height=900,touch=false,cinema=false,artifactDir}={}){
 const assert=(value,message)=>{if(!value)throw new Error(message);};
 const errors=[],failed=[],sceneEvidence=[],onError=e=>errors.push(e.message),onResponse=r=>{if(r.status()>=400)failed.push(r.url());};
 const gamePattern='**/v5/src/game.js*',cinemaPattern='**/v5/src/cinema.js*',sfxPattern='**/v5/src/sfx.js*';
 page.on('pageerror',onError);page.on('response',onResponse);
 await page.route(gamePattern,async route=>{
  const response=await route.fetch(),source=await response.text();
  await route.fulfill({response,body:source.replace('window.GAME={','window.GAME={test:{enterScene,position(x,y){player.x=x;player.y=y;resetInput();updateCamera();updateNearby();},walkPath(path){for(const p of path)move(p.x-player.x,p.y-player.y);resetInput();updateCamera();updateNearby();},tick(dt){update(dt);draw();},flightStep(dt,allowed=false){flight.update(dt,player,town,allowed);updateCamera();draw();},grab(){return flight.grab(player,town.id);}},')
   .replace('flight.update(dt,player,town,!unicorn.riding)','flight.update(dt,player,town,false)')});
 });
 await page.route(cinemaPattern,async route=>{
  const response=await route.fetch(),source=await response.text();
  await route.fulfill({response,body:source.replace('window.V5_CINEMA={','window.V5_CINEMA={test:{advance:advanceTime},')});
 });
 await page.route(sfxPattern,async route=>{
  const response=await route.fetch(),source=await response.text();
  await route.fulfill({response,body:source+"\nwindow.__pickupSounds=[];const originalPlay=V4_SFX.play;V4_SFX.play=kind=>{__pickupSounds.push(kind);return originalPlay(kind);};"});
 });
 await page.addInitScript(()=>{
  window.__storyDraws=[];window.__bubbleProbes=[];window.__garyFrames=[];window.__banquetFrames=[];
  const original=CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage=function(...args){
   if(this.canvas.id==='game'&&window.V5_CINEMA?.active){
    const entry={event:V5_CINEMA.state.event,shot:V5_CINEMA.state.shot,src:args[0].src||'',sx:args[1],sy:args[2],sw:args[3],sh:args[4],alpha:this.globalAlpha};
    if(!__storyDraws.some(d=>JSON.stringify(d)===JSON.stringify(entry)))__storyDraws.push(entry);
   }
   return original.apply(this,args);
  };
 });
 const activate=selector=>touch?page.locator(selector).tap():selector==='#interact'?page.keyboard.press('e'):page.locator(selector).click();
 async function screenshot(name){if(artifactDir)await page.screenshot({path:artifactDir+'\\world-chapter-'+name+'-'+width+'x'+height+'.png'});}
 async function walkTo(x,y){
  const route=await page.evaluate(({x,y})=>{
   const state=GAME.state,scene=SCENES[state.scene],step=4,w=Math.ceil(scene.width/step),h=Math.ceil(scene.height/step);
   const start=Math.round(state.player.y/step)*w+Math.round(state.player.x/step),goal=Math.round(y/step)*w+Math.round(x/step),parents=new Int32Array(w*h).fill(-1),queue=[start];parents[start]=start;
   for(let i=0;i<queue.length&&parents[goal]===-1;i++){
    const index=queue[i],a=index%w,b=Math.floor(index/w);
    for(const [nx,ny] of [[a+1,b],[a-1,b],[a,b+1],[a,b-1]]){
     const next=ny*w+nx;if(nx<0||ny<0||nx>=w||ny>=h||parents[next]!==-1||GAME.blocked(nx*step,ny*step))continue;
     parents[next]=index;queue.push(next);
    }
   }
   if(parents[goal]===-1)throw new Error('Unreachable '+state.scene+' '+x+','+y);
   const result=[];let cursor=goal;while(cursor!==parents[cursor]){result.push({x:cursor%w*step,y:Math.floor(cursor/w)*step});cursor=parents[cursor];}
   result.reverse();result.push({x,y});return result;
  },{x,y});
  await page.evaluate(route=>GAME.test.walkPath(route),route);
  assert(await page.evaluate(({x,y})=>Math.hypot(GAME.state.player.x-x,GAME.state.player.y-y)<2,{x,y}),'Collision-respecting path reaches '+x+','+y);
 }
 async function event(id){
  await page.waitForFunction(id=>V5_CINEMA.state.event===id&&!V5_CINEMA.state.loading,id);
  await page.waitForTimeout(80);await screenshot(id);
  const musicBefore=await page.evaluate(()=>V5_MUSIC.state);
  assert(await page.evaluate(()=>{
   const bubble=document.getElementById('story-bubble'),canvas=document.getElementById('game'),b=bubble.getBoundingClientRect(),c=canvas.getBoundingClientRect();
   return !document.getElementById('cinema-canvas')&&!document.getElementById('cinema-skip')&&!document.getElementById('cinema-next')&&
    !bubble.querySelector('img')&&getComputedStyle(document.getElementById('objective')).visibility==='hidden'&&
    (bubble.hidden||(b.left>=c.left&&b.right<=c.right&&b.top>=c.top&&b.bottom<=c.bottom&&parseFloat(getComputedStyle(bubble).fontSize)>=16));
  }),'Story stays on game canvas with bounded portrait-free bubbles and hidden HUD: '+id);
  if(id==='banquet'){
   await page.waitForFunction(()=>V5_MUSIC.state.playing&&V5_MUSIC.state.mode==='cafe');
   await page.evaluate(()=>document.getElementById('music-toggle').click());
   assert(await page.evaluate(()=>!V5_MUSIC.state.enabled&&!V5_MUSIC.state.playing),'Banquet respects music mute');
   const elapsed=await page.evaluate(()=>{
    Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));return V5_CINEMA.state.elapsed;
   });
   await page.waitForTimeout(100);
   assert(await page.evaluate(elapsed=>V5_CINEMA.state.elapsed===elapsed&&!V5_MUSIC.state.playing,elapsed),'Hidden tab pauses banquet timeline and sound');
   await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
   await page.waitForTimeout(100);
   assert(await page.evaluate(()=>!V5_MUSIC.state.enabled&&!V5_MUSIC.state.playing),'Returning to tab does not override mute');
   await page.evaluate(()=>document.getElementById('music-toggle').click());
   await page.waitForFunction(()=>V5_MUSIC.state.playing&&V5_MUSIC.state.mode==='cafe');
  }
  let guard=0;const natural=['gary','banquet'].includes(id)&&cinema,captured=new Set();
  while(await page.evaluate(id=>V5_CINEMA.state.event===id&&!V5_CINEMA.state.waitingReturn,id)){
   assert(++guard<1000,'Timed story completes '+id);
   await page.evaluate(natural=>{
    if(!natural)V5_CINEMA.test.advance(.17);GAME.test.tick(0);
    const state=V5_CINEMA.state;
    if(state.event==='gary'&&V5_CINEMA.catalog.gary.shots[state.shot].stage==='gary-wave')__garyFrames.push({wave:V5_CINEMA.catalog.gary.shots[state.shot].wave,enemies:state.enemies,smoke:state.smoke});
    if(state.event==='banquet')__banquetFrames.push({stage:V5_CINEMA.catalog.banquet.shots[state.shot].stage,scene:state.scene,actors:state.actors,music:V5_MUSIC.state});
    if(state.event==='recruit-ari'&&state.actors.some(a=>a.id==='jeff'&&a.id!==GAME.state.player.id))throw new Error('Joined Jeff reappeared during Ari recruitment');
    if(state.event==='recruit-stephanie'&&state.actors.some(a=>a.id==='mark'&&a.id!==GAME.state.player.id))throw new Error('Joined Mark reappeared during Stephanie recruitment');
    const bubble=document.getElementById('story-bubble'),box=bubble.getBoundingClientRect(),canvas=document.getElementById('game').getBoundingClientRect();
    if(V5_CINEMA.active&&!bubble.hidden)__bubbleProbes.push({event:V5_CINEMA.state.event,valid:box.left>=canvas.left-1&&box.right<=canvas.right+1&&box.top>=canvas.top-1&&box.bottom<=canvas.bottom+1,font:parseFloat(getComputedStyle(bubble).fontSize)});
   },natural);
   if(id==='gary'&&guard===12){
    await page.waitForTimeout(100);
    assert(await page.evaluate(()=>V5_MUSIC.state.enabled&&V5_MUSIC.state.mode==='battle'&&V5_MUSIC.state.playing),'Original battle music plays during Gary finale');
   }
   if(id==='gary'){
    const state=await page.evaluate(()=>V5_CINEMA.state);
    const marker=state.shot>=0?await page.evaluate(()=>V5_CINEMA.catalog.gary.shots[V5_CINEMA.state.shot]):null;
    const name=marker?.stage==='gary-wave'&&marker.wave===1&&state.age>1.5?'gary-rooftop':marker?.stage==='gary-wave'&&marker.wave===3&&state.age>2.8?'gary-blast':marker?.stage==='gary-drink'&&state.age>1?'gary-water':null;
    if(name&&!captured.has(name)){captured.add(name);sceneEvidence.push(await page.evaluate(name=>({name,age:V5_CINEMA.state.age,actor:V5_CINEMA.state.actors.find(a=>a.id==='gary'),scene:{width:SCENES.north.width,height:SCENES.north.height}}),name));await screenshot(name);}
   }
   if(id==='banquet'){
    const state=await page.evaluate(()=>V5_CINEMA.state);
    const stage=await page.evaluate(()=>V5_CINEMA.catalog.banquet.shots[V5_CINEMA.state.shot].stage);
    const name=stage==='banquet-party'&&state.age>2?'banquet-party':stage==='banquet-sky'&&state.age>2?'banquet-reactions':stage==='banquet-city'&&state.age>1?'banquet-'+state.scene:stage==='banquet-return'?'banquet-coco':null;
    if(name&&!captured.has(name)){captured.add(name);await screenshot(name);}
   }
   await page.waitForTimeout(natural?80:5);
  }
  assert(await page.evaluate(()=>!V5_CINEMA.state.error),'No story rendering failure '+id);
  if(!['gary','banquet','gathering'].includes(id)&&musicBefore.enabled){
   const after=await page.evaluate(()=>V5_MUSIC.state);
   assert(after.playing&&after.mode==='village'&&after.startCount===musicBefore.startCount,'Same music source continues without restarting during '+id);
  }
 }
 async function recruit(id){
  const place=await page.evaluate(id=>V4_STORY.locations[id],id);
  assert(await page.evaluate(()=>GAME.state.scene,place)===place.scene,'Recruit is in expected scene '+id);
  const spot=await page.evaluate(({x,y})=>[[x-35,y],[x,y+35],[x+35,y]].find(([a,b])=>!GAME.blocked(a,b)),place);
  assert(spot,'Clear recruit approach '+id);await walkTo(...spot);await activate('#interact');
  assert(await page.evaluate(id=>!V4_RPG.members[id].joined,id),'Locked until scene finishes '+id);
  await event('recruit-'+id);
  assert(await page.evaluate(id=>V4_RPG.members[id].joined&&V5_EVENTS.state.completed.includes('recruit-'+id),id),'One-shot recruit award '+id);
  assert(!await page.evaluate(id=>V5_EVENTS.encounter(id),id),'Recruit cannot repeat '+id);
 }
 try{
  await page.goto(page.url().split('/v5/')[0]+'/v5/');await page.waitForFunction(()=>GAME.ready&&V3_INTRO.state.ready);
  await activate('#intro-skip');await page.waitForFunction(()=>V5_CINEMA.state.event==='awakening'&&!V5_CINEMA.state.loading);
  const before=await page.evaluate(()=>GAME.state.player);await page.keyboard.press('Escape');await page.keyboard.press('Enter');await page.keyboard.press('Space');await page.keyboard.press('m');
  assert(await page.evaluate(before=>V5_CINEMA.state.event==='awakening'&&!GAME.state.menu&&GAME.state.player.x===before.x&&GAME.state.player.y===before.y,before),'Escape/Enter/Space cannot skip story or move hero');
  await event('awakening');
  assert(await page.evaluate(()=>V5_EVENTS.objective().includes('Find Connor')),'Opening objective preserved');
  assert(await page.evaluate(()=>GAME.test.enterScene('upstairs',[620,555])),'Hallway loads normally after awakening');
  await walkTo(239,206);await page.keyboard.press('e');await page.waitForFunction(()=>GAME.state.scene==='connorRoom');
  await event('connor');assert(await page.evaluate(()=>V4_RPG.members.connor.joined),'Connor joins');
  await activate('#open-menu');await activate('[data-member="connor"]');await activate('#menu-play');
  assert(await page.evaluate(()=>GAME.state.player.id==='connor'&&V5_EVENTS.state.protagonist==='coco'),'Playable switching retains Coco narrative');
  assert(await page.evaluate(()=>GAME.test.enterScene('house',[152,810])),'Downstairs loads after Connor');
  await event('family');assert(await page.evaluate(()=>V4_RPG.members.jason.joined&&V4_RPG.members.peachy.joined),'Parents awarded together');
  await event('montage');assert(await page.evaluate(()=>Object.values(V4_RPG.members).filter(m=>m.joined).length===4&&!V4_RPG.members.gary.joined),'Montage recruits nobody');
  assert(await page.evaluate(()=>__storyDraws.filter(d=>d.event==='montage'&&d.shot===1&&d.src.includes('chris-swim')).length>0&&__storyDraws.filter(d=>d.event==='montage'&&d.shot===1&&d.src.includes('chris-swim')).every(d=>Math.abs(d.alpha-.22)<1e-6)&&!__storyDraws.some(d=>d.event==='montage'&&d.shot===1&&d.src.includes('chris-surprised'))),'Chris hides underwater in montage, never shocked above water');
  assert(await page.evaluate(()=>V5_CINEMA.catalog.montage.duration===24),'Montage remains 24 seconds');
  await page.evaluate(()=>GAME.test.enterScene('hq',[200/724*1000,450/543*1000]));
  await walkTo(200,390);await activate('#interact');await event('gary-talk');
  assert(await page.evaluate(()=>!V4_RPG.members.gary.joined&&V4_STORY.actors('plaza',[],'coco').every(a=>a.id!=='gary')),'Gary talks only at HQ without early recruitment');
  await page.evaluate(()=>GAME.test.enterScene('neighborhood',[330/1254*1000,780/1254*1000]));
  for(const id of ['adam','brie','kate'])await recruit(id);
  assert(await page.evaluate(()=>V4_STORY.locations.brie.scene==='neighborhood'&&V4_STORY.locations.kate.scene==='neighborhood'),'Brie/Kate nearer Home');
  await page.evaluate(()=>GAME.test.enterScene('recreation',[80,125]));
  for(const id of ['jeff','ari','jaime','chris'])await recruit(id);
  assert(await page.evaluate(()=>__storyDraws.some(d=>d.event==='recruit-chris'&&d.src.includes('chris-swim')&&d.alpha===1)&&!__storyDraws.some(d=>d.event==='recruit-chris'&&d.src.includes('chris-surprised'))),'Chris swims normally when found');
  await walkTo(1125,360);await activate('#interact');await activate('#continue');
  assert(await page.evaluate(()=>V4_RPG.discoveries.dogs),'Dogs still found on northeast street');
  await walkTo(1145,470);
  assert(await page.evaluate(()=>GAME.state.companions.dogs.every(d=>d.hidden||!GAME.blocked(d.x,d.y,6,3))),'Followers remain collision-safe');
  await page.evaluate(()=>GAME.test.enterScene('rockband',[180,650]));
  for(const id of ['mark','stephanie'])await recruit(id);
  await page.evaluate(()=>GAME.test.enterScene('district',[700,966]));await recruit('vito');
  assert(await page.evaluate(()=>Object.values(V4_RPG.members).filter(m=>m.joined).length===14&&!V4_RPG.members.gary.joined),'Original fourteen unlocked; Gary excluded from rescue prerequisite');
  await page.evaluate(()=>GAME.test.enterScene('plaza',[500,844.7265625]));
  await event('gathering');assert(await page.evaluate(()=>!V4_RPG.members.gary.joined),'Gary stays locked during finale');
  await event('gary');
  const result=await page.evaluate(()=>V5_CINEMA.lastResult);
  assert(!cinema||(result.elapsed>=52&&result.elapsed<54),'Naturally timed desktop finale lasts the full authored sequence');
  assert(await page.evaluate(()=>new Set(__garyFrames.flatMap(f=>f.enemies.map(e=>e.id))).size===20&&new Set(__garyFrames.flatMap(f=>f.smoke)).size===20&&[0,1,2,3].every(wave=>Math.max(...__garyFrames.filter(f=>f.wave===wave).map(f=>f.enemies.length))===5)&&__garyFrames.every(f=>f.enemies.length<=5)),'Four actual five-dinosaur waves and twenty individual smoke disappearances rendered');
  assert(result.defeated===20&&['interact','talk','run','attack','unique','hurt','surprised','special','win','sit','drink'].every(p=>result.actions.includes(p)),'Gary defeats exactly twenty and uses supplied action variety');
  assert(await page.evaluate(()=>V4_RPG.members.gary.joined&&Object.values(V4_RPG.members).every(m=>m.joined)&&V5_EVENTS.state.chapter==='complete'),'Gary becomes fifteenth playable only at completion');
  assert(await page.evaluate(()=>__storyDraws.some(d=>d.src.includes('window-head'))&&__storyDraws.some(d=>d.event==='recruit-vito'&&d.sw===192)),'Actual window dinosaur and combined Vito artwork rendered');
  assert(await page.evaluate(()=>__bubbleProbes.every(p=>p.valid&&p.font>=16)),'Every sampled speech bubble stays in game bounds with readable type');
  await activate('#open-menu');await activate('[data-member="gary"]');await activate('#menu-play');await page.keyboard.press('x');
  assert(await page.evaluate(()=>GAME.state.player.id==='gary'&&GAME.state.powers.casts.some(c=>c.kind==='blaster')),'Gary playable through menu with native blaster');
  await page.waitForTimeout(750);
  const flight=await page.evaluate(()=>{
   __pickupSounds.length=0;const before=GAME.state.player,hp=V4_RPG.members[before.id].hp;
   for(let i=0;i<410;i++)GAME.test.flightStep(.05);
   if(__pickupSounds.includes('screech'))throw new Error('Idle flight screeched');
   if(!GAME.test.grab()||GAME.test.grab())throw new Error('Successful/rejected grab gating failed');
   const origin=GAME.state.flight.origin;
   for(let i=0;i<72;i++)GAME.test.flightStep(.05);
   return {origin,after:GAME.state.player,hp,afterHP:V4_RPG.members[before.id].hp,screeches:__pickupSounds.filter(k=>k==='screech').length,cooldown:GAME.test.grab()};
  });
  assert(flight.screeches===1&&!flight.cooldown&&flight.after.x===flight.origin.x&&flight.after.y===flight.origin.y&&flight.hp===flight.afterHP,'Pickup-only screech and exact harmless flight return preserved');
  await activate('#open-menu');await activate('[data-member="coco"]');await activate('#menu-play');await walkTo(768,785);
  const origin=await page.evaluate(()=>GAME.state.player);
  const diamond=await page.evaluate(()=>{
   const l=SCENES.plaza.landmarks.find(l=>l.id==='banquet'),box=document.getElementById('game').getBoundingClientRect(),v=GAME.state.viewport,c=GAME.state.camera;
   if(l.x!==768||l.y!==760||SCENES.plaza.landmarks.find(l=>l.id==='green').y!==562)throw new Error('New diamond must be on original plaza, separate from existing green');
   return {x:box.left+(l.x-c.x)*c.scale*box.width/v.width,y:box.top+(l.y-15-c.y)*c.scale*box.height/v.height};
  });
  if(touch)await page.touchscreen.tap(diamond.x,diamond.y);else await page.mouse.click(diamond.x,diamond.y);
  await event('banquet');await screenshot('banquet-ending');
  assert(await page.evaluate(()=>{
   const b=document.getElementById('story-continue').getBoundingClientRect(),c=document.getElementById('game').getBoundingClientRect();
   return b.left>=c.left&&b.right<=c.right&&b.top>=c.top&&b.bottom<=c.bottom&&b.height>=44;
  }),'Ending Continue button stays within canvas with a usable touch target');
  assert(await page.evaluate(()=>V5_CINEMA.state.waitingReturn&&V5_EVENTS.active&&!V5_EVENTS.state.completed.includes('banquet')&&!V5_MUSIC.state.playing),'End card freezes play and music until explicit Continue');
  assert(await page.evaluate(()=>new Set(__banquetFrames.filter(f=>f.stage==='banquet-city').map(f=>f.scene)).size===6&&__banquetFrames.some(f=>f.stage==='banquet-party'&&new Set(f.actors.map(a=>a.id)).size===15)&&__banquetFrames.some(f=>f.music.mode==='cafe'&&f.music.playing)&&__banquetFrames.some(f=>f.music.mode==='omen'&&f.music.playing)),'All fifteen partygoers, six real cities, cafe and dramatic playback');
  assert(await page.evaluate(()=>__banquetFrames.filter(f=>f.stage==='banquet-sky').some(f=>f.actors.every(a=>a.pose==='surprised'||a.direction==='up'))&&new Set(__storyDraws.filter(d=>d.event==='banquet'&&d.src.includes('effects/meteor')).map(d=>d.sx+','+d.sy)).size===6),'Actual shocked/upward poses and all six supplied meteor frames');
  await page.keyboard.press('Escape');assert(await page.evaluate(()=>V5_CINEMA.state.waitingReturn),'Escape cannot dismiss ending');
  if(touch)await activate('#story-continue');else await page.keyboard.press('Enter');
  assert(await page.evaluate(origin=>!V5_CINEMA.active&&GAME.state.scene==='plaza'&&GAME.state.player.id==='gary'&&GAME.state.player.x===origin.x&&GAME.state.player.y===origin.y&&!GAME.blocked(origin.x,origin.y)&&V5_EVENTS.state.completed.includes('banquet'),origin),'Continue resumes Gary at original, collision-safe plaza diamond');
  const endingResult=await page.evaluate(()=>V5_CINEMA.lastResult);
  assert(endingResult.endingAcknowledged&&(!cinema||(endingResult.elapsed>=48&&endingResult.elapsed<50)),'Full authored finale watched before ending acknowledgement');
  assert(!await page.evaluate(()=>V5_EVENTS.celebrate()),'Completed finale does not replay automatically');
  await activate('#help');await activate('#replay-intro');await activate('#intro-skip');
  assert(await page.evaluate(()=>!V5_CINEMA.active&&V5_EVENTS.state.chapter==='complete'&&Object.values(V4_RPG.members).every(m=>m.joined)),'Replay does not repeat or reset finale');
  assert(errors.length===0&&failed.length===0,'Chapter errors/assets: '+errors.concat(failed).join('; '));
  return {recruited:15,defeated:result.defeated,cities:6,width,height,touch,errors,failed,sceneEvidence,checks:['continuous recruitment music and no paired NPC reappearance','Chris hiding underwater versus normal swimming','same-canvas party with all fifteen and six city meteors','explicit ending/return as Gary at original plaza diamond','one-shot rewards, powers, dogs and pickup-only screech']};
 }finally{await page.unroute(gamePattern);await page.unroute(cinemaPattern);await page.unroute(sfxPattern);page.off('pageerror',onError);page.off('response',onResponse);}
};
