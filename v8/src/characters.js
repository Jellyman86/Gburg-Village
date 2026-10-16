// Builds the character and pose globals from data/sprites.json (generated into sprites-data.js by `npm run sprites:build`).
// All walk sheets share one contract: 64 x 64 cells, 4 frames per row, rows down/left/right/up, foot anchor (32,60).
// Characters imported later keep their walking frames four rows below the idle rows (walkRowOffset 4).
// Art ids resolve through V8_ART (see data/art.json); nothing here hard-codes a file path.
(()=>{
 'use strict';
 const data=window.V8_SPRITES_DATA,cell=data.cell,foot={...data.foot},rows={...data.walkRows};
 window.CHARACTERS=Object.fromEntries(Object.entries(data.characters).map(([id,c])=>{
  const character={id,name:c.name,sheet:V8_ART.url(c.walk),portrait:V8_ART.url(c.portrait),
   frameWidth:cell,frameHeight:cell,frames:4,rows:{...rows},foot:{...foot},
   speed:c.speed,runSpeed:c.runSpeed,walkFPS:c.walkFPS,runFPS:c.runFPS};
  if(c.walkRowOffset)character.walkRowOffset=c.walkRowOffset;
  if(c.mirrorLeft)character.mirrorLeft=true;
  if(c.joined)character.joined=true; // in the party from the start (no recruitment scene)
  if(c.emotions)character.emotions={sheet:V8_ART.url(c.emotions.art),frames:c.emotions.frames,fps:c.emotions.fps,rows:{...c.emotions.rows}};
  return [id,character];
 }));
 // Action/emotion clips are drawn at native size, subtracting the clip foot from the actor's world anchor.
 window.V5_ACTION_ART=Object.fromEntries(Object.entries(data.poses).map(([id,clips])=>[id,Object.fromEntries(Object.entries(clips).map(([pose,clip])=>{
  const entry={sheet:V8_ART.url(clip.art),frameWidth:clip.frameWidth??cell,frameHeight:clip.frameHeight??cell,foot:{...(clip.foot||foot)},frames:clip.frames,fps:clip.fps};
  if(clip.loop===false)entry.loop=false;
  if(clip.scale!==undefined)entry.scale=clip.scale;
  return [pose,entry];
 }))]));
 window.V5_WINDOW_ART={sheet:V8_ART.url(data.windowHead.art),frameWidth:data.windowHead.frameWidth,frameHeight:data.windowHead.frameHeight,frames:data.windowHead.frames};
 window.characterWalkPose=(character,direction,moving)=>{
  const flip=!!character.mirrorLeft&&direction==='left';
  return {row:character.rows[flip?'right':direction]+(moving?(character.walkRowOffset||0):0),flip};
 };
})();
