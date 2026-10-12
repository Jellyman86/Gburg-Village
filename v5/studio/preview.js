(() => {
 'use strict';
 const canvas=document.getElementById('game'),stage=document.getElementById('stage'),ctx=canvas.getContext('2d',{alpha:false}),errorEl=document.getElementById('preview-error');
 let selected=null,drag=null;
 function error(error){console.error('Studio preview failed:',error);errorEl.textContent=error.message;errorEl.hidden=false;}
 function resize(){
  const box=stage.getBoundingClientRect(),scale=box.width<600?1.35:box.height<350?1.5:1.8;
  canvas.width=Math.max(200,Math.round(box.width/scale));canvas.height=Math.max(140,Math.round(box.height/scale));
  if(V5_CINEMA.active)draw();
 }
 new ResizeObserver(resize).observe(stage);resize();
 function draw(){
  V5_CINEMA.render(ctx,canvas);
  const state=V5_CINEMA.state;
  if(state.error){errorEl.textContent=state.error;errorEl.hidden=false;}
  const actor=state.actors?.find(actor=>actor.id===selected),camera=state.camera;
  if(actor&&camera){
   const x=(actor.x-camera.x)*camera.scale,y=(actor.y-camera.y)*camera.scale;
   ctx.save();ctx.strokeStyle='#80f7ec';ctx.lineWidth=1;ctx.strokeRect(x-32*camera.scale,y-(64+actor.lift)*camera.scale,64*camera.scale,64*camera.scale);
   ctx.beginPath();ctx.moveTo(x-4,y);ctx.lineTo(x+4,y);ctx.moveTo(x,y-4);ctx.lineTo(x,y+4);ctx.stroke();ctx.restore();
  }
 }
 window.STUDIO_PREVIEW={
  get catalog(){return V5_CINEMA_CATALOG.catalog;},
  get characters(){return CHARACTERS;},
  get state(){return V5_CINEMA.state;},
  async open(event,data){
   const shot=V5_CINEMA_CATALOG.catalog[event].shots[0],place=SCENES[shot.scene]||V5_BANQUET_FINALE.scenes[shot.scene];
   const defaults={awakening:[310,350],connor:[150,350],family:[110,432],'recruit-chris':[422,850]};
   const [x,y]=defaults[event]||[shot.camera[0],shot.camera[1]+60];
   const actors=event==='gathering'||event==='gary'?Object.keys(CHARACTERS).filter(id=>id!=='gary'&&id!=='coco').map((id,i)=>({id,x:558+i%7*70,y:850+Math.floor(i/7)*80,direction:'down'})):[];
   const context={scene:event==='montage'?'house':shot.scene,player:{id:'coco',x,y,direction:'down'},actors,camera:{x:Math.max(0,x-200),y:Math.max(0,y-200),scale:1}};
   if(place.indoor&&event!=='family'&&event!=='awakening'&&event!=='connor')context.player.y=Math.min(y,place.height-30);
   errorEl.hidden=true;await V5_CINEMA.preview.open(event,data,context);draw();
  },
  seek(seconds){V5_CINEMA.preview.seek(seconds);draw();},
  update(data){V5_CINEMA.preview.update(data);draw();},
  select(id){selected=id;draw();}
 };
 function message(detail){parent.postMessage(detail,location.origin);}
 stage.addEventListener('pointerdown',event=>{
  if(event.button!==0||!V5_CINEMA.state.camera)return;
  const box=stage.getBoundingClientRect(),state=V5_CINEMA.state,c=state.camera;
  const bubble=document.getElementById('story-bubble');
  if(bubble.contains(event.target)){
   const b=bubble.getBoundingClientRect();drag={type:'bubble',startX:event.clientX,startY:event.clientY,x:(b.left-box.left)/box.width,y:(b.top-box.top)/box.height,width:box.width,height:box.height};
  }else{
   const x=(event.clientX-box.left)*canvas.width/box.width,y=(event.clientY-box.top)*canvas.height/box.height;
   const actor=[...state.actors].reverse().find(a=>Math.abs(x-(a.x-c.x)*c.scale)<=32*c.scale&&y>=(a.y-c.y-a.lift-64)*c.scale&&y<=(a.y-c.y-a.lift)*c.scale+8);
   if(!actor)return;
   selected=actor.id;drag={type:'actor',id:actor.id,startX:event.clientX,startY:event.clientY,dx:actor.x-actor.baseX,dy:actor.y-actor.baseY,ratioX:canvas.width/box.width/c.scale,ratioY:canvas.height/box.height/c.scale};
   message({type:'studio-select',id:actor.id});
  }
  event.preventDefault();stage.setPointerCapture(event.pointerId);message({type:'studio-drag-start'});
  V5_CINEMA.preview.lockCamera(state.camera);
 });
 stage.addEventListener('pointermove',event=>{
  if(!drag)return;
  const dx=event.clientX-drag.startX,dy=event.clientY-drag.startY;
  message(drag.type==='actor'?{type:'studio-drag-actor',id:drag.id,dx:Math.round(drag.dx+dx*drag.ratioX),dy:Math.round(drag.dy+dy*drag.ratioY)}:
   {type:'studio-drag-bubble',x:Math.max(0,Math.min(1,drag.x+dx/drag.width)),y:Math.max(0,Math.min(1,drag.y+dy/drag.height))});
 });
 function endDrag(){if(drag){drag=null;V5_CINEMA.preview.lockCamera(null);draw();message({type:'studio-drag-end'});}}
 stage.addEventListener('pointerup',endDrag);stage.addEventListener('pointercancel',endDrag);stage.addEventListener('lostpointercapture',endDrag);
 window.addEventListener('error',event=>error(event.error||new Error(event.message)));
 window.addEventListener('unhandledrejection',event=>error(event.reason));
})();
