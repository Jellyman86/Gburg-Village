// Sheet tools shared by the art importer (tools/import-art.cjs runs this in headless Chromium) and the studio's
// Sprites tab. Pure Canvas code: detect the drawings on a ChatGPT export, map them onto the game's cell grid, and
// scale portraits/scenes. Nothing here touches the manifest or the file system.
//
// detect(source,{gap,key})      → {bands,cells,useKey,solid}  cells are {band,index,x,y,w,h} in source pixels
// parseRows(specs,det)          → [{cells:[4 cells],flip,dx,dy}]  from "band:first-last[!]" specs (see LAYOUTS)
// compose(source,det,rows,opts) → {canvas,scale}  the output sheet (4 frames x rows.length cells)
// cellsPreview / sheetPreview   → canvases for eyeballing the detection and the result
// process(job)                  → importer entry point: {mode,base64,mime,...} → base64 outputs
((root)=>{
 'use strict';
 const canvasOf=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
 const png=c=>c.toDataURL('image/png').split(',')[1];
 const LAYOUTS={
  // Six cells per row: two facings x three phases. Rows: (down,up) idle, (left,right) idle, (down,up) walk, (left,right) walk.
  walk6:'0:0-2 1:0-2 1:3-5 0:3-5 2:0-2 3:0-2 3:3-5 2:3-5',
  // Four rows of 3-4 cells in down, left, right, up order: idle rows reuse the walk cells.
  walk4:'0:* 1:* 2:* 3:* 0:* 1:* 2:* 3:*',
  // One row per facing in down, left, right, up order followed by the same four walking rows.
  walk8:'0:* 1:* 2:* 3:* 4:* 5:* 6:* 7:*',
  // A single action row (three cells become frames [0,1,2,1]).
  pose:'0:*'
 };
 const WALK_ROW_NAMES=['idle down','idle left','idle right','idle up','walk down','walk left','walk right','walk up'];

 async function load(src){const img=new Image();img.src=src;await img.decode();return img;}
 // A source is any drawable with width/height; we keep a canvas copy with readable pixels.
 function sourceOf(image){
  const W=image.naturalWidth||image.width,H=image.naturalHeight||image.height;
  const c=canvasOf(W,H),ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
  return {canvas:c,ctx,W,H};
 }

 function detect(source,{gap=0,key}={}){
  const {ctx,W,H}=source,d=ctx.getImageData(0,0,W,H).data;
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
  return {bands,cells,useKey,solid,W,H};
 }

 function cellsPreview(source,det,{maxWidth=900}={}){
  const {W,H}=source,scale=Math.min(1,maxWidth/W),c=canvasOf(Math.round(W*scale),Math.round(H*scale)),ctx=c.getContext('2d');
  ctx.fillStyle='#223';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(source.canvas,0,0,c.width,c.height);
  ctx.lineWidth=2;ctx.font='bold 14px system-ui';ctx.textBaseline='top';
  for(const cell of det.cells){
   ctx.strokeStyle='#ffd166';ctx.strokeRect(cell.x*scale,cell.y*scale,cell.w*scale,cell.h*scale);
   const label=cell.band+'.'+cell.index;ctx.fillStyle='#000a';ctx.fillRect(cell.x*scale,cell.y*scale,ctx.measureText(label).width+8,18);ctx.fillStyle='#ffd166';ctx.fillText(label,cell.x*scale+4,cell.y*scale+2);
  }
  return c;
 }

 // Draw only this cell's solid pixels so neighbouring artwork in the same crop box never leaks in.
 function drawCell(ctx,source,det,cell,dx,dy,dw,dh,flip){
  const piece=canvasOf(cell.w,cell.h),pctx=piece.getContext('2d');
  pctx.drawImage(source.canvas,cell.x,cell.y,cell.w,cell.h,0,0,cell.w,cell.h);
  if(det.useKey){const id=pctx.getImageData(0,0,cell.w,cell.h),p=id.data;for(let i=0;i<p.length;i+=4)if(!det.solid[(cell.y+(i/4/cell.w|0))*det.W+cell.x+(i/4%cell.w)])p[i+3]=0;pctx.putImageData(id,0,0);}
  ctx.save();if(flip){ctx.translate(dx+dw,dy);ctx.scale(-1,1);ctx.drawImage(piece,0,0,dw,dh);}else ctx.drawImage(piece,dx,dy,dw,dh);ctx.restore();
 }

 // "band:first-last" picks cells from a detected band; 3 cells become frames [0,1,2,1], 4 are used as-is, 1 repeats,
 // 2 alternate. "!" mirrors the row. Optional {dx,dy} per row nudges the drawings inside their cells (output pixels).
 const ORDER={1:[0,0,0,0],2:[0,1,0,1],3:[0,1,2,1],4:[0,1,2,3]};
 function parseRow(spec,det){
  const m=/^(\d+):(\*|(\d+)(?:-(\d+))?)(!?)$/.exec(String(spec).trim());if(!m)throw new Error('Bad row spec: '+spec);
  const band=det.cells.filter(c=>c.band===Number(m[1]));
  if(!band.length)throw new Error('Row spec '+spec+' refers to a band that was not detected (found '+det.bands.length+').');
  const picked=m[2]==='*'?band:band.slice(Number(m[3]),m[4]===undefined?Number(m[3])+1:Number(m[4])+1);
  if(!picked.length)throw new Error('Row spec '+spec+' selected no cells.');
  const order=ORDER[picked.length];
  if(!order)throw new Error('Row spec '+spec+' selected '+picked.length+' cells; use 1-4.');
  return {spec:String(spec).trim(),cells:order.map(i=>picked[i]),distinct:picked.length,flip:m[5]==='!',dx:0,dy:0};
 }
 const parseRows=(specs,det)=>(Array.isArray(specs)?specs:String(specs).trim().split(/\s+/)).map(spec=>typeof spec==='string'?parseRow(spec,det):{...parseRow(spec.spec,det),dx:spec.dx||0,dy:spec.dy||0});

 // Uniform scale so the tallest drawing fits the foot line and the widest fits the cell; every cell shares it so
 // the character keeps one size across the sheet.
 function compose(source,det,rows,{cell=64,smooth=false,frames=4}={}){
  const foot=cell-4,used=rows.flatMap(r=>r.cells.slice(0,frames));
  const scale=Math.min(...used.map(c=>Math.min(cell/c.w,foot/c.h)));
  const out=canvasOf(cell*frames,cell*rows.length),ctx=out.getContext('2d');ctx.imageSmoothingEnabled=!!smooth;ctx.imageSmoothingQuality='high';
  rows.forEach((row,r)=>row.cells.slice(0,frames).forEach((c,f)=>{
   const w=Math.max(1,Math.round(c.w*scale)),h=Math.max(1,Math.round(c.h*scale));
   drawCell(ctx,source,det,c,f*cell+Math.round((cell-w)/2)+(row.dx||0),r*cell+foot-h+(row.dy||0),w,h,row.flip);
  }));
  return {canvas:out,scale};
 }

 function sheetPreview(out,{cell=64,maxWidth=768}={}){
  const rows=out.height/cell,columns=out.width/cell,zoom=Math.max(1,Math.floor(maxWidth/out.width)),sheet=canvasOf(out.width*zoom,out.height*zoom),zctx=sheet.getContext('2d');
  zctx.fillStyle='#2b3a4a';zctx.fillRect(0,0,sheet.width,sheet.height);zctx.imageSmoothingEnabled=false;zctx.drawImage(out,0,0,sheet.width,sheet.height);
  zctx.strokeStyle='#ffffff55';for(let x=0;x<=columns;x++){zctx.beginPath();zctx.moveTo(x*cell*zoom,0);zctx.lineTo(x*cell*zoom,sheet.height);zctx.stroke();}
  for(let y=0;y<=rows;y++){zctx.beginPath();zctx.moveTo(0,y*cell*zoom);zctx.lineTo(sheet.width,y*cell*zoom);zctx.stroke();}
  zctx.strokeStyle='#ff6b6b88';for(let y=0;y<rows;y++){zctx.beginPath();zctx.moveTo(0,(y*cell+cell-4)*zoom);zctx.lineTo(sheet.width,(y*cell+cell-4)*zoom);zctx.stroke();}
  return sheet;
 }

 function resize(image,w,h,{smooth=false,format='png'}={}){
  const out=canvasOf(w,h),ctx=out.getContext('2d');ctx.imageSmoothingEnabled=!!smooth;ctx.imageSmoothingQuality='high';ctx.drawImage(image,0,0,w,h);
  if(format==='webp'){const url=out.toDataURL('image/webp',.92);if(!url.startsWith('data:image/webp'))throw new Error('WebP encoding unavailable');return {canvas:out,base64:url.split(',')[1]};}
  return {canvas:out,base64:png(out)};
 }

 // Importer entry point. `job` is serialisable; the result carries base64 outputs.
 async function process(job){
  const img=await load('data:'+job.mime+';base64,'+job.base64),source=sourceOf(img);
  const plain=det=>det.cells.map(({solid,...c})=>c);
  if(job.mode==='cells'){const det=detect(source,job);return {width:source.W,height:source.H,bands:det.bands.length,cells:plain(det),useKey:det.useKey,preview:png(cellsPreview(source,det))};}
  if(job.mode==='sprite'){
   const det=detect(source,job),rows=parseRows(job.rows,det),cell=job.cell;
   const {canvas:out,scale}=compose(source,det,rows,{cell,smooth:job.smooth});
   return {width:out.width,height:out.height,scale,cells:plain(det),bands:det.bands.length,useKey:det.useKey,rowFrames:rows.map(r=>r.distinct),output:png(out),sheetPreview:png(sheetPreview(out,{cell})),cellsPreview:png(cellsPreview(source,det))};
  }
  if(job.mode==='portrait'||job.mode==='scene'||job.mode==='image'){
   const w=job.width||source.W,h=job.height||source.H,{base64}=resize(img,w,h,{smooth:job.smooth,format:job.format});
   return {width:w,height:h,output:base64};
  }
  // Single drawing on a transparent/white canvas (world-map icon, prop): crop to the drawing, key out white, fit it into
  // maxWidth x maxHeight keeping aspect, bottom-centred when a fixed box is requested.
  if(job.mode==='prop'){
   const det=detect(source,job);
   if(!det.cells.length)throw new Error('No drawing detected.');
   const x0=Math.min(...det.cells.map(c=>c.x)),y0=Math.min(...det.cells.map(c=>c.y)),x1=Math.max(...det.cells.map(c=>c.x+c.w)),y1=Math.max(...det.cells.map(c=>c.y+c.h));
   const cell={x:x0,y:y0,w:x1-x0,h:y1-y0,band:0,index:0},scale=Math.min(job.maxWidth/cell.w,job.maxHeight/cell.h,job.upscale?Infinity:1);
   const w=Math.max(1,Math.round(cell.w*scale)),h=Math.max(1,Math.round(cell.h*scale));
   const out=canvasOf(job.box?job.maxWidth:w,job.box?job.maxHeight:h),ctx=out.getContext('2d');ctx.imageSmoothingEnabled=!!job.smooth;ctx.imageSmoothingQuality='high';
   drawCell(ctx,source,det,cell,job.box?Math.round((out.width-w)/2):0,job.box?out.height-h:0,w,h,false);
   return {width:out.width,height:out.height,scale,cropped:{x:x0,y:y0,w:cell.w,h:cell.h},useKey:det.useKey,output:png(out)};
  }
  throw new Error('Unknown mode '+job.mode);
 }

 const api={LAYOUTS,WALK_ROW_NAMES,load,sourceOf,detect,cellsPreview,parseRow,parseRows,compose,sheetPreview,resize,process,png};
 root.SHEET_TOOLS=api;
})(typeof window==='object'?window:globalThis);
