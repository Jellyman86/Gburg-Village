#!/usr/bin/env node
// Single task runner shared by package.json scripts, docs and Copilot sessions.
// Usage: node tools/tasks.cjs <task> [--suites=a,b] [--layouts=1280x900,...]
'use strict';
const {spawnSync}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path');

const root=path.resolve(__dirname,'..');
const LIVE='v8'; // The living version. Earlier folders are frozen archives (see tools/check-archive.cjs).
const live=path.join(root,LIVE);
const HOSTED_ORIGIN='https://jellyman86.github.io/Gburg-Village';
const ALL_SUITES='world,hawaii,music,studio,scenes,danger,combat';
const ALL_LAYOUTS='1280x900,390x844,844x390';
const QUICK_SUITES='world,hawaii,music,studio';
const QUICK_LAYOUTS='1280x900';

const args=process.argv.slice(2);
const task=args.find(a=>!a.startsWith('--'));
const flag=name=>{const hit=args.find(a=>a.startsWith('--'+name+'='));return hit?hit.slice(name.length+3):undefined;};

function exists(p){try{return fs.existsSync(p);}catch{return false;}}
function listFiles(dir,pattern){return exists(dir)?fs.readdirSync(dir).filter(f=>pattern.test(f)).map(f=>path.join(dir,f)):[];}

// Locate playwright-core and a Chromium binary without requiring downloads.
// Order: explicit env vars > npm-installed playwright > Python Playwright's bundled driver > system Chrome/Edge.
function resolvePlaywrightEnv(){
 const env={...process.env};
 let corePackage=null;
 if(env.PLAYWRIGHT_CORE){
  corePackage=env.PLAYWRIGHT_CORE;
 }else{
  try{corePackage=path.dirname(require.resolve('playwright/package.json',{paths:[root]}));}
  catch{
   const pythonRoots=[process.env.LOCALAPPDATA&&path.join(process.env.LOCALAPPDATA,'Programs','Python')].filter(Boolean);
   for(const pyRoot of pythonRoots){
    if(!exists(pyRoot))continue;
    for(const version of fs.readdirSync(pyRoot).sort().reverse()){
     const candidate=path.join(pyRoot,version,'Lib','site-packages','playwright','driver','package');
     if(exists(path.join(candidate,'package.json'))){corePackage=candidate;env.PLAYWRIGHT_CORE=candidate;break;}
    }
    if(corePackage)break;
   }
  }
 }
 if(!corePackage){
  console.error('No Playwright found. Run `npm install` or set PLAYWRIGHT_CORE to a playwright-core package directory.');
  process.exit(2);
 }
 if(!env.BROWSER_PATH){
  const cache=process.env.PLAYWRIGHT_BROWSERS_PATH||(process.env.LOCALAPPDATA&&path.join(process.env.LOCALAPPDATA,'ms-playwright'));
  // The npm `playwright` package keeps browsers.json inside its playwright-core dependency.
  const browsersJson=[path.join(corePackage,'browsers.json'),(()=>{try{return path.join(path.dirname(require.resolve('playwright-core/package.json',{paths:[corePackage,root]})),'browsers.json');}catch{return null;}})()].filter(Boolean).find(exists);
  const expected=[];
  try{
   const chromium=JSON.parse(fs.readFileSync(browsersJson,'utf8')).browsers.find(b=>b.name==='chromium');
   if(chromium&&cache)expected.push(path.join(cache,'chromium-'+chromium.revision,'chrome-win','chrome.exe'),path.join(cache,'chromium-'+chromium.revision,'chrome-win64','chrome.exe'));
  }catch{}
  if(!expected.some(exists)){
   // Playwright's own revision is not downloaded; fall back to any cached Chromium, then system Chrome/Edge.
   const fallbacks=[];
   if(cache&&exists(cache))for(const dir of fs.readdirSync(cache).filter(d=>/^chromium-\d+$/.test(d)).sort().reverse())fallbacks.push(path.join(cache,dir,'chrome-win','chrome.exe'),path.join(cache,dir,'chrome-win64','chrome.exe'));
   for(const programFiles of [process.env['ProgramFiles(x86)'],process.env.ProgramFiles].filter(Boolean))fallbacks.push(path.join(programFiles,'Google','Chrome','Application','chrome.exe'),path.join(programFiles,'Microsoft','Edge','Application','msedge.exe'));
   const found=fallbacks.find(exists);
   if(found)env.BROWSER_PATH=found;
  }
 }
 return env;
}

function run(label,command,commandArgs,options={}){
 const started=Date.now();
 process.stdout.write(`\n▶ ${label}\n`);
 const result=spawnSync(command,commandArgs,{stdio:'inherit',cwd:root,shell:false,...options});
 const seconds=((Date.now()-started)/1000).toFixed(1);
 if(result.status!==0){
  console.error(`✖ ${label} failed after ${seconds}s`);
  process.exit(result.status||1);
 }
 console.log(`✔ ${label} (${seconds}s)`);
}

function node(label,script,extra=[],env=process.env){run(label,process.execPath,[script,...extra],{env});}

const tasks={
 syntax(){
  const files=[
   ...listFiles(path.join(live,'src'),/\.js$/),
   ...listFiles(path.join(live,'tests'),/\.c?js$/),
   ...listFiles(path.join(live,'tools'),/\.c?js$/),
   ...listFiles(path.join(root,'tools'),/\.cjs$/)
  ];
  run(`Syntax check (${files.length} files)`,process.execPath,['--check',...files]);
 },
 contracts(){
  const env=resolvePlaywrightEnv();
  node('Art manifest',path.join(root,'tools','art.cjs'),['check']);
  node('Music manifest',path.join(root,'tools','music.cjs'),['check']);
  node('Sprite data',path.join(root,'tools','sprites.cjs'),['check']);
  node('Scene geometry',path.join(root,'tools','geometry.cjs'),['check']);
  node('Geometry contracts',path.join(live,'tests','geometry.cjs'),[],env);
  node('Sprite contracts',path.join(live,'tests','sprites.cjs'),[],env);
  node('Music contracts',path.join(live,'tests','music.cjs'),[],env);
  node('Area contracts',path.join(live,'tests','areas.cjs'),[],env);
  node('World contracts',path.join(live,'tests','world.cjs'),[],env);
 },
 browser(suites,layouts,origin){
  const env=resolvePlaywrightEnv();
  env.V8_TEST_SUITES=flag('suites')||process.env.V8_TEST_SUITES||suites;
  env.V8_TEST_LAYOUTS=flag('layouts')||process.env.V8_TEST_LAYOUTS||layouts;
  if(origin)env.V8_TEST_ORIGIN=origin;
  const where=origin?origin:'local';
  if(env.BROWSER_PATH)console.log('Browser: '+env.BROWSER_PATH);
  node(`Browser suites [${env.V8_TEST_SUITES}] on [${env.V8_TEST_LAYOUTS}] (${where})`,path.join(live,'tests','run.cjs'),[],env);
 },
 'test:quick'(){tasks.syntax();tasks.contracts();tasks.browser(QUICK_SUITES,QUICK_LAYOUTS);},
 'test:full'(){tasks.syntax();tasks.contracts();tasks.browser(ALL_SUITES,ALL_LAYOUTS);},
 'test:hosted'(){tasks.browser(ALL_SUITES,ALL_LAYOUTS,flag('origin')||HOSTED_ORIGIN);},
 'check:archive'(){node('Frozen archive check',path.join(root,'tools','check-archive.cjs'));},
 'art:build'(){node('Art manifest build',path.join(root,'tools','art.cjs'),['build']);},
 'art:check'(){node('Art manifest',path.join(root,'tools','art.cjs'),['check']);},
 'art:import'(){node('Import art',path.join(root,'tools','import-art.cjs'),args.filter(a=>a!==task),resolvePlaywrightEnv());},
 'music:import'(){node('Import music',path.join(root,'tools','music.cjs'),['import',...args.filter(a=>a!==task)]);},
 'music:build'(){node('Music manifest build',path.join(root,'tools','music.cjs'),['build']);},
 'music:check'(){node('Music manifest',path.join(root,'tools','music.cjs'),['check']);},
 'geometry:build'(){node('Scene geometry build',path.join(root,'tools','geometry.cjs'),['build']);},
 'geometry:check'(){node('Scene geometry',path.join(root,'tools','geometry.cjs'),['check']);},
 'sprites:build'(){node('Sprite data build',path.join(root,'tools','sprites.cjs'),['build']);},
 'sprites:check'(){node('Sprite data',path.join(root,'tools','sprites.cjs'),['check']);},
 studio(){node('Gburg Studio',path.join(root,'tools','studio-server.cjs'));},
 'art:provenance'(){node('Inbox provenance',path.join(root,'tools','import-art.cjs'),['check'],resolvePlaywrightEnv());},
 predeploy(){tasks['check:archive']();tasks['test:full']();},
 serve(){node('Local read-only server',path.join(live,'tools','server.cjs'));},
 env(){
  const env=resolvePlaywrightEnv();
  console.log(JSON.stringify({node:process.version,live:LIVE,PLAYWRIGHT_CORE:env.PLAYWRIGHT_CORE||'(npm playwright)',BROWSER_PATH:env.BROWSER_PATH||'(playwright default)'},null,2));
 },
 help(){
  console.log(`Gburg Village tasks (living version: ${LIVE}/)\n`);
  console.log(['test:quick     syntax + contracts + world/hawaii browser suite, desktop only (~1-2 min)',
   'test:full      syntax + contracts + every suite on desktop, portrait and landscape',
   'test:hosted    every suite against the published site (--origin=... to override)',
   'syntax         node --check on live sources, tests and tools',
   'contracts      pure Node geometry/world contract tests (no browser)',
   'browser        browser suites; --suites=world,hawaii --layouts=1280x900 narrow the run',
   'check:archive  verify frozen V1-V7 folders match the archive/v1-v7 tag',
   'art:build      refresh hashes/dimensions in v8/data/art.json and regenerate v8/src/art.js',
   'art:check      verify every manifest asset exists with matching hash/size and art.js is current',
   'art:import     import from the art inbox: -- sprite|portrait|scene|image|cells|check ... (see tools/import-art.cjs)',
   'art:provenance verify imported files still match their inbox originals (skips when the inbox is absent)',
   'music:import   convert new/changed tracks from Music/ into v8/assets/music/*.mp3 and update data/music.json',
   'music:build    sync track hashes and regenerate v8/src/music-data.js after editing data/music.json',
   'music:check    verify music.json, files and music-data.js agree',
   'studio         Gburg Studio (World collision editor, more tabs to come) + game preview at http://127.0.0.1:5181/'+LIVE+'/studio/',
   'geometry:build validate scene-geometry.json against the live scenes and regenerate scene-geometry-data.js',
   'geometry:check verify scene geometry data is valid and current',
   'sprites:build  validate v8/data/sprites.json against the art manifest and regenerate sprites-data.js',
   'sprites:check  verify sprite data (roster, walk quirks, pose clips) is valid and current',
   'predeploy      check:archive + test:full',
   'serve          read-only local preview at http://127.0.0.1:5180/'+LIVE+'/',
   'env            print the Node/Playwright/browser the tasks will use'].join('\n'));
 }
};

module.exports={resolvePlaywrightEnv,LIVE,root,live};

if(require.main===module){
 if(!task||!tasks[task]){
  if(task)console.error('Unknown task: '+task+'\n');
  tasks.help();
  process.exit(task?1:0);
 }
 if(task==='browser')tasks.browser(ALL_SUITES,ALL_LAYOUTS);else tasks[task]();
}
