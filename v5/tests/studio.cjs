const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {createStudioServer}=require('..\\tools\\studio-server.cjs'),{chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright');
const root=path.resolve(__dirname,'..','..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'gburg-studio-test-')),dataPath=path.join(temp,'scene-edits.json');
fs.copyFileSync(path.join(root,'v5','data','scene-edits.json'),dataPath);
const server=createStudioServer({root,dataPath});
(async()=>{
 let browser;
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port,url=origin+'/v5/studio/';
  const info=await (await fetch(origin+'/api/studio')).json(),headers={'Content-Type':'application/json','Origin':origin,'X-Studio-Token':info.token};
  assert.equal((await fetch(origin+'/api/studio',{method:'POST',headers:{...headers,Origin:'https://example.com'},body:JSON.stringify({data:info.data,revision:info.revision})})).status,403);
  assert.equal((await fetch(origin+'/api/studio',{method:'POST',headers:{...headers,'X-Studio-Token':'wrong'},body:'{}'})).status,403);
  assert.equal((await fetch(origin+'/api/studio',{method:'POST',headers,body:JSON.stringify({data:{version:1,scenes:{bad:{}}},revision:info.revision})})).status,400);
  assert.equal((await fetch(origin+'/api/studio',{method:'POST',headers,body:JSON.stringify({data:info.data,revision:'stale'})})).status,409);
  assert.equal((await fetch(origin+'/art%20inbox/Gary%20Sprites.png')).status,403);
  assert.equal((await fetch(origin+'/v5/tools/studio-server.cjs')).status,403);
  browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[],failed=[];
  page.on('pageerror',error=>errors.push(error.message));page.on('response',response=>{if(response.status()>=400)failed.push(response.url());});
  page.on('console',message=>{if(message.type()==='error'&&message.text().startsWith('Studio preview failed:'))errors.push(message.text());});
  await page.goto(url);await page.waitForFunction(()=>window.GBURG_STUDIO&&GBURG_STUDIO.state.preview.actors.length>0);
  const iframe=page.frames().find(frame=>frame.url().endsWith('preview.html'));
  for(const width of [390,650,1100,820,1440]){
   await page.setViewportSize({width,height:1000});await page.waitForTimeout(120);
  }
  assert(await iframe.locator('#preview-error').isHidden(),'Viewport resizing does not create observer errors');
  assert(await iframe.evaluate(()=>!window.GAME&&!window.V5_EVENTS&&!window.V4_RPG),'Preview has no gameplay or reward state');
  let previewedShots=0;
  for(const event of await iframe.evaluate(()=>Object.keys(V5_CINEMA.catalog))){
   await page.selectOption('#scene',event);
   await page.waitForFunction(event=>GBURG_STUDIO.state.preview.event===event&&!GBURG_STUDIO.state.preview.loading&&!document.getElementById('scene').disabled,event);
   const times=await iframe.evaluate(()=>{let at=0;return V5_CINEMA.catalog[V5_CINEMA.state.event].shots.map(shot=>{const midpoint=at+shot.seconds/2;at+=shot.seconds;return midpoint;});});
   for(const time of times){
    await page.locator('#timeline').fill(String(time));await page.locator('#timeline').dispatchEvent('input');
    assert(await iframe.evaluate(()=>!V5_CINEMA.state.error&&V5_CINEMA.state.actors.every(a=>Number.isFinite(a.x)&&Number.isFinite(a.y))),'Every authored shot renders cleanly');
    previewedShots++;
   }
  }
  await page.selectOption('#scene','banquet');await page.waitForFunction(()=>GBURG_STUDIO.state.preview.event==='banquet'&&!document.getElementById('scene').disabled);
  await page.locator('#timeline').fill('48');await page.locator('#timeline').dispatchEvent('input');assert(await iframe.locator('#story-ending').isVisible());
  await page.selectOption('#scene','montage');await page.waitForFunction(()=>GBURG_STUDIO.state.preview.event==='montage'&&!document.getElementById('scene').disabled);
  await page.selectOption('#shot','1');await page.locator('#timeline').fill('5.5');await page.locator('#timeline').dispatchEvent('input');
  assert.equal(await page.evaluate(()=>GBURG_STUDIO.state.preview.shot),1);
  const original=await iframe.evaluate(()=>JSON.stringify(V5_CINEMA.state.camera));
  await page.locator('#timeline').fill('12');await page.locator('#timeline').dispatchEvent('input');
  await page.locator('#timeline').fill('5.5');await page.locator('#timeline').dispatchEvent('input');
  assert.equal(await iframe.evaluate(()=>JSON.stringify(V5_CINEMA.state.camera)),original,'Seek camera is independent of previous frames');
  await page.evaluate(()=>document.activeElement.blur());
  await page.keyboard.press('ArrowRight');assert(Math.abs(await page.evaluate(()=>GBURG_STUDIO.state.preview.elapsed)-5.5-1/30)<.000001);
  await page.keyboard.press('ArrowLeft');assert(Math.abs(await page.evaluate(()=>GBURG_STUDIO.state.preview.elapsed)-5.5)<.000001);
  await page.keyboard.press('Space');assert(await page.evaluate(()=>GBURG_STUDIO.state.playing));
  await page.keyboard.press('Space');assert(!(await page.evaluate(()=>GBURG_STUDIO.state.playing)));
  await page.check('#manual-camera');
  for(const [id,value] of [['camera-x','430'],['camera-y','835'],['camera-zoom','0.8']]){
   await page.fill('#'+id,value);await page.locator('#'+id).dispatchEvent('change');
  }
  assert(await iframe.evaluate(()=>{const c=V5_CINEMA.state.camera,canvas=document.getElementById('game');return c.scale===.8&&Math.abs(c.x+canvas.width/c.scale/2-430)<.000001&&Math.abs(c.y+canvas.height/c.scale/2-835)<.000001;}));
  await page.uncheck('#manual-camera');
  const beforeBubble=await iframe.locator('#story-bubble').boundingBox();
  await page.selectOption('#bubble-placement','below');
  const afterBubble=await iframe.locator('#story-bubble').boundingBox();assert(afterBubble.y>beforeBubble.y,'Below placement changes actual bubble');
  await page.selectOption('#actor','chris');await page.fill('#actor-x','20');await page.locator('#actor-x').dispatchEvent('change');
  assert(await page.evaluate(()=>GBURG_STUDIO.state.preview.actors.filter(a=>a.id==='chris').every(a=>a.x-a.baseX===20)));
  await page.click('#undo');assert.equal(await page.inputValue('#actor-x'),'0');
  await page.click('#redo');assert.equal(await page.inputValue('#actor-x'),'20');
  const actorPoint=await iframe.evaluate(()=>{
   const s=V5_CINEMA.state,a=s.actors.find(a=>a.id==='chris'),c=s.camera,canvas=document.getElementById('game'),box=canvas.getBoundingClientRect();
   return {x:(a.x-c.x)*c.scale*box.width/canvas.width,y:(a.y-c.y-25)*c.scale*box.height/canvas.height,width:box.width,height:box.height};
  }),iframeBox=await page.locator('#preview').boundingBox();
  const ax=iframeBox.x+actorPoint.x*iframeBox.width/actorPoint.width,ay=iframeBox.y+actorPoint.y*iframeBox.height/actorPoint.height;
  await page.mouse.move(ax,ay);await page.mouse.down();await page.mouse.move(ax+20,ay+10,{steps:5});await page.mouse.up();
  await page.waitForFunction(()=>GBURG_STUDIO.state.data.scenes.montage[1].actors.chris.dx>20);
  await page.click('#undo');assert.equal(await page.inputValue('#actor-x'),'20');
  await page.fill('#seconds','5');await page.locator('#seconds').dispatchEvent('change');
  await page.fill('#text','Testing the splash preview.');await page.locator('#text').dispatchEvent('change');
  assert.equal(await page.evaluate(()=>GBURG_STUDIO.state.preview.duration),25);
  await page.selectOption('#layout','portrait');await page.waitForTimeout(150);
  const portrait=await page.locator('#preview').boundingBox();assert(portrait.height>portrait.width);
  const b=await iframe.locator('#story-bubble').boundingBox(),c=await iframe.locator('#game').boundingBox();
  assert(b.x>=c.x&&b.x+b.width<=c.x+c.width+1&&b.y>=c.y&&b.y+b.height<=c.y+c.height+1,'Phone bubble stays in bounds');
  const box=await iframe.locator('#story-bubble').boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+20,box.y+box.height/2-30,{steps:5});await page.mouse.up();
  await page.waitForFunction(()=>GBURG_STUDIO.state.data.scenes.montage[1].bubble.placement==='custom');
  await page.click('#save');await page.waitForFunction(()=>!GBURG_STUDIO.state.dirty);
  const persisted=JSON.parse(fs.readFileSync(dataPath,'utf8'));
  assert.equal(persisted.scenes.montage[1].seconds,5);assert.equal(persisted.scenes.montage[1].text,'Testing the splash preview.');
  await page.reload();await page.waitForFunction(()=>window.GBURG_STUDIO);await page.selectOption('#shot','1');
  assert.equal(await page.inputValue('#seconds'),'5');assert.equal(await page.inputValue('#actor-x'),'20');
  await page.click('#play');await page.waitForTimeout(250);assert((await page.evaluate(()=>GBURG_STUDIO.state.preview.elapsed))>4);
  await page.click('#play');assert.equal(await page.evaluate(()=>GBURG_STUDIO.state.playing),false);
  const downloadPromise=page.waitForEvent('download');await page.click('#export');const download=await downloadPromise;assert.equal(download.suggestedFilename(),'scene-edits.json');
  const downloaded=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.deepEqual(downloaded,persisted);
  await page.locator('#import').setInputFiles({name:'scene-edits.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(persisted))});
  await page.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Imported draft'));
  await page.setInputFiles('#import',{name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"version":999,"scenes":{}}')});
  await page.waitForFunction(()=>document.getElementById('status').dataset.error==='true');
  assert.deepEqual(await page.evaluate(()=>GBURG_STUDIO.state.data),persisted,'Invalid imports preserve the valid current draft');
  await page.selectOption('#scene','recruit-chris');await page.waitForFunction(()=>GBURG_STUDIO.state.preview.event==='recruit-chris'&&!GBURG_STUDIO.state.preview.loading);
  await page.selectOption('#actor','chris');await page.fill('#actor-y','12');await page.locator('#actor-y').dispatchEvent('change');
  await page.click('#save');await page.waitForFunction(()=>!GBURG_STUDIO.state.dirty);
  const game=await context.newPage();const gameErrors=[];game.on('pageerror',e=>gameErrors.push(e.message));
  await game.goto(origin+'/v5/');await game.waitForFunction(()=>GAME.ready&&V3_INTRO.state.ready);
  assert(await game.evaluate(()=>!('preview' in V5_CINEMA)),'Preview APIs are absent from normal gameplay');
  await game.click('#intro-skip');await game.waitForFunction(()=>V5_CINEMA.state.event==='awakening'&&!V5_CINEMA.state.loading);
  await game.close();
  const verification=await context.newPage();
  verification.on('pageerror',error=>gameErrors.push(error.message));
  await verification.route('**/v5/src/cinema.js*',async route=>{
   const response=await route.fetch(),source=await response.text();
   await route.fulfill({response,body:source.replace('window.V5_CINEMA={','window.V5_CINEMA={test:{advance:advanceTime},')});
  });
  await verification.goto(origin+'/v5/');await verification.waitForFunction(()=>GAME.ready&&V3_INTRO.state.ready);
  await verification.click('#intro-skip');await verification.waitForFunction(()=>V5_CINEMA.state.event==='awakening'&&!V5_CINEMA.state.loading);
  await verification.evaluate(()=>V5_CINEMA.test.advance(20));
  await verification.evaluate(()=>V5_CINEMA.play('montage'));
  await verification.waitForFunction(()=>V5_CINEMA.state.event==='montage'&&!V5_CINEMA.state.loading);
  await verification.evaluate(()=>V5_CINEMA.test.advance(4.2));
  assert.equal(await verification.evaluate(()=>V5_CINEMA.state.duration),25);
  assert.equal(await verification.locator('#story-bubble p').textContent(),'Testing the splash preview.');
  assert.equal(await verification.evaluate(()=>V5_CINEMA.state.shot),1);
  await verification.evaluate(()=>V5_CINEMA.test.advance(30));
  await verification.evaluate(()=>V5_CINEMA.play('recruit-chris'));
  await verification.waitForFunction(()=>V5_CINEMA.state.event==='recruit-chris'&&!V5_CINEMA.state.loading);
  await verification.waitForFunction(()=>V5_CINEMA.state.actors.some(a=>a.id==='chris'));
  assert(await verification.evaluate(()=>V5_CINEMA.state.actors.filter(a=>a.id==='chris').every(a=>a.y-a.baseY===12)),'Saved actor offsets are used by real gameplay');
  const hosted=await context.newPage();
  hosted.on('pageerror',error=>errors.push(error.message));
  await hosted.route('**/api/studio',route=>route.fulfill({status:404,contentType:'application/json',body:'{"error":"Static hosting"}'}));
  await hosted.goto(url);await hosted.waitForFunction(()=>window.GBURG_STUDIO);
  assert(await hosted.locator('#save').isDisabled());assert(!(await hosted.locator('#export').isDisabled()));
  assert((await hosted.locator('#save-help').textContent()).startsWith('Hosted mode:'));
  if(process.env.V4_ARTIFACT_DIR)await page.screenshot({path:path.join(process.env.V4_ARTIFACT_DIR,'studio-first-slice.png'),fullPage:true});
  await context.close();assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);assert.deepEqual(gameErrors,[]);
  console.log(JSON.stringify({studio:'passed',previewedShots,checks:['loopback restricted save and conflict protection','no gameplay/rewards in preview','all authored shots and ending card render','deterministic camera seeking','dialogue/bubble/timing and actor editing','undo/redo and real pointer drag','phone bounds','save survives reload','export/import contain exact settings','saved dialogue/duration/offsets consumed in actual game','normal game exposes no preview API','static hosted editor uses export rather than pretend-save'],errors,failed}));
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
  fs.unlinkSync(dataPath);fs.rmdirSync(temp);
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
