((root)=>{
 'use strict';
 const tileSize=32,cols=128,rows=96,width=cols*tileSize,height=rows*tileSize;
 const sites=[
  {id:'gburg',name:'Gaithersburg',col:34,row:32,to:'north',arrival:[499,78],arrivalDirection:'down'},
  {id:'nyc',name:'New York',col:36,row:29,to:'nyc',arrival:[500,895],arrivalDirection:'up'},
  {id:'paris',name:'Paris',col:63,row:25},
  {id:'egypt',name:'Egypt',col:73,row:39},
  {id:'japan',name:'Japan',col:115,row:33},
  {id:'russia',name:'Russia',col:88,row:20},
  {id:'hawaii',name:'Hawaii',col:8,row:42}
 ].map(site=>Object.freeze({...site,x:(site.col+.5)*tileSize,y:(site.row+.5)*tileSize,radius:38}));
 const start=Object.freeze({x:33.5*tileSize,y:33.5*tileSize});
 const field=Object.freeze({x:31.5*tileSize,y:33.5*tileSize});
 const wrap=(x,w)=>((x%w)+w)%w;
 function create(data){
  if(data.version!==1||data.tileSize!==tileSize||data.cols!==cols||data.rows!==rows||
   !Array.isArray(data.cells)||data.cells.length!==rows||data.cells.some(line=>typeof line!=='string'||line.length!==cols||/[^0-6]/.test(line)))throw new Error('Invalid V7 world terrain.');
  const cells=data.cells.map(line=>Array.from(line,Number));
  function pad(cx,cy,radius){for(let y=cy-radius;y<=cy+radius;y++)for(let x=cx-radius;x<=cx+radius;x++)if(y>=0&&y<rows)cells[y][wrap(x,cols)]=2;}
  for(const site of sites)pad(site.col,site.row,1);
  pad(34,32,2);pad(31,33,1);
  for(let x=31;x<=36;x++)pad(x,32,0);
  for(let y=29;y<=33;y++)pad(36,y,0);
  let flying=false,heading=0,bank=0,clock=0,plane={...field};
  function terrain(x,y){if(y<0||y>=height)return 0;return cells[Math.floor(y/tileSize)][Math.floor(wrap(x,width)/tileSize)];}
  function blocked(x,y,rx=5,ry=3){
   return [[x-rx,y-ry],[x+rx,y-ry],[x-rx,y+ry],[x+rx,y+ry]].some(([px,py])=>py<0||py>=height||[0,1,6].includes(terrain(px,py)));
  }
  function nearPlane(actor){const dx=Math.abs(wrap(actor.x,width)-plane.x);return !flying&&Math.hypot(Math.min(dx,width-dx),actor.y-plane.y)<58;}
  function board(actor){
   if(!nearPlane(actor))return {ok:false,message:'Walk closer to the parked jet.'};
   Object.assign(actor,plane);flying=true;heading=0;bank=0;
   return {ok:true,message:'Jet ready! Fly with arrows / joystick. E or Land sets down on clear ground. Map shows destinations.'};
  }
  function land(actor){
   if(!flying)return {ok:false,message:'The jet is already parked.'};
   const ground=terrain(actor.x,actor.y);
   if(![2,3,5].includes(ground)||blocked(actor.x,actor.y,14,10))return {ok:false,message:'Find open grass, sand or snow to land. Oceans, forests and mountains are not landing sites.'};
   plane={x:actor.x,y:actor.y};flying=false;bank=0;
   return {ok:true,message:'A smooth landing! Walk to a town marker or board again.'};
  }
  function update(dt,actor,dx,dy,boost=false){
   clock+=dt;
   if(!flying)return;
   const length=Math.hypot(dx,dy);
   if(length>.01){
    const target=Math.atan2(dx,-dy),delta=Math.atan2(Math.sin(target-heading),Math.cos(target-heading));
    const turn=Math.max(-dt*3,Math.min(dt*3,delta));heading+=turn;bank=Math.max(-.2,Math.min(.2,delta*.18));
    const speed=boost?460:300;
    actor.x=wrap(actor.x+dx/Math.max(1,length)*speed*dt,width);
    actor.y=Math.max(12,Math.min(height-12,actor.y+dy/Math.max(1,length)*speed*dt));
   }else bank*=Math.max(0,1-dt*7);
  }
  return {terrain,blocked,nearPlane,board,land,update,cells,
   get flying(){return flying;},get state(){return {flying,heading,bank,clock,plane:{...plane}};}};
 }
 const nycBuildings=[
  {x:96,y:64,w:256,h:256,frame:0},{x:384,y:64,w:256,h:256,frame:1},{x:832,y:64,w:256,h:256,frame:2},
  {x:96,y:480,w:256,h:256,frame:3},{x:832,y:480,w:256,h:256,frame:1}
 ];
 const nycObstacles=nycBuildings.map(b=>({x:b.x+8,y:b.y+8,w:b.w-16,h:b.h-12}))
  .concat([{x:394,y:483,w:18,h:340},{x:620,y:483,w:18,h:340}]);
 function installScenes(){
  const scenes=root.SCENES;
  scenes.world={id:'world',name:'Earth · World Map',world:true,width,height,bounds:{left:0,top:0,right:width,bottom:height},
   spawn:{...start},obstacles:[],landmarks:sites.map(site=>({...site,name:site.name+(site.to?' · Enter':' · Future chapter'),
    text:site.name+' is a future chapter. Its destination is mapped, but its playable streets and story are not built yet. You can fly onward or return to Gaithersburg.'})),
   hint:'Walk the continents or board the nearby jet. Map shows every destination. Land on open grass, sand or snow; Gaithersburg and New York are playable.'};
  scenes.nyc={id:'nyc',name:'New York · First city blocks',width:1280,height:1024,bounds:{left:32,top:32,right:1248,bottom:992},
   spawn:{x:640,y:916},obstacles:nycObstacles,landmarks:[
    {id:'nyc-exit',name:'↓ Return to world map',x:640,y:950,radius:42,to:'world',arrival:[sites[1].x/width*1000,(sites[1].y+48)/height*1000],arrivalDirection:'down',
     roads:[{x:576,y:960,w:128,h:24,direction:'down'}]},
    {id:'nyc-park',name:'Pocket park · First NYC stop',x:520,y:440,radius:48,text:'Welcome to New York! A first walkable district built from your supplied city art. The pocket park is a quiet stop; more blocks, friends and adventures will arrive in future chapters.'},
    {id:'nyc-subway',name:'Subway · Future route',x:744,y:400,radius:40,text:'The subway is not running yet. For now, explore these blocks and take the southern exit back to the world map.'},
    {id:'nyc-waterfront',name:'Waterfront overlook',x:1060,y:875,radius:42,text:'A whole world beyond the neighborhood. Your jet stays where you landed on the world map, ready for the trip home.'}
   ],hint:'Explore the first NYC blocks and pocket park. The southern road returns to the world map. Buildings are solid; interiors and the subway are future content.'};
  scenes.north.landmarks.push({id:'to-world',name:'↑ Beyond the meteor · World map',x:767,y:65,radius:44,to:'world',arrival:[start.x/width*1000,start.y/height*1000],arrivalDirection:'down',
   roads:[{x:704,y:30,w:126,h:28,direction:'up'}]});
  scenes.north.hint+=' The road NORTH of the meteor leads to the world map and a nearby jet.';
 }
 const api={create,sites,start,field,width,height,tileSize,nycBuildings,nycObstacles,wrap};
 if(typeof document!=='undefined'){
  let model,worldCanvas,nycCanvas;
  const images={},flightCanvas=document.createElement('canvas');flightCanvas.width=1280;flightCanvas.height=1280;
  function image(file){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Could not load V7 world art: '+file));img.src='assets/world/'+file+'?v=world-1';});}
  function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
  function buildWorld(){
   worldCanvas=canvas(width,height);const ctx=worldCanvas.getContext('2d');ctx.imageSmoothingEnabled=false;
   for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    const tile=model.cells[y][x];ctx.drawImage(images.terrain,tile*32,0,32,32,x*32,y*32,32,32);
    if(tile<2)continue;
    ctx.fillStyle='#dbc48c';
    if(model.terrain(x*32+16,y*32-1)<2)ctx.fillRect(x*32,y*32,32,2);
    if(model.terrain(x*32+16,y*32+33)<2)ctx.fillRect(x*32,y*32+30,32,2);
    if(model.terrain(x*32-1,y*32+16)<2)ctx.fillRect(x*32,y*32,2,32);
    if(model.terrain(x*32+33,y*32+16)<2)ctx.fillRect(x*32+30,y*32,2,32);
   }
   ctx.fillStyle='#615e58';ctx.fillRect(field.x-40,field.y-8,80,16);
   ctx.fillStyle='#eee2b4';for(let x=-32;x<=32;x+=16)ctx.fillRect(field.x+x,field.y-1,8,2);
   for(const site of sites){
    if(site.id==='nyc')ctx.drawImage(images.icon,site.x-32,site.y-60,64,64);
    else{
     ctx.fillStyle=site.to?'#d2ab6b':'#b1bdc6';ctx.fillRect(site.x-9,site.y-17,18,17);
     ctx.fillStyle='#714c3f';ctx.fillRect(site.x-12,site.y-22,24,6);
     ctx.fillStyle='#263a42';ctx.fillRect(site.x-3,site.y-8,6,8);
    }
   }
  }
  function buildNYC(){
   nycCanvas=canvas(1280,1024);const ctx=nycCanvas.getContext('2d');ctx.imageSmoothingEnabled=false;
   for(let y=0;y<1024;y+=32)for(let x=0;x<1280;x+=32){
    const road=(x>=672&&x<800)||(y>=352&&y<416)||(y>=832&&y<896)||(x>=576&&x<704&&y>=896);
    ctx.drawImage(images.ground,road?0:32,0,32,32,x,y,32,32);
   }
   ctx.fillStyle='#e7dfbc';for(let y=32;y<832;y+=64)ctx.fillRect(735,y,3,24);
   for(let x=32;x<1248;x+=64){ctx.fillRect(x,383,24,3);ctx.fillRect(x,863,24,3);}
   for(const y of [352,832])for(let x=680;x<800;x+=16){ctx.fillRect(x,y+8,8,48);}
   for(const b of nycBuildings)ctx.drawImage(images.buildings,b.frame*256,0,256,256,b.x,b.y,b.w,b.h);
   ctx.drawImage(images.park,384,448,256,384);
   ctx.fillStyle='#1c6652';ctx.fillRect(720,425,48,12);
   ctx.fillStyle='#102c35';ctx.fillRect(730,415,28,12);
   ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.fillStyle='#f9e9b2';ctx.fillText('SUBWAY',744,432);
   ctx.fillStyle='#144f80';ctx.fillRect(0,992,1280,32);
  }
  installScenes();
  api.preload=async()=>{
   const [data]=await Promise.all([
    fetch('data/world-grid.json?v=world-1').then(async response=>{if(!response.ok)throw new Error('World terrain request failed: '+response.status);return response.json();}),
    ...Object.entries({terrain:'terrain.png',overview:'overview.png',plane:'plane.png',icon:'nyc-icon.png',ground:'nyc-ground.png',buildings:'nyc-buildings.png',park:'nyc-park.png'}).map(async([key,file])=>{images[key]=await image(file);})
   ]);
   model=create(data);buildWorld();buildNYC();
  };
  api.background=id=>id==='world'?worldCanvas:id==='nyc'?nycCanvas:null;
  api.model=()=>model;
  api.drawPlane=(ctx,x,y,airborne=false,angle=0,size=64)=>{
   const frame=airborne?Math.floor(model.state.clock*8)%4:0;
   ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(angle);
   ctx.drawImage(images.plane,frame*128,airborne?128:0,128,128,-size/2,-size/2,size,size);ctx.restore();
  };
  api.drawFlight=(ctx,output,actor)=>{
   const {heading,bank}=model.state,w=output.width,h=output.height,horizon=Math.floor(h*.24);
   ctx.fillStyle='#9dc9d6';ctx.fillRect(0,0,w,horizon);ctx.fillStyle='#c8d8cf';ctx.fillRect(0,horizon-12,w,12);
   const view=flightCanvas.getContext('2d');view.imageSmoothingEnabled=false;view.setTransform(1,0,0,1,0,0);view.fillStyle='#065294';view.fillRect(0,0,1280,1280);
   view.translate(640,1190);view.rotate(-heading);view.translate(-actor.x,-actor.y);
   for(const offset of [-width,0,width])view.drawImage(worldCanvas,offset,0);
   const groundHeight=h-horizon;
   ctx.imageSmoothingEnabled=false;
   for(let y=horizon;y<h;y+=2){
    const t=(y-horizon)/groundHeight,depth=80+950*(1-t)/(1+t*5),span=120+depth*1.1;
    const next=80+950*(1-Math.min(1,t+2/groundHeight))/(1+Math.min(1,t+2/groundHeight)*5);
    ctx.drawImage(flightCanvas,640-span/2,1190-depth,span,Math.max(1,depth-next),0,y,w,2);
   }
   ctx.fillStyle='#142b3a66';ctx.beginPath();ctx.ellipse(w/2,h*.78,22,5,0,0,Math.PI*2);ctx.fill();
   api.drawPlane(ctx,w/2,h*.7,true,bank,Math.min(100,w*.28));
   const mini=Math.min(100,w*.26),mh=mini*.75,x=w-mini-8,y=horizon+8;
   ctx.globalAlpha=.9;ctx.drawImage(images.overview,x,y,mini,mh);ctx.globalAlpha=1;ctx.strokeStyle='#e9d4a0';ctx.strokeRect(x,y,mini,mh);
   ctx.fillStyle='#fff0a0';ctx.fillRect(x+actor.x/width*mini-2,y+actor.y/height*mh-2,4,4);
  };
  api.drawOverview=(output,actor)=>{
   const ctx=output.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(images.overview,0,0,output.width,output.height);
   for(const site of sites){
    const x=site.x/width*output.width,y=site.y/height*output.height;
    ctx.fillStyle=site.to?'#ffe393':'#c0cbd2';ctx.fillRect(x-3,y-3,6,6);
   }
   ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(actor.x/width*output.width,actor.y/height*output.height,7,0,Math.PI*2);ctx.stroke();
  };
 }
 root.V7_TRAVEL=Object.freeze(api);
 if(typeof module!=='undefined'&&module.exports)module.exports=root.V7_TRAVEL;
})(typeof window==='undefined'?globalThis:window);
