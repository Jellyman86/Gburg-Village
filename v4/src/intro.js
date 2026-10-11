// V3 cinematic: local canvas animation, shared art, no video download.
(() => {
 'use strict';
 const app=document.querySelector('.app'),overlay=document.createElement('section');
 overlay.id='meteor-intro';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Meteor Night opening movie');
 overlay.innerHTML='<div class="intro-top"><span>FAMILY WALK / CHAPTER ONE</span><button id="intro-skip">Skip to game</button></div><div class="intro-screen"><canvas id="intro-film" width="960" height="540" aria-label="Animated story: a happy town, Coco spots a meteor through her window, and dinosaurs emerge from its crater."></canvas><div id="intro-curtain"><p class="intro-kicker">A PERFECT DAY. AN IMPOSSIBLE NIGHT.</p><h2>METEOR<br><em>NIGHT</em></h2><p>A Family Walk adventure</p><button id="intro-start">Play the opening</button><small>Animated story · 29 seconds · sound optional</small></div></div><div class="intro-bottom"><p id="intro-caption" aria-live="polite">Something extraordinary is on its way.</p><button id="intro-sound" aria-pressed="true">Sound on</button><div class="intro-track"><i id="intro-progress"></i></div></div>';
 document.body.append(overlay);
 const $=id=>document.getElementById(id),c=$('intro-film').getContext('2d'),images={},sheets={};
 let active=true,playing=false,elapsed=0,last=0,raf=0,audio=null,sound=true,cue=-1,caption='',ready=false;
 $('intro-start').disabled=true;$('intro-start').textContent='Getting the town ready…';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const assets={plaza:'../assets/scene/neighborhood.png',district:'../v2/assets/district.webp',recreation:'../v2/assets/recreation.webp',north:'../v3/assets/north-market.png',room:'../v3/assets/window-room.png',crater:'../v3/assets/meteor-crater.png'};
 assets.plaza=window.TOWN.image;
 const load=src=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=src;});
 Promise.all([...Object.entries(assets).map(async([id,url])=>images[id]=await load(url)),...Object.entries(CHARACTERS).map(async([id,v])=>sheets[id]=await load(v.sheet))]).then(()=>{ready=true;$('intro-start').disabled=false;$('intro-start').textContent='Play the opening';draw(0);});
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
 function rect(color,x,y,w,h){c.fillStyle=color;c.fillRect(x,y,w,h);}
 function oval(color,x,y,rx,ry){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
 function text(str,x,y,size=24,color='#fff5d6'){c.fillStyle=color;c.font=`${size>=30?'bold ':''}${size}px Georgia`;c.textAlign='center';c.fillText(str,x,y);}
 function actor(id,x,y,scale=1,dir='down',walk=true,t=elapsed){const img=sheets[id];if(!img)return;c.save();c.imageSmoothingEnabled=false;c.translate(x,y);c.scale(scale,scale);const frame=walk?Math.floor(t*7)%4:1;oval('#152a3544',0,0,13,4);c.drawImage(img,frame*64,CHARACTERS[id].rows[dir]*64,64,64,-32,-60,64,64);c.restore();}
 function background(id,x,y,zoom=1){const im=images[id];rect('#183e48',0,0,960,540);if(!im)return;c.save();c.scale(zoom,zoom);const scene=SCENES[id];c.drawImage(im,-x,-y,scene.width,scene.height);c.restore();}
 function dino(x,y,scale,t,color='#7caf58'){c.save();c.translate(x,y);c.scale(scale,scale);const b=Math.sin(t*10)*2;oval('#05172277',0,0,23,6);rect('#213d37',-16,-30+b,27,28);rect(color,-13,-28+b,23,23);rect(color,3,-49+b,27,25);rect('#d8e894',7,-48+b,19,5);rect(color,-34,-15+b,25,8);rect(color,-39,-21+b,10,9);rect('#fff5d5',15,-44+b,7,7);rect('#172933',19,-44+b,3,5);rect('#233c37',17,-29+b,15,3);rect('#c8eaa0',3,-22+b,7,18);rect(color,6,-4,9,7+Math.sin(t*9)*2);rect('#527d46',-12,-4,8,7-Math.sin(t*9)*2);c.restore();}
 function happy(t){
  const shot=Math.floor(t/3),u=t%3;
  if(shot===0){background('plaza',405+u*22,490,1.23);for(const [i,id] of ['jason','peachy','connor','coco'].entries())actor(id,220+i*125+u*24,350+i%2*22,1.45,'right',true,t+i);text('JUST ANOTHER PERFECT DAY',480,104,22);}
  else if(shot===1){background('recreation',150,250+u*14,.98);actor('adam',155+Math.sin(t)*25,260,1.3,'right');actor('kate',365,263+Math.sin(t)*10,1.3,'left');actor('coco',590+Math.sin(t*2)*22,220,1.25);actor('peachy',700,235,1.3,'left',false);oval('#f5f084',270+Math.sin(u*3)*90,200-Math.abs(Math.sin(u*3))*60,5,5);text('A LITTLE PLAY. A LOT OF LAUGHTER.',480,105,22);}
  else{background('north',287,55,.98);for(const [i,id] of ['stephanie','mark','brie','vito','connor'].entries())actor(id,150+i*150+Math.sin(t+i)*12,370+i%2*25,1.4,i%2?'left':'right');text('HOME BEFORE THE STARS COME OUT.',480,100,22);}
  // Warm sunlight and gently floating motes.
  c.fillStyle='#ffe5a30e';c.fillRect(0,0,960,540);for(let i=0;i<18;i++){c.globalAlpha=.3;oval('#fff5c2',(i*73+t*9)%960,(i*41+t*4)%470,1.5,1.5);}c.globalAlpha=1;
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
  for(let i=0;i<3;i++){const p=smooth((t-i*.75-.4)/2.5);if(p<=0)continue;dino(cx+(i-1)*p*143,cy+15+p*(80-i*28),.3+p*1.25,t+i,['#83bc63','#77b8bb','#c5a267'][i]);}
  for(let i=0;i<22;i++){const p=(t*.25+i/22)%1;rect(i%2?'#ffc471':'#ef8953',cx-80+(i*61)%160+Math.sin(i+t)*9,cy+25-p*130,2,3);}
  c.restore();
 }
 function draw(t){
  c.clearRect(0,0,960,540);c.imageSmoothingEnabled=false;
  if(t<9)happy(t);else if(t<17)room(t-9);else if(t<18){room(7.95);c.globalAlpha=reduced?.25:Math.sin((t-17)*Math.PI)*.9;rect('#fff2d3',0,0,960,540);c.globalAlpha=1;}else crater(t-18);
  const vignette=c.createRadialGradient(480,270,180,480,270,570);vignette.addColorStop(0,'#0000');vignette.addColorStop(1,'#0715229c');c.fillStyle=vignette;c.fillRect(0,0,960,540);
  rect('#071019',0,0,960,34);rect('#071019',0,506,960,34);
  if(t>=25){c.globalAlpha=smooth((t-25)/1.4);rect('#08131bb8',0,0,960,540);text('FAMILY WALK',480,186,25,'#e7c789');text('METEOR NIGHT',480,273,70);text('Small town. Big prehistoric problem.',480,326,24);c.globalAlpha=1;}
 }
 function say(s){if(s===caption)return;caption=s;$('intro-caption').textContent=s;}
 function soundCue(kind){if(!sound||!audio||audio.state!=='running')return;const at=audio.currentTime;
  function tone(hz,duration,volume,type='sine',delay=0,end=hz){const osc=audio.createOscillator(),g=audio.createGain();osc.type=type;osc.frequency.setValueAtTime(hz,at+delay);osc.frequency.exponentialRampToValueAtTime(Math.max(20,end),at+delay+duration);g.gain.setValueAtTime(.001,at+delay);g.gain.linearRampToValueAtTime(volume,at+delay+.03);g.gain.exponentialRampToValueAtTime(.001,at+delay+duration);osc.connect(g);g.connect(audio.destination);osc.start(at+delay);osc.stop(at+delay+duration+.01);osc.onended=()=>{osc.disconnect();g.disconnect();};}
  if(kind===0)[261.6,329.6,392,523.2,392,329.6,440,523.2].forEach((n,i)=>tone(n,.75,.035,'sine',i*.38));
  if(kind===1){tone(110,3,.07);tone(165,3,.035);}
  if(kind===2){const buf=audio.createBuffer(1,Math.floor(audio.sampleRate*.32),audio.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.sin(i/d.length*Math.PI)*.11;const src=audio.createBufferSource(),filter=audio.createBiquadFilter();filter.type='bandpass';filter.frequency.value=1250;filter.Q.value=.7;src.buffer=buf;src.connect(filter);filter.connect(audio.destination);src.start();src.onended=()=>{src.disconnect();filter.disconnect();};tone(400,.22,.012,'triangle',0,1100);tone(130,1.7,.04,'sine',.15,60);}
  if(kind===3){tone(65,1.8,.13,'triangle',0,24);tone(100,1.2,.045,'sawtooth',0,25);}
  if(kind===4){tone(100,.7,.04,'triangle',0,50);tone(75,.7,.045,'triangle',.8,42);}
  if(kind===5)[130.8,196,261.6,329.6].forEach(n=>tone(n,2.5,.028));
 }
 function frame(now){if(!playing)return;if(last&&!document.hidden)elapsed+=Math.min((now-last)/1000,.1);last=now;
  draw(elapsed);const phase=elapsed<9?0:elapsed<14.3?1:elapsed<17?2:elapsed<18?3:elapsed<25?4:5;
  if(phase!==cue){cue=phase;soundCue(phase);}
  say(['Everyone had plans for an ordinary, wonderful day.','Upstairs, Coco catches something in the window…','Coco: “Gasp! What IS that?!”','A streak of light. A distant impact.','That is definitely not an ordinary meteor.','The neighborhood needs its heroes.'][phase]);
  $('intro-progress').style.width=clamp(elapsed/29)*100+'%';if(elapsed>=29)finish();else raf=requestAnimationFrame(frame);
 }
 function open(){active=true;playing=false;elapsed=0;last=0;cue=-1;overlay.hidden=false;app.inert=true;$('intro-curtain').hidden=false;$('intro-progress').style.width='0%';say('Something extraordinary is on its way.');document.dispatchEvent(new Event('v3-intro-start'));draw(0);$('intro-start').focus();}
 async function start(){if(playing||!ready)return;playing=true;$('intro-curtain').hidden=true;last=0;try{if(sound){const A=window.AudioContext||window.webkitAudioContext;if(A){audio=audio||new A();await audio.resume();}}}catch{}if(playing){raf=requestAnimationFrame(frame);$('intro-skip').focus();}}
 function finish(){playing=false;active=false;cancelAnimationFrame(raf);if(audio)audio.suspend().catch(()=>{});overlay.hidden=true;app.inert=false;document.dispatchEvent(new Event('v3-intro-end'));document.getElementById('game').focus({preventScroll:true});}
 $('intro-start').onclick=start;$('intro-skip').onclick=finish;$('replay-intro').onclick=open;
 $('intro-sound').onclick=()=>{sound=!sound;$('intro-sound').textContent=sound?'Sound on':'Sound off';$('intro-sound').setAttribute('aria-pressed',String(sound));if(audio)(sound?audio.resume():audio.suspend()).catch(()=>{});};
 overlay.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();finish();}if(e.key==='Tab'){const buttons=[...overlay.querySelectorAll('button')].filter(b=>b.offsetParent!==null);const i=buttons.indexOf(document.activeElement),next=(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length;e.preventDefault();buttons[next].focus();}});
 document.addEventListener('visibilitychange',()=>{last=0;if(audio){if(document.hidden)audio.suspend().catch(()=>{});else if(active&&playing&&sound)audio.resume().catch(()=>{});}});
 window.V3_INTRO={get active(){return active;},get state(){return{active,playing,elapsed,ready,caption};}};open();
})();
