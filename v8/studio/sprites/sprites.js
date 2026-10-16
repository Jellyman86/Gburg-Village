// Gburg Studio · Sprites tab (Sprite Workshop). Import or replace a walk sheet, pose clip or portrait without code:
// pick the target, load a ChatGPT export (inbox or local file), see the detected drawings, map them onto the 64-px grid,
// preview with the game's own walk-row logic, then Save → PNG into v8/assets + art.json entry + sprites.json entry.
// Pixel work is v8/studio/sheet-tools.js (shared with tools/import-art.cjs); server calls go through studio-common.js.
(() => {
 'use strict';
 const $=id=>document.getElementById(id),T=window.SHEET_TOOLS,CELL=64;
 const clone=v=>JSON.parse(JSON.stringify(v));
 const status=(text,kind='')=>{const el=$('status');el.textContent=text;el.className='status '+kind;};
 const ROW_COLORS=['#3ddc84','#4cc9f0','#ffd166','#ff8fab','#3ddc84','#4cc9f0','#ffd166','#ff8fab'];
 const ID=/^[a-z][a-z0-9-]*$/;

 // ---- state ---------------------------------------------------------------------------------------------------
 let handle=null,remote=false,manifest={};      // sprites.json handle; local copy of art.json entries (updated after saves)
 let kind='walk',characterId='',pose='';
 let source=null;                                 // {image,src:{canvas,ctx,W,H},name,bytes,hash,fromInbox}
 let det=null,rows=[],armed=null,result=null;     // result: {canvas,scale,rows} for sheets, {canvas} for portraits
 let dirty=false,saving=false,sourceScale=1,hoverCell=null,animTimer=0;
 const currentImages=new Map();                   // artId → HTMLImageElement|null (the asset as it is now)

 for(const id of V8_ART.ids())manifest[id]=V8_ART.entry(id);
 const assetUrl=entry=>'../../'+V8_ART.root+entry.file+'?v='+entry.hash.slice(0,10);

 const targetId=()=>characterId==='__new'?$('new-id').value.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''):characterId;
 const artId=()=>{const id=targetId();if(!id)return '';return kind==='portrait'?'portrait.'+id:kind==='walk'?`character.${id}.walk`:pose?`character.${id}.${pose}`:'';};
 const data=()=>handle?handle.data:window.V8_SPRITES_DATA;
 const existingCharacter=()=>data().characters[targetId()]||null;
 const existingPose=()=>data().poses[targetId()]?.[pose]||null;

 // ---- target --------------------------------------------------------------------------------------------------
 function fillCharacters(){
  const select=$('character'),previous=select.value;select.replaceChildren();
  for(const [id,c] of Object.entries(data().characters))select.append(new Option(`${c.name} (${id})`,id));
  select.append(new Option('＋ New character…','__new'));
  select.value=previous&&[...select.options].some(o=>o.value===previous)?previous:Object.keys(data().characters)[0];
  characterId=select.value;
 }
 function setKind(next){
  kind=next;armed=null;
  document.querySelectorAll('#kind button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.kind===kind)));
  $('pose-field').hidden=kind!=='pose';$('layout-options').hidden=kind==='portrait';$('layout-heading').hidden=kind==='portrait';$('detect-options').hidden=kind==='portrait';
  $('character-props').hidden=kind==='pose';$('pose-props').hidden=kind!=='pose';
  fillPresets();buildRows();fillForms();
  if(source)analyse();else{result=null;renderAll();}
 }
 function fillPoseNames(){
  const list=$('pose-names');list.replaceChildren();
  const names=new Set(['talk','surprised','hurt','win','interact','sit','run','attack','special']);
  for(const p of Object.keys(data().poses[targetId()]||{}))names.add(p);
  for(const n of [...names].sort())list.append(new Option(n));
 }
 function fillForms(){
  const c=existingCharacter(),id=targetId();
  $('c-name').value=c?.name||(id?id[0].toUpperCase()+id.slice(1):'');
  $('c-speed').value=c?.speed??120;$('c-run').value=c?.runSpeed??205;$('c-walkfps').value=c?.walkFPS??8;$('c-runfps').value=c?.runFPS??12;
  $('c-offset').value=String(c?.walkRowOffset||(c?0:4));$('c-mirror').checked=!!c?.mirrorLeft;$('c-joined').checked=c?!!c.joined:true;
  const p=existingPose();
  $('p-frames').value=p?.frames??(result?.rows?.[0]?.distinct||3);$('p-fps').value=p?.fps??6;$('p-loop').checked=!p||p.loop!==false;
  fillPoseNames();
 }

 // ---- layout rows ---------------------------------------------------------------------------------------------
 const presetsFor=()=>kind==='walk'?['walk6','walk4','walk8','custom']:['pose','custom'];
 function fillPresets(){const s=$('preset');s.replaceChildren();for(const p of presetsFor())s.append(new Option(p==='custom'?'custom (edit specs)':p==='pose'?'one row of frames':p,p));}
 function buildRows(presetName){
  const name=presetName||$('preset').value||presetsFor()[0];
  const specs=name==='custom'?rows.map(r=>r.spec):T.LAYOUTS[name].split(' ');
  const count=kind==='walk'?8:1;
  rows=Array.from({length:count},(_,i)=>({spec:specs[i]||rows[i]?.spec||'',dx:rows[i]?.dx||0,dy:rows[i]?.dy||0}));
  const box=$('rows');box.replaceChildren();
  rows.forEach((row,i)=>{
   const line=document.createElement('div');line.className='rowline';
   const label=document.createElement('span');label.className='name';label.title=kind==='walk'?T.WALK_ROW_NAMES[i]:'frames';
   const sw=document.createElement('i');sw.className='swatch';sw.style.background=ROW_COLORS[i];label.append(sw,kind==='walk'?T.WALK_ROW_NAMES[i]:'frames');
   const spec=document.createElement('input');spec.type='text';spec.className='spec';spec.value=row.spec;spec.placeholder='band:first-last  (e.g. 2:3-5)';spec.title='Row spec';spec.spellcheck=false;
   spec.addEventListener('input',()=>{row.spec=spec.value;$('preset').value='custom';analyse();});
   const nudge=document.createElement('span');nudge.className='nudge';nudge.append('nudge');
   const dx=document.createElement('input'),dy=document.createElement('input');
   for(const [el,key] of [[dx,'dx'],[dy,'dy']]){el.type='number';el.value=row[key];el.title=key+' nudge (px)';el.step=1;el.addEventListener('input',()=>{row[key]=Number(el.value)||0;analyse();});nudge.append(el);}
   const pick=document.createElement('button');pick.type='button';pick.textContent='pick';pick.title='Then click cells on the source sheet';pick.setAttribute('aria-pressed',String(armed===i));
   pick.addEventListener('click',()=>{armed=armed===i?null:i;document.querySelectorAll('.rowline button').forEach((b,j)=>b.setAttribute('aria-pressed',String(armed===j)));drawSource();});
   line.append(label,pick,spec,nudge);box.append(line);row.input=spec;row.label=label;
  });
 }

 // ---- source ------------------------------------------------------------------------------------------------
 async function loadSource(blobOrUrl,name,{fromInbox=false}={}){
  status('Loading '+name+'…');
  try{
   const bytes=blobOrUrl instanceof Blob?await blobOrUrl.arrayBuffer():await (await fetch(blobOrUrl,{cache:'no-store'})).arrayBuffer();
   const blob=new Blob([bytes]),url=URL.createObjectURL(blob);
   let image;try{image=await T.load(url);}finally{URL.revokeObjectURL(url);}
   const hash=crypto.subtle?[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join(''):undefined;
   source={image,src:T.sourceOf(image),name,bytes,hash,fromInbox};
   $('source-name').textContent=`${name} · ${source.src.W}×${source.src.H}`;$('viewport').classList.add('loaded');
   analyse();if(result)status('Loaded '+name+'.','ok');
  }catch(error){status('Could not load '+name+': '+error.message,'error');}
 }
 function analyse(){
  if(!source)return;
  result=null;
  try{
   if(kind==='portrait'){result={canvas:T.resize(source.image,128,128,{smooth:true}).canvas};det=null;}
   else{
    det=T.detect(source.src,{gap:Number($('gap').value)||0,key:$('key').value||undefined});
    $('detect-summary').textContent=`${det.bands.length} bands · ${det.cells.length} cells${det.useKey?' · white keyed out':''}`;
    rows.forEach(r=>r.input?.classList.remove('bad'));
    const parsed=rows.map((r,i)=>{try{const p=T.parseRows([{spec:r.spec,dx:r.dx,dy:r.dy}],det)[0];return p;}catch(error){r.input?.classList.add('bad');throw new Error(`Row ${i+1}: ${error.message}`);}});
    // Replacing a hand-made pose sheet that holds exactly its distinct frames (e.g. 192 px for 3) keeps that width.
    const entry=manifest[artId()],distinct=parsed[0].distinct,frames=kind==='pose'&&entry&&entry.width===CELL*distinct?distinct:4;
    const {canvas,scale}=T.compose(source.src,det,parsed,{cell:CELL,smooth:$('smooth').checked,frames});
    result={canvas,scale,rows:parsed,still:stillRows(canvas,parsed,frames)};
    rows.forEach((r,i)=>{const same=result.still.includes(i);r.label?.classList.toggle('same',same);if(r.label)r.label.title=(kind==='walk'?T.WALK_ROW_NAMES[i]:'frames')+(same?' — the frames are nearly identical, so this row will not visibly animate (the art needs distinct poses)':'');});
    if(kind==='pose'&&!existingPose())$('p-frames').value=parsed[0].distinct;
    if(kind==='walk')$('c-offset').value=String(canvas.height/CELL>=8?4:0);
   }
   setDirty(true);
  }catch(error){status(error.message,'error');}
  renderAll();
 }

 // Rows whose frames barely differ (ChatGPT often draws three near-identical "frames"): fraction of pixels that
 // change between consecutive frames below 2.5 % means the walk or pose will look frozen in the game.
 function stillRows(out,parsed,frames){
  const ctx=out.getContext('2d',{willReadFrequently:true}),still=[];
  parsed.forEach((row,r)=>{
   const n=Math.min(frames,row.distinct);if(n<2)return;
   let worst=0;
   for(let f=1;f<n;f++){
    const a=ctx.getImageData((f-1)*CELL,r*CELL,CELL,CELL).data,b=ctx.getImageData(f*CELL,r*CELL,CELL,CELL).data;
    let changed=0,drawn=0;
    for(let i=0;i<a.length;i+=4){const on=a[i+3]>64||b[i+3]>64;if(!on)continue;drawn++;if(Math.abs(a[i+3]-b[i+3])>64||Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])>90)changed++;}
    worst=Math.max(worst,drawn?changed/drawn:0);
   }
   if(worst<.025)still.push(r);
  });
  return still;
 }

 // ---- rendering -----------------------------------------------------------------------------------------------
 function renderAll(){drawSource();drawSheet();startAnim();renderInfo();updateTargetPill();}
 function drawSource(){
  const canvas=$('source'),ctx=canvas.getContext('2d');
  if(!source){canvas.width=canvas.height=1;return;}
  const {W,H}=source.src,available=Math.max(200,$('source-scroll').clientWidth-16);
  sourceScale=Math.min(1,available/W);
  canvas.width=Math.round(W*sourceScale);canvas.height=Math.round(H*sourceScale);
  ctx.fillStyle='#223';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(source.src.canvas,0,0,canvas.width,canvas.height);
  if(!det)return;
  const s=sourceScale,used=new Map();
  result?.rows?.forEach((row,i)=>row.cells.forEach(c=>{if(!used.has(c))used.set(c,i);}));
  ctx.lineWidth=2;ctx.font='bold 12px system-ui';ctx.textBaseline='top';
  for(const cell of det.cells){
   const r=used.get(cell);
   if(r!==undefined){ctx.fillStyle=ROW_COLORS[r]+'33';ctx.fillRect(cell.x*s,cell.y*s,cell.w*s,cell.h*s);}
   ctx.strokeStyle=cell===hoverCell?'#ffffff':r!==undefined?ROW_COLORS[r]:'#ffd16688';ctx.strokeRect(cell.x*s,cell.y*s,cell.w*s,cell.h*s);
   const label=cell.band+'.'+cell.index;ctx.fillStyle='#000a';ctx.fillRect(cell.x*s,cell.y*s,ctx.measureText(label).width+8,16);ctx.fillStyle=r!==undefined?ROW_COLORS[r]:'#ffd166';ctx.fillText(label,cell.x*s+4,cell.y*s+2);
  }
  if(armed!==null){ctx.fillStyle='#000a';ctx.fillRect(0,canvas.height-20,canvas.width,20);ctx.fillStyle=ROW_COLORS[armed];ctx.fillText(`Picking cells for "${kind==='walk'?T.WALK_ROW_NAMES[armed]:'frames'}" — click a cell, Shift+click to extend`,6,canvas.height-17);}
 }
 function currentImage(){
  const id=artId(),entry=manifest[id];if(!entry)return null;
  if(!currentImages.has(id)){currentImages.set(id,null);const img=new Image();img.onload=()=>{currentImages.set(id,img);drawSheet();};img.src=assetUrl(entry);}
  return currentImages.get(id);
 }
 function drawSheet(){
  const canvas=$('sheet'),ctx=canvas.getContext('2d'),z=Number($('preview-zoom').value);
  if(!result){canvas.width=canvas.height=1;$('result-summary').textContent='';return;}
  const out=result.canvas;canvas.width=out.width*z;canvas.height=out.height*z;
  ctx.imageSmoothingEnabled=false;ctx.fillStyle='#2b3a4a';ctx.fillRect(0,0,canvas.width,canvas.height);
  const current=currentImage();
  if($('onion').checked&&current&&current.naturalWidth===out.width&&current.naturalHeight===out.height){ctx.globalAlpha=.35;ctx.drawImage(current,0,0,canvas.width,canvas.height);ctx.globalAlpha=1;}
  ctx.drawImage(out,0,0,canvas.width,canvas.height);
  if(kind!=='portrait'){
   ctx.strokeStyle='#ffffff55';ctx.lineWidth=1;
   for(let x=0;x<=out.width/CELL;x++){ctx.beginPath();ctx.moveTo(x*CELL*z+.5,0);ctx.lineTo(x*CELL*z+.5,canvas.height);ctx.stroke();}
   for(let y=0;y<=out.height/CELL;y++){ctx.beginPath();ctx.moveTo(0,y*CELL*z+.5);ctx.lineTo(canvas.width,y*CELL*z+.5);ctx.stroke();}
   ctx.strokeStyle='#ff6b6b88';for(let y=0;y<out.height/CELL;y++){ctx.beginPath();ctx.moveTo(0,(y*CELL+CELL-4)*z+.5);ctx.lineTo(canvas.width,(y*CELL+CELL-4)*z+.5);ctx.stroke();}
  }
  $('result-summary').textContent=`${out.width}×${out.height}${result.scale?` · drawings scaled ×${result.scale.toFixed(3)}`:''}`;
 }
 // The moving preview uses the game's own characterWalkPose, so walkRowOffset / mirrorLeft show exactly as in play.
 function startAnim(){
  cancelAnimationFrame(animTimer);
  const canvas=$('anim'),ctx=canvas.getContext('2d');
  if(!result){canvas.width=canvas.height=1;$('anim-legend').textContent='';return;}
  const out=result.canvas,z=2;
  if(kind==='portrait'){canvas.width=canvas.height=128*z;ctx.imageSmoothingEnabled=false;ctx.drawImage(out,0,0,canvas.width,canvas.height);$('anim-legend').textContent='128 × 128 menu portrait';return;}
  if(kind==='pose'){
   const frames=Math.max(1,Math.min(4,Number($('p-frames').value)||1)),fps=Number($('p-fps').value)||6,loop=$('p-loop').checked;
   canvas.width=CELL*z;canvas.height=CELL*z;$('anim-legend').textContent=`${frames} frame(s) · ${fps} fps · ${loop?'looping':'one-shot (repeats every 2 s)'}`;
   const start=performance.now();
   const tick=now=>{const t=(now-start)/1000,frame=loop?Math.floor(t*fps)%frames:Math.min(frames-1,Math.floor((t%2)*fps));ctx.imageSmoothingEnabled=false;ctx.fillStyle='#1f3b3d';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(out,frame*CELL,0,CELL,CELL,0,0,CELL*z,CELL*z);animTimer=requestAnimationFrame(tick);};
   animTimer=requestAnimationFrame(tick);return;
  }
  const character={rows:{...data().walkRows},walkRowOffset:Number($('c-offset').value)||0,mirrorLeft:$('c-mirror').checked,walkFPS:Number($('c-walkfps').value)||8};
  const dirs=['down','left','right','up'],rowsAvailable=out.height/CELL;
  canvas.width=4*CELL*z;canvas.height=2*CELL*z;$('anim-legend').textContent='walking (top) and idle (bottom) · down, left, right, up';
  const start=performance.now();
  const tick=now=>{
   const t=(now-start)/1000;ctx.imageSmoothingEnabled=false;ctx.fillStyle='#1f3b3d';ctx.fillRect(0,0,canvas.width,canvas.height);
   dirs.forEach((dir,i)=>{for(const moving of [true,false]){
    const p=window.characterWalkPose(character,dir,moving),frame=moving?Math.floor(t*character.walkFPS)%4:1,row=Math.min(rowsAvailable-1,p.row);
    ctx.save();ctx.translate(i*CELL*z+(p.flip?CELL*z:0),moving?0:CELL*z);if(p.flip)ctx.scale(-1,1);ctx.drawImage(out,frame*CELL,row*CELL,CELL,CELL,0,0,CELL*z,CELL*z);ctx.restore();
   }});
   animTimer=requestAnimationFrame(tick);
  };
  animTimer=requestAnimationFrame(tick);
 }
 function renderInfo(){
  const info=$('asset-info');info.replaceChildren();
  const id=artId(),entry=id?manifest[id]:null;
  const add=(k,v,cls='')=>{const dt=document.createElement('dt');dt.textContent=k;const dd=document.createElement('dd');dd.textContent=v;dd.className=cls;info.append(dt,dd);};
  add('Art id',id||'(choose a target)');
  add('Current',entry?`${entry.width}×${entry.height} · ${entry.file}`:'none — this will be a new asset',entry?'':'ok');
  if(result){
   const same=!entry||(entry.width===result.canvas.width&&entry.height===result.canvas.height);
   add('New',`${result.canvas.width}×${result.canvas.height}`,same?'ok':'warn');
   if(!same)add('Size',`differs from the current asset — tick "allow size change" to replace anyway`,'warn');
   if(result.still?.length)add('Animation',`${result.still.map(i=>kind==='walk'?T.WALK_ROW_NAMES[i]:'frames').join(', ')}: frames nearly identical — will look frozen. Ask for clearly different leg/arm positions per frame.`,'warn');
  }
  if(source)add('Source',source.fromInbox?source.name+' (inbox, provenance recorded)':source.name+' (local file)');
  if(kind==='walk'){const c=existingCharacter();add('Roster',c?'existing character — settings on this panel are saved too':manifest['portrait.'+targetId()]?'new character — will join the roster on save':'new character — also import a portrait to join the roster','');}
  if(kind==='pose'){add('Clip',existingPose()?'existing pose — frames/fps/loop below are saved too':existingCharacter()?'new pose for this character':'character must be in the roster first','');}
 }
 function updateTargetPill(){const el=$('target-pill');el.textContent=artId()||'no target';el.className='pill'+(artId()&&manifest[artId()]?' on':'');}
 function setDirty(value){dirty=value;$('save').disabled=!remote||saving||!(result||dirty);}

 // ---- source interaction ------------------------------------------------------------------------------------------
 function cellAt(event){
  if(!det)return null;const r=$('source').getBoundingClientRect(),x=(event.clientX-r.left)/sourceScale,y=(event.clientY-r.top)/sourceScale;
  return det.cells.find(c=>x>=c.x&&x<=c.x+c.w&&y>=c.y&&y<=c.y+c.h)||null;
 }
 $('source').addEventListener('mousemove',e=>{const c=cellAt(e);if(c!==hoverCell){hoverCell=c;drawSource();}});
 $('source').addEventListener('mouseleave',()=>{hoverCell=null;drawSource();});
 $('source').addEventListener('click',e=>{
  const cell=cellAt(e);if(!cell||armed===null)return;
  const row=rows[armed],m=/^(\d+):(\d+)(?:-(\d+))?(!?)$/.exec(row.spec||'');
  row.spec=e.shiftKey&&m&&Number(m[1])===cell.band?`${cell.band}:${Math.min(Number(m[2]),cell.index)}-${Math.max(Number(m[3]??m[2]),cell.index)}${m[4]}`:`${cell.band}:${cell.index}`;
  row.input.value=row.spec;$('preset').value='custom';analyse();
 });
 const viewport=$('viewport');
 viewport.addEventListener('dragover',e=>{e.preventDefault();viewport.classList.add('dragging');});
 viewport.addEventListener('dragleave',()=>viewport.classList.remove('dragging'));
 viewport.addEventListener('drop',e=>{e.preventDefault();viewport.classList.remove('dragging');const file=e.dataTransfer.files[0];if(file)loadSource(file,file.name);});
 $('open-file').addEventListener('click',()=>$('file').click());
 $('file').addEventListener('change',()=>{const file=$('file').files[0];if(file)loadSource(file,file.name);$('file').value='';});
 $('inbox').addEventListener('change',()=>{const name=$('inbox').value;if(name)loadSource('../../../art inbox/'+encodeURIComponent(name),name,{fromInbox:true});});

 // ---- controls ------------------------------------------------------------------------------------------------
 document.querySelectorAll('#kind button').forEach(b=>b.addEventListener('click',()=>setKind(b.dataset.kind)));
 $('character').addEventListener('change',()=>{characterId=$('character').value;$('new-id-field').hidden=characterId!=='__new';fillForms();setDirty(false);renderAll();});
 $('new-id').addEventListener('input',()=>{fillForms();renderAll();});
 $('pose').addEventListener('input',()=>{pose=$('pose').value.trim().toLowerCase();fillForms();renderAll();});
 $('preset').addEventListener('change',()=>{buildRows($('preset').value);analyse();});
 for(const id of ['gap','key','smooth'])$(id).addEventListener('change',analyse);
 for(const id of ['onion','preview-zoom'])$(id).addEventListener('input',drawSheet);
 for(const id of ['c-name','c-speed','c-run','c-walkfps','c-runfps','c-offset','c-mirror','c-joined','p-frames','p-fps','p-loop'])$(id).addEventListener('input',()=>{setDirty(true);startAnim();});
 $('export').addEventListener('click',()=>{const area=$('json');area.hidden=!area.hidden;area.value=JSON.stringify(buildDocument(),null,1);});
 $('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(JSON.stringify(buildDocument(),null,1));status('sprites.json copied.','ok');}catch{$('json').hidden=false;$('json').value=JSON.stringify(buildDocument(),null,1);$('json').select();}});
 window.addEventListener('resize',drawSource);
 window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();save();}});
 window.addEventListener('beforeunload',e=>{if(dirty&&remote){e.preventDefault();e.returnValue='';}});

 // ---- sprites.json document -----------------------------------------------------------------------------------------
 // Mirrors tools/sprites.cjs registerCharacter/registerPose, plus the editable settings from the right panel.
 function buildDocument({assetSaved=false}={}){
  const doc=clone(data()),id=targetId();if(!id)return doc;
  const has=art=>!!manifest[art];
  if(kind==='walk'||kind==='portrait'){
   const ready=has(`character.${id}.walk`)&&has(`portrait.${id}`);
   if(ready||doc.characters[id]){
    const c=doc.characters[id]||{name:'',walk:`character.${id}.walk`,portrait:`portrait.${id}`,speed:120,runSpeed:205,walkFPS:8,runFPS:12};
    c.name=$('c-name').value.trim()||id[0].toUpperCase()+id.slice(1);
    c.speed=Number($('c-speed').value)||120;c.runSpeed=Number($('c-run').value)||205;c.walkFPS=Number($('c-walkfps').value)||8;c.runFPS=Number($('c-runfps').value)||12;
    const offset=Number($('c-offset').value)||0;if(offset)c.walkRowOffset=offset;else delete c.walkRowOffset;
    if($('c-mirror').checked)c.mirrorLeft=true;else delete c.mirrorLeft;
    if($('c-joined').checked)c.joined=true;else delete c.joined;
    doc.characters[id]=c;
   }
  }
  if(kind==='pose'&&pose&&doc.characters[id]&&(has(`character.${id}.${pose}`)||assetSaved)){
   const clips=doc.poses[id]=doc.poses[id]||{},clip=clips[pose]||{art:`character.${id}.${pose}`};
   clip.frames=Math.max(1,Math.min(4,Number($('p-frames').value)||1));clip.fps=Number($('p-fps').value)||6;
   if($('p-loop').checked)delete clip.loop;else clip.loop=false;
   clips[pose]=clip;
  }
  return doc;
 }

 // ---- save ------------------------------------------------------------------------------------------------------
 async function save(){
  if(!remote){status('Read-only preview: run `npm run studio` to save.','error');return;}
  if(saving)return;
  const id=targetId();
  if(!ID.test(id)){status('Character id must be lowercase letters, digits and dashes (e.g. "nina").','error');return;}
  if(kind==='pose'&&!ID.test(pose)){status('Pose name must be lowercase letters, digits and dashes (e.g. "surprised").','error');return;}
  if(kind==='pose'&&!existingCharacter()){status(`${id} is not in the roster yet — import the walk sheet and portrait first.`,'error');return;}
  const art=artId(),entry=manifest[art];
  if(result&&entry&&(entry.width!==result.canvas.width||entry.height!==result.canvas.height)&&!$('allow-resize').checked){status(`${art} is ${entry.width}×${entry.height}; the new sheet is ${result.canvas.width}×${result.canvas.height}. Tick "allow size change" to replace it anyway.`,'error');return;}
  saving=true;$('save').disabled=true;
  try{
   if(result){
    status('Writing '+art+'…');
    const response=await fetch('/api/asset',{method:'POST',headers:{'Content-Type':'application/json','X-Studio-Token':handle.token},body:JSON.stringify({id:art,png:T.png(result.canvas),source:source?.fromInbox?{name:source.name,hash:source.hash}:undefined,allowResize:$('allow-resize').checked})});
    const body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(body.error||response.statusText);
    manifest[art]=body.entry;currentImages.delete(art);
   }
   const doc=buildDocument({assetSaved:!!result}),changed=JSON.stringify(doc)!==JSON.stringify(data());
   if(changed){status('Saving sprites.json…');await handle.save(doc);}
   const note=kind==='walk'&&!doc.characters[id]?` ${id} is not in the roster yet — import a portrait to add it.`:'';
   status(`${result?'Saved '+art+(changed?' and sprites.json':''):changed?'Saved sprites.json':'Nothing to save'} at ${new Date().toLocaleTimeString()} — reload the game to see it.${note}`,'ok');
   result=null;setDirty(false);fillCharacters();$('character').value=doc.characters[id]?id:$('character').value;characterId=$('character').value;$('new-id-field').hidden=characterId!=='__new';
   fillForms();renderAll();
  }catch(error){status('Save failed: '+error.message,'error');}
  finally{saving=false;setDirty(dirty);}
 }
 $('save').addEventListener('click',save);

 // ---- boot ------------------------------------------------------------------------------------------------------
 async function boot(){
  handle=await STUDIO_SERVER.open('sprites',clone(window.V8_SPRITES_DATA));remote=handle.remote;
  fillCharacters();
  const params=new URLSearchParams(location.search);
  if(params.get('character')&&data().characters[params.get('character')]){$('character').value=params.get('character');characterId=$('character').value;}
  if(params.get('pose')){pose=params.get('pose');$('pose').value=pose;}
  if(remote){
   try{const list=await (await fetch('/api/inbox',{cache:'no-store'})).json();for(const f of list.files)$('inbox').append(new Option(`${f.name} (${(f.size/1024).toFixed(0)} KB)`,f.name));}
   catch{/* inbox listing is optional */}
   status('Connected to the studio server.','ok');
  }else{$('inbox').disabled=true;$('inbox').title='Inbox listing needs the local studio server';status('Read-only preview (no studio server): you can load files and preview, not save.','dirty');}
  setKind(['walk','pose','portrait'].includes(params.get('kind'))?params.get('kind'):'walk');
 }
 window.WORKSHOP={
  get state(){return {kind,characterId:targetId(),pose,artId:artId(),remote,dirty,loaded:!!source,cells:det?.cells.length||0,bands:det?.bands.length||0,result:result?{width:result.canvas.width,height:result.canvas.height,scale:result.scale}:null,rows:rows.map(r=>r.spec)};},
  loadDataURL:(url,name)=>fetch(url).then(r=>r.blob()).then(b=>loadSource(b,name)),
  setKind,setRows(specs){specs.forEach((s,i)=>{if(rows[i]){rows[i].spec=s;rows[i].input.value=s;}});$('preset').value='custom';analyse();},
  setCharacter(id){$('character').value=id;$('character').dispatchEvent(new Event('change'));},
  setNewId(id){$('character').value='__new';$('character').dispatchEvent(new Event('change'));$('new-id').value=id;$('new-id').dispatchEvent(new Event('input'));},
  setPose(name){$('pose').value=name;$('pose').dispatchEvent(new Event('input'));},
  buildDocument,save,resultPNG:()=>result?T.png(result.canvas):null
 };
 boot();
})();
