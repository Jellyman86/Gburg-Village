(() => {
 'use strict';
 const locations={
  connor:{scene:'connorRoom',x:425,y:352,hint:"Connor's room next door, upstairs in the Dino house."},
  peachy:{scene:'house',x:350,y:475,hint:'The Dino house living room, downstairs.'},
  jason:{scene:'house',x:410,y:210,hint:'The Dino house central hallway, near the kitchen.'},
  jeff:{scene:'recreation',x:385,y:345,hint:'The soccer field left of the playground.'},
  ari:{scene:'recreation',x:575,y:345,hint:'The soccer field left of the playground.'},
  chris:{scene:'recreation',x:358,y:932,hint:'Beside the lap pool. Walk through the open gate between the courts and pool.'},
  jaime:{scene:'recreation',x:100,y:350,hint:'Skating on the west recreation street.'},
  mark:{scene:'rockband',x:315,y:270,hint:'Rock Band house: enter from the street west of the pool.'},
  stephanie:{scene:'rockband',x:420,y:260,hint:'Rock Band house: enter from the street west of the pool.'},
  adam:{scene:'neighborhood',x:330,y:780,hint:'The home-neighborhood path, just east of the Dino house.'},
  brie:{scene:'plaza',x:465,y:825,hint:'The plaza, beside the restaurant path.'},
  vito:{scene:'district',x:1615,y:1045,hint:'Main Street, near the route to the pool.'},
  kate:{scene:'north',x:767,y:1015,hint:'The main north street, south of the meteor roundabout.'}
 };
 const order=['connor','peachy','jason','jeff','ari','chris','jaime','mark','stephanie','adam','brie','vito','kate'];
 function objective(){
  const next=order.find(id=>!V4_RPG.members[id].joined);
  return next?'Find '+CHARACTERS[next].name+' · '+locations[next].hint:'Everyone is together! Explore with your full party.';
 }
 function actors(scene,ambient=[]){
  return Object.entries(locations).filter(([id,place])=>place.scene===scene&&!V4_RPG.members[id].joined)
   .map(([id,place])=>({...place,id,direction:'down',frame:1,...ambient.find(a=>a.id===id)}));
 }
 function encounters(scene){
  return Object.entries(locations).filter(([id,place])=>place.scene===scene&&!V4_RPG.members[id].joined)
   .map(([id,place])=>({...place,id:'friend-'+id,name:CHARACTERS[id].name+' · Talk',radius:62,recruit:id}));
 }
 window.V4_STORY={locations,objective,actors,encounters};
})();
