const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const context={window:null,console,CHARACTERS:Object.fromEntries(['coco','connor','jason','peachy','jeff','ari','chris','jaime','mark','stephanie','adam','kate','brie','vito','gary'].map(id=>[id,{name:id}]))};
context.window=context;
let callback,scene='cocoRoom',starts=0,meeting=false,banquet=false,resumed=0;
context.V5_CINEMA={active:false,play(id,done){assert.equal(this.active,false);this.active=true;callback=done;starts++;return true;}};
context.V4_SFX={play(){}};
context.V4_RPG={members:Object.fromEntries(Object.keys(context.CHARACTERS).map(id=>[id,{joined:id==='coco'}])),recruit(id){assert.equal(this.members[id].joined,false);this.members[id].joined=true;return {ok:true};}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'src','story.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'src','story-events.js'),'utf8'),context);
const events=context.V5_EVENTS;
events.attach({scene:()=>scene,atMeeting:()=>meeting,atBanquet:()=>banquet,resumeGary(){resumed++;},reset(){},notify(){},refresh(){}});
function complete(result={}){context.V5_CINEMA.active=false;const done=callback;done(result);done(result);}
assert.equal(events.start(),true);assert.equal(events.start(),false);
assert.equal(events.celebrate(),false);
assert.equal(events.canTravel('upstairs'),false);
complete();assert.equal(events.canTravel('house'),false);assert.equal(events.canTravel('upstairs'),true);
scene='house';events.check();assert.equal(context.V4_RPG.members.jason.joined,false);
scene='connorRoom';events.check();complete();assert.equal(context.V4_RPG.members.connor.joined,true);
const afterConnor=starts;events.check();assert.equal(starts,afterConnor);
scene='house';events.check();complete();
assert.equal(context.V4_RPG.members.jason.joined,true);assert.equal(context.V4_RPG.members.peachy.joined,true);
assert.equal(events.state.current,'montage');assert.equal(context.V4_RPG.members.jeff.joined,false);
complete();assert.equal(events.canTravel('hq'),true);
scene='neighborhood';assert.equal(events.encounter('gary'),false);
scene='hq';assert.equal(events.encounter('gary'),true);complete();
assert.equal(context.V4_RPG.members.gary.joined,false);assert(!events.state.completed.includes('gary-talk'));
assert.equal(events.encounter('gary'),true);complete();
for(const id of context.V4_STORY.order.filter(id=>!context.V4_RPG.members[id].joined)){
 scene='house';assert.equal(events.encounter(id),false);
 scene=context.V4_STORY.locations[id].scene;assert.equal(events.encounter(id),true);
 complete();assert.equal(context.V4_RPG.members[id].joined,true);assert.equal(events.encounter(id),false);
}
assert.equal(context.V4_RPG.members.gary.joined,false);
assert.equal(events.celebrate(),false);
scene='plaza';events.check();assert.equal(events.state.current,null);
meeting=true;events.check();assert.equal(events.state.current,'gathering');complete();
assert.equal(events.state.current,'gary');assert.equal(context.V4_RPG.members.gary.joined,false);
const beforeError=console.error;let failures=0;console.error=()=>failures++;
try{complete({defeated:19});}finally{console.error=beforeError;}
assert.equal(failures,1);assert.equal(context.V4_RPG.members.gary.joined,false);assert(!events.state.completed.includes('gary'));
events.check();assert.equal(events.state.current,'gary');complete({defeated:20});
assert.equal(context.V4_RPG.members.gary.joined,true);
const afterFinale=starts;events.check();events.start();assert.equal(starts,afterFinale);
assert.equal(events.state.protagonist,'coco');assert.equal(events.state.chapter,'complete');
assert.equal(Object.values(context.V4_RPG.members).filter(member=>member.joined).length,15);
assert.equal(new Set(events.state.completed).size,events.state.completed.length);
assert.equal(context.V4_STORY.actors('hq',[],'gary').filter(actor=>actor.id==='gary').length,0);
assert.equal(context.V4_STORY.encounters('hq','gary').length,0);
assert.equal(events.celebrate(),false);banquet=true;
scene='hq';assert.equal(events.celebrate(),false);scene='plaza';
assert.equal(events.celebrate(),true);assert.equal(resumed,0);assert(!events.state.completed.includes('banquet'));
console.error=()=>failures++;
try{complete({endingAcknowledged:false});}finally{console.error=beforeError;}
assert.equal(failures,2);assert.equal(resumed,0);assert(!events.state.completed.includes('banquet'));
assert.equal(events.celebrate(),true);
complete({endingAcknowledged:true});assert.equal(resumed,1);assert(events.state.completed.includes('banquet'));
assert.equal(events.celebrate(),false);events.start();events.check();assert.equal(resumed,1);
vm.runInContext(fs.readFileSync(path.join(root,'src','banquet-finale.js'),'utf8'),context);
const finale=context.V5_BANQUET_FINALE;
assert.equal(finale.shots.reduce((total,shot)=>total+shot.seconds,0),48);assert.equal(Object.keys(finale.scenes).length,7);
function sample(stage,time,reduced){
 const actors=[],meteors=[];
 finale.stage(finale.shots.find(shot=>shot.stage===stage),time,{reduced,hasPose:()=>false,human:(id,x,y,options)=>actors.push({id,x,y,...options}),meteor:(x,y)=>meteors.push({x,y})});
 return {actors,meteors};
}
assert.deepEqual(sample('banquet-party',1,true),sample('banquet-party',3,true));
assert.notDeepEqual(sample('banquet-party',1,false),sample('banquet-party',3,false));
assert.deepEqual(sample('banquet-sky',1,true).meteors,sample('banquet-sky',3,true).meteors);
assert(sample('banquet-sky',1,true).actors.every(actor=>actor.dir==='up'));
const city=finale.shots.find(shot=>shot.stage==='banquet-city');
assert(finale.flash(city,1.8,false)>0);assert(finale.shake(city,1.8,false)>0);
assert.equal(finale.flash(city,1.8,true),0);assert.equal(finale.shake(city,1.8,true),0);
for(const [width,height] of [[1280,655],[390,700],[844,300]]){
 const camera=finale.camera(finale.shots.find(shot=>shot.stage==='banquet-sky'),width,height);
 assert(camera.y===0&&1440*camera.scale<=height&&960*camera.scale<=width);
}
console.log(JSON.stringify({storyState:'passed',events:events.state.completed.length,checks:['ordered prerequisites','exactly-once awards','grouped parents','Gary HQ-only conversation without recruitment','original fourteen exclude locked Gary from reunion condition','meeting proximity','twenty-defeat finale unlock','no replay or duplicate Gary NPC','optional plaza-only banquet','explicit ending acknowledgement','single Gary return','48-second seven-backdrop finale','reduced-motion effects and starry sky framing']}));
