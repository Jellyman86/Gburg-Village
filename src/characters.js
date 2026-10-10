// All characters share a 64 x 64 frame contract and foot anchor.
window.CHARACTERS=Object.fromEntries(['jason','connor','coco','peachy','stephanie','mark','adam','kate','brie','vito'].map(id=>[id,{
 id,name:id[0].toUpperCase()+id.slice(1),sheet:`assets/characters/${id}/sheets/walk_4dir.png`,
 frameWidth:64,frameHeight:64,frames:4,rows:{down:0,left:1,right:2,up:3},
 foot:{x:32,y:60},speed:120,runSpeed:205,walkFPS:8,runFPS:12
}]));
