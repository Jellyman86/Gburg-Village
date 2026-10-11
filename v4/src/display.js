(() => {
 'use strict';
 const root=document.documentElement,button=document.getElementById('screen-mode');
 let expanded=false,busy=false;
 const nativeAvailable=()=>document.fullscreenEnabled&&typeof root.requestFullscreen==='function';
 const active=()=>expanded||document.fullscreenElement===root;
 function notify(message){document.dispatchEvent(new CustomEvent('v4-display-message',{detail:message}));}
 function paint(){
  const enabled=active();
  document.body.classList.toggle('expanded-view',enabled);
  button.textContent=enabled?'Exit view':nativeAvailable()?'Fullscreen':'Expand';
  button.setAttribute('aria-pressed',String(enabled));
  button.setAttribute('aria-label',enabled?'Exit fullscreen or expanded game view':nativeAvailable()?'Enter fullscreen game view':'Expand game to the browser viewport');
 }
 function changed(){
  paint();document.dispatchEvent(new Event('v4-display-change'));
  if(!window.V4_MENU.active&&!document.getElementById('dialog').open&&!window.V3_INTRO.active){
   document.getElementById('game').focus({preventScroll:true});
  }
 }
 function expand(){
  expanded=true;
  notify('Expanded view. Browser bars may remain; on iPhone, Safari Share > Add to Home Screen hides them when launched as a web app. See Help.');
 }
 button.addEventListener('click',async()=>{
  if(busy)return;busy=true;button.disabled=true;
  try{
   if(document.fullscreenElement===root)await document.exitFullscreen();
   else if(expanded)expanded=false;
   else if(nativeAvailable()){
    try{await root.requestFullscreen();}
    catch(error){console.warn('Fullscreen request failed; using expanded view.',error);expand();}
   }else expand();
  }catch(error){
   console.error('Could not leave fullscreen.',error);
   notify('Could not leave fullscreen. Use the browser fullscreen control or try Exit view again.');
  }finally{
   busy=false;button.disabled=false;changed();
  }
 });
 document.addEventListener('fullscreenchange',changed);
 paint();
})();
