const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const data=require('../src/music-data.js'),PLACES=['village','world','jet','hawaii','nyc','montage','battle','cafe','omen'];
const scope={window:{}};vm.createContext(scope);
for(const name of ['art','action-art','characters'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..','src',name+'.js'),'utf8'),scope);
const characters=Object.keys(scope.window.CHARACTERS);
assert(Object.keys(data.tracks).length>0,'At least one music track is shipped');
for(const [id,track] of Object.entries(data.tracks)){
 const file=path.join(__dirname,'..',data.root,track.file);
 assert(fs.existsSync(file),'Track file exists: '+id);
 assert(/\.mp3$/i.test(track.file),'Tracks are MP3 for universal playback: '+id);
 assert(track.title&&track.hash?.length===64,'Track has title and hash: '+id);
}
for(const [character,track] of Object.entries(data.characters)){
 assert(characters.includes(character),'Character theme refers to a roster member: '+character);
 assert(data.tracks[track],'Character theme refers to a shipped track: '+character+' → '+track);
}
for(const place of Object.keys(data.places))assert(PLACES.includes(place),'Known place: '+place);
for(const place of PLACES)for(const track of data.places[place]||[])assert(data.tracks[track],`Place ${place} lists shipped track ${track}`);
for(const place of data.characterPlaces)assert(PLACES.includes(place),'characterPlaces are known places');
const music=fs.readFileSync(path.join(__dirname,'..','src','music.js'),'utf8');
for(const mode of ['village','battle','cafe','omen','jet','hawaii'])assert(music.includes(mode+':'),'Original synthesized theme retained: '+mode);
assert(!fs.readFileSync(path.join(__dirname,'..','src','game.js'),'utf8').includes('function compose('),'Synth composer lives in music.js, not game.js');
console.log(`PASS: ${Object.keys(data.tracks).length} MP3 tracks present, ${Object.keys(data.characters).length} hero themes valid, place playlists valid, original themes retained.`);
