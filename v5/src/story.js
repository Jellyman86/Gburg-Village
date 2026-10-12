(() => {
 'use strict';
 const locations={
  connor:{scene:'connorRoom',x:425,y:352,hint:"Connor's room next door, upstairs in the Dino house."},
  peachy:{scene:'house',x:520,y:200,hint:'The Dino house kitchen, downstairs with Dad.'},
  jason:{scene:'house',x:410,y:200,hint:'The Dino house kitchen, downstairs with Mom.'},
  jeff:{scene:'recreation',x:385,y:345,hint:'The soccer field left of the playground.'},
  ari:{scene:'recreation',x:575,y:345,hint:'The soccer field left of the playground.'},
  chris:{scene:'recreation',x:358,y:932,hint:'Beside the lap pool. Walk through the open gate between the courts and pool.'},
  jaime:{scene:'recreation',x:100,y:350,hint:'Skating on the west recreation street.'},
  mark:{scene:'rockband',x:315,y:270,hint:'Rock Band house: enter from the right/east street of recreation.'},
  stephanie:{scene:'rockband',x:420,y:260,hint:'Rock Band house: enter from the right/east street of recreation.'},
  adam:{scene:'neighborhood',x:330,y:780,hint:'The home-neighborhood path, just east of the Dino house.'},
  brie:{scene:'plaza',x:465,y:825,hint:'The plaza, beside the restaurant path.'},
  vito:{scene:'district',x:1615,y:1045,hint:'Shops and Main Street, along the lower road.'},
  kate:{scene:'north',x:767,y:1015,hint:'The main north street, south of the meteor roundabout.'}
 };
 const order=['connor','peachy','jason','jeff','ari','chris','jaime','mark','stephanie','adam','brie','vito','kate'];
 function objective(){
  if(window.V5_EVENTS)return V5_EVENTS.objective();
  const next=order.find(id=>!V4_RPG.members[id].joined);
  return next?'Find '+CHARACTERS[next].name+' · '+locations[next].hint:'Everyone is together! Explore with your full party.';
 }
 function actors(scene,ambient=[],activeId='coco'){
  const waiting=Object.entries(locations).filter(([id,place])=>place.scene===scene&&!V4_RPG.members[id].joined)
   .map(([id,place])=>({...place,id,direction:'down',frame:1,...ambient.find(a=>a.id===id)}));
  if(scene!=='plaza'||!window.V5_EVENTS?.state.completed.includes('montage'))return waiting;
  const gathered=Object.keys(CHARACTERS).map((id,index)=>({id,x:558+(index%7)*70,y:850+Math.floor(index/7)*80,direction:'down',frame:1,gathered:true}))
   .filter(actor=>actor.id!==activeId&&V4_RPG.members[actor.id].joined);
  return waiting.concat(gathered);
 }
 function encounters(scene){
  return Object.entries(locations).filter(([id,place])=>place.scene===scene&&!V4_RPG.members[id].joined)
   .map(([id,place])=>({...place,id:'friend-'+id,name:CHARACTERS[id].name+' · Talk',radius:62,recruit:id}));
 }
 window.V4_STORY={locations,order,objective,actors,encounters};
})();
