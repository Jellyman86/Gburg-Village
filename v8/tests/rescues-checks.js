// Scripted rescues: Las Vegas pool party (Drew & Alex), Panthers Stadium (Kelce & Taylor), Panthers Field (Bryce).
// Enters each scene directly, lets the real-time script run, defeats the dinosaurs through the combat system and
// asserts the recruits join with their powers. Also covers the new world sites and music places.
return async function checkRescues(page,{width,height,touch,artifactDir}={}){
 const assert=(value,message)=>{if(!value)throw new Error(message);};
 const errors=[],failed=[],onError=e=>errors.push(e.message),onConsole=m=>{if(m.type()==='error')errors.push(m.text());},onResponse=r=>{if(r.status()>=400)failed.push(r.url());};
 page.on('pageerror',onError);page.on('console',onConsole);page.on('response',onResponse);
 const pattern='**/v8/src/game.js*';
 await page.route(pattern,async route=>{
  const response=await route.fetch(),source=await response.text();
  const hook=`window.GAME={test:{enterScene,position(x,y){Object.assign(player,{x,y});resetInput();updateCamera();updateNearby();},
   enemies:()=>encounterEnemies(),defeat(enemy){combat.hit(enemy,{power:{kind:'punch',damage:999},strength:0,x:enemy.x-10,y:enemy.y,dx:1,dy:0,owner:player.id});},
   activate:()=>activatePower(),powers:()=>powers},`;
  assert(source.includes('window.GAME={'),'Rescue fixture target exists');
  await route.fulfill({response,body:source.replace('window.GAME={',hook)});
 });
 const screenshot=async name=>{if(artifactDir)await page.screenshot({path:artifactDir+'\\v8-'+name+'-'+width+'x'+height+'.png'});};
 const state=()=>page.evaluate(()=>GAME.state);
 const closeDialog=async()=>{await page.evaluate(()=>{const d=document.getElementById('dialog');if(d.open)d.close();});await page.evaluate(()=>new Promise(r=>setTimeout(r,0)));};
 const enter=async(id,x,y)=>{await page.evaluate(([id,x,y])=>{GAME.test.enterScene(id,[x,y]);},[id,x,y]);await page.waitForFunction(id=>GAME.state.scene===id&&GAME.ready,id);await page.waitForTimeout(150);};
 // Hosted MP3s take a moment to start, so wait for the place rather than asserting instantly.
 const music=async(place,message)=>{await page.waitForFunction(p=>V8_MUSIC.state.mode===p,place,{timeout:15000}).catch(()=>{throw new Error(message);});};
 const defeatAll=async()=>{await page.evaluate(()=>{for(const e of GAME.test.enemies())if(e.alive&&!e.hidden)GAME.test.defeat(e);});};
 try{
  await page.goto(page.url().split('/v8/')[0]+'/v8/');
  await page.waitForFunction(()=>window.GAME&&GAME.ready,null,{timeout:60000});
  await page.locator('#intro-skip').click().catch(()=>{});
  await page.waitForTimeout(400);
  // The new scenes are crowded; keep the test player standing so the scripts, not stray compies, decide the outcome.
  await page.evaluate(()=>{setInterval(()=>{const m=V4_RPG.members[GAME.state.player.id];if(m)m.hp=m.maxHP;},200);});
  // Roster and extras
  const roster=await page.evaluate(()=>({heroes:Object.keys(CHARACTERS),extras:Object.keys(EXTRAS),joined:Object.entries(V4_RPG.members).filter(([,m])=>m.joined).map(([id])=>id),abilities:Object.fromEntries(['drew','alex','kelce','taylor','bryce-young'].map(id=>[id,V4_RPG.members[id].ability]))}));
  assert(roster.extras.includes('panthersplayer')&&!roster.heroes.includes('panthersplayer'),'Panthers Player is an extra, not a hero');
  for(const id of ['drew','alex','kelce','taylor','bryce-young'])assert(!roster.joined.includes(id),id+' starts unrecruited');
  assert(roster.abilities.drew==='drew'&&roster.abilities.taylor==='taylor'&&roster.abilities.kelce==='kelce'&&roster.abilities['bryce-young']==='bryce-young','New heroes own their powers');
  assert(await page.evaluate(()=>FAMILY_POWERS.definitions.taylor.kind==='song'&&FAMILY_POWERS.definitions.drew.kind==='song'&&FAMILY_POWERS.definitions.kelce.kind==='football'&&FAMILY_POWERS.definitions['bryce-young'].kind==='football'),'Singing and football powers are defined');
  // Drew and Alex must be visibly different people (a mis-saved walk sheet once made them identical).
  const lookDifference=await page.evaluate(async()=>{const load=u=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=u;});const [a,b]=await Promise.all([CHARACTERS.drew.sheet,CHARACTERS.alex.sheet].map(load));const px=img=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.drawImage(img,0,0,64,64,0,0,64,64);return x.getImageData(0,0,64,64).data;};const A=px(a),B=px(b);let d=0,n=0;for(let i=0;i<A.length;i+=4)if(A[i+3]>64||B[i+3]>64){n++;d+=Math.abs(A[i]-B[i])+Math.abs(A[i+1]-B[i+1])+Math.abs(A[i+2]-B[i+2]);}return d/Math.max(1,n)/3;});
  assert(lookDifference>12,'Drew and Alex walk sheets look different (difference '+lookDifference.toFixed(1)+')');
  // World sites and icons
  assert(await page.evaluate(()=>['vegas','charlotte'].every(id=>V8_TRAVEL.sites.some(s=>s.id===id&&s.to&&s.icon))),'Las Vegas and Charlotte are playable world sites with icons');
  // ---- Las Vegas · Encore pool party ------------------------------------------------------------------------------
  await enter('vegas-north',780/1536*1000,960/1024*1000);
  let s=await state();
  assert(s.script&&s.script.phase==='idle','Pool party script starts idle');
  assert(s.enemies.filter(e=>e.kind==='compy'&&!e.scripted&&!e.hidden).length>=14,'Vegas is overrun with compies (pool party deck)');
  await page.evaluate(()=>{for(const e of GAME.test.enemies())if(!e.scripted&&e.alive)GAME.test.defeat(e);});
  assert(s.scriptActors.length===2&&s.scriptActors.every(a=>!a.pose),'Drew and Alex wait by the stage');
  assert(s.enemies.filter(e=>e.scripted).length===4&&s.enemies.filter(e=>e.scripted).every(e=>e.hidden),'Scripted dinosaurs are hidden until triggered');
  assert(s.enemies.filter(e=>e.kind==='trex'&&e.scripted).length===1,'One T. rex crashes the pool party');
  await music('vegas-north','Pool party plays its own music place');
  await page.evaluate(()=>GAME.test.position(790,330));
  await page.waitForFunction(()=>GAME.state.script.phase==='shock',null,{timeout:5000});
  s=await state();
  assert(s.scriptActors.every(a=>a.pose==='surprised'),'Drew and Alex go into their shocked animation');
  assert(s.enemies.filter(e=>e.scripted).every(e=>!e.hidden),'The dinosaurs appear out of nowhere');
  await screenshot('vegas-shock');
  await page.waitForFunction(()=>GAME.state.script.phase==='flee',null,{timeout:5000});
  await page.waitForTimeout(600);
  s=await state();
  assert(s.enemies.filter(e=>e.scripted&&e.alive).every(e=>e.prey==='drew'||e.prey==='alex'),'Dinosaurs chase Drew and Alex');
  await page.waitForFunction(()=>GAME.state.script.phase==='down',null,{timeout:15000});
  s=await state();
  assert(s.scriptActors.every(a=>a.pose==='hurt'),'Drew and Alex collapse into their hurt pose');
  assert(s.enemies.filter(e=>e.scripted&&e.alive).every(e=>!e.prey),'Dinosaurs are released to normal behaviour');
  await defeatAll();
  await page.waitForFunction(()=>GAME.state.script.phase==='thanks'||GAME.state.script.phase==='done',null,{timeout:8000});
  assert(await page.evaluate(()=>document.getElementById('dialog').open&&document.getElementById('dialog-body').textContent.includes('Tower Suite 3001')),'Thank-you dialog invites you to Tower Suite 3001');
  await closeDialog();
  assert(await page.evaluate(()=>V4_RPG.members.drew.joined&&V4_RPG.members.alex.joined),'Drew and Alex become playable');
  assert(await page.evaluate(()=>!document.querySelector('#party button[aria-label="Play as Drew"]').hidden),'Drew appears in the party bar');
  // Singing power fires with notes (no errors) when playing as Drew.
  await page.evaluate(()=>GAME.select('drew'));await page.waitForTimeout(100);
  assert(await page.evaluate(()=>GAME.test.activate()),'Drew can sing');
  await page.waitForTimeout(300);
  assert(await page.evaluate(()=>GAME.state.powers.casts.some(c=>c.kind==='song')),'Singing shockwave is active');
  await screenshot('vegas-sing');
  await page.evaluate(()=>GAME.select('coco'));
  // Other Vegas zones load with their music.
  for(const [id,place] of [['vegas-central','vegas'],['vegas-east','vegas-east'],['vegas-west','vegas']]){
   await enter(id,760/1536*1000,900/1024*1000).catch(async()=>{await enter(id,90/1536*1000,920/1024*1000);});
   await music(place,id+' plays the '+place+' playlist');
   const crowd=await state();
   assert(crowd.enemies.filter(e=>e.kind==='compy'&&!e.hidden).length>=16,id+' is overrun with compies');
   if(id==='vegas-central')assert(crowd.enemies.some(e=>e.kind==='brontosaurus'&&e.alive),'A Brontosaurus lumbers through Vegas Central');
   if(id==='vegas-east')assert(!crowd.enemies.some(e=>e.kind==='triceratops')&&crowd.enemies.some(e=>e.kind==='stegosaurus'&&e.boss&&e.alive&&!e.hidden),'The Stegosaurus boss guards the Sphere plaza (the Triceratops moved west)');
   if(id==='vegas-west')assert(crowd.enemies.some(e=>e.kind==='triceratops'&&e.alive),'A Triceratops roams the casino floor');
  }
  // ---- Charlotte · Panthers Stadium ---------------------------------------------------------------------------------
  await enter('panthers-stadium',724/1448*1000,1000/1086*1000);
  await page.waitForTimeout(700);
  s=await state();
  assert(s.script.phase==='chase'&&s.scriptActors.length===2,'Kelce and Taylor are running their loops');
  assert(s.enemies.filter(e=>e.scripted&&e.alive).every(e=>e.kind==='raptor'&&(e.prey==='kelce'||e.prey==='taylor'))&&s.enemies.filter(e=>e.scripted).length===4,'Four raptors chase them');
  // The raptors trail behind instead of running on top of Kelce and Taylor.
  let closest=Infinity;
  for(let i=0;i<8;i++){await page.waitForTimeout(250);const now=await state();for(const e of now.enemies.filter(e=>e.scripted&&e.alive)){const prey=now.scriptActors.find(a=>a.id===e.prey);closest=Math.min(closest,Math.hypot(e.x-prey.x,e.y-prey.y));}}
  assert(closest>=45,'Raptors keep their distance from who they chase (closest '+closest.toFixed(0)+' px)');
  await music('stadium','Stadium plays Anti-Hero place');
  const before=s.scriptActors.map(a=>[a.x,a.y]);await page.waitForTimeout(600);s=await state();
  assert(s.scriptActors.some((a,i)=>Math.hypot(a.x-before[i][0],a.y-before[i][1])>20),'They keep moving along their paths');
  await screenshot('stadium-chase');
  await defeatAll();
  await page.waitForFunction(()=>GAME.state.script.phase==='celebrate',null,{timeout:8000});
  s=await state();
  assert(s.scriptActors.length===2&&s.scriptActors.every(a=>a.pose==='win'),'Kelce and Taylor do their win animations after the dinosaurs fall');
  assert(await page.evaluate(()=>!V4_RPG.members.kelce.joined),'They celebrate before they join');
  await page.waitForFunction(()=>['thanks','done'].includes(GAME.state.script.phase),null,{timeout:8000});
  await closeDialog();
  assert(await page.evaluate(()=>V4_RPG.members.kelce.joined&&V4_RPG.members.taylor.joined),'Kelce and Taylor become playable');
  // ---- Charlotte · Panthers Field ----------------------------------------------------------------------------------
  await enter('panthers-field',724/1448*1000,800/1086*1000);
  s=await state();
  const kinds=s.enemies.filter(e=>!e.hidden&&e.alive).reduce((n,e)=>(n[e.kind]=(n[e.kind]||0)+1,n),{});
  assert(kinds.compy===20&&kinds.trex===2&&kinds.triceratops===1&&kinds.ankylosaurus===1&&kinds.raptor===2&&kinds.dilophosaurus===1,'The ultimate battle: 20 compies, two T. rexes, a Triceratops, an Ankylosaurus, two raptors and a Dilophosaurus');
  await page.waitForTimeout(1500);
  s=await state();
  assert(s.script.phase==='battle','The field battle is under way');
  const team=(id,hurt)=>s.scriptActors.filter(a=>a.id===id&&(a.pose==='hurt')===hurt).length;
  assert(team('panthersplayer',false)===7&&team('chiefsplayer',false)===3,'Seven Panthers and three Chiefs are fighting');
  assert(team('panthersplayer',true)===3&&team('chiefsplayer',true)===5,'Hurt Panthers and Chiefs are sprinkled around the field');
  assert(s.scriptActors.some(a=>a.id==='bryce-young'),'Bryce Young is on the field');
  assert(s.enemies.some(e=>e.kind==='spinosaurus'&&e.hidden&&e.boss)&&s.script.boss&&s.script.boss.hidden,'The Spinosaurus waits, hidden, until the field is clear');
  assert(await page.evaluate(()=>{const sp=V6_COMBAT.species;return sp.spinosaurus.hp===sp.trex.hp*3&&sp.spinosaurus.size>128&&sp.spinosaurus.height>sp.trex.height&&sp.brontosaurus.size>128&&sp.brontosaurus.hp===256&&sp.stegosaurus.size>128&&sp.stegosaurus.hp===264&&sp.stegosaurus.hp>=sp.trex.hp*2.4;}),'The Spinosaurus has 3 T. rexes of health and is drawn bigger than a T. rex; the Brontosaurus and Stegosaurus are tough bosses');
  await music('field','Field plays the NFL theme place');
  await page.waitForFunction(()=>GAME.state.powers.casts.some(c=>c.kind==='football'&&c.owner==='bryce-young')||GAME.state.combat.lastHit,null,{timeout:12000});
  await page.evaluate(()=>GAME.test.position(724,760));
  await page.waitForTimeout(2500);
  s=await state();
  assert(s.script.fighters.some(f=>['charge','bounce','return'].includes(f))||s.combat.lastHit,'Panthers charge the dinosaurs FF6-style');
  await screenshot('field-battle');
  await defeatAll();
  await page.waitForFunction(()=>GAME.state.script.phase==='boss',null,{timeout:8000});
  s=await state();
  assert(!s.script.boss.hidden&&s.script.boss.alive&&s.script.boss.hp===330,'The Spinosaurus spawns in right after the other dinosaurs are dead');
  assert(await page.evaluate(()=>!V4_RPG.members['bryce-young'].joined),'Bryce is not recruited until the boss falls');
  await screenshot('field-boss');
  const downBefore=s.script.fighters.filter(f=>f==='down').length;
  await page.waitForFunction(()=>{const b=GAME.state.script.boss;return b&&b.hp<b.maxHP;},null,{timeout:30000});
  await page.waitForFunction(n=>GAME.state.script.fighters.filter(f=>f==='down').length>n,downBefore,{timeout:40000});
  assert(await page.evaluate(()=>GAME.state.script.fighters.filter(f=>f!=='down').length>=2&&GAME.state.scriptActors.some(a=>a.id==='bryce-young')),'The Spinosaurus flattens football players into their hurt pose, but Bryce stands and two players keep fighting');
  assert(await page.evaluate(()=>GAME.state.script.fighters.some(f=>f!=='down')),'Bryce and the remaining football players help fight it');
  await defeatAll();
  await page.waitForFunction(()=>GAME.state.script.phase==='celebrate',null,{timeout:8000});
  assert(await page.evaluate(()=>GAME.state.scriptActors.some(a=>a.id==='bryce-young'&&a.pose==='win')&&!V4_RPG.members['bryce-young'].joined),'Bryce does his win pose when the boss falls, before joining');
  await page.waitForFunction(()=>['thanks','done'].includes(GAME.state.script.phase),null,{timeout:8000});
  await closeDialog();
  assert(await page.evaluate(()=>V4_RPG.members['bryce-young'].joined&&!V4_RPG.members.panthersplayer&&!V4_RPG.members.chiefsplayer),'Bryce Young becomes playable; the generic player does not');
  // ---- The Philippines · Manny vs. the Pachycephalosaurus ----------------------------------------------------------
  assert(await page.evaluate(()=>V8_TRAVEL.sites.filter(s=>['paris','italy','japan','hawaii','philippines'].includes(s.id)).every(s=>s.icon)),'Paris, Italy, Japan, Hawaii and the Philippines have world-map icons');
  assert(await page.evaluate(()=>!V4_RPG.members.manny.joined&&FAMILY_POWERS.definitions.manny.kind==='punch'),'Manny starts unrecruited with a punch power');
  await enter('philippines',775/1448*1000,1010/1086*1000);
  await page.waitForTimeout(1000);
  assert((await state()).script.phase==='idle','The duel waits until you walk up to the arena');
  await page.evaluate(()=>GAME.test.position(700,790));
  await page.waitForFunction(()=>GAME.state.script&&GAME.state.script.phase==='fight',null,{timeout:8000});
  s=await state();
  assert(s.script.boss&&s.script.boss.alive&&s.script.boss.maxHP===240,'The Pachycephalosaurus boss is in the arena');
  assert(s.scriptActors.some(a=>a.id==='manny'),'Manny is in the arena');
  for(let round=0;round<3;round++){
   await page.waitForFunction(r=>GAME.state.script.step==='down'&&GAME.state.script.round===r,round,{timeout:30000});
   s=await state();
   assert(s.scriptActors.find(a=>a.id==='manny').pose==='hurt'&&s.script.boss.alive,'Manny is knocked down (round '+(round+1)+') but the dinosaur still stands');
   if(round===0)await screenshot('manny-knockdown');
  }
  s=await state();
  assert(s.script.boss.hp===60,'Three exchanges leave the dinosaur on its last legs (hp '+s.script.boss.hp+')');
  await page.waitForFunction(()=>GAME.state.script.phase==='celebrate',null,{timeout:30000});
  s=await state();
  assert(!s.script.boss.alive&&s.scriptActors.find(a=>a.id==='manny').pose==='win','Manny wins the duel and strikes his win pose');
  await page.waitForFunction(()=>['thanks','done'].includes(GAME.state.script.phase),null,{timeout:8000});
  await closeDialog();
  assert(await page.evaluate(()=>V4_RPG.members.manny.joined),'Manny becomes playable after the duel');
  await page.evaluate(()=>GAME.select('manny'));await page.waitForTimeout(100);
  await page.waitForFunction(()=>!GAME.state.joining&&!GAME.busy&&GAME.test.activate(),null,{timeout:8000}).catch(()=>{throw new Error('Manny can punch');});
  await screenshot('manny-punch');
  await page.evaluate(()=>GAME.select('coco'));
  // ---- Niagara Falls · Josh vs. the pterodactyls, then the giant grabs him -------------------------------------------
  assert(await page.evaluate(()=>V8_TRAVEL.sites.some(s=>s.id==='niagara'&&s.to==='niagara'&&s.icon)),'Niagara Falls is a world site with an icon');
  assert(await page.evaluate(()=>!CHARACTERS.josh&&!!EXTRAS.josh&&!V4_RPG.members.josh),'Josh is a non-playable extra, not a party member');
  await enter('niagara',724/1448*1000,1000/1086*1000);
  s=await state();
  assert(s.script.phase==='fight'&&s.script.flock===6&&s.script.giant&&s.script.giant.hidden,'Josh faces six pterodactyls; the giant waits out of sight');
  assert(s.scriptActors.some(a=>a.id==='josh'),'Josh is on the overlook');
  await page.waitForFunction(()=>GAME.state.powers.casts.some(c=>c.owner==='josh'&&c.kind==='football'),null,{timeout:20000}).catch(()=>{throw new Error('Josh throws footballs at the flock');});
  await screenshot('niagara-fight');
  await defeatAll();
  await page.waitForFunction(()=>GAME.state.script.phase==='swoop',null,{timeout:10000});
  assert(await page.evaluate(()=>{const g=GAME.state.script.giant;return !g.hidden&&g.scale>2;}),'A scaled-up pterodactyl swoops in');
  await page.waitForFunction(()=>GAME.state.script.phase==='carry',null,{timeout:10000});
  await page.waitForTimeout(800);
  s=await state();
  const josh=s.scriptActors.find(a=>a.id==='josh'),giant=s.script.giant;
  assert(Math.abs(josh.x-giant.x)<90&&Math.abs(josh.y-giant.y)<4&&josh.pose==='special','The giant carries Josh, who hangs from its talons');
  await screenshot('niagara-carry');
  await page.waitForFunction(()=>GAME.state.script.phase==='away',null,{timeout:10000});
  await page.waitForTimeout(2200);
  await screenshot('niagara-away');
  s=await state();
  assert(s.script.giant.scale<2.6&&s.scriptActors.find(a=>a.id==='josh').scale<.9,'Josh and the pterodactyl shrink as they fly away');
  await page.waitForFunction(()=>GAME.state.script.phase==='done',null,{timeout:10000});
  s=await state();
  assert(s.scriptActors.length===0&&s.script.giant.hidden,'Josh and the giant are gone');
  assert(await page.evaluate(()=>!V4_RPG.members.josh),'Josh never becomes playable');
  // Return trips
  await enter('panthers-stadium',724/1448*1000,200/1086*1000);
  await page.waitForFunction(()=>GAME.state.script.phase==='done'&&GAME.state.scriptActors.length===0,null,{timeout:6000});
  assert(errors.length===0,'Unexpected page errors: '+errors.join('; '));assert(failed.length===0,'Failed assets: '+failed.join('; '));
  return {layout:width+'x'+height,touch,pass:'Vegas pool-party rescue (shock → flee → hurt → thanks → Drew & Alex join, singing power), Stadium compy chase (Kelce & Taylor join), Field battle (20 compies + 2 T. rexes, Bryce throws, Panthers and Chiefs charge, hurt players around the turf, Spinosaurus boss, Bryce joins), Vegas compy swarms with Brontosaurus and Triceratops, new music places, extras excluded from roster'};
 }finally{
  await page.unroute(pattern).catch(()=>{});
  page.off('pageerror',onError);page.off('console',onConsole);page.off('response',onResponse);
 }
};
