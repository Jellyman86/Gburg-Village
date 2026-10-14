return async function checkHawaii(page,{width,height,touch,artifactDir}={}){
 const assert=(v,m)=>{if(!v)throw new Error(m);},errors=[],failed=[];
 const onError=e=>errors.push(e.message),onConsole=m=>{if(m.type()==='error')errors.push(m.text());},onResponse=r=>{if(r.status()>=400)failed.push(r.url());};
 page.on('pageerror',onError);page.on('console',onConsole);page.on('response',onResponse);
 await page.addInitScript(()=>{
  window.__areaDraws=[];window.__musicBuffers=[];window.__musicPlays=[];
  const play=HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play=function(...args){__musicPlays.push((this.src||this.currentSrc||'').split('?')[0]);return play.apply(this,args);};
  const draw=CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage=function(...args){
   if(this.canvas.id==='game'){
    const src=args[0].src||'';
    if(src.includes('hawaii-')||src.includes('pterodactyl'))__areaDraws.push(src);
    if(__areaDraws.length>300)__areaDraws.splice(0,150);
   }
   return draw.apply(this,args);
  };
  const start=AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start=function(...args){
   if(this.buffer?.length>100){
    const data=this.buffer.getChannelData(0);let peak=0,sum=0,finite=true;
    for(let i=0;i<data.length;i++){finite=finite&&Number.isFinite(data[i]);peak=Math.max(peak,Math.abs(data[i]));sum+=Math.abs(data[i]);}
    __musicBuffers.push({duration:this.buffer.duration,peak,mean:sum/data.length,finite});
   }
   return start.apply(this,args);
  };
 });
 const pattern='**/v8/src/game.js*';
 await page.route(pattern,async route=>{
  const response=await route.fetch(),source=await response.text();
  const hook=`window.GAME={test:{enterScene,
   get flyers(){return worldFlyers.state;},
   position(x,y,direction='down'){if(!airborne()&&blocked(x,y))throw new Error('Blocked Hawaii test placement');Object.assign(player,{x,y,direction});resetInput();updateCamera();updateNearby();},
   quiet(){for(const enemy of extraEnemies[town.id]||[])enemy.timer=1000;},
   faceEnemy(){const e=activeEnemies()[0];if(blocked(e.x,e.y+20))throw new Error('No safe combat fixture');Object.assign(player,{x:e.x,y:e.y+20,direction:'up'});resetInput();updateCamera();updateNearby();return e.hp;}
  },`;
  assert(source.includes('window.GAME={'),'Hawaii fixture target exists');
  await route.fulfill({response,body:source.replace('window.GAME={',hook)});
 });
 const activate=selector=>touch?page.locator(selector).tap():page.locator(selector).click();
 const interact=()=>touch?activate('#interact'):page.keyboard.press('e');
 async function move(dx,dy,ms){
  if(!touch){
   const keys=[];if(dx)keys.push(dx>0?'d':'a');if(dy)keys.push(dy>0?'s':'w');
   for(const key of keys)await page.keyboard.down(key);await page.waitForTimeout(ms);for(const key of keys)await page.keyboard.up(key);
  }else{
   const b=await page.locator('#joystick').boundingBox(),input=await page.context().newCDPSession(page);
   try{
    await input.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2,id:1}]});
    await input.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:b.x+b.width/2+dx*b.width*.34,y:b.y+b.height/2+dy*b.height*.34,id:1}]});
    await page.waitForTimeout(ms);await input.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   }finally{await input.detach();}
  }
 }
 const screenshot=async name=>{if(artifactDir)await page.screenshot({path:artifactDir+'\\v8-'+name+'-'+width+'x'+height+'.png'});};
 try{
  await page.goto(page.url().split('/v8/')[0]+'/v8/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>GAME.ready&&V3_INTRO.state.ready);await activate('#intro-skip');
  await page.evaluate(()=>{if(localStorage.getItem('village-music')==='off')throw new Error('Test context unexpectedly muted');});
  await page.waitForFunction(()=>V5_MUSIC.state.playing&&V5_MUSIC.state.mode==='village');
  assert(await page.evaluate(()=>GAME.test.enterScene('world',[V8_TRAVEL.field.x/V8_TRAVEL.width*1000,V8_TRAVEL.field.y/V8_TRAVEL.height*1000])),'World entrance accepted');
  await activate('#travel-action');await page.waitForFunction(()=>V5_MUSIC.state.mode==='jet'&&V5_MUSIC.state.playing);
  const starts=await page.evaluate(()=>V5_MUSIC.state.startCount);
  await move(0,-1,250);await move(1,0,150);
  assert(await page.evaluate(n=>V5_MUSIC.state.startCount===n,starts),'Jet theme continues without restarting on movement/turns');
  await activate('#music-toggle');assert(await page.evaluate(()=>!V5_MUSIC.state.enabled&&!V5_MUSIC.state.playing),'Music Off silences flight');
  await activate('#music-toggle');await page.waitForFunction(()=>V5_MUSIC.state.mode==='jet'&&V5_MUSIC.state.playing);
  await page.evaluate(()=>GAME.test.position(V8_WORLD_FLYERS.homes[0].x,V8_WORLD_FLYERS.homes[0].y+120));
  const safe=await page.evaluate(()=>({x:GAME.state.player.x,y:GAME.state.player.y,hp:V4_RPG.members.coco.hp}));
  await page.waitForFunction(()=>GAME.test.flyers[0].mode==='follow',null,{timeout:15000});
  await page.waitForTimeout(400);
  assert(await page.evaluate(()=>__areaDraws.some(src=>src.includes('pterodactyl'))),'Actual jet camera draws a world flyer');
  await screenshot('flight');
  await page.waitForFunction(()=>GAME.test.flyers[0].mode==='depart');
  await page.waitForFunction(()=>GAME.test.flyers[0].mode==='wander');
  assert(await page.evaluate(before=>GAME.state.player.x===before.x&&GAME.state.player.y===before.y&&V4_RPG.members.coco.hp===before.hp&&!GAME.state.flight.active&&GAME.test.flyers[0].cooldown>20,safe),'World flyer leaves with no damage/grab/player movement and a long cooldown');
  await page.evaluate(()=>{const s=V8_TRAVEL.sites.find(s=>s.id==='hawaii');GAME.test.position(s.x,s.y+20);});
  await activate('#travel-action');await page.waitForFunction(()=>!GAME.state.travel.flying&&V5_MUSIC.state.mode==='world');
  const parked=await page.evaluate(()=>GAME.state.travel.plane);
  await interact();await page.waitForFunction(()=>GAME.ready&&GAME.state.scene==='hawaii-central'&&V5_MUSIC.state.mode==='hawaii');
  await page.evaluate(()=>GAME.test.quiet());
  assert(await page.evaluate(()=>GAME.state.enemies.length===2&&!GAME.state.flight.active&&SCENES[GAME.state.scene].ambientFlight===false),'Hawaii has its own dinosaurs, not the old grabbing flyer');
  assert((await page.locator('.location strong').innerText())==='Hawaii','Location label names the correct region');
  await screenshot('central');
  await activate('#open-world-map');await activate('[data-destination="hawaii"]');
  assert((await page.locator('#world-map-message').innerText()).includes('You are nearby.')&&!(await page.locator('[data-destination="hawaii"]').innerText()).includes('Future'),'Hawaii is playable and overview uses its actual world position');
  await activate('#close-world-map');
  await activate('#open-menu');
  const paused=await page.evaluate(()=>JSON.stringify({player:GAME.state.player,enemies:GAME.state.enemies}));
  await page.waitForTimeout(250);
  assert(await page.evaluate(p=>JSON.stringify({player:GAME.state.player,enemies:GAME.state.enemies})===p,paused),'Party menu pauses Hawaii movement and dinosaurs');
  await activate('#close-menu');
  const beforeHP=await page.evaluate(()=>GAME.test.faceEnemy());
  if(touch)await activate('#power');else await page.keyboard.press('x');
  await page.waitForFunction(hp=>GAME.state.enemies[0].hp<hp,beforeHP,{timeout:2000});
  assert(await page.evaluate(hp=>GAME.state.enemies[0].hp<hp,beforeHP),'Normal equipped power damages a real Hawaii dinosaur');
  const routes=[
   {zone:'hawaii-north',from:[725,105],move:[0,-1],back:[725,940],reverse:[0,1],returnAt:[725,125],image:'north'},
   {zone:'hawaii-east',from:[1180,545],move:[1,0],back:[185,520],reverse:[-1,0],returnAt:[1160,545],image:'east'},
   {zone:'hawaii-west',from:[140,540],move:[-1,0],back:[1290,545],reverse:[1,0],returnAt:[150,540],image:'west'}
  ];
  for(const route of routes){
   await page.evaluate(p=>GAME.test.position(...p),route.from);
   await move(...route.move,500);await page.waitForFunction(id=>GAME.ready&&GAME.state.scene===id,route.zone);
   await page.evaluate(()=>GAME.test.quiet());await page.waitForTimeout(80);
   assert(await page.evaluate(part=>__areaDraws.some(src=>src.includes('hawaii-'+part+'.webp')),route.image),'Actual '+route.image+' background drawn');
   assert(await page.evaluate(()=>V5_MUSIC.state.mode==='hawaii'&&GAME.state.enemies.length>=2&&!GAME.blocked(GAME.state.player.x,GAME.state.player.y)),'Safe '+route.zone+' arrival, music and dinosaurs');
   await screenshot(route.image);
   await page.evaluate(p=>GAME.test.position(...p),route.back);await move(...route.reverse,1000);
   await page.waitForFunction(()=>GAME.ready&&GAME.state.scene==='hawaii-central');await page.waitForTimeout(100);
   assert(await page.evaluate(p=>Math.hypot(GAME.state.player.x-p[0],GAME.state.player.y-p[1])<70,route.returnAt),'Correct central return, without immediate bounce');
  }
  const snapshot=await page.evaluate(()=>({hp:V4_RPG.members.coco.hp,inventory:{...V4_RPG.inventory},joined:Object.keys(V4_RPG.members).filter(id=>V4_RPG.members[id].joined)}));
  await page.evaluate(()=>GAME.test.position(725,970));await move(0,1,500);
  await page.waitForFunction(()=>GAME.ready&&GAME.state.scene==='world'&&V5_MUSIC.state.mode==='world');
  assert(await page.evaluate(p=>JSON.stringify(GAME.state.travel.plane)===JSON.stringify(p),parked),'Parked jet survives the complete Hawaii visit');
  assert(await page.evaluate(before=>GAME.state.player.id==='coco'&&V4_RPG.members.coco.hp===before.hp&&JSON.stringify(V4_RPG.inventory)===JSON.stringify(before.inventory)&&JSON.stringify(Object.keys(V4_RPG.members).filter(id=>V4_RPG.members[id].joined))===JSON.stringify(before.joined),snapshot),'Hawaii round trip preserves hero, party, HP and items');
  assert(await page.evaluate(()=>{const files=new Set(__musicPlays.filter(s=>s.includes('/assets/music/')));const audio=V8_MUSIC.element;return files.size>=2&&V5_MUSIC.state.playing&&V5_MUSIC.state.track==='golden'&&audio&&Number.isFinite(audio.duration)&&audio.duration>10&&!audio.paused&&__musicPlays.some(s=>s.endsWith('/avicii-levels.mp3'));}),'Real MP3 tracks decode and play: hero theme on land, Levels in the jet, distinct files');
  assert(await page.evaluate(()=>__musicBuffers.every(b=>b.finite&&b.peak>0&&b.peak<1)),'Any synthesized buffers are finite and unclipped');
  assert(errors.length===0,'Unexpected page errors: '+errors.join('; '));assert(failed.length===0,'Failed assets: '+failed.join('; '));
  return {layout:width+'x'+height,touch:!!touch,pass:'Hawaii world entry, all four backgrounds, reversible native-input routes, combat/menu/party retention, parked jet, gentle rendered flyers and real MP3 hero/jet music'};
 }catch(error){
  console.error(await page.evaluate(()=>({scene:GAME?.state.scene,player:GAME?.state.player,music:V5_MUSIC?.state,toast:document.getElementById('toast').textContent})));
  await screenshot('failure');throw error;
 }finally{
  await page.unroute(pattern);page.off('pageerror',onError);page.off('console',onConsole);page.off('response',onResponse);
 }
};
