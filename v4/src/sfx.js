(() => {
 'use strict';
 const button=document.createElement('button');button.id='sfx-toggle';button.type='button';button.className='quiet';
 document.querySelector('#world-actions .world-buttons').append(button);
 let enabled=true,audio=null;const last={},voices=new Set();
 function stop(){for(const voice of voices){voice.stop();voice.disconnect();}voices.clear();}
 function paint(){button.textContent='Sound effects: '+(enabled?'On':'Off');button.setAttribute('aria-pressed',String(enabled));}
 const effects={select:[[660,.06,.012]],power:[[230,.1,.02,500]],hit:[[880,.1,.018]],door:[[220,.08,.015],[330,.08,.012]],
  pickup:[[523,.1,.02],[659,.1,.02],[784,.15,.02]],join:[[392,.12,.02],[523,.12,.02],[659,.2,.018]],
  dogs:[[180,.06,.016,270],[160,.08,.014,240]],lift:[[150,.3,.018,900]],land:[[320,.18,.02,110],[220,.12,.012,440]],
  screech:[[1500,.34,.015,520,'sawtooth'],[950,.23,.012,1800,'sawtooth'],[1900,.18,.009,450,'triangle']]};
 async function play(kind){
  if(!enabled||document.hidden||window.V3_INTRO?.active)return false;
  const now=performance.now();if(now-(last[kind]||-1000)<180)return false;last[kind]=now;
  try{
   const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new Error('Web Audio is not supported');
   audio=audio||new Audio();await audio.resume();if(!enabled||document.hidden||window.V3_INTRO?.active)return false;
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
 window.V4_SFX={play,get enabled(){return enabled;}};paint();
})();
