(() => {
 'use strict';
 const values={damageNumbers:true,busGag:true},key='gburg-v8-preferences';
 try{
  const saved=JSON.parse(localStorage.getItem(key)||'{}');
  if(!saved||typeof saved!=='object'||Array.isArray(saved))throw new Error('Invalid preferences document.');
  for(const name of Object.keys(values))if(name in saved){
   if(typeof saved[name]!=='boolean')throw new Error('Invalid preference: '+name);
   values[name]=saved[name];
  }
 }catch(error){console.warn('V6 preferences could not load; using session defaults.',error);}
 window.V6_SETTINGS={
  get values(){return {...values};},
  set(name,value){
   if(!(name in values)||typeof value!=='boolean')throw new Error('Invalid V6 preference.');
   values[name]=value;
   try{localStorage.setItem(key,JSON.stringify(values));return true;}
   catch(error){console.warn('V6 preferences are session-only; storage is unavailable.',error);return false;}
  }
 };
})();
