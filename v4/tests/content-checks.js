return async function checkContent(page,{touch=false,artifactDir}={}){
 const assert=(value,message)=>{if(!value)throw new Error(message);};
 const errors=[],onError=error=>errors.push(error.message);
 const gamePattern='**/v4/src/game.js*',introPattern='**/v4/src/intro.js*';
 page.on('pageerror',onError);
 await page.route(gamePattern,async route=>{
  const response=await route.fetch(),source=await response.text();
  // Keep the target's walk aligned with the shot during touch auto-wait, rather than randomly dodging.
  await route.fulfill({response,body:source.replace('window.GAME={','window.GAME={test:{enterScene,position(x,y){player.x=x;player.y=y;resetInput();updateCamera();updateNearby();},place(id){select(id);player.x=dinoHome.x-28;player.y=dinoHome.y;player.direction="right";Object.assign(dino,{...dinoHome,stunned:0,timer:60,target:{x:dinoHome.x+100,y:dinoHome.y},turnTimer:60,mode:"wander"});powers=makePowers();},},').replace('flight.update(dt,player,town,!unicorn.riding)','flight.update(dt,player,town,false)')});
 });
 await page.route(introPattern,async route=>{
  const response=await route.fetch(),source=await response.text();
  const body=source.replace("function actor(id,x,y,scale=1,dir='down',walk=true,t=elapsed){","function actor(id,x,y,scale=1,dir='down',walk=true,t=elapsed){if(window.__courtTrace)window.__courtTrace.actors.push({id,x,y,dir});")
   .replace('function background(id,x,y,zoom=1){','function background(id,x,y,zoom=1){if(window.__courtTrace)window.__courtTrace.background={id,x,y,zoom};')
   .replace('window.V3_INTRO={','window.V3_INTRO={test:{draw},');
  await route.fulfill({response,body});
 });
 async function screenshot(name){if(artifactDir)await page.screenshot({path:artifactDir+'\\'+name+(touch?'-touch':'-desktop')+'.png'});}
 async function connected(targets){
  return page.evaluate(targets=>{
   const scene=SCENES[GAME.state.scene],step=6,w=Math.ceil(scene.width/step),h=Math.ceil(scene.height/step),seen=new Uint8Array(w*h);
   const start=[Math.round(GAME.state.player.x/step),Math.round(GAME.state.player.y/step)],queue=[start];seen[start[1]*w+start[0]]=1;
   for(let i=0;i<queue.length;i++){
    const [x,y]=queue[i];for(const [a,b] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){
     if(a<0||b<0||a>=w||b>=h||seen[b*w+a]||GAME.blocked(a*step,b*step))continue;seen[b*w+a]=1;queue.push([a,b]);
    }
   }
   return targets.map(([x,y])=>!!seen[Math.round(y/step)*w+Math.round(x/step)]);
  },targets);
 }
 try{
  await page.goto(page.url().split('/v4/')[0]+'/v4/');
  await page.waitForFunction(()=>GAME.ready&&V3_INTRO.state.ready);
  const courtPositions=await page.evaluate(()=>{
   const frames=[];
   for(const time of [3,4.5,5.99]){
    window.__courtTrace={actors:[]};V3_INTRO.test.draw(time);
    const trace=window.__courtTrace,b=trace.background;
    frames.push(trace.actors.map(actor=>({id:actor.id,x:actor.x/b.zoom+b.x,y:actor.y/b.zoom+b.y})));
   }
   window.__courtTrace=null;document.getElementById('intro-curtain').hidden=true;V3_INTRO.test.draw(4.5);
   return frames;
  });
  for(const frame of courtPositions){
   assert(frame.length===4,'All four court characters drawn');
   for(const actor of frame){
    const tennis=actor.id==='adam'||actor.id==='kate';
    assert(actor.x>=(tennis?620:350)&&actor.x<=(tennis?760:555)&&actor.y>=510&&actor.y<=653,'Correct court placement for '+actor.id);
   }
  }
  await screenshot('intro-courts');
  if(touch)await page.locator('#intro-skip').tap();else await page.locator('#intro-skip').click();
  await page.locator('#continue').click();
  await page.evaluate(()=>{for(const id of Object.keys(CHARACTERS))if(!V4_RPG.members[id].joined)V4_RPG.recruit(id);GAME.select('jason');});
  assert(await page.evaluate(()=>CHARACTERS.jeff.name==='Jeff'&&CHARACTERS.chris.name==='Chris'),'Short display names, stable IDs');
  assert(await page.evaluate(()=>V4_RPG.inventory.sword===0&&!V4_RPG.discoveries.sword),'Fresh game has no free sword');
  await page.locator('#open-menu').click();await page.locator('#tab-equip').click();
  assert(await page.locator('[data-equip="sword"]').isDisabled(),'Equip unavailable before discovery');
  await page.locator('#tab-abilities').click();
  assert(await page.locator('[data-ability="sword"]').isDisabled(),'Sword slash unavailable before discovery');
  await page.locator('#close-menu').click();
  await page.evaluate(()=>GAME.test.enterScene('house',[285,863]));
  assert((await connected([[390,307.5]])).every(Boolean),'Sword reachable from front-door arrival');
  await page.evaluate(()=>GAME.test.position(375,317.5));await screenshot('house-sword');
  if(touch)await page.locator('#interact').tap();
  else{
   const point=await page.evaluate(()=>{
    const canvas=document.getElementById('game'),bounds=canvas.getBoundingClientRect(),camera=GAME.state.camera;
    return {x:bounds.left+(390-camera.x)*bounds.width/canvas.width,y:bounds.top+(292.5-camera.y)*bounds.height/canvas.height};
   });
   await page.mouse.click(point.x,point.y);
  }
  assert((await page.locator('#dialog-title').textContent())==='Japanese sword found!','Actual pickup feedback');
  assert(await page.evaluate(()=>V4_RPG.inventory.sword===1&&V4_RPG.discoveries.sword),'Pickup adds exactly one sword');
  await page.locator('#continue').click();
  assert(await page.evaluate(()=>GAME.state.nearest!=='sword'),'Collected pickup disappears from nearby interaction');
  await page.evaluate(()=>GAME.test.enterScene('plaza',[500,844.7265625]));
  await page.evaluate(()=>GAME.test.enterScene('house',[285,863]));
  await page.evaluate(()=>GAME.test.position(390,307.5));await page.keyboard.press('e');
  assert(await page.evaluate(()=>V4_RPG.inventory.sword===1&&!GAME.state.dialog),'Cannot recollect on revisit');
  await page.locator('#open-menu').click();await page.locator('#tab-equip').click();
  await page.locator('[data-equip="sword"]').click();
  await page.locator('#tab-abilities').click();await page.locator('[data-ability="sword"]').click();
  await page.locator('#close-menu').click();
  assert(await page.evaluate(()=>V4_RPG.members.jason.equipment.weapon==='sword'&&V4_RPG.members.jason.ability==='sword'),'Discovered sword equips normally');
  await page.evaluate(()=>GAME.test.enterScene('recreation',[80,870]));
  assert((await connected([[1110,320],[1135,400],[1125,360]])).every(Boolean),'Northeast dogs and their encounter reachable from entrance');
  await page.waitForTimeout(100);
  assert(await page.evaluate(()=>GAME.state.recreation.dogs.every(actor=>actor.x>=1059&&actor.x<=1172&&actor.y>250&&actor.y<450&&!GAME.blocked(actor.x,actor.y))),'Both dogs actually on northeast street');
  await page.evaluate(()=>GAME.test.position(1125,360));await screenshot('northeast-dogs');
  if(touch)await page.locator('#interact').tap();else await page.keyboard.press('e');
  assert((await page.locator('#dialog-body').textContent()).includes('You found Barney and Rosie on the northeast street'),'Find dogs interaction');
  await page.locator('#continue').click();

  const powerModel=await page.evaluate(()=>{
   const check=(value,message)=>{if(!value)throw new Error(message);};
   check(FAMILY_POWERS.definitions.jeff.kind==='baseball'&&FAMILY_POWERS.definitions.ari.kind==='soccer','Baseball and retained soccer definitions');
   check(FAMILY_POWERS.definitions.chris.kind==='water-beam'&&FAMILY_POWERS.definitions.jaime.kind==='tornado','Distinct water and tornado effects');
   function cast(id,{target={x:170,y:100},wall=false}={}){
    const actor={id,x:100,y:100,direction:'right'},hits=[];
    const powers=FAMILY_POWERS.create({blocked:(x)=>wall&&x>=120,getTarget:()=>target,getActor:()=>actor,onHit:()=>hits.push(id)});
    check(powers.activate(actor),'Cast '+id);powers.update(.3);return {powers,hits,actor};
   }
   const beam=cast('chris');check(beam.hits.length===1&&beam.powers.state.casts[0].length>100,'Beam extends and hits once');
   beam.powers.update(.1);check(beam.hits.length===1,'Beam cannot repeatedly hit');
   beam.powers.update(.3);check(beam.powers.state.casts[0].length===220,'Beam maximum range is exactly 220');
   check(cast('chris',{wall:true}).hits.length===0,'Beam stops at scenery');
   check(cast('chris',{target:{x:85,y:100}}).hits.length===0,'Beam does not hit behind caster');
   check(cast('chris',{target:{x:170,y:160}}).hits.length===0,'Beam is aimed, not a radial splash');
   const tornado=cast('jaime',{target:{x:160,y:100}});
   const pose=tornado.powers.pose(tornado.actor);check(tornado.hits.length===1&&pose.rotation===0&&pose.direction,'Skates spin upright, not a flip');
   check(cast('jaime',{wall:true}).hits.length===0,'Tornado cannot hit through walls');
   for(const id of ['jeff','ari']){
    const projectile=cast(id,{target:{x:130,y:100}});
    check(projectile.hits.length===1&&projectile.powers.state.casts[0].landed,'Ball hits once: '+id);
    check(cast(id,{wall:true}).hits.length===0,'Ball stops at scenery: '+id);
   }
   return true;
  });
  assert(powerModel,'Directional/collision power model tests');
  for(const id of ['jeff','ari','chris','jaime']){
   await page.evaluate(id=>GAME.test.place(id),id);
   const before=await page.evaluate(()=>({target:GAME.state.dinosaur,buttonDisabled:document.getElementById('power').disabled,ability:V4_RPG.members[GAME.state.player.id].ability,at:performance.now()}));
   if(touch)await page.locator('#power').tap();else await page.keyboard.press('x');
   const action=await page.evaluate(()=>({casts:GAME.state.powers.casts,target:GAME.state.dinosaur,at:performance.now()}));
   assert(action.casts.some(c=>c.owner===id),'Keyboard/touch actually casts '+id);
   try{
    await page.waitForFunction(()=>GAME.state.dinosaur.stunned>0,null,{timeout:2000});
   }catch(error){
    await screenshot('failed-power-'+id);
    throw new Error('Live '+id+' hit failed: '+JSON.stringify({before,action,state:await page.evaluate(()=>GAME.state)}),{cause:error});
   }
   const cast=await page.evaluate(()=>GAME.state.powers.casts[0]);
   assert(cast.owner===id&&cast.kind===({jeff:'baseball',ari:'soccer',chris:'water-beam',jaime:'tornado'})[id],'Live native power owner and kind: '+id);
   await screenshot('power-'+id);
  }
  assert(errors.length===0,'Browser errors: '+errors.join('; '));
  return {courtPositions,powerModel,errors,results:['Correct intro tennis/basketball courts and short names','One-time reachable Dino house sword pickup, equip gating and revisit protection','Both dogs found on reachable northeast street','Baseball/soccer collision, directional water beam, upright skate tornado and live desktop/touch hits']};
 }finally{await page.unroute(gamePattern);await page.unroute(introPattern);page.off('pageerror',onError);}
};
