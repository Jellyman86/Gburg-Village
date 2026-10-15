return async function checkWorld(page,{width,height,touch,artifactDir}={}){
 const assert=(value,message)=>{if(!value)throw new Error(message);};
 const errors=[],failed=[],onError=e=>errors.push(e.message),onConsole=m=>{if(m.type()==='error')errors.push(m.text());},onResponse=r=>{if(r.status()>=400)failed.push(r.url());};
 page.on('pageerror',onError);page.on('console',onConsole);page.on('response',onResponse);
 await page.addInitScript(()=>{
  window.__jetFrames=[];
  const draw=CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage=function(...args){
   if(this.canvas.id==='game'&&(args[0].src||'').includes('/world/plane.png')){
    __jetFrames.push({row:args[2]/128,frame:args[1]/128});
    if(__jetFrames.length>120)__jetFrames.shift();
   }
   return draw.apply(this,args);
  };
 });
 const pattern='**/v8/src/game.js*';
 await page.route(pattern,async route=>{
  const response=await route.fetch(),source=await response.text();
  const hook=`window.GAME={test:{enterScene,position(x,y){if(!airborne()&&blocked(x,y))throw new Error('Blocked world fixture placement');Object.assign(player,{x,y});resetInput();checkZoneCrossing(x,y);updateCamera();updateNearby();},
   quiet(){dino=null;extraEnemies[town.id]=[];attacks.clear();}},`;
  assert(source.includes('window.GAME={'),'World fixture target exists');
  await route.fulfill({response,body:source.replace('window.GAME={',hook)});
 });
 const activate=selector=>touch?page.locator(selector).tap():page.locator(selector).click();
 // dialog.close() resets input synchronously and again from the queued 'close' event; let that task run before sending new input.
 const settle=()=>page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,0)));
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
  await page.goto(page.url().split('/v8/')[0]+'/v8/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>GAME.ready&&V3_INTRO.state.ready);
  await activate('#intro-skip');
  assert(await page.evaluate(()=>GAME.test.enterScene('north',[499,78])),'North street travel accepted after the family opening');
  await page.evaluate(()=>{GAME.test.quiet();GAME.test.position(767,120);});
  await move(0,-1,650);await page.waitForFunction(()=>GAME.state.scene==='world');
  assert(await page.evaluate(()=>!GAME.blocked(GAME.state.player.x,GAME.state.player.y)&&GAME.state.player.id==='coco'&&!GAME.state.travel.flying),'Actual north-meteor road reaches a safe on-foot world arrival');
  const snapshot=await page.evaluate(()=>({inventory:{...V4_RPG.inventory},hp:V4_RPG.members.coco.hp,completed:GAME.state.story.completed}));
  const p0=await page.evaluate(()=>GAME.state.player);await move(-1,0,300);
  assert(await page.evaluate(before=>GAME.state.player.x<before.x-8,p0),'Actual overhead walking responds to keyboard/touch');
  if(artifactDir){
   await page.screenshot({path:artifactDir+'\\v8-overworld-'+width+'x'+height+'.png'});
   const image=await page.evaluate(()=>{
    const preview=document.createElement('canvas');preview.width=960;preview.height=720;
    const context=preview.getContext('2d');context.imageSmoothingEnabled=false;
    context.drawImage(V8_TRAVEL.background('world'),0,0,V8_TRAVEL.width,V8_TRAVEL.height,0,0,960,720);
    return preview.toDataURL('image/png').split(',')[1];
   });
   require('node:fs').writeFileSync(artifactDir+'\\v8-terrain-overview.png',Buffer.from(image,'base64'));
  }
  await activate('#open-world-map');assert(await page.evaluate(()=>GAME.state.map),'World overview opens');
  await activate('[data-destination="russia"]');
  assert((await page.locator('#world-map-message').innerText()).includes('future chapter'),'Unfinished destination is explicit, not fake content');
  const paused=await page.evaluate(()=>JSON.stringify({player:GAME.state.player,travel:GAME.state.travel}));await page.keyboard.press('d');await page.keyboard.press('m');await page.waitForTimeout(150);
  assert(await page.evaluate(before=>JSON.stringify({player:GAME.state.player,travel:GAME.state.travel})===before&&!V4_MENU.active,paused),'Overview pauses movement and cannot stack the party menu');
  if(artifactDir)await page.screenshot({path:artifactDir+'\\v8-map-'+width+'x'+height+'.png'});
  await activate('#close-world-map');
  await page.evaluate(()=>GAME.test.position(V8_TRAVEL.field.x,V8_TRAVEL.field.y));
  await activate('#travel-action');assert(await page.evaluate(()=>GAME.state.travel.flying),'Actual board button takes off');
  assert(await page.locator('#power').isHidden(),'No attacks while flying');
  const turn0=await page.evaluate(()=>GAME.state.player);await move(1,0,450);
  assert(await page.evaluate(before=>Math.hypot(GAME.state.player.x-before.x,GAME.state.player.y-before.y)<1&&GAME.state.travel.heading>.3,turn0),'Keyboard/touch right input turns without compass-direction movement');
  const f0=await page.evaluate(()=>GAME.state.player);await move(0,-1,600);
  assert(await page.evaluate(before=>GAME.state.player.x>before.x+30&&GAME.state.player.y<before.y-30,f0),'Up flies forward along the turned camera heading');
  const reverse0=await page.evaluate(()=>GAME.state.player);await move(0,1,200);
  assert(await page.evaluate(before=>GAME.state.player.x<before.x-8&&GAME.state.player.y>before.y+8,reverse0),'Down reverses along the same camera heading');
  assert(await page.evaluate(()=>!GAME.state.travel.boosting&&V8_TRAVEL.planePose(GAME.state.travel).row===0),'Normal flight uses no flame frames');
  await page.evaluate(()=>{__jetFrames=[];});await page.waitForTimeout(450);
  assert(await page.evaluate(()=>__jetFrames.length>0&&__jetFrames.every(p=>p.row===0&&p.frame===0)),'Actual cruise rendering never draws flame poses');
  const runInput=touch?await page.context().newCDPSession(page):null;
  try{
   if(touch){
    const b=await page.locator('#run').boundingBox();
    await runInput.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2,id:1}]});
   }else await page.keyboard.down('Shift');
   await page.waitForFunction(()=>GAME.state.travel.boosting);
   assert(await page.evaluate(()=>{const pose=V8_TRAVEL.planePose(GAME.state.travel);return pose.row===1&&pose.frame>=1&&pose.frame<=3;}),'Run selects only the three actual flame poses');
   await page.evaluate(()=>{__jetFrames=[];});await page.waitForTimeout(500);
   assert(await page.evaluate(()=>__jetFrames.length>0&&__jetFrames.every(p=>p.row===1&&p.frame>=1&&p.frame<=3)&&new Set(__jetFrames.map(p=>p.frame)).size===3),'Actual boost animates all three flame poses without a blank frame');
   if(touch)await runInput.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   else await page.keyboard.up('Shift');
  }finally{if(runInput)await runInput.detach();}
  await page.waitForFunction(()=>!GAME.state.travel.boosting);
  await page.evaluate(()=>{__jetFrames=[];});await page.waitForTimeout(150);
  assert(await page.evaluate(()=>__jetFrames.length>0&&__jetFrames.every(p=>p.row===0&&p.frame===0)),'Releasing Run returns actual rendering to the no-flame pose');
  const frames=await page.evaluate(()=>new Promise(resolve=>{const times=[];function tick(t){times.push(t);if(times.length===31)resolve((times[30]-times[0])/30);else requestAnimationFrame(tick);}requestAnimationFrame(tick);}));
  assert(frames<55,'Perspective renderer sustains at least 18fps in this Chromium layout: '+frames.toFixed(1)+'ms');
  if(artifactDir)await page.screenshot({path:artifactDir+'\\v8-flight-'+width+'x'+height+'.png'});
  await activate('#open-menu');const menuPause=await page.evaluate(()=>JSON.stringify(GAME.state.travel));await page.waitForTimeout(150);
  assert(await page.evaluate(before=>JSON.stringify(GAME.state.travel)===before,menuPause),'Party menu pauses flight');
  await activate('#close-menu');
  const hidden=await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));return JSON.stringify(GAME.state.travel);});
  await page.waitForTimeout(150);assert(await page.evaluate(before=>{const same=JSON.stringify(GAME.state.travel)===before;delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));return same;},hidden),'Hidden page pauses flight');
  await page.evaluate(()=>GAME.test.position(16,16));await activate('#travel-action');
  assert(await page.evaluate(()=>GAME.state.travel.flying&&document.getElementById('toast').textContent.includes('Find open')),'Ocean landing is rejected with explicit feedback');
  await page.evaluate(()=>GAME.test.position(V8_TRAVEL.width-5,500));await move(0,-1,150);
  assert(await page.evaluate(()=>GAME.state.player.x<150),'Actual flight wraps east-west');
  await page.evaluate(()=>{const site=V8_TRAVEL.sites[1];GAME.test.position(site.x,site.y+32);});
  assert(!await page.evaluate(()=>GAME.test.enterScene('nyc-central',[715/1448*1000,985/1086*1000])),'Cannot enter a city while airborne');
  await activate('#travel-action');assert(await page.evaluate(()=>!GAME.state.travel.flying),'Clear destination ground allows landing');
  const parked=await page.evaluate(()=>GAME.state.travel.plane);
  await interact();await page.waitForFunction(()=>GAME.state.scene==='nyc-central');
  assert(await page.evaluate(()=>!GAME.blocked(GAME.state.player.x,GAME.state.player.y)&&GAME.blocked(200,200)&&GAME.blocked(720,760)),'New York arrival safe and the hotel/fountain solid');
  const n0=await page.evaluate(()=>GAME.state.player);await move(-1,0,250);
  assert(await page.evaluate(before=>GAME.state.player.x<before.x-10,n0),'NYC keyboard/touch exploration works');
  await page.evaluate(()=>  GAME.test.position(730,640));await interact();
    assert((await page.locator('#dialog-body').innerText()).includes('fountain'),'Real fountain interaction works');await activate('#continue');await settle();
  if(artifactDir)await page.screenshot({path:artifactDir+'\\v8-nyc-'+width+'x'+height+'.png'});
  await page.evaluate(()=>GAME.test.position(720,1000));await move(0,1,400);await page.waitForFunction(()=>GAME.state.scene==='world');
  assert(await page.evaluate(old=>GAME.state.travel.plane.x===old.x&&GAME.state.travel.plane.y===old.y,parked),'Jet remains parked after a NYC visit');
  await activate('#travel-action');await page.evaluate(()=>{const site=V8_TRAVEL.sites[0];GAME.test.position(site.x,site.y+32);});await activate('#travel-action');
  await interact();await page.waitForFunction(()=>GAME.state.scene==='north');
  assert(await page.evaluate(before=>V4_RPG.members.coco.hp===before.hp&&JSON.stringify(V4_RPG.inventory)===JSON.stringify(before.inventory)&&JSON.stringify(GAME.state.story.completed)===JSON.stringify(before.completed),snapshot),'Round trip preserves HP, inventory and story progress');
  assert(await page.locator('#travel-action').isHidden()&&await page.locator('#open-world-map').isHidden(),'Travel controls disappear back in the neighborhood');
  await activate('#help');await page.selectOption('#jump-site','philippines');await activate('#jump-world');
  await page.waitForFunction(()=>GAME.state.scene==='world'&&!document.getElementById('dialog').open);await settle();
  assert(await page.evaluate(()=>{const s=V8_TRAVEL.sites.find(x=>x.id==='philippines'),t=GAME.state.travel;return !t.flying&&Math.hypot(t.plane.x-s.x,t.plane.y-s.y)<80;}),'Help developer jump parks the jet beside the Philippines');
  await activate('#travel-action');assert(await page.evaluate(()=>GAME.state.travel.flying),'Jet boards right after a developer jump');
  await activate('#travel-action');assert(await page.evaluate(()=>!GAME.state.travel.flying),'Jet lands again beside the Philippines');
  await page.evaluate(()=>{const s=V8_TRAVEL.sites.find(x=>x.id==='philippines');GAME.test.position(s.x,s.y+8);});await interact();await page.waitForFunction(()=>GAME.state.scene==='philippines');
  for(const id of ['nyc-north','nyc-east','nyc-west','paris-central','paris-north','paris-east','paris-west','egypt','italy','philippines','japan']){
   const result=await page.evaluate(async id=>{const ok=await GAME.test.enterScene(id,[SCENES[id].spawn.x/SCENES[id].width*1000,SCENES[id].spawn.y/SCENES[id].height*1000]);return {ok,scene:GAME.state.scene,safe:!GAME.blocked(GAME.state.player.x,GAME.state.player.y)};},id);
   assert(result.ok&&result.scene===id&&result.safe,'New destination opens with a safe arrival: '+id);
  }
  if(artifactDir)await page.screenshot({path:artifactDir+'\\v8-destination-'+width+'x'+height+'.png'});
  assert(errors.length===0,'No world exceptions: '+errors.join('; '));assert(failed.length===0,'No failed world assets: '+failed.join('; '));
  return {world:'passed',width,height,touch,flightFrameMs:Math.round(frames*10)/10,checks:['Help developer jump / New York, Paris, Egypt, Italy, Philippines and Japan scenes open','North-meteor road / overhead walking','Paused overview / future destination labels','Plane boarding / perspective flight / menu-hidden pause / terrain crossing / world wrap','Rejected ocean landing / safe NYC arrival / solid buildings / actual city interaction','NYC return / retained plane / Gaithersburg return / party-story preservation'],errors,failed};
 }finally{await page.unroute(pattern);page.off('pageerror',onError);page.off('console',onConsole);page.off('response',onResponse);}
};
