return async function checkV4(page,{width=1280,height=900,touch=false,cinema=false}={}){
 const assert=(value,message)=>{if(!value)throw new Error(message);};
 const results=[],errors=[],failed=[];
 const onError=error=>errors.push(error.message);
 const onResponse=response=>{if(response.status()>=400)failed.push(response.status()+' '+response.url());};
 page.on('pageerror',onError);page.on('response',onResponse);
 const gameRoute='**/v4/src/game.js*';
 await page.route(gameRoute,async route=>{
  const response=await route.fetch(),source=await response.text();
  const hook='window.GAME={test:{enterScene,position(x,y){player.x=x;player.y=y;resetInput();updateCamera();updateNearby();},place(id){select(id);player.x=dinoHome.x-28;player.y=dinoHome.y;player.direction="right";Object.assign(dino,{...dinoHome,stunned:0,timer:60,target:null,turnTimer:60});powers=makePowers();},},';
  assert(source.includes('window.GAME={'),'Test hook target missing');
  await route.fulfill({response,body:source.replace('window.GAME={',hook)});
 });
 let cdp;
 try{
  await page.setViewportSize({width,height});
  if(touch){
   cdp=await page.context().newCDPSession(page);
   await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
  }
  await page.goto(page.url().split('/v4/')[0]+'/v4/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>GAME.ready&&V3_INTRO.state.ready);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Intro horizontal overflow');
  await page.keyboard.press('2');
  assert(await page.evaluate(()=>GAME.state.player.id==='jason'&&GAME.state.input.keys.length===0),'Intro must block game inputs');
  if(cinema){
   await page.locator('#intro-sound').click();
   await page.locator('#intro-start').click();
   await page.waitForFunction(()=>!V3_INTRO.active,null,{timeout:40000});
   results.push('Full opening movie completes and releases game');
  }else await page.locator('#intro-skip').click();
  const ids=await page.evaluate(()=>Object.keys(CHARACTERS));
  assert(ids.length===12,'Complete ten existing plus two new characters');
  await page.locator('#open-menu').click();
  assert(await page.locator('#menu-roster button').count()===ids.length,'Full roster in menu');
  const origin=await page.evaluate(()=>GAME.state.player);
  for(const id of ids){
   await page.locator(`[data-member="${id}"]`).click();
   await page.locator('#menu-play').click();
   const actor=await page.evaluate(()=>GAME.state.player);
   assert(actor.id===id&&actor.x===origin.x&&actor.y===origin.y,'Safe character switch: '+id);
   await page.keyboard.press('m');
  }
  assert(await page.locator('.portrait-slot small').first().textContent()==='Portrait pending','Placeholder label must survive roster render');
  assert(await page.evaluate(()=>[...document.querySelectorAll('#rpg-menu img')].every(img=>img.complete&&img.naturalWidth===128&&img.naturalHeight===128)),'Prepared portraits loaded');
  await page.keyboard.press('Escape');
  await page.keyboard.down('d');await page.waitForTimeout(100);
  await page.keyboard.press('m');
  const paused=await page.evaluate(()=>GAME.state);
  await page.keyboard.press('x');await page.keyboard.press('1');await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(200);
  const after=await page.evaluate(()=>GAME.state);
  assert(paused.player.x===after.player.x&&paused.player.y===after.player.y,'Movement paused');
  assert(paused.dinosaur.stars===after.dinosaur.stars&&paused.squirrel.clock===after.squirrel.clock,'World timers paused');
  assert(after.player.id===paused.player.id&&after.powers.casts.length===paused.powers.casts.length,'Power/number shortcuts blocked');
  assert(after.input.keys.length===0&&!after.input.touchRun&&after.input.joy.x===0,'Held input cleared');
  await page.keyboard.up('d');
  await page.locator('#tab-party').click();await page.keyboard.press('ArrowRight');
  assert(await page.locator('#tab-stats').getAttribute('aria-selected')==='true','Tab arrows');
  await page.keyboard.press('End');
  assert(await page.locator('#tab-abilities').getAttribute('aria-selected')==='true','Tab End');
  await page.keyboard.press('Home');
  for(let i=0;i<18;i++){
   await page.keyboard.press(i%2?'Shift+Tab':'Tab');
   assert(await page.evaluate(()=>document.getElementById('rpg-menu').contains(document.activeElement)),'Modal focus trap');
  }
  await page.keyboard.press('Escape');
  assert(await page.evaluate(()=>document.activeElement.id==='game'),'Focus restored');
  const stopped=await page.evaluate(()=>GAME.state.player);
  await page.waitForTimeout(100);
  assert(await page.evaluate(actor=>GAME.state.player.x===actor.x&&GAME.state.player.y===actor.y,stopped),'No stuck movement after close');
  results.push('12-character roster, portraits, safe switching, pause, keyboard tabs/focus/input reset');

  const model=await page.evaluate(()=>{
   const r=V4_RPG,check=(value,message)=>{if(!value)throw new Error(message);};
   for(const member of Object.values(r.members)){
    check(member.level===1&&member.xp===0&&member.nextLevelXP===100,'Deterministic XP');
    check(member.hp===member.maxHP&&['strength','quickness','dexterity','defense'].every(key=>Number.isInteger(member[key])&&member[key]>0),'Initial stats');
   }
   const base=r.stats('jason').strength;
   check(r.equip('jason','weapon','sword').ok,'Equip sword');
   check(r.stats('jason').strength===base+4&&r.inventory.sword===0,'Sword modifier and inventory');
   check(!r.equip('connor','weapon','sword').ok,'No duplicate sword');
   check(!r.equip('jason','weapon','sword').ok,'No repeat equip duplication');
   check(r.equip('jason','weapon',null).ok&&r.inventory.sword===1&&r.stats('jason').strength===base,'Unequip restores count and base');
   check(!r.useItem('jason','hamburger').ok&&r.inventory.hamburger===3,'Full HP does not consume');
   r.members.jason.hp=5;
   check(r.useItem('jason','hamburger').ok&&r.members.jason.hp===55&&r.inventory.hamburger===2,'50 HP healing');
   r.members.jason.hp=r.members.jason.maxHP-3;
   check(r.useItem('jason','hamburger').ok&&r.members.jason.hp===r.members.jason.maxHP&&r.inventory.hamburger===1,'Healing capped');
   r.members.jason.hp=1;r.useItem('jason','hamburger');
   check(!r.useItem('jason','hamburger').ok&&r.inventory.hamburger===0,'Exhausted inventory cannot go negative');
   r.members.jason.hp=r.members.jason.maxHP;r.inventory.hamburger=3;
   let invalid=0;
   for(const operation of [()=>r.stats('missing'),()=>r.equip('jason','weapon','hamburger'),()=>r.equip('jason','hat','sword'),()=>r.equipAbility('jason','missing')]){
    try{operation();}catch{invalid++;}
   }
   check(invalid===4,'Invalid input reported');
   const actor={id:'jaime',x:100,y:100,direction:'right'};
   r.equipAbility('jaime','vito');
   const powers=FAMILY_POWERS.create({blocked:()=>false,getTarget:()=>null,onHit:()=>{},getActor:()=>actor,getAbility:actor=>r.members[actor.id].ability});
   check(powers.activate(actor),'New character uses equipped ability');
   check(powers.state.casts[0].owner==='jaime'&&powers.state.casts[0].id==='vito','Ability owner separate from effect');
   powers.update(.15);check(powers.pose(actor).rotation>0,'Non-native effect animates on caster');
   r.equipAbility('jaime','jason');check(!powers.activate(actor),'Relic swapping cannot bypass caster cooldown');
   powers.update(1);check(powers.activate(actor),'Recharged swapped ability');
   r.equipAbility('jaime',null);powers.update(1);check(!powers.activate(actor),'Unequipped ability cannot cast');
   return true;
  });
  assert(model,'RPG model checks');
  await page.keyboard.press('m');
  await page.locator('[data-member="jason"]').click();await page.locator('#tab-equip').click();
  await page.locator('[data-equip="sword"]').click();
  await page.locator('#tab-stats').click();
  assert((await page.locator('.stat-grid').textContent()).includes('18 (14 + 4)'),'UI shows base plus modifier');
  await page.locator('#tab-equip').click();await page.locator('[data-unequip="weapon"]').click();
  await page.locator('#tab-items').click();assert(await page.locator('[data-item="hamburger"]').isDisabled(),'Full HP item disabled');
  await page.evaluate(()=>{V4_RPG.members.jason.hp=100;});
  await page.locator('#tab-party').click();await page.locator('#tab-items').click();
  await page.locator('[data-item="hamburger"]').click();
  assert(await page.evaluate(()=>V4_RPG.members.jason.hp===120&&V4_RPG.inventory.hamburger===2),'Item UI heals selected member');
  await page.locator('[data-member="chris"]').click();await page.locator('#tab-abilities').click();
  await page.locator('[data-ability="coco"]').click();
  assert(await page.locator('[data-ability="coco"]').getAttribute('aria-pressed')==='true','Ability selected');
  await page.locator('#tab-party').click();await page.locator('#menu-play').click();
  await page.keyboard.press('x');await page.waitForTimeout(100);
  assert(await page.evaluate(()=>GAME.state.powers.casts.some(c=>c.owner==='chris'&&c.id==='coco')),'Equipped ability wired to real game');
  results.push('Deterministic stats, equipment/count conservation, healing boundaries, equipped ability owner/cooldown and live UI');

  await page.evaluate(()=>{for(const id of Object.keys(FAMILY_POWERS.definitions))V4_RPG.equipAbility(id,id);});
  const scenes={north:[499,954],plaza:[592.45,361.33],district:[568.18,966.85],neighborhood:[243.22,558.21],recreation:[542.26,366.83],house:[538.67,662.98]};
  for(const [scene,arrival] of Object.entries(scenes)){
   assert(await page.evaluate(async({scene,arrival})=>GAME.test.enterScene(scene,arrival),{scene,arrival}),'Scene loads: '+scene);
   assert(await page.evaluate(()=>!GAME.blocked(GAME.state.player.x,GAME.state.player.y)&&!GAME.blocked(GAME.state.dinosaur.x,GAME.state.dinosaur.y)),'Scene spawns walkable: '+scene);
   for(const id of touch?['coco']:Object.keys(await page.evaluate(()=>FAMILY_POWERS.definitions))){
    await page.evaluate(id=>GAME.test.place(id),id);await page.keyboard.press('x');
    await page.waitForFunction(()=>GAME.state.dinosaur.stunned>1.5,null,{timeout:2000});
   }
  }
  await page.evaluate(()=>GAME.test.enterScene('plaza',[500,844.7265625]));
  await page.evaluate(()=>GAME.test.position(620,310));await page.keyboard.press('e');
  await page.waitForFunction(()=>GAME.ready&&GAME.state.scene==='north');
  assert(await page.evaluate(()=>GAME.blocked(767,312)&&GAME.blocked(300,600)),'Crater/building collisions');
  await page.evaluate(()=>GAME.test.position(766,1465));await page.keyboard.press('e');
  await page.waitForFunction(()=>GAME.ready&&GAME.state.scene==='plaza');
  await page.evaluate(()=>GAME.test.position(1378,720));await page.keyboard.press('e');
  assert(await page.evaluate(()=>GAME.state.unicorn.riding),'Unicorn mount');
  await page.keyboard.press('m');await page.locator('[data-member="connor"]').click();await page.locator('#menu-play').click();
  assert(await page.evaluate(()=>GAME.state.unicorn.riding&&GAME.state.player.id==='connor'),'Menu switch preserves mount');
  await page.keyboard.press('e');assert(await page.evaluate(()=>!GAME.state.unicorn.riding),'Safe dismount');
  await page.locator('#help').click();await page.locator('#return-plaza').click();await page.waitForFunction(()=>GAME.ready);
  results.push('Six scenes load, original powers hit dinosaurs, actual north portal roundtrip, collisions, unicorn');

  if(touch){
   const box=await page.locator('#joystick').boundingBox(),run=await page.locator('#run').boundingBox();
   const joy={id:1,x:box.x+box.width*.75,y:box.y+box.height/2};
   const runPoint={id:2,x:run.x+run.width/2,y:run.y+run.height/2};
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[joy,runPoint]});
   await page.waitForTimeout(120);
   assert(await page.evaluate(()=>GAME.state.player.moving&&GAME.state.player.running),'Touch joystick and run');
   await page.evaluate(()=>V4_MENU.open());
   assert(await page.evaluate(()=>!GAME.state.input.touchRun&&GAME.state.input.joy.x===0),'Opening menu clears held touch');
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await page.locator('[data-member="chris"]').tap();
   await page.locator('#menu-play').tap();
   const power=await page.locator('#power').boundingBox();
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:3,x:power.x+power.width/2,y:power.y+power.height/2}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   assert(await page.evaluate(()=>GAME.state.powers.casts.some(c=>c.owner==='chris')),'Touch power works');
   await page.locator('#open-menu').tap();
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile page width');
   const menu=await page.locator('#rpg-menu').boundingBox();
   assert(menu.x>=0&&menu.y>=0&&menu.x+menu.width<=width+1&&menu.y+menu.height<=height+1,'Menu within viewport');
   await page.locator('#tab-equip').tap();
   await page.locator('[data-equip="sword"]').tap();
   await page.locator('#tab-abilities').tap();
   await page.locator('[data-ability="vito"]').tap();
   await page.locator('#close-menu').tap();
   results.push('Real touch events: simultaneous joystick/run, menu input reset, roster/equip/ability/power taps; responsive bounds');
  }
  await page.locator('#help').click();await page.locator('#replay-intro').click();
  assert(await page.evaluate(()=>V3_INTRO.active),'Intro replay');
  await page.keyboard.press('Escape');
  assert(await page.evaluate(()=>!V3_INTRO.active&&GAME.state.input.keys.length===0),'Intro Escape clears input');
  assert(errors.length===0,'Browser exceptions: '+errors.join('; '));
  assert(failed.length===0,'Asset requests failed: '+failed.join('; '));
  return {viewport:{width,height},touch,results,errors,failed};
 }finally{
  await page.unroute(gameRoute);page.off('pageerror',onError);page.off('response',onResponse);
  if(cdp){await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:false});await cdp.detach();}
 }
};
