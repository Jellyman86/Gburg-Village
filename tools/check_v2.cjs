const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
(async()=>{
 const root=path.resolve(__dirname,'..');const server=http.createServer((req,res)=>{let file=decodeURIComponent(req.url.split('?')[0]);if(file.endsWith('/'))file+='index.html';try{const p=path.join(root,file);res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.webp')?'image/webp':p.endsWith('.png')?'image/png':p.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(p));}catch{res.statusCode=404;res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const launch=()=>chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{}),args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--use-gl=disabled','--no-zygote','--single-process']});
 try{for(const [label,options] of [['desktop',{viewport:{width:1280,height:900}}],['phone',{viewport:{width:390,height:844},isMobile:true,hasTouch:true}],['landscape',{viewport:{width:844,height:390},isMobile:true,hasTouch:true}]]){
 const browser=await launch();try{const page=await browser.newPage(options),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/v2/`);await page.waitForFunction(()=>GAME.ready);
 assert.equal(await page.locator('.character-button').count(),10);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 // Collision and connectivity for every portal, with a grid path search using actual collision.
 const routes=await page.evaluate(()=>{
 const blocked=(t,x,y)=>x<8||y<4||x>t.width-8||y>t.height-4||t.obstacles.some(o=>x+8>o.x&&x-8<o.x+o.w&&y+4>o.y&&y-4<o.y+o.h)||(t.walkable&&[[x-8,y-4],[x+8,y-4],[x-8,y+4],[x+8,y+4]].some(([a,b])=>!t.walkable.some(o=>a>=o.x&&a<=o.x+o.w&&b>=o.y&&b<=o.y+o.h)));
 const results=[];for(const t of Object.values(SCENES)){const ports=t.landmarks.filter(p=>p.to);for(const p of ports){const dest=SCENES[p.to],x=p.arrival[0]*dest.width/1000,y=p.arrival[1]*dest.height/1000;results.push([t.id,p.id,!blocked(t,p.x,p.y),!blocked(dest,x,y)]);}if(t.walkable&&ports.length>1){const step=8,start=ports[0],queue=[[Math.round(start.x/step),Math.round(start.y/step)]],seen=new Set(queue.map(p=>p.join(',')));for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,key=nx+','+ny;if(!seen.has(key)&&!blocked(t,nx*step,ny*step)){seen.add(key);queue.push([nx,ny]);}}}for(const p of ports)results.push([t.id,p.id,'connected',queue.some(([x,y])=>Math.hypot(x*step-p.x,y*step-p.y)<16)]);}}return results;
 });console.log(label,JSON.stringify(routes));for(const r of routes)assert(r[2]&&r[3],JSON.stringify(r));
 await page.keyboard.down('Shift');await page.keyboard.down('ArrowUp');await page.waitForFunction(()=>GAME.state.player.y<780,null,{timeout:2000});await page.keyboard.up('ArrowUp');await page.keyboard.down('ArrowRight');await page.waitForFunction(()=>GAME.state.player.x>1390,null,{timeout:7000});await page.keyboard.up('ArrowRight');await page.keyboard.up('Shift');
 await page.keyboard.press('e');await page.waitForFunction(()=>GAME.ready&&GAME.state.scene==='district');
 // Walk the district corridor down, then east to neighborhood.
 await page.keyboard.down('Shift');await page.keyboard.down('ArrowDown');await page.waitForFunction(()=>GAME.state.player.y>1045,null,{timeout:6000});await page.keyboard.up('ArrowDown');await page.keyboard.down('ArrowRight');await page.waitForFunction(()=>GAME.state.player.x>2880,null,{timeout:10000});await page.keyboard.up('ArrowRight');await page.keyboard.up('Shift');await page.keyboard.press('e');await page.waitForFunction(()=>GAME.ready&&GAME.state.scene==='neighborhood');
 await page.screenshot({path:`/tmp/v2-${label}.png`});
 // Follow residential loop to the dinosaur front door.
 async function walk(key,test,timeout=7000){await page.keyboard.down('Shift');await page.keyboard.down(key);await page.waitForFunction(test,null,{timeout});await page.keyboard.up(key);await page.keyboard.up('Shift');}
 await walk('ArrowUp',()=>GAME.state.player.y<865);await walk('ArrowRight',()=>GAME.state.player.x>295);await walk('ArrowUp',()=>GAME.state.player.y<354);await walk('ArrowRight',()=>GAME.state.player.x>884);await page.keyboard.press('e');await page.waitForFunction(()=>GAME.ready&&GAME.state.scene==='house');
 await page.keyboard.press('x');await page.waitForTimeout(200);assert((await page.evaluate(()=>GAME.state.powers.casts)).length);await page.screenshot({path:`/tmp/v2-house-${label}.png`});await page.keyboard.press('e');await page.waitForFunction(()=>GAME.ready&&GAME.state.scene==='neighborhood');

 // Traverse the east residential loop to the recreation entrance.
 await walk('ArrowRight',()=>GAME.state.player.x>950);await walk('ArrowDown',()=>GAME.state.player.y>818);await walk('ArrowRight',()=>GAME.state.player.x>1070);await walk('ArrowDown',()=>GAME.state.player.y>1102);
 if(options.hasTouch)await page.locator('#interact').tap();else await page.keyboard.press('e');await page.waitForFunction(()=>GAME.ready&&GAME.state.scene==='recreation');
 // Follow the west sidewalk and front walk to the clubhouse; the building stays solid.
 await walk('ArrowDown',()=>GAME.state.player.y>1200);await walk('ArrowRight',()=>GAME.state.player.x>660);await walk('ArrowUp',()=>GAME.state.player.y<1150);
 assert(await page.evaluate(()=>GAME.blocked(660,1050)),'clubhouse walls block walking');
 await page.screenshot({path:`/tmp/v2-clubhouse-${label}.png`});
 if(options.hasTouch){
 const cdp=await page.context().newCDPSession(page),j=await page.locator('#joystick').boundingBox(),a=await page.locator('#power').boundingBox();
 const joy={id:1,x:j.x+j.width*.8,y:j.y+j.height/2};await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[joy]});await page.waitForTimeout(150);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[joy,{id:2,x:a.x+a.width/2,y:a.y+a.height/2}]});await page.waitForTimeout(100);
 assert(await page.evaluate(()=>GAME.state.player.moving&&GAME.state.powers.casts.length>0),'touch movement and power');
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>GAME.state.player.moving),false);
 }
 await page.locator('#return-plaza').click();await page.waitForFunction(()=>GAME.ready&&GAME.state.scene==='plaza');assert.equal(await page.evaluate(()=>GAME.state.player.x),768);assert.deepEqual(errors,[]);await page.close();console.log(label+' transitions/clubhouse/powers/touch passed');}finally{await browser.close();}
 }}finally{server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
