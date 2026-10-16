#!/usr/bin/env node
// Import ChatGPT art from the inbox into the living version's manifest-managed assets.
//
//   node tools/import-art.cjs sprite <id> [--pose walk] [--from "Jeff Sprites.png"] [--layout walk6|walk4|<rows>] [--cell 64] [--gap N] [--key white] [--smooth] [--allow-resize]
//   node tools/import-art.cjs portrait <id> [--from "Kate Portrait.png"] [--smooth]
//   node tools/import-art.cjs scene <id> [--from "Scene - Paris.png"] [--width N] [--height N] [--png] [--allow-resize]
//   node tools/import-art.cjs image <art.id> --from <file> [--to <relative asset path>] [--allow-resize]
//   node tools/import-art.cjs cells --from <file> [--gap N] [--key white]        detect sprite cells and write a numbered preview only
//   node tools/import-art.cjs check                                               verify imported files still match their inbox originals
//
// Sprite layouts map detected cells (band.cell, numbered in the cells preview) onto output rows. Each output row is
// "band:first-last" (3 cells become frames [0,1,2,1]; 4 cells are used as-is; 1 cell repeats). Append "!" to mirror.
// Output rows for walk sheets are down, left, right, up idle followed by the same four walking rows (walkRowOffset 4).
// Character imports also register the roster entry / pose clip in v8/data/sprites.json, so no code edit is needed.
'use strict';
const fs=require('node:fs'),path=require('node:path');
const art=require('./art.cjs'),sprites=require('./sprites.cjs');
const {resolvePlaywrightEnv}=require('./tasks.cjs');

const root=art.root,inbox=path.join(root,'art inbox'),previews=path.join(root,'test-artifacts','import');
// Layout presets live with the shared sheet tools so the CLI and the studio agree.
const sheetToolsPath=path.join(art.live,'studio','sheet-tools.js');
const LAYOUTS=(()=>{const scope={};require('node:vm').runInNewContext(fs.readFileSync(sheetToolsPath,'utf8'),{globalThis:scope,window:undefined,document:undefined,Image:undefined});return scope.SHEET_TOOLS.LAYOUTS;})();
const folderFor=art.folderFor;

const args=process.argv.slice(2),command=args[0];
const positional=args.slice(1).filter((a,i,list)=>!a.startsWith('--')&&!(i>0&&/^--(from|pose|layout|cell|gap|key|width|height|to)$/.test(list[i-1])));
const option=name=>{const i=args.indexOf('--'+name);if(i<0)return undefined;const eq=args.find(a=>a.startsWith('--'+name+'='));return eq?eq.slice(name.length+3):args[i+1];};
const has=name=>args.some(a=>a==='--'+name||a.startsWith('--'+name+'='));
const normalize=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');

function listInbox(){
 if(!fs.existsSync(inbox))throw new Error('The art inbox folder is missing: '+inbox);
 return fs.readdirSync(inbox).filter(f=>/\.(png|webp|jpe?g)$/i.test(f));
}
// Find the inbox file for an id: an exact --from name, or the single file whose name contains every id token plus the type keyword.
function findSource(kind,id){
 const from=option('from');
 const files=listInbox();
 if(from){
  const exact=files.find(f=>f===from||normalize(f)===normalize(from)||normalize(path.parse(f).name)===normalize(path.parse(from).name));
  if(!exact)throw new Error('No inbox file named "'+from+'". Inbox has:\n  '+files.join('\n  '));
  return exact;
 }
 const tokens=id.split(/[-.]/).map(normalize).filter(Boolean);
 const keyword={sprite:['sprite'],portrait:['portrait','portait'],scene:['scene'],image:[]}[kind]||[];
 const matches=files.filter(f=>{const n=normalize(f);return tokens.every(t=>n.includes(t))&&(keyword.length===0||keyword.some(k=>n.includes(k)));});
 if(matches.length===1)return matches[0];
 throw new Error((matches.length?'Several inbox files match "'+id+'":\n  '+matches.join('\n  '):'No inbox file matches "'+id+'" for '+kind+'.')+'\nUse --from "<file name>".');
}

async function withPage(fn){
 const env=resolvePlaywrightEnv();
 const {chromium}=require(env.PLAYWRIGHT_CORE||'playwright');
 const browser=await chromium.launch({headless:true,...(env.BROWSER_PATH?{executablePath:env.BROWSER_PATH}:{})});
 try{const page=await browser.newPage();return await fn(page);}finally{await browser.close();}
}

// Everything pixel-related runs inside Chromium's Canvas through the shared v8/studio/sheet-tools.js module (the same code
// the studio's Sprites tab uses). `job` is serialisable; the result carries base64 outputs.
async function processInBrowser(page,job){
 await page.addScriptTag({content:fs.readFileSync(sheetToolsPath,'utf8')});
 return page.evaluate(job=>window.SHEET_TOOLS.process(job),job);
}
function readSource(name){
 const file=path.join(inbox,name),bytes=fs.readFileSync(file);
 const mime={'.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg'}[path.extname(name).toLowerCase()];
 return {name,bytes,mime,base64:bytes.toString('base64'),hash:art.sha256(bytes)};
}

function existing(artId){return art.readManifest().assets[artId]||null;}

function guardResize(artId,current,width,height){
 if(current&&(current.width!==width||current.height!==height)&&!has('allow-resize'))
  throw new Error(`${artId} is currently ${current.width}x${current.height}; the new image is ${width}x${height}. Collision/frame data depends on size. Pass --allow-resize if this is intended.`);
}

function write(artId,relativeFile,bytes,source){
 const target=path.join(art.assetRoot,relativeFile);
 fs.mkdirSync(path.dirname(target),{recursive:true});
 fs.writeFileSync(target,bytes);
 art.upsert(artId,{file:relativeFile,source:source.name,sourceHash:source.hash});
 const entry=art.readManifest().assets[artId];
 console.log(`✔ ${artId} → v8/assets/${relativeFile} (${entry.width}x${entry.height}, ${(bytes.length/1024).toFixed(0)} KB) from "${source.name}"`);
 console.log('  Manifest and src/art.js updated. Run `npm run test:quick` and look at the game.');
}

function savePreview(name,base64){
 fs.mkdirSync(previews,{recursive:true});
 const file=path.join(previews,name);fs.writeFileSync(file,Buffer.from(base64,'base64'));return file;
}

async function sprite(){
 const id=positional[0];if(!id)throw new Error('Usage: sprite <character or kind id> [--pose walk] [--from file] [--layout walk6|walk4|walk8|"rows"]');
 const pose=option('pose')||'walk',category=option('category')||'character';
 const artId=pose==='walk'&&category!=='character'?`${category}.${id}`:`${category}.${id}.${pose}`;
 const file=`${folderFor(artId)}/${id}${pose==='walk'?'':'-'+pose}.png`;
 const source=readSource(findSource('sprite',id));
 const layout=option('layout')||'walk6',rows=(LAYOUTS[layout]||layout).trim().split(/\s+/);
 const cell=Number(option('cell')||64),current=existing(artId);
 const result=await withPage(page=>processInBrowser(page,{mode:'sprite',base64:source.base64,mime:source.mime,rows,cell,gap:Number(option('gap'))||0,key:option('key'),smooth:has('smooth')}));
 guardResize(artId,current,result.width,result.height);
 const cellsFile=savePreview(id+'-'+pose+'-cells.png',result.cellsPreview),sheetFile=savePreview(id+'-'+pose+'-sheet.png',result.sheetPreview);
 console.log(`Detected ${result.bands} bands / ${result.cells.length} cells${result.useKey?' (white background keyed out)':''}; uniform scale ${result.scale.toFixed(3)}.`);
 write(artId,file,Buffer.from(result.output,'base64'),source);
 console.log('  Previews: '+path.relative(root,cellsFile)+'  |  '+path.relative(root,sheetFile));
 if(category==='character'){
  if(pose==='walk')registerCharacter(id,{walkRowOffset:rows.length>=8?4:0});
  else{
   const status=sprites.registerPose(id,pose,{frames:result.rowFrames[0],fps:6,frameWidth:cell,frameHeight:cell});
   console.log(status==='added'?`  Registered pose "${pose}" for ${id} in sprites.json (${result.rowFrames[0]} frame(s), 6 fps, looping) — adjust fps/loop there if needed.`:`  sprites.json already describes ${id}.${pose}; kept its settings.`);
  }
 }
}

// A character joins the roster once both its walk sheet and portrait exist in the manifest.
function registerCharacter(id,fields){
 const assets=art.readManifest().assets;
 if(!assets[`character.${id}.walk`]||!assets[`portrait.${id}`]){
  if(!sprites.readData().characters[id])console.log(`  ${id} is not in the roster yet: import the ${assets[`portrait.${id}`]?'walk sheet':'portrait'} too and it will be registered in sprites.json automatically.`);
  return;
 }
 const status=sprites.registerCharacter(id,fields);
 console.log(status==='added'?`  Added ${id} to the playable roster in sprites.json (default speeds; edit there to tune).`:`  sprites.json already lists ${id}; kept its settings.`);
}

async function cells(){
 const name=findSource('image',option('from')||'');
 const source=readSource(name);
 const result=await withPage(page=>processInBrowser(page,{mode:'cells',base64:source.base64,mime:source.mime,gap:Number(option('gap'))||0,key:option('key')}));
 const file=savePreview(path.parse(name).name.replace(/[^a-z0-9]+/gi,'-').toLowerCase()+'-cells.png',result.preview);
 console.log(`${name}: ${result.width}x${result.height}, ${result.bands} bands, ${result.cells.length} cells${result.useKey?' (white background keyed out)':''}`);
 const perBand={};for(const c of result.cells)(perBand[c.band]=perBand[c.band]||[]).push(c);
 for(const [b,list] of Object.entries(perBand))console.log(`  band ${b}: ${list.length} cells  `+list.map(c=>`${c.w}x${c.h}`).join(' '));
 console.log('  Preview: '+path.relative(root,file)+'\n  Compose a layout like "0:0-2 1:0-2 ..." from the band.cell labels.');
}

async function portrait(){
 const id=positional[0];if(!id)throw new Error('Usage: portrait <id> [--from file]');
 const artId='portrait.'+id,source=readSource(findSource('portrait',id));
 const result=await withPage(page=>processInBrowser(page,{mode:'portrait',base64:source.base64,mime:source.mime,width:128,height:128,smooth:has('smooth')}));
 write(artId,'portraits/'+id+'.png',Buffer.from(result.output,'base64'),source);
 registerCharacter(id,{});
}

async function scene(){
 const id=positional[0];if(!id)throw new Error('Usage: scene <id> [--from file] [--width N] [--height N] [--png]');
 const artId=(option('category')||'scene')+'.'+id,source=readSource(findSource('scene',id)),current=existing(artId);
 const dims=art.dimensions(source.bytes,source.name);
 let width=Number(option('width'))||0,height=Number(option('height'))||0;
 if(current&&!width&&!height&&!has('allow-resize')){width=current.width;height=current.height;}
 if(width&&!height)height=Math.round(dims.height*width/dims.width);
 if(height&&!width)width=Math.round(dims.width*height/dims.height);
 const format=has('png')?'png':current?path.extname(current.file).slice(1):'webp';
 const result=await withPage(page=>processInBrowser(page,{mode:'scene',base64:source.base64,mime:source.mime,width:width||dims.width,height:height||dims.height,smooth:true,format}));
 guardResize(artId,current,result.width,result.height);
 write(artId,option('to')||(current?current.file:`scenes/${id}.${format}`),Buffer.from(result.output,'base64'),source);
}

async function image(){
 const artId=positional[0];if(!artId||!artId.includes('.'))throw new Error('Usage: image <category.name[.variant]> --from file [--to relative/path.png]');
 const current=existing(artId),source=readSource(findSource('image',option('from')||''));
 const dims=art.dimensions(source.bytes,source.name);
 guardResize(artId,current,dims.width,dims.height);
 const file=option('to')||(current?current.file:`${folderFor(artId)}/${artId.split('.').slice(1).join('-')}${path.extname(source.name).toLowerCase()}`);
 write(artId,file,source.bytes,source);
}

function check(){
 const data=art.readManifest(),tracked=Object.entries(data.assets).filter(([,e])=>e.source);
 if(!fs.existsSync(inbox)){console.log(`• Inbox not present; skipped provenance for ${tracked.length} imported assets.`);return true;}
 const problems=[];let verified=0;
 for(const [id,entry] of tracked){
  const file=path.join(inbox,entry.source);
  if(!fs.existsSync(file)){problems.push(`${id}: inbox original "${entry.source}" is missing`);continue;}
  const hash=art.sha256(fs.readFileSync(file));
  if(hash!==entry.sourceHash)problems.push(`${id}: "${entry.source}" changed since import (re-import or accept with a new import)`);else verified++;
 }
 if(problems.length){console.error('✖ Inbox provenance:\n  '+problems.join('\n  '));return false;}
 console.log(`✔ Inbox provenance: ${verified} imported assets match their originals.`);return true;
}

(async()=>{
 const commands={sprite,portrait,scene,image,cells,check:async()=>{if(!check())process.exitCode=1;}};
 if(!commands[command]){
  console.error(fs.readFileSync(__filename,'utf8').split('\n').slice(1,13).map(l=>l.replace(/^\/\/ ?/,'')).join('\n'));
  process.exit(command?1:0);
 }
 await commands[command]();
})().catch(error=>{console.error('✖ '+error.message);process.exitCode=1;});
