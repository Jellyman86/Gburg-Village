return async function checkNavigation(page,{touch=false,artifactDir,width=1280,height=900}={}){
 const assert=(value,message)=>{if(!value)throw new Error(message);};
 const errors=[],failed=[],onError=e=>errors.push(e.message),onResponse=r=>{if(r.status()>=400)failed.push(r.url());};
 const pattern='**/v4/src/game.js*';
 page.on('pageerror',onError);page.on('response',onResponse);
 await page.route(pattern,async route=>{
  const response=await route.fetch(),source=await response.text();
  const hook='window.GAME={test:{enterScene,position(x,y){player.x=x;player.y=y;resetInput();updateCamera();updateNearby();},tick(dt){update(dt);draw();}},';
  await route.fulfill({response,body:source.replace('window.GAME={',hook).replace('flight.update(dt,player,town,!unicorn.riding)','flight.update(dt,player,town,false)')});
 });
 const activate=selector=>touch?page.locator(selector).tap():page.locator(selector).click();
 let cdp,touchHeld=false;
 async function stop(){
  if(touch){if(cdp&&touchHeld){await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});touchHeld=false;}}
  else{await page.keyboard.up('Shift');for(const key of ['w','a','s','d'])await page.keyboard.up(key);}
 }
 async function start(key){
  if(touch){
   const box=await page.locator('#joystick').boundingBox(),run=await page.locator('#run').boundingBox(),d=box.width*.32;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[
    {id:1,x:box.x+box.width/2+(key==='d'?d:key==='a'?-d:0),y:box.y+box.height/2+(key==='s'?d:key==='w'?-d:0)},
    {id:2,x:run.x+run.width/2,y:run.y+run.height/2}
   ]});
   touchHeld=true;
  }else{await page.keyboard.down('Shift');await page.keyboard.down(key);}
 }
 async function clickDiamond(portal){
  const point=await page.evaluate(portal=>{
   const canvas=document.getElementById('game'),box=canvas.getBoundingClientRect(),camera=GAME.state.camera;
   return {x:box.left+(portal.x-camera.x)*camera.scale*box.width/canvas.width,y:box.top+(portal.y-15-camera.y)*camera.scale*box.height/canvas.height};
  },portal);
  if(touch)await page.touchscreen.tap(point.x,point.y);else await page.mouse.click(point.x,point.y);
 }
 try{
  await page.goto(page.url().split('/v4/')[0]+'/v4/');await page.waitForFunction(()=>GAME.ready&&V3_INTRO.state.ready);
  if(touch)cdp=await page.context().newCDPSession(page);
  await activate('#intro-skip');await activate('#continue');
  const topology=await page.evaluate(()=>{
   const edges=[];
   for(const [id,scene] of Object.entries(SCENES)){
    for(const portal of scene.landmarks.filter(l=>l.to)){
     const destination=SCENES[portal.to],x=portal.arrival[0]*destination.width/1000,y=portal.arrival[1]*destination.height/1000;
     if(!destination.landmarks.some(l=>l.to===id))throw new Error('Missing reciprocal route: '+id+' -> '+portal.to);
     edges.push({from:id,...portal,destination:{x,y}});
    }
   }
   return edges;
  });
  assert(topology.length===20,'All 20 zone transitions have reciprocal connections');
  const arrivalsByScene={};
  for(const edge of topology)(arrivalsByScene[edge.to]||(arrivalsByScene[edge.to]=[])).push(edge.arrival);
  for(const [scene,arrivals] of Object.entries(arrivalsByScene)){
   for(const arrival of arrivals){
    assert(await page.evaluate(async({scene,arrival})=>await GAME.test.enterScene(scene,arrival),{scene,arrival}),'Scene arrival loads: '+scene);
    const connected=await page.evaluate(()=>{
     const scene=SCENES[GAME.state.scene],step=4,w=Math.ceil(scene.width/step),h=Math.ceil(scene.height/step),seen=new Uint8Array(w*h);
     const x=Math.round(GAME.state.player.x/step),y=Math.round(GAME.state.player.y/step),queue=[y*w+x];seen[queue[0]]=1;
     for(let i=0;i<queue.length;i++){
      const index=queue[i],a=index%w,b=Math.floor(index/w);
      for(const [nx,ny] of [[a+1,b],[a-1,b],[a,b+1],[a,b-1]]){
       const next=ny*w+nx;if(nx<0||ny<0||nx>=w||ny>=h||seen[next]||GAME.blocked(nx*step,ny*step))continue;
       seen[next]=1;queue.push(next);
      }
     }
     return {inside:!!scene.indoor,dinosaur:GAME.state.dinosaur,blocked:GAME.blocked(GAME.state.player.x,GAME.state.player.y),
      portals:scene.landmarks.filter(l=>l.to).map(l=>({id:l.id,reached:!!seen[Math.round(l.y/step)*w+Math.round(l.x/step)]}))};
    });
    assert(!connected.blocked&&connected.portals.every(l=>l.reached),'Every exit reachable from each real arrival: '+scene+' '+JSON.stringify(connected.portals));
    if(connected.inside)assert(connected.dinosaur===null,'No indoor dinosaurs: '+scene);
   }
  }
  for(const edge of topology){
   await page.evaluate(async({edge,arrival})=>GAME.test.enterScene(edge.from,arrival),{edge,arrival:arrivalsByScene[edge.from][0]});
   const approach=await page.evaluate(edge=>{
    const distance=edge.radius+12;
    const candidates=[[edge.x+distance,edge.y,'a'],[edge.x-distance,edge.y,'d'],[edge.x,edge.y+distance,'w'],[edge.x,edge.y-distance,'s']];
    return candidates.find(([x,y])=>{
     if(GAME.blocked(x,y))return false;
     for(let i=0;i<=20;i++)if(GAME.blocked(x+(edge.x-x)*i/20,y+(edge.y-y)*i/20))return false;
     return !SCENES[GAME.state.scene].landmarks.some(l=>l.to&&l.id!==edge.id&&Math.hypot(l.x-x,l.y-y)<25);
    });
   },edge);
   assert(approach,'Clear walk-over approach: '+edge.from+'/'+edge.id);
   await page.evaluate(([x,y])=>{GAME.test.position(x,y);GAME.test.tick(0);},approach);
   await start(approach[2]);
   try{await page.waitForFunction(to=>GAME.ready&&GAME.state.scene===to,edge.to,{timeout:4000});}finally{await stop();}
   await page.waitForTimeout(80);
   assert(await page.evaluate(edge=>GAME.state.scene===edge.to&&Math.hypot(GAME.state.player.x-edge.destination.x,GAME.state.player.y-edge.destination.y)<1,edge),'One run-over transition, exact arrival and no immediate bounce: '+edge.from+'/'+edge.id);
   const arrivalKey=await page.evaluate(()=>{
    const s=GAME.state,p=SCENES[s.scene].landmarks.find(l=>l.to&&Math.hypot(l.x-s.player.x,l.y-s.player.y)<=l.radius);
    if(!p)return null;
    const dx=p.x-s.player.x,dy=p.y-s.player.y;
    return Math.abs(dx)>Math.abs(dy)?(dx>0?'d':'a'):(dy>0?'s':'w');
   });
   if(arrivalKey){
    await start(arrivalKey);await page.waitForTimeout(80);await stop();
    assert(await page.evaluate(to=>GAME.state.scene===to,edge.to),'Movement on the arrival diamond cannot bounce back: '+edge.id);
   }
  }
  await page.evaluate(()=>GAME.test.enterScene('upstairs',[620,555]));
  await start('a');
  try{await page.waitForFunction(()=>GAME.state.player.x<=320,null,{timeout:4000});}finally{await stop();}
  assert(await page.evaluate(()=>GAME.state.scene==='upstairs'),'Leaving an arrival diamond stays in the destination');
  await start('d');
  try{await page.waitForFunction(()=>GAME.ready&&GAME.state.scene==='cocoRoom',null,{timeout:4000});}finally{await stop();}
  // Click/tap every visible zone diamond from outside its old interaction radius.
  for(const edge of topology){
   await page.evaluate(async({edge,arrival})=>GAME.test.enterScene(edge.from,arrival),{edge,arrival:arrivalsByScene[edge.from][0]});
   const spot=await page.evaluate(edge=>{
    const distance=edge.radius+15;
    return [[edge.x+distance,edge.y],[edge.x-distance,edge.y],[edge.x,edge.y+distance],[edge.x,edge.y-distance]].find(([x,y])=>!GAME.blocked(x,y));
   },edge);
   assert(spot,'Click approach: '+edge.id);await page.evaluate(([x,y])=>GAME.test.position(x,y),spot);
   await clickDiamond(edge);
   try{await page.waitForFunction(to=>GAME.ready&&GAME.state.scene===to,edge.to,{timeout:4000});}
   catch(error){
    if(artifactDir)await page.screenshot({path:artifactDir+'\\failed-navigation-'+width+'x'+height+'.png'});
    throw new Error('Diamond click/tap '+edge.from+'/'+edge.id+' failed from '+JSON.stringify(spot)+': '+JSON.stringify(await page.evaluate(()=>GAME.state)),{cause:error});
   }
  }
  await page.evaluate(()=>GAME.test.enterScene('recreation',[895,880]));
  const rock=await page.evaluate(()=>SCENES.recreation.landmarks.find(l=>l.id==='rockband-house'));
  assert(rock.x>627,'Rock Band entrance on right side');
  if(artifactDir)await page.screenshot({path:artifactDir+'\\connected-recreation-'+width+'x'+height+'.png'});
  assert(await page.evaluate(()=>V4_STORY.locations.mark.hint.includes('right/east')&&SCENES.recreation.landmarks.some(l=>l.to==='neighborhood')),'Roster hints and direct Home return updated');
  await activate('#open-menu');await page.keyboard.press('d');
  assert(await page.evaluate(()=>GAME.state.scene==='recreation'&&GAME.state.menu),'Menu blocks movement-triggered travel');
  await activate('#close-menu');
  assert(errors.length===0&&failed.length===0,'Navigation errors/assets: '+errors.concat(failed).join('; '));
  return {transitions:topology.length,touch,errors,failed,results:['Every reciprocal zone route and arrival is collision-reachable','All zone diamonds activate by running over or clicking/tapping outside old interaction radius','Exact arrivals without immediate bounce; leaving and returning re-arms the door; no dinosaurs in any indoor scene','Rock Band on right; recreation connects directly back to Main Street Home and shops']};
 }finally{await stop();await page.unroute(pattern);page.off('pageerror',onError);page.off('response',onResponse);}
};
