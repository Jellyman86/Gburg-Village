const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const world = { window: null };
world.window = world;
vm.createContext(world);
for (const file of ['map.js', 'scenes.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'src', file), 'utf8'), world, { filename: file });
}
const scenes = world.SCENES;
// Same four-corner foot coverage and obstacle overlap as game.js (rx=8, ry=4).
function blocked(scene, x, y, rx = 8, ry = 4) {
  const b = scene.bounds;
  if (x-rx < b.left || x+rx > b.right || y-ry < b.top || y+ry > b.bottom) return true;
  if (scene.walkable) {
    for (const [px, py] of [[x-rx,y-ry],[x+rx,y-ry],[x-rx,y+ry],[x+rx,y+ry]]) {
      if (!scene.walkable.some(o => px >= o.x && px <= o.x+o.w && py >= o.y && py <= o.y+o.h) &&
          !(scene.walkableEllipses || []).some(o => ((px-o.x)/o.rx)**2+((py-o.y)/o.ry)**2 <= 1)) return true;
    }
  }
  if ((scene.blockedEllipses || []).some(o => ((x-o.x)/(o.rx+rx))**2+((y-o.y)/(o.ry+ry))**2 < 1)) return true;
  return scene.obstacles.some(o => x+rx > o.x && x-rx < o.x+o.w && y+ry > o.y && y-ry < o.y+o.h);
}
function reachable(scene, start) {
  const step = 4, cols = Math.ceil(scene.width/step)+1, rows = Math.ceil(scene.height/step)+1;
  const pass = new Uint8Array(cols*rows), seen = new Uint8Array(cols*rows);
  for (let gy=0; gy<rows; gy++) for (let gx=0; gx<cols; gx++) {
    pass[gy*cols+gx] = !blocked(scene, gx*step, gy*step);
  }
  function candidates([x,y]) {
    const result = [];
    for (let gy=Math.floor(y/step)-1; gy<=Math.ceil(y/step)+1; gy++) {
      for (let gx=Math.floor(x/step)-1; gx<=Math.ceil(x/step)+1; gx++) {
        if (gx<0 || gy<0 || gx>=cols || gy>=rows) continue;
        const xx=gx*step, yy=gy*step;
        if (Math.hypot(xx-x, yy-y)>6) continue;
        // The small join from an exact arrival/target must also be collision-safe.
        if ([0,.25,.5,.75,1].some(t => blocked(scene,x+(xx-x)*t,y+(yy-y)*t))) continue;
        result.push(gy*cols+gx);
      }
    }
    return result;
  }
  assert(!blocked(scene,...start), `${scene.id} start ${start} is safe`);
  const queue = new Int32Array(cols*rows);
  let tail=0;
  for (const index of candidates(start)) if (!seen[index]) { seen[index]=1; queue[tail++]=index; }
  for (let head=0; head<tail; head++) {
    const index=queue[head], x=index%cols, y=Math.floor(index/cols);
    for (const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nx=x+dx, ny=y+dy;
      if (nx<0 || ny<0 || nx>=cols || ny>=rows) continue;
      const next=ny*cols+nx;
      if (seen[next] || !pass[next] || blocked(scene,(x+dx*.5)*step,(y+dy*.5)*step)) continue;
      seen[next]=1; queue[tail++]=next;
    }
  }
  return (point, label) => assert(candidates(point).some(i=>seen[i]), `${scene.id}: connected ${label} at ${point}`);
}
const ports = Object.values(scenes).flatMap(scene => scene.landmarks.filter(p=>p.to).map(port=>({scene,port})));
assert.equal(ports.length,20,'18 old reciprocal doors plus two HQ directions');
for (const {scene,port} of ports) {
  const target=scenes[port.to];
  assert(target,`${scene.id}/${port.id} target exists`);
  const arrival=[port.arrival[0]*target.width/1000,port.arrival[1]*target.height/1000];
  assert(!blocked(target,...arrival),`${scene.id}/${port.id} safe arrival ${arrival}`);
  assert(!blocked(scene,port.x,port.y),`${scene.id}/${port.id} marker feet safe`);
  assert(target.landmarks.some(p=>p.to===scene.id),`${scene.id}/${port.id} reciprocal route`);
}
for (const scene of Object.values(scenes)) {
  const inbound=ports.filter(({port})=>port.to===scene.id);
  const first=inbound[0].port.arrival;
  const check=reachable(scene,[first[0]*scene.width/1000,first[1]*scene.height/1000]);
  for (const {port} of inbound) check([port.arrival[0]*scene.width/1000,port.arrival[1]*scene.height/1000],'arrival');
  for (const port of scene.landmarks.filter(p=>p.to)) check([port.x,port.y],port.id);
}
const rec=scenes.recreation;
const checkRec=reachable(rec,[80*rec.width/1000,125*rec.height/1000]);
for (const [label,point] of Object.entries({
  basketball:[440,550],basketballSouth:[440,625],tennisWest:[690,535],tennisWestSouth:[690,625],
  tennisEast:[910,535],tennisEastSouth:[910,625],playground:[850,365],playgroundEast:[980,405],
  jeff:[385,345],ari:[575,345],dogs:[1125,360],poolDeck:[480,810],chris:[358,932],
  rockBandDoor:[1185,840],northGate:[690,477],southGate:[534,656]
})) checkRec(point,label);
// Test clear usable foot-center widths, not only a single successful centerline.
for (const [label,x1,x2,y] of [
  ['north gate',673,708,477],['south gate',524,546,656],
  ['basketball',360,565,625],['west tennis',593,782,625],['east tennis',808,992,625],
  ['bench-lined north lawn',340,620,270],['bench feet',410,445,440],
  ['east sidewalk dogs',1068,1187,360],['east sidewalk Rock Band',1118,1237,840]
]) for (let x=x1;x<=x2;x++) assert(!blocked(rec,x,y),`${label}: clear at ${x},${y}`);
for (const point of [[410,430],[660,379],[597,460],[790,444],[930,445]]) {
  checkRec(point,'decorative bench feet');
}
for (const [label,point] of Object.entries({
  lapWater:[358,820],mainWater:[700,790],upperWater:[890,735],rightWater:[972,843],wadingWater:[620,885],
  lowerMainWater:[620,836],lowerRightWater:[890,850],
  clubhouse:[620,1050],westBuilding:[315,1080],eastBuilding:[925,1080],northHouse:[620,105],
  northClosedFence:[500,477],southClosedFence:[700,656],westClosedFence:[342,555],eastClosedFence:[1005,555]
})) assert(blocked(rec,...point),`${label} remains blocked`);
assert.equal(rec.landmarks.filter(p=>p.to && p.to!=='rockband').length,1,'only Home outdoor exit');
assert.deepEqual([rec.landmarks.find(p=>p.id==='rockband-house').x,rec.landmarks.find(p=>p.id==='rockband-house').y],[1185,840]);
const hq=scenes.hq, door=scenes.plaza.landmarks.find(p=>p.id==='fiveguys'), exit=hq.landmarks.find(p=>p.id==='outside');
assert.deepEqual([hq.width,hq.height],[724,543]);
assert.deepEqual([door.x,door.y],[1167,767]);
assert(Math.abs(exit.arrival[0]*scenes.plaza.width/1000-1167)<1e-9);
assert(Math.abs(exit.arrival[1]*scenes.plaza.height/1000-767)<1e-9);
const checkHQ=reachable(hq,[200,450]);
for (const point of [[200,350],[310,255],[415,235],[500,222],[650,380],[625,460],[200,500]]) checkHQ(point,'HQ aisle/exit');
// Removing the front aisle proves the rear/right route also wraps around the table.
const checkHQRear=reachable({...hq,obstacles:[...hq.obstacles,{x:0,y:415,w:724,h:128}]},[200,350]);
checkHQRear([650,380],'rear-to-east perimeter without the front aisle');
for (const [label,x1,x2,y] of [
  ['HQ left aisle',184,222,350],['HQ front aisle',190,440,430],['HQ right aisle',626,677,380],
  ['HQ rear-left aisle',285,337,275],['HQ rear-right aisle',470,592,235]
]) for (let x=x1;x<=x2;x++) assert(!blocked(hq,x,y),`${label}: clear at ${x},${y}`);
for (const point of [[400,300],[300,185],[640,230],[250,360],[310,385],[480,475]]) {
  assert(blocked(hq,...point),`HQ table/counter/chair/crate blocked at ${point}`);
}
assert(Math.hypot(200-exit.x,450-exit.y)>22,'HQ arrival outside auto-run-over threshold');
assert(Math.hypot(200-exit.x,450-exit.y)<=exit.radius+8,'HQ arrival covered by existing arrival latch');
assert(!blocked(scenes.plaza,1167,767),'storefront return feet outside building');
assert(blocked(scenes.plaza,1167,700),'storefront building still blocked');
const png=fs.readFileSync(path.join(root,'assets','scenes','five-guys-hq.png'));
assert.equal(png.readUInt32BE(16),724);
assert.equal(png.readUInt32BE(20),543);
console.log('PASS: 20 reciprocal collision-safe portals; all arrivals connected; sports/park/dogs/pool/HQ aisles reachable; usable gate/sidewalk widths; benches decorative; water, buildings, furniture and closed fences blocked; HQ PNG724x543.');
