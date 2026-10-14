return async function checkScenes(page,{width,height,touch,artifactDir}={}){
 const assert=(value,message)=>{if(!value)throw new Error(message);};
 const errors=[],onError=error=>errors.push(error.message);
 page.on('pageerror',onError);
 const activate=selector=>touch?page.locator(selector).tap():page.locator(selector).click();
 try{
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>GAME.ready&&V3_INTRO.state.ready);
  await activate('#intro-skip');
  assert(await page.evaluate(()=>V5_CINEMA.play('montage')),'Montage starts');
  await page.waitForFunction(()=>V5_CINEMA.state.event==='montage'&&V5_CINEMA.state.shot===1&&V5_CINEMA.state.actors.some(a=>a.id==='chris'));
  assert(await page.evaluate(()=>V5_CINEMA.state.actors.filter(a=>a.id==='chris').length===1&&V5_CINEMA.state.actors.find(a=>a.id==='chris').baseY===848),'Swim-panic montage retains underwater Chris');
  if(artifactDir)await page.screenshot({path:artifactDir+'\\v7-swim-panic-'+width+'x'+height+'.png'});
  await activate('#cutscene-skip');await page.waitForFunction(()=>!V5_CINEMA.active);
  assert(await page.evaluate(()=>V5_CINEMA.play('recruit-chris')),'Recruitment starts');
  for(const shot of [0,1]){
   await page.waitForFunction(shot=>V5_CINEMA.state.event==='recruit-chris'&&V5_CINEMA.state.shot===shot&&V5_CINEMA.state.actors.some(a=>a.id==='chris'),shot);
   assert(await page.evaluate(()=>{const chris=V5_CINEMA.state.actors.filter(a=>a.id==='chris');return chris.length===1&&chris[0].swim&&chris[0].baseY<820;}),'Recruitment shot '+shot+' has only the surface swimmer');
   if(shot===0&&artifactDir)await page.screenshot({path:artifactDir+'\\v7-chris-recruit-'+width+'x'+height+'.png'});
  }
  await activate('#cutscene-skip');await page.waitForFunction(()=>!V5_CINEMA.active);
  assert(!errors.length,'No scene exceptions: '+errors.join('; '));
  return {scenes:'passed',width,height,touch,checks:['Underwater Chris retained in swim-panic montage','One surface Chris in both recruitment shots'],errors};
 }finally{page.off('pageerror',onError);}
};
