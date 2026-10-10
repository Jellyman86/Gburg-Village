// Run with: node tools/check_powers.cjs (no browser dependency).
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/powers.js'),'utf8'),context);
const create=context.window.FAMILY_POWERS.create;
const actor=(id,direction='right')=>({id,x:0,y:0,direction});
for(const [direction,axis,sign] of [['right','x',1],['left','x',-1],['down','y',1],['up','y',-1]]){
 const powers=create({blocked:()=>false,getTarget:()=>null,onHit:()=>{}});
 assert(powers.activate(actor('connor',direction)));powers.update(.5);
 assert(powers.state.casts[0][axis]*sign>80,`throw follows ${direction}`);
 assert(!powers.activate(actor('connor')),'cooldown prevents spam');
 assert(powers.activate(actor('coco')),'another character has a separate cooldown');
 powers.update(3);assert.equal(powers.state.casts.length,0);assert(powers.activate(actor('connor')));
 assert(!powers.activate(actor('jason')),'unassigned characters do not cast');
}
let hits=0;
const wall=create({blocked:x=>x>=30,getTarget:()=>({x:70,y:0}),onHit:()=>hits++});
wall.activate(actor('connor'));wall.update(.9);assert.equal(hits,0);assert(wall.state.casts[0].x<30,'football cannot tunnel through scenery');
const ball=create({blocked:()=>false,getTarget:()=>({x:70,y:0}),onHit:()=>hits++});
ball.activate(actor('connor'));ball.update(.9);ball.update(.2);assert.equal(hits,1,'football hits Rex once');
const cry=create({blocked:()=>false,getTarget:()=>({x:80,y:0}),onHit:()=>hits++});
cry.activate(actor('coco'));cry.update(.2);assert.equal(hits,1,'distant target waits for wavefront');cry.update(.6);cry.update(.3);assert.equal(hits,2,'one reaction for all three shockwave rings');
const distant=create({blocked:()=>false,getTarget:()=>({x:200,y:0}),onHit:()=>hits++});
distant.activate(actor('coco'));distant.update(1);assert.equal(hits,2,'shockwave range is limited');
console.log('Powers: four directions, independent cooldowns, expiry, scenery collision, wave timing/range and one-hit reactions passed');
