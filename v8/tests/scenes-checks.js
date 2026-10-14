return async function checkScenes(page,{width,height,touch,artifactDir}={}){
 const assert=(value,message)=>{if(!value)throw new Error(message);};
 const errors=[],failed=[],onError=error=>errors.push(error.message),onConsole=message=>{if(message.type()==='error')errors.push(message.text());},onResponse=response=>{if(response.status()>=400)failed.push(response.url());};
 page.on('pageerror',onError);page.on('console',onConsole);page.on('response',onResponse);
 const pattern='**/v8/src/game.js*';
 await page.route(pattern,async route=>{
  const response=await route.fetch(),source=await response.text();
  assert(source.includes('window.GAME={'),'Scene fixture target exists');
  const hook="window.GAME={test:{enterScene,position(x,y){if(blocked(x,y))throw new Error('Blocked scene fixture');Object.assign(player,{x,y});resetInput();updateCamera();updateNearby();}},";
  await route.fulfill({response,body:source.replace('window.GAME={',hook)});
 });
 await page.addInitScript(()=>{
  window.__vitoDraws=[];
  const draw=CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage=function(...args){
   const src=args[0].src||'';
   if(this.canvas.id==='game'&&src.includes('/vito-'))__vitoDraws.push({event:window.V5_CINEMA?.state.event,src});
   return draw.apply(this,args);
  };
 });
 const activate=selector=>touch?page.locator(selector).tap():page.locator(selector).click();
 try{
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>GAME.ready&&V3_INTRO.state.ready);
  await activate('#intro-skip');
  assert(await page.evaluate(()=>V5_CINEMA.play('montage')),'Montage starts');
  await page.waitForFunction(()=>V5_CINEMA.state.event==='montage'&&V5_CINEMA.state.shot===1&&V5_CINEMA.state.actors.some(a=>a.id==='chris'));
  assert(await page.evaluate(()=>V5_CINEMA.state.actors.filter(a=>a.id==='chris').length===1&&V5_CINEMA.state.actors.find(a=>a.id==='chris').baseY===848),'Swim-panic montage retains underwater Chris');
  if(artifactDir)await page.screenshot({path:artifactDir+'\\v8-swim-panic-'+width+'x'+height+'.png'});
  await page.waitForFunction(()=>V5_CINEMA.state.event==='montage'&&V5_CINEMA.state.shot===2&&__vitoDraws.some(d=>d.event==='montage'&&d.src.includes('/v5/assets/characters/vito-wrestle.png')));
  assert(await page.evaluate(()=>__vitoDraws.filter(d=>d.event==='montage').every(d=>!d.src.includes('vito-clean-'))),'Montage keeps the original bearded wrestle sprite');
  await activate('#cutscene-skip');await page.waitForFunction(()=>!V5_CINEMA.active);
  assert(await page.evaluate(()=>V5_CINEMA.play('recruit-chris')),'Recruitment starts');
  for(const shot of [0,1]){
   await page.waitForFunction(shot=>V5_CINEMA.state.event==='recruit-chris'&&V5_CINEMA.state.shot===shot&&V5_CINEMA.state.actors.some(a=>a.id==='chris'),shot);
   assert(await page.evaluate(()=>{const chris=V5_CINEMA.state.actors.filter(a=>a.id==='chris');return chris.length===1&&chris[0].swim&&chris[0].baseY<820;}),'Recruitment shot '+shot+' has only the surface swimmer');
   if(shot===0&&artifactDir)await page.screenshot({path:artifactDir+'\\v8-chris-recruit-'+width+'x'+height+'.png'});
  }
  await activate('#cutscene-skip');await page.waitForFunction(()=>!V5_CINEMA.active);
  assert(await page.evaluate(()=>GAME.test.enterScene('district',SCENES.neighborhood.landmarks.find(p=>p.to==='district').arrival)),'Travel to Vito street succeeds');
  await page.evaluate(()=>GAME.test.position(1555,1037));
  assert(await page.evaluate(()=>V5_EVENTS.encounter('vito')),'Real Vito rescue starts');
  for(const pose of ['wrestle','throw','recover']){
   await page.waitForFunction(pose=>__vitoDraws.some(d=>d.event==='recruit-vito'&&d.src.includes('/v7/assets/characters/vito-clean-'+pose+'.png')),pose);
  }
  if(artifactDir)await page.screenshot({path:artifactDir+'\\v8-vito-clean-recruit-'+width+'x'+height+'.png'});
  await page.waitForFunction(()=>!V5_CINEMA.active&&V4_RPG.members.vito.joined);
  assert(await page.evaluate(()=>!V5_EVENTS.encounter('vito')),'Natural completion recruits Vito only once');
  assert(await page.evaluate(()=>__vitoDraws.filter(d=>d.event==='recruit-vito').every(d=>d.src.includes('vito-clean-'))),'All recruitment wrestle/throw/recover draws use clean-shaven sheets');
  assert(await page.evaluate(()=>V5_ACTION_ART.vito.wrestle.sheet.startsWith('../v5/')&&CHARACTERS.vito.sheet==='../assets/characters/vito/sheets/walk_4dir.png'),'Global montage clips and playable Vito are unchanged');
  assert(!errors.length,'No scene exceptions: '+errors.join('; '));
  assert(!failed.length,'No failed scene assets: '+failed.join('; '));
  return {scenes:'passed',width,height,touch,checks:['Underwater Chris retained in swim-panic montage','One surface Chris in both recruitment shots','Original montage Vito; clean-shaven recruitment wrestle/throw/recover','Natural one-time Vito rescue reward; unchanged playable sprite'],errors,failed};
 }finally{await page.unroute(pattern);page.off('pageerror',onError);page.off('console',onConsole);page.off('response',onResponse);}
};
