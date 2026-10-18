// Gburg Studio · Files: a map of where the tunable numbers and the art prompts live.
// Each entry names a repo file and a pattern; the page fetches the file and shows the line the pattern is on, so the
// "VS Code" link jumps straight there and stays correct as the code moves.
(()=>{
 'use strict';
 const GITHUB='https://github.com/Jellyman86/Gburg-Village/blob/main/';
 const GROUPS=[
  {title:'Dinosaurs',blurb:'Health, damage and where each dinosaur appears.',items:[
   {name:'Dinosaur health, armor, size and speed',path:'v8/src/combat.js',find:/const species=Object\.freeze/,
    what:'One line per species: hp (health), armor, size and hitRadius (how big it is and how easy to hit), speed, sight, and how long it chases or rests. Boss health numbers live here too (Spinosaurus, Brontosaurus, Stegosaurus, Pachycephalosaurus).'},
   {name:'Dinosaur attack damage',path:'v8/src/enemy-attacks.js',find:/const profiles=Object\.freeze/,
    what:'Per species: damage, range, windup (warning time) and cooldown for the attack that hurts your heroes.'},
   {name:'Where dinosaurs appear (new destinations)',path:'v8/src/destinations.js',find:/enemies:\[/,
    what:'Each scene has an enemies: list (kind, x, y, boss, scripted) and swarms: (compy counts). Search for the scene id to change what lives there.'},
   {name:'Where dinosaurs appear (Gaithersburg streets)',path:'v8/src/game.js',find:/const extraHomes=\{/,
    what:'The original village scenes: extra dinosaurs per street, plus dinoKinds just above for each street’s main dinosaur.'},
   {name:'Scripted fights and rescues',path:'v8/src/scene-scripts.js',find:/function vegasNorth/,
    what:'The choreography for Drew & Alex, Kelce & Taylor, Bryce and the Panthers, Manny’s duel (punch damage, knockdowns) and Josh at Niagara.'}
  ]},
  {title:'Heroes',blurb:'Stats, speed and where each hero is unlocked.',items:[
   {name:'Hero stats',path:'v8/src/rpg.js',find:/const profiles=\{/,
    what:'Per hero: [max health, strength, quickness, dexterity, defense]. New heroes without a line use DEFAULT_PROFILE a few lines below.'},
   {name:'Hero walk speed, run speed, animation rates, portraits',path:'v8/data/sprites.json',find:/"characters"/,
    what:'Every character’s sheets, speeds and frame rates, plus all pose clips (hurt, win, attack…). Easier to change in the Sprites tab, which writes this file.'},
   {name:'Where to find each hero (hints)',path:'v8/src/story.js',find:/const hints=\{/,
    what:'The “Find …” notes in the party menu for heroes unlocked by a rescue or duel.'}
  ]},
  {title:'Weapons, items and powers',blurb:'What each hero’s power does and what equipment adds.',items:[
   {name:'Power cooldown, range and projectile speed',path:'v8/src/powers.js',find:/const definitions=Object\.freeze/,
    what:'One line per hero power: cooldown, duration, range or projectile speed. A power can set its own damage; otherwise it uses the per-type table.'},
   {name:'Damage per power type',path:'v8/src/powers.js',find:/power\.damage\?\?/,
    what:'The table on this line gives base damage for each kind (punch, football, sword, grenade…). Hero strength adds a quarter of its value on top; the target’s armor is subtracted.'},
   {name:'Weapons and healing items',path:'v8/src/rpg.js',find:/const items=Object\.freeze/,
    what:'The Japanese sword (+strength), grenades, food that heals, and their descriptions.'}
  ]},
  {title:'Art prompts and importing',blurb:'Everything for making sprites with ChatGPT and getting them into the game.',items:[
   {name:'Prompts for sprites and all their animations',path:'docs/ART-SPEC.md',find:/^# Art spec/m,
    what:'Paste-ready ChatGPT briefs: walk sheet, one file per action or emotion pose, portrait, scene background, dinosaur or animal. Includes the cell sizes and frame rules the importer expects.'},
   {name:'Importing art from the command line',path:'docs/DEVELOPMENT.md',find:/import-art\.cjs sprite/,
    what:'The importer commands and options (sprite, pose, portrait, scene, prop, --columns, --key checker) plus the rest of the developer workflow.'}
  ]},
  {title:'Also handy',blurb:'',items:[
   {name:'World-map sites and icons',path:'v8/src/world-travel.js',find:/const sites=\[/,what:'Where each destination sits on the world map, its icon and its entry point.'},
   {name:'Music tracks and places',path:'v8/data/music.json',find:/"places"/,what:'Which track plays where. Import with node tools/music.cjs, then npm run music:build.'},
   {name:'Walkable areas and exits (Studio World tab)',path:'v8/data/scene-geometry.json',find:null,what:'Collision shapes saved by the World tab. Edit them there rather than by hand.'}
  ]}
 ];
 const $=(tag,attrs={},...kids)=>{const el=Object.assign(document.createElement(tag),attrs);el.append(...kids);return el;};
 const status=document.getElementById('status');
 let root=null;

 async function lineOf(item){
  if(!item.find)return null;
  try{
   const response=await fetch(new URL('../../../'+item.path,location.href),{cache:'no-store'});
   if(!response.ok)return null;
   const text=await response.text(),match=item.find.exec(text);
   return match?text.slice(0,match.index).split('\n').length:null;
  }catch{return null;}
 }
 function card(item){
  const line=$('span',{className:'line'}),links=$('div',{className:'links'});
  const view=$('a',{href:new URL('../../../'+item.path,location.href).href,target:'_blank',rel:'noopener',textContent:'View'});
  const code=$('a',{textContent:'VS Code',title:'Open in VS Code at this line'});
  const github=$('a',{href:GITHUB+item.path,target:'_blank',rel:'noopener',textContent:'GitHub',title:'Published copy on GitHub'});
  const copy=$('button',{type:'button',textContent:'Copy path'});
  copy.addEventListener('click',async()=>{
   try{await navigator.clipboard.writeText(item.path);copy.textContent='Copied';copy.classList.add('copied');setTimeout(()=>{copy.textContent='Copy path';copy.classList.remove('copied');},1200);}
   catch{window.prompt('Copy this path',item.path);}
  });
  links.append(view,code,github,copy);
  const setLine=n=>{
   line.textContent=n?'line '+n:'';
   code.hidden=!root;
   if(root)code.href='vscode://file/'+encodeURI((root+'/'+item.path).replace(/\\/g,'/'))+(n?':'+n:'');
   github.href=GITHUB+item.path+(n?'#L'+n:'');
  };
  setLine(null);
  lineOf(item).then(setLine);
  return $('div',{className:'card'},
   $('div',{},$('h3',{textContent:item.name}),$('p',{textContent:item.what}),$('div',{className:'where'},$('code',{textContent:item.path}),line)),
   links);
 }
 async function start(){
  // The local studio server tells us the repo folder so "VS Code" links work; on a hosted copy that link is hidden.
  try{const response=await fetch('/api/studio',{cache:'no-store'});if(response.ok){const body=await response.json();root=body.root||null;}}catch{/* hosted: no local root */}
  status.textContent=root?'Local · '+root:'Read-only copy';
  const host=document.getElementById('groups');
  for(const group of GROUPS){
   host.append($('section',{className:'group'},$('h2',{textContent:group.title}),group.blurb?$('p',{className:'blurb',textContent:group.blurb}):'',...group.items.map(card)));
  }
 }
 start();
})();
