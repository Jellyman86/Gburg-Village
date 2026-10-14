// Music director: MP3 tracks from data/music.json plus the original synthesized themes, chosen by place and active character.
// Places: village, world, jet, hawaii, nyc (exploration) and battle, cafe, omen (cinematics). Preferences are device-local;
// shipped defaults live in data/music.json. Synth themes stay available as "Original" tracks (ids synth:<place>).
(() => {
 'use strict';
 const stage=document.getElementById('stage');
 if(!stage||document.getElementById('music-toggle'))return;
 const data=window.V8_MUSIC_DATA||{root:'assets/music/',tracks:{},characters:{},places:{},characterPlaces:[]};
 const PLACES=['village','world','jet','hawaii','nyc','battle','cafe','omen'];
 const SYNTH={village:'Village theme',battle:'Battle theme',cafe:'Café theme',omen:'Omen theme',jet:'Jet theme',hawaii:'Hawaii theme'};
 const FALLBACK={world:'village',nyc:'village'};
 const CHARACTER_PLACES=new Set(data.characterPlaces&&data.characterPlaces.length?data.characterPlaces:['village','world','nyc']);
 const PREFS_KEY='gburg-v8-music',LEGACY_KEY='village-music';
 const button=document.createElement('button');
 button.id='music-toggle';button.type='button';button.className='quiet';
 button.style.cssText='position:absolute;top:10px;right:10px;z-index:3;min-height:44px;padding:8px 12px;background:#17383bee;border-color:#d3b16d;font:12px system-ui;border-radius:6px;touch-action:manipulation';
 stage.append(button);
 const AudioContextClass=window.AudioContext||window.webkitAudioContext;

 // Preferences --------------------------------------------------------------------------------------------------
 // Music mode: 'off' | 'on' (place playlists only) | 'themed' (the active hero's theme where allowed).
 let enabled=true;
 const prefs={characterMusic:true,level:.5,places:{},characters:{}};
 try{enabled=localStorage.getItem(LEGACY_KEY)!=='off';}catch(_){}
 try{
  const saved=JSON.parse(localStorage.getItem(PREFS_KEY)||'{}');
  if(typeof saved.characterMusic==='boolean')prefs.characterMusic=saved.characterMusic;
  if(typeof saved.level==='number'&&saved.level>=0&&saved.level<=1)prefs.level=saved.level;
  if(saved.places&&typeof saved.places==='object')for(const [place,pick] of Object.entries(saved.places))if(PLACES.includes(place)&&typeof pick==='string')prefs.places[place]=pick;
  if(saved.characters&&typeof saved.characters==='object')for(const [id,pick] of Object.entries(saved.characters))if(pick===null||typeof pick==='string')prefs.characters[id]=pick;
 }catch(error){console.warn('Music preferences could not load; using defaults.',error);}
 function savePrefs(){try{localStorage.setItem(PREFS_KEY,JSON.stringify(prefs));localStorage.setItem(LEGACY_KEY,enabled?'on':'off');}catch(_){}}
 // Slider position -> gain. Hearing is logarithmic, so a power curve keeps the low end genuinely quiet; full slider is 80% gain.
 const gainFor=level=>Math.round(.8*Math.pow(Math.min(1,Math.max(0,level)),2.5)*1000)/1000;
 const volume=()=>gainFor(prefs.level);
 const musicMode=()=>!enabled?'off':prefs.characterMusic?'themed':'on';

 // Track catalogue -------------------------------------------------------------------------------------------------
 const isSynth=id=>typeof id==='string'&&id.startsWith('synth:');
 const exists=id=>isSynth(id)?!!SYNTH[id.slice(6)]:!!data.tracks[id];
 const titleOf=id=>!id?'Silence':isSynth(id)?'Original · '+SYNTH[id.slice(6)]:(data.tracks[id]?.title||id);
 const tracks=()=>[...Object.entries(data.tracks).map(([id,t])=>({id,title:t.title,kind:'file'})),...Object.keys(SYNTH).map(m=>({id:'synth:'+m,title:'Original · '+SYNTH[m],kind:'synth'}))];
 const synthFor=place=>'synth:'+(SYNTH[place]?place:(FALLBACK[place]||'village'));
 function playlist(place){
  let list=data.places[place]||[];
  if(!list.length&&FALLBACK[place])list=data.places[FALLBACK[place]]||[];
  return list.filter(exists).length?list.filter(exists):[synthFor(place)];
 }
 // Effective per-place choice: 'character' (theme of the active hero), '' (rotate the playlist) or a track id.
 function placePick(place){
  if(prefs.places[place]!==undefined)return prefs.places[place];
  return CHARACTER_PLACES.has(place)?'character':'';
 }
 function characterTheme(id){
  const pick=prefs.characters[id]!==undefined?prefs.characters[id]:data.characters[id];
  return pick&&exists(pick)?pick:null;
 }

 // Selection ----------------------------------------------------------------------------------------------------
 const rotation={};
 function wantedPlace(){
  if(window.V3_INTRO?.active||document.hidden)return null;
  const cinema=window.V5_CINEMA?.state;
  if(cinema?.waitingReturn)return null;
  if(cinema?.active||window.V5_CINEMA?.active)return cinema?.event==='gary'?'battle':cinema?.event==='banquet'?(cinema.music||'cafe'):'village';
  const game=window.GAME?.state;
  if(!game)return 'village';
  if(game.scene==='world')return game.travel?.flying?'jet':'world';
  if(game.scene==='nyc')return 'nyc';
  return window.SCENES[game.scene]?.music||'village';
 }
 function wanted(){
  const place=wantedPlace();
  if(!place)return null;
  const pick=placePick(place),hero=window.GAME?.state.player.id;
  if(pick==='character'&&prefs.characterMusic&&hero){const theme=characterTheme(hero);if(theme)return {place,track:theme,reason:'character',loop:true};}
  if(pick&&pick!=='character'&&exists(pick))return {place,track:pick,reason:'pick',loop:true};
  const list=playlist(place),index=(rotation[place]||0)%list.length;
  return {place,track:list[index],reason:list.length>1?'rotate':'place',loop:list.length<=1,list};
 }

 // Playback: one <audio> element for files (iOS unlocks it once), Web Audio for synthesized themes ------------------
 const audio=document.createElement('audio');audio.preload='auto';audio.setAttribute('aria-hidden','true');
 let context=null,gain=null,source=null,synthBuffer=null,synthStartedAt=0;
 const buffers={},positions={};
 let current=null,startCount=0,generation=0,fileStarted=false;
 function paint(){
  const playing=isPlaying();
  button.textContent=!enabled?'♫ Music: Off':playing?(prefs.characterMusic?'♫ Music: Themed':'♫ Music: On'):'♫ Tap for music';
  button.setAttribute('aria-pressed',String(enabled));
  button.setAttribute('aria-label',playing?'Turn background music off':!enabled?'Turn background music on':'Start background music');
  document.dispatchEvent(new CustomEvent('v8-music-change',{detail:state()}));
 }
 function isPlaying(){
  if(!current)return false;
  if(isSynth(current.track))return !!source&&context?.state==='running';
  return fileStarted&&!audio.paused&&!audio.ended&&audio.readyState>=2;
 }
 function compose(mode){
  const battle=mode==='battle',cafe=mode==='cafe',omen=mode==='omen',jet=mode==='jet',hawaii=mode==='hawaii',rate=22050,beat=60/(battle?164:cafe?116:omen?132:jet?138:hawaii?104:92),duration=16*4*beat;
  const result=context.createBuffer(1,Math.round(duration*rate),rate),data=result.getChannelData(0);
  function note(midi,at,length,volume,voice){
   const frequency=440*Math.pow(2,(midi-69)/12),start=Math.round(at*rate),count=Math.floor(length*rate);
   for(let i=0;i<count;i++){
    const t=i/rate,phase=2*Math.PI*frequency*t;
    const envelope=Math.min(1,t/.018)*Math.pow(1-i/count,2)*Math.exp(-t*(voice==='pad'?.3:2.4));
    const wave=Math.sin(phase)+(voice==='organ'?.38*Math.sin(phase*2)+.2*Math.sin(phase*4):voice==='brass'?.3*Math.sin(phase*3)+.12*Math.sin(phase*5):voice==='bell'?.24*Math.sin(phase*2):voice==='string'?.32*Math.sin(phase*2)*Math.exp(-t*8)+.16*Math.sin(phase*3)*Math.exp(-t*12):voice==='pluck'?.15*Math.sin(phase*3):0);
    data[(start+i)%data.length]+=wave*envelope*volume;
   }
  }
  const chords=jet?[[50,54,57,62],[45,49,52,57],[47,50,54,59],[43,47,50,55]]:hawaii?[[53,57,60,65],[58,62,65,69],[55,58,62,67],[48,52,55,60]]:omen?[[38,41,45,50],[34,38,41,46],[36,40,43,48],[33,37,40,45]]:cafe?[[48,52,55,57],[53,57,60,64],[50,53,57,60],[43,47,50,53]]:battle?[[41,44,48,53],[37,41,44,49],[39,43,46,51],[36,40,43,48]]:
   [[48,52,55,59],[43,47,50,57],[45,48,52,55],[41,45,48,52],[48,52,55,59],[43,47,50,57],[41,45,48,52],[43,47,50,55]];
  const melody=jet?[[74,78,81,86],[85,81,78,76],[78,81,83,86],[83,79,78,74],[81,86,90,88],[85,88,85,81],[83,86,85,81],[79,78,74,null],[86,90,93,90],[88,85,81,78],[83,86,90,88],[86,83,79,null],[81,86,88,90],[88,85,81,76],[83,81,79,78],[76,78,81,null]]:
   hawaii?[[77,81,84,null],[86,84,81,77],[79,82,86,84],[79,76,72,null],[81,84,89,84],[86,89,86,84],[82,79,77,74],[76,79,84,null],[84,81,77,81],[86,84,81,null],[79,82,86,89],[84,79,76,null],[81,84,89,88],[86,84,81,77],[79,77,74,77],[76,72,77,null]]:
   omen?Array.from({length:16},(_,bar)=>[[74,69,77,76],[70,65,74,73],[72,67,76,75],[69,64,73,72]][bar%4]):cafe?Array.from({length:16},(_,bar)=>[[72,76,79,81],[77,81,84,79],[74,77,81,79],[71,74,77,67]][bar%4]):battle?Array.from({length:16},(_,bar)=>[[65,68,72,75],[73,72,68,65],[67,70,74,77],[72,67,64,60]][bar%4]):
   [[76,79,83,79],[74,71,69,67],[72,76,79,76],[77,76,72,69],[79,83,84,83],[79,74,71,69],[77,76,72,76],[74,71,67,null],[76,79,83,86],[83,79,74,71],[72,76,81,79],[77,76,72,null],[79,83,84,79],[74,79,83,81],[77,76,72,69],[71,74,67,null]];
  function drum(at,snare){
   const start=Math.round(at*rate),count=Math.floor(rate*.16);
   for(let i=0;i<count;i++){const t=i/rate,noise=Math.sin(i*127.1)*Math.sin(i*311.7),wave=snare?noise:Math.sin(2*Math.PI*(90-240*t)*t);
    data[(start+i)%data.length]+=wave*Math.exp(-t*30)*(snare?.075:.14);}
  }
  for(let bar=0;bar<16;bar++){
   const chord=chords[bar%chords.length],at=bar*4*beat;
   chord.forEach(n=>note(n,at,4.5*beat,omen?.04:.055,omen?'organ':'pad'));
   note(chord[0]-12,at,2.7*beat,.12,'pad');
   [0,2,1,3,0,2,1,3].forEach((n,i)=>note(chord[n]+12,at+i*.5*beat,.85*beat,hawaii?.07:.095,hawaii?'string':'pluck'));
   melody[bar].forEach((n,i)=>{if(n!==null)note(n,at+i*beat,(battle||omen?.9:1.7)*beat,battle?.095:omen?.075:hawaii?.11:.13,omen?'organ':battle||jet?'brass':hawaii?'string':'bell');});
   if(battle||omen)for(let i=0;i<8;i++)drum(at+i*.5*beat,i%4===2);
   if(cafe){drum(at+beat,true);drum(at+3*beat,true);}
   if(jet){drum(at,false);drum(at+2*beat,false);}
   if(hawaii){note(chord[1]+12,at+.75*beat,.3*beat,.045,'string');note(chord[2]+12,at+2.75*beat,.3*beat,.045,'string');drum(at,false);}
  }
  return result;
 }
 function stop(){
  generation++;
  if(current){
   if(isSynth(current.track)){if(source){positions[current.track]=(context.currentTime-synthStartedAt+(positions[current.track]||0))%synthBuffer.duration;source.stop();source.disconnect();source=null;}}
   else{if(!audio.paused||fileStarted)positions[current.track]=audio.currentTime||0;audio.pause();fileStarted=false;}
   current=null;
  }
  paint();
 }
 async function ensureContext(){
  if(!AudioContextClass)return null;
  if(!context){context=new AudioContextClass();gain=context.createGain();gain.connect(context.destination);context.addEventListener('statechange',paint);}
  gain.gain.value=volume();
  // Resume inside the gesture; iOS may also require a started buffer.
  const resuming=context.resume();
  const unlock=context.createBufferSource();unlock.buffer=context.createBuffer(1,1,context.sampleRate);unlock.connect(context.destination);unlock.onended=()=>unlock.disconnect();unlock.start(0);
  await resuming;return context;
 }
 async function start(){
  const next=wanted();
  if(!next||!enabled)return;
  if(current&&current.track===next.track&&current.place===next.place&&isPlaying())return;
  if(current)stop();
  const token=++generation;
  try{
   if(isSynth(next.track)){
    if(!(await ensureContext()))return;
    if(token!==generation||!enabled)return;
    const mode=next.track.slice(6);
    synthBuffer=buffers[mode]||(buffers[mode]=compose(mode));
    source=context.createBufferSource();source.buffer=synthBuffer;source.loop=true;source.connect(gain);
    synthStartedAt=context.currentTime;source.start(0,positions[next.track]||0);
   }else{
    const track=data.tracks[next.track];
    const url=data.root+track.file+'?v='+track.hash.slice(0,10);
    if(!audio.src.endsWith(url))audio.src=url;
    audio.loop=next.loop;audio.volume=volume();
    const resume=positions[next.track]||0;
    const seek=()=>{try{if(resume>0&&Number.isFinite(audio.duration)&&resume<audio.duration-1)audio.currentTime=resume;}catch(_){}};
    if(audio.readyState>=1)seek();else audio.addEventListener('loadedmetadata',seek,{once:true});
    const playing=audio.play();
    fileStarted=true;
    if(playing)await playing;
    if(token!==generation||!enabled){return;}
   }
   current=next;startCount++;paint();
  }catch(error){
   fileStarted=false;current=null;
   if(error?.name!=='NotAllowedError')console.warn('Music could not start; tap the music button to retry.',error);
   paint();
  }
 }
 audio.addEventListener('ended',()=>{
  if(!current||current.loop)return;
  rotation[current.place]=((rotation[current.place]||0)+1)%(current.list?.length||1);
  positions[current.track]=0;current=null;fileStarted=false;start();
 });
 audio.addEventListener('error',()=>{if(current&&!isSynth(current.track)){console.warn('Music file failed to load: '+audio.src);current=null;fileStarted=false;paint();}});
 audio.addEventListener('playing',paint);audio.addEventListener('pause',paint);
 const sync=()=>{if(wantedPlace())start();else stop();};

 // Controls -------------------------------------------------------------------------------------------------------
 button.addEventListener('click',()=>{
  if(enabled&&isPlaying()){enabled=false;stop();}
  else{enabled=true;start();}
  savePrefs();paint();
 });
 function gesture(event){if(!button.contains(event.target)&&!event.repeat)start();}
 // Capture sees joystick touches even when their handlers prevent default.
 document.addEventListener('pointerdown',gesture,{passive:true,capture:true});
 document.addEventListener('touchend',gesture,{passive:true,capture:true});
 document.addEventListener('click',gesture,{passive:true,capture:true});
 document.addEventListener('keydown',gesture);
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden){stop();if(context)context.suspend().catch(error=>console.warn('Could not pause music:',error));}
  else if(enabled)start();
 });
 document.addEventListener('v3-intro-start',stop);
 document.addEventListener('v3-intro-end',start);
 for(const name of ['v5-cinema-start','v5-cinema-shot','v5-cinema-end','v8-travel-change','v8-character-change'])document.addEventListener(name,sync);
 window.addEventListener('pagehide',()=>{stop();if(context)context.suspend().catch(error=>console.warn('Could not suspend music:',error));});
 window.addEventListener('pageshow',()=>{if(enabled)start();});

 function state(){
  return {enabled,music:musicMode(),characterMusic:prefs.characterMusic,level:prefs.level,volume:volume(),mode:current?current.place:null,track:current?current.track:null,title:current?titleOf(current.track):null,reason:current?current.reason:null,playing:isPlaying(),startCount};
 }
 const api={
  get state(){return state();},
  get element(){return audio;},
  places:PLACES,
  placeLabels:{village:'Gburg Village',world:'World map',jet:'Jet',hawaii:'Hawaii',nyc:'New York',battle:'Boss battle (cutscene)',cafe:'Banquet (cutscene)',omen:'Meteor omen (cutscene)'},
  tracks,titleOf,playlist,placePick,
  defaultPlacePick:place=>CHARACTER_PLACES.has(place)?'character':'',
  characterTheme,
  defaultCharacterTheme:id=>data.characters[id]&&exists(data.characters[id])?data.characters[id]:null,
  setEnabled(value){enabled=!!value;if(enabled)start();else stop();savePrefs();paint();return enabled;},
  setCharacterMusic(value){prefs.characterMusic=!!value;savePrefs();sync();paint();return prefs.characterMusic;},
  // mode: 'off' | 'on' | 'themed'
  setMode(mode){
   if(!['off','on','themed'].includes(mode))throw new Error('Unknown music mode: '+mode);
   if(mode==='off'){enabled=false;stop();}else{prefs.characterMusic=mode==='themed';enabled=true;sync();}
   savePrefs();paint();return musicMode();
  },
  gainFor,
  // level: slider position 0..1 (perceptual curve); state.volume reports the resulting gain
  setVolume(level){prefs.level=Math.min(1,Math.max(0,Number(level)||0));audio.volume=volume();if(gain)gain.gain.value=volume();savePrefs();paint();return prefs.level;},
  // pick: 'character' | '' (rotate) | track id | undefined (restore shipped default)
  setPlacePick(place,pick){
   if(!PLACES.includes(place))throw new Error('Unknown music place: '+place);
   if(pick===undefined)delete prefs.places[place];else if(pick==='character'||pick===''||exists(pick))prefs.places[place]=pick;else throw new Error('Unknown track: '+pick);
   savePrefs();sync();paint();return placePick(place);
  },
  // pick: track id | null (no theme) | undefined (restore shipped default)
  setCharacterTheme(id,pick){
   if(pick===undefined)delete prefs.characters[id];else if(pick===null||exists(pick))prefs.characters[id]=pick;else throw new Error('Unknown track: '+pick);
   savePrefs();sync();paint();return characterTheme(id);
  },
  skip(){if(current&&current.list&&current.list.length>1){rotation[current.place]=((rotation[current.place]||0)+1)%current.list.length;positions[current.track]=0;stop();start();}},
  sync
 };
 window.V8_MUSIC=api;
 window.V5_MUSIC={get state(){return state();}};
 paint();
})();
