return async function checkWorld(page,{width,height,touch,artifactDir}={}){
 const assert=(value,message)=>{if(!value)throw new Error(message);};
 const errors=[],failed=[],onError=e=>errors.push(e.message),onConsole=m=>{if(m.type()==='error')errors.push(m.text());},onResponse=r=>{if(r.status()>=400)failed.push(r.url());};
 page.on('pageerror',onError);page.on('console',onConsole);page.on('response',onResponse);
 const pattern='**/v7/src/game.js*';
 await page.route(pattern,async route=>{
  const response=await route.fetch(),source=await response.text();
  const hook=`window.GAME={test:{enterScene,position(x,y){if(!airborne()&&blocked(x,y))throw new Error('Blocked world fixture placement');Object.assign(player,{x,y});resetInput();updateCamera();updateNearby();},
   quiet(){dino=null;extraEnemies[town.id]=[];attacks.clear();}},`;
  assert(source.includes('window.GAME={'),'World fixture target exists');
  await route.fulfill({response,body:source.replace('window.GAME={',hook)});
 });
 const activate=selector=>touch?page.locator(selector).tap():page.locator(selector).click();
 const interact=()=>touch?activate('#interact'):page.keyboard.press('e');
 async function move(dx,dy,ms){
  if(!touch){
   const keys=[];if(dx)keys.push(dx>0?'d':'a');if(dy)keys.push(dy>0?'s':'w');
   for(const key of keys)await page.keyboard.down(key);await page.waitForTimeout(ms);for(const key of keys)await page.keyboard.up(key);
  }else{
   const b=await page.locator('#joystick').boundingBox();
   const input=await page.context().newCDPSession(page);
   try{
    await input.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2,id:1}]});
    await input.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:b.x+b.width/2+dx*b.width*.34,y:b.y+b.height/2+dy*b.height*.34,id:1}]});
    await page.waitForTimeout(ms);await input.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   }finally{await input.detach();}
  }
 }
 try{
  await page.goto(page.url().split('/v7/')[0]+'/v7/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>GAME.ready&&V3_INTRO.state.ready);
  await activate('#intro-skip');
  assert(await page.evaluate(()=>GAME.test.enterScene('north',[499,78])),'North street travel accepted after the family opening');
  await page.evaluate(()=>{GAME.test.quiet();GAME.test.position(767,120);});
  await move(0,-1,650);await page.waitForFunction(()=>GAME.state.scene==='world');
  assert(await page.evaluate(()=>!GAME.blocked(GAME.state.player.x,GAME.state.player.y)&&GAME.state.player.id==='coco'&&!GAME.state.travel.flying),'Actual north-meteor road reaches a safe on-foot world arrival');
  const snapshot=await page.evaluate(()=>({inventory:{...V4_RPG.inventory},hp:V4_RPG.members.coco.hp,completed:GAME.state.story.completed}));
  const p0=await page.evaluate(()=>GAME.state.player);await move(-1,0,300);
  assert(await page.evaluate(before=>GAME.state.player.x<before.x-8,p0),'Actual overhead walking responds to keyboard/touch');
  await activate('#open-world-map');assert(await page.evaluate(()=>GAME.state.map),'World overview opens');
  await activate('[data-destination="paris"]');
  assert((await page.locator('#world-map-message').innerText()).includes('future chapter'),'Unfinished destination is explicit, not fake content');
  const paused=await page.evaluate(()=>JSON.stringify({player:GAME.state.player,travel:GAME.state.travel}));await page.keyboard.press('d');await page.keyboard.press('m');await page.waitForTimeout(150);
  assert(await page.evaluate(before=>JSON.stringify({player:GAME.state.player,travel:GAME.state.travel})===before&&!V4_MENU.active,paused),'Overview pauses movement and cannot stack the party menu');
  if(artifactDir)await page.screenshot({path:artifactDir+'\\v7-map-'+width+'x'+height+'.png'});
  await activate('#close-world-map');
  await page.evaluate(()=>GAME.test.position(V7_TRAVEL.field.x,V7_TRAVEL.field.y));
  await activate('#travel-action');assert(await page.evaluate(()=>GAME.state.travel.flying),'Actual board button takes off');
  assert(await page.locator('#power').isHidden(),'No attacks while flying');
  const f0=await page.evaluate(()=>GAME.state.player);await move(1,-1,600);
  assert(await page.evaluate(before=>GAME.state.player.x>before.x+50&&GAME.state.player.y<before.y-50,f0),'Free directional flight crosses terrain: '+JSON.stringify(await page.evaluate(()=>({player:GAME.state.player,travel:GAME.state.travel,flight:GAME.state.flight,input:GAME.state.input}))));
  const frames=await page.evaluate(()=>new Promise(resolve=>{const times=[];function tick(t){times.push(t);if(times.length===31)resolve((times[30]-times[0])/30);else requestAnimationFrame(tick);}requestAnimationFrame(tick);}));
  assert(frames<55,'Perspective renderer sustains at least 18fps in this Chromium layout: '+frames.toFixed(1)+'ms');
  if(artifactDir)await page.screenshot({path:artifactDir+'\\v7-flight-'+width+'x'+height+'.png'});
  await activate('#open-menu');const menuPause=await page.evaluate(()=>JSON.stringify(GAME.state.travel));await page.waitForTimeout(150);
  assert(await page.evaluate(before=>JSON.stringify(GAME.state.travel)===before,menuPause),'Party menu pauses flight');
  await activate('#close-menu');
  const hidden=await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));return JSON.stringify(GAME.state.travel);});
  await page.waitForTimeout(150);assert(await page.evaluate(before=>{const same=JSON.stringify(GAME.state.travel)===before;delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));return same;},hidden),'Hidden page pauses flight');
  await page.evaluate(()=>GAME.test.position(16,16));await activate('#travel-action');
  assert(await page.evaluate(()=>GAME.state.travel.flying&&document.getElementById('toast').textContent.includes('Find open')),'Ocean landing is rejected with explicit feedback');
  await page.evaluate(()=>GAME.test.position(V7_TRAVEL.width-5,500));await move(1,0,150);
  assert(await page.evaluate(()=>GAME.state.player.x<150),'Actual flight wraps east-west');
  await page.evaluate(()=>{const site=V7_TRAVEL.sites[1];GAME.test.position(site.x,site.y+32);});
  assert(!await page.evaluate(()=>GAME.test.enterScene('nyc',[500,895])),'Cannot enter a city while airborne');
  await activate('#travel-action');assert(await page.evaluate(()=>!GAME.state.travel.flying),'Clear destination ground allows landing');
  const parked=await page.evaluate(()=>GAME.state.travel.plane);
  await interact();await page.waitForFunction(()=>GAME.state.scene==='nyc');
  assert(await page.evaluate(()=>!GAME.blocked(GAME.state.player.x,GAME.state.player.y)&&GAME.blocked(200,200)),'NYC entrance safe and buildings solid');
  const n0=await page.evaluate(()=>GAME.state.player);await move(-1,0,250);
  assert(await page.evaluate(before=>GAME.state.player.x<before.x-10,n0),'NYC keyboard/touch exploration works');
  await page.evaluate(()=>GAME.test.position(520,440));await interact();
  assert((await page.locator('#dialog-body').innerText()).includes('New York'),'Real pocket-park interaction works');await activate('#continue');
  if(artifactDir)await page.screenshot({path:artifactDir+'\\v7-nyc-'+width+'x'+height+'.png'});
  await page.evaluate(()=>GAME.test.position(640,940));await move(0,1,250);await page.waitForFunction(()=>GAME.state.scene==='world');
  assert(await page.evaluate(old=>GAME.state.travel.plane.x===old.x&&GAME.state.travel.plane.y===old.y,parked),'Jet remains parked after a NYC visit');
  await activate('#travel-action');await page.evaluate(()=>{const site=V7_TRAVEL.sites[0];GAME.test.position(site.x,site.y+32);});await activate('#travel-action');
  await interact();await page.waitForFunction(()=>GAME.state.scene==='north');
  assert(await page.evaluate(before=>V4_RPG.members.coco.hp===before.hp&&JSON.stringify(V4_RPG.inventory)===JSON.stringify(before.inventory)&&JSON.stringify(GAME.state.story.completed)===JSON.stringify(before.completed),snapshot),'Round trip preserves HP, inventory and story progress');
  assert(await page.locator('#travel-action').isHidden()&&await page.locator('#open-world-map').isHidden(),'Travel controls disappear back in the neighborhood');
  assert(errors.length===0,'No world exceptions: '+errors.join('; '));assert(failed.length===0,'No failed world assets: '+failed.join('; '));
  return {world:'passed',width,height,touch,flightFrameMs:Math.round(frames*10)/10,checks:['North-meteor road / overhead walking','Paused overview / future destination labels','Plane boarding / perspective flight / menu-hidden pause / terrain crossing / world wrap','Rejected ocean landing / safe NYC arrival / solid buildings / actual city interaction','NYC return / retained plane / Gaithersburg return / party-story preservation'],errors,failed};
 }finally{await page.unroute(pattern);page.off('pageerror',onError);page.off('console',onConsole);page.off('response',onResponse);}
};
