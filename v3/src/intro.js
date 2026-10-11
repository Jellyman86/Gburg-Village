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
 const assets={plaza:'../assets/scene/neighborhood.png',district:'../v2/assets/district.webp',recreation:'../v2/assets/recreation.webp'};
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
  else{background('district',40+u*30,10,1.05);for(const [i,id] of ['stephanie','mark','brie','vito','connor'].entries())actor(id,150+i*150+Math.sin(t+i)*12,370+i%2*25,1.4,i%2?'left':'right');text('HOME BEFORE THE STARS COME OUT.',480,100,22);}
  // Warm sunlight and gently floating motes.
  c.fillStyle='#ffe5a30e';c.fillRect(0,0,960,540);for(let i=0;i<18;i++){c.globalAlpha=.3;oval('#fff5c2',(i*73+t*9)%960,(i*41+t*4)%470,1.5,1.5);}c.globalAlpha=1;
 }
 function windowShape(){c.beginPath();c.moveTo(570,422);c.lineTo(570,170);c.bezierCurveTo(570,45,820,45,820,170);c.lineTo(820,422);c.closePath();}
 function room(t){
  // Arched window, dark full-length mirror and stair rail match the reference layout.
  const z=1+(reduced?0:.06*smooth(t/8));c.save();c.translate(480,270);c.scale(z,z);c.translate(-480,-270);
  const g=c.createLinearGradient(0,0,960,540);g.addColorStop(0,'#d7c4a0');g.addColorStop(1,'#998970');c.fillStyle=g;c.fillRect(0,0,960,540);
  c.fillStyle='#a69883';c.beginPath();c.moveTo(0,416);c.lineTo(960,410);c.lineTo(960,540);c.lineTo(0,540);c.fill();rect('#e8dfcb',0,408,960,10);
  for(let i=0;i<100;i++)rect(i%2?'#b1a58d':'#8e857644',(i*97)%960,425+(i*31)%110,3,2);
  c.save();windowShape();c.clip();const sky=c.createLinearGradient(0,55,0,430);sky.addColorStop(0,'#122d4c');sky.addColorStop(1,'#527b87');c.fillStyle=sky;c.fillRect(560,45,270,390);
  for(let i=0;i<25;i++)oval('#f6ead0',580+(i*71)%235,83+(i*31)%170,1,1);
  rect('#213b47',570,324,250,97);rect('#67717a',615,303,95,92);c.fillStyle='#273d50';c.beginPath();c.moveTo(605,303);c.lineTo(661,271);c.lineTo(723,303);c.fill();for(let i=0;i<3;i++)rect('#efd295',628+i*26,325,11,15);rect('#83959b',568,395,252,17);
  if(t>2.8){const p=clamp((t-2.8)/4.5),x=785-p*139,y=108+p*155,r=3+p*9;const trail=c.createLinearGradient(x,y,x+100,y-80);trail.addColorStop(0,'#ffb969');trail.addColorStop(1,'#ffba5700');c.strokeStyle=trail;c.lineWidth=5+p*11;c.beginPath();c.moveTo(x,y);c.lineTo(x+105,y-86);c.stroke();oval('#ffdf9c',x,y,r,r);oval('#fff9e0',x-1,y-1,r*.55,r*.55);}
  c.restore();windowShape();c.strokeStyle='#f3eee0';c.lineWidth=12;c.stroke();rect('#efe9dc',563,184,264,8);rect('#eae6d8',692,78,6,344);rect('#eae6d8',570,275,250,6);rect('#eae6d8',570,347,250,6);rect('#fff8e8',555,422,279,13);
  c.strokeStyle='#eae6d8';c.lineWidth=5;c.beginPath();c.moveTo(695,183);c.lineTo(608,99);c.moveTo(695,183);c.lineTo(782,99);c.stroke();
  // Mirror: reflection stays clipped within its black rounded frame.
  c.save();c.translate(200,265);c.rotate(-.045);c.beginPath();c.roundRect(-80,-196,160,411,[75,75,5,5]);c.fillStyle='#121c21';c.fill();c.beginPath();c.roundRect(-72,-188,144,393,[68,68,3,3]);c.clip();const mirror=c.createLinearGradient(-72,0,70,0);mirror.addColorStop(0,'#869a9b');mirror.addColorStop(.5,'#b8c2b5');mirror.addColorStop(1,'#647a80');c.fillStyle=mirror;c.fillRect(-80,-196,160,411);rect('#d6e4db55',-60,-180,12,360);actor('coco',5,170,2.7,t>5.3?'right':'down',t<1.2,t);c.restore();
  const turn=t>5.3;actor('coco',365,447-(turn?Math.sin(clamp((t-5.3)*3)*Math.PI)*7:0),3.4,turn?'right':'left',t<1.2,t);
  if(turn){oval('#fff7dd',417,256,33,27);text('!',417,268,35,'#703d37');}
  // The stair banister and familiar seasonal sill decorations.
  rect('#f0eadb',868,362,92,178);c.save();c.translate(859,369);c.rotate(.2);rect('#805030',-5,0,118,14);rect('#b67b45',-5,0,118,5);c.restore();
  oval('#eee4ce',776,409,13,13);oval('#f5ead8',776,391,11,12);rect('#926d35',774,376,4,7);oval('#f1eee6',601,409,12,13);rect('#1b2931',592,400,18,4);c.fillStyle='#1b2931';c.beginPath();c.moveTo(589,395);c.lineTo(600,377);c.lineTo(612,395);c.fill();
  if(t>6.3){c.globalAlpha=clamp((t-6.3)/1.7)*.38;rect('#ffeab8',0,0,960,540);c.globalAlpha=1;}
  c.restore();
 }
 function crater(t){
  background('district',730,420,1.12);c.fillStyle='#1521368c';c.fillRect(0,0,960,540);
  const shake=reduced?0:Math.max(0,1-t)*8;c.save();c.translate(Math.sin(t*65)*shake,Math.cos(t*41)*shake);
  for(let i=0;i<9;i++){const a=i*Math.PI*2/9;c.strokeStyle='#1d2029';c.lineWidth=4;c.beginPath();c.moveTo(490+Math.cos(a)*120,348+Math.sin(a)*45);for(let k=1;k<=4;k++)c.lineTo(490+Math.cos(a)*(120+k*24)+Math.sin(k*4)*13,348+Math.sin(a)*(45+k*12));c.stroke();}
  for(let i=0;i<17;i++){const a=i*2.4,r=105+i%5*21,x=490+Math.cos(a)*r,y=345+Math.sin(a)*r*.4;c.save();c.translate(x,y);c.rotate(a);rect('#665447',-16,-8,32,16);rect('#a47c4f',-14,-8,28,4);c.restore();}
  oval('#332c31',490,348,155,67);oval('#100f23',490,349,128,48);oval('#c4714555',490,348,102,30);oval('#ffbd6155',490,352,64,15);
  for(let i=0;i<12;i++){const p=(t*.16+i/12)%1;oval('#a59a9166',400+i*17+Math.sin(i+t)*20,335-p*240,15+p*24,10+p*17);}
  for(let i=0;i<3;i++){const p=smooth((t-i*.75-.4)/2.5);if(p<=0)continue;dino(458+(i-1)*p*143,347+p*(80-i*28),.3+p*1.25,t+i,['#83bc63','#77b8bb','#c5a267'][i]);}
  for(let i=0;i<26;i++){const p=(t*.25+i/26)%1;oval(i%2?'#ffc471':'#ef8953',375+(i*61)%242+Math.sin(i+t)*9,360-p*160,1.5,2.5);}
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
