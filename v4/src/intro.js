// Local canvas animation and original synthesized audio, no video download.
(() => {
 'use strict';
 const app=document.querySelector('.app'),overlay=document.createElement('section');
 overlay.id='meteor-intro';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Meteor Night opening movie');
 overlay.innerHTML='<div class="intro-top"><span>FAMILY WALK / CHAPTER ONE</span><button id="intro-skip">Skip to game</button></div><div class="intro-screen"><canvas id="intro-film" width="960" height="540" aria-label="Animated story: a happy town, the family sings and dances at Rock Band, Coco spots a meteor through her window, and dinosaurs emerge from its crater."></canvas><div id="intro-curtain"><p class="intro-kicker">A PERFECT DAY. AN IMPOSSIBLE NIGHT.</p><h2>METEOR<br><em>NIGHT</em></h2><p>A Family Walk adventure</p><button id="intro-start">Play the opening</button><small> Animated story · 36 seconds · sound optional</small></div></div><div class="intro-bottom"><p id="intro-caption" aria-live="polite">Something extraordinary is on its way.</p><button id="intro-sound" aria-pressed="true">Sound on</button><div class="intro-track"><i id="intro-progress"></i></div></div>';
 document.body.append(overlay);
 const $=id=>document.getElementById(id),c=$('intro-film').getContext('2d'),images={},sheets={};
 let active=true,playing=false,elapsed=0,last=0,raf=0,audio=null,sound=true,cue=-1,caption='',ready=false;
 const voices=new Set(),rockVoices=new Set();
 $('intro-start').disabled=true;$('intro-start').textContent='Getting the town ready…';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const assets={plaza:'../assets/scene/neighborhood.png',district:'../v2/assets/district.webp',recreation:'../v2/assets/recreation.webp',north:'../v3/assets/north-market.png',room:'../v3/assets/window-room.png',crater:'../v3/assets/meteor-crater.png',rockband:'assets/scenes/rockband.png'};
 assets.plaza=window.TOWN.image;
 assets.bedroom='assets/scenes/coco-room.png';assets.instruments='assets/items/band-instruments.png';
 for(const id of ['trex','raptor','triceratops'])assets[id]='assets/dinosaurs/'+id+'.png';
 const load=src=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>{console.error('Opening artwork failed to load: '+src);resolve(null);};img.src=src;});
 Promise.all([...Object.entries(assets).map(async([id,url])=>images[id]=await load(url)),...Object.entries(CHARACTERS).map(async([id,v])=>sheets[id]=await load(v.sheet))]).then(()=>{ready=true;$('intro-start').disabled=false;$('intro-start').textContent='Play the opening';draw(0);});
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
 function rect(color,x,y,w,h){c.fillStyle=color;c.fillRect(x,y,w,h);}
 function oval(color,x,y,rx,ry){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
 function text(str,x,y,size=24,color='#fff5d6'){c.fillStyle=color;c.font=`${size>=30?'bold ':''}${size}px Georgia`;c.textAlign='center';c.fillText(str,x,y);}
 function actor(id,x,y,scale=1,dir='down',walk=true,t=elapsed){const img=sheets[id];if(!img)return;c.save();c.imageSmoothingEnabled=false;c.translate(x,y);c.scale(scale,scale);const frame=walk?Math.floor(t*7)%4:1,row=CHARACTERS[id].rows[dir]+(walk?(CHARACTERS[id].walkRowOffset||0):0);oval('#152a3544',0,0,13,4);c.drawImage(img,frame*64,row*64,64,64,-32,-60,64,64);c.restore();}
 function background(id,x,y,zoom=1){const im=images[id];rect('#183e48',0,0,960,540);if(!im)return;c.save();c.scale(zoom,zoom);const scene=SCENES[id];c.drawImage(im,-x,-y,scene.width,scene.height);c.restore();}
 function dino(x,y,scale,t,kind){const image=images[kind];if(!image)return;c.save();c.translate(x,y);c.scale(scale,scale);oval('#05172277',0,0,30,7);c.drawImage(image,Math.floor(t*7)%4*128,0,128,128,-64,-124,128,128);c.restore();}
 function happy(t){
  const shot=Math.floor(t/3),u=t%3;
  if(shot===0){background('plaza',405+u*22,490,1.23);for(const [i,id] of ['jason','peachy','connor','coco'].entries())actor(id,220+i*125+u*24,  380+i%2*22,1.45,'right',true,t+i);text('JUST ANOTHER PERFECT DAY',480,104,22);}
  else if(shot===1){
   const zoom=1.35,ox=280,oy=420+u*4;
   const point=(x,y)=>[(x-ox)*zoom,(y-oy)*zoom];
   background('recreation',ox,oy,zoom);
   const adam=point(667+Math.sin(t*2)*12,550),kate=point(711+Math.sin(t*2+Math.PI)*12,638);
   const coco=point(405+Math.sin(t*2)*10,570),peachy=point(495,610);
   actor('adam',...adam,1.15,'down',true);actor('kate',...kate,1.15,'up',true);
   actor('coco',...coco,1.05,'right',true);actor('peachy',...peachy,1.15,'left',false);
   const ball=point(690+Math.sin(u*4)*18,594+Math.sin(u*4)*37);
   oval('#f5f084',...ball,4,4);
   for(const [x,y] of [adam,kate]){c.strokeStyle='#b6eeff';c.lineWidth=2;c.beginPath();c.ellipse(x+20,y-20,7,11,-.5,0,Math.PI*2);c.stroke();rect('#f2e5ce',x+12,y-11,3,12);}
   const basketball=point(450+Math.sin(u*2)*35,590-Math.abs(Math.sin(u*4))*12);
   oval('#e78e37',...basketball,7,7);c.strokeStyle='#704420';c.lineWidth=1;c.beginPath();c.arc(...basketball,7,0,Math.PI*2);c.moveTo(basketball[0]-7,basketball[1]);c.lineTo(basketball[0]+7,basketball[1]);c.stroke();
   text('TENNIS FOR TWO. BASKETBALL WITH THE GIRLS.',480,72,19);
  }
  // Warm sunlight and gently floating motes.
  c.fillStyle='#ffe5a30e';c.fillRect(0,0,960,540);for(let i=0;i<18;i++){c.globalAlpha=.3;oval('#fff5c2',(i*73+t*9)%960,(i*41+t*4)%470,1.5,1.5);}c.globalAlpha=1;
 }
 function rockband(t){
  if(images.rockband)c.drawImage(images.rockband,0,0,960,540);else{rect('#322e39',0,0,960,540);text('Rock Band artwork unavailable',480,100,20);}
  const band=[
   ['peachy',282,278,1.75,'sing'],['coco',372,292,1.55,'sing'],
   ['connor',482,282,1.7,'guitar'],['jason',592,298,1.8,'bass'],
   ['adam',751,280,1.75,'drums'],['brie',172,326,1.75,'dance'],
   ['vito',318,408,1.8,'dance'],['kate',706,434,1.75,'dance'],
   ['mark',580,460,1.8,'guitar'],['stephanie',112,415,1.75,'sing']
  ];
  for(const [i,[id,x,y,scale,role]] of band.entries()){
   const beat=t*Math.PI*4+i*.8,sway=reduced?0:Math.sin(beat)*.07,bob=reduced?0:Math.abs(Math.sin(beat))*5;
   const dir=role==='dance'&&!reduced?(Math.floor(t*2+i)%4===0?'left':Math.floor(t*2+i)%4===2?'right':'down'):'down';
   c.save();c.translate(x,y-bob);c.rotate(sway);
   actor(id,0,0,scale,dir,!reduced,t+i*.21);
   c.scale(scale,scale);
   if(role==='sing'){
    const mouth=id==='coco'?-18:-35;
    if(images.instruments)c.drawImage(images.instruments,128,0,64,64,-15,mouth-13,32,32);
    if(Math.sin(beat)>0){rect('#512d32',-2,mouth,4,3);rect('#f0c1ab',-1,mouth,2,1);}
   }else if(role==='guitar'||role==='bass'){
    c.save();c.translate(0,id==='connor'?-13:-23);c.rotate(.85);
    if(images.instruments)c.drawImage(images.instruments,role==='bass'?64:0,0,64,64,-25,-34,48,48);
    rect('#f3d1ad',-7+Math.sin(beat)*2,0,4,4);c.restore();
   }else if(role==='drums'){
    c.strokeStyle='#ead0a2';c.lineWidth=3;c.beginPath();c.moveTo(-15,-22);c.lineTo(-27,-32-Math.sin(beat)*9);c.moveTo(12,-22);c.lineTo(24,-32+Math.sin(beat)*9);c.stroke();
   }else{
    c.strokeStyle='#eec4a1';c.lineWidth=4;c.beginPath();c.moveTo(-12,-25);c.lineTo(-23,-33-Math.sin(beat)*8);c.moveTo(12,-25);c.lineTo(22,-33+Math.sin(beat)*8);c.stroke();
   }
   c.restore();
   if(role==='drums'&&images.rockband)c.drawImage(images.rockband,697,234,111,104,697,234,111,104);
   const noteY=y-scale*62-12+(reduced?0:Math.sin(beat)*4);
   text(i%2?'♪':'♫',x+32,noteY,16,i%2?'#fae4a0':'#b3e6ef');
  }
  text('ONE MORE SONG BEFORE BED!',480,63,22);
 }
 function room(t){
  const z=1+(reduced?0:.035*smooth(t/8));c.save();c.translate(480,270);c.scale(z,z);c.translate(-480,-270);
  if(images.room)c.drawImage(images.room,0,0,960,540);else rect('#322e39',0,0,960,540);
  // Sprite layers remain independent of the painted PNG, including the mirror reflection.
  const turn=t>5.3,jump=turn?Math.sin(clamp((t-5.3)*3)*Math.PI)*7:0;
  c.save();c.beginPath();c.moveTo(182,437);c.lineTo(178,174);c.quadraticCurveTo(178,113,236,113);c.quadraticCurveTo(297,113,298,172);c.lineTo(306,437);c.closePath();c.clip();
  c.globalAlpha=.77;actor('coco',246,432-jump,2.8,turn?'right':'down',t<1.2,t);c.restore();
  actor('coco',394,456-jump,3.4,turn?'right':'left',t<1.2,t);
  if(turn){rect('#fff4d5',422,297,27,27);rect('#713a29',434,302,4,11);rect('#713a29',434,317,4,4);}
  // Pixel meteor passes BEHIND the existing PNG window mullions.
  if(t>2.8){const p=clamp((t-2.8)/4.5),x=802-p*138,y=159+p*83;c.save();c.beginPath();c.rect(535,150,130,101);c.rect(677,150,137,101);c.clip();
   for(let i=20;i>=0;i--){const q=1-i/22,sz=Math.ceil((3+p*7)*q);c.globalAlpha=q*.85;rect(i%2?'#ffb64f':'#df6e2c',Math.round((x+i*4)/2)*2,Math.round((y-i*2.8)/2)*2,sz,sz);}
   c.globalAlpha=1;const sz=6+Math.floor(p*7);rect('#ffd46a',Math.round(x),Math.round(y),sz,sz);rect('#fff4d5',Math.round(x)+2,Math.round(y)+2,Math.max(3,sz-4),Math.max(3,sz-4));c.restore();
  }
  if(t>6.3){c.globalAlpha=clamp((t-6.3)/1.7)*.2;rect('#ffeab8',0,0,960,540);c.globalAlpha=1;}
  c.restore();
 }
 function crater(t){
  const shake=reduced?0:Math.max(0,1-t)*6;c.save();c.translate(Math.sin(t*65)*shake,Math.cos(t*41)*shake);
  const zoom=1.18,ox=360,oy=58,o=SCENES.north.overlay;
  background('north',ox,oy,zoom);
  if(images.crater)c.drawImage(images.crater,...o.source,(o.x-ox)*zoom,(o.y-oy)*zoom,o.w*zoom,o.h*zoom);
  c.fillStyle='#18243e55';c.fillRect(0,0,960,540);
  const cx=(767-ox)*zoom,cy=(312-oy)*zoom;
  for(let i=0;i<16;i++){const p=(t*.16+i/16)%1;c.globalAlpha=(1-p)*.45;rect(i%2?'#a79e91':'#767578',cx-85+(i*47)%175+Math.sin(i+t)*10,cy-p*210,7+p*16,7+p*14);}c.globalAlpha=1;
  for(let i=0;i<3;i++){const p=smooth((t-i*.75-.4)/2.5);if(p<=0)continue;dino(cx+(i-1)*p*143,cy+15+p*(80-i*28),.3+p*1.25,t+i,  ['trex','raptor','triceratops'][i]);}
  for(let i=0;i<22;i++){const p=(t*.25+i/22)%1;rect(i%2?'#ffc471':'#ef8953',cx-80+(i*61)%160+Math.sin(i+t)*9,cy+25-p*130,2,3);}
  c.restore();
 }
 function draw(t){
  c.clearRect(0,0,960,540);c.imageSmoothingEnabled=false;
  if(t<6)happy(t);else if(t<12)rockband(t-6);else if(t<20)room(t-12);else if(t<21){room(7.95);c.globalAlpha=reduced?.25:Math.sin((t-20)*Math.PI)*.9;rect('#fff2d3',0,0,960,540);c.globalAlpha=1;}  else if(t<32)crater(t-21);else{
     if(images.bedroom)c.drawImage(images.bedroom,120,0,720,540);else rect('#322e39',0,0,960,540);
     c.save();c.translate(655,245);c.rotate(-Math.PI/2);actor('coco',0,0,2.2,'right',false,t);c.restore();
   text("THE DINO HOUSE · COCO'S ROOM",480,64,22);
    }
  const vignette=c.createRadialGradient(480,270,180,480,270,570);vignette.addColorStop(0,'#0000');vignette.addColorStop(1,'#0715229c');c.fillStyle=vignette;c.fillRect(0,0,960,540);
  rect('#071019',0,0,960,34);rect('#071019',0,506,960,34);
  if(t>=28&&t<32){c.globalAlpha=smooth((t-28)/1.4);rect('#08131bb8',0,0,960,540);text('FAMILY WALK',480,186,25,'#e7c789');text('METEOR NIGHT',480,273,70);text('Small town. Big prehistoric problem.',480,326,24);c.globalAlpha=1;}
 }
 function say(s){if(s===caption)return;caption=s;$('intro-caption').textContent=s;}
 function trackVoice(source,gain,rock=false){
  voices.add(source);if(rock)rockVoices.add(source);
  source.onended=()=>{voices.delete(source);rockVoices.delete(source);source.disconnect();gain.disconnect();};
 }
 function stopVoices(set=voices){for(const source of set){source.stop();source.disconnect();voices.delete(source);rockVoices.delete(source);}}
 function soundCue(kind){if(!sound||!audio||audio.state!=='running')return;const at=audio.currentTime;
  function tone(hz,duration,volume,type='sine',delay=0,end=hz){const osc=audio.createOscillator(),g=audio.createGain();osc.type=type;osc.frequency.setValueAtTime(hz,at+delay);osc.frequency.exponentialRampToValueAtTime(Math.max(20,end),at+delay+duration);g.gain.setValueAtTime(.001,at+delay);g.gain.linearRampToValueAtTime(volume,at+delay+.01);g.gain.exponentialRampToValueAtTime(.001,at+delay+duration);osc.connect(g);g.connect(audio.destination);trackVoice(osc,g,kind===6);osc.start(at+delay);osc.stop(at+delay+duration);}
  if(kind===6){
   // Original three-bar power-chord riff; no commercial Rock Band recording.
   const offset=Math.max(0,elapsed-6),roots=[164.81,146.83,130.81],riff=[1,1,1.5,1,2,1.5,1,1.5];
   for(let step=0;step<24;step++){
    const beat=step*.25,delay=beat-offset;if(delay<0)continue;
    const root=roots[Math.floor(step/8)],note=root*riff[step%8];
    tone(note,.18,.012,'square',delay);tone(note*1.5,.16,.007,'triangle',delay);tone(root/2,.2,.016,'triangle',delay);
    if(step%2===0)tone(120,.11,.025,'sine',delay,42);
    if(step%4===2)tone(180,.09,.008,'triangle',delay,60);
    tone(6200,.035,.003,'square',delay,3200);
   }
  }
  if(kind===0)[261.6,329.6,392,523.2,392,329.6,440,523.2].forEach((n,i)=>tone(n,.75,.035,'sine',i*.38));
  if(kind===1){tone(110,3,.07);tone(165,3,.035);}
  if(kind===2){const buf=audio.createBuffer(1,Math.floor(audio.sampleRate*.32),audio.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.sin(i/d.length*Math.PI)*.11;const src=audio.createBufferSource(),filter=audio.createBiquadFilter();filter.type='bandpass';filter.frequency.value=1250;filter.Q.value=.7;src.buffer=buf;src.connect(filter);filter.connect(audio.destination);trackVoice(src,filter);src.start();tone(400,.22,.012,'triangle',0,1100);tone(130,1.7,.04,'sine',.15,60);}
  if(kind===3){tone(65,1.8,.13,'triangle',0,24);tone(100,1.2,.045,'sawtooth',0,25);}
  if(kind===4){tone(100,.7,.04,'triangle',0,50);tone(75,.7,.045,'triangle',.8,42);}
  if(kind===5)[130.8,196,261.6,329.6].forEach(n=>tone(n,2.5,.028));
 }
 function frame(now){if(!playing)return;if(last&&!document.hidden)elapsed+=Math.min((now-last)/1000,.1);last=now;
  draw(elapsed);  const phase=elapsed<6?0:elapsed<12?6:elapsed<17.3?1:elapsed<20?2:elapsed<21?3:elapsed<28?4:elapsed<32?5:7;
  if(phase!==cue){if(cue===6)stopVoices(rockVoices);cue=phase;soundCue(phase);}
  say(['Everyone had plans for an ordinary, wonderful day.','Upstairs, Coco catches something in the window…','Coco: “Gasp! What IS that?!”','A streak of light. A distant impact.','That is definitely not an ordinary meteor.','The neighborhood needs its heroes.',  'Connor, Coco, Peachy, Jason, Vito, Brie, Adam, Kate, Mark and Stephanie rock the living room!','Coco: "That flash sure was scary!" Find Connor in the next room.'][phase]);
  $('intro-progress').style.width=  clamp(elapsed/36)*100+'%';if(elapsed>=36)finish();else raf=requestAnimationFrame(frame);
 }
 function audioError(error){console.warn('Opening audio unavailable:',error);$('intro-sound').textContent='Sound unavailable';}
 function open(){stopVoices();active=true;playing=false;elapsed=0;last=0;cue=-1;overlay.hidden=false;app.inert=true;$('intro-curtain').hidden=false;$('intro-progress').style.width='0%';say('Something extraordinary is on its way.');document.dispatchEvent(new Event('v3-intro-start'));draw(0);$('intro-start').focus();}
 async function start(){if(playing||!ready)return;playing=true;$('intro-curtain').hidden=true;last=0;try{if(sound){const A=window.AudioContext||window.webkitAudioContext;if(!A)throw new Error('Web Audio is not supported');audio=audio||new A();await audio.resume();}}catch(error){audioError(error);}if(playing){raf=requestAnimationFrame(frame);$('intro-skip').focus();}}
 function finish(){playing=false;active=false;cancelAnimationFrame(raf);stopVoices();if(audio)audio.suspend().catch(audioError);overlay.hidden=true;app.inert=false;document.dispatchEvent(new Event('v3-intro-end'));document.getElementById('game').focus({preventScroll:true});}
 $('intro-start').onclick=start;$('intro-skip').onclick=finish;$('replay-intro').onclick=open;
 $('intro-sound').onclick=async()=>{sound=!sound;$('intro-sound').textContent=sound?'Sound on':'Sound off';$('intro-sound').setAttribute('aria-pressed',String(sound));if(!sound)stopVoices();if(sound&&active&&playing){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)throw new Error('Web Audio is not supported');audio=audio||new A();await audio.resume();if(sound&&active&&playing&&cue===6){stopVoices(rockVoices);soundCue(6);}}catch(error){audioError(error);}}else if(audio)audio.suspend().catch(audioError);};
 overlay.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();finish();}if(e.key==='Tab'){const buttons=[...overlay.querySelectorAll('button')].filter(b=>b.offsetParent!==null);const i=buttons.indexOf(document.activeElement),next=(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length;e.preventDefault();buttons[next].focus();}});
 document.addEventListener('visibilitychange',()=>{last=0;if(audio){if(document.hidden)audio.suspend().catch(audioError);else if(active&&playing&&sound)audio.resume().catch(audioError);}});
 window.V3_INTRO={get active(){return active;},get state(){return{active,playing,elapsed,ready,caption};}};open();
})();
