// Run with: node tools/check_powers.cjs (no browser dependency).
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/powers.js'),'utf8'),context);
const {create,definitions}=context.window.FAMILY_POWERS;
const actor=(id,direction='right')=>({id,x:0,y:0,direction});
assert.equal(Object.keys(definitions).length,10);
for(const [id,power] of Object.entries(definitions)){
 const p=create({blocked:()=>false,getTarget:()=>null,onHit:()=>{}});
 assert(p.activate(actor(id)));assert(!p.activate(actor(id)),'immediate duplicate rejected');
 p.update(power.cooldown+.001);assert(p.activate(actor(id)),id+' can cast after short cooldown');
 assert(p.activate(actor(id==='coco'?'connor':'coco')),'independent character cooldown');
 p.update(3);assert.equal(p.state.casts.length,0,'effects expire');assert(!p.activate(actor('unassigned')));
 if(power.speed)for(const [direction,axis,sign] of [['right','x',1],['left','x',-1],['down','y',1],['up','y',-1]]){
  const shot=create({blocked:()=>false,getTarget:()=>null,onHit:()=>{}});shot.activate(actor(id,direction));shot.update(.4);assert(shot.state.casts[0][axis]*sign>50,id+' aims '+direction);
  let hits=0;const wall=create({blocked:x=>x>=30,getTarget:()=>({x:70,y:0}),onHit:()=>hits++});wall.activate(actor(id));wall.update(.8);assert.equal(hits,0);assert(wall.state.casts[0].x<30,'no scenery tunneling');
  const hit=create({blocked:()=>false,getTarget:()=>({x:70,y:0}),onHit:()=>hits++});hit.activate(actor(id));hit.update(.6);hit.update(.1);assert.equal(hits,1,'one hit per projectile');
 }
}
for(const id of ['jason','adam','peachy','vito']){
 let hits=0;const p=create({blocked:()=>false,getTarget:()=>({x:30,y:0}),onHit:()=>hits++});p.activate(actor(id));p.update(.1);p.update(.1);assert.equal(hits,1,id+' hits once');
 const back=create({blocked:()=>false,getTarget:()=>({x:-30,y:0}),onHit:()=>hits++});back.activate(actor(id));back.update(.1);assert.equal(hits,['peachy','vito'].includes(id)?2:1,id+' facing/radial range');
}
let hits=0;const cry=create({blocked:()=>false,getTarget:()=>({x:80,y:0}),onHit:()=>hits++});cry.activate(actor('coco'));cry.update(.2);assert.equal(hits,0);cry.update(.6);cry.update(.3);assert.equal(hits,1,'one hit for all rings');
const distant=create({blocked:()=>false,getTarget:()=>({x:200,y:0}),onHit:()=>hits++});distant.activate(actor('coco'));distant.update(1);assert.equal(hits,1,'limited shockwave range');
const rapid=create({blocked:()=>false,getTarget:()=>null,onHit:()=>{}});for(let i=0;i<100;i++){for(const id of Object.keys(definitions))rapid.activate(actor(id));rapid.update(.1);}assert(rapid.state.casts.length<25,'rapid casts stay bounded');rapid.update(3);assert.equal(rapid.state.casts.length,0);
console.log('Ten powers: rapid/independent cooldowns, four-direction projectiles, terrain collision, melee facing, radial hits, wave timing, one-hit reactions and effect cleanup passed');
