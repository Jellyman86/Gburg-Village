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
'use strict';
const fs=require('node:fs'),path=require('node:path');
const art=require('./art.cjs');
const {resolvePlaywrightEnv}=require('./tasks.cjs');

const root=art.root,inbox=path.join(root,'art inbox'),previews=path.join(root,'test-artifacts','import');
const LAYOUTS={
 // Six cells per row: two facings x three phases. Rows: (down,up) idle, (left,right) idle, (down,up) walk, (left,right) walk.
 walk6:'0:0-2 1:0-2 1:3-5 0:3-5 2:0-2 3:0-2 3:3-5 2:3-5',
 // Four rows of 3-4 cells in down, left, right, up order: idle rows reuse the walk cells.
 walk4:'0:* 1:* 2:* 3:* 0:* 1:* 2:* 3:*',
 // One row per facing in down, left, right, up order followed by the same four walking rows.
 walk8:'0:* 1:* 2:* 3:* 4:* 5:* 6:* 7:*'
};
const FOLDERS={character:'characters',portrait:'portraits',dinosaur:'dinosaurs',companion:'companions',item:'items',effect:'effects',gimmick:'gimmicks',scene:'scenes',finale:'scenes',world:'world'};

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

function folderFor(artId){
 const category=artId.split('.')[0];
 if(!FOLDERS[category])throw new Error('Unknown art category "'+category+'". Known: '+Object.keys(FOLDERS).join(', '));
 return FOLDERS[category];
}

async function withPage(fn){
 const env=resolvePlaywrightEnv();
 const {chromium}=require(env.PLAYWRIGHT_CORE||'playwright');
 const browser=await chromium.launch({headless:true,...(env.BROWSER_PATH?{executablePath:env.BROWSER_PATH}:{})});
 try{const page=await browser.newPage();return await fn(page);}finally{await browser.close();}
}

// Everything pixel-related runs inside Chromium's Canvas. `job` is serialisable; the result carries base64 outputs.
function processInBrowser(page,job){
 return page.evaluate(async job=>{
  const load=async(base64,mime)=>{const img=new Image();img.src='data:'+mime+';base64,'+base64;await img.decode();return img;};
  const canvasOf=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
  const png=c=>c.toDataURL('image/png').split(',')[1];
  const img=await load(job.base64,job.mime),W=img.naturalWidth,H=img.naturalHeight;
  const source=canvasOf(W,H),sctx=source.getContext('2d',{willReadFrequently:true});sctx.drawImage(img,0,0);

  function detect({gap,key}){
   const d=sctx.getImageData(0,0,W,H).data;
   let opaque=true;for(let i=3;i<d.length;i+=4)if(d[i]<255){opaque=false;break;}
   const corners=[0,(W-1)*4,(H-1)*W*4,((H-1)*W+W-1)*4].every(i=>d[i]>=235&&d[i+1]>=235&&d[i+2]>=235);
   const useKey=key==='white'||(key!=='none'&&opaque&&corners);
   const solid=new Uint8Array(W*H);
   for(let i=0,p=0;i<d.length;i+=4,p++){
    const a=d[i+3];if(a<128)continue;
    if(useKey&&d[i]>=235&&d[i+1]>=235&&d[i+2]>=235)continue;
    solid[p]=1;
   }
   const rowCount=new Uint32Array(H);for(let y=0;y<H;y++){let n=0;for(let x=0;x<W;x++)n+=solid[y*W+x];rowCount[y]=n;}
   const bands=[];let start=-1,blank=0;
   for(let y=0;y<=H;y++){
    const filled=y<H&&rowCount[y]>0;
    if(filled){if(start<0)start=y;blank=0;}
    else if(start>=0){blank++;if(blank>=4||y===H){const end=y-blank+(y===H&&filled?1:0);if(end-start>=8)bands.push({top:start,bottom:end});start=-1;blank=0;}}
   }
   const cells=[];
   bands.forEach((band,b)=>{
    const h=band.bottom-band.top,minGap=gap||Math.max(4,Math.round(h*.08));
    const col=new Uint32Array(W);for(let x=0;x<W;x++){let n=0;for(let y=band.top;y<band.bottom;y++)n+=solid[y*W+x];col[x]=n;}
    const segments=[];let s=-1,g=0;
    for(let x=0;x<=W;x++){
     const filled=x<W&&col[x]>0;
     if(filled){if(s<0)s=x;g=0;}
     else if(s>=0){g++;if(g>=minGap||x===W){segments.push([s,x-g+(x===W&&filled?1:0)]);s=-1;g=0;}}
    }
    const row=[];
    for(const [x0,x1] of segments){
     let top=band.bottom,bottom=band.top,left=x1,right=x0;
     for(let y=band.top;y<band.bottom;y++)for(let x=x0;x<x1;x++)if(solid[y*W+x]){if(y<top)top=y;if(y+1>bottom)bottom=y+1;if(x<left)left=x;if(x+1>right)right=x+1;}
     if(right-left<h*.1&&bottom-top<h*.1)continue; // stray speck
     row.push({x:left,y:top,w:right-left,h:bottom-top});
    }
    row.forEach((c,i)=>cells.push({band:b,index:i,...c}));
   });
   return {bands,cells,useKey,solid};
  }

  function cellsPreview(det){
   const scale=Math.min(1,900/W),c=canvasOf(Math.round(W*scale),Math.round(H*scale)),ctx=c.getContext('2d');
   ctx.fillStyle='#223';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(source,0,0,c.width,c.height);
   ctx.lineWidth=2;ctx.font='bold 14px system-ui';ctx.textBaseline='top';
   for(const cell of det.cells){
    ctx.strokeStyle='#ffd166';ctx.strokeRect(cell.x*scale,cell.y*scale,cell.w*scale,cell.h*scale);
    const label=cell.band+'.'+cell.index;ctx.fillStyle='#000a';ctx.fillRect(cell.x*scale,cell.y*scale,ctx.measureText(label).width+8,18);ctx.fillStyle='#ffd166';ctx.fillText(label,cell.x*scale+4,cell.y*scale+2);
   }
   return png(c);
  }

  function drawCell(ctx,det,cell,dx,dy,dw,dh,flip){
   // Draw only this cell's solid pixels so neighbouring artwork in the same crop box never leaks in.
   const piece=canvasOf(cell.w,cell.h),pctx=piece.getContext('2d');
   pctx.drawImage(source,cell.x,cell.y,cell.w,cell.h,0,0,cell.w,cell.h);
   if(det.useKey){const id=pctx.getImageData(0,0,cell.w,cell.h),p=id.data;for(let i=0;i<p.length;i+=4)if(!det.solid[(cell.y+(i/4/cell.w|0))*W+cell.x+(i/4%cell.w)])p[i+3]=0;pctx.putImageData(id,0,0);}
   ctx.save();if(flip){ctx.translate(dx+dw,dy);ctx.scale(-1,1);ctx.drawImage(piece,0,0,dw,dh);}else ctx.drawImage(piece,dx,dy,dw,dh);ctx.restore();
  }

  if(job.mode==='cells'){const det=detect(job);return {width:W,height:H,bands:det.bands.length,cells:det.cells.map(({solid,...c})=>c),useKey:det.useKey,preview:cellsPreview(det)};}

  if(job.mode==='sprite'){
   const det=detect(job),cell=job.cell,foot=cell-4;
   const byBand=det.bands.map((_,b)=>det.cells.filter(c=>c.band===b));
   const rows=job.rows.map(spec=>{
    const m=/^(\d+):(\*|(\d+)(?:-(\d+))?)(!?)$/.exec(spec);if(!m)throw new Error('Bad row spec: '+spec);
    const band=byBand[Number(m[1])];if(!band)throw new Error('Row spec '+spec+' refers to a band that was not detected (found '+byBand.length+').');
    let picked=m[2]==='*'?band:band.slice(Number(m[3]),m[4]===undefined?Number(m[3])+1:Number(m[4])+1);
    if(!picked.length)throw new Error('Row spec '+spec+' selected no cells.');
    const order={1:[0,0,0,0],2:[0,1,0,1],3:[0,1,2,1],4:[0,1,2,3]}[picked.length];
    if(!order)throw new Error('Row spec '+spec+' selected '+picked.length+' cells; use 1-4.');
    return {cells:order.map(i=>picked[i]),flip:m[5]==='!'};
   });
   const used=rows.flatMap(r=>r.cells);
   const scale=Math.min(...used.map(c=>Math.min(cell/c.w,foot/c.h)));
   const out=canvasOf(cell*4,cell*rows.length),ctx=out.getContext('2d');ctx.imageSmoothingEnabled=!!job.smooth;ctx.imageSmoothingQuality='high';
   rows.forEach((row,r)=>row.cells.forEach((c,f)=>{
    const w=Math.max(1,Math.round(c.w*scale)),h=Math.max(1,Math.round(c.h*scale));
    drawCell(ctx,det,c,f*cell+Math.round((cell-w)/2),r*cell+foot-h,w,h,row.flip);
   }));
   const zoom=Math.max(1,Math.floor(768/out.width)),sheet=canvasOf(out.width*zoom,out.height*zoom),zctx=sheet.getContext('2d');
   zctx.fillStyle='#2b3a4a';zctx.fillRect(0,0,sheet.width,sheet.height);zctx.imageSmoothingEnabled=false;zctx.drawImage(out,0,0,sheet.width,sheet.height);
   zctx.strokeStyle='#ffffff55';for(let x=0;x<=4;x++){zctx.beginPath();zctx.moveTo(x*cell*zoom,0);zctx.lineTo(x*cell*zoom,sheet.height);zctx.stroke();}
   for(let y=0;y<=rows.length;y++){zctx.beginPath();zctx.moveTo(0,y*cell*zoom);zctx.lineTo(sheet.width,y*cell*zoom);zctx.stroke();}
   zctx.strokeStyle='#ff6b6b88';for(let y=0;y<rows.length;y++){zctx.beginPath();zctx.moveTo(0,(y*cell+foot)*zoom);zctx.lineTo(sheet.width,(y*cell+foot)*zoom);zctx.stroke();}
   return {width:out.width,height:out.height,scale,cells:det.cells.map(({solid,...c})=>c),bands:det.bands.length,useKey:det.useKey,output:png(out),sheetPreview:png(sheet),cellsPreview:cellsPreview(det)};
  }

  if(job.mode==='portrait'||job.mode==='scene'||job.mode==='image'){
   const w=job.width||W,h=job.height||H;
   const out=canvasOf(w,h),ctx=out.getContext('2d');ctx.imageSmoothingEnabled=!!job.smooth;ctx.imageSmoothingQuality='high';ctx.drawImage(img,0,0,w,h);
   if(job.format==='webp'){const url=out.toDataURL('image/webp',.92);if(!url.startsWith('data:image/webp'))throw new Error('WebP encoding unavailable');return {width:w,height:h,output:url.split(',')[1]};}
   return {width:w,height:h,output:png(out)};
  }
  throw new Error('Unknown mode '+job.mode);
 },job);
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
 write(artId,current?current.file:`scenes/${id}.${format}`,Buffer.from(result.output,'base64'),source);
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
