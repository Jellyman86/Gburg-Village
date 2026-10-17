((root)=>{
 'use strict';
 const contains=(p,x,y)=>{
  let inside=false;
  for(let i=0,j=p.length-1;i<p.length;j=i++){
   const [ax,ay]=p[i],[bx,by]=p[j];
   if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;
  }
  return inside;
 };
 function blocked(scene,x,y,rx=8,ry=4){
  const b=scene.bounds;
  if(x-rx<b.left||x+rx>b.right||y-ry<b.top||y+ry>b.bottom)return true;
  const points=[[x-rx,y-ry],[x+rx,y-ry],[x-rx,y+ry],[x+rx,y+ry]];
  if(scene.walkable||scene.walkablePolygons){
   for(const [px,py] of points)if(!(scene.walkable||[]).some(o=>px>=o.x&&px<=o.x+o.w&&py>=o.y&&py<=o.y+o.h)&&
    !(scene.walkablePolygons||[]).some(p=>contains(p,px,py))&&
    !(scene.walkableEllipses||[]).some(o=>((px-o.x)/o.rx)**2+((py-o.y)/o.ry)**2<=1))return true;
  }
  return (scene.blockedEllipses||[]).some(o=>((x-o.x)/(o.rx+rx))**2+((y-o.y)/(o.ry+ry))**2<1)||
   (scene.obstacles||[]).some(o=>x+rx>o.x&&x-rx<o.x+o.w&&y+ry>o.y&&y-ry<o.y+o.h)||
   (scene.blockedPolygons||[]).some(p=>points.some(([px,py])=>contains(p,px,py)));
 }
 // Deterministic scatter for `swarms: [{kind, count, area?:[x,y,w,h], spacing?, clearSpawn?}]` in an area definition: samples
 // ground the player can actually walk to from the spawn (so nothing lands in a pocket), keeps clear of the arrival point
 // and of exits, and relaxes the spacing if the area is crowded. Seeded by scene id, so a scene always gets the same layout.
 function placeSwarms(scene,swarms){
  const step=16,seen=new Set(['0,0']),queue=[[0,0]],cells=[];
  for(let i=0;i<queue.length;i++){
   const [gx,gy]=queue[i],x=scene.spawn.x+gx*step,y=scene.spawn.y+gy*step;
   cells.push({x,y});
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const key=(gx+dx)+','+(gy+dy);
    if(!seen.has(key)&&!blocked(scene,scene.spawn.x+(gx+dx)*step,scene.spawn.y+(gy+dy)*step)){seen.add(key);queue.push([gx+dx,gy+dy]);}
   }
  }
  let state=0;for(const ch of scene.id)state=(state*31+ch.charCodeAt(0))>>>0;
  const random=()=>{state=(state+0x6D2B79F5)>>>0;let t=state;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};
  const exits=scene.landmarks.filter(p=>p.to),taken=scene.enemies.map(e=>({x:e.x,y:e.y})),placed=[];
  for(const swarm of swarms){
   if(!swarm.kind||!Number.isInteger(swarm.count)||swarm.count<1)throw new Error('Invalid swarm in '+scene.id);
   const [ax,ay,aw,ah]=swarm.area||[0,0,scene.width,scene.height],clear=swarm.clearSpawn??160;
   const pool=cells.filter(c=>c.x>=ax&&c.x<=ax+aw&&c.y>=ay&&c.y<=ay+ah&&Math.hypot(c.x-scene.spawn.x,c.y-scene.spawn.y)>=clear&&exits.every(e=>Math.hypot(c.x-e.x,c.y-e.y)>=90));
   for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
   let spacing=swarm.spacing||44,count=0;
   while(count<swarm.count&&spacing>=10){
    for(const c of pool){
     if(count>=swarm.count)break;
     if(taken.some(t=>Math.hypot(t.x-c.x,t.y-c.y)<spacing))continue;
     const x=c.x+Math.round((random()-.5)*8),y=c.y+Math.round((random()-.5)*8);
     if(blocked(scene,x,y))continue;
     taken.push({x,y});placed.push({kind:swarm.kind,x,y,swarm:true,...(swarm.scripted?{scripted:true}:{})});count++;
    }
    spacing*=.75;
   }
   if(count<swarm.count)throw new Error(`Swarm in ${scene.id} placed ${count} of ${swarm.count} ${swarm.kind}; widen its area.`);
  }
  return placed;
 }
 function create(def){
  const {id,name,width,height,spawn,paths=[],polygons=[],obstacles=[],blockedPolygons=[],exits=[],points=[],enemies=[],swarms=[]}=def;
  // Areas name their background by art id; the manifest supplies the URL and guarantees the authored size matches the file.
  let image=def.image;
  if(def.art){
   if(!root.V8_ART)throw new Error('V8_ART must load before area definitions: '+id);
   const entry=root.V8_ART.entry(def.art);
   if(entry.width!==width||entry.height!==height)throw new Error(`Area ${id} is authored at ${width}x${height} but ${def.art} is ${entry.width}x${entry.height}`);
   image=root.V8_ART.url(def.art);
  }
  if(!id||!name||!image||!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0||!spawn)throw new Error('Invalid area definition: '+id);
  const scene={id,name,image,width,height,region:def.region,music:def.music,worldSite:def.worldSite,ambientFlight:def.ambientFlight===true,
   bounds:{left:0,top:0,right:width,bottom:height},spawn:{...spawn},
   walkable:paths.map(([x,y,w,h])=>({x,y,w,h})),walkablePolygons:polygons,
   obstacles:obstacles.map(([x,y,w,h])=>({x,y,w,h})),blockedPolygons,
   landmarks:exits.concat(points),enemies,hint:def.hint};
  for(const p of polygons.concat(blockedPolygons)){
   if(p.length<3||p.some(v=>v.length!==2||v.some(n=>!Number.isFinite(n))))throw new Error('Invalid polygon in '+id);
  }
  for(const o of scene.walkable.concat(scene.obstacles))if(![o.x,o.y,o.w,o.h].every(Number.isFinite)||o.w<=0||o.h<=0)throw new Error('Invalid rectangle in '+id);
  if(blocked(scene,spawn.x,spawn.y))throw new Error('Blocked spawn in '+id);
  for(const e of enemies)if(!e.kind||blocked(scene,e.x,e.y))throw new Error('Blocked dinosaur spawn in '+id);
  for(const p of scene.landmarks)if(blocked(scene,p.x,p.y))throw new Error('Blocked interaction: '+id+'/'+p.id);
  if(swarms.length)scene.enemies=scene.enemies.concat(placeSwarms(scene,swarms));
  return scene;
 }
 function install(defs,scenes){
  for(const def of defs){
   if(scenes[def.id])throw new Error('Duplicate area: '+def.id);
   scenes[def.id]=create(def);
  }
  for(const def of defs)for(const exit of scenes[def.id].landmarks.filter(p=>p.to)){
   const target=scenes[exit.to];
   if(!target||!exit.arrival||exit.arrival.length!==2)throw new Error('Invalid exit: '+def.id+'/'+exit.id);
   if(!target.world&&blocked(target,exit.arrival[0]*target.width/1000,exit.arrival[1]*target.height/1000))throw new Error('Blocked arrival: '+def.id+'/'+exit.id);
  }
 }
 const api={contains,blocked,create,install};
 root.V8_AREAS=Object.freeze(api);
 if(typeof module!=='undefined'&&module.exports)module.exports=root.V8_AREAS;
})(typeof window==='undefined'?globalThis:window);
