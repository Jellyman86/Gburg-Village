#!/usr/bin/env node
// Music manifest tool for the living version.
//   node tools/music.cjs import [--from <folder>] [--bitrate 128k] [--force] [--no-normalize]   convert new/changed tracks from Music/ into v8/assets/music/*.mp3 (loudness-normalized)
//   node tools/music.cjs build                                                 sync track hashes with disk and regenerate v8/src/music-data.js
//   node tools/music.cjs check                                                 fail if music.json or music-data.js are stale or inconsistent
//
// v8/data/music.json is the single source of truth:
//   tracks     generated from files (id, title, file, hash, source, sourceHash). Edit "title" freely; optional "gain" (0.1-2) trims a track.
//   characters character id -> track id. Plays while that character is active (if character music is on).
//   characterPlaces places where the active character's theme plays by default (others use their playlist).
//   places     place -> ordered track ids. Places: village, world, jet, hawaii, nyc, battle, cafe, omen.
//              Empty lists fall back to the original synthesized theme for that place.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');

const root=path.resolve(__dirname,'..'),live=path.join(root,'v8');
const manifestPath=path.join(live,'data','music.json'),generatedPath=path.join(live,'src','music-data.js');
const musicRoot=path.join(live,'assets','music'),defaultInbox=path.join(root,'Music');
const PLACES=['village','world','jet','hawaii','nyc','paris','egypt','italy','philippines','japan','montage','battle','cafe','omen'];
const AUDIO=/\.(m4a|mp3|wav|ogg|flac|aac)$/i;

const sha256=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
const args=process.argv.slice(2),command=args[0];
const option=name=>{const i=args.indexOf('--'+name);return i<0?undefined:args[i+1];};
const has=name=>args.includes('--'+name);

function readManifest(){
 if(!fs.existsSync(manifestPath))return {version:1,root:'assets/music/',tracks:{},characters:{},places:Object.fromEntries(PLACES.map(p=>[p,[]]))};
 const data=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
 if(data.version!==1||typeof data.tracks!=='object')throw new Error('music.json must have version 1 and a tracks object');
 data.characters=data.characters||{};data.places=data.places||{};
 for(const p of PLACES)data.places[p]=data.places[p]||[];
 return data;
}

// "Uptown_Girl_SNES_Game.m4a" -> id "uptown-girl", title "Uptown Girl". Export suffixes (SNES, Game, Trimmed, Converted...) and
// Windows " - Copy" duplicates are ignored.
function idFor(fileName){
 return path.parse(fileName).name.replace(/\s*-\s*Copy(\s*\(\d+\))?$/i,'').split(/[_\s-]+/)
  .filter(word=>word&&!/^(snes|game|style|converted|trimmed|trim|loop|looped|edit|final|mix|version|v\d+|chiptune|8bit|16bit)$/i.test(word))
  .join('-').toLowerCase().replace(/[^a-z0-9-]+/g,'').replace(/-+/g,'-').replace(/^-|-$/g,'');
}
const titleFor=id=>id.split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');

function findFfmpeg(){
 if(process.env.FFMPEG_PATH&&fs.existsSync(process.env.FFMPEG_PATH))return process.env.FFMPEG_PATH;
 const where=spawnSync(process.platform==='win32'?'where.exe':'which',['ffmpeg'],{encoding:'utf8'});
 if(where.status===0&&where.stdout.trim())return where.stdout.trim().split(/\r?\n/)[0];
 const packages=process.env.LOCALAPPDATA&&path.join(process.env.LOCALAPPDATA,'Microsoft','WinGet','Packages');
 if(packages&&fs.existsSync(packages))for(const dir of fs.readdirSync(packages).filter(d=>/ffmpeg/i.test(d))){
  const stack=[path.join(packages,dir)];
  while(stack.length){const d=stack.pop();for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name);if(e.isDirectory())stack.push(f);else if(/^ffmpeg(\.exe)?$/i.test(e.name))return f;}}
 }
 return null;
}

function resolveTracks(data){
 const files=fs.existsSync(musicRoot)?fs.readdirSync(musicRoot).filter(f=>/\.mp3$/i.test(f)).sort():[];
 const next={version:1,root:'assets/music/',tracks:{},characters:{},places:{}},changes=[],problems=[];
 const seenFiles=new Set();
 for(const id of Object.keys(data.tracks).sort()){
  const entry=data.tracks[id];
  if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id))problems.push('Invalid track id (use lowercase words with hyphens): '+id);
  const file=entry.file||id+'.mp3',full=path.join(musicRoot,file);
  if(!fs.existsSync(full)){problems.push(`Track ${id}: missing file v8/assets/music/${file}`);continue;}
  const hash=sha256(fs.readFileSync(full));
  const resolved={title:entry.title||titleFor(id),file,hash};
  if(entry.source)resolved.source=entry.source;if(entry.sourceHash)resolved.sourceHash=entry.sourceHash;
  if(entry.hash!==hash)changes.push(id+': hash '+(entry.hash?entry.hash.slice(0,10)+' → ':'set ')+hash.slice(0,10));
  next.tracks[id]=resolved;seenFiles.add(file);
 }
 for(const file of files)if(!seenFiles.has(file)){
  const id=idFor(file);
  if(next.tracks[id]){problems.push(`File ${file} collides with track id ${id}`);continue;}
  next.tracks[id]={title:titleFor(id),file,hash:sha256(fs.readFileSync(path.join(musicRoot,file)))};changes.push(id+': added from '+file);
 }
 for(const [character,track] of Object.entries(data.characters)){
  if(!next.tracks[track])problems.push(`characters.${character} refers to unknown track "${track}"`);else next.characters[character]=track;
 }
 // Places where the active character's theme plays by default (players can change this per device in Options).
 const characterPlaces=data.characterPlaces||['village','world','nyc'];
 for(const place of characterPlaces)if(!PLACES.includes(place))problems.push('characterPlaces has unknown place "'+place+'"');
 next.characterPlaces=characterPlaces.filter(p=>PLACES.includes(p));
 for(const place of Object.keys(data.places))if(!PLACES.includes(place))problems.push('Unknown place "'+place+'". Known: '+PLACES.join(', '));
 for(const place of PLACES){
  const list=data.places[place]||[];
  for(const track of list)if(!next.tracks[track])problems.push(`places.${place} refers to unknown track "${track}"`);
  next.places[place]=list.filter(t=>next.tracks[t]);
 }
 return {next,changes,problems};
}

function generate(data){
 return ['// GENERATED by tools/music.cjs from v8/data/music.json - edit the JSON and run `npm run music:build`.',
  '((root)=>{',
  " 'use strict';",
  ' const data='+JSON.stringify(data)+';',
  ' root.V8_MUSIC_DATA=Object.freeze(data);if(root!==globalThis)globalThis.V8_MUSIC_DATA=data;',
  " if(typeof module!=='undefined'&&module.exports)module.exports=data;",
  "})(typeof window==='undefined'?globalThis:window);",''].join('\n');
}

function analyze(){
 const data=readManifest(),{next,changes,problems}=resolveTracks(data);
 const serialized=JSON.stringify(next,null,1)+'\n',generated=generate(next);
 const same=(file,text)=>fs.existsSync(file)&&fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n')===text;
 return {next,changes,problems,serialized,generated,manifestStale:!same(manifestPath,serialized),generatedStale:!same(generatedPath,generated)};
}

function build({quiet=false}={}){
 const a=analyze();
 if(a.problems.length){console.error('✖ music.json problems:\n  '+a.problems.join('\n  '));process.exit(1);}
 fs.mkdirSync(path.dirname(manifestPath),{recursive:true});
 if(a.manifestStale)fs.writeFileSync(manifestPath,a.serialized);
 if(a.generatedStale)fs.writeFileSync(generatedPath,a.generated);
 if(!quiet){
  for(const line of a.changes)console.log('  '+line);
  const assigned=Object.keys(a.next.characters).length,placed=PLACES.filter(p=>a.next.places[p].length).length;
  console.log(`✔ music.json: ${Object.keys(a.next.tracks).length} tracks, ${assigned} character themes, ${placed}/${PLACES.length} places with playlists; src/music-data.js ${a.generatedStale?'regenerated':'unchanged'}.`);
 }
 return a;
}

function check(){
 const a=analyze(),problems=[...a.problems];
 if(a.changes.length)problems.push('Stale track fields:\n  '+a.changes.join('\n  '));
 if(a.manifestStale&&!a.changes.length)problems.push('music.json formatting differs from tools/music.cjs output (run `npm run music:build`).');
 if(a.generatedStale)problems.push('v8/src/music-data.js is out of date (run `npm run music:build`).');
 if(problems.length){console.error('✖ Music manifest check failed.\n'+problems.join('\n'));return false;}
 console.log(`✔ Music manifest: ${Object.keys(a.next.tracks).length} tracks present with matching hashes; src/music-data.js is current.`);
 return true;
}

function importTracks(){
 const inbox=path.resolve(option('from')||defaultInbox);
 if(!fs.existsSync(inbox))throw new Error('Music folder not found: '+inbox);
 const files=fs.readdirSync(inbox).filter(f=>AUDIO.test(f)&&!/\s-\s*Copy(\s*\(\d+\))?\.[a-z0-9]+$/i.test(f)).sort();
 if(!files.length){console.log('No audio files in '+inbox);return;}
 const ffmpeg=findFfmpeg();
 if(!ffmpeg)throw new Error('ffmpeg was not found. Install it (winget install Gyan.FFmpeg) or set FFMPEG_PATH.');
 const data=readManifest(),bitrate=option('bitrate')||'128k';
 fs.mkdirSync(musicRoot,{recursive:true});
 let converted=0,skipped=0;
 for(const name of files){
  const id=idFor(name),source=fs.readFileSync(path.join(inbox,name)),sourceHash=sha256(source),file=id+'.mp3',target=path.join(musicRoot,file);
  const current=data.tracks[id];
  if(current&&current.sourceHash===sourceHash&&fs.existsSync(target)&&!has('force')){skipped++;continue;}
  // loudnorm evens out MIDI renders that differ wildly in level (EBU R128, -16 LUFS integrated, -1.5 dBTP ceiling).
  const filters=has('no-normalize')?[]:['-af','loudnorm=I=-16:TP=-1.5:LRA=11'];
  const result=spawnSync(ffmpeg,['-y','-hide_banner','-loglevel','error','-i',path.join(inbox,name),'-vn',...filters,'-codec:a','libmp3lame','-b:a',bitrate,'-ar','44100',target],{encoding:'utf8'});
  if(result.status!==0)throw new Error('ffmpeg failed for '+name+':\n'+result.stderr);
  data.tracks[id]={title:current?.title||titleFor(id),file,source:name,sourceHash};
  converted++;console.log(`  ${name}  →  ${file}  (${(fs.statSync(target).size/1048576).toFixed(1)} MB)`);
 }
 fs.writeFileSync(manifestPath,JSON.stringify(data,null,1)+'\n');
 console.log(`Imported ${converted} track(s), ${skipped} unchanged.`);
 build();
}

module.exports={readManifest,build,check,PLACES,idFor};

if(require.main===module){
 try{
  if(command==='import')importTracks();
  else if(command==='build')build();
  else if(command==='check'){if(!check())process.exit(1);}
  else{console.error(fs.readFileSync(__filename,'utf8').split('\n').slice(1,11).map(l=>l.replace(/^\/\/ ?/,'')).join('\n'));process.exit(command?1:0);}
 }catch(error){console.error('✖ '+error.message);process.exit(1);}
}
