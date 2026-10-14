return async function checkMusic(page,{width,height,touch,artifactDir}={}){
 const assert=(v,m)=>{if(!v)throw new Error(m);},errors=[],failed=[];
 const onError=e=>errors.push(e.message),onConsole=m=>{if(m.type()==='error')errors.push(m.text());},onResponse=r=>{if(r.status()>=400)failed.push(r.url());};
 page.on('pageerror',onError);page.on('console',onConsole);page.on('response',onResponse);
 await page.addInitScript(()=>{
  window.__musicPlays=[];window.__synthStarts=0;
  const play=HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play=function(...args){__musicPlays.push((this.src||this.currentSrc||'').split('?')[0].split('/').pop());return play.apply(this,args);};
  const start=AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start=function(...args){if(this.buffer?.length>100)__synthStarts++;return start.apply(this,args);};
 });
 const activate=selector=>touch?page.locator(selector).tap():page.locator(selector).click();
 const music=()=>page.evaluate(()=>V8_MUSIC.state);
 const waitTrack=(track,mode)=>page.waitForFunction(([t,m])=>V8_MUSIC.state.playing&&V8_MUSIC.state.track===t&&(!m||V8_MUSIC.state.mode===m),[track,mode||null]);
 const screenshot=async name=>{if(artifactDir)await page.screenshot({path:artifactDir+'\\v8-'+name+'-'+width+'x'+height+'.png'});};
 try{
  await page.goto(page.url().split('/v8/')[0]+'/v8/',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{localStorage.removeItem('gburg-v8-music');localStorage.setItem('village-music','on');});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>GAME.ready&&V3_INTRO.state.ready);await activate('#intro-skip');
  // Coco starts in her room: village place, Coco's shipped theme.
  await waitTrack('golden','village');
  const data=await page.evaluate(()=>V8_MUSIC_DATA);
  assert(Object.keys(data.tracks).length>=10&&data.characters.coco==='golden'&&data.places.jet[0]==='avicii-levels','Shipped music data is loaded');
  // Switching heroes switches themes; a hero without a theme falls back to the place playlist (synth village).
  await page.evaluate(()=>{for(const id of ['connor','kate'])V4_RPG.members[id].joined=true;});
  assert(await page.evaluate(()=>GAME.select('connor')),'Connor selected');await waitTrack('seven-nation-army','village');
  assert(await page.evaluate(()=>GAME.select('kate')),'Kate selected');await waitTrack('synth:village','village');
  assert(await page.evaluate(()=>__synthStarts>=1&&V8_MUSIC.state.reason==='place'),'Original village theme plays for a hero without a theme');
  assert(await page.evaluate(()=>GAME.select('coco')),'Coco again');await waitTrack('golden','village');
  // Options tab: now playing, toggles, volume, selects.
  await activate('#open-menu');await page.waitForFunction(()=>document.getElementById('rpg-menu').open);
  await activate('#tab-options');
  await page.waitForFunction(()=>document.getElementById('music-now-playing')?.textContent.includes('Golden'));
  assert(await page.evaluate(()=>document.querySelectorAll('#menu-detail select[data-place]').length===V8_MUSIC.places.length&&document.querySelectorAll('#menu-detail select[data-character]').length>=3),'Place and character selectors render');
  await screenshot('options-music');
  await activate('#option-character-music');await page.waitForFunction(()=>!V8_MUSIC.state.characterMusic);
  await waitTrack('synth:village','village');
  assert(await page.evaluate(()=>document.getElementById('music-now-playing').textContent.includes('Village theme')),'Now playing follows the change');
  await activate('#option-character-music');await waitTrack('golden','village');
  await page.locator('#menu-detail select[data-place="village"]').selectOption('uptown-girl');await waitTrack('uptown-girl','village');
  assert((await music()).reason==='pick','Picked place track wins over the character theme');
  await page.locator('#menu-detail select[data-place="village"]').selectOption('character');await waitTrack('golden','village');
  await page.locator('#menu-detail select[data-character="coco"]').selectOption('roses');await waitTrack('roses','village');
  await page.locator('#menu-detail select[data-character="coco"]').selectOption('__default');await waitTrack('golden','village');
  await page.evaluate(()=>{const v=document.getElementById('option-music-volume');v.value='30';v.dispatchEvent(new Event('input',{bubbles:true}));});
  assert(await page.evaluate(()=>Math.abs(V8_MUSIC.state.volume-.3)<.001&&Math.abs(V8_MUSIC.element.volume-.3)<.001),'Volume slider drives the audio element');
  await activate('#option-music');await page.waitForFunction(()=>!V8_MUSIC.state.enabled&&!V8_MUSIC.state.playing);
  assert(await page.evaluate(()=>document.getElementById('music-toggle').textContent.includes('Off')),'Stage toggle mirrors the menu');
  await activate('#option-music');await waitTrack('golden','village');
  await activate('#close-menu');await page.waitForFunction(()=>!document.getElementById('rpg-menu').open);
  // Preferences persist across reloads; the rest of the menu is unaffected.
  assert(await page.evaluate(()=>__musicPlays.filter(Boolean).length>=5&&new Set(__musicPlays).size>=4),'Several distinct real files were played');
  await page.evaluate(()=>V8_MUSIC.setPlacePick('village','cliche'));await waitTrack('cliche','village');
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>GAME.ready&&V3_INTRO.state.ready);await activate('#intro-skip');
  await waitTrack('cliche','village');
  assert(await page.evaluate(()=>Math.abs(V8_MUSIC.state.volume-.3)<.001),'Volume persisted');
  await page.evaluate(()=>{V8_MUSIC.setPlacePick('village',undefined);V8_MUSIC.setVolume(.7);});await waitTrack('golden','village');
  assert(errors.length===0,'Unexpected page errors: '+errors.join('; '));assert(failed.length===0,'Failed assets: '+failed.join('; '));
  return {layout:width+'x'+height,touch:!!touch,pass:'Shipped music data, hero themes on switch, original-theme fallback, Options tab toggles/volume/place and character pickers, stage toggle mirror, persistence'};
 }catch(error){
  console.error(await page.evaluate(()=>({music:V8_MUSIC?.state,plays:__musicPlays,menu:document.getElementById('rpg-menu')?.open})).catch(()=>'n/a'));
  throw error;
 }finally{page.off('pageerror',onError);page.off('console',onConsole);page.off('response',onResponse);}
};
