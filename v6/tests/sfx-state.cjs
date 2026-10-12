const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const listeners={},oscillators=[],button={setAttribute(){},textContent:''};
let releaseResume,time=1000,waitForResume=true;
const parameter=()=>({values:[],setValueAtTime(value){this.values.push(value);},exponentialRampToValueAtTime(value){this.values.push(value);},linearRampToValueAtTime(value){this.values.push(value);}});
class Audio{
 constructor(){this.currentTime=0;this.destination={};}
 resume(){return waitForResume?new Promise(resolve=>{releaseResume=resolve;}):Promise.resolve();}
 suspend(){return Promise.resolve();}
 createOscillator(){const oscillator={frequency:parameter(),connect(){},disconnect(){},start(at){this.started=at;},stop(){this.stopped=true;}};oscillators.push(oscillator);return oscillator;}
 createGain(){return {gain:parameter(),connect(){},disconnect(){}};}
}
const context={console,performance:{now:()=>time},AudioContext:Audio,document:{hidden:false,createElement:()=>button,querySelector:()=>({append(){}}),addEventListener:(type,handler)=>{listeners[type]=handler;}}};
context.window=context;vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','src','sfx.js'),'utf8'),context);
(async()=>{
 const pending=context.V4_SFX.play('roar');listeners['v5-cinema-end']();releaseResume();
 assert.equal(await pending,false);assert.equal(oscillators.length,0,'Skipped scene cannot emit queued audio after its resume resolves');
 waitForResume=false;time+=300;
 assert.equal(await context.V4_SFX.play('screech'),true);assert.equal(oscillators.length,3);
 assert.deepEqual(oscillators.map(oscillator=>oscillator.type),['sawtooth','sawtooth','triangle']);
 assert.deepEqual(oscillators.map(oscillator=>oscillator.frequency.values),[[1500,520],[950,1800],[1900,450]]);
 listeners['v5-cinema-end']();assert.equal(oscillators.every(oscillator=>oscillator.stopped),true);
 const signatures=[];
 for(const kind of ['compy','raptor','trex','triceratops','pterodactyl']){
  const before=oscillators.length;time+=300;
  assert.equal(await context.V4_SFX.play('hurt-'+kind),true);
  const voices=oscillators.slice(before);assert(voices.length>0,'Species creates actual oscillator voices');
  signatures.push(JSON.stringify(voices.map(v=>({wave:v.type,pitches:v.frequency.values}))));
 }
 assert.equal(new Set(signatures).size,5,'Every species has a distinct synthesized hurt sound');
 button.onclick();time+=300;assert.equal(await context.V4_SFX.play('screech'),false);
 button.onclick();context.document.hidden=true;time+=300;assert.equal(await context.V4_SFX.play('screech'),false);
 console.log(JSON.stringify({sfxState:'passed',checks:['recognizable original pitch sweeps','five distinct actual species oscillator profiles','cinematic end cancels queued resume','mute and hidden suppression','voice cleanup']}));
})().catch(error=>{console.error(error);process.exitCode=1;});
