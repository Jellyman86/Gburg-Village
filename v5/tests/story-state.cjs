const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const context={window:null,console,CHARACTERS:Object.fromEntries(['coco','connor','jason','peachy','jeff','ari','chris','jaime','mark','stephanie','adam','kate','brie','vito'].map(id=>[id,{name:id}]))};
context.window=context;
let callback,scene='cocoRoom',starts=0;
context.V5_CINEMA={active:false,play(id,done){assert.equal(this.active,false);this.active=true;callback=done;starts++;return true;}};
context.V4_SFX={play(){}};
context.V4_RPG={members:Object.fromEntries(Object.keys(context.CHARACTERS).map(id=>[id,{joined:id==='coco'}])),recruit(id){assert.equal(this.members[id].joined,false);this.members[id].joined=true;return {ok:true};}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'src','story.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'src','story-events.js'),'utf8'),context);
const events=context.V5_EVENTS;
events.attach({scene:()=>scene,reset(){},notify(){},refresh(){}});
function complete(){context.V5_CINEMA.active=false;const done=callback;done();done();}
assert.equal(events.start(),true);assert.equal(events.start(),false);
assert.equal(events.canTravel('upstairs'),false);
complete();assert.equal(events.canTravel('house'),false);assert.equal(events.canTravel('upstairs'),true);
scene='house';events.check();assert.equal(context.V4_RPG.members.jason.joined,false);
scene='connorRoom';events.check();assert.equal(context.V4_RPG.members.connor.joined,false);
complete();assert.equal(context.V4_RPG.members.connor.joined,true);assert.equal(events.canTravel('house'),true);
const afterConnor=starts;events.check();assert.equal(starts,afterConnor);
scene='house';events.check();complete();
assert.equal(context.V4_RPG.members.jason.joined,true);assert.equal(context.V4_RPG.members.peachy.joined,true);
assert.equal(events.state.current,'montage');assert.equal(context.V4_RPG.members.jeff.joined,false);
complete();assert.equal(events.canTravel('neighborhood'),true);
for(const id of context.V4_STORY.order.filter(id=>!context.V4_RPG.members[id].joined)){
 scene='house';assert.equal(events.encounter(id),false);
 scene=context.V4_STORY.locations[id].scene;assert.equal(events.encounter(id),true);
 complete();assert.equal(context.V4_RPG.members[id].joined,true);assert.equal(events.encounter(id),false);
}
scene='plaza';events.check();assert.equal(events.state.current,'gathering');
complete();const afterGathering=starts;events.check();events.start();assert.equal(starts,afterGathering);
assert.equal(events.state.protagonist,'coco');assert.equal(events.state.chapter,'complete');
assert.equal(new Set(events.state.completed).size,events.state.completed.length);
console.log(JSON.stringify({storyState:'passed',events:events.state.completed.length,checks:['ordered prerequisites','exactly-once callback rewards','grouped parent award','montage grants nobody','all fourteen playable','gathering one-shot','replay preserves progress']}));
