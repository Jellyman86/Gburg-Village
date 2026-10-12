(() => {
 'use strict';
 const $=id=>document.getElementById(id),frame=$('preview');
 let preview,catalog,characters,data,saved,revision,token,event='montage',playing=false,last=0,loading=false,dragBefore=null;
 const history=[],future=[];
 const copy=value=>JSON.parse(JSON.stringify(value)),serialize=value=>JSON.stringify(value);
 function status(message,error=false){$('status').textContent=message;$('status').dataset.error=String(error);}
 function report(error){console.error('Director:',error);status(error.message,true);}
 function dirty(){return data&&serialize(data)!==serialize(saved);}
 function definition(){return V5_SCENE_EDITS.apply(catalog,event,data);}
 function patch(){return data.scenes[event]?.[preview.state.shot]||{};}
 function shotStart(index){return definition().shots.slice(0,index).reduce((sum,shot)=>sum+shot.seconds,0);}
 function controls(){
  $('undo').disabled=!history.length;$('redo').disabled=!future.length;
  $('save').disabled=!token||!dirty()||loading;$('export').disabled=!data||loading;$('reload').disabled=loading;
  $('scene').disabled=loading;$('shot').disabled=loading;
  $('play').disabled=loading;$('timeline').disabled=loading;
  $('fields').disabled=loading;
 }
 function remember(before){if(serialize(before)===serialize(data))return;history.push(before);if(history.length>60)history.shift();future.length=0;controls();}
 function change(mutator,record=true){
  if(loading)return;
  const before=copy(data),next=copy(data);mutator(next);
  try{V5_SCENE_EDITS.validate(next,catalog,characters);preview.update(next);data=next;if(record)remember(before);refresh();status(dirty()?'Unsaved changes - preview updated.':'Saved settings loaded.');}
  catch(error){report(error);refresh();}
 }
 function editShot(mutator,record=true){
  stop();
  const index=preview.state.shot;
  change(next=>{next.scenes[event]||={};next.scenes[event][index]||={};mutator(next.scenes[event][index]);},record);
 }
 function options(select,entries,value){
  select.replaceChildren(...entries.map(([key,text])=>{const option=document.createElement('option');option.value=key;option.textContent=text;return option;}));
  if(entries.some(([key])=>key===value))select.value=value;
 }
 function refresh(){
  const state=preview.state,def=definition(),shot=def.shots[state.shot],edits=patch();
  const selected=$('actor').value,ids=[...new Set(state.actors.map(a=>a.id))];
  options($('shot'),def.shots.map((s,i)=>[String(i),(i+1)+'. '+s.stage+' ('+s.seconds+'s)']),String(state.shot));
  options($('actor'),ids.map(id=>[id,characters[id].name]),selected);
  options($('speaker'),ids.map(id=>[id,characters[id].name]),shot.interlocutor?'coco':shot.speaker);
  $('seconds').value=shot.seconds;$('text').value=shot.text;
  $('bubble-placement').value=edits.bubble?.placement||'auto';
  $('bubble-x').value=Math.round((edits.bubble?.x||0)*1000)/10;$('bubble-y').value=Math.round((edits.bubble?.y||0)*1000)/10;
  const offset=edits.actors?.[$('actor').value]||{dx:0,dy:0};
  $('actor-x').value=offset.dx;$('actor-y').value=offset.dy;
  const actorLocked=!ids.length||shot.returnView;
  $('actor').disabled=!ids.length;$('actor-x').disabled=actorLocked;$('actor-y').disabled=actorLocked;
  const camera=state.camera,canvas=frame.contentDocument.getElementById('game');
  $('manual-camera').checked=!!edits.camera;
  $('camera-x').value=Math.round(edits.camera?.x??camera.x+canvas.width/camera.scale/2);
  $('camera-y').value=Math.round(edits.camera?.y??camera.y+canvas.height/camera.scale/2);
  $('camera-zoom').value=Math.round((edits.camera?.zoom??camera.scale)*100)/100;
  for(const id of ['camera-x','camera-y','camera-zoom'])$(id).disabled=!edits.camera;
  for(const id of ['bubble-x','bubble-y'])$(id).disabled=$('bubble-placement').value!=='custom';
  $('seconds').min=shot.stage==='gary-wave'?catalog[event].shots[state.shot].seconds:.5;
  $('timeline').max=def.duration;$('timeline').value=state.elapsed;
  $('time').textContent=state.elapsed.toFixed(2)+' / '+def.duration.toFixed(2)+' s';
  $('shot-info').textContent=shot.scene+' / '+shot.stage+' - actor offsets apply to this shot only'+(shot.returnView?' (return positions protected).':'.');
  preview.select($('actor').value);controls();
 }
 function stop(){playing=false;last=0;$('play').textContent='Play';}
 function seek(time){stop();preview.seek(time);refresh();}
 async function openScene(){
  stop();loading=true;controls();$('fields').disabled=true;status('Loading scene artwork...');
  try{await preview.open(event,data);$('fields').disabled=false;refresh();status(dirty()?'Scene ready - unsaved changes.':'Scene ready. Drag an actor or bubble, or use the inspector.');}
  finally{loading=false;controls();}
 }
 function layout(){
  const available=Math.max(240,$('viewport').clientWidth-26),name=$('layout').value;
  const sizes={desktop:[1215,655],portrait:[365,633],landscape:[828,317]};
  const [width,height]=sizes[name],fit=Math.min(1,available/width);
  frame.style.width=width+'px';frame.style.height=height+'px';frame.style.transform='scale('+fit+')';
  $('preview-size').style.width=width*fit+'px';$('preview-size').style.height=height*fit+'px';
 }
 function tick(now){
  if(playing&&!document.hidden&&!loading){
   const state=preview.state,def=definition(),step=last?Math.min(.1,(now-last)/1000):0;
   let time=state.elapsed+step;
   if($('loop').checked){
    const start=shotStart(state.shot),end=start+def.shots[state.shot].seconds;
    if(time>=end)time=start+(time-end);
   }else if(time>=def.duration){time=def.duration;stop();}
   preview.seek(time);
   const next=preview.state;
   if(next.shot!==state.shot)refresh();
   else{$('timeline').value=next.elapsed;$('time').textContent=next.elapsed.toFixed(2)+' / '+def.duration.toFixed(2)+' s';}
  }
  last=playing?now:0;requestAnimationFrame(tick);
 }
 $('scene').onchange=()=>{event=$('scene').value;openScene().catch(report);};
 $('shot').onchange=()=>seek(shotStart(Number($('shot').value))+.001);
 $('timeline').oninput=()=>seek(Number($('timeline').value));
 $('play').onclick=()=>{if(playing)stop();else{if(preview.state.elapsed>=definition().duration)preview.seek(0);playing=true;last=0;$('play').textContent='Pause';}};
 $('back-frame').onclick=()=>seek(preview.state.elapsed-1/30);$('next-frame').onclick=()=>seek(preview.state.elapsed+1/30);
 $('layout').onchange=layout;new ResizeObserver(()=>requestAnimationFrame(layout)).observe($('viewport'));
 $('seconds').onchange=()=>editShot(p=>p.seconds=Number($('seconds').value));
 $('text').onchange=()=>editShot(p=>p.text=$('text').value);
 $('speaker').onchange=()=>editShot(p=>p.speaker=$('speaker').value);
 function editBubble(){editShot(p=>p.bubble={placement:$('bubble-placement').value,x:Number($('bubble-x').value)/100,y:Number($('bubble-y').value)/100});}
 for(const id of ['bubble-placement','bubble-x','bubble-y'])$(id).onchange=editBubble;
 $('actor').onchange=refresh;
 function editActor(){const id=$('actor').value;if(!id)return;editShot(p=>{p.actors||={};p.actors[id]={dx:Number($('actor-x').value),dy:Number($('actor-y').value)};});}
 $('actor-x').onchange=editActor;$('actor-y').onchange=editActor;
 function editCamera(){editShot(p=>{if(!$('manual-camera').checked)delete p.camera;else p.camera={x:Number($('camera-x').value),y:Number($('camera-y').value),zoom:Number($('camera-zoom').value)};});}
 for(const id of ['manual-camera','camera-x','camera-y','camera-zoom'])$(id).onchange=editCamera;
 $('reset-shot').onclick=()=>change(next=>{delete next.scenes[event]?.[preview.state.shot];if(next.scenes[event]&&!Object.keys(next.scenes[event]).length)delete next.scenes[event];});
 function restore(from,to){
  if(!from.length)return;
  stop();const previous=from.pop();to.push(copy(data));data=previous;preview.update(data);refresh();status('Preview restored'+(dirty()?' - unsaved changes.':'.'));
 }
 $('undo').onclick=()=>restore(history,future);$('redo').onclick=()=>restore(future,history);
 window.addEventListener('message',message=>{
  if(message.origin!==location.origin||message.source!==frame.contentWindow||loading)return;
  const detail=message.data;
  if(detail.type==='studio-select'){$('actor').value=detail.id;refresh();}
  if(detail.type==='studio-drag-start'){stop();dragBefore=copy(data);}
  if(detail.type==='studio-drag-actor'&&dragBefore)editShot(p=>{p.actors||={};p.actors[detail.id]={dx:detail.dx,dy:detail.dy};},false);
  if(detail.type==='studio-drag-bubble'&&dragBefore)editShot(p=>p.bubble={placement:'custom',x:detail.x,y:detail.y},false);
  if(detail.type==='studio-drag-end'&&dragBefore){remember(dragBefore);dragBefore=null;}
 });
 async function loadSaved(){
  const response=await fetch('../data/scene-edits.json',{cache:'no-store'});
  if(!response.ok)throw new Error('Could not load saved scene settings: HTTP '+response.status);
  data=V5_SCENE_EDITS.validate(await response.json(),catalog,characters);saved=copy(data);
  if(location.hostname==='127.0.0.1'){
   const info=await fetch('/api/studio',{cache:'no-store'});
   if(info.ok){const local=await info.json();data=V5_SCENE_EDITS.validate(local.data,catalog,characters);saved=copy(data);token=local.token;revision=local.revision;}
   else if(info.status!==404)throw new Error('Local save service failed: HTTP '+info.status);
  }
  $('save-help').textContent=token?'Local mode: Save writes scene settings into this checkout. Refresh the local game to test.':'Hosted mode: Export JSON downloads your edits. Import into the local studio and Save to use them in the game.';
 }
 $('save').onclick=async()=>{
  loading=true;controls();
  try{
   const response=await fetch('/api/studio',{method:'POST',headers:{'Content-Type':'application/json','X-Studio-Token':token},body:JSON.stringify({data,revision})});
   const result=await response.json();if(!response.ok)throw new Error(result.error||'Save failed.');
   revision=result.revision;saved=copy(data);status('Saved to v5/data/scene-edits.json. Refresh the local game to test; GitHub is not changed.');
  }catch(error){report(error);}finally{loading=false;controls();}
 };
 $('export').onclick=()=>{
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'})),a=document.createElement('a');
  a.href=url;a.download='scene-edits.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('Exported scene-edits.json. Your draft is still '+(dirty()?'unsaved in the game.':'unchanged.'));
 };
 $('import').onchange=async()=>{
  const file=$('import').files[0];if(!file)return;
  try{
   const next=V5_SCENE_EDITS.validate(JSON.parse(await file.text()),catalog,characters),before=copy(data);
   data=next;await openScene();remember(before);status('Imported draft - Save to game or Export when ready.');
  }catch(error){report(error);}finally{$('import').value='';}
 };
 $('reload').onclick=async()=>{
  if(dirty()&&!confirm('Discard unsaved edits and reload saved settings?'))return;
  stop();loading=true;controls();
  try{await loadSaved();history.length=0;future.length=0;await openScene();}
  catch(error){report(error);}finally{loading=false;controls();}
 };
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 document.addEventListener('keydown',e=>{
  if(!data||loading||e.target.closest('input,textarea,select'))return;
  if(e.code==='Space'){e.preventDefault();$('play').click();}
  else if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();seek(preview.state.elapsed+(e.key==='ArrowLeft'?-1:1)/30);}
  else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();(e.shiftKey?$('redo'):$('undo')).click();}
 });
 window.addEventListener('beforeunload',e=>{if(dirty()){e.preventDefault();e.returnValue='';}});
 async function boot(){
  preview=frame.contentWindow.STUDIO_PREVIEW;if(!preview)throw new Error('Preview did not load. Reload the studio.');
  catalog=preview.catalog;characters=preview.characters;
  options($('scene'),Object.keys(catalog).map(id=>[id,id.replaceAll('-',' ')]),event);
  await loadSaved();await openScene();
  for(const id of ['scene','shot','play','back-frame','next-frame','timeline','reset-shot'])$(id).disabled=false;
  requestAnimationFrame(tick);
  window.GBURG_STUDIO={get state(){return {data:copy(data),dirty:dirty(),event,playing,preview:preview.state};}};
 }
 frame.addEventListener('load',()=>boot().catch(report));
})();
