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
Object.assign(actor,forest);const forestLanding=world.land(actor);
assert(!forestLanding.ok||([2,3,5].includes(world.terrain(world.state.plane.x,world.state.plane.y))&&Math.hypot(world.state.plane.x-forest.x,world.state.plane.y-forest.y)<=91),'Landing over forest either fails or glides to clear ground within two tiles');
if(forestLanding.ok)assert(world.board(actor).ok);
const deepWater={x:16,y:16};Object.assign(actor,deepWater);assert(!world.land(actor).ok,'Open ocean has no landing spot to glide to');
const hawaiiSite=travel.sites.find(s=>s.id==='hawaii');
for(const [dx,dy] of [[-60,0],[60,0],[0,-60],[0,60],[45,45]]){Object.assign(actor,{x:hawaiiSite.x+dx,y:hawaiiSite.y+dy});assert(world.land(actor).ok,'Hawaii has room to land around the marker: '+dx+','+dy);assert(world.board(actor).ok);}
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
const flightScope={window:{},SCENES:{world:{id:'world'},'hawaii-central':{id:'hawaii-central',worldSite:'hawaii',ambientFlight:false},'nyc-central':{id:'nyc-central',worldSite:'nyc',ambientFlight:true}},matchMedia:()=>({matches:false})};vm.createContext(flightScope);
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','src','flight.js'),'utf8'),flightScope);
let grabs=0,drops=0;const bird=flightScope.window.V4_FLIGHT.create({onGrab:()=>grabs++,onDrop:()=>drops++});
for(const id of ['world','hawaii-central']){bird.enter(id,actor);bird.update(60,actor,flightScope.SCENES[id]);assert(!bird.grab(actor,id));}
assert.equal(grabs,0,'The pterodactyl lift never interferes with jet travel, the world map or Hawaii');
bird.enter('nyc-central',actor);bird.update(60,actor,flightScope.SCENES['nyc-central']);bird.update(.1,actor,flightScope.SCENES['nyc-central']);
assert.equal(grabs,1,'The pterodactyl lifts the player in the new destinations');
bird.update(4,actor,flightScope.SCENES['nyc-central']);assert.equal(drops,1,'... and drops them safely');const scope={window:{}};vm.createContext(scope);
for(const name of ['art','action-art','characters','powers','rpg'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..','src',name+'.js'),'utf8'),scope);
assert.equal(Object.keys(scope.window.CHARACTERS).length,15);assert.equal(scope.window.FAMILY_POWERS.definitions.grenade.cooldown,.6);
assert(scope.window.CHARACTERS.jeff.sheet.startsWith('assets/characters/jeff.png?v='),'Cleaned Jeff resolves through the V8 art manifest');
assert(Object.keys(scope.window.CHARACTERS).every(id=>scope.window.V8_ART.has('character.'+id+'.walk')&&scope.window.V8_ART.has('portrait.'+id)),'Every roster member has walk art and a portrait in the manifest');
assert(fs.readFileSync(path.join(__dirname,'..','src','settings.js'),'utf8').includes('gburg-v8-preferences'),'Preferences are V8-isolated');
const playable=travel.sites.filter(s=>s.to);
assert(playable.length>=8,'Every finished destination is a playable world site');
for(const site of playable){
 const probe=travel.create(JSON.parse(fs.readFileSync(path.join(__dirname,'..','data','world-grid.json'),'utf8')));
 let landed=0,total=0;
 for(let dy=-96;dy<=96;dy+=16)for(let dx=-96;dx<=96;dx+=16){
  probe.park(site.x,site.y);const pilot={x:site.x,y:site.y};assert(probe.board(pilot).ok,'Can board at '+site.id);
  Object.assign(pilot,{x:site.x+dx,y:site.y+dy});total++;if(probe.land(pilot).ok)landed++;
 }
 assert.equal(landed,total,'Jet lands from anywhere within three tiles of '+site.id+' ('+landed+'/'+total+')');
}
console.log('PASS: Earth schema/geography, neighbor-selected terrain corners, safe arrivals, camera-relative forward/reverse/turn/boost/wrap/poles, boost-only flame frames, rejected water/forest landing, plane persistence, full roster/shared art and landing within three tiles of every playable destination (including Italy and the Philippines).');
