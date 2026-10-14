// Story timing and presentation share the gameplay canvas; rewards stay in story-events.
(() => {
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),cache=new Map(),images=new Map();
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
 const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
 const {catalog,friends}=window.V5_CINEMA_CATALOG;
 const recruitVitoSheets=Object.fromEntries(['wrestle','throw','recover'].map(pose=>[pose,V8_ART.url('character.vito.clean-'+pose)]));
 const chrisSwimSheet=V8_ART.url('character.chris.swim'),dinosaurSheet=kind=>V8_ART.url('dinosaur.'+kind);
 const previewPage=document.body.hasAttribute('data-studio-preview');
 let sceneEdits=V5_SCENE_EDITS.empty();
 const editsReady=fetch('data/scene-edits.json?v=studio-v5-1',{cache:'no-cache'}).then(async response=>{
  if(!response.ok)throw new Error('Could not load scene edits: HTTP '+response.status);
  sceneEdits=V5_SCENE_EDITS.validate(await response.json(),catalog,CHARACTERS);
 });
 editsReady.catch(error=>console.error('Scene settings failed:',error));
 const stageEl=document.getElementById('stage'),canvas=document.getElementById('game');
 const bubble=document.createElement('div');bubble.id='story-bubble';bubble.hidden=true;
 bubble.setAttribute('role','status');bubble.setAttribute('aria-live','polite');bubble.setAttribute('aria-atomic','true');
 bubble.innerHTML='<strong></strong><p></p>';stageEl.append(bubble);
 const loading=document.createElement('div');loading.id='story-loading';loading.hidden=true;
 loading.innerHTML='<p role="status"></p><button id="story-retry" type="button" hidden>Retry artwork</button>';stageEl.append(loading);
 const retry=loading.querySelector('button');
 const ending=document.createElement('div');ending.id='story-ending';ending.hidden=true;
 ending.setAttribute('role','dialog');ending.setAttribute('aria-modal','true');ending.setAttribute('aria-labelledby','story-ending-title');
 ending.innerHTML='<h2 id="story-ending-title">To be Continued</h2><button id="story-continue" type="button">Continue Playing as Gary</button>';stageEl.append(ending);
 const continueButton=ending.querySelector('button');
 const cityLabel=document.createElement('span');cityLabel.id='story-city-label';cityLabel.hidden=true;stageEl.append(cityLabel);
 let host=null,current=null,serial=0,raf=0,last=0,readiness=Promise.resolve(),lastResult=null,ctx=null,points=[],skipping=false;
 function sceneFor(id){
  const scene=SCENES[id]||window.V5_BANQUET_FINALE.scenes[id];
  if(!scene)throw new Error('Unknown story backdrop: '+id);
  return scene;
 }
 function image(url){
  if(!url)return Promise.reject(new Error('Missing story artwork reference.'));
  if(cache.has(url))return cache.get(url);
  const promise=new Promise((resolve,reject)=>{
   const img=new Image(),timer=setTimeout(()=>fail(),12000);
   function fail(){clearTimeout(timer);cache.delete(url);reject(new Error('Could not load '+url));}
   img.onload=()=>{clearTimeout(timer);images.set(url,img);resolve(img);};img.onerror=fail;img.src=url;
  });
  cache.set(url,promise);return promise;
 }
 function preload(){
  const urls=new Set();
  for(const clips of Object.values(window.V5_ACTION_ART))for(const clip of Object.values(clips))urls.add(clip.sheet);
  if(CHARACTERS.coco.emotions)urls.add(CHARACTERS.coco.emotions.sheet);
  return Promise.all([editsReady,...[...urls].map(image)]);
 }
 function requirements(shots){
  const urls=new Set(shots.map(s=>sceneFor(s.scene).image));
  for(const s of shots){const scene=sceneFor(s.scene);if(scene.overlay)urls.add(scene.overlay.image);}
  for(const character of Object.values(CHARACTERS)){urls.add(character.sheet);if(character.emotions)urls.add(character.emotions.sheet);}
  for(const clips of Object.values(window.V5_ACTION_ART))for(const clip of Object.values(clips))urls.add(clip.sheet);
  urls.add(window.V5_WINDOW_ART.sheet);
  if(shots.some(s=>s.friend==='vito'))for(const sheet of Object.values(recruitVitoSheets))urls.add(sheet);
  if(shots.some(s=>s.stage.startsWith('swim')))urls.add(chrisSwimSheet);
  if(shots.some(s=>s.stage.startsWith('banquet-')))urls.add(window.V5_BANQUET_FINALE.meteorSheet);
  for(const id of ['trex','raptor','triceratops','pterodactyl'])urls.add(dinosaurSheet(id));
  return [...urls];
 }
 function pause(){cancelAnimationFrame(raf);raf=0;last=0;}
 function schedule(){if(current&&!current.preview&&!current.loading&&!current.error&&!document.hidden&&!raf)raf=requestAnimationFrame(tick);}
 function cue(kind){if(kind&&!skipping&&!current?.preview&&!document.hidden)V4_SFX.play(kind);}
 function enterShot(){
  const s=current.shots[current.index];current.age=0;current.cueIndex=0;
  current.speaker=s.interlocutor?'coco':s.speaker;current.scene=s.scene;
  current.from=current.camera&&{...current.camera};current.transition=current.previousScene!==s.scene&&current.previousScene!==null;
  current.previousScene=s.scene;current.focus=null;current.actors=[];
  bubble.querySelector('strong').textContent=CHARACTERS[current.speaker].name;
  bubble.querySelector('p').textContent=s.text;bubble.hidden=!s.text;
  canvas.setAttribute('aria-label',sceneFor(s.scene).name+'. '+(s.text?CHARACTERS[current.speaker].name+': '+s.text:s.stage));
  cue(s.cue);
  if(!current.preview)document.dispatchEvent(new CustomEvent('v5-cinema-shot',{detail:{event:current.event,stage:s.stage,music:s.music||null}}));
 }
 async function prepare(token){
  const run=current;if(!run)return;
  run.loading=true;run.error=null;pause();loading.hidden=false;retry.hidden=true;
  loading.querySelector('p').textContent='Preparing story artwork...';
  try{
   await editsReady;
   if(!current||current.token!==token)return;
   if(!run.preview)Object.assign(run,V5_SCENE_EDITS.apply(catalog,run.event,sceneEdits));
   await Promise.all(requirements(run.shots).map(image));
   if(!current||current.token!==token)return;
   run.loading=false;loading.hidden=true;enterShot();schedule();
  }catch(error){
   if(!current||current.token!==token)return;
   run.loading=false;run.error=error.message;loading.hidden=false;retry.hidden=false;
   loading.querySelector('p').textContent='Artwork could not load. Check your connection and retry. '+error.message;
   console.error('Story artwork failed:',error);throw error;
  }
 }
 function stageAll(s,measure=false){
  stage(s);
  if(current.preview)return;
  const hero=current.context.player;
  if(current.event!=='gary'&&s.scene===current.context.scene){
   if(!current.actors.some(a=>a.id===hero.id))human(hero.id,hero.x,hero.y,{dir:hero.direction});
   if(!measure)for(const actor of current.context.actors){
    if(!current.actors.some(a=>a.id===actor.id))human(actor.id,actor.x,actor.y,{dir:actor.direction});
   }
  }
 }
 function load(){readiness=prepare(current.token);readiness.catch(()=>{});}
 retry.onclick=()=>{if(current&&!current.loading){current.index=0;current.age=0;current.elapsed=0;current.waitingReturn=false;ending.hidden=true;current.defeated.clear();current.actions.clear();load();}};
 function account(s,age){
  if(s.stage!=='gary-wave')return;
  window.V5_GARY_FINALE.deathTimes.forEach((time,i)=>{
   const id=s.wave*5+i;
   if(age>=time&&!current.defeated.has(id)){current.defeated.add(id);cue('impact');}
  });
 }
 function advanceTime(delta){
  if(!current||current.loading||current.error||current.waitingReturn||document.hidden)return;
  current.age+=delta;current.elapsed+=delta;
  while(current&&current.age>=current.shots[current.index].seconds){
   const s=current.shots[current.index],overflow=current.age-s.seconds;account(s,s.seconds);
   if(current.index===current.shots.length-1){
    if(current.event==='banquet'){
     current.age=s.seconds;current.elapsed=current.duration;current.waitingReturn=true;pause();bubble.hidden=true;cityLabel.hidden=true;ending.hidden=false;
     canvas.setAttribute('aria-label','To be Continued. Continue Playing as Gary.');
     document.dispatchEvent(new CustomEvent('v5-cinema-shot',{detail:{event:current.event,stage:'ending'}}));continueButton.focus({preventScroll:true});
    }else finish();
    return;
   }
   current.index++;enterShot();current.age=overflow;
  }
  if(!current)return;
  const s=current.shots[current.index];account(s,current.age);
  while(s.cues&&current.cueIndex<s.cues.length&&current.age>=s.cues[current.cueIndex][0])cue(s.cues[current.cueIndex++][1]);
 }
 function fail(error){
  if(!current){console.error('Story continuation failed:',error);return;}current.error=error.message;pause();loading.hidden=false;retry.hidden=false;
  loading.querySelector('p').textContent='The story could not play. Retry artwork. '+error.message;console.error('Story presentation failed:',error);
 }
 function tick(now){raf=0;if(!current||document.hidden||current.waitingReturn){last=0;return;}const delta=last?Math.max(0,(now-last)/1000):0;last=now;try{advanceTime(delta);}catch(error){fail(error);}schedule();}
 function finish(){
  if(!current)return;
  const run=current;
  if(run.event==='gary'&&run.defeated.size!==20)throw new Error('Gary must defeat exactly twenty dinosaurs before joining.');
  lastResult={event:run.event,defeated:run.defeated.size,actions:[...run.actions],elapsed:run.elapsed,endingAcknowledged:run.waitingReturn===true,skipped:run.skipped===true};
  host.release(run.context,run.scene,run.actors,run.camera);
  current=null;serial++;pause();bubble.hidden=true;loading.hidden=true;ending.hidden=true;cityLabel.hidden=true;
  document.body.classList.remove('v5-story-active');
  for(const [element,inert] of run.inerted)element.inert=inert;
  canvas.setAttribute('aria-label',run.label);
  document.dispatchEvent(new CustomEvent('v5-cinema-end',{detail:lastResult}));
  run.callback?.(lastResult);
 }
 continueButton.onclick=()=>{if(current?.waitingReturn){try{finish();}catch(error){fail(error);}}};
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else schedule();});
 document.addEventListener('keydown',event=>{
  if(!current||current.preview||event.ctrlKey||event.altKey||event.metaKey)return;
  if(['screen-mode','story-retry','story-continue','cutscene-skip'].includes(document.activeElement?.id)&&['Enter',' '].includes(event.key))return;
  if(['Escape','Enter',' ','w','a','s','d','W','A','S','D','m','M','e','E','x','X','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)){
   event.preventDefault();event.stopImmediatePropagation();
  }
 },true);
 function rect(color,x,y,w,h){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
 function oval(color,x,y,rx,ry){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
 function path(list,u){
  const lengths=list.slice(1).map((p,i)=>Math.hypot(p[0]-list[i][0],p[1]-list[i][1]));
  let distance=clamp(u)*lengths.reduce((a,b)=>a+b,0);
  for(let i=0;i<lengths.length;i++){
   if(distance<=lengths[i]||i===lengths.length-1){const a=list[i],b=list[i+1],p=lengths[i]?clamp(distance/lengths[i]):1;
    return {x:a[0]+(b[0]-a[0])*p,y:a[1]+(b[1]-a[1])*p,dir:Math.abs(b[0]-a[0])>Math.abs(b[1]-a[1])?(b[0]>a[0]?'right':'left'):(b[1]>a[1]?'down':'up')};}
   distance-=lengths[i];
  }
  return {x:list[0][0],y:list[0][1],dir:'down'};
 }
 function actionClip(id,pose){
  if(pose==='startle')pose='surprised';
  const clip=window.V5_ACTION_ART[id]?.[pose];
  if(clip)return id==='vito'&&current?.event==='recruit-vito'&&recruitVitoSheets[pose]?{...clip,sheet:recruitVitoSheets[pose]}:clip;
  const emotion=CHARACTERS[id].emotions;
  return emotion&&pose in emotion.rows?{...emotion,frameWidth:64,frameHeight:64,foot:CHARACTERS[id].foot,row:emotion.rows[pose]}:null;
 }
 function rotatePose(context,angle,scale=1){
  if(!angle)return;
  context.translate(0,-30*scale);context.rotate(angle);context.translate(0,30*scale);
 }
 function drawPose(context,id,pose,x,y,t,options={}){
  const clip=actionClip(id,pose);if(!clip)return false;
  const img=images.get(clip.sheet);if(!img)throw new Error('Unprepared action artwork: '+clip.sheet);
  const frame=reduced.matches?(pose==='surprised'?Math.min(1,clip.frames-1):0):
   clip.loop===false?Math.min(clip.frames-1,Math.floor(t*(clip.fps||6))):Math.floor(t*(clip.fps||6))%clip.frames;
  context.save();context.translate(x,y-(options.lift||0));rotatePose(context,options.rotation,clip.scale||1);context.scale((options.flip?-1:1)*(clip.scale||1),clip.scale||1);
  context.drawImage(img,frame*clip.frameWidth,(clip.row||0)*clip.frameHeight,clip.frameWidth,clip.frameHeight,-clip.foot.x,-clip.foot.y,clip.frameWidth,clip.frameHeight);
  context.restore();return true;
 }
 function human(id,x,y,{dir='down',walk=false,pose='',lift=0,rotation=0,scale=1,poseTime=current.age,swim=false}={}){
  if(!current.preview&&current.event.startsWith('recruit-')&&id!=='coco'&&id!==current.context.player.id&&V4_RPG.members[id].joined)return;
  const c=CHARACTERS[id],t=current.age;
  if((current.event.startsWith('recruit-')||current.event==='gary-talk')&&current.scene===current.context.scene&&id===current.context.player.id){
   x=current.context.player.x;y=current.context.player.y;
  }
  const baseX=x,baseY=y,offset=current.shots[current.index].actors?.[id];
  if(offset){x+=offset.dx;y+=offset.dy;}
  current.actors.push({id,x,y,baseX,baseY,direction:dir,pose,lift,swim});points.push([x,y-lift-58],[x,y]);
  if(id==='gary'&&pose)current.actions.add(pose);
  oval('#091b3244',x,y,13*scale,4*scale);
  const expression=swim?'':pose==='startle'?'surprised':pose||(!walk&&current.speaker===id?'talk':'');
  const clip=actionClip(id,expression),flip=id==='gary'&&dir==='left'&&['attack','special'].includes(expression);
  if(clip&&clip.frameWidth>64){const size=scale*(clip.scale||1);points.push([x+(flip?clip.foot.x-clip.frameWidth:-clip.foot.x)*size,y-lift-clip.foot.y*size],[x+(flip?clip.foot.x:clip.frameWidth-clip.foot.x)*size,y-lift+(clip.frameHeight-clip.foot.y)*size]);}
  ctx.save();ctx.translate(x,y-lift);ctx.scale(scale,scale);
  if(swim||!drawPose(ctx,id,expression,0,0,poseTime,{rotation,flip})){
   const img=images.get(swim?chrisSwimSheet:c.sheet),walking=characterWalkPose(c,dir,walk),row=swim?{down:0,up:1,left:2,right:3}[dir]:walking.row,frame=walk?Math.floor(t*(c.walkFPS||8))%c.frames:1;
   rotatePose(ctx,rotation);if(!swim&&walking.flip)ctx.scale(-1,1);ctx.drawImage(img,frame*64,row*64,64,64,-c.foot.x,-c.foot.y,64,64);
  }
  ctx.restore();
 }
 function dinosaur(kind,x,y,{dir='left',walk=false,scale=1,id=null}={}){
  if(id!==null)current.enemies.push({id,kind,x,y});
  points.push([x,y-70*scale],[x,y]);
  const image=images.get(dinosaurSheet(kind)),row={down:0,left:1,right:2,up:3}[dir]+(walk?4:0),frame=walk?Math.floor(current.age*7)%4:1;
  ctx.drawImage(image,frame*128,row*128,128,128,x-64*scale,y-124*scale,128*scale,128*scale);
 }
 function smoke(x,y,t,seed=0){
  current.smoke.push(seed);
  const fade=1-t/.8;ctx.save();ctx.globalAlpha=fade;
  for(let i=0;i<8;i++){const angle=i*Math.PI/4+seed,size=6+Math.floor(t*12),px=Math.round(x+Math.cos(angle)*(8+t*30)),py=Math.round(y-25+Math.sin(angle)*(6+t*15));
   rect(i%2?'#eee5cd':'#b1b6bf',px,py,size,size);}
  ctx.restore();
 }
 function blast(x,y,tx,ty,t,seed){
  ctx.save();ctx.strokeStyle='#54c9ff';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(tx,ty);ctx.stroke();
  ctx.strokeStyle='#eaffff';ctx.lineWidth=2;ctx.stroke();
  for(let i=0;i<5;i++)rect('#d5ffff',x+(tx-x)*i/5+Math.sin(t*30+i+seed)*3,y+(ty-y)*i/5-2,4,4);
  ctx.restore();
 }
 function windowView(x,y,w,h,t){
  const art=window.V5_WINDOW_ART,img=images.get(art.sheet),frame=reduced.matches?1:Math.floor(t*5)%art.frames;
  const width=Math.max(w*1.7,h*1.1*art.frameWidth/art.frameHeight),height=width*art.frameHeight/art.frameWidth,slide=ease(t/.6);
  ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
  ctx.drawImage(img,frame*art.frameWidth,0,art.frameWidth,art.frameHeight,x+w*.5-width*.5+(1-slide)*w,y+h-height,width,height);
  rect('#afddf51c',x,y,w,h);ctx.restore();
  ctx.strokeStyle='#decba8';ctx.lineWidth=2;ctx.strokeRect(x,y,w,h);
  rect('#e1d0b1',x+w*.5-1,y,2,h);points.push([x,y],[x+w,y+h]);
 }
 function coffee(x,y,t){
  const u=ease(t/1.2);oval('#815029aa',x,y+3,18*u+1,6*u+1);
  ctx.save();ctx.translate(x,y-24*(1-u));ctx.rotate(u*1.8);rect('#eee9db',-4,-7,8,9);ctx.restore();
 }
 function stage(s){
  const t=current.age,u=clamp(t/s.seconds),activity=s.stage;
  if(activity.startsWith('banquet-')){
   window.V5_BANQUET_FINALE.stage(s,t,{human,reduced:reduced.matches,hasPose:(id,pose)=>!!actionClip(id,pose),
    meteor(x,y,frame,size){const img=images.get(V5_BANQUET_FINALE.meteorSheet);ctx.save();ctx.globalCompositeOperation='screen';ctx.drawImage(img,frame%3*128,Math.floor(frame/3)*128,128,128,x-size/2,y-size/2,size,size);ctx.restore();}});
   return;
  }
  if(activity.startsWith('gary-')){window.V5_GARY_FINALE.stage(s,t,{human,dinosaur,smoke,blast,path,ease,reduced:reduced.matches,focus:(x,y)=>current.focus={x,y},context:current.context});return;}
  if(['wake','peek','window','alarm'].includes(activity)){
   let x=260,y=218;
   if(activity==='wake'){x=current.context.player.x;y=current.context.player.y;}
   if(activity==='peek'){x=current.context.player.x+(260-current.context.player.x)*ease(u);y=current.context.player.y+(218-current.context.player.y)*ease(u);}
   if(activity==='alarm'){const p=path([[260,218],[200,300],[130,350]],ease(u));x=p.x;y=p.y;}
   if(activity==='window')windowView(239,37,40,90,t);
   human('coco',x,y,{dir:activity==='peek'?'up':activity==='alarm'?'left':'down',walk:activity==='peek'||activity==='alarm',pose:activity==='window'?'startle':''});
  }else if(['tablet','connor-roar','connor-join'].includes(activity)){
   const sibling=V4_STORY.locations.connor,p=current.context.player;
   human('connor',sibling.x,sibling.y,{pose:activity==='connor-roar'?'startle':''});
   human('coco',p.x,p.y,{dir:'up'});
   if(activity==='tablet'){rect('#182336',sibling.x-9,sibling.y-24,18,12);rect('#7ac5db',sibling.x-6,sibling.y-22,12,8);}
  }else if(activity.startsWith('family')||activity==='coffee'){
   human('jason',410,200,{dir:'right',pose:activity==='coffee'?'startle':''});
   human('peachy',520,200,{dir:'left',pose:activity==='coffee'?'startle':''});
   const p=activity==='family-approach'?path([[110,432],[180,432],[350,432],[395,300],[395,250]],ease(u)):{x:395,y:250,dir:'up'};
   human('coco',p.x,p.y,{dir:p.dir,walk:activity==='family-approach',pose:activity==='family-head'||activity==='coffee'?'startle':''});
   human('connor',p.x,p.y+32,{dir:'up',walk:activity==='family-approach',pose:activity==='coffee'?'startle':''});
   if(['family-head','coffee','family-join'].includes(activity))windowView(394,43,27,61,t);
   if(activity==='coffee')coffee(429,214,t);else rect('#eee9db',422,177,8,10);
  }else if(activity==='soccer'||activity==='soccer-panic'){
   const panic=activity==='soccer-panic',run=panic?ease(clamp((u-.55)/.45))*55:0;
   human('jeff',385-run,345,{dir:panic?'left':'right',walk:run>0,pose:panic&&u>.35&&u<.55?'startle':u<.3?'interact':''});
   human('ari',575-run,345,{dir:'left',walk:run>0,pose:panic&&u>.35&&u<.55?'startle':''});
   oval('#f1eee4',395+Math.min(u*1.7,1)*160,340,6,6);
   if(panic)dinosaur('raptor',510,340,{scale:.65});else human('coco',470,397,{dir:'up'});
  }else if(activity==='swim'||activity==='swim-panic'){
   if(activity==='swim-panic'){ctx.save();ctx.globalAlpha=.22;human('chris',358,848,{swim:true});ctx.restore();}
   if(activity==='swim')human('chris',358,813+(reduced.matches?0:Math.sin(t*3)*2),{swim:true,dir:'up',walk:true});
   for(let i=0;i<3;i++){ctx.strokeStyle='#c7ffff99';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(358,817,18+i*7+u*8,3+i*2,0,0,Math.PI*2);ctx.stroke();}
   dinosaur('pterodactyl',310+u*115,750,{dir:'right',scale:.72});
   if(activity==='swim')human('coco',422,850,{dir:'left'});
  }else if(['wrestle','throw','throw-after'].includes(activity)){
   human('vito',1615,1045,{pose:activity==='wrestle'?'wrestle':activity==='throw-after'?'recover':t<1.5?'wrestle':'throw',dir:'right',poseTime:activity==='throw'&&t>=1.5?t-1.5:t});
   if(activity!=='wrestle')human('coco',1555,1037,{dir:'right'});
  }else if(activity==='yoga'){
   human('brie',480,800,{pose:s.interlocutor?'stand':'yoga'});human('coco',415,825,{dir:'right'});
  }else if(activity==='skate'){
   human('jaime',100,350,{pose:'skate'});human('coco',153,370,{dir:'left'});
  }else if(activity==='band'||activity==='band-panic'){
   human('mark',315,270,{pose:activity==='band-panic'?'startle':''});
   human('stephanie',420,260,{pose:activity==='band-panic'?'startle':''});
   if(activity==='band')human('coco',230,275,{dir:'right'});
  }else if(activity==='tennis'||activity==='tennis-panic'){
   if(s.scene==='recreation'){
    human('adam',667,550);human('kate',711,638,{pose:'startle'});dinosaur('triceratops',762,619,{scale:.65});
   }else{const f=friends[s.friend];human(s.friend,f.x,f.y);human('coco',f.x-55,f.y+30,{dir:'right'});}
  }else if(activity==='street-panic'){
   human('jaime',310+u*120,830,{walk:true,dir:'right'});human('brie',480,800,{pose:'yoga'});
  }else if(activity==='shops-panic'){
   human('coco',1540+u*35,775,{walk:true,dir:'right'});human('jason',1500+u*35,797,{walk:true,dir:'right'});
   human('peachy',1670,765);human('connor',1700,800,{pose:'startle'});
  }else if(activity==='gather'){
   human('coco',720,850);human('connor',760,880);human('jason',800,855);human('peachy',835,880);
  }else if(activity==='reunion'){
   for(const actor of current.context.actors)human(actor.id,actor.x,actor.y,{dir:actor.direction});
   const hero=current.context.player;human(hero.id,hero.x,hero.y,{dir:hero.direction});
  }
 }
 function cameraFor(s,width,height){
  const scene=sceneFor(s.scene),bounds=scene.viewBounds||scene.bounds;
  if(s.camera?.zoom!==undefined)return {scale:s.camera.zoom,x:s.camera.x-width/s.camera.zoom/2,y:s.camera.y-height/s.camera.zoom/2};
  const cityCamera=current.event==='banquet'&&V5_BANQUET_FINALE.camera(s,width,height);
  if(cityCamera)return cityCamera;
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
  const focus=current.focus||{x:(left+right)/2,y:bottom};
  let scale=Math.min(1,width/(right-left+100),height/(bottom-top+145));
  scale=Math.max(.3,scale);
  if(s.returnView)return {...current.context.camera};
  const worldW=width/scale,worldH=height/scale;
  const x=worldW>=bounds.right-bounds.left?bounds.left+(bounds.right-bounds.left-worldW)/2:clamp(focus.x-worldW/2,bounds.left,bounds.right-worldW);
  const y=worldH>=scene.height?(scene.height-worldH)/2:clamp(focus.y-worldH*.72,0,scene.height-worldH);
  const target={x,y,scale},from=current.from||current.context.camera;
  if(current.preview)return target;
  if(current.transition)return target;
  const p=reduced.matches?1:ease(current.age/.8);
  return {x:from.x+(x-from.x)*p,y:from.y+(y-from.y)*p,scale:from.scale+(scale-from.scale)*p};
 }
 function placeBubble(){
  const s=current.shots[current.index];if(!s.text){bubble.hidden=true;return;}
  const actor=current.actors.find(a=>a.id===current.speaker);if(!actor){bubble.hidden=true;return;}
  bubble.hidden=false;
  const box=canvas.getBoundingClientRect(),ratioX=box.width/canvas.width,ratioY=box.height/canvas.height,c=current.camera;
  const x=(actor.x-c.x)*c.scale*ratioX,head=(actor.y-64-(actor.lift||0)-c.y)*c.scale*ratioY;
  const width=bubble.offsetWidth,height=bubble.offsetHeight,left=clamp(x-width/2,8,box.width-width-8);
  const placement=s.bubble?.placement||'auto';
  let top=head-height-14,below=false;
  if(placement==='below'||placement==='auto'&&top<8&&((actor.y-c.y)*c.scale*ratioY+height+22)<box.height){top=(actor.y-c.y)*c.scale*ratioY+18;below=true;}
  if(placement==='custom'){
   bubble.style.left=clamp(s.bubble.x*box.width,8,Math.max(8,box.width-width-8))+'px';
   top=s.bubble.y*box.height;below=top>head;
  }else bubble.style.left=left+'px';
  top=clamp(top,8,Math.max(8,box.height-height-14));
  const actualLeft=parseFloat(bubble.style.left);
  bubble.style.top=top+'px';bubble.style.setProperty('--tail-left',clamp(x-actualLeft,14,width-14)+'px');bubble.dataset.below=String(below);
 }
 function renderFrame(context,viewport){
  if(!current||current.loading||current.error)return;
  ctx=context;const s=current.shots[current.index],scene=sceneFor(s.scene);
  current.actors=[];current.enemies=[];current.smoke=[];current.focus=null;points=[];
  // Measure actor bounds using the same authored stage without painting off-screen.
  ctx.save();try{ctx.translate(-100000,-100000);stageAll(s,true);}finally{ctx.restore();}
  if(!points.length)points.push([s.camera.x??s.camera[0],s.camera.y??s.camera[1]]);
  const target=current.preview&&current.previewCamera||cameraFor(s,viewport.width,viewport.height),now=performance.now(),blend=current.preview||reduced.matches||current.transition?1:1-Math.exp(-Math.max(0,now-(current.renderedAt||now))/160);
  current.renderedAt=now;
  current.camera={x:current.camera.x+(target.x-current.camera.x)*blend,y:current.camera.y+(target.y-current.camera.y)*blend,scale:current.camera.scale+(target.scale-current.camera.scale)*blend};current.actors=[];current.enemies=[];current.smoke=[];
  ctx.save();
  try{
   ctx.imageSmoothingEnabled=false;rect('#17383b',0,0,viewport.width,viewport.height);
   const c=current.camera,shake=s.shake&&!reduced.matches?Math.max(0,1-current.age/1.5):current.event==='banquet'?V5_BANQUET_FINALE.shake(s,current.age,reduced.matches):0;
   ctx.translate(Math.sin(current.age*59)*3*shake,Math.cos(current.age*73)*2*shake);
   ctx.scale(c.scale,c.scale);ctx.translate(-c.x,-c.y);
   ctx.drawImage(images.get(scene.image),0,0,scene.width,scene.height);
   if(scene.overlay){const o=scene.overlay;ctx.drawImage(images.get(o.image),...o.source,o.x,o.y,o.w,o.h);}
   stageAll(s);
   if(!current.preview)host.drawAmbient?.(s.scene);
  }finally{ctx.restore();}
  if(current.transition&&!reduced.matches&&current.age<.35)rect('#10282d'+Math.round((1-current.age/.35)*255).toString(16).padStart(2,'0'),0,0,viewport.width,viewport.height);
  if(current.event==='banquet'){
   const flash=V5_BANQUET_FINALE.flash(s,current.age,reduced.matches);
   if(flash)rect('#ffffff'+Math.round(flash*255).toString(16).padStart(2,'0'),0,0,viewport.width,viewport.height);
   if(s.stage==='banquet-fade')rect('#050810'+Math.round(clamp(current.age/s.seconds)*255).toString(16).padStart(2,'0'),0,0,viewport.width,viewport.height);
  }
  cityLabel.hidden=s.stage!=='banquet-city'||current.waitingReturn;cityLabel.textContent=scene.name;
  if(current.waitingReturn)bubble.hidden=true;else placeBubble();
 }
 function render(context,viewport){try{renderFrame(context,viewport);}catch(error){fail(error);}}
 window.V5_CINEMA={
  attach(value){if(host)throw new Error('Cinematic host already attached.');host=value;},
  catalog,render,drawPose,preload,
  skip(){
   if(!current||current.preview||current.loading||current.error||document.hidden)return false;
   const run=current;run.skipped=true;skipping=true;
   try{
    if(!run.waitingReturn){
     advanceTime(Math.max(0,run.duration-run.elapsed-.00001));
     renderFrame(canvas.getContext('2d'),canvas);
     advanceTime(.00002);
    }
    if(current===run&&run.waitingReturn)finish();
    return true;
   }catch(error){fail(error);return false;}finally{skipping=false;}
  },
  get ready(){return readiness;},get active(){return current!==null;},
  get lastResult(){return lastResult&&{...lastResult,actions:[...lastResult.actions]};},
  get state(){return current?{event:current.event,scene:current.scene,shot:current.index,shotIndex:current.index,age:current.age,elapsed:current.elapsed,duration:current.duration,loading:current.loading,error:current.error,
   camera:current.camera&&{...current.camera},actors:current.actors.map(a=>({...a})),enemies:current.enemies.map(a=>({...a})),smoke:[...current.smoke],defeated:current.defeated.size,actions:[...current.actions],waitingReturn:current.waitingReturn===true,music:current.shots[current.index].music||null}:
   {event:null,scene:null,shot:-1,shotIndex:-1,age:0,elapsed:0,duration:0,loading:false,error:null};},
  play(event,onComplete){
   if(current||!catalog[event])return false;
   if(!host)throw new Error('Cinematic host is not attached.');
   const context=host.capture(),controls=['party','help','open-menu','touch-controls','power','music-toggle'].map(id=>document.getElementById(id)).filter(Boolean);
   current={event,shots:catalog[event].shots,index:0,age:0,elapsed:0,duration:catalog[event].duration,loading:true,error:null,token:++serial,callback:onComplete,context,
    camera:{...context.camera},previousScene:context.scene,scene:context.scene,actors:[],enemies:[],smoke:[],defeated:new Set(),actions:new Set(),inerted:controls.map(el=>[el,el.inert]),label:canvas.getAttribute('aria-label')};
   for(const element of controls)element.inert=true;
   document.body.classList.add('v5-story-active');canvas.focus({preventScroll:true});
   document.dispatchEvent(new CustomEvent('v5-cinema-start',{detail:{event,duration:current.duration}}));load();return true;
  }
 };
 if(previewPage){
  function seek(seconds){
   if(!current?.preview||current.loading)throw new Error('Open a preview before seeking.');
   if(!Number.isFinite(seconds))throw new Error('Preview time must be finite.');
   const elapsed=clamp(seconds,0,current.duration),time=Math.min(elapsed,current.duration-.00001);
   let age=time,index=0;
   while(index<current.shots.length-1&&age>=current.shots[index].seconds){age-=current.shots[index].seconds;index++;}
   current.index=index;enterShot();current.age=age;current.elapsed=elapsed;
   current.transition=false;current.renderedAt=0;
   current.waitingReturn=current.event==='banquet'&&elapsed===current.duration;
   ending.hidden=!current.waitingReturn;continueButton.disabled=true;
  }
  window.V5_CINEMA.preview={
   async open(event,data,context){
    if(!catalog[event])throw new Error('Unknown preview scene: '+event);
    const settings=V5_SCENE_EDITS.validate(data,catalog,CHARACTERS),definition=V5_SCENE_EDITS.apply(catalog,event,settings);
    pause();ending.hidden=true;
    current={event,...definition,preview:true,index:0,age:0,elapsed:0,loading:true,error:null,token:++serial,context,
     camera:{...context.camera},previousScene:null,scene:context.scene,actors:[],enemies:[],smoke:[],defeated:new Set(),actions:new Set()};
    readiness=prepare(current.token);await readiness;
    if(current?.preview)seek(0);
   },
   seek,
   lockCamera(camera){if(current?.preview)current.previewCamera=camera&&{...camera};},
   update(data){
    if(!current?.preview)throw new Error('No preview is open.');
    V5_SCENE_EDITS.validate(data,catalog,CHARACTERS);
    const elapsed=current.elapsed;Object.assign(current,V5_SCENE_EDITS.apply(catalog,current.event,data));seek(elapsed);
   }
  };
 }
})();
