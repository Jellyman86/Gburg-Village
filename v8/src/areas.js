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
 function create(def){
  const {id,name,image,width,height,spawn,paths=[],polygons=[],obstacles=[],blockedPolygons=[],exits=[],points=[],enemies=[]}=def;
  if(!id||!name||!image||!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0||!spawn)throw new Error('Invalid area definition: '+id);
  const scene={id,name,image,width,height,region:def.region,music:def.music,worldSite:def.worldSite,ambientFlight:false,
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
