((root)=>{
 'use strict';
 const tileSize=32,cols=128,rows=96,width=cols*tileSize,height=rows*tileSize;
 const sites=[
  {id:'gburg',name:'Gaithersburg',col:34,row:32,to:'north',arrival:[499,78],arrivalDirection:'down'},
  {id:'nyc',name:'New York',col:36,row:29,to:'nyc-central',arrival:[715/1448*1000,985/1086*1000],arrivalDirection:'up'},
  {id:'paris',name:'Paris',col:63,row:25,to:'paris-central',arrival:[735/1448*1000,985/1086*1000],arrivalDirection:'up'},
  {id:'egypt',name:'Egypt',col:73,row:39,to:'egypt',arrival:[724/1448*1000,1010/1086*1000],arrivalDirection:'up'},
  {id:'japan',name:'Japan',col:115,row:33,to:'japan',arrival:[740/1448*1000,985/1086*1000],arrivalDirection:'up'},
  {id:'russia',name:'Russia',col:88,row:20},
  {id:'hawaii',name:'Hawaii',col:8,row:42,to:'hawaii-central',arrival:[725/1448*1000,960/1086*1000],arrivalDirection:'up'},
  {id:'italy',name:'Italy',col:67,row:31,to:'italy',arrival:[717/1536*1000,985/1024*1000],arrivalDirection:'up'},
  {id:'philippines',name:'The Philippines',col:115,row:43,to:'philippines',arrival:[775/1448*1000,1010/1086*1000],arrivalDirection:'up'},
  {id:'vegas',name:'Las Vegas',col:14,row:32,to:'vegas-central',arrival:[760/1536*1000,960/1024*1000],arrivalDirection:'up',icon:'vegas-icon'},
  {id:'charlotte',name:'Charlotte',col:33,row:35,to:'panthers-stadium',arrival:[724/1448*1000,1000/1086*1000],arrivalDirection:'up',icon:'charlotte-icon'}
 ].map(site=>Object.freeze({...site,x:(site.col+.5)*tileSize,y:(site.row+.5)*tileSize,radius:38}));
 const start=Object.freeze({x:33.5*tileSize,y:33.5*tileSize});
 const field=Object.freeze({x:31.5*tileSize,y:33.5*tileSize});
 const wrap=(x,w)=>((x%w)+w)%w;
 const surface=id=>id===4||id===6?2:id;
 function quadrant(cells,x,y,q,biome=false){
  const id=surface(cells[y][wrap(x,cols)]),sx=q%2?1:-1,sy=q<2?-1:1;
  const at=(dx,dy)=>y+dy<0||y+dy>=rows?0:surface(cells[y+dy][wrap(x+dx,cols)]);
  const outside=value=>biome?value>=2&&value!==id:value<2;
  const vertical=outside(at(0,sy)),horizontal=outside(at(sx,0)),diagonal=outside(at(sx,sy));
  const frame=vertical&&horizontal?2:vertical||horizontal?1:diagonal?3:0;
  return {frame,row:biome?(id===3?3:4):(id===3?1:id===5?2:0),
   rotate:frame===1&&!vertical?3:0,flipX:sx>0,flipY:sy>0};
 }
 function planePose(state){return {row:state.flying&&state.boosting?1:0,frame:state.flying&&state.boosting?1+Math.floor(state.clock*8)%3:0};}
 function create(data){
  if(data.version!==1||data.tileSize!==tileSize||data.cols!==cols||data.rows!==rows||
   !Array.isArray(data.cells)||data.cells.length!==rows||data.cells.some(line=>typeof line!=='string'||line.length!==cols||/[^0-6]/.test(line)))throw new Error('Invalid V8 world terrain.');
  const cells=data.cells.map(line=>Array.from(line,Number));
  // Every destination gets a 5x5 landing pad: water, forest and mountains become grass, while existing sand and snow stay.
  function pad(cx,cy,radius){for(let y=cy-radius;y<=cy+radius;y++)for(let x=cx-radius;x<=cx+radius;x++)if(y>=0&&y<rows&&![2,3,5].includes(cells[y][wrap(x,cols)]))cells[y][wrap(x,cols)]=2;}
  for(const site of sites)pad(site.col,site.row,site.to?2:1);
  pad(34,32,2);pad(31,33,1);
  for(let x=31;x<=36;x++)pad(x,32,0);
  for(let y=29;y<=33;y++)pad(36,y,0);
  let flying=false,boosting=false,heading=0,bank=0,clock=0,plane={...field};
  function terrain(x,y){if(y<0||y>=height)return 0;return cells[Math.floor(y/tileSize)][Math.floor(wrap(x,width)/tileSize)];}
  function blocked(x,y,rx=5,ry=3){
   return [[x-rx,y-ry],[x+rx,y-ry],[x-rx,y+ry],[x+rx,y+ry]].some(([px,py])=>py<0||py>=height||[0,1,6].includes(terrain(px,py)));
  }
  function nearPlane(actor){const dx=Math.abs(wrap(actor.x,width)-plane.x);return !flying&&Math.hypot(Math.min(dx,width-dx),actor.y-plane.y)<58;}
  function board(actor){
   if(!nearPlane(actor))return {ok:false,message:'Walk closer to the parked jet.'};
   Object.assign(actor,plane);flying=true;boosting=false;heading=0;bank=0;
   return {ok:true,message:'Jet ready! Up flies forward; Left/Right turns. Hold Run for boost. E or Land sets down on clear ground.'};
  }
  const clearGround=(x,y)=>[2,3,5].includes(terrain(x,y))&&!blocked(x,y,14,10);
  function land(actor){
   if(!flying)return {ok:false,message:'The jet is already parked.'};
   // Glide to the nearest clear patch within two tiles rather than refusing because the exact pixel is a coastline.
   let spot=null,best=Infinity;
   for(let dy=-64;dy<=64;dy+=8)for(let dx=-64;dx<=64;dx+=8){const d=dx*dx+dy*dy;if(d<best&&clearGround(actor.x+dx,actor.y+dy)){best=d;spot={x:wrap(actor.x+dx,width),y:actor.y+dy};}}
   if(!spot)return {ok:false,message:'Find open grass, sand or snow to land. Oceans, forests and mountains are not landing sites.'};
   Object.assign(actor,spot);plane={...spot};flying=false;boosting=false;bank=0;
   return {ok:true,message:'A smooth landing! Walk to a town marker or board again.'};
  }
  function update(dt,actor,dx,dy,boost=false){
   clock+=dt;
   if(!flying)return;
   boosting=!!boost;
   const turn=Math.max(-1,Math.min(1,dx)),throttle=Math.max(-1,Math.min(1,-dy));
   heading=Math.atan2(Math.sin(heading+turn*1.8*dt),Math.cos(heading+turn*1.8*dt));
   bank+=(turn*.2-bank)*Math.min(1,dt*7);
   if(Math.abs(throttle)>.01){
    const distance=(boosting?460:300)*throttle*dt;
    actor.x=wrap(actor.x+Math.sin(heading)*distance,width);
    actor.y=Math.max(12,Math.min(height-12,actor.y-Math.cos(heading)*distance));
   }
  }
  // Developer jump: parks the jet at a spot on solid ground (used by Help > Jump to world map).
  function park(x,y){plane={x:wrap(x,width),y};flying=false;boosting=false;bank=0;}
  return {terrain,blocked,nearPlane,board,land,update,cells,park,
   get flying(){return flying;},get state(){return {flying,boosting,heading,bank,clock,plane:{...plane}};}};
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
    text:site.name+(site.to?' is a playable destination: land nearby and walk to its marker.':' is a future chapter. Its destination is mapped, but its playable streets and story are not built yet. You can fly onward or return to Gaithersburg.')})),
   hint:'Walk the continents or board the nearby jet. Map shows every destination. Land on open grass, sand or snow; Gaithersburg, New York, Paris, Egypt, Italy, the Philippines, Japan and Hawaii are playable.'};
  scenes.north.landmarks.push({id:'to-world',name:'↑ Beyond the meteor · World map',x:767,y:65,radius:44,to:'world',arrival:[start.x/width*1000,start.y/height*1000],arrivalDirection:'down',
   roads:[{x:704,y:30,w:126,h:28,direction:'up'}]});
  scenes.north.hint+=' The road NORTH of the meteor leads to the world map and a nearby jet.';
 }
 const api={create,sites,start,field,width,height,tileSize,nycBuildings,nycObstacles,wrap,quadrant,planePose};
 if(typeof document!=='undefined'){
  let model,worldCanvas,nycCanvas;
  const images={},flightCanvas=document.createElement('canvas');flightCanvas.width=1280;flightCanvas.height=1280;
  function image(key){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Could not load V8 world art: '+key));img.src=root.V8_ART.url('world.'+key);});}
  function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
  function buildWorld(){
   worldCanvas=canvas(width,height);const ctx=worldCanvas.getContext('2d');ctx.imageSmoothingEnabled=false;
   function drawTransition(x,y,size,piece,biome){
    ctx.save();ctx.translate(x+size/2,y+size/2);
    ctx.scale(piece.flipX?-1:1,piece.flipY?-1:1);ctx.rotate(piece.rotate*Math.PI/2);
    ctx.drawImage(biome?images.transitions:images.coasts,piece.frame*32,piece.row*32,32,32,-size/2,-size/2,size,size);ctx.restore();
   }
   function transition(x,y,q,biome){
    const piece=quadrant(model.cells,x,y,q,biome);
    if(!piece.frame)return;
    drawTransition(x*32+(q%2)*16,y*32+Math.floor(q/2)*16,16,piece,biome);
   }
   function boundary(x,y,biome){
    const id=surface(model.cells[y][x]),outside=value=>biome?value>=2&&value!==id:value<2;
    const mask=[[0,-1],[1,0],[0,1],[-1,0]].reduce((bits,[dx,dy],i)=>bits|(outside(surface(model.terrain((x+dx)*32+16,(y+dy)*32+16)))?1<<i:0),0);
    const pieces={
     1:{frame:1,rotate:0},2:{frame:1,rotate:1},4:{frame:1,rotate:2},8:{frame:1,rotate:3},
     9:{frame:2,rotate:0},3:{frame:2,rotate:1},6:{frame:2,rotate:2},12:{frame:2,rotate:3}
    };
    if(pieces[mask]){
     drawTransition(x*32,y*32,32,{...pieces[mask],row:biome?(id===3?3:4):(id===3?1:id===5?2:0)},biome);
     if(pieces[mask].frame===1)for(let q=0;q<4;q++)if(quadrant(model.cells,x,y,q,biome).frame===3)transition(x,y,q,biome);
    }else for(let q=0;q<4;q++)transition(x,y,q,biome);
   }
   for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    const tile=surface(model.cells[y][x]),hash=(x*73856093^y*19349663)>>>0;
    let frame=tile<2?(hash%7===0?7:0):tile;
    if(tile===3)frame=[3,10,11][hash%3];
    if(tile===5)frame=hash%3===0?12:5;
    ctx.drawImage(images.terrain,frame*32,0,32,32,x*32,y*32,32,32);
   }
   for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    const tile=surface(model.cells[y][x]);
    if(tile<2)continue;
    if(tile===3||tile===5)boundary(x,y,true);
    boundary(x,y,false);
   }
   for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    const tile=model.cells[y][x],hash=(x*73856093^y*19349663)>>>0;
    if(tile!==4&&tile!==6)continue;
    const frame=(tile===4?0:4)+hash%(tile===4?4:3);
    ctx.drawImage(images.features,frame*32,0,32,32,x*32-4,y*32-12,40,40);
   }
   ctx.fillStyle='#615e58';ctx.fillRect(field.x-40,field.y-8,80,16);
   ctx.fillStyle='#eee2b4';for(let x=-32;x<=32;x+=16)ctx.fillRect(field.x+x,field.y-1,8,2);
   for(const site of sites){
    if(site.id==='nyc')ctx.drawImage(images.icon,site.x-32,site.y-60,64,64);
    else if(site.icon&&images[site.icon]){const img=images[site.icon],w=96,h=Math.round(img.height*w/img.width);ctx.drawImage(img,site.x-w/2,site.y-6-h,w,h);}
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
    fetch('data/world-grid.json?v=vegas-1').then(async response=>{if(!response.ok)throw new Error('World terrain request failed: '+response.status);return response.json();}),
    ...Object.entries({terrain:'terrain',transitions:'transitions',coasts:'coasts',features:'features',overview:'overview',plane:'plane',icon:'nyc-icon',ground:'nyc-ground',buildings:'nyc-buildings',park:'nyc-park',skybox:'skybox','vegas-icon':'vegas-icon','charlotte-icon':'charlotte-icon'}).map(async([key,art])=>{images[key]=await image(art);})
   ]);
   model=create(data);buildWorld();buildNYC();
  };
  api.background=id=>id==='world'?worldCanvas:id==='nyc'?nycCanvas:null;
  api.model=()=>model;
  api.drawPlane=(ctx,x,y,airborne=false,angle=0,size=64)=>{
   const {frame,row}=planePose(airborne?model.state:{flying:false});
   ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(angle);
   ctx.drawImage(images.plane,frame*128,row*128,128,128,-size/2,-size/2,size,size);ctx.restore();
  };
  // Skybox: the painted horizon sits at 42% of the image; the band above it fills the sky and pans with the heading so
  // turning sweeps the clouds past. Falls back to the original flat sky if the image is unavailable.
  function drawSky(ctx,w,horizon,heading){
   const sky=images.skybox;
   if(!sky){ctx.fillStyle='#9dc9d6';ctx.fillRect(0,0,w,horizon);ctx.fillStyle='#c8d8cf';ctx.fillRect(0,horizon-12,w,12);return;}
   const srcH=Math.round(sky.height*.44),scale=horizon/srcH;
   let sx=wrap(heading/(Math.PI*2)*sky.width,sky.width),dx=0;
   ctx.save();ctx.imageSmoothingEnabled=true;
   while(dx<w){
    const srcW=Math.min(sky.width-sx,Math.ceil((w-dx)/scale)+1);
    ctx.drawImage(sky,sx,0,srcW,srcH,dx,0,srcW*scale,horizon);
    dx+=srcW*scale;sx=0;
   }
   ctx.restore();
  }
  api.drawFlight=(ctx,output,actor)=>{
   const {heading,bank}=model.state,w=output.width,h=output.height,horizon=Math.floor(h*.24);
   drawSky(ctx,w,horizon,heading);
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
   ctx.globalAlpha=.9;ctx.drawImage(worldCanvas,x,y,mini,mh);ctx.globalAlpha=1;ctx.strokeStyle='#e9d4a0';ctx.strokeRect(x,y,mini,mh);
   const px=x+actor.x/width*mini,py=y+actor.y/height*mh;
   ctx.fillStyle='#fff0a0';ctx.fillRect(px-2,py-2,4,4);
   ctx.strokeStyle='#fff0a0';ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+Math.sin(heading)*7,py-Math.cos(heading)*7);ctx.stroke();
  };
  api.drawOverview=(output,actor)=>{
   const ctx=output.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(worldCanvas,0,0,output.width,output.height);
   for(const site of sites){
    const x=site.x/width*output.width,y=site.y/height*output.height;
    ctx.fillStyle=site.to?'#ffe393':'#c0cbd2';ctx.fillRect(x-3,y-3,6,6);
   }
   ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(actor.x/width*output.width,actor.y/height*output.height,7,0,Math.PI*2);ctx.stroke();
  };
 }
 root.V8_TRAVEL=Object.freeze(api);
 if(typeof module!=='undefined'&&module.exports)module.exports=root.V8_TRAVEL;
})(typeof window==='undefined'?globalThis:window);
