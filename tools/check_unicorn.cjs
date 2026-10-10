const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const context={window:{}};for(const file of ['map','unicorn'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,`../src/${file}.js`),'utf8'),context);
const town=context.window.TOWN;
function blocked(x,y,rx=8,ry=4){const b=town.bounds;return x-rx<b.left||x+rx>b.right||y-ry<b.top||y+ry>b.bottom||town.obstacles.some(o=>x+rx>o.x&&x-rx<o.x+o.w&&y+ry>o.y&&y-ry<o.y+o.h)}
const {create}=context.window.FAMILY_UNICORN,horse=create({blocked});assert(!blocked(horse.state.x,horse.state.y,14,7));
const rider={...town.spawn,id:'jason',direction:'left',moving:false,running:false};assert(!horse.interact(rider),'must discover and approach');rider.x=horse.state.x-20;rider.y=horse.state.y;assert(horse.nearby(rider));assert(horse.interact(rider));assert(horse.riding);
rider.x-=30;rider.moving=true;horse.update(.2,rider);assert.equal(horse.state.x,rider.x);assert(horse.state.clock>0);assert(horse.interact(rider));assert(!horse.riding);assert(!blocked(rider.x,rider.y));assert(horse.nearby(rider));assert(horse.interact(rider),'can remount where left');
for(const home of [{x:1460,y:970},{x:768,y:562}]){
 const h=create({blocked,home}),a={...home,direction:'up'};assert(h.interact(a));assert(h.interact(a));assert(!blocked(a.x,a.y),'safe dismount by edges/narrow path');
}
// Walking and mounted collision grids must both reach the hidden unicorn.
for(const mounted of [false,true]){
 const step=8,queue=[[0,0]],seen=new Set(['0,0']),home=create({blocked}).state;let reached=false;
 for(let head=0;head<queue.length&&!reached;head++){
  const [ix,iy]=queue[head],x=town.spawn.x+ix*step,y=town.spawn.y+iy*step;if(Math.hypot(x-home.x,y-home.y)<16)reached=true;
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const key=(ix+dx)+','+(iy+dy);if(seen.has(key))continue;seen.add(key);const rx=mounted?14:8,ry=mounted?7:4;if(!blocked(x+dx*step,y+dy*step,rx,ry)&&!blocked(x+dx*step/2,y+dy*step/2,rx,ry))queue.push([ix+dx,iy+dy]);}
 }assert(reached,mounted?'mounted map path':'walking discovery path');
}
console.log('Unicorn: reachable home, proximity gate, mount, moving with rider, safe edge/path dismount and remount passed');
