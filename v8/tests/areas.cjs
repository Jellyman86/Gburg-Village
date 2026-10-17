const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const areas=require('../src/areas.js'),hawaii=require('../src/hawaii.js'),destinations=require('../src/destinations.js'),travel=require('../src/world-travel.js'),flyers=require('../src/world-flyers.js');
const artManifest=require('../src/art.js');
// destinations.all already includes Hawaii when hawaii.js was loaded first (as the game does), so dedupe by id.
const defs=[...new Map(hawaii.defs.concat(destinations.all).map(def=>[def.id,def])).values()];
for(const def of defs)assert(artManifest.has(def.art),'Area background is declared in the art manifest: '+def.id);
const data=require('../data/world-grid.json'),world=travel.create(data),scenes={world:{world:true,width:travel.width,height:travel.height}};
areas.install(defs,scenes);
const failures=[];
for(const def of defs){
 const scene=scenes[def.id],step=8,queue=[[scene.spawn.x,scene.spawn.y]],seen=new Set([queue[0].join(',')]);
 for(let i=0;i<queue.length;i++){
  const [x,y]=queue[i];
  for(const [dx,dy] of [[step,0],[-step,0],[0,step],[0,-step]]){
   const nx=x+dx,ny=y+dy,key=nx+','+ny;
   if(!seen.has(key)&&!areas.blocked(scene,nx,ny)){seen.add(key);queue.push([nx,ny]);}
  }
 }
 for(const target of scene.landmarks.concat(scene.enemies))if(!queue.some(([x,y])=>Math.hypot(x-target.x,y-target.y)<18))failures.push(def.id+': unreachable '+(target.id||target.kind));
 for(const exit of scene.landmarks.filter(p=>p.to)){
  const target=scenes[exit.to],x=exit.arrival[0]*target.width/1000,y=exit.arrival[1]*target.height/1000;
  assert(!(target.world?world.blocked(x,y):areas.blocked(target,x,y)),'Safe arrival: '+def.id+'/'+exit.id);
  assert(exit.roads.length&&exit.arrivalDirection,'Every route has a directional crossing and facing');
 }
 console.log(def.id+': '+queue.length+' reachable walking samples');
}
assert.deepEqual(failures,[],'Every destination interaction, exit and enemy is connected');
for(const [id,x,y] of [['hawaii-central',725,475],['hawaii-central',725,650],['hawaii-west',1070,300],['hawaii-east',1200,700],['hawaii-north',350,500]])
 assert(areas.blocked(scenes[id],x,y),'Scenery blocks movement: '+id);
assert.equal(travel.sites.find(s=>s.id==='hawaii').to,'hawaii-central');
assert.equal(world.terrain(34.5*32,36.5*32),2,'Florida has land in the logical map');
assert(world.land({...travel.field}).ok===false,'Cannot land without boarding');
const birds=flyers.create(travel.width,travel.height),actor={...flyers.homes[0]},original=JSON.stringify(actor);
birds.update(6,actor);assert.equal(birds.state[0].mode,'follow');
birds.update(2.99,actor);assert.equal(birds.state[0].mode,'follow');
birds.update(.02,actor);assert.equal(birds.state[0].mode,'depart');
birds.update(3,actor);assert.equal(birds.state[0].mode,'wander');assert(birds.state[0].cooldown>20);
assert.equal(JSON.stringify(actor),original,'Flyers never move, damage or grab the player');
assert.throws(()=>birds.update(-1,actor),/timestep/);
for(const name of fs.readdirSync(path.join(__dirname,'..','src')).filter(f=>f.endsWith('.js')))
 new vm.Script(fs.readFileSync(path.join(__dirname,'..','src',name),'utf8'),{filename:name});
console.log('PASS: Hawaii geometry/connectivity/safe routes, logical Florida, harmless three-second followers with cooldown, and all runtime syntax.');
