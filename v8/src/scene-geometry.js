// Scene geometry overrides: data/scene-geometry.json (via generated scene-geometry-data.js) replaces a scene's collision
// shapes, spawn, bounds and landmark placement at load. Scenes without an entry keep their code-defined geometry.
// The studio (v8/studio) edits the same structure, so saving there changes the game without touching JavaScript.
((root)=>{
 'use strict';
 const SHAPES=['walkable','walkablePolygons','walkableEllipses','obstacles','blockedPolygons','blockedEllipses'];
 const finite=(...values)=>values.every(v=>typeof v==='number'&&Number.isFinite(v));
 const round=v=>Math.round(v*100)/100;
 const rect=o=>({x:round(o.x),y:round(o.y),w:round(o.w),h:round(o.h)});
 const ellipse=o=>({x:round(o.x),y:round(o.y),rx:round(o.rx),ry:round(o.ry)});
 const polygon=p=>p.map(([x,y])=>[round(x),round(y)]);
 const road=r=>({x:round(r.x),y:round(r.y),w:round(r.w),h:round(r.h),direction:r.direction});

 function validate(data,scenes){
  if(!data||data.version!==1||!data.scenes||typeof data.scenes!=='object'||Array.isArray(data.scenes))throw new Error('scene-geometry needs version 1 and a scenes object.');
  for(const [id,entry] of Object.entries(data.scenes)){
   if(scenes&&!scenes[id])throw new Error('Unknown scene in geometry data: '+id);
   if(!entry||typeof entry!=='object')throw new Error('Scene entry must be an object: '+id);
   for(const key of Object.keys(entry))if(![...SHAPES,'spawn','bounds','landmarks'].includes(key))throw new Error(`Unknown geometry field ${key} in ${id}`);
   for(const key of ['walkable','obstacles'])for(const o of entry[key]||[])if(!finite(o.x,o.y,o.w,o.h)||o.w<=0||o.h<=0)throw new Error(`Invalid rectangle in ${id}.${key}`);
   for(const key of ['walkableEllipses','blockedEllipses'])for(const o of entry[key]||[])if(!finite(o.x,o.y,o.rx,o.ry)||o.rx<=0||o.ry<=0)throw new Error(`Invalid ellipse in ${id}.${key}`);
   for(const key of ['walkablePolygons','blockedPolygons'])for(const p of entry[key]||[])if(!Array.isArray(p)||p.length<3||p.some(v=>!Array.isArray(v)||v.length!==2||!finite(v[0],v[1])))throw new Error(`Invalid polygon in ${id}.${key}`);
   if(entry.spawn&&!finite(entry.spawn.x,entry.spawn.y))throw new Error('Invalid spawn in '+id);
   if(entry.bounds&&(!finite(entry.bounds.left,entry.bounds.top,entry.bounds.right,entry.bounds.bottom)||entry.bounds.right<=entry.bounds.left||entry.bounds.bottom<=entry.bounds.top))throw new Error('Invalid bounds in '+id);
   for(const l of entry.landmarks||[]){
    if(!l||typeof l.id!=='string'||!l.id)throw new Error('Landmark needs an id in '+id);
    if(l.removed)continue;
    if(!finite(l.x,l.y)||(l.radius!==undefined&&(!finite(l.radius)||l.radius<=0)))throw new Error(`Invalid landmark ${l.id} in ${id}`);
    for(const r of l.roads||[])if(!finite(r.x,r.y,r.w,r.h)||!['up','down','left','right'].includes(r.direction))throw new Error(`Invalid road on ${l.id} in ${id}`);
   }
  }
  return data;
 }

 // Snapshot of everything the studio may edit, in the override format.
 function extract(scene){
  const entry={};
  for(const key of SHAPES){
   const list=scene[key]||[];
   entry[key]=key.endsWith('Polygons')?list.map(polygon):key.endsWith('Ellipses')?list.map(ellipse):list.map(rect);
  }
  entry.spawn={x:round(scene.spawn.x),y:round(scene.spawn.y)};
  entry.bounds={left:round(scene.bounds.left),top:round(scene.bounds.top),right:round(scene.bounds.right),bottom:round(scene.bounds.bottom)};
  entry.landmarks=(scene.landmarks||[]).map(l=>{
   const out={id:l.id,x:round(l.x),y:round(l.y)};
   if(l.radius!==undefined)out.radius=round(l.radius);
   if(l.roads)out.roads=l.roads.map(road);
   if(l.studio){out.name=l.name;out.text=l.text;out.studio=true;}
   return out;
  });
  return entry;
 }

 // Apply overrides to live scenes. Landmarks merge by id so portals, pickups and story markers keep their behaviour.
 function apply(scenes,data){
  data=data||root.V8_SCENE_GEOMETRY_DATA||{version:1,scenes:{}};
  validate(data);
  const applied=[];
  for(const [id,entry] of Object.entries(data.scenes)){
   const scene=scenes[id];
   if(!scene){console.warn('Scene geometry refers to a scene that does not exist: '+id);continue;}
   for(const key of SHAPES)if(entry[key])scene[key]=entry[key].map(item=>Array.isArray(item)?item.map(v=>[...v]):{...item});
   // No walkable shapes at all means "everything inside bounds is walkable"; the game detects that by the arrays being absent.
   if(['walkable','walkablePolygons','walkableEllipses'].every(key=>!(scene[key]&&scene[key].length)))for(const key of ['walkable','walkablePolygons','walkableEllipses'])delete scene[key];
   if(entry.spawn)scene.spawn={x:entry.spawn.x,y:entry.spawn.y};
   if(entry.bounds)scene.bounds={...entry.bounds};
   if(entry.landmarks){
    scene.landmarks=scene.landmarks||[];
    for(const l of entry.landmarks){
     const index=scene.landmarks.findIndex(existing=>existing.id===l.id);
     if(l.removed){if(index>=0)scene.landmarks.splice(index,1);continue;}
     if(index>=0){
      const target=scene.landmarks[index];target.x=l.x;target.y=l.y;
      if(l.radius!==undefined)target.radius=l.radius;
      if(l.roads)target.roads=l.roads.map(r=>({...r}));
      if(l.studio){target.name=l.name;target.text=l.text;}
     }else scene.landmarks.push({id:l.id,name:l.name||l.id,x:l.x,y:l.y,radius:l.radius||44,text:l.text||'',studio:true,...(l.roads?{roads:l.roads.map(r=>({...r}))}:{})});
    }
   }
   applied.push(id);
  }
  return applied;
 }

 const api=Object.freeze({SHAPES,validate,extract,apply});
 root.V8_GEOMETRY=api;if(root!==globalThis)globalThis.V8_GEOMETRY=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
