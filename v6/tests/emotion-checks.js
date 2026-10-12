return async function checkEmotions(page,{width=1280,height=900,touch=false,artifactDir}={}){
 const assert=(value,message)=>{if(!value)throw new Error(message);};
 const errors=[],failed=[],onError=e=>errors.push(e.message),onResponse=r=>{if(r.status()>=400)failed.push(r.url());};
 const pattern='**/v6/src/cinema.js*';
 page.on('pageerror',onError);page.on('response',onResponse);
 await page.route(pattern,async route=>{
  const response=await route.fetch(),source=await response.text();
  await route.fulfill({response,body:source.replace('window.V5_CINEMA={','window.V5_CINEMA={test:{advance:advanceTime},')});
 });
 await page.addInitScript(()=>{
  window.__cocoDraws=[];
  const original=CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage=function(...args){
   const src=args[0].src||'';
   if(this.canvas.id==='game'&&window.V5_CINEMA?.active&&(/coco-emotions\.png/.test(src)||/characters\/coco\/sheets\/walk_4dir\.png/.test(src))){
    const entry={sheet:/coco-emotions/.test(src)?'emotions':'walking',shot:V5_CINEMA.state.shot,x:args[1],y:args[2],w:args[3],h:args[4],dx:args[5],dy:args[6]};
    if(!__cocoDraws.some(draw=>JSON.stringify(draw)===JSON.stringify(entry)))__cocoDraws.push(entry);
   }
   return original.apply(this,args);
  };
 });
 async function boot(){
  await page.goto(page.url().split('/v6/')[0]+'/v6/');await page.waitForFunction(()=>GAME.ready&&V3_INTRO.state.ready);
  if(touch)await page.locator('#intro-skip').tap();else await page.locator('#intro-skip').click();
  await page.waitForFunction(()=>V5_CINEMA.state.event==='awakening'&&!V5_CINEMA.state.loading);
 }
 async function nextShot(){await page.evaluate(()=>V5_CINEMA.test.advance(V5_CINEMA.catalog.awakening.shots[V5_CINEMA.state.shot].seconds-V5_CINEMA.state.age+.01));}
 async function capture(name){if(artifactDir)await page.screenshot({path:artifactDir+'\\world-emotion-'+name+'-'+width+'x'+height+'.png'});}
 try{
  await boot();await page.waitForTimeout(650);
  assert(await page.evaluate(()=>new Set(__cocoDraws.filter(d=>d.shot===0&&d.sheet==='emotions').map(d=>d.x)).size===3),'All three actual Coco talking frames draw on the gameplay canvas');
  assert(await page.evaluate(()=>__cocoDraws.every(d=>d.w===64&&d.h===64&&d.dx===-32&&d.dy===-60)),'Original human foot anchor remains unchanged');
  await capture('talk');await nextShot();await page.waitForTimeout(400);
  assert(await page.evaluate(()=>__cocoDraws.some(d=>d.shot===1&&d.sheet==='walking'&&d.y===192)&&!__cocoDraws.some(d=>d.shot===1&&d.sheet==='emotions')),'Window approach retains original upward walking');
  await nextShot();await page.waitForTimeout(650);
  assert(await page.evaluate(()=>new Set(__cocoDraws.filter(d=>d.shot===2&&d.sheet==='emotions'&&d.y===64).map(d=>d.x)).size===3),'Three surprised frames play in the game view');
  await capture('surprised');await page.evaluate(()=>V5_CINEMA.test.advance(20));
  assert(await page.evaluate(()=>!V5_CINEMA.active&&V5_EVENTS.state.completed.includes('awakening')&&typeof V5_CINEMA.skip==='function'&&!('next' in V5_CINEMA)),'Production director supports explicit skip without exposing shot-step controls');
  await page.emulateMedia({reducedMotion:'reduce'});await boot();await page.waitForTimeout(650);
  assert(await page.evaluate(()=>__cocoDraws.filter(d=>d.shot===0&&d.sheet==='emotions').every(d=>d.x===0)),'Reduced motion holds talking frame zero');
  await nextShot();await nextShot();await page.waitForTimeout(650);
  assert(await page.evaluate(()=>__cocoDraws.filter(d=>d.shot===2&&d.sheet==='emotions').every(d=>d.x===64)),'Reduced motion holds surprised frame one');
  await page.evaluate(()=>V5_CINEMA.test.advance(20));
  assert(errors.length===0&&failed.length===0,'Emotion errors/assets: '+errors.concat(failed).join('; '));
  return {cocoEmotions:6,width,height,touch,errors,failed,checks:['same game canvas','actual talking/surprised frames','original walking/foot anchor','no separate cinematic overlay','reduced motion']};
 }finally{await page.emulateMedia({reducedMotion:'no-preference'});await page.unroute(pattern);page.off('pageerror',onError);page.off('response',onResponse);}
};
