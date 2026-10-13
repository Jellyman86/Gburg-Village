// All characters share a 64 x 64 frame contract and foot anchor.
window.CHARACTERS=Object.fromEntries(['jason','connor','coco','peachy','stephanie','mark','adam','kate','brie','vito'].map(id=>[id,{
 id,name:id[0].toUpperCase()+id.slice(1),sheet:`../assets/characters/${id}/sheets/walk_4dir.png`,
 frameWidth:64,frameHeight:64,frames:4,rows:{down:0,left:1,right:2,up:3},
 foot:{x:32,y:60},speed:120,runSpeed:205,walkFPS:8,runFPS:12
}]));
for(const [id,name] of [['jaime','Jaime'],['chris','Chris'],['jeff','Jeff'],['ari','Ari']]){
 window.CHARACTERS[id]={...window.CHARACTERS.jason,id,name,sheet:`../v4/assets/characters/${id}.png`,
  rows:{down:0,left:1,right:2,up:3},walkRowOffset:4};
}
window.CHARACTERS.jaime.speed=155;window.CHARACTERS.jaime.runSpeed=245;
for(const id of Object.keys(window.CHARACTERS)){
 window.CHARACTERS[id].portrait=`../v4/assets/portraits/${id}.png`;
}
window.CHARACTERS.coco.emotions={sheet:'../v5/assets/characters/coco-emotions.png',frames:3,fps:6,rows:{talk:0,surprised:1}};
window.CHARACTERS.gary={...window.CHARACTERS.jason,...window.V5_GARY_WALK,id:'gary',name:'Gary',
 portrait:'../v5/assets/portraits/gary.png',speed:135,runSpeed:230,walkFPS:8,runFPS:12,mirrorLeft:true};
window.CHARACTERS.jeff.sheet='assets/characters/jeff.png?v=danger-1';
window.characterWalkPose=(character,direction,moving)=>{
 const flip=!!character.mirrorLeft&&direction==='left';
 return {row:character.rows[flip?'right':direction]+(moving?(character.walkRowOffset||0):0),flip};
};
