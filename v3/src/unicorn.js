// A discoverable pixel unicorn, drawn like the existing canvas animals.
(() => {
 'use strict';
 function create({blocked,home={x:1398,y:720}}){
  const state={...home,direction:'left',riding:false,moving:false,clock:0};
  function nearby(actor){return !state.riding&&Math.hypot(actor.x-state.x,actor.y-state.y)<48;}
  function interact(actor){
   if(!state.riding){
    if(!nearby(actor)||blocked(state.x,state.y,14,7))return false;
    actor.x=state.x;actor.y=state.y;state.riding=true;state.moving=false;state.direction=actor.direction;return true;
   }
   // Put the rider on a clear patch, including near walls and map edges.
   const offsets=[[24,14],[-24,14],[0,25],[25,0],[-25,0],[0,-25],[0,0]];
   for(const [dx,dy] of offsets){
    const x=actor.x+dx,y=actor.y+dy;
    if(blocked(x,y)||blocked(actor.x+dx/2,actor.y+dy/2))continue;
    state.x=actor.x;state.y=actor.y;state.riding=false;state.moving=false;actor.x=x;actor.y=y;return true;
   }
   return false;
  }
  function update(dt,actor){
   if(state.riding){state.x=actor.x;state.y=actor.y;state.direction=actor.direction;state.moving=actor.moving;if(actor.moving)state.clock+=dt*(actor.running?14:9);}
   else{state.moving=false;state.clock+=dt*2;}
  }
  function draw(ctx,actor){
   const x=Math.round(actor?.x??state.x),y=Math.round(actor?.y??state.y),direction=actor?.direction||state.direction;
   const stride=Math.floor(state.clock)%4,bob=state.moving&&stride%2?-2:0;
   ctx.save();ctx.translate(x,y);ctx.fillStyle='#17383b55';ctx.beginPath();ctx.ellipse(0,1,25,6,0,0,Math.PI*2);ctx.fill();ctx.translate(0,bob);
   const rect=(color,x,y,w,h)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
   const outline='#67547a',white='#f5f0e8',shade='#cccddd',pink='#ee91c6',cyan='#7ed5e8',gold='#f5d57b';
   if(direction==='left'||direction==='right'){
    ctx.scale(direction==='right'?1:-1,1);
    // Tail and four alternating hooves, followed by body and proud head.
    rect(outline,-30,-35,12,22);rect(pink,-29,-33,5,18);rect(cyan,-25,-30,5,18);rect('#baa0e6',-29,-17,7,5);
    for(const [i,lx] of [-17,-10,9,17].entries()){
     const step=state.moving?[0,3,0,-3][(stride+i%2*2)%4]:0;
     rect(outline,lx+step,-22,6,20);rect(shade,lx+step+1,-21,4,15);rect('#9380ad',lx+step-1,-5,8,5);
    }
    rect(outline,-23,-39,47,22);rect(white,-21,-37,43,18);rect(shade,-19,-22,34,4);
    rect(outline,10,-53,14,27);rect(white,12,-51,10,24);rect(shade,10,-34,5,11);
    rect(outline,16,-61,19,18);rect(white,18,-59,15,14);rect(outline,30,-50,9,9);rect(white,30,-48,8,5);
    rect(outline,18,-66,5,8);rect(white,19,-64,3,6);rect(gold,28,-70,3,12);rect('#fff1b8',29,-70,1,8);
    rect(pink,11,-58,6,27);rect(cyan,8,-53,5,22);rect('#baa0e6',8,-35,5,8);rect('#243d4c',29,-56,2,3);
    rect('#b699ba',34,-46,2,1);rect('#956d99',-6,-38,17,5);rect('#dab6d4',-3,-37,12,3);
   }else{
    const back=direction==='up';
    for(const [i,lx] of [-12,6].entries()){
     const step=state.moving?[0,3,0,-3][(stride+i*2)%4]:0;rect(outline,lx,-23,7,21-step);rect(white,lx+1,-21,5,16-step);rect('#9380ad',lx-1,-4-step,9,4);
    }
    rect(outline,-17,-41,34,23);rect(white,-15,-39,30,18);rect(shade,-13,-23,26,5);
    rect(outline,-10,-60,20,30);rect(white,-8,-58,16,26);rect(outline,-12,-64,6,8);rect(outline,6,-64,6,8);rect(white,-10,-63,3,6);rect(white,7,-63,3,6);
    if(back){rect(pink,-4,-59,5,30);rect(cyan,1,-57,4,31);rect('#baa0e6',-3,-25,7,17);}
    else{rect(gold,-1,-71,3,16);rect('#fff4bd',0,-71,1,12);rect(pink,-8,-61,7,8);rect(cyan,1,-61,7,8);rect('#283d4c',-6,-51,2,3);rect('#283d4c',4,-51,2,3);rect(shade,-8,-42,16,8);rect('#ab8daa',-5,-39,2,2);rect('#ab8daa',3,-39,2,2);}
    rect('#956d99',-12,-35,24,5);
   }
   // Tiny twinkles give a clue that this animal can be ridden.
   const twinkle=Math.floor(state.clock)%3;
   for(const [i,side] of [-1,1].entries()){const sx=side*29,sy=-45+(twinkle+i)%3*6;rect('#fae6ad',sx-3,sy,7,1);rect('#fae6ad',sx,sy-3,1,7);}
   ctx.restore();
  }
  return {nearby,interact,update,draw,get riding(){return state.riding;},get state(){return {...state};}};
 }
 window.FAMILY_UNICORN=Object.freeze({create});
})();
