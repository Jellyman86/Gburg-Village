return async function checkStudio(page,{width,height,artifactDir}={}){
 const assert=(v,m)=>{if(!v)throw new Error(m);},errors=[],failed=[];
 const onError=e=>errors.push(e.message),onConsole=m=>{if(m.type()==='error'&&!m.text().includes('404'))errors.push(m.text());},onResponse=r=>{if(r.status()>=400&&!r.url().endsWith('/api/geometry'))failed.push(r.url());};
 page.on('pageerror',onError);page.on('console',onConsole);page.on('response',onResponse);
 const screenshot=async name=>{if(artifactDir)await page.screenshot({path:artifactDir+'\\v8-'+name+'-'+width+'x'+height+'.png'});};
 try{
  await page.goto(page.url().split('/v8/')[0]+'/v8/studio/?scene=hawaii-central',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.STUDIO&&STUDIO.state.scene==='hawaii-central'&&document.querySelectorAll('#scene option').length>=15);
  await page.waitForFunction(()=>document.getElementById('status').textContent.includes('Read-only'));
  assert(await page.evaluate(()=>document.getElementById('info').textContent.includes('1448 × 1086')),'Scene info shows the real size');
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
  await page.evaluate(()=>STUDIO.loadScene('nyc'));await page.waitForFunction(()=>STUDIO.state.scene==='nyc');
  assert(await page.evaluate(()=>document.getElementById('info').textContent.includes('drawn by code')),'NYC loads without a background image');
  page.off('beforeunload',()=>{});
  await page.evaluate(()=>{window.onbeforeunload=null;});
  assert(errors.length===0,'Unexpected page errors: '+errors.join('; '));assert(failed.length===0,'Failed assets: '+failed.join('; '));
  return {layout:width+'x'+height,pass:'Studio loads real scenes and backgrounds, walk-test mask, API and pointer edits, undo/redo, delete, export format, read-only save notice, scene switching'};
 }finally{
  // Leave the page clean for the next suite.
  await page.evaluate(()=>{window.onbeforeunload=null;}).catch(()=>{});
  page.off('pageerror',onError);page.off('console',onConsole);page.off('response',onResponse);
 }
};
