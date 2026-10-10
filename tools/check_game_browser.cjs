// Requires Playwright. BROWSER_PATH may point to an existing Chromium binary.
// CHECK_SHOTS optionally saves QA screenshots; CHECK_LAYOUT filters a layout.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
(async()=>{
 const root=path.resolve(__dirname,'..'),shots=process.env.CHECK_SHOTS;
 if(shots)fs.mkdirSync(shots,{recursive:true});
 const server=http.createServer((req,res)=>{
  const target=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));
  if(!target.startsWith(root+path.sep)){res.statusCode=403;return res.end()}
  try{res.setHeader('Content-Type',target.endsWith('.js')?'text/javascript':target.endsWith('.css')?'text/css':target.endsWith('.png')?'image/png':'text/html');res.end(fs.readFileSync(target))}catch{res.statusCode=404;res.end()}
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
 const layouts=[['desktop',{viewport:{width:1280,height:900}}],['phone',{viewport:{width:390,height:844},isMobile:true,hasTouch:true}],['landscape',{viewport:{width:844,height:390},isMobile:true,hasTouch:true}]];
 for(const [label,options] of layouts.filter(([label])=>!process.env.CHECK_LAYOUT||label===process.env.CHECK_LAYOUT)){
  const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH,args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--use-gl=disabled','--no-zygote','--single-process']}:{args:['--no-sandbox']})});
  try{
   const page=await browser.newPage(options),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(`http://127.0.0.1:${server.address().port}`);await page.waitForFunction(()=>window.GAME?.ready);
   assert.equal(await page.locator('.character-button').count(),10);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   const definitions=await page.evaluate(()=>FAMILY_POWERS.definitions);
   for(const [id,definition] of Object.entries(definitions)){
    await page.locator(`[data-character="${id}"]`).click();assert.equal(await page.locator('#power-label').textContent(),definition.label);assert(await page.locator('#power').isVisible());
    await page.keyboard.press('x');await page.keyboard.press('x');
    let state=await page.evaluate(()=>GAME.state);assert.equal(state.powers.casts.filter(c=>c.id===id).length,1,id+' immediate duplicate guarded');assert(await page.locator('#power').isDisabled());
    await page.waitForTimeout(140);if(shots&&label==='desktop')await page.screenshot({path:path.join(shots,id+'.png')});
    for(let i=0;i<2;i++){await page.waitForTimeout(definition.cooldown*1000+40);await page.keyboard.press('x');}
    await page.keyboard.down('ArrowRight');await page.waitForTimeout(100);state=await page.evaluate(()=>GAME.state);assert(state.player.moving);await page.keyboard.up('ArrowRight');
    await page.keyboard.down('ArrowLeft');await page.waitForTimeout(100);await page.keyboard.up('ArrowLeft');
   }
   await page.waitForTimeout(1700);assert.equal(await page.evaluate(()=>GAME.state.powers.casts.length),0,'all spam effects cleaned up');
   // Walk around the east building to discover the unicorn without teleporting.
   await page.keyboard.down('Shift');await page.keyboard.down('ArrowUp');await page.waitForFunction(()=>GAME.state.player.y<=780,null,{timeout:6000});await page.keyboard.up('ArrowUp');
   await page.keyboard.down('ArrowRight');await page.waitForFunction(()=>GAME.state.player.x>=1395,null,{timeout:7000});await page.keyboard.up('ArrowRight');
   await page.keyboard.down('ArrowUp');await page.waitForFunction(()=>GAME.state.player.y<=738,null,{timeout:4000});await page.keyboard.up('ArrowUp');await page.keyboard.up('Shift');
   assert.equal(await page.locator('#interact').textContent(),'Ride');assert(await page.locator('#nearby').isVisible());if(shots)await page.screenshot({path:path.join(shots,label+'-discover.png')});
   await page.keyboard.press('e');assert(await page.evaluate(()=>GAME.state.unicorn.riding));assert.equal(await page.locator('#interact').textContent(),'Off');
   await page.keyboard.down('ArrowLeft');await page.waitForTimeout(1000);await page.keyboard.up('ArrowLeft');let mounted=await page.evaluate(()=>GAME.state);
   assert(mounted.player.x>=1269&&mounted.player.x<1310,'rider stops at building');assert(!(await page.evaluate(()=>GAME.blocked(GAME.state.player.x,GAME.state.player.y,14,7))));
   const before=mounted.player.x;await page.keyboard.down('Shift');await page.keyboard.down('ArrowRight');await page.waitForTimeout(300);mounted=await page.evaluate(()=>GAME.state);assert(mounted.player.x-before>65,'gallop is faster');assert(mounted.unicorn.clock>0);await page.keyboard.up('ArrowRight');await page.keyboard.up('Shift');
   for(const id of Object.keys(definitions)){await page.locator(`[data-character="${id}"]`).click();assert(await page.evaluate(()=>GAME.state.unicorn.riding));await page.keyboard.press('x');assert((await page.evaluate(()=>GAME.state.powers.casts)).some(c=>c.id===id));}
   if(shots)await page.screenshot({path:path.join(shots,label+'-riding.png')});
   if(options.hasTouch){
    const cdp=await page.context().newCDPSession(page),j=await page.locator('#joystick').boundingBox(),a=await page.locator('#power').boundingBox();await page.waitForTimeout(700);
    const joy={id:1,x:j.x+j.width*.8,y:j.y+j.height/2};await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[joy]});await page.waitForTimeout(150);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[joy,{id:2,x:a.x+a.width/2,y:a.y+a.height/2}]});await page.waitForTimeout(100);const state=await page.evaluate(()=>GAME.state);assert(state.player.moving&&state.unicorn.riding);assert(state.powers.casts.some(c=>c.id==='vito'));
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(60);assert.equal(await page.evaluate(()=>GAME.state.player.moving),false);
    await page.locator('#interact').tap();
   }else await page.keyboard.press('e');
   assert.equal(await page.evaluate(()=>GAME.state.unicorn.riding),false);assert(!(await page.evaluate(()=>GAME.blocked(GAME.state.player.x,GAME.state.player.y))));await page.keyboard.press('e');assert(await page.evaluate(()=>GAME.state.unicorn.riding),'remount where unicorn was left');
   assert.deepEqual(errors,[]);console.log(label+': all ten actions, rapid taps, cleanup, walking, discovery, mounting, collision, gallop, character switching, mounted powers, dismount/remount and touch checks passed');
  }finally{await browser.close()}
 }
 }finally{server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
