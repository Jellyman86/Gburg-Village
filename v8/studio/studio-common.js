// Shared by every Gburg Studio page: the connection to the local studio server and the tab bar.
// STUDIO_SERVER.open('geometry') loads a registered document and returns a handle that saves it back with the
// session token and revision check. Without the server (GitHub Pages, tests) the handle is read-only and `data`
// comes from the fallback the caller supplies.
(() => {
 'use strict';
 const TABS=[
  {id:'world',label:'World',href:'',title:'Collision shapes, markers, exits and roads over the real backgrounds'},
  {id:'sprites',label:'Sprites',href:'sprites/',title:'Sprite Workshop — import or replace walk sheets, poses and portraits'},
  {id:'files',label:'Files',href:'files/',title:'Where dinosaur health, hero stats, weapon damage and the art prompts live'},
  {id:'cinema',label:'Cinematics',href:'cinema/',title:'Cutscene director — coming in a later phase',soon:true}
 ];
 // Pages declare where the studio root is relative to them (body data-studio-root, default "./").
 function renderTabs(active){
  const nav=document.getElementById('studio-tabs');if(!nav)return;
  const base=document.body.dataset.studioRoot||'./';
  for(const tab of TABS){
   const link=document.createElement(tab.soon?'span':'a');
   link.textContent=tab.label;link.title=tab.title;link.className='tab'+(tab.id===active?' active':'')+(tab.soon?' soon':'');
   if(!tab.soon)link.href=base+tab.href;else link.setAttribute('aria-disabled','true');
   if(tab.id===active)link.setAttribute('aria-current','page');
   nav.append(link);
  }
 }
 async function open(name,fallback){
  const handle={name,remote:false,data:fallback,revision:null,token:null,label:null,
   async save(data){
    if(!handle.remote)throw new Error('Read-only preview: run `npm run studio` to save.');
    const response=await fetch('/api/doc/'+name,{method:'POST',headers:{'Content-Type':'application/json','X-Studio-Token':handle.token},body:JSON.stringify({revision:handle.revision,data})});
    const body=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(body.error||response.statusText);
    handle.revision=body.revision;handle.data=body.data;return body.data;
   }};
  try{
   const response=await fetch('/api/doc/'+name,{cache:'no-store'});
   if(!response.ok)throw new Error('no api');
   const body=await response.json();
   Object.assign(handle,{remote:true,data:body.data,revision:body.revision,token:body.token,label:body.label});
  }catch{/* static hosting: stay read-only with the fallback data */}
  return handle;
 }
 window.STUDIO_SERVER={open,renderTabs,tabs:TABS};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>renderTabs(document.body.dataset.studioTab));
 else renderTabs(document.body.dataset.studioTab);
})();
