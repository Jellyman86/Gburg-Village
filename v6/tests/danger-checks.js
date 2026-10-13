return async function checkDanger(page,{width,height,touch,artifactDir}={}){
 const assert=(value,message)=>{if(!value)throw new Error(message);};
 const errors=[],failed=[],expectedErrors=[],checks=[];
 let recoveryFault=false;
 const onError=e=>errors.push(e.message),onConsole=m=>{if(m.type()==='error')(recoveryFault?expectedErrors:errors).push(m.text());},
  onResponse=r=>{if(r.status()>=400&&!recoveryFault)failed.push(r.url());};
 page.on('pageerror',onError);page.on('console',onConsole);page.on('response',onResponse);
 const pattern='**/v6/src/game.js*';
 await page.route(pattern,async route=>{
  const response=await route.fetch(),source=await response.text();
  const hook=`window.GAME={test:{
   enterScene,
   position(x,y){if(blocked(x,y))throw new Error('Blocked danger test placement');Object.assign(player,{x,y});resetInput();updateCamera();updateNearby();},
   quiet(){dino=null;extraEnemies[town.id]=[];attacks.clear();},
   fixture(kind,offset=15){
    const home={x:650,y:370};dino=dinosaurs.plaza=V6_COMBAT.init({...home,kind,clock:0,stars:0,direction:'right',facing:1,mode:'chase',timer:60,target:null,turnTimer:60});
    dinoHome=home;dino.attackCooldown=0;extraEnemies.plaza=[];attacks.clear();Object.assign(player,{x:650+offset,y:370,direction:'left'});resetInput();updateCamera();updateNearby();
   },
   damage(amount){return playerCombat.damage(amount,{x:player.x-30,y:player.y});},
   readyHealth(){playerCombat.update(2);},
   deadCompy(){const dead=V6_COMBAT.init({kind:'compy',x:700,y:370,clock:0});combat.hit(dead,{power:{kind:'punch',damage:100},x:680,y:370,dx:1,dy:0});combat.update(.25,[dead]);extraEnemies.plaza.push(dead);},
   forgetHQ(){delete sceneImages.hq;},
   biteTarget(){const home={x:player.x-35,y:player.y};dino=V6_COMBAT.init({...home,kind:'compy',clock:0,stars:0,direction:'right',facing:1,mode:'wander',timer:60,target:null,turnTimer:60});dinoHome=home;},
   garyPixels(direction,moving){
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
    sprite({id:'gary',x:80,y:80,direction,moving,frame:1},false);
    const pixels=Array.from(ctx.getImageData(48,20,64,64).data);ctx.restore();return pixels;
   }
  },`;
  assert(source.includes('window.GAME={'),'Danger fixture injection target exists');
  await route.fulfill({response,body:source.replace('window.GAME={',hook).replace('flight.update(dt,player,town,!unicorn.riding)','flight.update(dt,player,town,false)')});
 });
 await page.addInitScript(()=>{
  window.__dangerDraws=[];window.__dangerOutline=0;window.__dangerSounds=[];
  const draw=CanvasRenderingContext2D.prototype.drawImage,stroke=CanvasRenderingContext2D.prototype.strokeRect;
  CanvasRenderingContext2D.prototype.drawImage=function(...args){
   if(this.canvas.id==='game'&&window.GAME&&!window.V5_CINEMA?.active){
    const src=args[0].src||'';
    if(src.includes('dilophosaurus')||src.includes('-poses.png')||src.includes('/grenade.png'))__dangerDraws.push({src,sx:args[1],sy:args[2]});
    if(__dangerDraws.length>2000)__dangerDraws.splice(0,1000);
   }
   return draw.apply(this,args);
  };
  CanvasRenderingContext2D.prototype.strokeRect=function(...args){if(this.canvas.id==='game'&&this.strokeStyle==='#ff9686')__dangerOutline++;return stroke.apply(this,args);};
 });
 const activate=selector=>touch?page.locator(selector).tap():page.locator(selector).click();
 const interact=()=>touch?activate('#interact'):page.keyboard.press('e');
 async function go(id){
  assert(await page.evaluate(async id=>{
   const p=Object.values(SCENES).flatMap(s=>s.landmarks).find(p=>p.to===id);
   return GAME.test.enterScene(id,p.arrival);
  },id),'Travel accepted: '+id);
 }
 async function closeDialog(){await activate('#continue');}
 try{
  await page.goto(page.url().split('/v6/')[0]+'/v6/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>GAME.ready&&V3_INTRO.state.ready);
  await activate('#intro-skip');
  await page.evaluate(()=>{const original=V4_SFX.play;V4_SFX.play=kind=>{__dangerSounds.push(kind);return original(kind);};});
  for(const id of ['north','plaza','district','neighborhood','recreation']){
   await go(id);
   assert(await page.evaluate(id=>{
    const enemies=GAME.state.enemies;
    return enemies.filter(e=>e.kind==='compy').length===(id==='north'?5:4)&&['dilophosaurus','ankylosaurus'].every(k=>enemies.some(e=>e.kind===k))&&enemies.every(e=>!GAME.blocked(e.x,e.y));
   },id),'Three extra compies, both new species, safe spawns: '+id);
  }
  checks.push('Five outdoor maps: +3 compies each, Dilophosaurus and Ankylosaurus; safe geometry');
  assert(await page.evaluate(()=>['compy','ankylosaurus'].every(id=>performance.getEntriesByType('resource').some(entry=>entry.name.includes('/assets/dinosaurs/'+id+'.png?v=danger-2')))),'Both hand-edited dinosaur sheets use fresh cache-versioned URLs');
  await go('district');await page.evaluate(()=>GAME.test.position(1900,370));
  assert(await page.evaluate(()=>GAME.state.nearest==='grenade'&&!V4_RPG.equipAbility('coco','grenade').ok),'Grenade is north of Cinepolis and locked before pickup');
  await interact();assert(await page.evaluate(()=>V4_RPG.discoveries.grenade&&V4_RPG.inventory.grenade===1),'Real pickup unlocks grenade once');await closeDialog();
  await activate('#open-menu');await activate('#tab-abilities');await activate('[data-ability="grenade"]');await activate('#close-menu');
  assert(await page.evaluate(()=>V4_RPG.members.coco.ability==='grenade'&&!V4_RPG.collectPickup('grenade').ok),'Actual menu equips the reusable unlocked ability');
  await activate('#power');await page.waitForFunction(()=>__dangerDraws.some(d=>d.src.includes('/grenade.png')));
  await page.waitForFunction(()=>__dangerSounds.includes('explode'));
  assert(await page.evaluate(()=>V4_RPG.inventory.grenade===1&&GAME.state.powers.cooldowns.coco===0&&FAMILY_POWERS.definitions.grenade.cooldown===.6),'Supplied grenade animation/explosion cue, no ammo consumption, normal 0.6-second cooldown');
  await activate('#power');assert(await page.evaluate(()=>GAME.state.powers.casts.length>=2),'Second grenade can overlap the first blast');
  checks.push('Cinepolis pickup, one-time unlock, real ability menu, supplied toss/blast frames, no ammo');
  await go('plaza');await page.evaluate(()=>{GAME.test.quiet();});
  for(const moving of [false,true]){
   const mirror=await page.evaluate(moving=>{
    const right=GAME.test.garyPixels('right',moving),left=GAME.test.garyPixels('left',moving);
    let visible=0,differences=0,shadowDifferences=0,first=null;
    for(let y=0;y<64;y++)for(let x=0;x<64;x++)for(let c=0;c<4;c++){
     const a=(y*64+x)*4+c,b=(y*64+63-x)*4+c;
     if(left[a]!==right[b]){
      if(y>=56&&c<3&&left[a]<=16&&right[b]<=16&&Math.abs(left[a]-right[b])===1)shadowDifferences++;
      else{differences++;if(!first)first={x,y,c,left:left[a],right:right[b]};}
     }if(c<3&&left[a]>10)visible++;
    }
    return {visible,differences,shadowDifferences,first};
   },moving);
   assert(mirror.visible>50&&mirror.differences===0&&mirror.shadowDifferences<=8,'Actual Gary '+(moving?'walk':'idle')+' pixels mirror the right-facing image: '+JSON.stringify(mirror));
  }
  assert(await page.evaluate(async()=>{
   const response=await fetch(CHARACTERS.jeff.sheet),bytes=await response.arrayBuffer();
   return response.ok&&bytes.byteLength>0&&CHARACTERS.jeff.sheet.startsWith('assets/characters/jeff.png');
  }),'V6 serves its isolated cleaned Jeff sheet');
  checks.push('Actual idle/walk Gary pixel mirroring; isolated cleaned Jeff sheet; fresh edited-dinosaur URLs');
  await page.evaluate(()=>GAME.test.fixture('dilophosaurus',100));
  await page.waitForFunction(()=>GAME.state.dinosaur.windup>0);
  await page.evaluate(()=>GAME.test.position(750,395));
  await page.waitForFunction(()=>GAME.state.incoming.projectiles.length>0);
  assert(await page.evaluate(()=>GAME.state.incoming.projectiles.every(p=>Math.abs(p.dy)<.001)&&__dangerDraws.some(d=>d.src.includes('dilophosaurus')&&d.sy===384)),'Actual frill frames and aimed spit');
  await page.waitForFunction(()=>GAME.state.incoming.projectiles.length===0);
  assert(await page.evaluate(()=>V4_RPG.members.coco.hp===80),'Spit is dodgeable');
  await page.evaluate(()=>GAME.test.fixture('ankylosaurus',55));await page.waitForFunction(()=>GAME.state.dinosaur.windup>0);
  await page.evaluate(()=>GAME.test.position(780,370));await page.waitForFunction(()=>GAME.state.dinosaur.windup===0);
  assert(await page.evaluate(()=>V4_RPG.members.coco.hp===80),'Ankylosaurus tail windup is dodgeable');
  await page.evaluate(()=>GAME.test.fixture('compy'));await page.waitForFunction(()=>GAME.state.playerCombat.lastHit!==null);
  assert(await page.evaluate(()=>V4_RPG.members.coco.hp===77&&!document.getElementById('hero-health')&&document.getElementById('toast').textContent.includes('damage')&&!document.getElementById('toast').textContent.includes('77')&&__dangerSounds.includes('player-hurt')),'Real contact applies defense with menu-only HP and toast/audio feedback');
  await page.waitForFunction(()=>__dangerOutline>0);
  await page.evaluate(()=>{V4_RPG.recruit('connor');GAME.select('connor');});
  assert(await page.evaluate(()=>!GAME.test.damage(20)&&V4_RPG.members.connor.hp===90),'Hero switching cannot bypass hit invulnerability');
  await page.evaluate(()=>GAME.select('coco'));await activate('#open-menu');
  assert(await page.locator('#menu-detail').innerText().then(text=>text.includes('77')&&text.includes('HP')),'Party menu shows current damaged HP');
  const paused=await page.evaluate(()=>({health:GAME.state.playerCombat,enemy:GAME.state.dinosaur,companions:GAME.state.companions}));
  await page.waitForTimeout(250);
  assert(await page.evaluate(before=>JSON.stringify({health:GAME.state.playerCombat,enemy:GAME.state.dinosaur,companions:GAME.state.companions})===JSON.stringify(before),paused),'Menu pauses incoming combat and dog/player timers');
  await activate('#tab-items');await activate('[data-item="hamburger"]');
  assert(await page.evaluate(()=>V4_RPG.members.coco.hp===80&&V4_RPG.inventory.hamburger===2),'Hamburger heals actual damage and consumes one');await activate('#close-menu');
  const hidden=await page.evaluate(()=>{
   Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));return GAME.state.playerCombat;
  });
  await page.waitForTimeout(150);
  assert(await page.evaluate(before=>{
   const same=JSON.stringify(GAME.state.playerCombat)===JSON.stringify(before);delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));return same;
  },hidden),'Hidden page pauses player timers');
  checks.push('Dodgeable frill/spit/tail/contact; HP/outline/toast/audio; cross-hero invulnerability; menu/hidden pause; real hamburger healing');
  await page.evaluate(()=>{GAME.test.readyHealth();GAME.test.fixture('compy');GAME.test.deadCompy();V4_RPG.members.coco.hp=3;V4_RPG.members.connor.hp=12;});
  const before=await page.evaluate(()=>({inventory:{...V4_RPG.inventory},ability:V4_RPG.members.coco.ability,equipment:{...V4_RPG.members.coco.equipment},defeats:GAME.state.combat.defeats,completed:GAME.state.story.completed}));
  await activate('#power');await page.waitForFunction(()=>GAME.state.playerCombat.phase==='faint');
  const faint=await page.evaluate(()=>GAME.state.player);
  await page.keyboard.press('d');await page.keyboard.press('x');await page.keyboard.press('m');
  assert(await page.evaluate(old=>!GAME.select('connor')&&!V4_MENU.active&&!GAME.state.dialog&&GAME.state.player.id===old.id&&GAME.state.player.x===old.x&&GAME.state.player.y===old.y&&GAME.state.powers.casts.length===0&&GAME.state.input.keys.length===0,faint),'Faint locks powers, movement, interaction, menu and switching');
  if(artifactDir)await page.screenshot({path:artifactDir+'\\danger-faint-'+width+'x'+height+'.png'});
  await page.waitForFunction(()=>GAME.state.scene==='hq'&&GAME.state.dialog&&!GAME.state.playerCombat.locked);
  assert(await page.evaluate(before=>V4_RPG.members.coco.hp===80&&V4_RPG.members.connor.hp===12&&!V4_RPG.members.gary.joined&&JSON.stringify(V4_RPG.inventory)===JSON.stringify(before.inventory)&&V4_RPG.members.coco.ability===before.ability&&JSON.stringify(V4_RPG.members.coco.equipment)===JSON.stringify(before.equipment)&&GAME.state.combat.defeats===before.defeats&&JSON.stringify(GAME.state.story.completed)===JSON.stringify(before.completed)&&document.getElementById('dialog-body').textContent.includes('unconscious'),before),'Five Guys heals only the fainted hero; no item/equipment/defeat/progress loss or premature Gary recruitment');
  await closeDialog();await go('plaza');
  assert(await page.evaluate(()=>GAME.state.enemies.some(e=>e.kind==='compy'&&!e.alive&&e.hidden)),'Defeated dinosaurs stay defeated after recovery');
  await page.evaluate(()=>{GAME.test.quiet();GAME.test.forgetHQ();GAME.test.readyHealth();V4_RPG.recruit('gary');GAME.select('gary');V4_RPG.members.gary.hp=1;});
  const faultPattern='**/v5/assets/scenes/five-guys-hq.png*';recoveryFault=true;
  await page.route(faultPattern,route=>route.fulfill({status:503,body:'Intentional recovery retry fixture'}));
  await page.evaluate(()=>GAME.test.damage(1000));await page.waitForFunction(()=>GAME.state.playerCombat.phase==='retry');
  assert(await page.evaluate(()=>GAME.state.scene==='plaza'&&V4_RPG.members.gary.hp===0&&GAME.state.playerCombat.locked),'Failed load does not fake a healed/teleported success');
  assert(expectedErrors.length>0,'Recovery error is explicitly logged');
  await page.unroute(faultPattern);recoveryFault=false;await activate('#recovery-retry');
  await page.waitForFunction(()=>GAME.state.scene==='hq'&&GAME.state.dialog);
  assert(await page.evaluate(()=>V4_RPG.members.gary.hp===160&&document.getElementById('dialog-body').textContent.includes('first-aid')),'Retry succeeds exactly once with Gary-specific self-recovery');
  checks.push('Finite faint/mosaic/input lock; Five Guys active-only recovery and preserved progress; explicit failed-load retry; Gary self-recovery');
  await closeDialog();await go('recreation');await page.evaluate(()=>{GAME.test.quiet();GAME.select('coco');GAME.test.position(1125,360);});
  await interact();await closeDialog();
  await page.waitForFunction(()=>GAME.state.companions.dogs.every(d=>d.pose==='sit'));
  await page.waitForFunction(()=>GAME.state.companions.dogs.every(d=>d.pose==='lie'));
  await page.waitForFunction(()=>GAME.state.companions.dogs.every(d=>d.pose==='sleep'));
  assert(await page.evaluate(()=>[128,192,256].every(sx=>__dangerDraws.some(d=>d.src.includes('-poses.png')&&d.sx===sx))),'Actual supplied sit/lie/sleep frames are drawn');
  if(artifactDir)await page.screenshot({path:artifactDir+'\\danger-dogs-'+width+'x'+height+'.png'});
  await page.evaluate(()=>GAME.test.biteTarget());
  await page.waitForFunction(()=>GAME.state.dinosaur.hp<GAME.state.dinosaur.maxHP);
  assert(await page.evaluate(()=>GAME.state.companions.dogs.every(d=>!('hp' in d)&&d.pose!=='sleep')&&__dangerSounds.includes('dog-bite')&&V4_RPG.members.coco.hp===80),'Nearby enemy wakes dogs; actual modest bite, invulnerable companions');
  checks.push('Real discovery/followers, supplied 1/2/4-second rest poses, wake and actual invulnerable dog bite');
  assert(await page.locator('#hero-health').count()===0,'No numeric player HP HUD in any layout');
  assert(errors.length===0,'No game exceptions/unexpected logged errors: '+errors.join('; '));assert(failed.length===0,'No unexpected failed assets: '+failed.join('; '));
  return {danger:'passed',width,height,touch,checks,errors,failed,expectedRecoveryErrors:expectedErrors.length};
 }finally{await page.unroute(pattern);page.off('pageerror',onError);page.off('console',onConsole);page.off('response',onResponse);}
};
