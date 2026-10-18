// Keeps touch interaction inside the game on iPhone/iPad (and Android) browsers: no pinch zoom, no page scroll or
// rubber-banding, no text selection, no long-press context menu. Everything is gated on the `touch` body class that
// game.js sets, so desktop mouse/keyboard play (including right-click and trackpad pinch) is left alone.
// Menus, the party bar and form controls keep their own scrolling and dragging.
// (Double-tap zoom is handled in CSS with touch-action: manipulation; iOS also needs the gesture* events below.)
(()=>{
 'use strict';
 const active=()=>document.body.classList.contains('touch');
 const element=node=>node&&(node.nodeType===1?node:node.parentElement);
 const editable=node=>{const el=element(node);return !!el&&!!el.closest('input,textarea,select,[contenteditable="true"]');};
 // True when the touch started inside something that really scrolls (menu panels, the party bar), so it may pan.
 const scrolls=node=>{
  for(let el=element(node);el&&el!==document.documentElement;el=el.parentElement){
   const style=getComputedStyle(el);
   if(/auto|scroll/.test(style.overflowY+style.overflowX)&&(el.scrollHeight>el.clientHeight+1||el.scrollWidth>el.clientWidth+1))return true;
  }
  return false;
 };
 const block=event=>{if(active()&&event.cancelable)event.preventDefault();};
 const options={passive:false};

 // Safari reports pinch zoom as WebKit gesture events, and ignores user-scalable=no.
 for(const type of ['gesturestart','gesturechange','gestureend'])document.addEventListener(type,block,options);
 // Two-finger drags never belong to the game; single-finger drags may only pan a scrollable panel or move a slider.
 document.addEventListener('touchmove',event=>{
  if(!active()||!event.cancelable)return;
  if(event.touches.length>1||(!editable(event.target)&&!scrolls(event.target)))event.preventDefault();
 },options);
 document.addEventListener('contextmenu',event=>{if(!editable(event.target))block(event);},options);
 document.addEventListener('selectstart',event=>{if(!editable(event.target))block(event);},options);
 document.addEventListener('dragstart',block,options);
})();
