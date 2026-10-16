// Sprite data contract: data/sprites.json drives CHARACTERS and V5_ACTION_ART exactly the way the game expects.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const sprites=require('../../tools/sprites.cjs'),art=require('../src/art.js'),data=require('../src/sprites-data.js');
assert.deepEqual(data,sprites.readData(),'sprites-data.js mirrors sprites.json');
sprites.validate(data);
const scope={window:{}};vm.createContext(scope);
for(const name of ['art','sprites-data','characters'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..','src',name+'.js'),'utf8'),scope);
const {CHARACTERS,V5_ACTION_ART,V5_WINDOW_ART,characterWalkPose}=scope.window;
// Objects built inside the vm have their own Object prototype, so compare them structurally.
const same=(actual,expected,message)=>assert.equal(JSON.stringify(actual),JSON.stringify(expected),message);
same(Object.keys(CHARACTERS),Object.keys(data.characters),'Roster order follows sprites.json');
assert(Object.keys(CHARACTERS).length>=15,'All fifteen playable characters are present');
for(const [id,c] of Object.entries(CHARACTERS)){
 assert.equal(c.id,id);assert.equal(c.frameWidth,64);assert.equal(c.frameHeight,64);assert.equal(c.frames,4);
 same(c.rows,{down:0,left:1,right:2,up:3});same(c.foot,{x:32,y:60});
 assert.equal(c.sheet,art.url(data.characters[id].walk),'Sheet URL comes from the manifest: '+id);
 assert.equal(c.portrait,art.url(data.characters[id].portrait),'Portrait URL comes from the manifest: '+id);
 const sheet=art.entry(data.characters[id].walk),rowsNeeded=4+(c.walkRowOffset||0);
 assert(sheet.height>=64*rowsNeeded,`${id} walk sheet holds ${rowsNeeded} rows`);
 for(const direction of ['down','left','right','up']){
  const idle=characterWalkPose(c,direction,false),walk=characterWalkPose(c,direction,true);
  assert(idle.row*64+64<=sheet.height&&walk.row*64+64<=sheet.height,`${id} ${direction} rows fit the sheet`);
  assert.equal(walk.row-idle.row,c.walkRowOffset||0,`${id} walking row offset applies`);
 }
}
// Quirks that must survive the data move.
same(characterWalkPose(CHARACTERS.gary,'left',true),{row:6,flip:true},'Gary mirrors his right-facing rows when walking left');
same(characterWalkPose(CHARACTERS.jaime,'up',true),{row:7,flip:false},'Jaime walks on the lower four rows');
same(characterWalkPose(CHARACTERS.jason,'down',false),{row:0,flip:false},'Original cast idles on its walk rows');
assert.equal(CHARACTERS.coco.emotions.sheet,art.url('character.coco.emotions'),'Coco keeps her emotion sheet');
let clips=0;
for(const [id,poses] of Object.entries(V5_ACTION_ART)){
 assert(CHARACTERS[id],'Poses belong to a character: '+id);
 for(const [pose,clip] of Object.entries(poses)){
  clips++;
  const sheet=art.entry(data.poses[id][pose].art);
  assert.equal(clip.sheet,art.url(data.poses[id][pose].art),`${id}.${pose} sheet URL comes from the manifest`);
  assert(clip.frameWidth*clip.frames<=sheet.width&&clip.frameHeight<=sheet.height,`${id}.${pose} frames fit ${sheet.width}x${sheet.height}`);
  assert(clip.foot.x<=clip.frameWidth&&clip.foot.y<=clip.frameHeight,`${id}.${pose} foot inside the frame`);
  assert(clip.fps>0&&(clip.loop===undefined||clip.loop===false),`${id}.${pose} has fps and loop semantics`);
 }
}
assert(clips>=51,'Existing pose clips are all present');
assert(V5_WINDOW_ART.frames===3&&V5_WINDOW_ART.sheet===art.url('dinosaur.window-head'),'Window dinosaur head clip is defined');
assert(!fs.existsSync(path.join(__dirname,'..','src','action-art.js')),'Pose metadata lives in sprites.json, not action-art.js');
assert.throws(()=>sprites.validate({...data,characters:{...data.characters,bogus:{...data.characters.jason,walk:'character.nobody.walk'}}}),/unknown art id/,'Validation rejects unknown art ids');
assert.throws(()=>sprites.validate({...data,poses:{...data.poses,jason:{talk:{...data.poses.jason.talk,frames:9}}}}),/does not hold/,'Validation rejects frames that overflow the sheet');
console.log(`PASS: ${Object.keys(CHARACTERS).length} characters and ${clips} pose clips built from sprites.json match the manifest and walk contract.`);
