(() => {
 'use strict';
 const $=id=>document.getElementById(id),dialog=$('rpg-menu'),rpg=window.V4_RPG;
 const sections=['Party','Stats','Items','Equip','Abilities','Options'],tabs=[],roster={};
 let selected='coco',section='Party';
 function element(tag,text,className){
  const node=document.createElement(tag);if(text!==undefined)node.textContent=text;
  if(className)node.className=className;return node;
 }
 function portrait(id){
  const character=window.CHARACTERS[id],slot=element('div',undefined,'portrait-slot');
  if(character.portrait){
   const image=element('img');image.src=character.portrait;image.alt=character.name+' portrait';
   image.width=128;image.height=128;slot.append(image);
  }else{
   slot.append(element('b',character.name.slice(0,1)),element('small','Portrait pending'));
   slot.setAttribute('aria-label',character.name+': placeholder portrait');
  }
  return slot;
 }
 function render(){
  const character=window.CHARACTERS[selected],stats=rpg.stats(selected),detail=$('menu-detail');
  tabs.forEach(tab=>{const active=tab.textContent===section;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
  detail.setAttribute('aria-labelledby','tab-'+section.toLowerCase());detail.replaceChildren();
  Object.entries(roster).forEach(([id,button])=>{
   button.setAttribute('aria-pressed',String(id===selected));
   button.querySelector('.roster-stats').textContent=!rpg.members[id].joined?'Not found yet':`Lv ${rpg.members[id].level} · HP ${rpg.members[id].hp}/${rpg.stats(id).maxHP}`+(window.GAME?.state.player.id===id?' · Active':'');
  });
  const summary=element('div',undefined,'member-summary'),heading=element('div');
  heading.append(element('h3',character.name),element('p',`Level ${stats.level} · HP ${stats.hp} / ${stats.maxHP}`),element('p',`XP ${stats.xp} / ${stats.nextLevelXP}`));
  if(character.spritePlaceholder)heading.append(element('small','Walking sprite placeholder; new atlas awaiting verification.'));
  summary.append(portrait(selected),heading);detail.append(summary);
  if(section==='Party'||section==='Stats'){
   const table=element('dl',undefined,'stat-grid');
   for(const [label,key] of [['Strength','strength'],['Quickness','quickness'],['Dexterity','dexterity'],['Defense','defense']]){
    const modifier=stats[key]-rpg.members[selected][key];
    table.append(element('dt',label),element('dd',String(stats[key])+(modifier?' ('+rpg.members[selected][key]+' + '+modifier+')':'')));
   }
   detail.append(table);
   const play=element('button','Play as '+character.name,'primary');play.type='button';play.id='menu-play';
   play.disabled=!stats.joined||!!window.GAME?.busy;
   play.addEventListener('click',()=>{window.GAME.select(selected);close();});
   detail.append(play,element('p',stats.joined?'This friend is in your party. Exploration stays real-time outside the menu.':'Find '+character.name+' to unlock them. '+(window.V4_STORY.locations[selected]?.hint||window.V4_STORY.hints?.[selected]||''),'menu-note'));
   detail.append(element('p',window.V4_STORY.objective(),'menu-note'));
  }else if(section==='Items'){
   detail.append(element('h3','Shared inventory'));
   for(const item of Object.values(rpg.items)){
    const row=element('div',undefined,'item-row');
    if(item.image){const image=element('img');image.src=item.image;image.alt=item.name;image.width=64;image.height=64;image.className='item-icon';row.append(image);}
    row.append(element('strong',item.name+' × '+rpg.inventory[item.id]),element('p',item.description));
    if(item.heal){
     const use=action('Use on '+character.name,()=>rpg.useItem(selected,item.id));use.dataset.item=item.id;
     use.disabled=!stats.joined||rpg.inventory[item.id]===0||stats.hp===stats.maxHP;
     row.append(use);
     if(stats.hp===stats.maxHP)row.append(element('small','Full HP: no hamburger needed.'));
    }
    detail.append(row);
   }
  }else if(section==='Equip'){
   detail.append(element('h3','Equipment'));
   for(const slot of ['weapon','accessory']){
    const current=stats.equipment[slot],row=element('div',undefined,'item-row');
    row.append(element('strong',slot[0].toUpperCase()+slot.slice(1)+': '+(current?rpg.items[current].name:'Empty')));
    if(current){
     const remove=action('Unequip '+rpg.items[current].name,()=>rpg.equip(selected,slot,null));remove.dataset.unequip=slot;row.append(remove);
    }
    for(const item of Object.values(rpg.items).filter(item=>item.slot===slot)){
     row.append(element('p',item.description));
     if(item.image){const image=element('img');image.src=item.image;image.alt=item.name;image.width=64;image.height=64;image.className='item-icon';row.append(image);}
     const equip=action('Equip '+item.name+' ('+rpg.inventory[item.id]+' available)',()=>rpg.equip(selected,slot,item.id));
     equip.dataset.equip=item.id;equip.disabled=!stats.joined||rpg.inventory[item.id]===0;row.append(equip);
    }
    if(slot==='accessory')row.append(element('p','Accessory slot reserved for future items.'));
    detail.append(row);
   }
   detail.append(element('p','Strength boosts attack damage; defense softens incoming hits. At zero HP, Gary patches up the active hero at Five Guys without taking any items. XP and leveling are not enabled yet.','menu-note'));
  }else if(section==='Abilities'){
   detail.append(element('h3','One equipped ability'));
   const equipped=rpg.members[selected].ability;
   detail.append(element('p','Equipped: '+(equipped?window.FAMILY_POWERS.definitions[equipped].name:'None')));
   const list=element('div',undefined,'ability-list');
   for(const [id,power] of [[null,{name:'None'}],...Object.entries(window.FAMILY_POWERS.definitions)]){
    const button=action(power.name,()=>rpg.equipAbility(selected,id));
    button.disabled=!stats.joined||!!(rpg.members[id]&&!rpg.members[id].joined);
    if(id==='sword'&&stats.equipment.weapon!=='sword'){button.disabled=true;button.title='Requires equipped Japanese sword';}
    if(id==='grenade'&&!rpg.discoveries.grenade){button.disabled=true;button.title='Find the grenade north of Cinepolis';}
    button.dataset.ability=id||'none';button.setAttribute('aria-pressed',String(equipped===id));list.append(button);
   }
   detail.append(list,element('p','Relic-style slot: choose one power. X or the power button uses it in the world. Find the sword in the Dino house for Sword slash and the grenade north of Cinepolis for a reusable blast. Jeff throws baseballs, Ari volleys soccer balls, Chris uses a short-range Towel Whip, and Jaime spins a skate tornado.','menu-note'));
  }else if(section==='Options'){
   renderOptions(detail);
  }
  detail.append(element('p','Preview progress lasts for this play session only; local saves are the next milestone.','menu-note'));
 }
 // Options: music director controls. Shipped defaults live in data/music.json; choices here are saved on this device.
 function renderOptions(detail){
  const music=window.V8_MUSIC;
  detail.append(element('h3','Music'));
  if(!music){detail.append(element('p','Music is not available in this browser.','menu-note'));return;}
  const state=music.state,now=element('p',undefined,'now-playing');now.id='music-now-playing';
  now.textContent=nowPlaying();
  detail.append(now);
  const modes=element('div',undefined,'option-row segmented');modes.setAttribute('role','group');modes.setAttribute('aria-label','Music mode');
  for(const [mode,label,message] of [['off','Off','Music off.'],['on','On','Place playlists play; hero themes are off.'],['themed','Themed','Each hero plays their own theme where allowed.']]){
   const choice=option(label,()=>{music.setMode(mode);return {message};});choice.id='option-music-'+mode;choice.setAttribute('aria-pressed',String(state.music===mode));modes.append(choice);
  }
  const skip=option('Next track',()=>{music.skip();return {message:'Skipped.'};});skip.id='option-music-skip';skip.disabled=state.reason!=='rotate';
  const toggles=element('div',undefined,'option-row');toggles.append(element('span','Music'),modes,skip);detail.append(toggles);
  const volumeRow=element('label',undefined,'option-row');volumeRow.append(element('span','Volume'));
  const volume=element('input');volume.type='range';volume.min='0';volume.max='100';volume.step='5';volume.value=String(Math.round(state.level*100));volume.id='option-music-volume';volume.setAttribute('aria-label','Music volume');
  volume.addEventListener('input',()=>music.setVolume(Number(volume.value)/100));
  volumeRow.append(volume);detail.append(volumeRow);
  const trackOptions=(select,extra)=>{
   for(const [value,label] of extra)select.append(new Option(label,value));
   const files=music.tracks().filter(t=>t.kind==='file'),synth=music.tracks().filter(t=>t.kind==='synth');
   const group=document.createElement('optgroup');group.label='Tracks';for(const t of files)group.append(new Option(t.title,t.id));select.append(group);
   const originals=document.createElement('optgroup');originals.label='Original themes';for(const t of synth)originals.append(new Option(t.title,t.id));select.append(originals);
  };
  detail.append(element('h3','Places'));
  const places=element('div',undefined,'option-grid');
  for(const place of music.places){
   const label=element('label');label.append(element('span',music.placeLabels[place]));
   const select=element('select');select.dataset.place=place;
   const list=music.playlist(place);
   trackOptions(select,[['character','Character theme'],['',`Rotate playlist (${list.length}: ${list.map(id=>music.titleOf(id)).join(', ')})`]]);
   select.value=music.placePick(place);
   select.addEventListener('change',()=>{music.setPlacePick(place,select.value);render();$('menu-message').textContent=music.placeLabels[place]+' → '+(select.value==='character'?'character theme':select.value===''?'rotating playlist':music.titleOf(select.value))+'.';});
   label.append(select);places.append(label);
  }
  detail.append(places);
  detail.append(element('h3','Character themes'));
  const themes=element('div',undefined,'option-grid');
  for(const [id,character] of Object.entries(window.CHARACTERS)){
   if(!rpg.members[id].joined)continue;
   const label=element('label');label.append(element('span',character.name));
   const select=element('select');select.dataset.character=id;
   const shipped=music.defaultCharacterTheme(id);
   trackOptions(select,[['__default',`Default (${shipped?music.titleOf(shipped):'none'})`],['__none','No theme']]);
   const current=music.characterTheme(id),stored=music.state&&Object.hasOwn(JSON.parse(localStorage.getItem('gburg-v8-music')||'{}').characters||{},id);
   select.value=!stored?'__default':current===null?'__none':current;
   select.addEventListener('change',()=>{music.setCharacterTheme(id,select.value==='__default'?undefined:select.value==='__none'?null:select.value);render();$('menu-message').textContent=character.name+' → '+(select.value==='__default'?'default theme':select.value==='__none'?'no theme':music.titleOf(select.value))+'.';});
   label.append(select);themes.append(label);
  }
  detail.append(themes);
  detail.append(element('p','Shipped defaults come from data/music.json. Choices here are remembered on this device. Sound effects, damage numbers and the bus gag are under Help.','menu-note'));
 }
 function nowPlaying(){
  const state=window.V8_MUSIC.state;
  return !state.enabled?'Music is off.':state.playing?`Now playing: ${state.title}`+(state.reason==='character'?` (${window.CHARACTERS[window.GAME?.state.player.id]?.name}'s theme)`:state.reason==='rotate'?' (rotating)':''):'Music starts after your next tap or key press.';
 }
 document.addEventListener('v8-music-change',()=>{const now=$('music-now-playing');if(now&&dialog.open)now.textContent=nowPlaying();});
 function option(label,perform){
  const button=element('button',label);button.type='button';
  button.addEventListener('click',()=>{const result=perform();render();$('menu-message').textContent=result.message;});
  return button;
 }
 function action(label,perform){
  const button=element('button',label);button.type='button';
  button.addEventListener('click',()=>{
   const result=perform();render();$('menu-message').textContent=result.message;
   $('menu-detail').focus({preventScroll:true});
  });
  return button;
 }
 function chooseSection(next){section=next;$('menu-message').textContent='';render();}
 sections.forEach(name=>{
  const tab=element('button',name);tab.id='tab-'+name.toLowerCase();tab.type='button';
  tab.setAttribute('role','tab');tab.setAttribute('aria-controls','menu-detail');
  tab.addEventListener('click',()=>chooseSection(name));
  tab.addEventListener('keydown',event=>{
   const index=sections.indexOf(section);let next;
   if(event.key==='ArrowRight'||event.key==='ArrowDown')next=(index+1)%sections.length;
   else if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=(index+sections.length-1)%sections.length;
   else if(event.key==='Home')next=0;else if(event.key==='End')next=sections.length-1;
   if(next===undefined)return;event.preventDefault();chooseSection(sections[next]);tabs[next].focus();
  });
  tabs.push(tab);$('menu-tabs').append(tab);
 });
 Object.entries(window.CHARACTERS).forEach(([id,character])=>{
  const button=element('button');button.type='button';button.dataset.member=id;
  const label=element('span');label.append(element('strong',character.name),element('small',undefined,'roster-stats'));
  button.append(portrait(id),label);button.setAttribute('aria-label','View '+character.name);
  button.addEventListener('click',()=>{selected=id;$('menu-message').textContent='';render();});
  roster[id]=button;$('menu-roster').append(button);
 });
 $('roster-count').textContent=String(Object.keys(roster).length);
 function open(){
  if(!window.GAME?.ready||window.GAME?.state.map||window.GAME?.state.playerCombat.locked||window.GAME?.state.joining||window.V5_CINEMA?.active||window.V5_EVENTS?.active||window.V3_INTRO?.active||$('dialog').open||dialog.open)return;
  selected=window.GAME.state.player.id;section='Party';$('menu-message').textContent='';
  document.dispatchEvent(new Event('v4-menu-open'));render();dialog.showModal();tabs[0].focus();
 }
 function close(){if(dialog.open)dialog.close();}
 dialog.addEventListener('close',()=>{document.dispatchEvent(new Event('v4-menu-close'));$('game').focus({preventScroll:true});});
 $('open-menu').addEventListener('click',open);$('close-menu').addEventListener('click',close);
 window.addEventListener('keydown',event=>{
  if(event.ctrlKey||event.altKey||event.metaKey||event.repeat)return;
  if(event.code==='KeyM'||event.code==='Escape'){
   if(window.GAME?.state.map||window.V3_INTRO?.active||window.V5_CINEMA?.active||$('dialog').open)return;
   event.preventDefault();if(dialog.open)close();else open();
  }
 },true);
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 window.V4_MENU={get active(){return dialog.open;},open,close};
})();
