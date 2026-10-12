return async function checkIntro(page,{width=1280,height=900,touch=false,artifactDir}={}){
 const assert=(value,message)=>{if(!value)throw new Error(message);};
 const errors=[],failed=[],onError=error=>errors.push(error.message),onResponse=response=>{if(response.status()>=400)failed.push(response.url());};
 const routePattern='**/v5/src/intro.js*';
 page.on('pageerror',onError);page.on('response',onResponse);
 await page.route(routePattern,async route=>{
  const response=await route.fetch(),source=await response.text();
  assert(source.includes('window.V3_INTRO={'),'Intro test hook target');
  const hook='window.V3_INTRO={test:{draw,seek(time){stopVoices();elapsed=time;cue=-1;last=0;},audio(){return {voices:voices.size,rock:rockVoices.size,sound,state:audio?.state};},async renderRock(){const original=audio,time=elapsed;audio=new OfflineAudioContext(1,44100*6,44100);elapsed=6;soundCue(6);const buffer=await audio.startRendering();audio=original;elapsed=time;return Array.from(buffer.getChannelData(0));}},';
  const body=source.replace('window.V3_INTRO={',hook)
   .replace("function actor(id,x,y,scale=1,dir='down',walk=true,t=elapsed){","function actor(id,x,y,scale=1,dir='down',walk=true,t=elapsed){if(window.__bandTrace){const m=c.getTransform();window.__bandTrace.push({id,x:m.a*x+m.c*y+m.e,y:m.b*x+m.d*y+m.f,dir,walk,t,angle:Math.atan2(m.b,m.a)});}")
   .replace("audio.state!=='running'","audio.state!=='running'&&!(audio instanceof OfflineAudioContext)");
  await route.fulfill({response,body});
 });
 const click=async selector=>{if(touch)await page.locator(selector).tap();else await page.locator(selector).click();};
 try{
  await page.goto(page.url().split('/v5/')[0]+'/v5/');
  await page.waitForFunction(()=>GAME.ready&&V3_INTRO.state.ready);
  const assets=await page.evaluate(async()=>{
   const ids=Object.keys(CHARACTERS);
   return Promise.all(ids.map(id=>new Promise((resolve,reject)=>{
    const image=new Image();image.onload=()=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,128,128).data;
     resolve({id,width:image.width,height:image.height,transparent:pixels.some((v,i)=>i%4===3&&v===0),visible:pixels.some((v,i)=>i%4===3&&v>=128)});};
    image.onerror=()=>reject(new Error('Missing portrait '+id));image.src=CHARACTERS[id].portrait;
   })));
  });
  assert(assets.length===15&&assets.every(a=>a.width===128&&a.height===128&&a.transparent&&a.visible),'Fifteen transparent, nonempty 128px portraits');
  const frames=await page.evaluate(()=>{
   const frames=[];
   for(const time of [6,7.125,11.99,12]){
    window.__bandTrace=[];V3_INTRO.test.draw(time);frames.push({time,actors:window.__bandTrace});
   }
   window.__bandTrace=null;document.getElementById('intro-curtain').hidden=true;V3_INTRO.test.draw(7.125);return frames;
  });
  const walking=await page.evaluate(()=>{window.__bandTrace=[];V3_INTRO.test.draw(1.5);const trace=window.__bandTrace;window.__bandTrace=null;V3_INTRO.test.draw(7.125);return trace;});
  assert(walking.length===4&&walking.every(a=>a.y>=380&&a.y<=402),'Opening walk moved 30px below its old bench line');
  assert(await page.evaluate(actors=>actors.every(a=>{const x=a.x/1.23+438,y=a.y/1.23+490;return !TOWN.obstacles.some(o=>x+8>o.x&&x-8<o.x+o.w&&y+4>o.y&&y-4<o.y+o.h);}),walking),'All opening walking feet clear bench collision boxes');
  const expected=['connor','coco','peachy','jason','vito','brie','adam','kate','mark','stephanie'].sort().join(',');
  for(const frame of frames.slice(0,3)){
   assert(frame.actors.map(a=>a.id).sort().join(',')===expected,'Exactly the requested band cast at '+frame.time);
   assert(frame.actors.every(a=>a.x>90&&a.x<860&&a.y>200&&a.y<490),'Every performer visible within the cinematic frame');
  }
  assert(frames[0].actors.some((a,i)=>a.angle!==frames[1].actors[i].angle&&a.y!==frames[1].actors[i].y),'Dancing sways and bounces, not a walking lineup');
  assert(frames[3].actors.every(a=>a.id==='coco'),'Direct cut from Rock Band to Coco mirror scene');
  if(artifactDir)await page.screenshot({path:artifactDir+'\\rockband-'+width+'x'+height+'.png'});
  const bedtime=await page.evaluate(()=>{
   const frames=[];for(const time of [32,33.5,35.99]){window.__bandTrace=[];V3_INTRO.test.draw(time);frames.push(window.__bandTrace);}
   window.__bandTrace=null;return frames;
  });
  assert(bedtime.every(frame=>frame.length===1&&frame[0].id==='coco'&&Math.abs(frame[0].angle+Math.PI/2)<.001),'New ending shows Coco lying in bed, not standing in the bedroom');
  if(artifactDir)await page.screenshot({path:artifactDir+'\\coco-bed-'+width+'x'+height+'.png'});
  await page.evaluate(()=>V3_INTRO.test.draw(7.125));
  const samples=await page.evaluate(()=>V3_INTRO.test.renderRock());
  const rms=Math.sqrt(samples.reduce((sum,v)=>sum+v*v,0)/samples.length),peak=samples.reduce((max,v)=>Math.max(max,Math.abs(v)),0);
  assert(rms>.001&&rms<.04&&peak<.15,'Original six-second riff is audible but subtle, with no clipping');
  assert(samples.slice(-1764).every(v=>Math.abs(v)<.00001),'Rock riff ends before the room cut');
  await page.evaluate(()=>document.getElementById('intro-curtain').hidden=false);
  await click('#intro-start');
  await page.waitForFunction(()=>V3_INTRO.state.playing);
  await page.evaluate(()=>V3_INTRO.test.seek(6));
  await page.waitForFunction(()=>V3_INTRO.test.audio().rock>0);
  assert((await page.locator('#intro-caption').textContent()).includes('rock the living room'),'Rock Band caption is timed to the shot');
  const before=await page.evaluate(()=>GAME.state.player);
  await page.keyboard.press('d');await page.keyboard.press('x');
  assert(await page.evaluate(before=>GAME.state.player.x===before.x&&GAME.state.player.y===before.y&&!GAME.state.powers.casts.length,before),'Gameplay remains paused during band shot');
  await click('#intro-sound');
  assert(await page.evaluate(()=>!V3_INTRO.test.audio().sound&&V3_INTRO.test.audio().voices===0),'Mute cancels all current and queued intro notes');
  await click('#intro-sound');await page.waitForFunction(()=>V3_INTRO.test.audio().rock>0);
  await page.evaluate(()=>V3_INTRO.test.seek(11.95));
  await page.waitForFunction(()=>V3_INTRO.state.elapsed>12);
  assert(await page.evaluate(()=>V3_INTRO.test.audio().rock===0),'No rock music leaks into mirror shot');
  await click('#intro-skip');
  assert(await page.evaluate(()=>!V3_INTRO.active&&V3_INTRO.test.audio().voices===0),'Skip stops every queued voice');
  await click('#help');await click('#replay-intro');await click('#intro-start');
  await page.evaluate(()=>V3_INTRO.test.seek(6));
  await page.waitForFunction(()=>V3_INTRO.test.audio().rock>0);
  await click('#intro-skip');
  assert(await page.evaluate(()=>!V3_INTRO.active&&V3_INTRO.test.audio().rock===0),'Replay starts and stops a fresh rock cue');
  await click('#help');await click('#replay-intro');await click('#intro-sound');await click('#intro-start');
  await page.evaluate(()=>V3_INTRO.test.seek(6));await page.waitForTimeout(150);
  assert(await page.evaluate(()=>V3_INTRO.test.audio().voices===0),'Sound-off opening does not schedule music');
  await click('#intro-skip');
  await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.waitForFunction(()=>V3_INTRO.state.ready);
  const reduced=await page.evaluate(()=>{
   const frames=[];for(const time of [6.1,7.1]){window.__bandTrace=[];V3_INTRO.test.draw(time);frames.push(window.__bandTrace);}window.__bandTrace=null;return frames;
  });
  assert(reduced.every(frame=>frame.every(a=>!a.walk&&a.angle===0))&&reduced[0].every((a,i)=>a.y===reduced[1][i].y),'Reduced motion removes dance bounce, sway and walk cycles');
  assert(errors.length===0&&failed.length===0,'Intro errors/failed requests: '+errors.concat(failed).join('; '));
  return {portraits:assets.length,cast:expected,rms,peak,errors,failed,results:['Uploaded room, ten singing/dancing performers with instrument sprites and direct mirror transition','Opening walkers clear benches; final four seconds show Coco lying in bed','Original subtle six-second chiptune rendered and measured','Scene-only music, mute/unmute, skip, replay, silent playback, gameplay pause and reduced motion']};
 }finally{
  await page.emulateMedia({reducedMotion:'no-preference'});await page.unroute(routePattern);page.off('pageerror',onError);page.off('response',onResponse);
 }
};
