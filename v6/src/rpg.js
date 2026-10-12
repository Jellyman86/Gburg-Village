(() => {
 'use strict';
 const profiles={
  jason:[120,14,10,10,12],connor:[90,10,15,14,8],coco:[80,8,12,13,9],
  peachy:[110,12,14,12,10],stephanie:[95,9,12,15,9],mark:[115,13,10,11,11],
  adam:[105,12,13,14,10],kate:[100,10,12,14,11],brie:[95,10,13,12,10],
  vito:[105,12,15,12,9],jaime:[100,10,17,13,9],chris:[115,13,14,11,11],
  jeff:[110,12,13,14,11],ari:[100,11,15,15,10],gary:[160,20,18,18,18]
 };
 const members=Object.fromEntries(Object.keys(window.CHARACTERS).map(id=>{
  const [maxHP,strength,quickness,dexterity,defense]=profiles[id];
  return [id,{id,joined:id==='coco',level:1,hp:maxHP,maxHP,xp:0,nextLevelXP:100,strength,quickness,dexterity,defense,
   equipment:{weapon:null,accessory:null},ability:window.FAMILY_POWERS.definitions[id]?id:null}];
 }));
 const items=Object.freeze({
  sword:Object.freeze({id:'sword',name:'Japanese sword',slot:'weapon',strength:4,image:'../v4/assets/items/sword.png',description:'Find it in the Dino house. Strength +4. Equip to select Sword slash in Abilities.'}),
  hamburger:Object.freeze({id:'hamburger',name:'Five Guys hamburger',heal:50,image:'assets/items/hamburger.png?v=combat-1',description:'Restore up to 50 HP to the selected character.'})
 });
 const inventory={sword:0,hamburger:3},discoveries={sword:false,dogs:false};
 function recruit(id){
  const value=member(id);if(value.joined)return {ok:false,message:window.CHARACTERS[id].name+' is already in your party.'};
  value.joined=true;return {ok:true,message:window.CHARACTERS[id].name+' joined your party!'};
 }
 function findDogs(){
  if(discoveries.dogs)return {ok:false,message:'Barney and Rosie are already following you.'};
  discoveries.dogs=true;return {ok:true,message:'Barney and Rosie will follow at a comfortable distance. They follow you between areas, too!'};
 }
 function collectSword(){
  if(discoveries.sword)return {ok:false,message:'You already found the Japanese sword.'};
  discoveries.sword=true;inventory.sword++;
  return {ok:true,message:'You found the Japanese sword! Open Menu > Equip to equip it, then choose Sword slash in Abilities.'};
 }
 function member(id){if(!members[id])throw new Error('Unknown character: '+id);return members[id];}
 function stats(id){
  const value=member(id),weapon=items[value.equipment.weapon];
  return {...value,equipment:{...value.equipment},strength:value.strength+(weapon?.strength||0)};
 }
 function equip(id,slot,itemId){
  const value=member(id);
  if(!value.joined)return {ok:false,message:'Find '+window.CHARACTERS[id].name+' before changing their equipment.'};
  if(!['weapon','accessory'].includes(slot))throw new Error('Unknown equipment slot: '+slot);
  if(itemId!==null&&(!items[itemId]||items[itemId].slot!==slot))throw new Error('Item does not fit this slot.');
  const old=value.equipment[slot];
  if(old===itemId)return {ok:false,message:'Already equipped.'};
  if(itemId!==null&&inventory[itemId]<1)return {ok:false,message:itemId==='sword'&&!discoveries.sword?'Find the Japanese sword in the Dino house first.':'That item is already equipped by another character.'};
  if(old)inventory[old]++;
  if(itemId)inventory[itemId]--;
  value.equipment[slot]=itemId;
  if(value.ability==='sword'&&value.equipment.weapon!=='sword')value.ability=null;
  return {ok:true,message:itemId?items[itemId].name+' equipped.':'Item returned to inventory.'};
 }
 function useItem(id,itemId){
  const value=member(id),item=items[itemId];
  if(!value.joined)return {ok:false,message:'Find '+window.CHARACTERS[id].name+' first.'};
  if(!item?.heal)throw new Error('Item is not consumable.');
  if(inventory[itemId]<1)return {ok:false,message:'No '+item.name+' left.'};
  if(value.hp>=stats(id).maxHP)return {ok:false,message:window.CHARACTERS[id].name+' already has full HP. No item used.'};
  const restored=Math.min(item.heal,stats(id).maxHP-value.hp);
  value.hp+=restored;inventory[itemId]--;
  return {ok:true,message:window.CHARACTERS[id].name+' recovered '+restored+' HP.'};
 }
 function equipAbility(id,ability){
  const value=member(id);
  if(!value.joined)return {ok:false,message:'Find '+window.CHARACTERS[id].name+' first.'};
  if(ability!==null&&!window.FAMILY_POWERS.definitions[ability])throw new Error('Unknown ability: '+ability);
  if(ability&&members[ability]&&!members[ability].joined)return {ok:false,message:'Find '+window.CHARACTERS[ability].name+' to unlock this ability.'};
  if(ability==='sword'&&value.equipment.weapon!=='sword')return {ok:false,message:'Equip the Japanese sword before selecting Sword slash.'};
  value.ability=ability;
  return {ok:true,message:ability?window.FAMILY_POWERS.definitions[ability].name+' equipped.':'Special ability unequipped.'};
 }
 window.V4_RPG={members,items,inventory,discoveries,recruit,findDogs,collectSword,stats,equip,useItem,equipAbility};
})();
