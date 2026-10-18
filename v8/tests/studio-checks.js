return async function checkStudio(page,{width,height,artifactDir}={}){
 const assert=(v,m)=>{if(!v)throw new Error(m);},errors=[],failed=[];
 const onError=e=>errors.push(e.message),onConsole=m=>{if(m.type()==='error'&&!m.text().includes('404'))errors.push(m.text());},onResponse=r=>{if(r.status()>=400&&!r.url().includes('/api/'))failed.push(r.url());};
 page.on('pageerror',onError);page.on('console',onConsole);page.on('response',onResponse);
 const screenshot=async name=>{if(artifactDir)await page.screenshot({path:artifactDir+'\\v8-'+name+'-'+width+'x'+height+'.png'});};
 try{
  await page.goto(page.url().split('/v8/')[0]+'/v8/studio/?scene=hawaii-central',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.STUDIO&&STUDIO.state.scene==='hawaii-central'&&document.querySelectorAll('#scene option').length>=15);
  await page.waitForFunction(()=>document.getElementById('status').textContent.includes('Read-only'));
  assert(await page.evaluate(()=>document.getElementById('info').textContent.includes('1448 × 1086')),'Scene info shows the real size');
  assert(await page.evaluate(()=>document.querySelectorAll('#studio-tabs .tab').length===4&&document.querySelector('#studio-tabs .tab.active').textContent==='World'),'Studio tab bar renders with World active');
  // Draws the actual background and overlays.
  await page.waitForFunction(()=>{const c=document.getElementById('canvas'),ctx=c.getContext('2d');const d=ctx.getImageData(c.width/2|0,c.height/2|0,1,1).data;return d[0]+d[1]+d[2]>60;});
  await page.evaluate(()=>{document.querySelector('[data-layer=mask]').click();});
  await page.waitForTimeout(400);
  await screenshot('studio-hawaii');
  // Add a blocked rectangle over the spawn through the public API; the live scene must reflect it immediately.
  const spawn=await page.evaluate(()=>({...SCENES['hawaii-central'].spawn}));
  assert(await page.evaluate(()=>!V8_AREAS.blocked(SCENES['hawaii-central'],SCENES['hawaii-central'].spawn.x,SCENES['hawaii-central'].spawn.y)),'Spawn starts walkable');
  await page.evaluate(s=>STUDIO.add('obstacles',{x:s.x-15,y:s.y-15,w:30,h:30}),spawn);
  assert(await page.evaluate(()=>V8_AREAS.blocked(SCENES['hawaii-central'],SCENES['hawaii-central'].spawn.x,SCENES['hawaii-central'].spawn.y)&&STUDIO.state.dirty&&STUDIO.state.overrides.includes('hawaii-central')),'Edits apply to the live scene and mark the override dirty');
  assert(await page.evaluate(()=>document.getElementById('props').textContent.includes('Rectangle')&&document.getElementById('override-state').textContent.includes('override')),'Selection panel and override pill update');
  // Export matches the override format and round-trips through V8_GEOMETRY.
  const exported=await page.evaluate(()=>STUDIO.exportScene());
  assert(exported.obstacles.length===4&&exported.landmarks.length>=5&&exported.spawn&&exported.bounds,'Exported scene carries shapes, markers, spawn and bounds');
  await page.evaluate(()=>STUDIO.undo());
  assert(await page.evaluate(()=>!V8_AREAS.blocked(SCENES['hawaii-central'],SCENES['hawaii-central'].spawn.x,SCENES['hawaii-central'].spawn.y)),'Undo restores the spawn');
  await page.evaluate(()=>STUDIO.redo());
  assert(await page.evaluate(()=>V8_AREAS.blocked(SCENES['hawaii-central'],SCENES['hawaii-central'].spawn.x,SCENES['hawaii-central'].spawn.y)),'Redo re-applies it');
  // Pointer drawing: select the blocked-rect tool and drag on the canvas.
  await page.click('[data-tool=rect-block]');
  const box=await page.locator('#canvas').boundingBox();
  await page.mouse.move(box.x+40,box.y+40);await page.mouse.down();await page.mouse.move(box.x+120,box.y+100,{steps:4});await page.mouse.up();
  assert(await page.evaluate(()=>SCENES['hawaii-central'].obstacles.length===5&&STUDIO.state.selection?.kind==='rect'),'Dragging with the rectangle tool adds a shape and selects it');
  await page.keyboard.press('Delete');
  assert(await page.evaluate(()=>SCENES['hawaii-central'].obstacles.length===4),'Delete removes the selected shape');
  // Save without a server reports read-only instead of failing silently.
  await page.evaluate(()=>STUDIO.save());
  await page.waitForFunction(()=>document.getElementById('status').textContent.includes('npm run studio'));
  // Other scenes load, including code-drawn NYC and the Kentlands plaza.
  await page.evaluate(()=>STUDIO.loadScene('plaza'));await page.waitForFunction(()=>STUDIO.state.scene==='plaza');
  await page.waitForFunction(()=>document.getElementById('info').textContent.includes('1536 × 1024'));
  await page.evaluate(()=>  STUDIO.loadScene('italy'));await page.waitForFunction(()=>STUDIO.state.scene==='italy');
    assert(await page.evaluate(()=>document.getElementById('info').textContent.includes('1536')),'Studio loads a new destination with its background image');
  page.off('beforeunload',()=>{});
  await page.evaluate(()=>{window.onbeforeunload=null;});
  // ---- Sprites tab (Sprite Workshop): detection, mapping, previews and the sprites.json document, all without a server.
  await page.goto(page.url().split('/v8/')[0]+'/v8/studio/sprites/?character=jeff',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.WORKSHOP&&document.getElementById('status').textContent.includes('Read-only'));
  assert(await page.evaluate(()=>document.querySelector('#studio-tabs .tab.active').textContent==='Sprites'&&document.querySelectorAll('#character option').length>=16),'Sprites tab is active and lists the roster plus "new character"');
  assert(await page.evaluate(()=>WORKSHOP.state.characterId==='jeff'&&WORKSHOP.state.artId==='character.jeff.walk'&&document.getElementById('c-speed').value==='120'&&document.getElementById('c-offset').value==='4'),'URL picks the character and the panel shows its sprites.json settings');
  // Synthetic ChatGPT-style export: four rows of six drawings on a transparent background, different heights per row.
  const loadSheet=()=>page.evaluate(()=>{
   const c=document.createElement('canvas');c.width=900;c.height=1000;const ctx=c.getContext('2d');
   for(let r=0;r<4;r++)for(let i=0;i<6;i++){const h=150-r*10,x=30+i*145,y=40+r*240+(160-h);ctx.fillStyle=['#c33','#3c3','#33c','#cc3'][r];ctx.fillRect(x,y,70,h);ctx.fillStyle='#fff';ctx.fillRect(x+10+i*5,y+10,12,12);}
   return WORKSHOP.loadDataURL(c.toDataURL('image/png'),'Test Sprites.png');
  });
  await loadSheet();
  await page.waitForFunction(()=>WORKSHOP.state.result);
  const walk=await page.evaluate(()=>WORKSHOP.state);
  assert(walk.bands===4&&walk.cells===24&&walk.result.width===256&&walk.result.height===512&&walk.rows[0]==='0:0-2'&&walk.rows[7]==='2:3-5','walk6 preset maps 4x6 detected cells onto a 256x512 sheet');
  assert(walk.result.scale>.39&&walk.result.scale<.41,'Uniform scale fits the tallest drawing (150 px) on the 60 px foot line');
  assert(await page.evaluate(()=>{const c=document.getElementById('sheet');return c.width===512&&c.height===1024&&document.getElementById('anim').width===512;}),'Sheet preview at zoom 2 and the walking preview are drawn');
  assert(await page.evaluate(()=>document.querySelectorAll('.rowline .name.same').length>=4&&document.getElementById('asset-info').textContent.includes('nearly identical')),'Rows whose frames barely differ are flagged');
  await page.evaluate(()=>WORKSHOP.setRows(['9:0-2']));
  assert(await page.evaluate(()=>!WORKSHOP.state.result&&document.getElementById('status').textContent.includes('Row 1')),'A spec pointing at a missing band is reported on its row');
  // Switching target drops the loaded image and shows the saved asset instead, so the next file cannot land on the wrong target.
  await page.evaluate(()=>{WORKSHOP.setKind('pose');WORKSHOP.setPose('surprised');});
  await page.waitForFunction(()=>!WORKSHOP.state.loaded&&document.getElementById('result-summary').textContent.includes('current saved asset'));
  await page.waitForFunction(()=>document.getElementById('anim-legend').textContent.includes('saved asset')&&document.getElementById('anim').width===128);
  assert(await page.evaluate(()=>{const c=document.getElementById('anim'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let lit=0;for(let i=0;i<d.length;i+=4)if(Math.abs(d[i]-0x1f)+Math.abs(d[i+1]-0x3b)+Math.abs(d[i+2]-0x3d)>60)lit++;return lit>200;}),'In motion animates the saved asset when no file is loaded');
  await loadSheet();await page.evaluate(()=>WORKSHOP.setRows(['1:0-2']));
  await page.waitForFunction(()=>WORKSHOP.state.result&&WORKSHOP.state.result.height===64);
  assert(await page.evaluate(()=>WORKSHOP.state.artId==='character.jeff.surprised'&&document.getElementById('p-frames').value==='3'&&document.getElementById('p-fps').value==='6'),'Pose target reads the existing clip settings and a 3-cell row');
  assert(await page.evaluate(()=>{document.getElementById('p-fps').value='9';document.getElementById('p-fps').dispatchEvent(new Event('input'));const d=WORKSHOP.buildDocument();return d.poses.jeff.surprised.fps===9&&d.poses.jeff.surprised.frames===3&&d.characters.jeff.speed===120&&Object.keys(d.characters).length===Object.keys(V8_SPRITES_DATA.characters).length;}),'Document builder applies the clip settings to a copy of sprites.json');
  await page.evaluate(()=>WORKSHOP.setKind('portrait'));
  await loadSheet();
  await page.waitForFunction(()=>WORKSHOP.state.result&&WORKSHOP.state.result.width===128&&WORKSHOP.state.result.height===128);
  await page.evaluate(()=>WORKSHOP.save());
  await page.waitForFunction(()=>document.getElementById('status').textContent.includes('npm run studio'));
  await page.evaluate(()=>{window.onbeforeunload=null;});
  // ---- Files tab: every listed path exists, resolves to a line and links to the published copy.
  await page.evaluate(()=>{window.onbeforeunload=null;});
  await page.goto(page.url().split('/v8/')[0]+'/v8/studio/files/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>{const cards=[...document.querySelectorAll('.card')].filter(c=>!c.textContent.includes('scene-geometry'));return cards.length>=14&&cards.every(c=>/^line \d+$/.test(c.querySelector('.line').textContent));},null,{timeout:30000}).catch(()=>{});
  const files=await page.evaluate(()=>({active:document.querySelector('#studio-tabs .tab.active').textContent,paths:[...document.querySelectorAll('.card code')].map(c=>c.textContent),
   missingLine:[...document.querySelectorAll('.card')].filter(c=>c.querySelector('.line').textContent===''&&!c.textContent.includes('scene-geometry')).map(c=>c.querySelector('code').textContent),
   github:document.querySelector('.card .links a[href*="github.com"]').href}));
  assert(files.active==='Files','The Files tab is active');
  for(const must of ['v8/src/combat.js','v8/src/rpg.js','v8/src/powers.js','docs/ART-SPEC.md'])assert(files.paths.includes(must),'Files tab lists '+must);
  assert(files.missingLine.length===0,'Every listed file resolves to a line (missing: '+files.missingLine.join(', ')+')');
  assert(/#L\d+$/.test(files.github),'GitHub links point at the matching line');
  assert(errors.length===0,'Unexpected page errors: '+errors.join('; '));assert(failed.length===0,'Failed assets: '+failed.join('; '));
  return {layout:width+'x'+height,pass:'Studio loads real scenes and backgrounds, walk-test mask, API and pointer edits, undo/redo, delete, export format, read-only save notice, scene switching; Sprite Workshop detects cells, maps walk6/pose/portrait, previews, builds sprites.json edits, read-only save notice; Files tab lists the stats/prompt files with live line numbers'};
 }finally{
  // Leave the page clean for the next suite.
  await page.evaluate(()=>{window.onbeforeunload=null;}).catch(()=>{});
  page.off('pageerror',onError);page.off('console',onConsole);page.off('response',onResponse);
 }
};
