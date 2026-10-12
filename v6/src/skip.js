(() => {
 'use strict';
 const button=document.getElementById('cutscene-skip');
 function paint(){
  const intro=window.V3_INTRO,scene=V5_CINEMA.state;
  button.hidden=!intro?.active&&!V5_CINEMA.active;
  button.disabled=intro?.active?!intro.state.ready:!V5_CINEMA.active||scene.loading||!!scene.error;
  button.textContent=scene.waitingReturn?'Continue':'Skip scene';
  requestAnimationFrame(paint);
 }
 button.onclick=()=>{
  if(window.V3_INTRO?.active)document.getElementById('intro-skip').click();
  else V5_CINEMA.skip();
 };
 paint();
})();
