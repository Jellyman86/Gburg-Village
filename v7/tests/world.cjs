const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const travel=require('../src/world-travel.js'),data=require('../data/world-grid.json');
const world=travel.create(data),actor={...travel.start};
assert.throws(()=>travel.create({...data,cells:['invalid']}),/Invalid V7/);
assert.throws(()=>travel.create({...data,tileSize:64}),/Invalid V7/);
assert(!world.blocked(actor.x,actor.y),'Starting arrival is safe');
assert(!world.board(actor).ok,'Cannot board from too far away');
Object.assign(actor,travel.field);assert(world.board(actor).ok);assert(world.flying);
assert(!world.board(actor).ok,'Cannot board twice');
world.update(1,actor,1,0);assert.equal(actor.x,travel.field.x+300);assert.equal(actor.y,travel.field.y);
const before=actor.x;world.update(1,actor,1,0,true);assert.equal(actor.x-before,460,'Run boosts flight');
Object.assign(actor,{x:travel.width-5,y:100});world.update(.1,actor,1,0);assert.equal(actor.x,25,'East-west world wraps');
actor.y=13;world.update(1,actor,0,-1);assert.equal(actor.y,12,'Polar boundary stays safe');
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
const flightScope={window:{},SCENES:{world:{id:'world'},nyc:{id:'nyc'}},matchMedia:()=>({matches:false})};vm.createContext(flightScope);
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','src','flight.js'),'utf8'),flightScope);
let grabs=0;const bird=flightScope.window.V4_FLIGHT.create({onGrab:()=>grabs++,onDrop(){}});
for(const id of ['world','nyc']){bird.enter(id,actor);bird.update(60,actor,flightScope.SCENES[id]);assert(!bird.grab(actor,id));}
assert.equal(grabs,0,'Old pterodactyl lift cannot interfere with jet travel or NYC');
const scope={window:{}};vm.createContext(scope);
for(const name of ['action-art','characters','powers','rpg'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..','src',name+'.js'),'utf8'),scope);
assert.equal(Object.keys(scope.window.CHARACTERS).length,15);assert.equal(scope.window.FAMILY_POWERS.definitions.grenade.cooldown,.6);
assert(scope.window.CHARACTERS.jeff.sheet.startsWith('../v6/assets/'),'Cleaned Jeff is shared, not duplicated');
assert(fs.readFileSync(path.join(__dirname,'..','src','settings.js'),'utf8').includes('gburg-v7-preferences'),'Preferences are V7-isolated');
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
console.log('PASS: tiled Earth schema, safe arrivals/landing pads, board distance, free flight/boost/world wrap/poles, rejected water/forest landing, plane persistence, full roster/shared clean art, isolated preferences and connected NYC streets.');
