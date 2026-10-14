// Gburg Studio: edit scene collision shapes on top of the real background, using the game's own scene objects.
// Edits mutate the live SCENES entry (so the walk test uses the real V8_AREAS.blocked), snapshots go through
// V8_GEOMETRY.extract for undo/save, and Save posts the whole override document to the local studio server.
(() => {
 'use strict';
 const $=id=>document.getElementById(id),scenes=window.SCENES,G=window.V8_GEOMETRY;
 const canvas=$('canvas'),ctx=canvas.getContext('2d'),viewport=$('viewport');
 const COLORS={walkable:'#3ddc84',blocked:'#ff5a5a',landmark:'#ffd166',road:'#4cc9f0',bounds:'#ffffff',spawn:'#b388ff',selected:'#ffffff'};
 const LISTS={walkable:{layer:'walkable',kind:'rect',color:COLORS.walkable},walkablePolygons:{layer:'walkable',kind:'polygon',color:COLORS.walkable},walkableEllipses:{layer:'walkable',kind:'ellipse',color:COLORS.walkable},
  obstacles:{layer:'blocked',kind:'rect',color:COLORS.blocked},blockedPolygons:{layer:'blocked',kind:'polygon',color:COLORS.blocked},blockedEllipses:{layer:'blocked',kind:'ellipse',color:COLORS.blocked}};

 // Hawaii-style areas are installed by index.html inline; do the same here, then snapshot code-defined geometry so a
 // scene can be reverted.
 if(!scenes['hawaii-central'])window.V8_AREAS.install(window.V8_HAWAII.defs,scenes);
 const originals=Object.fromEntries(Object.values(scenes).filter(s=>!s.world).map(s=>[s.id,G.extract(s)]));
 let document_={version:1,scenes:{}},revision=null,token=null,remote=false;
 let scene=null,image=null,zoom=1,pan={x:0,y:0},tool='select',selection=null,drag=null,drawing=null,spaceDown=false;
 const layers={walkable:true,blocked:true,landmarks:true,roads:true,bounds:true,mask:false};
 let opacity=.45,dirty=false,history=[],future=[],maskCanvas=null,maskTimer=0;
 const removedLandmarks=new Set(); // ids deleted in the current scene; saved as {id, removed:true}

 // ---- helpers -----------------------------------------------------------------------------------------------
 const clone=v=>JSON.parse(JSON.stringify(v));
 const toScene=(px,py)=>({x:(px-pan.x)/zoom,y:(py-pan.y)/zoom});
 const toScreen=(x,y)=>({x:x*zoom+pan.x,y:y*zoom+pan.y});
 const handleSize=()=>7/zoom;
 const near=(a,b,r)=>Math.hypot(a.x-b.x,a.y-b.y)<=r;
 const status=(text,kind='')=>{const el=$('status');el.textContent=text;el.className='status '+kind;};
 const setDirty=value=>{dirty=value;$('save').disabled=!remote||!dirty;if(dirty)status('Unsaved changes','dirty');};
 const inRect=(p,r)=>p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h;
 const inEllipse=(p,e)=>((p.x-e.x)/e.rx)**2+((p.y-e.y)/e.ry)**2<=1;
 const pointOnSegment=(p,a,b,tolerance)=>{const dx=b[0]-a[0],dy=b[1]-a[1],len2=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((p.x-a[0])*dx+(p.y-a[1])*dy)/len2));return Math.hypot(p.x-(a[0]+t*dx),p.y-(a[1]+t*dy))<=tolerance;};

 // ---- data / history ------------------------------------------------------------------------------------------
 function snapshot(){return G.extract(scene);}
 function commit(){history.push(clone(document_.scenes[scene.id]||originals[scene.id]));if(history.length>80)history.shift();future=[];document_.scenes[scene.id]=exportScene();setDirty(true);paintOverrideState();scheduleMask();render();renderProps();}
 function restore(entry){G.apply(scenes,{version:1,scenes:{[scene.id]:clone(entry)}});document_.scenes[scene.id]=snapshot();}
 function undo(){if(!history.length)return;future.push(snapshot());restore(history.pop());selection=null;setDirty(true);scheduleMask();render();renderProps();}
 function redo(){if(!future.length)return;history.push(snapshot());restore(future.pop());selection=null;setDirty(true);scheduleMask();render();renderProps();}

 // ---- scene selection -----------------------------------------------------------------------------------------
 function loadScene(id){
  scene=scenes[id];selection=null;drawing=null;history=[];future=[];maskCanvas=null;image=null;
  removedLandmarks.clear();for(const l of document_.scenes[id]?.landmarks||[])if(l.removed)removedLandmarks.add(l.id);
  $('scene').value=id;
  if(scene.image){const img=new Image();img.onload=()=>{image=img;fit();};img.onerror=()=>{status('Background failed to load: '+scene.image,'error');render();};img.src='../'+scene.image;}
  else fit();
  paintOverrideState();renderInfo();renderProps();scheduleMask();
 }
 function paintOverrideState(){const on=!!document_.scenes[scene.id];const el=$('override-state');el.textContent=on?'● data override':'code geometry';el.className='pill'+(on?' on':'');}
 function renderInfo(){
  const info=$('info');info.replaceChildren();
  const rows=[['Size',scene.width+' × '+scene.height],['Walkable',(scene.walkable?.length||0)+' rects, '+(scene.walkablePolygons?.length||0)+' polys, '+(scene.walkableEllipses?.length||0)+' ellipses'],['Blocked',(scene.obstacles?.length||0)+' rects, '+(scene.blockedPolygons?.length||0)+' polys, '+(scene.blockedEllipses?.length||0)+' ellipses'],['Markers',String(scene.landmarks?.length||0)],['Image',scene.image?scene.image.split('?')[0]:'(drawn by code)'],['Rule',scene.walkable?.length||scene.walkablePolygons?.length||scene.walkableEllipses?.length?'Walkable shapes define where you can go; blocked shapes cut holes.':'No walkable shapes: everything inside bounds is walkable except blocked shapes.']];
  for(const [k,v] of rows){const dt=document.createElement('dt');dt.textContent=k;const dd=document.createElement('dd');dd.textContent=v;info.append(dt,dd);}
 }

 // ---- view ----------------------------------------------------------------------------------------------------
 function resize(){const r=viewport.getBoundingClientRect();canvas.width=Math.max(1,Math.round(r.width*devicePixelRatio));canvas.height=Math.max(1,Math.round(r.height*devicePixelRatio));render();}
 function fit(){const r=viewport.getBoundingClientRect();zoom=Math.min((r.width-40)/scene.width,(r.height-40)/scene.height);pan={x:(r.width-scene.width*zoom)/2,y:(r.height-scene.height*zoom)/2};render();}
 function zoomAt(factor,cx,cy){const before=toScene(cx,cy);zoom=Math.max(.05,Math.min(8,zoom*factor));pan.x=cx-before.x*zoom;pan.y=cy-before.y*zoom;render();}

 // ---- mask (actual blocked sampling) --------------------------------------------------------------------------
 function scheduleMask(){clearTimeout(maskTimer);maskTimer=setTimeout(buildMask,120);}
 function buildMask(){
  if(!layers.mask||!scene){maskCanvas=null;render();return;}
  const step=Math.max(4,Math.round(Math.max(scene.width,scene.height)/220)),w=Math.ceil(scene.width/step),h=Math.ceil(scene.height/step);
  const c=document.createElement('canvas');c.width=w;c.height=h;const mctx=c.getContext('2d'),img=mctx.createImageData(w,h);
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const blocked=window.V8_AREAS.blocked(scene,i*step+step/2,j*step+step/2);const k=(j*w+i)*4;img.data[k]=blocked?255:40;img.data[k+1]=blocked?30:220;img.data[k+2]=blocked?30:90;img.data[k+3]=blocked?110:55;}
  mctx.putImageData(img,0,0);maskCanvas=c;render();
 }

 // ---- rendering -----------------------------------------------------------------------------------------------
 function render(){
  if(!scene)return;
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  ctx.fillStyle='#05081c';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.save();ctx.translate(pan.x,pan.y);ctx.scale(zoom,zoom);ctx.imageSmoothingEnabled=zoom<1;
  if(image)ctx.drawImage(image,0,0,scene.width,scene.height);else{ctx.fillStyle='#2a3350';ctx.fillRect(0,0,scene.width,scene.height);}
  if(maskCanvas&&layers.mask){ctx.imageSmoothingEnabled=false;ctx.drawImage(maskCanvas,0,0,scene.width,scene.height);}
  ctx.lineWidth=1.5/zoom;ctx.globalAlpha=1;
  for(const [list,meta] of Object.entries(LISTS)){
   if(!layers[meta.layer])continue;
   (scene[list]||[]).forEach((shape,index)=>{
    const picked=selection&&selection.list===list&&selection.index===index;
    ctx.fillStyle=meta.color+Math.round(opacity*255).toString(16).padStart(2,'0');ctx.strokeStyle=picked?COLORS.selected:meta.color;ctx.lineWidth=(picked?2.5:1.5)/zoom;
    drawShape(meta.kind,shape);ctx.fill();ctx.stroke();
    if(picked)drawHandles(meta.kind,shape);
   });
  }
  if(layers.roads)(scene.landmarks||[]).forEach((l,li)=>(l.roads||[]).forEach((r,ri)=>{
   const picked=selection&&selection.kind==='road'&&selection.landmark===li&&selection.index===ri;
   ctx.fillStyle=COLORS.road+'55';ctx.strokeStyle=picked?COLORS.selected:COLORS.road;ctx.lineWidth=(picked?2.5:1.5)/zoom;ctx.fillRect(r.x,r.y,r.w,r.h);ctx.strokeRect(r.x,r.y,r.w,r.h);
   drawArrow(r.x+r.w/2,r.y+r.h/2,r.direction,Math.min(r.w,r.h)*.4,COLORS.road);
   if(picked)drawHandles('rect',r);
  }));
  if(layers.landmarks)(scene.landmarks||[]).forEach((l,index)=>{
   const picked=selection&&selection.kind==='landmark'&&selection.index===index,radius=l.radius||44;
   ctx.strokeStyle=picked?COLORS.selected:COLORS.landmark;ctx.fillStyle=COLORS.landmark+'33';ctx.lineWidth=(picked?2.5:1.5)/zoom;
   ctx.beginPath();ctx.arc(l.x,l.y,radius,0,Math.PI*2);ctx.fill();ctx.stroke();
   ctx.save();ctx.translate(l.x,l.y);ctx.rotate(Math.PI/4);ctx.fillStyle=l.to?COLORS.landmark:'#fff';ctx.fillRect(-6/zoom,-6/zoom,12/zoom,12/zoom);ctx.restore();
   label(l.id+(l.to?' → '+l.to:''),l.x,l.y-radius-4/zoom,COLORS.landmark);
   if(picked){handle(l.x,l.y);handle(l.x+radius,l.y);}
  });
  if(layers.bounds){
   const b=scene.bounds;ctx.setLineDash([8/zoom,6/zoom]);ctx.strokeStyle=COLORS.bounds+'aa';ctx.lineWidth=1.5/zoom;ctx.strokeRect(b.left,b.top,b.right-b.left,b.bottom-b.top);ctx.setLineDash([]);
   if(selection?.kind==='bounds')drawHandles('rect',{x:b.left,y:b.top,w:b.right-b.left,h:b.bottom-b.top});
   ctx.strokeStyle=COLORS.spawn;ctx.fillStyle=COLORS.spawn+'88';ctx.beginPath();ctx.arc(scene.spawn.x,scene.spawn.y,10/zoom,0,Math.PI*2);ctx.fill();ctx.stroke();label('spawn',scene.spawn.x,scene.spawn.y-14/zoom,COLORS.spawn);
   if(selection?.kind==='spawn')handle(scene.spawn.x,scene.spawn.y);
  }
  if(drawing){
   ctx.strokeStyle='#fff';ctx.setLineDash([4/zoom,4/zoom]);ctx.lineWidth=1.5/zoom;
   if(drawing.points){ctx.beginPath();drawing.points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));if(drawing.cursor)ctx.lineTo(drawing.cursor.x,drawing.cursor.y);ctx.stroke();drawing.points.forEach(([x,y])=>handle(x,y));}
   else if(drawing.rect)ctx.strokeRect(drawing.rect.x,drawing.rect.y,drawing.rect.w,drawing.rect.h);
   ctx.setLineDash([]);
  }
  ctx.restore();
 }
 function drawShape(kind,s){ctx.beginPath();if(kind==='rect')ctx.rect(s.x,s.y,s.w,s.h);else if(kind==='ellipse')ctx.ellipse(s.x,s.y,s.rx,s.ry,0,0,Math.PI*2);else{s.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();}}
 function drawHandles(kind,s){if(kind==='rect')for(const [x,y] of rectHandles(s))handle(x,y);else if(kind==='ellipse'){handle(s.x,s.y);handle(s.x+s.rx,s.y);handle(s.x,s.y+s.ry);}else s.forEach(([x,y])=>handle(x,y));}
 function rectHandles(r){return [[r.x,r.y],[r.x+r.w,r.y],[r.x,r.y+r.h],[r.x+r.w,r.y+r.h],[r.x+r.w/2,r.y],[r.x+r.w/2,r.y+r.h],[r.x,r.y+r.h/2],[r.x+r.w,r.y+r.h/2]];}
 function handle(x,y){const s=handleSize();ctx.save();ctx.fillStyle='#fff';ctx.strokeStyle='#000';ctx.lineWidth=1/zoom;ctx.fillRect(x-s/2,y-s/2,s,s);ctx.strokeRect(x-s/2,y-s/2,s,s);ctx.restore();}
 function label(text,x,y,color){ctx.save();ctx.font=`${11/zoom}px system-ui`;ctx.textAlign='center';ctx.textBaseline='bottom';ctx.lineWidth=3/zoom;ctx.strokeStyle='#000c';ctx.strokeText(text,x,y);ctx.fillStyle=color;ctx.fillText(text,x,y);ctx.restore();}
 function drawArrow(x,y,direction,size,color){const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[direction]||[0,1];ctx.save();ctx.strokeStyle=color;ctx.lineWidth=2/zoom;ctx.beginPath();ctx.moveTo(x-d[0]*size,y-d[1]*size);ctx.lineTo(x+d[0]*size,y+d[1]*size);ctx.stroke();ctx.beginPath();ctx.moveTo(x+d[0]*size,y+d[1]*size);ctx.lineTo(x+d[0]*size*.4-d[1]*size*.5,y+d[1]*size*.4-d[0]*size*.5);ctx.moveTo(x+d[0]*size,y+d[1]*size);ctx.lineTo(x+d[0]*size*.4+d[1]*size*.5,y+d[1]*size*.4+d[0]*size*.5);ctx.stroke();ctx.restore();}

 // ---- hit testing -----------------------------------------------------------------------------------------------
 function hitHandle(p){
  if(!selection)return null;const r=handleSize();
  const shape=selectedShape();
  if(selection.kind==='rect'||selection.kind==='road'||selection.kind==='bounds'){const rect=selection.kind==='bounds'?boundsRect():shape;const idx=rectHandles(rect).findIndex(([x,y])=>near(p,{x,y},r));return idx>=0?{handle:idx}:null;}
  if(selection.kind==='ellipse'){if(near(p,{x:shape.x+shape.rx,y:shape.y},r))return {handle:'rx'};if(near(p,{x:shape.x,y:shape.y+shape.ry},r))return {handle:'ry'};return null;}
  if(selection.kind==='polygon'){const idx=shape.findIndex(([x,y])=>near(p,{x,y},r));return idx>=0?{vertex:idx}:null;}
  if(selection.kind==='landmark'){if(near(p,{x:shape.x+(shape.radius||44),y:shape.y},r))return {handle:'radius'};}
  return null;
 }
 function selectedShape(){
  if(!selection)return null;
  if(selection.kind==='landmark')return scene.landmarks[selection.index];
  if(selection.kind==='road')return scene.landmarks[selection.landmark].roads[selection.index];
  if(selection.kind==='spawn')return scene.spawn;
  if(selection.kind==='bounds')return scene.bounds;
  return scene[selection.list][selection.index];
 }
 const boundsRect=()=>({x:scene.bounds.left,y:scene.bounds.top,w:scene.bounds.right-scene.bounds.left,h:scene.bounds.bottom-scene.bounds.top});
 function hitTest(p){
  const tolerance=6/zoom;
  if(layers.bounds&&near(p,scene.spawn,12/zoom))return {kind:'spawn'};
  if(layers.landmarks)for(let i=(scene.landmarks||[]).length-1;i>=0;i--){const l=scene.landmarks[i];if(near(p,l,Math.max(14/zoom,(l.radius||44)*.5)))return {kind:'landmark',index:i};}
  if(layers.roads)for(let li=(scene.landmarks||[]).length-1;li>=0;li--)for(let ri=(scene.landmarks[li].roads||[]).length-1;ri>=0;ri--)if(inRect(p,scene.landmarks[li].roads[ri]))return {kind:'road',landmark:li,index:ri};
  // Smaller shapes win so nested obstacles stay selectable inside large walkable areas.
  let best=null,bestArea=Infinity;
  for(const [list,meta] of Object.entries(LISTS)){
   if(!layers[meta.layer])continue;
   (scene[list]||[]).forEach((s,index)=>{
    let hit=false,area=0;
    if(meta.kind==='rect'){hit=inRect(p,s);area=s.w*s.h;}
    else if(meta.kind==='ellipse'){hit=inEllipse(p,s);area=Math.PI*s.rx*s.ry;}
    else{hit=window.V8_AREAS.contains(s,p.x,p.y)||s.some((v,i)=>pointOnSegment(p,v,s[(i+1)%s.length],tolerance));area=Math.abs(s.reduce((sum,[x,y],i)=>{const [nx,ny]=s[(i+1)%s.length];return sum+x*ny-nx*y;},0))/2;}
    if(hit&&area<bestArea){best={kind:meta.kind,list,index};bestArea=area;}
   });
  }
  if(best)return best;
  if(layers.bounds){const b=boundsRect();if(rectHandles(b).some(([x,y])=>near(p,{x,y},tolerance)))return {kind:'bounds'};}
  return null;
 }

 // ---- pointer interaction ---------------------------------------------------------------------------------------
 viewport.addEventListener('contextmenu',e=>e.preventDefault());
 viewport.addEventListener('wheel',e=>{e.preventDefault();const r=viewport.getBoundingClientRect();zoomAt(e.deltaY<0?1.12:1/1.12,e.clientX-r.left,e.clientY-r.top);},{passive:false});
 viewport.addEventListener('pointerdown',e=>{
  if(!scene)return;const r=viewport.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top,p=toScene(px,py);
  viewport.setPointerCapture(e.pointerId);
  if(e.button===1||spaceDown){drag={kind:'pan',startX:px,startY:py,pan:{...pan}};return;}
  if(e.button===2){if(drawing)finishPolygon();return;}
  if(tool==='select'){
   const h=hitHandle(p);
   if(h){drag={kind:'handle',...h,start:p,before:clone(selectedShape())};return;}
   const hit=hitTest(p);
   if(hit&&e.altKey&&hit.kind==='polygon'){ // insert a vertex on the nearest edge
    const poly=scene[hit.list][hit.index];let bestI=0,bestD=Infinity;poly.forEach((v,i)=>{const n=poly[(i+1)%poly.length],d=segmentDistance(p,v,n);if(d<bestD){bestD=d;bestI=i;}});
    poly.splice(bestI+1,0,[Math.round(p.x),Math.round(p.y)]);selection={...hit};commit();drag={kind:'handle',vertex:bestI+1,start:p,before:clone(poly)};return;
   }
   selection=hit;renderProps();render();
   if(hit)drag={kind:'move',start:p,before:clone(selectedShape())};
   return;
  }
  if(tool.startsWith('poly-')){
   if(!drawing)drawing={points:[],list:tool==='poly-walk'?'walkablePolygons':'blockedPolygons'};
   const first=drawing.points[0];if(first&&drawing.points.length>=3&&near(p,{x:first[0],y:first[1]},10/zoom)){finishPolygon();return;}
   drawing.points.push([Math.round(p.x),Math.round(p.y)]);render();return;
  }
  if(tool==='landmark'){
   let id='marker';for(let n=1;scene.landmarks.some(l=>l.id===id);n++)id='marker-'+n;
   scene.landmarks.push({id,name:'New marker',x:Math.round(p.x),y:Math.round(p.y),radius:44,text:'Describe this spot.',studio:true});
   selection={kind:'landmark',index:scene.landmarks.length-1};commit();setTool('select');return;
  }
  if(tool==='road'){
   if(selection?.kind!=='landmark'&&selection?.kind!=='road'){status('Select the exit marker first, then draw its road strip.','error');return;}
   const li=selection.kind==='landmark'?selection.index:selection.landmark;
   drawing={rect:{x:p.x,y:p.y,w:0,h:0},road:li,start:p};return;
  }
  // rect / ellipse tools draw by dragging
  drawing={rect:{x:p.x,y:p.y,w:0,h:0},start:p,list:{'rect-walk':'walkable','rect-block':'obstacles','ellipse-walk':'walkableEllipses','ellipse-block':'blockedEllipses'}[tool]};
 });
 viewport.addEventListener('pointermove',e=>{
  if(!scene)return;const r=viewport.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top,p=toScene(px,py);
  $('coords').textContent=Math.round(p.x)+', '+Math.round(p.y)+'  ·  '+Math.round(zoom*100)+'%';
  if(drawing?.points){drawing.cursor=p;render();return;}
  if(drawing?.rect){drawing.rect={x:Math.min(p.x,drawing.start.x),y:Math.min(p.y,drawing.start.y),w:Math.abs(p.x-drawing.start.x),h:Math.abs(p.y-drawing.start.y)};render();return;}
  if(!drag)return;
  if(drag.kind==='pan'){pan={x:drag.pan.x+px-drag.startX,y:drag.pan.y+py-drag.startY};render();return;}
  const dx=Math.round(p.x-drag.start.x),dy=Math.round(p.y-drag.start.y),shape=selectedShape(),before=drag.before;
  if(drag.kind==='move')moveShape(shape,before,dx,dy);
  else if(drag.kind==='handle')resizeShape(shape,before,drag,dx,dy,p);
  drag.changed=true;render();renderProps(false);
 });
 const endDrag=()=>{
  if(drawing?.rect&&!drawing.points){
   const rect=drawing.rect;drawing=null;
   if(rect.w>=4&&rect.h>=4){
    const x=Math.round(rect.x),y=Math.round(rect.y),w=Math.round(rect.w),h=Math.round(rect.h);
    if(tool==='road'){const li=selectionLandmarkIndex();const l=scene.landmarks[li];l.roads=l.roads||[];l.roads.push({x,y,w,h,direction:w>=h?'down':'right'});selection={kind:'road',landmark:li,index:l.roads.length-1};}
    else if(tool.startsWith('ellipse')){const list=tool==='ellipse-walk'?'walkableEllipses':'blockedEllipses';scene[list]=scene[list]||[];scene[list].push({x:x+w/2,y:y+h/2,rx:w/2,ry:h/2});selection={kind:'ellipse',list,index:scene[list].length-1};}
    else{const list=tool==='rect-walk'?'walkable':'obstacles';scene[list]=scene[list]||[];scene[list].push({x,y,w,h});selection={kind:'rect',list,index:scene[list].length-1};}
    commit();
   }else render();
   return;
  }
  if(drag&&drag.changed&&drag.kind!=='pan')commit();
  drag=null;
 };
 viewport.addEventListener('pointerup',endDrag);viewport.addEventListener('pointercancel',()=>{drag=null;});
 viewport.addEventListener('dblclick',()=>{if(drawing?.points)finishPolygon();});
 const selectionLandmarkIndex=()=>selection.kind==='landmark'?selection.index:selection.landmark;
 function finishPolygon(){if(!drawing?.points)return;const {points,list}=drawing;drawing=null;if(points.length>=3){scene[list]=scene[list]||[];scene[list].push(points);selection={kind:'polygon',list,index:scene[list].length-1};commit();}else render();}
 function segmentDistance(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],len2=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((p.x-a[0])*dx+(p.y-a[1])*dy)/len2));return Math.hypot(p.x-(a[0]+t*dx),p.y-(a[1]+t*dy));}
 function moveShape(shape,before,dx,dy){
  if(selection.kind==='polygon')before.forEach((v,i)=>{shape[i]=[v[0]+dx,v[1]+dy];});
  else if(selection.kind==='bounds'){shape.left=before.left+dx;shape.right=before.right+dx;shape.top=before.top+dy;shape.bottom=before.bottom+dy;}
  else{shape.x=before.x+dx;shape.y=before.y+dy;}
 }
 function resizeShape(shape,before,drag,dx,dy,p){
  if(drag.vertex!==undefined){shape[drag.vertex]=[Math.round(p.x),Math.round(p.y)];return;}
  if(selection.kind==='ellipse'){if(drag.handle==='rx')shape.rx=Math.max(2,Math.round(Math.abs(p.x-shape.x)));else shape.ry=Math.max(2,Math.round(Math.abs(p.y-shape.y)));return;}
  if(selection.kind==='landmark'){shape.radius=Math.max(8,Math.round(Math.abs(p.x-shape.x)));return;}
  const rect=selection.kind==='bounds'?{x:before.left,y:before.top,w:before.right-before.left,h:before.bottom-before.top}:{...before};
  const h=drag.handle,left=[0,2,6].includes(h),right=[1,3,7].includes(h),top=[0,1,4].includes(h),bottom=[2,3,5].includes(h);
  let x=rect.x,y=rect.y,w=rect.w,hh=rect.h;
  if(left){x=rect.x+dx;w=rect.w-dx;}if(right)w=rect.w+dx;if(top){y=rect.y+dy;hh=rect.h-dy;}if(bottom)hh=rect.h+dy;
  if(w<2){w=2;}if(hh<2){hh=2;}
  if(selection.kind==='bounds'){shape.left=x;shape.top=y;shape.right=x+w;shape.bottom=y+hh;}else{shape.x=x;shape.y=y;shape.w=w;shape.h=hh;}
 }

 // ---- keyboard --------------------------------------------------------------------------------------------------
 window.addEventListener('keydown',e=>{
  if(e.target.matches('input,textarea,select'))return;
  if(e.code==='Space'){spaceDown=true;viewport.classList.add('pan');e.preventDefault();return;}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();save();return;}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();return;}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();redo();return;}
  if(e.key==='Escape'){if(drawing){drawing=null;render();}else{selection=null;renderProps();render();}return;}
  if(e.key==='Enter'&&drawing?.points){finishPolygon();return;}
  if(e.key==='Delete'||e.key==='Backspace'){deleteSelection();return;}
  const keys={v:'select',w:'rect-walk',b:'rect-block',p:'poly-walk',o:'poly-block',l:'landmark',r:'road'};
  if(keys[e.key.toLowerCase()]&&!e.ctrlKey){setTool(keys[e.key.toLowerCase()]);return;}
  if(e.key==='+'||e.key==='=')zoomAt(1.2,canvas.clientWidth/2,canvas.clientHeight/2);if(e.key==='-')zoomAt(1/1.2,canvas.clientWidth/2,canvas.clientHeight/2);if(e.key==='0')fit();
  const nudge={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
  if(nudge&&selection){e.preventDefault();const step=e.shiftKey?10:1,shape=selectedShape();moveShape(shape,clone(shape),nudge[0]*step,nudge[1]*step);commit();}
 });
 window.addEventListener('keyup',e=>{if(e.code==='Space'){spaceDown=false;viewport.classList.remove('pan');}});
 function deleteSelection(){
  if(!selection)return;
  if(selection.kind==='polygon'&&drag?.vertex!==undefined)return;
  if(selection.kind==='landmark'){const l=scene.landmarks[selection.index];if(l.to&&!confirm(`"${l.id}" is an exit to ${l.to}. Deleting it removes that route. Continue?`))return;scene.landmarks.splice(selection.index,1);removedLandmarks.add(l.id);}
  else if(selection.kind==='road')scene.landmarks[selection.landmark].roads.splice(selection.index,1);
  else if(selection.kind==='spawn'||selection.kind==='bounds')return;
  else scene[selection.list].splice(selection.index,1);
  selection=null;commit();
 }

 // ---- properties panel ------------------------------------------------------------------------------------------
 function renderProps(full=true){
  const box=$('props');if(!full&&!box.dataset.live)return;
  box.replaceChildren();box.dataset.live='1';
  if(!selection){box.append(hintNode('Nothing selected. Click a shape, or pick a tool and draw on the map.'));return;}
  const shape=selectedShape(),title=document.createElement('p');title.innerHTML='<b>'+({rect:'Rectangle',ellipse:'Ellipse',polygon:'Polygon',landmark:'Marker',road:'Road strip',spawn:'Spawn point',bounds:'Scene bounds'}[selection.kind])+'</b>'+(selection.list?' · '+(LISTS[selection.list].layer==='walkable'?'walkable':'blocked'):'');
  box.append(title);
  const field=(label,key,target,integer=true)=>{const row=document.createElement('label');row.className='field';row.append(document.createTextNode(label));const input=document.createElement('input');input.type='number';input.step='1';input.value=String(Math.round(target[key]));input.addEventListener('change',()=>{target[key]=integer?Math.round(Number(input.value)):Number(input.value);commit();});row.append(input);box.append(row);};
  if(selection.kind==='rect'||selection.kind==='road'){for(const k of ['x','y','w','h'])field(k.toUpperCase(),k,shape);}
  if(selection.kind==='ellipse'){for(const k of ['x','y','rx','ry'])field(k.toUpperCase(),k,shape);}
  if(selection.kind==='spawn'){field('X','x',shape);field('Y','y',shape);}
  if(selection.kind==='bounds'){for(const k of ['left','top','right','bottom'])field(k[0].toUpperCase()+k.slice(1),k,shape);}
  if(selection.kind==='polygon'){box.append(hintNode(shape.length+' points. Drag points to move them; Alt+click an edge to add one. Select a point and press Delete to remove it (minimum 3).'));
   const list=document.createElement('textarea');list.value=shape.map(v=>v.join(',')).join('\n');list.addEventListener('change',()=>{const pts=list.value.split(/\n+/).map(l=>l.split(',').map(Number)).filter(v=>v.length===2&&v.every(Number.isFinite));if(pts.length>=3){scene[selection.list][selection.index]=pts;commit();}});box.append(list);}
  if(selection.kind==='road'){const row=document.createElement('label');row.className='field';row.append(document.createTextNode('Direction'));const sel=document.createElement('select');for(const d of ['up','down','left','right'])sel.append(new Option(d,d));sel.value=shape.direction;sel.addEventListener('change',()=>{shape.direction=sel.value;commit();});row.append(sel);box.append(row);box.append(hintNode('Crossing this strip while moving in its direction triggers the exit of marker "'+scene.landmarks[selection.landmark].id+'".'));}
  if(selection.kind==='landmark'){
   const text=(label,key,multiline)=>{const row=document.createElement('label');row.className='field'+(multiline?' wide':'');row.append(document.createTextNode(label));const input=document.createElement(multiline?'textarea':'input');if(!multiline)input.type='text';input.value=shape[key]||'';input.disabled=!shape.studio&&key!=='radius';input.addEventListener('change',()=>{shape[key]=input.value;commit();});row.append(input);box.append(row);};
   text('Id','id');field('X','x',shape);field('Y','y',shape);field('Radius','radius',shape);text('Name','name');text('Text','text',true);
   if(shape.to)box.append(hintNode('Exit to "'+shape.to+'" arriving at '+shape.arrival.map(v=>Math.round(v)).join(',')+' (per-mille). Draw a Road strip to make walking across trigger it; the diamond itself triggers within '+(shape.radius||44)+'px.'));
   if(!shape.studio)box.append(hintNode('Name and text of code-defined markers stay in the code; position, radius and roads are editable here.'));
  }
  const del=document.createElement('button');del.type='button';del.textContent='Delete';del.className='danger';del.disabled=selection.kind==='spawn'||selection.kind==='bounds';del.addEventListener('click',deleteSelection);box.append(del);
 }
 function hintNode(text){const p=document.createElement('p');p.className='hint';p.textContent=text;return p;}

 // ---- tools / layers UI -----------------------------------------------------------------------------------------
 function setTool(name){tool=name;drawing=null;document.querySelectorAll('#tool-buttons button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tool===name)));viewport.style.cursor=name==='select'?'default':'crosshair';render();}
 document.querySelectorAll('#tool-buttons button').forEach(b=>b.addEventListener('click',()=>setTool(b.dataset.tool)));
 document.querySelectorAll('[data-layer]').forEach(box=>box.addEventListener('change',()=>{layers[box.dataset.layer]=box.checked;if(box.dataset.layer==='mask')scheduleMask();render();}));
 $('opacity').addEventListener('input',()=>{opacity=Number($('opacity').value)/100;render();});
 $('zoom-fit').addEventListener('click',fit);$('zoom-100').addEventListener('click',()=>{zoom=1;render();});
 $('zoom-in').addEventListener('click',()=>zoomAt(1.2,canvas.clientWidth/2,canvas.clientHeight/2));$('zoom-out').addEventListener('click',()=>zoomAt(1/1.2,canvas.clientWidth/2,canvas.clientHeight/2));
 $('scene').addEventListener('change',()=>loadScene($('scene').value));
 $('revert').addEventListener('click',()=>{if(!document_.scenes[scene.id]){status('This scene already uses its code geometry.');return;}if(!confirm('Discard the saved override for "'+scene.id+'" and go back to the geometry defined in code?'))return;history.push(snapshot());G.apply(scenes,{version:1,scenes:{[scene.id]:clone(originals[scene.id])}});removedLandmarks.clear();delete document_.scenes[scene.id];selection=null;setDirty(true);paintOverrideState();scheduleMask();render();renderProps();});
 $('export').addEventListener('click',()=>{const area=$('json');area.hidden=!area.hidden;area.value=JSON.stringify(exportScene(),null,1);});
 $('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(JSON.stringify(exportScene(),null,1));status('Scene JSON copied.','ok');}catch{$('json').hidden=false;$('json').value=JSON.stringify(exportScene(),null,1);$('json').select();}});
 function exportScene(){const entry=snapshot();for(const id of removedLandmarks)if(!entry.landmarks.some(l=>l.id===id))entry.landmarks.push({id,removed:true});return entry;}

 // ---- save ------------------------------------------------------------------------------------------------------
 async function save(){
  if(!remote){status('Read-only preview: run `npm run studio` to save.','error');return;}
  if(!dirty)return;
  if(document_.scenes[scene.id])document_.scenes[scene.id]=exportScene();
  status('Saving…');
  try{
   const response=await fetch('/api/geometry',{method:'POST',headers:{'Content-Type':'application/json','X-Studio-Token':token},body:JSON.stringify({revision,data:document_})});
   const body=await response.json();
   if(!response.ok)throw new Error(body.error||response.statusText);
   revision=body.revision;document_=body.data;setDirty(false);status('Saved to v8/data/scene-geometry.json at '+new Date().toLocaleTimeString()+' — reload the game to see it.','ok');paintOverrideState();
  }catch(error){status('Save failed: '+error.message,'error');}
 }
 $('save').addEventListener('click',save);
 window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});

 // ---- boot ------------------------------------------------------------------------------------------------------
 async function boot(){
  const select=$('scene');
  for(const s of Object.values(scenes).filter(s=>!s.world).sort((a,b)=>a.id.localeCompare(b.id)))select.append(new Option(s.name?`${s.id} — ${s.name}`:s.id,s.id));
  try{
   const response=await fetch('/api/geometry',{cache:'no-store'});
   if(!response.ok)throw new Error('no api');
   const body=await response.json();document_=body.data;revision=body.revision;token=body.token;remote=true;status('Connected to the studio server.','ok');
  }catch{document_=clone(window.V8_SCENE_GEOMETRY_DATA||{version:1,scenes:{}});status('Read-only preview (no studio server). Use Copy JSON to export.','dirty');}
  G.apply(scenes,document_);
  loadScene(new URLSearchParams(location.search).get('scene')||'plaza');
  new ResizeObserver(resize).observe(viewport);resize();
 }
 window.STUDIO={get state(){return {scene:scene?.id,tool,selection,dirty,remote,zoom,overrides:Object.keys(document_.scenes)};},loadScene,setTool,select(sel){selection=sel;renderProps();render();},
  add(list,shape){scene[list]=scene[list]||[];scene[list].push(shape);selection={kind:LISTS[list].kind,list,index:scene[list].length-1};commit();},exportScene,save,undo,redo,deleteSelection,snapshot,originals,document:()=>document_};
 boot();
})();
