(() => {
 'use strict';
 const completed=new Set();
 const opening=['awakening','connor','family','montage'];
 let host=null,current=null,started=false;
 const family=['jason','peachy'];
 function attach(value){
  if(host)throw new Error('Story host is already attached.');
  host=value;
 }
 function objective(){
  if(!completed.has('awakening'))return 'Coco hears a strange rumble. Investigate the window.';
  if(!completed.has('connor'))return "Find Connor. His bedroom is next door through the upstairs hallway.";
  if(!completed.has('family'))return 'Find Mom and Dad. Head through the hallway and downstairs to the kitchen.';
  if(!completed.has('montage'))return 'The neighborhood is in danger. Coco needs a plan.';
  const next=V4_STORY.order.find(id=>!V4_RPG.members[id].joined);
  if(next)return 'Rescue '+CHARACTERS[next].name+' · '+V4_STORY.locations[next].hint+' Regroup at Market Square.';
  if(!completed.has('gathering'))return 'Everyone is rescued! Bring the party to Market Square.';
  if(!completed.has('gary'))return 'Everyone is rescued. Gary has something to show you.';
  return 'Chapter complete · Gary is playable! The meteor mystery continues next time.';
 }
 function allowed(id){
  const index=opening.indexOf(id);
  if(index>=0){
   if(index>0&&!completed.has(opening[index-1]))return false;
   if(id==='connor')return host.scene()==='connorRoom';
   if(id==='family'||id==='montage')return host.scene()==='house';
   return host.scene()==='cocoRoom';
  }
  if(id==='gathering')return completed.has('montage')&&host.scene()==='plaza'&&host.atMeeting()&&['coco',...V4_STORY.order].every(member=>V4_RPG.members[member].joined);
  if(id==='gary')return completed.has('gathering')&&!V4_RPG.members.gary.joined;
  if(id==='gary-talk')return completed.has('montage')&&host.scene()==='hq';
  if(id.startsWith('recruit-')){
   const member=id.slice(8),location=V4_STORY.locations[member];
   return !!location&&completed.has('montage')&&location.scene===host.scene()&&!V4_RPG.members[member].joined&&!['connor',...family].includes(member);
  }
  return false;
 }
 function award(id){
  const ids=id==='connor'?['connor']:id==='family'?family:id==='gary'?['gary']:id.startsWith('recruit-')?[id.slice(8)]:[];
  for(const member of ids){
   if(!V4_RPG.members[member].joined)V4_RPG.recruit(member);
  }
  if(ids.length){V4_SFX.play('join');host.notify(ids.map(member=>CHARACTERS[member].name).join(' and ')+' joined your party!');}
 }
 function finish(id,result){
  if(current!==id||completed.has(id))return;
  if(id==='gary'&&result?.defeated!==20){console.error('Gary finale did not account for all twenty dinosaurs.',result);host.notify('Gary needs to finish his battle before joining.');current=null;host.reset();host.refresh();return;}
  current=null;if(id!=='gary-talk')completed.add(id);award(id);host.reset();host.refresh();
  if(id==='family')run('montage');
  else check();
 }
 function run(id){
  if(!host)throw new Error('Story host is not attached.');
  if(current||V5_CINEMA.active||completed.has(id)||!allowed(id))return false;
  current=id;host.reset();
  if(!V5_CINEMA.play(id,result=>finish(id,result))){
   current=null;console.error('Could not start story event: '+id);host.notify('Could not start this story scene. Try interacting again.');return false;
  }
  host.refresh();return true;
 }
 function start(){
  if(started){check();return false;}
  started=true;
  return run('awakening');
 }
 function check(){
  if(!host||!started||current||V5_CINEMA.active)return;
  if(!completed.has('awakening')){run('awakening');return;}
  if(!completed.has('connor')&&host.scene()==='connorRoom'){run('connor');return;}
  if(completed.has('connor')&&!completed.has('family')&&host.scene()==='house'){run('family');return;}
  if(completed.has('family')&&!completed.has('montage')){run('montage');return;}
  if(!completed.has('gathering')&&allowed('gathering'))run('gathering');
  else if(!completed.has('gary')&&allowed('gary'))run('gary');
 }
 function encounter(id){
  if(!V4_RPG.members[id])throw new Error('Unknown story character: '+id);
  if(id==='gary')return run('gary-talk');
  if(id==='connor')return run('connor');
  if(family.includes(id))return run('family');
  if(!completed.has('montage')){
   host.notify("Coco needs to find Connor, Mom and Dad first.");return false;
  }
  return run('recruit-'+id);
 }
 function canTravel(destination){
  if(current||V5_CINEMA.active)return false;
  if(!completed.has('connor')&&!['cocoRoom','upstairs','connorRoom'].includes(destination)){
   host.notify('Find Connor next door before heading downstairs.');return false;
  }
  if(!completed.has('montage')&&!['cocoRoom','upstairs','connorRoom','house'].includes(destination)){
   host.notify('Find Mom and Dad in the kitchen before heading outside.');return false;
  }
  return true;
 }
 window.V5_EVENTS={attach,start,check,encounter,canTravel,objective,
  get active(){return current!==null;},
  get state(){return {protagonist:'coco',started,current,completed:[...completed],chapter:completed.has('gary')?'complete':completed.has('gathering')?'gary':completed.has('montage')?'rescues':completed.has('connor')?'family':'opening'};}};
})();
