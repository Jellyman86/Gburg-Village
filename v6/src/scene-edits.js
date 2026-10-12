(function(root){
 'use strict';
 const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
 function keys(value,allowed,label){
  if(!object(value))throw new Error(label+' must be an object.');
  for(const key of Object.keys(value))if(!allowed.includes(key))throw new Error('Unknown '+label+' field: '+key);
 }
 function number(value,min,max,label){
  if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw new Error(label+' must be between '+min+' and '+max+'.');
 }
 function validate(data,catalog,characters){
  keys(data,['version','scenes'],'scene edits');
  if(data.version!==1||!object(data.scenes))throw new Error('Expected scene edits version 1 and a scenes object.');
  for(const [event,patches] of Object.entries(data.scenes)){
   if(!Object.hasOwn(catalog,event))throw new Error('Unknown cinematic: '+event);
   if(!object(patches))throw new Error(event+' shots must be an object.');
   for(const [index,patch] of Object.entries(patches)){
    if(!/^(0|[1-9]\d*)$/.test(index)||!catalog[event].shots[Number(index)])throw new Error('Unknown shot: '+event+'/'+index);
    keys(patch,['seconds','text','speaker','bubble','actors','camera'],event+'/'+index);
    if(patch.seconds!==undefined){
     number(patch.seconds,.5,60,'Shot duration');
     const shot=catalog[event].shots[index];
     if(shot.stage==='gary-wave'&&patch.seconds<shot.seconds)throw new Error('Gary battle waves cannot be shortened below '+shot.seconds+' seconds.');
    }
    if(patch.text!==undefined&&(typeof patch.text!=='string'||patch.text.length>400))throw new Error('Dialogue must be text up to 400 characters.');
    if(patch.speaker!==undefined&&!Object.hasOwn(characters,patch.speaker))throw new Error('Unknown dialogue speaker.');
    if(patch.bubble!==undefined){
     keys(patch.bubble,['placement','x','y'],'bubble');
     if(!['auto','above','below','custom'].includes(patch.bubble.placement))throw new Error('Unknown bubble placement.');
     if(patch.bubble.x!==undefined)number(patch.bubble.x,0,1,'Bubble X');
     if(patch.bubble.y!==undefined)number(patch.bubble.y,0,1,'Bubble Y');
     if(patch.bubble.placement==='custom'&&(patch.bubble.x===undefined||patch.bubble.y===undefined))throw new Error('Custom bubbles need X and Y.');
    }
    if(patch.camera!==undefined){
     keys(patch.camera,['x','y','zoom'],'camera');
     number(patch.camera.x,0,5000,'Camera X');number(patch.camera.y,0,5000,'Camera Y');number(patch.camera.zoom,.3,3,'Camera zoom');
    }
    if(patch.actors!==undefined){
     if(!object(patch.actors))throw new Error('Actors must be an object.');
     if(catalog[event].shots[index].returnView&&Object.keys(patch.actors).length)throw new Error('Gameplay return shots cannot move actors.');
     for(const [id,offset] of Object.entries(patch.actors)){
      if(!Object.hasOwn(characters,id))throw new Error('Unknown actor: '+id);
      keys(offset,['dx','dy'],'actor offset');number(offset.dx,-500,500,'Actor X offset');number(offset.dy,-500,500,'Actor Y offset');
     }
    }
   }
  }
  return data;
 }
 function apply(catalog,event,data){
  const shots=catalog[event].shots.map((shot,index)=>{
   const patch=data.scenes[event]?.[index];
   return patch?{...shot,...patch,...(patch.speaker!==undefined?{interlocutor:false}:{})}:shot;
  });
  return {shots,duration:shots.reduce((sum,shot)=>sum+shot.seconds,0)};
 }
 const api={validate,apply,empty:()=>({version:1,scenes:{}})};
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.V5_SCENE_EDITS=api;
})(typeof window==='object'?window:globalThis);
