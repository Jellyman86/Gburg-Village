(() => {
 'use strict';
 const button=document.createElement('button');button.id='sfx-toggle';button.type='button';button.className='quiet';
 document.querySelector('#world-actions .world-buttons').append(button);
 let enabled=true,audio=null,generation=0;const last={},voices=new Set();
 function stop(){generation++;for(const voice of voices){voice.stop();voice.disconnect();}voices.clear();}
 function paint(){button.textContent='Sound effects: '+(enabled?'On':'Off');button.setAttribute('aria-pressed',String(enabled));}
 const effects={select:[[660,.06,.012]],power:[[230,.1,.02,500]],hit:[[880,.1,.018]],door:[[220,.08,.015],[330,.08,.012]],
  pickup:[[523,.1,.02],[659,.1,.02],[784,.15,.02]],join:[[392,.12,.02],[523,.12,.02],[659,.2,.018]],
  dogs:[[180,.06,.016,270],[160,.08,.014,240]],lift:[[150,.3,.018,900]],land:[[320,.18,.02,110],[220,.12,.012,440]],
  rumble:[[65,.5,.022,45]],roar:[[130,.45,.026,45],[80,.4,.018,55]],
  scream:[[523,.16,.018,880],[659,.16,.016,988]],splash:[[440,.12,.018,70]],
  throw:[[160,.22,.02,900]],impact:[[120,.14,.022,40]],
  meteor:[[420,.7,.018,60,'sawtooth'],[95,.35,.022,35]],
  radio:[[3200,.12,.004,2800,'sawtooth'],[2400,.09,.004,3300,'sawtooth']],
  screech:[[1500,.34,.015,520,'sawtooth'],[950,.23,.012,1800,'sawtooth'],[1900,.18,.009,450,'triangle']],
  'hurt-trex':[[105,.18,.023,42,'sawtooth'],[65,.13,.018,40]],
  'hurt-raptor':[[620,.13,.018,180,'sawtooth'],[330,.08,.012,210]],
  'hurt-triceratops':[[145,.16,.022,55],[90,.12,.014,60]],
  'hurt-pterodactyl':[[1350,.14,.013,640,'sawtooth']],
  'hurt-compy':[[920,.08,.012,1560],[1180,.07,.01,720]],
  'hurt-dilophosaurus':[[740,.16,.016,230,'sawtooth'],[420,.1,.012,160]],
  'hurt-ankylosaurus':[[85,.21,.023,45],[175,.15,.013,65]],
  'player-hurt':[[360,.1,.023,120,'square'],[170,.12,.014,80]],
  faint:[[330,.15,.018,220],[220,.18,.017,110],[110,.22,.016,55]],
  recover:[[392,.12,.02],[523,.12,.02],[784,.2,.016]],
  strike:[[150,.08,.024,55,'square']],slash:[[1050,.11,.012,240,'sawtooth']],
  wave:[[400,.19,.012,900]],swirl:[[300,.22,.012,1100]],
  blast:[[100,.14,.019,900,'sawtooth']],explode:[[120,.22,.025,38,'sawtooth'],[65,.18,.017,35]],
  spit:[[580,.12,.012,160]],'dog-bite':[[190,.09,.018,85,'square']],
  puff:[[220,.12,.015,65]],retreat:[[160,.24,.017,80]],whip:[[700,.09,.014,120,'sawtooth']]};
 async function play(kind){
  if(!enabled||document.hidden||window.V3_INTRO?.active)return false;
  const now=performance.now();if(now-(last[kind]||-1000)<180)return false;last[kind]=now;
  try{
   const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new Error('Web Audio is not supported');
   const requestGeneration=generation;
   audio=audio||new Audio();await audio.resume();if(requestGeneration!==generation||!enabled||document.hidden||window.V3_INTRO?.active)return false;
   if(!effects[kind])throw new Error('Unknown sound effect: '+kind);
   effects[kind].forEach(([hz,duration,volume,end=hz,wave='triangle'],i)=>{
    const at=audio.currentTime+i*.1,osc=audio.createOscillator(),gain=audio.createGain();osc.type=wave;
    osc.frequency.setValueAtTime(hz,at);osc.frequency.exponentialRampToValueAtTime(end,at+duration);
    gain.gain.setValueAtTime(.001,at);gain.gain.linearRampToValueAtTime(volume,at+.01);gain.gain.exponentialRampToValueAtTime(.001,at+duration);
    osc.connect(gain);gain.connect(audio.destination);voices.add(osc);osc.start(at);osc.stop(at+duration);osc.onended=()=>{voices.delete(osc);osc.disconnect();gain.disconnect();};
   });return true;
  }catch(error){console.warn('Sound effects unavailable:',error);button.textContent='Sound effects unavailable';return false;}
 }
 function suspend(){stop();if(audio)audio.suspend().catch(error=>console.warn('Could not pause sound effects:',error));}
 button.onclick=()=>{enabled=!enabled;paint();if(!enabled)suspend();};
 document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();});
 document.addEventListener('v3-intro-start',suspend);
 document.addEventListener('v5-cinema-start',stop);
 document.addEventListener('v5-cinema-end',stop);
 window.V4_SFX={play,get enabled(){return enabled;}};paint();
})();
