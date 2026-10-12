// A presentation-only director: the caller owns story flags and party awards.
(() => {
 'use strict';
 const W=960,H=540,cache=new Map(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
 const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
 const shot=(seconds,stage,scene,camera,speaker,text,extra={})=>({seconds,stage,scene,camera,speaker,text,...extra});
 const room=[300,225,1.2],kitchen=[520,165,1.65],field=[480,345,1.9],pool=[358,815,1.65];
 const catalog={
  awakening:[
   shot(3,'wake','cocoRoom',room,'coco',"What was that strange rumble?",{cue:'rumble'}),
   shot(3,'peek','cocoRoom',room,'coco',"I'm going to peek to see if there's anything outside."),
   shot(3,'window','cocoRoom',[255,140,2.1],'coco','A DINOSAUR?!',{cue:'roar',shake:true}),
   shot(3,'alarm','cocoRoom',room,'coco','I NEED TO FIND CONNOR!')
  ],
  connor:[
   shot(3,'tablet','connorRoom',room,'coco',"CONNOR! THERE'S DINOSAURS!"),
   shot(3,'tablet','connorRoom',room,'connor',"That's not possible, Coco."),
   shot(3,'connor-roar','connorRoom',room,'connor',"...Okay. Let's get Dad.",{cue:'roar',shake:true}),
   shot(3,'connor-join','connorRoom',room,'connor',"I'm coming with you!",{join:['connor'],cue:'join'})
  ],
  family:[
   shot(3,'family','house',kitchen,'jason',"Is that the TV? Somebody turn down the dinosaur channel."),
   shot(3,'family','house',kitchen,'peachy',"The internet is down. Of course it is."),
   shot(3,'family-head','house',[390,165,1.65],'coco',"Dad! Mom! LOOK OUTSIDE!",{cue:'rumble'}),
   shot(3,'coffee','house',[390,165,1.65],'peachy',"AAAAH! Jason, your coffee!",{cue:'roar',cues:[[.25,'scream'],[.9,'splash']],shake:true}),
   shot(2,'family-join','house',[390,165,1.65],'jason',"Stay together. We're getting everyone to Market Square.",{join:['jason','peachy'],cue:'join'})
  ],
  gathering:[
   shot(3,'reunion','plaza',[760,775,1.15],'coco',"Everyone's here. All fourteen of us! You're safe now."),
   shot(3,'reunion','plaza',[760,775,1.15],'jason',"Five Guys could be our headquarters later. First, let's catch our breath."),
   shot(3,'reunion','plaza',[760,775,1.15],'coco',"But why did that meteor bring dinosaurs? We're going to find out—together.")
  ],
  montage:[
   shot(4,'soccer-panic','recreation',field,'ari','THAT IS NOT THE GOALIE!',{cue:'roar'}),
   shot(4,'swim-panic','recreation',pool,'chris',"...I picked the wrong day to swim."),
   shot(4,'wrestle','district',[1615,930,1.8],'vito',"Hang on… I've got a situation here.",{cue:'rumble'}),
   shot(2,'band-panic','rockband',[288,162,1.65],'mark',"Power's out! That was NOT our drum solo."),
   shot(2,'tennis-panic','recreation',[700,590,1.8],'kate',"Adam! That's not a tennis ball!"),
   shot(2,'street-panic','neighborhood',[430,815,1.4],'jaime',"Phones are down too! Brie, stay off the road!"),
   shot(3,'shops-panic','district',[1420,730,.9],'coco',"No electricity. No internet. We have to find our friends ourselves."),
   shot(3,'gather','plaza',[760,740,1.15],'coco',"We'll rescue everyone, then gather at Market Square. Nobody gets left behind!")
  ]
 };
 const friends={
  jeff:{scene:'recreation',camera:field,stage:'soccer',line:"The dinosaur stole our ball. That is absolutely a red card.",reply:"Come with us, Jeff. We'll get everyone somewhere safe."},
  ari:{scene:'recreation',camera:field,stage:'soccer',line:"Next time, I'm checking the goalie for claws.",reply:"We need your footwork, Ari. Let's go!"},
  chris:{scene:'recreation',camera:pool,stage:'swim',line:"I was promised a quiet lap swim. Not flying reptiles.",reply:"Time to get out, Chris. We need you on dry land!"},
  jaime:{scene:'recreation',camera:[100,340,1.65],stage:'skate',line:"I can outrun them. Stopping is the tricky part!",reply:"Skate with us, Jaime. We'll watch the corners."},
  mark:{scene:'rockband',camera:[288,162,1.65],stage:'band',line:"No power, no Rock Band. Guess we're going acoustic.",reply:"Save the encore, Mark. Our friends need us."},
  stephanie:{scene:'rockband',camera:[288,162,1.65],stage:'band',line:"I can scream louder than that dinosaur. Want a demonstration?",reply:"Let's save your voice for the rescue, Stephanie!"},
  adam:{scene:'neighborhood',camera:[330,745,1.65],stage:'tennis',x:330,y:780,line:"That thing ate the tennis ball. I'm calling a let.",reply:"Game postponed, Adam. Come help us find everyone."},
  kate:{scene:'north',camera:[767,985,1.65],stage:'tennis',x:767,y:1015,line:"I prefer doubles without a prehistoric opponent.",reply:"You're on our team now, Kate. Let's move!"},
  brie:{scene:'plaza',camera:[465,775,1.65],stage:'yoga',line:"Breathe in. Breathe out. Ignore the enormous dinosaur.",reply:"That's impressive, Brie. Can we do the next pose somewhere safer?"},
  vito:{scene:'district',camera:[1615,930,1.8],stage:'throw',line:"Oh boy, that was a tough one.",reply:"Remind me not to arm-wrestle you, Vito. Come with us!"}
 };
 for(const [id,friend] of Object.entries(friends)){
  const {scene,camera,stage,line,reply}=friend;
  catalog['recruit-'+id]=[
   shot(id==='vito'?4:2.5,stage,scene,camera,id,id==='vito'?"Just… one… more… heave!":line,{friend:id,cue:id==='vito'?'rumble':null,cues:id==='vito'?[[2.75,'throw']]:[]}),
   shot(2.5,stage==='throw'?'throw-after':stage,scene,camera,id,id==='vito'?line:reply,{friend:id,interlocutor:id!=='vito'}),
   ...(id==='vito'?[shot(2,'throw-after',scene,camera,'coco',reply,{friend:id})]:[]),
   shot(2,'recruit-join',scene,camera,'coco',"Let's go together!",{friend:id,join:[id],cue:'join',activity:stage})
  ];
 }
 for(const [id,shots] of Object.entries(catalog)){
  shots.forEach(s=>{Object.freeze(s.camera);if(s.join)Object.freeze(s.join);if(s.cues){s.cues.forEach(Object.freeze);Object.freeze(s.cues);}Object.freeze(s);});
  catalog[id]=Object.freeze({shots:Object.freeze(shots),duration:shots.reduce((n,s)=>n+s.seconds,0)});
 }
 Object.freeze(catalog);

 const overlay=document.createElement('section');
 overlay.id='cinema';overlay.className='v5-cinema';overlay.hidden=true;
 overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','v5-cinema-title');
 overlay.innerHTML='<div class="v5-cinema-panel"><header><h2 id="v5-cinema-title">A Gburg Village story</h2><button id="cinema-skip" type="button" data-cinema="skip">Skip scene</button></header><div class="v5-cinema-screen"><canvas id="cinema-canvas" width="960" height="540" role="img" aria-label="Cinematic story"></canvas><div class="v5-cinema-loading" hidden><p role="status" aria-live="polite"></p><button id="cinema-retry" type="button" data-cinema="retry" hidden>Retry artwork</button></div></div><div class="v5-cinema-dialogue" aria-live="polite" aria-atomic="true"><img width="128" height="128" alt=""><div><strong></strong><p id="cinema-dialogue"></p></div></div><footer><span class="v5-cinema-counter"></span><button id="cinema-next" type="button" data-cinema="next">Next ▸</button></footer><progress max="1" value="0" aria-label="Scene progress"></progress></div>';
 document.body.append(overlay);
 const canvas=overlay.querySelector('canvas'),ctx=canvas.getContext('2d');
 const portrait=overlay.querySelector('img'),speaker=overlay.querySelector('.v5-cinema-dialogue strong'),dialogue=overlay.querySelector('.v5-cinema-dialogue p');
 const loadingPanel=overlay.querySelector('.v5-cinema-loading'),loadingText=loadingPanel.querySelector('p');
 const retry=overlay.querySelector('[data-cinema="retry"]'),next=overlay.querySelector('[data-cinema="next"]'),skipButton=overlay.querySelector('[data-cinema="skip"]');
 const progress=overlay.querySelector('progress'),counter=overlay.querySelector('.v5-cinema-counter');
 let current=null,serial=0,raf=0,last=0,previousFocus=null,inerted=[],readiness=Promise.resolve();

 function image(url){
  if(!url)return Promise.reject(new Error('A required artwork reference is missing.'));
  if(cache.has(url))return cache.get(url);
  const promise=new Promise((resolve,reject)=>{
   const img=new Image(),timer=setTimeout(()=>fail(),12000);
   function fail(){clearTimeout(timer);img.onload=img.onerror=null;reject(new Error('Could not load '+url));}
   img.onload=()=>{clearTimeout(timer);img.onload=img.onerror=null;resolve(img);};
   img.onerror=fail;img.src=url;
  });
  cache.set(url,promise);promise.catch(()=>{if(cache.get(url)===promise)cache.delete(url);});
  return promise;
 }
 function requirements(event){
  const urls=new Set(),humans=new Set(),dinosaurs=new Set();
  for(const s of event){
   urls.add(window.SCENES?.[s.scene]?.image);
   humans.add(s.speaker);if(s.friend)humans.add(s.friend);humans.add('coco');
   if(s.stage.startsWith('family'))['jason','peachy','connor'].forEach(id=>humans.add(id));
   if(s.stage==='coffee') ['jason','peachy','connor'].forEach(id=>humans.add(id));
   if(s.stage.startsWith('connor')||s.stage==='tablet')humans.add('connor');
   if(s.stage.startsWith('soccer')||s.stage==='soccer') {humans.add('jeff');humans.add('ari');dinosaurs.add('raptor');}
   if(s.stage.startsWith('swim')){humans.add('chris');dinosaurs.add('pterodactyl');urls.add('../v4/assets/characters/chris-swim.png');}
   if(['wrestle','throw','throw-after','window','family-head','coffee','family-join'].includes(s.stage))dinosaurs.add('trex');
   if(s.stage.startsWith('band')){humans.add('mark');humans.add('stephanie');}
   if(s.stage.startsWith('tennis')){humans.add('adam');humans.add('kate');dinosaurs.add('triceratops');}
   if(s.stage==='street-panic'){humans.add('jaime');humans.add('brie');}
   if(s.stage==='gather') ['jason','peachy','connor'].forEach(id=>humans.add(id));
   if(s.stage==='shops-panic') ['jason','peachy','connor'].forEach(id=>humans.add(id));
   if(s.stage==='reunion') Object.keys(window.CHARACTERS).forEach(id=>humans.add(id));
   if(s.join)s.join.forEach(id=>humans.add(id));
  }
  // Recruitment finales keep their original activity visible behind the banner.
  for(const s of event)if(s.activity==='band'){humans.add('mark');humans.add('stephanie');}
  for(const s of event)if(s.activity==='soccer'){humans.add('jeff');humans.add('ari');}
  for(const s of event)if(s.activity==='tennis'){humans.add('adam');humans.add('kate');}
  for(const id of humans){urls.add(window.CHARACTERS?.[id]?.sheet);urls.add(window.CHARACTERS?.[id]?.portrait);}
  for(const id of dinosaurs)urls.add('../v4/assets/dinosaurs/'+id+'.png');
  return Array.from(urls);
 }
 function stopFrame(){cancelAnimationFrame(raf);raf=0;last=0;}
 function schedule(){if(current&&!current.loading&&!current.error&&!document.hidden&&!raf)raf=requestAnimationFrame(tick);}
 async function prepare(token){
  if(!current||current.token!==token)return;
  const run=current;run.loading=true;run.error=null;stopFrame();
  loadingPanel.hidden=false;retry.hidden=true;next.disabled=true;
  loadingText.textContent='Loading the scene artwork…';
  try{
   if(!ctx)throw new Error('Canvas rendering is unavailable in this browser.');
   ctx.fillStyle='#101a35';ctx.fillRect(0,0,W,H);
   const urls=requirements(run.shots),images=await Promise.all(urls.map(image));
   if(!current||current.token!==token)return;
   run.images=new Map(urls.map((url,i)=>[url,images[i]]));run.loading=false;
   loadingPanel.hidden=true;next.disabled=false;enterShot();
   if(!document.hidden&&!run.error)next.focus({preventScroll:true});schedule();
  }catch(error){
   if(!current||current.token!==token)return;
   run.loading=false;run.error=error.message;
   loadingText.textContent='Artwork could not load. Check your connection, then retry; or skip this scene. '+error.message;
   retry.hidden=false;if(!document.hidden)retry.focus();
   throw error;
  }
 }
 function cue(kind){
  if(!kind||document.hidden)return;
  try{const value=window.V4_SFX?.play(kind);if(value?.catch)value.catch(()=>{});}catch(_error){/* Optional audio must never interrupt a scene. */}
 }
 function enterShot(){
  const s=current.shots[current.index],who=s.interlocutor?'coco':s.speaker;
  current.age=0;current.cueIndex=0;
  current.joinBanner=s.join?banner(s.join):'';
  speaker.textContent=window.CHARACTERS?.[who]?.name||who;
  dialogue.textContent=current.joinBanner||s.text;dialogue.classList.toggle('v5-cinema-join',!!s.join);
  portrait.src=window.CHARACTERS[who].portrait;portrait.alt=speaker.textContent+' portrait';
  canvas.setAttribute('aria-label',window.SCENES[s.scene].name+'. '+speaker.textContent+': '+s.text+(s.join?' '+current.joinBanner:''));
  counter.textContent=(current.index+1)+' / '+current.shots.length+' · Enter / Space: next · Esc: skip';
  next.textContent=current.index===current.shots.length-1?'Finish ▸':'Next ▸';
  cue(s.cue);draw();
 }
 function finish(skipped=false){
  if(!current)return false;
  const callback=current.callback,event=current.event;
  current=null;serial++;stopFrame();overlay.hidden=true;
  portrait.removeAttribute('src');loadingPanel.hidden=true;
  document.removeEventListener('keydown',keys,true);
  for(const [element,wasInert] of inerted)element.inert=wasInert;
  inerted=[];if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});previousFocus=null;
  document.dispatchEvent(new CustomEvent('v5-cinema-end',{detail:{event,skipped}}));
  if(typeof callback==='function')callback({skipped});
  return true;
 }
 function advance(){
  if(!current||current.loading||current.error)return false;
  const run=current;run.elapsed+=Math.max(0,run.shots[run.index].seconds-run.age);
  if(run.index===run.shots.length-1)return finish(false);
  run.index++;enterShot();last=0;return true;
 }
 function tick(now){
  raf=0;if(!current||current.loading||current.error||document.hidden){last=0;return;}
  const delta=last?Math.max(0,(now-last)/1000):0;last=now;
  current.age+=delta;current.elapsed+=delta;
  // Carry any excess time across shots rather than extending montage timing.
  while(current&&current.age>=current.shots[current.index].seconds){
   const overflow=current.age-current.shots[current.index].seconds;
   if(current.index===current.shots.length-1){finish(false);return;}
   current.index++;enterShot();current.age=overflow;
  }
  const s=current.shots[current.index];
  while(s.cues&&current.cueIndex<s.cues.length&&current.age>=s.cues[current.cueIndex][0])cue(s.cues[current.cueIndex++][1]);
  draw();schedule();
 }
 function keys(event){
  if(!current)return;
  if(event.key==='Tab'){
   const buttons=Array.from(overlay.querySelectorAll('button')).filter(b=>!b.hidden&&!b.disabled);
   const index=buttons.indexOf(document.activeElement),direction=event.shiftKey?-1:1;
   buttons[(index+direction+buttons.length)%buttons.length].focus();
  }else if(event.key==='Escape')finish(true);
  else if(!event.repeat&&(event.key==='Enter'||event.key===' ')){
   if(document.activeElement===retry&&!retry.hidden)retry.click();
   else if(document.activeElement===skipButton)finish(true);
   else advance();
  }
  event.preventDefault();event.stopImmediatePropagation();
 }
 skipButton.onclick=()=>finish(true);next.onclick=advance;
 function loadCurrent(){readiness=prepare(current.token);readiness.catch(()=>{});}
 retry.onclick=()=>{if(current&&!current.loading){skipButton.focus();loadCurrent();}};
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopFrame();else schedule();});

 function rect(color,x,y,w,h){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
 function oval(color,x,y,rx,ry){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
 function line(color,width,points){
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();
  points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
 }
 function label(text,x,y,size=24,color='#fff3ce'){
  ctx.fillStyle=color;ctx.font='bold '+size+'px monospace';ctx.textAlign='center';ctx.fillText(text,x,y);
 }
 function asset(url){return current.images.get(url);}
 function human(id,x,y,{dir='down',walk=false,pose='',scale=1,swim=false}={}){
  const spec=window.CHARACTERS[id],img=asset(swim?'../v4/assets/characters/chris-swim.png':spec.sheet);
  if(!img)throw new Error('Missing required character artwork: '+id);
  const t=current.age,frame=walk?Math.floor(t*(spec.walkFPS||8))%(spec.frames||4):1;
  const row=spec.rows[dir]+(walk?(spec.walkRowOffset||0):0);
  const fw=spec.frameWidth||64,fh=spec.frameHeight||64,foot=spec.foot||{x:32,y:60};
  const bob=reduced.matches?0:(pose==='startle'?Math.sin(clamp(t*2)*Math.PI)*9:pose==='dance'?Math.abs(Math.sin(t*8))*3:0);
  ctx.save();ctx.translate(x,y-bob);ctx.scale(scale,scale);
  oval(swim?'#b4f5fc66':'#091b3244',0,0,swim?17:13,4);
  ctx.drawImage(img,frame*fw,row*fh,fw,fh,-foot.x,-foot.y,fw,fh);
  if(pose==='startle'){
   if(id!=='coco'){line('#f1c6a3',4,[[-10,-25],[-22,-39]]);line('#f1c6a3',4,[[10,-25],[22,-39]]);}
   label('!',0,-68,16,'#ffe784');
  }
  if(pose==='tablet'||pose==='phone'){
   rect('#171e36',-12,-26,24,17);rect('#72cde8',-9,-23,18,11);
   if(pose==='phone'){rect('#232734',-4,-23,8,14);rect('#ed7373',-2,-19,4,3);}
   line('#e7c3a6',3,[[-14,-20],[-10,-18]]);line('#e7c3a6',3,[[14,-20],[10,-18]]);
  }
  if(pose==='guitar'){
   oval('#dd7557',6,-19,10,6);line('#eed8ac',5,[[10,-21],[27,-39]]);line('#f3d0aa',3,[[-9,-27],[6,-19]]);
  }
  if(pose==='sing'){line('#aaa9ba',2,[[13,-31],[13,0]]);oval('#313646',13,-32,3,4);label('♪',24,-55,15,'#b2eafa');}
  if(pose==='tennis'){
   line('#ead5a3',2,[[15,-18],[23,-30]]);
   ctx.strokeStyle='#b2e4f3';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(26,-36,6,9,.4,0,Math.PI*2);ctx.stroke();
  }
  if(pose==='skate'){rect('#7ae0dc',-14,-3,11,3);rect('#7ae0dc',4,-3,11,3);for(const a of [-12,-6,6,12])oval('#333844',a,2,2,2);}
  if(pose==='yoga'){
   line('#f0c3a3',4,[[-10,-27],[-20,-37],[-28,-23]]);
   line('#f0c3a3',4,[[10,-27],[20,-37],[28,-23]]);
   line('#474a72',5,[[-7,-7],[7,-17],[15,-6]]);
  }
  if(pose==='wrestle'){line('#efc6a3',5,[[-9,-26],[-23,-14]]);line('#efc6a3',5,[[9,-26],[30,-35]]);}
  if(pose==='kick'){
   line('#444b74',5,[[5,-10],[18,-7]]);rect('#e9ece0',16,-9,9,4);
  }
  ctx.restore();
 }
 function dinosaur(kind,x,y,{dir='left',walk=false,scale=1,head=false,shadow=true}={}){
  const img=asset('../v4/assets/dinosaurs/'+kind+'.png');if(!img)throw new Error('Missing required dinosaur artwork: '+kind);
  const row={down:0,left:1,right:2,up:3}[dir]+(walk?4:0),frame=walk?Math.floor(current.age*7)%4:1;
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  if(shadow&&!head)oval('#0a172d66',0,0,30,7);
  if(head){
   // Only the face/neck region enters the window, never the torso or legs.
   ctx.drawImage(img,frame*128+(dir==='right'?68:8),row*128+54,52,45,-31,-54,62,54);
  }else ctx.drawImage(img,frame*128,row*128,128,128,-64,-124,128,128);
  ctx.restore();
 }
 function dust(x,y,t){
  for(let i=0;i<14;i++){
   const a=i*2.4+t*2,r=18+(i%4)*9;
   const w=36+(i%3)*4,h=24+(i%4)*4,color=i%2?'#d8c8a5ee':'#ab967dee';
   const px=Math.round((x+Math.cos(a)*r-w/2)/4)*4,py=Math.round((y-25+Math.sin(a)*17-h/2)/4)*4;
   rect(color,px+8,py,w-16,4);rect(color,px+4,py+4,w-8,4);
   rect(color,px,py+8,w,h-16);
   rect(color,px+4,py+h-8,w-8,4);rect(color,px+8,py+h-4,w-16,4);
  }
  label('POOF!',x,y-45,14,'#fff1bc');
 }
 function ball(x,y){oval('#112d3455',x,y+3,6,2);oval('#f1eee4',x,y-3,6,6);rect('#293748',x-2,y-5,4,4);}
 function pixelHead(x,y,w,h){
  ctx.save();ctx.translate(x,y);ctx.scale(w/64,h/50);
  ctx.fillStyle='#14271f';ctx.beginPath();
  [[4,46],[4,18],[10,18],[10,10],[16,10],[16,6],[30,6],[30,9],[40,9],[40,15],[56,15],[56,18],[62,18],[62,30],[58,30],[58,39],[44,39],[44,43],[18,43],[18,46]].forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));
  ctx.closePath();ctx.fill();
  rect('#667647',8,21,25,23);rect('#819653',13,14,24,25);rect('#91a45f',18,10,12,24);
  rect('#8b9856',33,19,25,19);rect('#a0aa68',38,19,20,8);
  rect('#465a36',10,35,15,9);rect('#607442',20,38,24,4);
  rect('#b3ba7c',16,14,7,4);rect('#53673b',12,25,5,4);rect('#677b43',23,34,4,4);
  rect('#253626',26,14,15,5);rect('#f0c352',27,19,10,8);
  rect('#fff0a5',28,19,4,3);rect('#172019',33,19,3,8);rect('#fff7d5',33,20,1,2);
  rect('#263321',54,22,4,3);rect('#453128',32,29,28,9);rect('#1b211b',36,31,23,5);
  for(const tooth of [36,44,52]){rect('#fff1ca',tooth,29,4,3);rect('#fff1ca',tooth+1,32,2,3);}
  for(const tooth of [40,48,56]){rect('#f2dfb2',tooth,36,3,2);rect('#f2dfb2',tooth+1,34,1,2);}
  rect('#c2b282',31,38,24,2);rect('#344b30',8,40,6,4);
  ctx.restore();
 }
 function windowView(x,y,w,h,progress){
  ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
  rect('#254657',x,y,w,h);rect('#42776b',x,y+h*.67,w,h*.33);
  oval('#08162499',x+w*.62,y+h*.95,36+progress*18,9);
  pixelHead(x+w*(.55-.58*progress),y+h*.04,w*1.07,h*.94);
  ctx.restore();line('#e7cea2',4,[[x,y+h],[x,y],[x+w,y],[x+w,y+h],[x,y+h]]);
  line('#c9b38d',2,[[x+w*.16,y],[x+w*.16,y+h]]);
 }
 function windowCloseup(s){
  const progress=s.stage==='coffee'?1:ease(current.age/.7);
  const x=40,y=60,w=395,h=295;
  rect('#0a1422ee',x-9,y-9,w+18,h+43);
  windowView(x,y,w,h,progress);
  label(s.stage==='window'?"OUTSIDE COCO'S WINDOW":'OUTSIDE THE LIVING ROOM WINDOW',x+w/2,y+h+25,14,'#fff0c9');
 }
 function heldDinosaur(x,y,t){
  const lift=ease((t-1.2)/.65),launch=ease((t-2.75)/1.25);
  ctx.save();ctx.translate(x+24+launch*650,y-28-launch*185);
  ctx.rotate(-.12-.48*lift-launch*2);
  // The short tapered tail and atlas creature share one moving/rotating frame.
  ctx.fillStyle='#686849';ctx.beginPath();
  [[0,0],[4,0],[4,-2],[10,-2],[10,0],[18,0],[18,2],[26,2],[26,6],[18,6],[18,4],[10,4],[10,2],[4,2],[4,1],[0,1]].forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));
  ctx.closePath();ctx.fill();rect('#93906b',10,0,8,1);
  dinosaur('trex',54,46,{dir:'right',scale:.62,shadow:false});
  ctx.restore();
 }
 function coffee(x,y,t){
  const fall=ease(t/1.2);
  oval('#815029aa',x,y+3,18*fall+1,6*fall+1);
  ctx.save();ctx.translate(x,y-24*(1-fall));ctx.rotate(fall*1.8);
  rect('#ede9d9',-5,-8,10,9);line('#ede9d9',2,[[5,-6],[8,-6],[8,-1],[5,-1]]);ctx.restore();
  if(t<1.6)for(let i=0;i<6;i++)rect('#ad6a36',x+(i-2.5)*7*fall,y-12*Math.sin(fall*Math.PI)-i%2*5,3,3);
 }
 function banner(ids){
  const names=ids.map(id=>window.CHARACTERS[id].name.toUpperCase());
  return names.join(' AND ')+(ids.length===1?' JOINS':' JOIN')+' YOUR PARTY!';
 }

 function stage(s){
  const t=current.age,u=clamp(t/s.seconds),motion=reduced.matches?0:Math.sin(t*3)*4;
  const activity=s.stage==='recruit-join'&&s.activity==='throw'?'throw-after':s.activity||s.stage;
  if(['wake','peek','window','alarm'].includes(activity)){
   if(activity==='wake'){human('coco',304,302,{dir:'up'});label('…rumble…',256,250,12,'#f7dba5');}
   else if(activity==='peek'){const p=ease(u);human('coco',304-47*p,302-98*p,{dir:'up',walk:p<.98});}
   else if(activity==='window'){windowView(237,47,45,100,ease(u*2));human('coco',260,218,{dir:'up',pose:u>.4?'startle':''});}
   else human('coco',260-125*ease(u),240+113*ease(u),{dir:'left',walk:true,pose:'startle'});
  }else if(['tablet','connor-roar','connor-join'].includes(activity)){
   human('connor',174,277,{pose:activity==='tablet'?'tablet':'startle',dir:'down'});
   human('coco',122+45*ease(u),348,{walk:activity==='tablet'&&current.index===0,dir:'up'});
   if(activity==='connor-roar')label('RRRROOOAAARR!',445,100,20,'#ffe6aa');
  }else if(['family','family-head','coffee','family-join'].includes(activity)){
   human('jason',410,200,{dir:'right',pose:activity==='coffee'?'startle':''});
   human('peachy',520,200,{dir:'left',pose:activity==='family'?'phone':activity==='coffee'?'startle':''});
   human('coco',430,293,{dir:'up'});human('connor',405,313,{dir:'up'});
   if(activity==='family-head'||activity==='coffee'||activity==='family-join')windowView(215,18,90,85,activity==='family-head'?ease(u*2):1);
   if(activity==='coffee')coffee(429,214,t);
   else if(activity==='family') {rect('#eee3c9',422,177,8,10);rect('#624329',423,177,6,3);}
  }else if(activity==='soccer'||activity==='soccer-panic'){
   const panic=activity==='soccer-panic',run=panic?ease(clamp((u-.55)/.45))*55:0;
   human('jeff',385-run,345,{dir:panic?'left':'right',walk:panic&&run>0,pose:u<.3?'kick':panic&&u>.4?'startle':''});
   human('ari',575-run,345,{dir:panic?'left':'left',walk:panic&&run>0,pose:panic&&u>.4?'startle':''});
   ball(395+Math.min(u*1.7,1)*(panic?110:160),343-Math.sin(Math.min(u*1.7,1)*Math.PI)*15);
   if(panic)dinosaur('raptor',510,340,{dir:'left',scale:.65});
   else human('coco',470,397,{dir:'up'});
  }else if(activity==='swim'||activity==='swim-panic'){
   if(s.stage==='recruit-join')human('chris',419,850,{dir:'down'});
   else{
    ctx.save();ctx.globalAlpha=.22;
    human('chris',358,848,{swim:true,dir:'down'});ctx.restore();
    human('chris',358,813+motion,{swim:true,dir:'up',walk:true});
    for(let i=0;i<3;i++){ctx.strokeStyle='#c7ffff99';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(358,817,18+i*7+u*8,3+i*2,0,0,Math.PI*2);ctx.stroke();}
    dinosaur('pterodactyl',310+u*115,750,{dir:'right',scale:.72});
   }
   if(activity==='swim')human('coco',422,813,{dir:'left'});
  }else if(['wrestle','throw','throw-after'].includes(activity)){
   const x=1615,y=1045;
   human('vito',x,y,{pose:activity==='throw-after'?'':'wrestle',dir:'right'});
   if(activity!=='throw-after'){
    if(activity==='throw'&&t>=1.2){
     heldDinosaur(x,y,t);
     if(t<1.55)dust(x+20,y-9,t);
    }else{dinosaur('trex',x+25,y+2,{scale:.75});dust(x+14,y-10,t);}
   }
   if(activity!=='wrestle')human('coco',x-60,y-8,{dir:'right',pose:activity==='throw'?'startle':''});
  }else if(activity==='yoga'){
   rect('#776dab',432,818,65,20);rect('#b1a0cc',435,820,59,2);
   human('brie',465,825,{pose:'yoga'});human('coco',395,860,{dir:'right'});
   label('breathe…',468,756,12,'#e3efd6');
  }else if(activity==='skate'){
   const x=100+Math.sin(u*Math.PI)*18;
   human('jaime',x,340-35*ease(u),{walk:true,pose:'skate',dir:'up'});human('coco',153,358,{dir:'left'});
   line('#cee9df77',2,[[x-9,360],[x-9,374]]);line('#cee9df77',2,[[x+9,360],[x+9,378]]);
  }else if(activity==='band'||activity==='band-panic'){
   human('mark',360,245,{pose:activity==='band-panic'?'startle':'guitar'});
   human('stephanie',160,233,{pose:activity==='band-panic'?'startle':'sing'});
   if(activity==='band')human('coco',237,277,{dir:'up'});
   else {rect('#0b122b55',0,0,576,324);label('POWER LOST',288,60,15,'#f2d49a');}
  }else if(activity==='tennis'||activity==='tennis-panic'){
   if(s.scene==='recreation'){
    human('adam',667,550,{pose:'tennis',dir:'down'});human('kate',711,638,{pose:'tennis',dir:'up'});
    oval('#f7f29d',690,594+motion*4,4,4);
    if(activity==='tennis-panic')dinosaur('triceratops',762,619,{scale:.65});
    else human('coco',620,629,{dir:'right'});
   }else{
    const {x,y}=friends[s.friend];
    human(s.friend,x,y,{pose:'tennis',dir:'left'});human('coco',x-55,y+30,{dir:'right'});
    oval('#f7f29d',x+20,y-10+motion,4,4);
   }
  }else if(activity==='street-panic'){
   human('jaime',310+u*160,844,{pose:'skate',dir:'right',walk:true});
   rect('#8176a6',440,799,58,19);human('brie',468,807,{pose:'yoga'});
   label('NO SIGNAL',415,745,14,'#ffe3aa');
  }else if(activity==='shops-panic'){
   human('coco',1325+u*75,756,{dir:'right',walk:true});human('jason',1290+u*75,778,{walk:true,dir:'right'});
   human('peachy',1458,765,{pose:'phone'});human('connor',1500,801,{pose:'startle'});
   label('SHOPS CLOSED · NO POWER',1430,652,20,'#ffe1a0');
  }else if(activity==='gather'){
   human('coco',720,742,{dir:'up'});human('connor',760,770,{dir:'left'});
   human('jason',800,757,{dir:'left'});human('peachy',835,782,{dir:'left'});
   label('MARKET SQUARE',765,623,22,'#ffe6a3');
  }else if(activity==='reunion'){
   const others=Object.keys(window.CHARACTERS).filter(id=>id!=='coco');
   others.forEach((id,i)=>human(id,635+(i%7)*43,780+Math.floor(i/7)*56,{dir:i<7?'down':'up'}));
   human('coco',760,886,{dir:'up'});
   label('EVERYONE ACCOUNTED FOR',765,690,19,'#ffe6a3');
  }else if(activity==='recruit-join'){
   // Quiet resolution, never repeat the throw or a panic animation under a join.
   const x=s.camera[0],y=s.camera[1];
   human(s.friend,x+32,y+28);human('coco',x-35,y+40,{dir:'right'});
  }
 }
 function draw(){
  try{renderFrame();}catch(error){
   stopFrame();if(!current)return;
   current.error=error.message;next.disabled=true;loadingPanel.hidden=false;retry.hidden=false;
   loadingText.textContent='The cinematic could not render. Retry the scene or skip to continue. '+error.message;
   console.error('V5 cinematic rendering failed:',error);
  }
 }
 function renderFrame(){
  if(!current||current.loading||current.error)return;
  const s=current.shots[current.index],im=asset(window.SCENES[s.scene].image),scene=window.SCENES[s.scene];
  const [x,y,zoom]=s.camera,t=current.age;
  ctx.save();
  try{
   ctx.imageSmoothingEnabled=false;
   rect('#101524',0,0,W,H);
   const shake=s.shake&&!reduced.matches?Math.max(0,1-t/1.5):0;
   ctx.translate(W/2+Math.sin(t*59)*5*shake,H/2+Math.cos(t*73)*3*shake);
   ctx.scale(zoom,zoom);ctx.translate(-x,-y);
   ctx.drawImage(im,0,0,scene.width,scene.height);stage(s);
  }finally{ctx.restore();}
  if(s.stage==='window'||s.stage==='family-head'||s.stage==='coffee')windowCloseup(s);
  rect('#090e2099',0,0,W,28);rect('#090e2099',0,H-28,W,28);
  label(scene.name,480,20,14,'#ddd5c1');
  if(s.join){
   rect('#111d50ee',95,208,770,90);rect('#eedca5',95,208,770,3);rect('#eedca5',95,295,770,3);
   label(current.joinBanner,480,260,s.join.length>1?25:29,'#fff0b8');
  }
  progress.value=clamp(current.elapsed/current.duration);
 }

 window.V5_CINEMA={
  // Artwork is prepared per event, so this promise has no startup network work.
  get ready(){return readiness;},
  catalog,
  get active(){return current!==null;},
  get state(){
   return current?{event:current.event,shot:current.index,shotIndex:current.index,age:current.age,elapsed:current.elapsed,duration:current.duration,loading:current.loading,error:current.error}
    :{event:null,shot:-1,shotIndex:-1,age:0,elapsed:0,duration:0,loading:false,error:null};
  },
  play(eventId,onComplete){
   if(current||!Object.prototype.hasOwnProperty.call(catalog,eventId))return false;
   const {shots,duration}=catalog[eventId];
   current={event:eventId,shots,index:0,age:0,elapsed:0,duration,loading:true,error:null,callback:onComplete,token:++serial,images:new Map()};
   previousFocus=document.activeElement;
   overlay.hidden=false;dialogue.textContent='Preparing the scene…';dialogue.classList.remove('v5-cinema-join');speaker.textContent='Gburg Village';portrait.removeAttribute('src');portrait.alt='';
   document.getElementById('v5-cinema-title').textContent=eventId==='montage'?'Meanwhile, across the neighborhood…':'Gburg Village · '+(eventId.startsWith('recruit-')?'A friend in need':'Chapter One');
   inerted=Array.from(document.body.children).filter(element=>element!==overlay).map(element=>[element,element.inert]);
   for(const [element] of inerted)element.inert=true;
   document.addEventListener('keydown',keys,true);skipButton.focus({preventScroll:true});
   document.dispatchEvent(new CustomEvent('v5-cinema-start',{detail:{event:eventId,duration}}));
   if(current)loadCurrent();return true;
  },
  next:advance,
  skip(){return finish(true);}
 };
})();
