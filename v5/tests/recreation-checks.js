return async function checkRecreation(page,{screenshotPath}={}){
 const assert=(value,message)=>{if(!value)throw new Error(message);};
 const routePattern='**/v5/src/game.js*',errors=[],onError=error=>errors.push(error.message);
 page.on('pageerror',onError);
 await page.route(routePattern,async route=>{
  const response=await route.fetch(),source=await response.text();
  await route.fulfill({response,body:source.replace('window.GAME={','window.GAME={test:{enterScene,position(x,y){player.x=x;player.y=y;resetInput();updateCamera();updateNearby();},},').replace('flight.update(dt,player,town,!unicorn.riding)','flight.update(dt,player,town,false)')});
 });
 try{
  await page.goto(page.url().split('/v5/')[0]+'/v5/');
  await page.waitForFunction(()=>GAME.ready&&V3_INTRO.state.ready);await page.locator('#intro-skip').click();
  await page.evaluate(()=>V4_RPG.recruit('jason'));
  assert(await page.evaluate(()=>['ari','jeff','jaime','chris'].every(id=>CHARACTERS[id].walkRowOffset===4&&!CHARACTERS[id].spritePlaceholder)),'New walking art is used, not stand-ins');
  const assets=await page.evaluate(async()=>{
   const paths=['ari','jeff','jaime','chris'].map(id=>['../v4/assets/characters/'+id+'.png',256,512])
    .concat([['../v4/assets/characters/chris-swim.png',256,256],['../v4/assets/companions/barney.png',256,512],['../v4/assets/companions/rosie.png',256,512],['../v4/assets/items/sword.png',64,64],['../v4/assets/items/sword-slash.png',256,64]]);
   for(const [path,width,height] of paths){
    const image=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Missing '+path));image.src=path;});
    if(image.width!==width||image.height!==height)throw new Error('Wrong atlas contract: '+path);
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,width,height).data;
    if(pixels[3]!==0)throw new Error('Transparency lost: '+path);
    if(height===512){
     for(let row=0;row<8;row++)for(let col=0;col<4;col++){
      let occupied=0,maxY=-1,minX=64,maxX=-1;
      for(let y=0;y<64;y++)for(let x=0;x<64;x++){
       if(pixels[((row*64+y)*width+col*64+x)*4+3]<128)continue;
       occupied++;maxY=Math.max(maxY,y);minX=Math.min(minX,x);maxX=Math.max(maxX,x);
      }
      if(occupied<30||maxY!==59||minX<4||maxX>59)throw new Error('Unsafe/empty foot-aligned frame: '+path+' '+row+'/'+col);
     }
    }
   }
   return paths.length;
  });
  assert(assets===9,'All sprite, dog and sword derivatives validated');
  await page.evaluate(()=>GAME.test.enterScene('recreation',[80,870]));
  const connected=await page.evaluate(()=>{
   const step=6,w=Math.ceil(SCENES.recreation.width/step),h=Math.ceil(SCENES.recreation.height/step),seen=new Uint8Array(w*h);
   const start=[Math.round(GAME.state.player.x/step),Math.round(GAME.state.player.y/step)],queue=[start];seen[start[1]*w+start[0]]=1;
   for(let head=0;head<queue.length;head++){
    const [x,y]=queue[head];
    for(const [a,b] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){
     if(a<0||b<0||a>=w||b>=h||seen[b*w+a]||GAME.blocked(a*step,b*step))continue;
     seen[b*w+a]=1;queue.push([a,b]);
    }
   }
   return [[385,345],[575,345],[490,385],[1110,320],[1135,400],[1125,360]].map(([x,y])=>!!seen[Math.round(y/step)*w+Math.round(x/step)]);
  });
  assert(connected.every(Boolean),'Field and northeast dogs reachable from actual recreation entrance');
  assert(await page.evaluate(()=>GAME.blocked(430,425)&&GAME.blocked(657,350)&&GAME.blocked(358,810)),'Benches and pool remain blocked for player');
  const initial=await page.evaluate(()=>GAME.state.recreation);
  await page.waitForTimeout(2700);
  const later=await page.evaluate(()=>GAME.state.recreation);
  assert(later.passes>initial.passes&&later.ball.x!==initial.ball.x,'Jeff and Ari actually pass a moving ball');
  assert(later.swimmer.y!==initial.swimmer.y&&later.skater.y!==initial.skater.y&&later.dogs[0].x!==initial.dogs[0].x,'Chris swims, Jaime skates, both dogs animate');
  assert(await page.evaluate(()=>GAME.state.recreation.friends.concat(GAME.state.recreation.dogs).every(actor=>!GAME.blocked(actor.x,actor.y))),'Soccer friends/dogs remain on their walkable grass/street');
  if(screenshotPath){
   const position=await page.evaluate(()=>GAME.state.player);
   await page.evaluate(()=>GAME.test.position(490,400));await page.screenshot({path:screenshotPath});
   await page.evaluate(position=>GAME.test.position(position.x,position.y),position);
  }
  await page.evaluate(()=>V4_RPG.recruit('ari'));await page.locator('#open-menu').click();
  const frozen=await page.evaluate(()=>GAME.state.recreation);
  await page.waitForTimeout(180);
  assert(JSON.stringify(frozen)===JSON.stringify(await page.evaluate(()=>GAME.state.recreation)),'Menu freezes soccer/dogs/swimmer/skater');
  await page.locator('[data-member="ari"]').click();await page.locator('#menu-play').click();
  assert(await page.evaluate(()=>V4_RECREATION.create().actors({id:'ari'}).every(actor=>actor.id!=='ari')),'No duplicate active teammate');
  await page.waitForTimeout(80);
  assert(await page.evaluate(()=>GAME.state.recreation.ball.waiting),'NPC waits when active teammate is outside field');
  await page.evaluate(()=>GAME.test.position(575,345));await page.waitForTimeout(100);
  assert(await page.evaluate(()=>!GAME.state.recreation.ball.waiting),'Player can replace teammate on field');
  await page.keyboard.press('x');await page.waitForTimeout(80);
  assert(await page.evaluate(()=>GAME.state.powers.casts.some(c=>c.id==='ari'&&c.kind==='soccer')),'Ari soccer power in real game');
  await page.waitForTimeout(1500);
  await page.evaluate(()=>GAME.test.position(490,385));await page.keyboard.press('e');
  assert((await page.locator('#dialog-body').textContent()).includes('Jeff and Ari'),'Soccer field interaction');
  await page.locator('#continue').click();
  await page.evaluate(()=>GAME.test.enterScene('house',[285,863]));
  await page.evaluate(()=>GAME.test.position(390,307.5));await page.keyboard.press('e');
  assert(await page.evaluate(()=>V4_RPG.discoveries.sword&&V4_RPG.inventory.sword===1),'Sword picked up in actual Dino house');
  await page.locator('#continue').click();
  await page.evaluate(()=>GAME.test.enterScene('recreation',[490/1254*1000,385/1254*1000]));
  await page.locator('#open-menu').click();await page.locator('#tab-equip').click();
  await page.locator('[data-equip="sword"]').click();await page.locator('#tab-abilities').click();
  await page.locator('[data-ability="sword"]').click();await page.locator('#close-menu').click();
  await page.keyboard.press('x');await page.waitForTimeout(80);
  assert(await page.evaluate(()=>GAME.state.powers.casts.some(c=>c.kind==='sword')),'Uploaded sword-slash art wired to live cast');
  await page.locator('#open-menu').click();await page.locator('#tab-equip').click();await page.locator('[data-unequip="weapon"]').click();
  await page.locator('#tab-abilities').click();
  assert(await page.locator('[data-ability="sword"]').isDisabled(),'Sword ability gated without weapon');
  assert(await page.evaluate(()=>V4_RPG.members.ari.ability===null&&V4_RPG.inventory.sword===1),'Unequip conserves sword and removes gated ability');
  await page.locator('#close-menu').click();
  await page.evaluate(()=>GAME.test.enterScene('plaza',[500,844.7265625]));
  const away=await page.evaluate(()=>GAME.state.recreation.clock);await page.waitForTimeout(100);
  assert(await page.evaluate(clock=>GAME.state.recreation.clock===clock,away),'Recreation activity pauses off-scene');
  assert(errors.length===0,'Browser errors: '+errors.join('; '));
  return {assets,reachable:connected,passes:later.passes,roster:14,errors,results:['Foot-aligned transparent atlases, new portraits/sprites and dog/sword/swim assets','Reachable bench-lined field, protected benches/pool, animated soccer and ambient characters','Pause, active teammate replacement, soccer shot, sword equipment gating and off-scene suspension']};
 }finally{await page.unroute(routePattern);page.off('pageerror',onError);}
};
