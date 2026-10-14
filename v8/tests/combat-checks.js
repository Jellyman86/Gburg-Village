// Inherited from the frozen V6 suite (v6/tests/combat-checks.js) and adapted to the V8 living version and its art manifest.
return async function checkCombat(page,{width,height,touch,artifactDir}={}){
 const assert=(value,message)=>{if(!value)throw new Error(message);};
 const errors=[],failed=[],results=[];
 const onError=e=>errors.push(e.message),onConsole=m=>{if(m.type()==='error')errors.push(m.text());},onResponse=r=>{if(r.status()>=400)failed.push(r.url());};
 page.on('pageerror',onError);page.on('console',onConsole);page.on('response',onResponse);
 const gamePattern='**/v8/src/game.js*';
 await page.route(gamePattern,async route=>{
  const response=await route.fetch(),source=await response.text();
  const hook=`window.GAME={test:{
   enterScene,
   position(x,y){if(blocked(x,y))throw new Error('Blocked test placement');Object.assign(player,{x,y});resetInput();updateCamera();updateNearby();},
   fixture(kind){const home={x:767,y:860};dino=dinosaurs.north=V6_COMBAT.init({...home,kind,clock:0,stars:0,direction:'right',facing:1,mode:'wander',timer:60,target:{x:767,y:860},turnTimer:60});dinoHome=home;extraEnemies.north=[];select('chris');powers=makePowers();combat.clearEffects();},
   approach(){const spot=[[dino.x-28,dino.y,'right'],[dino.x,dino.y+28,'up'],[dino.x+28,dino.y,'left'],[dino.x,dino.y-28,'down']].find(([x,y])=>!blocked(x,y));if(!spot)throw new Error('No attack approach');[player.x,player.y,player.direction]=spot;resetInput();updateCamera();updateNearby();}
  },`;
  await route.fulfill({response,body:source.replace('window.GAME={',hook).replace('flight.update(dt,player,town,!unicorn.riding)','flight.update(dt,player,town,false)')});
 });
 await page.addInitScript(()=>{
  window.__draws=[];window.__sounds=[];window.__endings=[];
  document.addEventListener('v5-cinema-end',e=>__endings.push(e.detail));
  const original=CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage=function(...args){
   if(this.canvas.id==='game'&&window.GAME&&!window.V5_CINEMA?.active){
    const src=args[0].src||'';
    if(src.includes('towel-whip')||src.includes('compy.png')||src.includes('/gimmicks/bus.png')||args[0].tagName==='CANVAS')__draws.push({src,sx:args[1],sw:args[3],canvas:args[0].tagName==='CANVAS'});
   }
   return original.apply(this,args);
  };
 });
 const activate=selector=>touch?page.locator(selector).tap():page.locator(selector).click();
 async function readyStory(id){await page.waitForFunction(id=>V5_CINEMA.state.event===id&&!V5_CINEMA.state.loading,id);}
 async function skip(id){
  await readyStory(id);
  assert(await page.evaluate(()=>document.getElementById('screen-mode').nextElementSibling.id==='cutscene-skip'),'Skip is adjacent to Expand');
  // The toolbar reflows when Skip un-hides; wait for a settled layout before measuring instead of sampling one frame.
  await page.waitForFunction(w=>{const b=document.getElementById('cutscene-skip').getBoundingClientRect();return b.height>=44&&b.x>=0&&b.x+b.width<=w;},width,{timeout:5000}).catch(()=>{});
  const box=await page.locator('#cutscene-skip').boundingBox();
  assert(box&&box.height>=44&&box.x>=0&&box.x+box.width<=width,'Touch-sized Skip remains within viewport');
  await activate('#cutscene-skip');
  await page.waitForFunction(id=>V5_CINEMA.state.event!==id,id);
  assert(await page.evaluate(id=>__endings.some(e=>e.event===id&&e.skipped),id),'Normal skipped completion recorded: '+id);
 }
 async function go(id){
  assert(await page.evaluate(async id=>{
   const portal=Object.values(SCENES).flatMap(s=>s.landmarks).find(p=>p.to===id&&p.arrival);
   if(!portal)throw new Error('Missing arrival for '+id);
   return GAME.test.enterScene(id,portal.arrival);
  },id),'Travel accepted: '+id);
 }
 try{
  await page.goto(page.url().split('/v8/')[0]+'/v8/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>GAME.ready&&V3_INTRO.state.ready);
  assert(await page.locator('#intro-expand').count()===1,'Opening has adjacent Expand control');
  await activate('#intro-skip');await readyStory('awakening');
  const authored=await page.evaluate(async()=>{
   const edits=await (await fetch('data/scene-edits.json')).json();
   return {events:Object.keys(edits.scenes||{}).length};
  });
  assert(authored.events>0,'Actual carried user authoring is loaded, not empty regression data');
  assert(await page.evaluate(()=>{
   Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));
   const rejected=!V5_CINEMA.skip()&&!V5_EVENTS.state.completed.includes('awakening');
   delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));return rejected;
  }),'Hidden-tab skip cannot award or advance a story');
  await page.locator('#cutscene-skip').focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>!V5_CINEMA.active);
  await go('connorRoom');await skip('connor');
  await go('house');await skip('family');await skip('montage');
  assert(await page.evaluate(()=>['connor','jason','peachy'].every(id=>V4_RPG.members[id].joined)),'Opening skips award family once');
  for(const id of ['jeff','ari','chris','jaime','mark','stephanie','adam','brie','vito','kate']){
   const scene=await page.evaluate(id=>V4_STORY.locations[id].scene,id);await go(scene);
   if(id==='vito')await page.evaluate(()=>{
    const p=V4_STORY.locations.vito,spot=[[p.x+28,p.y],[p.x-28,p.y],[p.x,p.y+28]].find(([x,y])=>!GAME.blocked(x,y));
    if(!spot)throw new Error('No Vito road approach');GAME.test.position(...spot);
   });
   assert(await page.evaluate(id=>V5_EVENTS.encounter(id),id),'Real rescue starts: '+id);
   await skip('recruit-'+id);
   assert(await page.evaluate(id=>V4_RPG.members[id].joined&&!V5_EVENTS.encounter(id),id),'One-time rescue award: '+id);
   if(id==='vito'){
    await page.waitForFunction(()=>GAME.state.gimmicks.seen&&GAME.state.gimmicks.active);
    await page.waitForTimeout(1500);
    assert(await page.evaluate(()=>__draws.some(d=>d.src.includes('/gimmicks/bus.png'))),'Supplied bus actually renders on Main Street');
   }
  }
  await go('plaza');await page.evaluate(()=>GAME.test.position(768,865));await skip('gathering');await skip('gary');
  assert(await page.evaluate(()=>V5_CINEMA.lastResult.defeated===20&&V4_RPG.members.gary.joined),'Gary skip accounts for twenty scripted defeats');
  assert(await page.evaluate(()=>GAME.state.combat.defeats===0&&GAME.state.enemies.every(e=>e.hp===e.maxHP)),'Scripted combat does not injure gameplay dinosaurs');
  await page.evaluate(()=>GAME.test.position(768,760));
  assert(await page.evaluate(()=>V5_EVENTS.celebrate()),'Banquet starts through normal story guard');
  await skip('banquet');
  assert(await page.evaluate(()=>V5_CINEMA.lastResult.endingAcknowledged&&GAME.state.player.id==='gary'&&!GAME.blocked(GAME.state.player.x,GAME.state.player.y)&&!V5_CINEMA.skip()&&!V5_EVENTS.celebrate()),'Banquet skip acknowledges ending, safely returns as Gary and cannot reaward');
  results.push('Actual user edits; keyboard/touch skip; all fifteen recruits; Gary twenty; safe banquet return; scripted/gameplay isolation');
  for(const id of ['north','plaza','district','neighborhood','recreation']){
   await go(id);assert(await page.evaluate(()=>GAME.state.enemies.every(e=>!GAME.blocked(e.x,e.y))),'All species spawn safely: '+id);
  }
  await go('north');
  assert(await page.evaluate(()=>GAME.state.gimmicks.seen&&!GAME.state.gimmicks.active),'Real Main Street gag remains seen after changing areas');
  await page.evaluate(()=>{const original=V4_SFX.play;V4_SFX.play=kind=>{__sounds.push(kind);return original(kind);};GAME.test.fixture('compy');GAME.test.approach();});
  await activate('#power');
  await page.waitForFunction(()=>GAME.state.dinosaur.hp===0);
  assert(await page.evaluate(()=>GAME.state.combat.effects.some(e=>e.type==='number')),'Damage numbers appear on hit');
  await page.waitForFunction(()=>GAME.state.dinosaur.hidden&&GAME.state.combat.effects.some(e=>e.type==='smoke'));
  await page.waitForTimeout(400);
  assert(await page.evaluate(()=>__draws.some(d=>d.src.includes('compy.png'))&&__draws.some(d=>d.canvas)&&new Set(__draws.filter(d=>d.src.includes('towel-whip')).map(d=>d.sx)).size>=5),'Actual compy, white hit mask and animated supplied towel render');
  assert(await page.evaluate(()=>__sounds.includes('hurt-compy')&&__sounds.includes('puff')&&__sounds.includes('whip')),'Species hurt, puff and towel sound cues');
  await activate('#help');await activate('#damage-numbers');
  assert(await page.evaluate(()=>!V6_SETTINGS.values.damageNumbers&&!GAME.state.combat.showNumbers),'UI turns damage numbers off');
  await activate('#continue');
  await page.evaluate(()=>{GAME.test.fixture('raptor');GAME.test.approach();});
  await activate('#power');await page.waitForFunction(()=>GAME.state.dinosaur.hp<GAME.state.dinosaur.maxHP);
  assert(await page.evaluate(()=>!GAME.state.combat.effects.some(e=>e.type==='number')),'Damage still works with numbers disabled');
  await activate('#open-menu');
  const paused=await page.evaluate(()=>GAME.state.combat.effects);await page.waitForTimeout(200);
  assert(JSON.stringify(paused)===JSON.stringify(await page.evaluate(()=>GAME.state.combat.effects)),'Menu pauses impact timers');
  await activate('#close-menu');
  for(const kind of ['trex','triceratops','pterodactyl']){
   await page.evaluate(kind=>GAME.test.fixture(kind),kind);
   for(let attempts=0;await page.evaluate(()=>GAME.state.dinosaur.alive);attempts++){
    assert(attempts<9,'Dinosaur can be defeated: '+kind);
    await page.waitForFunction(()=>!document.getElementById('power').disabled);
    await page.evaluate(()=>GAME.test.approach());await activate('#power');await page.waitForTimeout(130);
   }
   await page.waitForFunction(()=>GAME.state.dinosaur.hidden);
   assert(await page.evaluate(()=>!GAME.blocked(GAME.state.dinosaur.x,GAME.state.dinosaur.y)),'Defeat movement stays walkable: '+kind);
   assert(await page.evaluate(kind=>__sounds.includes('hurt-'+kind),kind),'Distinct species cue: '+kind);
  }
  await go('plaza');await go('north');
  assert(await page.evaluate(()=>GAME.state.dinosaur.hidden&&GAME.state.dinosaur.hp===0),'Defeat persists across map visits');
  await activate('#help');await activate('#bus-gag');await activate('#continue');
  assert(await page.evaluate(()=>!V6_SETTINGS.values.busGag),'Bus is removable via Help');
  await page.evaluate(()=>{GAME.select('chris');V4_RPG.members.chris.hp=V4_RPG.stats('chris').maxHP-60;});
  const hp=await page.evaluate(()=>V4_RPG.members.chris.hp);
  await activate('#open-menu');await activate('#tab-items');
  const burger=page.locator('#menu-detail img[src*="hamburger.png"]');await burger.waitFor();
  assert(await burger.evaluate(async img=>{await img.decode();return img.naturalWidth===64;}),'Supplied hamburger artwork loads in inventory');
  const count=await page.evaluate(()=>V4_RPG.inventory.hamburger);
  await page.locator('[data-item="hamburger"]').click();
  assert(await page.evaluate(({hp,count})=>V4_RPG.members.chris.hp===hp+50&&V4_RPG.inventory.hamburger===count-1,{hp,count}),'Hamburger heals fifty and consumes exactly one');
  await activate('#close-menu');
  if(artifactDir)await page.screenshot({path:artifactDir+'\\v6-combat-'+width+'x'+height+'.png'});
  await page.reload();await page.waitForFunction(()=>GAME.ready&&V3_INTRO.state.ready);
  assert(await page.evaluate(()=>!V6_SETTINGS.values.damageNumbers&&!V6_SETTINGS.values.busGag&&!GAME.state.combat.showNumbers),'Both preferences survive refresh');
  assert(failed.length===0,'Failed assets: '+failed.join('; '));assert(errors.length===0,'Browser/runtime errors: '+errors.join('; '));
  results.push('Safe compy/wild ptero spawns, supplied towel animation, white hit flash, smoke/retreat, species cues, persistent defeat, paused combat, preference persistence and hamburger healing');
  return {width,height,touch,authored,errors,failed,results};
 }finally{await page.unroute(gamePattern);page.off('pageerror',onError);page.off('console',onConsole);page.off('response',onResponse);}
};
