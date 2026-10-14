const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const travel=require('../src/world-travel.js'),data=require('../data/world-grid.json');
const world=travel.create(data),actor={...travel.start};
assert.throws(()=>travel.create({...data,cells:['invalid']}),/Invalid V8/);
assert.throws(()=>travel.create({...data,tileSize:64}),/Invalid V8/);
assert(!world.blocked(actor.x,actor.y),'Starting arrival is safe');
assert(!world.board(actor).ok,'Cannot board from too far away');
Object.assign(actor,travel.field);assert(world.board(actor).ok);assert(world.flying);
assert(!world.board(actor).ok,'Cannot board twice');
world.update(1,actor,0,-1);assert.equal(actor.x,travel.field.x);assert.equal(actor.y,travel.field.y-300,'Up flies forward');
const before=actor.y;world.update(1,actor,0,-1,true);assert.equal(before-actor.y,460,'Run boosts flight');
assert.deepEqual(travel.planePose(world.state),{row:1,frame:2},'Boost excludes the no-flame first pose in the second row');
world.update(.1,actor,0,0);assert.deepEqual(travel.planePose(world.state),{row:0,frame:0},'Releasing Run immediately removes flames');
const stationary={x:actor.x,y:actor.y};
world.update(Math.PI/2/1.8,actor,1,0);assert.deepEqual({x:actor.x,y:actor.y},stationary,'Turn-only input rotates in place');
assert(Math.abs(world.state.heading-Math.PI/2)<1e-10);
Object.assign(actor,{x:travel.width-5,y:100});world.update(.1,actor,0,-1);assert(Math.abs(actor.x-25)<1e-8,'Forward flight at east heading wraps');
world.update(.1,actor,0,1);assert(Math.abs(actor.x-(travel.width-5))<1e-8,'Down reverses relative to current heading');
world.update(Math.PI/2/1.8,actor,-1,0);actor.y=13;world.update(1,actor,0,-1);assert.equal(actor.y,12,'Polar boundary stays safe');
assert.deepEqual(travel.planePose({flying:false,boosting:true,clock:1.3}),{row:0,frame:0},'Parked plane never has flames');
for(const clock of [.01,.15,.28,.4]){
 assert.deepEqual(travel.planePose({flying:true,boosting:false,clock}),{row:0,frame:0},'Cruise never flashes flame frames');
 const pose=travel.planePose({flying:true,boosting:true,clock});
 assert.equal(pose.row,1);assert(pose.frame>=1&&pose.frame<=3,'Boost never cycles through the no-flame pose');
}
Object.assign(actor,{x:16,y:16});assert(world.blocked(actor.x,actor.y));assert(!world.land(actor).ok);assert(world.flying,'Water landing never strands the party');
for(const site of travel.sites){
 Object.assign(actor,site);assert(!world.blocked(actor.x,actor.y,14,10),'Destination landing pad: '+site.id);
 assert(world.land(actor).ok);assert(!world.flying);assert.deepEqual(world.state.plane,{x:site.x,y:site.y});
 assert(world.nearPlane(actor));assert(world.board(actor).ok);
}
const forest=data.cells.flatMap((row,y)=>[...row].map((id,x)=>({id:+id,x:(x+.5)*32,y:(y+.5)*32}))).find(p=>p.id===4&&world.terrain(p.x,p.y)===4);
Object.assign(actor,forest);assert(!world.land(actor).ok,'Forest blocks landing');
const seam=travel.create({...data,cells:Array(96).fill('2'.repeat(128))}),edge={...travel.field};
assert(seam.board(edge).ok);Object.assign(edge,{x:travel.width-12,y:1500});assert(seam.land(edge).ok);
edge.x=12;assert(seam.nearPlane(edge),'Parked jet is reachable across the horizontal seam');assert(seam.board(edge).ok);
const terrainBefore=JSON.stringify(world.cells);
const uniform=Array.from({length:96},()=>Array(128).fill(2));
assert.equal(travel.quadrant(uniform,0,0,0).frame,1,'Polar coast has a top edge');
uniform[9][10]=0;uniform[10][9]=0;
assert.equal(travel.quadrant(uniform,10,10,0).frame,2,'Two water neighbors choose a convex corner');
uniform[9][10]=2;uniform[10][9]=2;uniform[9][9]=0;
assert.equal(travel.quadrant(uniform,10,10,0).frame,3,'Diagonal water selects an inner corner');
uniform[10][10]=3;assert.equal(travel.quadrant(uniform,10,10,0,true).row,3,'Desert-to-grass transition');
uniform[10][10]=5;assert.equal(travel.quadrant(uniform,10,10,0,true).row,4,'Snow-to-grass transition');
for(let y=0;y<96;y++)for(let x=0;x<128;x++)for(let q=0;q<4;q++)travel.quadrant(world.cells,x,y,q);
assert.equal(JSON.stringify(world.cells),terrainBefore,'Visual selection never changes collision geography');
const flightScope={window:{},SCENES:{world:{id:'world'},nyc:{id:'nyc'}},matchMedia:()=>({matches:false})};vm.createContext(flightScope);
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','src','flight.js'),'utf8'),flightScope);
let grabs=0;const bird=flightScope.window.V4_FLIGHT.create({onGrab:()=>grabs++,onDrop(){}});
for(const id of ['world','nyc']){bird.enter(id,actor);bird.update(60,actor,flightScope.SCENES[id]);assert(!bird.grab(actor,id));}
assert.equal(grabs,0,'Old pterodactyl lift cannot interfere with jet travel or NYC');
const scope={window:{}};vm.createContext(scope);
for(const name of ['action-art','characters','powers','rpg'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..','src',name+'.js'),'utf8'),scope);
assert.equal(Object.keys(scope.window.CHARACTERS).length,15);assert.equal(scope.window.FAMILY_POWERS.definitions.grenade.cooldown,.6);
assert(scope.window.CHARACTERS.jeff.sheet.startsWith('../v6/assets/'),'Cleaned Jeff is shared, not duplicated');
assert(fs.readFileSync(path.join(__dirname,'..','src','settings.js'),'utf8').includes('gburg-v8-preferences'),'Preferences are V8-isolated');
const nycBlocked=(x,y)=>x<40||y<36||x>1240||y>988||travel.nycObstacles.some(o=>x+8>o.x&&x-8<o.x+o.w&&y+4>o.y&&y-4<o.y+o.h);
const pending=[[640,912]],seen=new Set(['640,912']);
for(let i=0;i<pending.length;i++){
 const [x,y]=pending[i];for(const [dx,dy] of [[16,0],[-16,0],[0,16],[0,-16]]){
  const nx=x+dx,ny=y+dy,key=nx+','+ny;if(!seen.has(key)&&!nycBlocked(nx,ny)){seen.add(key);pending.push([nx,ny]);}
 }
}
for(const [name,x,y] of [['park',520,440],['subway',744,400],['overlook',1060,875]]){
 assert(pending.some(([px,py])=>Math.hypot(px-x,py-y)<35),'NYC location has a connected walking route: '+name);
}
console.log('PASS: Earth schema/geography, neighbor-selected terrain corners, safe arrivals, camera-relative forward/reverse/turn/boost/wrap/poles, boost-only flame frames, rejected water/forest landing, plane persistence, full roster/shared art and connected NYC streets.');
