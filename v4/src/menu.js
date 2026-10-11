(() => {
 'use strict';
 const $=id=>document.getElementById(id),dialog=$('rpg-menu'),rpg=window.V4_RPG;
 const sections=['Party','Stats','Items','Equip','Abilities'],tabs=[],roster={};
 let selected='jason',section='Party';
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
   button.querySelector('.roster-stats').textContent=`Lv ${rpg.members[id].level} · HP ${rpg.members[id].hp}/${rpg.stats(id).maxHP}`+(window.GAME?.state.player.id===id?' · Active':'');
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
   play.addEventListener('click',()=>{window.GAME.select(selected);close();});
   detail.append(play,element('p','All roster members are playable. Exploration and dinosaur tag remain real-time outside this menu.','menu-note'));
  }else if(section==='Items'){
   detail.append(element('h3','Shared inventory'));
   for(const item of Object.values(rpg.items)){
    const row=element('div',undefined,'item-row');
    if(item.image){const image=element('img');image.src=item.image;image.alt=item.name;image.width=64;image.height=64;image.className='item-icon';row.append(image);}
    row.append(element('strong',item.name+' × '+rpg.inventory[item.id]),element('p',item.description));
    if(item.heal){
     const use=action('Use on '+character.name,()=>rpg.useItem(selected,item.id));use.dataset.item=item.id;
     use.disabled=rpg.inventory[item.id]===0||stats.hp===stats.maxHP;
     row.append(use);
     if(stats.hp===stats.maxHP)row.append(element('small','Full HP: no hamburger needed. Dinosaur tag is still harmless.'));
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
     equip.dataset.equip=item.id;equip.disabled=rpg.inventory[item.id]===0;row.append(equip);
    }
    if(slot==='accessory')row.append(element('p','Accessory slot reserved for future items.'));
    detail.append(row);
   }
   detail.append(element('p','Equipment modifies displayed RPG stats. Combat damage and progression are not enabled yet.','menu-note'));
  }else if(section==='Abilities'){
   detail.append(element('h3','One equipped ability'));
   const equipped=rpg.members[selected].ability;
   detail.append(element('p','Equipped: '+(equipped?window.FAMILY_POWERS.definitions[equipped].name:'None')));
   const list=element('div',undefined,'ability-list');
   for(const [id,power] of [[null,{name:'None'}],...Object.entries(window.FAMILY_POWERS.definitions)]){
    const button=action(power.name,()=>rpg.equipAbility(selected,id));
    if(id==='sword'&&stats.equipment.weapon!=='sword'){button.disabled=true;button.title='Requires equipped Japanese sword';}
    button.dataset.ability=id||'none';button.setAttribute('aria-pressed',String(equipped===id));list.append(button);
   }
   detail.append(list,element('p','Relic-style slot: choose one power. X or the power button uses it in the world. Sword slash requires the sword; soccer shots are available too. Original characters retain their familiar power.','menu-note'));
  }
  detail.append(element('p','Preview progress lasts for this play session only; local saves are the next milestone.','menu-note'));
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
  if(!window.GAME?.ready||window.V3_INTRO?.active||$('dialog').open||dialog.open)return;
  selected=window.GAME.state.player.id;section='Party';$('menu-message').textContent='';
  document.dispatchEvent(new Event('v4-menu-open'));render();dialog.showModal();tabs[0].focus();
 }
 function close(){if(dialog.open)dialog.close();}
 dialog.addEventListener('close',()=>{document.dispatchEvent(new Event('v4-menu-close'));$('game').focus({preventScroll:true});});
 $('open-menu').addEventListener('click',open);$('close-menu').addEventListener('click',close);
 window.addEventListener('keydown',event=>{
  if(event.ctrlKey||event.altKey||event.metaKey||event.repeat)return;
  if(event.code==='KeyM'||event.code==='Escape'){
   if(window.V3_INTRO?.active||$('dialog').open)return;
   event.preventDefault();if(dialog.open)close();else open();
  }
 },true);
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 window.V4_MENU={get active(){return dialog.open;},open,close};
})();
