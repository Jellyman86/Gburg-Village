return async function checkOpening(page,{width=1280,height=900,touch=false,artifactDir}={}){
 const assert=(value,message)=>{if(!value)throw new Error(message);};
 const errors=[],failed=[],onError=error=>errors.push(error.message),onResponse=response=>{if(response.status()>=400)failed.push(response.url());};
 page.on('pageerror',onError);page.on('response',onResponse);
 const activate=selector=>touch?page.locator(selector).tap():page.locator(selector).click();
 let cdp;
 async function move(key,predicate){
  if(touch){
   const box=await page.locator('#joystick').boundingBox(),d=box.width*.32;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:box.x+box.width/2+(key==='d'?d:key==='a'?-d:0),y:box.y+box.height/2+(key==='s'?d:key==='w'?-d:0)}]});
  }else await page.keyboard.down(key);
  try{await page.waitForFunction(predicate,null,{timeout:8000});}
  catch(error){if(artifactDir)await page.screenshot({path:artifactDir+'\\opening-blocked-'+width+'x'+height+'.png'});throw new Error('Raw '+key+' movement failed: '+JSON.stringify(await page.evaluate(()=>GAME.state.player)),{cause:error});}
  finally{if(touch)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else await page.keyboard.up(key);}
 }
 async function portal(id){
  const point=await page.evaluate(id=>{
   const portal=SCENES[GAME.state.scene].landmarks.find(portal=>portal.id===id),canvas=document.getElementById('game'),box=canvas.getBoundingClientRect(),camera=GAME.state.camera;
   return {scene:portal.to,x:box.left+(portal.x-camera.x)*camera.scale*box.width/canvas.width,y:box.top+(portal.y-15-camera.y)*camera.scale*box.height/canvas.height};
  },id);
  assert(await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.id==='game',point),'Visible raw portal '+id);
  if(touch)await page.touchscreen.tap(point.x,point.y);else await page.mouse.click(point.x,point.y);
  await page.waitForFunction(scene=>GAME.ready&&GAME.state.scene===scene,point.scene);
 }
 async function event(id){
  await page.waitForFunction(id=>V5_CINEMA.state.event===id&&!V5_CINEMA.state.loading,id);
  if(artifactDir)await page.screenshot({path:artifactDir+'\\opening-'+id+'-'+width+'x'+height+'.png'});
  await page.waitForFunction(id=>V5_EVENTS.state.completed.includes(id),id,{timeout:40000});
 }
 try{
  await page.goto(page.url().split('/v6/')[0]+'/v6/');await page.waitForFunction(()=>GAME.ready&&V3_INTRO.state.ready);
  if(touch)cdp=await page.context().newCDPSession(page);
  await activate('#intro-skip');await event('awakening');
  assert(await page.evaluate(()=>GAME.state.scene==='cocoRoom'&&V5_EVENTS.objective().includes('Find Connor')),'Awakening releases normal bedroom exploration');
  await move('a',()=>GAME.state.player.x<=132);await move('s',()=>GAME.ready&&GAME.state.scene==='upstairs');
  await move('a',()=>GAME.state.player.x<=275);await portal('connor-room');await event('connor');
  assert(await page.evaluate(()=>V4_RPG.members.connor.joined&&GAME.state.dinosaur===null),'Connor unlocks, no gameplay dinosaur indoors');
  await activate('#open-menu');await activate('[data-member="connor"]');await activate('#menu-play');
  assert(await page.evaluate(()=>GAME.state.player.id==='connor'&&V5_EVENTS.state.protagonist==='coco'),'Playable switching retains Coco-led narrative');
  await portal('hall');await move('d',()=>GAME.state.player.x>=297);await move('s',()=>GAME.state.player.y>=370);
  await portal('downstairs');await event('family');
  await event('montage');
  assert(await page.evaluate(()=>V4_RPG.members.jason.joined&&V4_RPG.members.peachy.joined&&Object.values(V4_RPG.members).filter(member=>member.joined).length===4&&GAME.state.dinosaur===null),'Family recruits together; montage never resolves future rescues');
  await move('s',()=>GAME.state.player.y>=400);await move('a',()=>GAME.state.player.x<=150);
  await move('s',()=>GAME.state.player.y>=470);await move('a',()=>GAME.state.player.x<=125);
  await portal('to-neighborhood');
  assert(await page.evaluate(()=>GAME.state.scene==='neighborhood'&&GAME.state.input.keys.length===0&&GAME.state.input.joy.x===0),'Front door releases safely to real-time exploration');
  await activate('#help');await activate('#replay-intro');await activate('#intro-skip');
  assert(await page.evaluate(()=>!V5_CINEMA.active&&V5_EVENTS.state.completed.length===4&&Object.values(V4_RPG.members).filter(member=>member.joined).length===4),'Replay never repeats or resets completed story events');
  assert(errors.length===0&&failed.length===0,'Raw opening errors/assets: '+errors.concat(failed).join('; '));
  return {rawOpening:touch?'actual joystick and taps, naturally timed unskippable story':'actual keyboard and clicks, full naturally timed story and montage',width,height,errors,failed};
 }finally{page.off('pageerror',onError);page.off('response',onResponse);}
};
