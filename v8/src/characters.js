// All characters share a 64 x 64 frame contract and foot anchor. Art ids resolve through V8_ART (see data/art.json).
window.CHARACTERS=Object.fromEntries(['jason','connor','coco','peachy','stephanie','mark','adam','kate','brie','vito','jaime','chris','jeff','ari'].map(id=>[id,{
 id,name:id[0].toUpperCase()+id.slice(1),sheet:V8_ART.url('character.'+id+'.walk'),portrait:V8_ART.url('portrait.'+id),
 frameWidth:64,frameHeight:64,frames:4,rows:{down:0,left:1,right:2,up:3},
 foot:{x:32,y:60},speed:120,runSpeed:205,walkFPS:8,runFPS:12
}]));
// Later recruits' sheets place walking frames four rows below their idle rows.
for(const id of ['jaime','chris','jeff','ari'])window.CHARACTERS[id].walkRowOffset=4;
window.CHARACTERS.jaime.speed=155;window.CHARACTERS.jaime.runSpeed=245;
window.CHARACTERS.coco.emotions={sheet:V8_ART.url('character.coco.emotions'),frames:3,fps:6,rows:{talk:0,surprised:1}};
window.CHARACTERS.gary={...window.CHARACTERS.jason,...window.V5_GARY_WALK,id:'gary',name:'Gary',
 portrait:V8_ART.url('portrait.gary'),speed:135,runSpeed:230,walkFPS:8,runFPS:12,mirrorLeft:true};
window.characterWalkPose=(character,direction,moving)=>{
 const flip=!!character.mirrorLeft&&direction==='left';
 return {row:character.rows[flip?'right':direction]+(moving?(character.walkRowOffset||0):0),flip};
};