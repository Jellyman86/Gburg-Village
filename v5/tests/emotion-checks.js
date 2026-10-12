return async function checkEmotions(page,{width=1280,height=900,touch=false,artifactDir}={}){
 const assert=(value,message)=>{if(!value)throw new Error(message);};
 const errors=[],failed=[],onError=error=>errors.push(error.message),onResponse=response=>{if(response.status()>=400)failed.push(response.url());};
 page.on('pageerror',onError);page.on('response',onResponse);
 const activate=selector=>touch?page.locator(selector).tap():page.locator(selector).click();
 await page.addInitScript(()=>{
  window.__cocoDraws=[];
  const original=CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage=function(...args){
   const image=args[0],src=image.src||'';
   if(this.canvas.id==='cinema-canvas'&&(/coco-emotions\.png/.test(src)||/characters\/coco\/sheets\/walk_4dir\.png/.test(src))){
    const state=V5_CINEMA.state,entry={sheet:/coco-emotions\.png/.test(src)?'emotions':'walking',shot:state.shot,x:args[1],y:args[2],w:args[3],h:args[4],dx:args[5],dy:args[6]};
    if(!__cocoDraws.some(draw=>JSON.stringify(draw)===JSON.stringify(entry)))__cocoDraws.push(entry);
   }
   return original.apply(this,args);
  };
 });
 async function boot(){
  await page.goto(page.url().split('/v5/')[0]+'/v5/');await page.waitForFunction(()=>GAME.ready&&V3_INTRO.state.ready);
  await activate('#intro-skip');await page.waitForFunction(()=>V5_CINEMA.state.event==='awakening'&&!V5_CINEMA.state.loading);
 }
 async function capture(name){if(artifactDir)await page.screenshot({path:artifactDir+'\\emotion-'+name+'-'+width+'x'+height+'.png'});}
 try{
  await boot();
  const dimensions=await page.evaluate(async()=>{
   const image=new Image();image.src=CHARACTERS.coco.emotions.sheet;await image.decode();
   return {width:image.width,height:image.height,ids:Object.values(CHARACTERS).filter(character=>character.emotions).map(character=>character.id)};
  });
  assert(dimensions.width===192&&dimensions.height===128&&JSON.stringify(dimensions.ids)==='["coco"]','Six Coco-only emotion cells load from the new transparent atlas');
  await page.waitForTimeout(600);
  assert(await page.evaluate(()=>new Set(__cocoDraws.filter(draw=>draw.shot===0&&draw.sheet==='emotions'&&draw.y===0).map(draw=>draw.x)).size===3),'Stationary speech uses all three actual talking frames');
  assert(await page.evaluate(()=>__cocoDraws.every(draw=>draw.w===64&&draw.h===64&&draw.dx===-32&&draw.dy===-60)),'Emotion and walking frames share the original size/foot anchor');
  await capture('talking');
  await activate('#cinema-next');await page.waitForTimeout(400);
  assert(await page.evaluate(()=>__cocoDraws.some(draw=>draw.shot===1&&draw.sheet==='walking'&&draw.y===192)&&!__cocoDraws.some(draw=>draw.shot===1&&draw.sheet==='emotions')),'Approach to the window retains the original upward walking frames');
  await activate('#cinema-next');await page.waitForTimeout(600);
  assert(await page.evaluate(()=>new Set(__cocoDraws.filter(draw=>draw.shot===2&&draw.sheet==='emotions'&&draw.y===64).map(draw=>draw.x)).size===3),'Dinosaur reveal uses all three surprised-pose frames');
  await capture('surprised');await activate('#cinema-skip');
  assert(await page.evaluate(()=>!V5_CINEMA.active&&V5_EVENTS.state.completed.includes('awakening')&&V5_EVENTS.objective().includes('Find Connor')),'Emotion rendering does not change skip rewards or story objectives');
  await page.emulateMedia({reducedMotion:'reduce'});await boot();await page.waitForTimeout(600);
  assert(await page.evaluate(()=>__cocoDraws.filter(draw=>draw.shot===0&&draw.sheet==='emotions').every(draw=>draw.x===0&&draw.y===0)),'Reduced motion holds the neutral speaking pose');
  await activate('#cinema-next');await activate('#cinema-next');await page.waitForTimeout(600);
  assert(await page.evaluate(()=>__cocoDraws.filter(draw=>draw.shot===2&&draw.sheet==='emotions').every(draw=>draw.x===64&&draw.y===64)),'Reduced motion holds the expressive surprised pose without cycling');
  await activate('#cinema-skip');
  assert(errors.length===0&&failed.length===0,'Emotion errors/assets: '+errors.concat(failed).join('; '));
  return {cocoEmotions:6,width,height,touch,errors,failed,checks:['real PNG talking/surprised animation','fixed foot anchor','walking preserved','skip/objective preserved','static reduced-motion poses']};
 }finally{await page.emulateMedia({reducedMotion:'no-preference'});page.off('pageerror',onError);page.off('response',onResponse);}
};
