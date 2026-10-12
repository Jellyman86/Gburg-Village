const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={window:null};context.window=context;vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','src','gary-finale.js'),'utf8'),context);
const finale=context.V5_GARY_FINALE,enemyIds=new Set(),smokeIds=new Set(),poses=new Set(),waves=finale.shots.filter(s=>s.stage==='gary-wave');
assert.equal(waves.length,4);assert.equal(finale.total,20);
assert.equal(finale.shots.reduce((sum,shot)=>sum+shot.seconds,0),52);
assert.equal(finale.shots.find(s=>s.stage==='gary-drink').text,'God bless the USA.');
let roof=false,flip=false,hits=0,blasts=0;
for(const shot of waves){
 let largestWave=0;
 for(let age=0;age<shot.seconds;age+=.05){
  const frame=[];
  finale.stage(shot,age,{
   reduced:false,context:{actors:[],player:{id:'coco',x:768,y:865}},
   ease(value){value=Math.max(0,Math.min(1,value));return value*value*(3-2*value);},
   human(id,x,y,options){
    assert.equal(id,'gary');assert(options.poseTime>=0);poses.add(options.pose);
    if(shot.style==='roof'&&age>1.1&&age<3.6)roof=roof||(x===985&&y-options.lift===625&&options.dir==='left');
    if(options.rotation>Math.PI)flip=true;
    if(options.pose==='hurt')hits++;
   },
   dinosaur(kind,x,y,options){frame.push(options.id);enemyIds.add(options.id);assert(options.id>=shot.wave*5&&options.id<shot.wave*5+5);},
   smoke(x,y,age,id){smokeIds.add(id);},
   blast(){blasts++;},focus(){}
  });
  assert.equal(frame.length,new Set(frame).size);assert(frame.length<=5);largestWave=Math.max(largestWave,frame.length);
 }
 assert.equal(largestWave,5);
}
assert.equal(enemyIds.size,20);assert.equal(smokeIds.size,20);
assert(roof&&flip&&hits>0&&blasts>20);
assert(['attack','unique','hurt','surprised','special'].every(pose=>poses.has(pose)));
console.log(JSON.stringify({garyFinale:'passed',waves:4,enemies:enemyIds.size,smoke:smokeIds.size,seconds:52,checks:['exactly twenty distinct rendered dinosaurs','at most five at once','individual smoke disappearances','real rooftop endpoint','flip/hit/blast choreography','relative pose time','exact final line']}));
