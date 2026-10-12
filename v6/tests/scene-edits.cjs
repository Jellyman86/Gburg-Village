const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const edits=require('..\\src\\scene-edits.js'),root=path.resolve(__dirname,'..'),context={window:null};context.window=context;vm.createContext(context);
for(const file of ['action-art','characters','gary-finale','banquet-finale','cinema-catalog'])vm.runInContext(fs.readFileSync(path.join(root,'src',file+'.js'),'utf8'),context);
const catalog=context.V5_CINEMA_CATALOG.catalog,characters=context.CHARACTERS,valid=data=>edits.validate(data,catalog,characters);
const empty=edits.empty();valid(empty);
for(const event of Object.keys(catalog)){
 const result=edits.apply(catalog,event,empty);
 assert.equal(result.shots.length,catalog[event].shots.length);
 result.shots.forEach((shot,index)=>assert.equal(shot,catalog[event].shots[index]));
 assert.equal(result.duration,catalog[event].duration);
}
const draft={version:1,scenes:{montage:{1:{seconds:5,text:'A splash!',speaker:'chris',bubble:{placement:'below'},actors:{chris:{dx:12,dy:-8}},camera:{x:390,y:835,zoom:.8}}}}};
valid(draft);const modified=edits.apply(catalog,'montage',draft);
assert.equal(modified.shots[1].seconds,5);assert.equal(modified.duration,25);assert.equal(catalog.montage.duration,24);
assert.equal(modified.shots[1].actors.chris.dx,12);assert.equal(modified.shots[1].bubble.placement,'below');
assert.throws(()=>valid({version:2,scenes:{}}),/version/);
assert.throws(()=>valid({version:1,scenes:{unknown:{}}}),/Unknown cinematic/);
assert.throws(()=>valid({version:1,scenes:{montage:{99:{}}}}),/Unknown shot/);
assert.throws(()=>valid({version:1,scenes:{montage:{1:{stage:'evil'}}}}),/Unknown/);
assert.throws(()=>valid({version:1,scenes:{montage:{1:{seconds:NaN}}}}),/duration/);
assert.throws(()=>valid({version:1,scenes:{montage:{1:{seconds:0}}}}),/duration/);
assert.throws(()=>valid({version:1,scenes:{montage:{1:{bubble:{placement:'custom'}}}}}),/X and Y/);
assert.throws(()=>valid({version:1,scenes:{montage:{1:{actors:{unknown:{dx:0,dy:0}}}}}}),/Unknown actor/);
assert.throws(()=>valid({version:1,scenes:{gary:{4:{seconds:1}}}}),/cannot be shortened/);
assert.throws(()=>valid({version:1,scenes:{gary:{11:{actors:{gary:{dx:1,dy:1}}}}}}),/return shots/);
assert.throws(()=>valid(JSON.parse('{"version":1,"scenes":{"__proto__":{}}}')),/Unknown cinematic/);
assert.throws(()=>valid({version:1,scenes:{montage:{1:{camera:{x:1,y:2,zoom:0}}}}}),/zoom/);
console.log(JSON.stringify({sceneEdits:'passed',checks:['empty edits preserve every authored shot and duration','shared immutable overrides','unknown/invalid fields rejected','finite numeric bounds','Gary wave duration and return-position protection']}));
