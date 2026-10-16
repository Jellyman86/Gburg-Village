#!/usr/bin/env node
// Sprite metadata tool for the living version.
//   node tools/sprites.cjs build   validate v8/data/sprites.json against the art manifest and regenerate v8/src/sprites-data.js
//   node tools/sprites.cjs check   fail if the JSON is invalid or the generated file is stale
// sprites.json is the single source of truth for the playable roster, walk-sheet quirks (walkRowOffset, mirrorLeft,
// speeds, frame rates) and every action/emotion pose clip. v8/src/characters.js turns it into the CHARACTERS and
// V5_ACTION_ART globals the game uses; the studio server calls build() after every save.
'use strict';
const fs=require('node:fs'),path=require('node:path');
const art=require('./art.cjs');
const root=art.root,live=art.live;
const dataPath=path.join(live,'data','sprites.json'),generatedPath=path.join(live,'src','sprites-data.js');

const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const ID=/^[a-z][a-z0-9-]*$/;
function fail(message){throw new Error(message);}
function keys(value,allowed,label){
 if(!object(value))fail(label+' must be an object.');
 for(const key of Object.keys(value))if(!allowed.includes(key))fail('Unknown '+label+' field: '+key);
}
function integer(value,min,max,label){
 if(!Number.isInteger(value)||value<min||value>max)fail(label+' must be an integer between '+min+' and '+max+'.');
}
function number(value,min,max,label){
 if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)fail(label+' must be between '+min+' and '+max+'.');
}
function point(value,label){keys(value,['x','y'],label);number(value.x,0,1024,label+'.x');number(value.y,0,1024,label+'.y');}

// Validate the document against the art manifest: ids exist and every referenced frame lies inside its sheet.
function validate(data,assets=art.readManifest().assets){
 keys(data,['version','cell','foot','walkRows','characters','poses','windowHead'],'sprites');
 if(data.version!==1)fail('sprites.json must have version 1.');
 integer(data.cell,16,256,'cell');point(data.foot,'foot');
 keys(data.walkRows,['down','left','right','up'],'walkRows');
 for(const dir of ['down','left','right','up'])integer(data.walkRows[dir],0,3,'walkRows.'+dir);
 const cell=data.cell;
 const sheet=(id,label)=>{if(typeof id!=='string'||!Object.hasOwn(assets,id))fail(label+' refers to an unknown art id: '+id);return assets[id];};
 if(!object(data.characters)||!Object.keys(data.characters).length)fail('characters must list at least one character.');
 for(const [id,c] of Object.entries(data.characters)){
  if(!ID.test(id))fail('Invalid character id: '+id);
  const label='characters.'+id;
  keys(c,['name','walk','portrait','speed','runSpeed','walkFPS','runFPS','walkRowOffset','mirrorLeft','emotions','joined'],label);
  if(typeof c.name!=='string'||!c.name.trim())fail(label+'.name is required.');
  const walk=sheet(c.walk,label+'.walk'),rowOffset=c.walkRowOffset||0;
  if(c.walkRowOffset!==undefined)integer(c.walkRowOffset,0,8,label+'.walkRowOffset');
  if(walk.width<cell*4)fail(label+'.walk ('+c.walk+') is '+walk.width+' px wide; walk sheets need 4 frames of '+cell+' px.');
  if(walk.height<cell*(4+rowOffset))fail(label+'.walk ('+c.walk+') is '+walk.height+' px tall; it needs '+(4+rowOffset)+' rows of '+cell+' px'+(rowOffset?' (walkRowOffset '+rowOffset+')':'')+'.');
  const portrait=sheet(c.portrait,label+'.portrait');
  if(portrait.width!==128||portrait.height!==128)fail(label+'.portrait ('+c.portrait+') must be 128x128.');
  number(c.speed,10,1000,label+'.speed');number(c.runSpeed,10,1000,label+'.runSpeed');number(c.walkFPS,1,60,label+'.walkFPS');number(c.runFPS,1,60,label+'.runFPS');
  if(c.mirrorLeft!==undefined&&c.mirrorLeft!==true)fail(label+'.mirrorLeft must be true or omitted.');
  if(c.joined!==undefined&&c.joined!==true)fail(label+'.joined must be true or omitted (true = in the party from the start).');
  if(c.emotions!==undefined){
   keys(c.emotions,['art','frames','fps','rows'],label+'.emotions');
   const e=sheet(c.emotions.art,label+'.emotions.art');
   integer(c.emotions.frames,1,16,label+'.emotions.frames');number(c.emotions.fps,1,60,label+'.emotions.fps');
   if(!object(c.emotions.rows)||!Object.keys(c.emotions.rows).length)fail(label+'.emotions.rows must map pose names to rows.');
   for(const [pose,row] of Object.entries(c.emotions.rows)){
    if(!ID.test(pose))fail(label+'.emotions.rows has an invalid pose name: '+pose);
    integer(row,0,64,label+'.emotions.rows.'+pose);
    if(e.width<cell*c.emotions.frames||e.height<cell*(row+1))fail(label+'.emotions ('+c.emotions.art+', '+e.width+'x'+e.height+') does not hold '+c.emotions.frames+' frames on row '+row+'.');
   }
  }
 }
 if(!object(data.poses))fail('poses must be an object.');
 for(const [id,clips] of Object.entries(data.poses)){
  if(!Object.hasOwn(data.characters,id))fail('poses.'+id+' is not a character.');
  if(!object(clips))fail('poses.'+id+' must map pose names to clips.');
  for(const [pose,clip] of Object.entries(clips)){
   if(!ID.test(pose))fail('poses.'+id+' has an invalid pose name: '+pose);
   const label='poses.'+id+'.'+pose;
   keys(clip,['art','frameWidth','frameHeight','foot','frames','fps','loop','scale'],label);
   const s=sheet(clip.art,label+'.art'),fw=clip.frameWidth??cell,fh=clip.frameHeight??cell;
   if(clip.frameWidth!==undefined)integer(clip.frameWidth,8,1024,label+'.frameWidth');
   if(clip.frameHeight!==undefined)integer(clip.frameHeight,8,1024,label+'.frameHeight');
   if(clip.foot!==undefined){point(clip.foot,label+'.foot');if(clip.foot.x>fw||clip.foot.y>fh)fail(label+'.foot lies outside its '+fw+'x'+fh+' frame.');}
   integer(clip.frames,1,64,label+'.frames');number(clip.fps,1,60,label+'.fps');
   if(clip.loop!==undefined&&clip.loop!==false)fail(label+'.loop must be false or omitted (clips loop by default).');
   if(clip.scale!==undefined)number(clip.scale,.1,8,label+'.scale');
   if(s.width<fw*clip.frames||s.height<fh)fail(label+' ('+clip.art+', '+s.width+'x'+s.height+') does not hold '+clip.frames+' frames of '+fw+'x'+fh+'.');
  }
 }
 keys(data.windowHead,['art','frameWidth','frameHeight','frames'],'windowHead');
 const w=sheet(data.windowHead.art,'windowHead.art');
 integer(data.windowHead.frameWidth,8,1024,'windowHead.frameWidth');integer(data.windowHead.frameHeight,8,1024,'windowHead.frameHeight');integer(data.windowHead.frames,1,64,'windowHead.frames');
 if(w.width<data.windowHead.frameWidth*data.windowHead.frames||w.height<data.windowHead.frameHeight)fail('windowHead frames do not fit '+data.windowHead.art+'.');
 return data;
}

function readData(){return JSON.parse(fs.readFileSync(dataPath,'utf8'));}
function writeData(data){fs.writeFileSync(dataPath,JSON.stringify(data,null,1)+'\n');}

function generate(data){
 return ['// GENERATED by tools/sprites.cjs from v8/data/sprites.json - edit the JSON (or use the studio), then `npm run sprites:build`.',
  '((root)=>{',
  " 'use strict';",
  ' const data='+JSON.stringify(data)+';',
  ' root.V8_SPRITES_DATA=Object.freeze(data);if(root!==globalThis)globalThis.V8_SPRITES_DATA=data;',
  " if(typeof module!=='undefined'&&module.exports)module.exports=data;",
  "})(typeof window==='undefined'?globalThis:window);",''].join('\n');
}

function analyze(){
 const data=readData();validate(data);
 const serialized=JSON.stringify(data,null,1)+'\n',generated=generate(data);
 const same=(file,text)=>fs.existsSync(file)&&fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n')===text;
 return {data,serialized,generated,dataStale:!same(dataPath,serialized),generatedStale:!same(generatedPath,generated)};
}
const counts=data=>`${Object.keys(data.characters).length} characters, ${Object.values(data.poses).reduce((n,p)=>n+Object.keys(p).length,0)} pose clips`;
function build({quiet=false}={}){
 const a=analyze();
 if(a.dataStale)fs.writeFileSync(dataPath,a.serialized);
 if(a.generatedStale)fs.writeFileSync(generatedPath,a.generated);
 if(!quiet)console.log(`✔ sprites.json: ${counts(a.data)} valid against the art manifest; src/sprites-data.js ${a.generatedStale?'regenerated':'unchanged'}.`);
 return a;
}
function check(){
 const a=analyze(),problems=[];
 if(a.dataStale)problems.push('sprites.json formatting differs from tools/sprites.cjs output (run `npm run sprites:build`).');
 if(a.generatedStale)problems.push('v8/src/sprites-data.js is out of date (run `npm run sprites:build`).');
 if(problems.length){console.error('✖ Sprite data check failed.\n'+problems.join('\n'));return false;}
 console.log(`✔ Sprite data: ${counts(a.data)}; src/sprites-data.js is current.`);
 return true;
}

// Used by the importer: make sure a character or pose exists after its sheet was imported. Existing entries keep
// their tuned values; only missing fields are filled in. Returns what changed ('added' | 'kept').
function registerCharacter(id,{name,walk,portrait,walkRowOffset}={}){
 const data=readData(),current=data.characters[id];
 const entry=current||{name:name||id[0].toUpperCase()+id.slice(1),walk:walk||`character.${id}.walk`,portrait:portrait||`portrait.${id}`,speed:120,runSpeed:205,walkFPS:8,runFPS:12,joined:true};
 if(walkRowOffset)entry.walkRowOffset=walkRowOffset;else if(walkRowOffset===0)delete entry.walkRowOffset;
 data.characters[id]=entry;
 validate(data);writeData(data);build({quiet:true});
 return current?'kept':'added';
}
function registerPose(id,pose,{art:artId,frames,fps=6,frameWidth,frameHeight,foot,loop}={}){
 const data=readData();
 if(!data.characters[id])fail('sprites.json has no character "'+id+'" yet — import its walk sheet and portrait first, then re-run this pose import.');
 const clips=data.poses[id]=data.poses[id]||{},current=clips[pose];
 if(!current){
  const entry={art:artId||`character.${id}.${pose}`};
  if(frameWidth&&frameWidth!==data.cell)entry.frameWidth=frameWidth;
  if(frameHeight&&frameHeight!==data.cell)entry.frameHeight=frameHeight;
  if(foot)entry.foot=foot;
  entry.frames=frames||1;entry.fps=fps;
  if(loop===false)entry.loop=false;
  clips[pose]=entry;
 }
 validate(data);writeData(data);build({quiet:true});
 return current?'kept':'added';
}

module.exports={validate,build,check,readData,generate,registerCharacter,registerPose,dataPath,generatedPath};
if(require.main===module){
 const command=process.argv[2];
 try{
  if(command==='build')build();
  else if(command==='check'){if(!check())process.exit(1);}
  else{console.error('Usage: node tools/sprites.cjs build|check');process.exit(2);}
 }catch(error){console.error('✖ '+error.message);process.exit(1);}
}
