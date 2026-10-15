const assert=require('node:assert/strict');
const geometry=require('../../tools/geometry.cjs');
const context=geometry.loadScenes(),{SCENES,V8_GEOMETRY:G,V8_AREAS}=context;
const editable=Object.values(SCENES).filter(s=>!s.world);
assert(editable.length>=26,'All playable scenes are loaded for geometry validation');
// extract() then apply() must reproduce the game's collision answers exactly for every scene.
const r2=(k,v)=>typeof v==='number'?Math.round(v*100)/100:v;
const landmarkSignature=scene=>JSON.stringify(scene.landmarks.map(l=>[l.id,l.x,l.y,l.radius,l.to,l.text,l.roads]),r2);
for(const scene of editable){
 const before=[];const step=16;
 for(let y=0;y<scene.height;y+=step)for(let x=0;x<scene.width;x+=step)before.push(V8_AREAS.blocked(scene,x,y));
 const landmarksBefore=landmarkSignature(scene);
 const entry=G.extract(scene);
 G.validate({version:1,scenes:{[scene.id]:entry}},SCENES);
 G.apply(SCENES,{version:1,scenes:{[scene.id]:JSON.parse(JSON.stringify(entry))}});
 const after=[];for(let y=0;y<scene.height;y+=step)for(let x=0;x<scene.width;x+=step)after.push(V8_AREAS.blocked(scene,x,y));
 assert.deepEqual(after,before,'Round trip preserves collision: '+scene.id);
 assert.equal(landmarkSignature(scene),landmarksBefore,'Round trip preserves landmarks: '+scene.id);
}
// Overrides really change the game: a blocked rectangle makes a walkable point blocked; removing it restores it.
const plaza=SCENES.plaza,point={x:plaza.spawn.x,y:plaza.spawn.y};
assert(!V8_AREAS.blocked(plaza,point.x,point.y),'Plaza spawn starts walkable');
const edited=G.extract(plaza);edited.obstacles.push({x:point.x-20,y:point.y-20,w:40,h:40});
edited.landmarks.push({id:'studio-note',x:point.x+100,y:point.y,radius:40,name:'Note',text:'Hello',studio:true});
edited.landmarks.push({id:'java',removed:true});
G.apply(SCENES,{version:1,scenes:{plaza:edited}});
assert(V8_AREAS.blocked(plaza,point.x,point.y),'Override obstacle blocks the spawn point');
assert(plaza.landmarks.some(l=>l.id==='studio-note'&&l.studio&&l.text==='Hello'),'Studio marker is added');
assert(!plaza.landmarks.some(l=>l.id==='java'),'Removed landmark is dropped');
assert.throws(()=>G.validate({version:1,scenes:{nowhere:{}}},SCENES),/Unknown scene/);
assert.throws(()=>G.validate({version:1,scenes:{plaza:{obstacles:[{x:1,y:1,w:0,h:5}]}}},SCENES),/Invalid rectangle/);
assert.throws(()=>G.validate({version:1,scenes:{plaza:{walkablePolygons:[[[0,0],[1,1]]]}}},SCENES),/Invalid polygon/);
assert.throws(()=>G.validate({version:1,scenes:{plaza:{bogus:[]}}},SCENES),/Unknown geometry field/);
console.log(`PASS: geometry extract/apply round-trips ${editable.length} scenes with identical collision and landmarks; overrides add/remove shapes and markers; invalid data is rejected.`);
