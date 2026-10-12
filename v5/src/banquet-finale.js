(() => {
 'use strict';
 const cities=[['paris','Paris'],['egypt','Egypt'],['japan','Japan'],['russia','Russia'],['hawaii','Hawaii'],['new-york','New York']];
 const scenes=Object.fromEntries([['banquet','Kentlands Under the Lights'],...cities].map(([id,name])=>[id,{
  name,image:'assets/scenes/'+id+'.png',width:960,height:id==='banquet'?1440:1280,
  bounds:{left:0,top:0,right:960,bottom:id==='banquet'?1440:1280}
 }]));
 const shot=(seconds,stage,scene='banquet',speaker='coco',text='',extra={})=>({seconds,stage,scene,speaker,text,camera:[480,1100,1],music:'omen',...extra});
 const shots=[
  shot(12,'banquet-party','banquet','coco','',{music:'cafe'}),
  shot(5,'banquet-sky','banquet','coco','',{cue:'meteor',cues:[[2.1,'rumble']]}),
  shot(4,'banquet-radio','banquet','gary',"I'm picking up a lot of radio chatter...",{cue:'radio'}),
  ...cities.map(([id],i)=>shot(3.5,'banquet-city',id,'coco','',{city:i,cue:'meteor',cues:[[1.75,'impact'],[2.2,'rumble']]})),
  shot(4,'banquet-return','banquet','coco','I guess we are just getting started!'),
  shot(2,'banquet-fade')
 ];
 function position(index){
  if(index<10)return {x:(index%2?366:208)*5/3,y:(606+Math.floor(index/2)*50)*5/3};
  return {x:(154+(index-10)*60)*5/3,y:838*5/3};
 }
 function stage(s,t,api){
  if(s.stage==='banquet-city'){
   meteors(s,t,api);return;
  }
  const dancing=s.stage==='banquet-party',looking=s.stage==='banquet-sky'||s.stage==='banquet-radio';
  Object.keys(CHARACTERS).forEach((id,i)=>{
   const p=position(i),phase=t*2+i*.8;
   const reaction=looking&&!(id==='gary'&&s.stage==='banquet-radio')&&api.hasPose(id,'surprised');
   const dir=looking&&!reaction&&!(id==='gary'&&s.stage==='banquet-radio')?'up':
    dancing&&!api.reduced?['left','down','right','down'][Math.floor(t*1.3+i)%4]:'down';
   api.human(id,p.x+(dancing&&!api.reduced?Math.sin(phase)*12:0),p.y+(dancing&&!api.reduced?Math.cos(phase)*4:0),
    {dir,walk:dancing&&!api.reduced,pose:reaction?'surprised':'',lift:dancing&&!api.reduced?Math.abs(Math.sin(phase))*3:0});
  });
  if(s.stage==='banquet-sky'||s.stage==='banquet-radio')meteors(s,t,api);
 }
 function meteors(s,t,api){
  const city=s.city||0,scene=scenes[s.scene];
  for(let i=0;i<5;i++){
   const progress=api.reduced?.35:((t*.42+i*.21)%1);
   const x=scene.width*(.08+i*.15)+progress*240,y=scene.height*(.06+progress*.63);
   api.meteor(x,y,Math.floor(t*9+i+city)%6,100+i*10);
  }
 }
 function camera(s,width,height){
  if(s.stage==='banquet-sky'){
   const scene=scenes.banquet,scale=Math.min(width/scene.width,height/scene.height);
   return {scale,x:(scene.width-width/scale)/2,y:0};
  }
  if(s.stage!=='banquet-city')return null;
  const scene=scenes[s.scene],scale=Math.max(width/scene.width,height/scene.height),w=width/scale,h=height/scale;
  const focus=s.scene==='japan'?620:s.scene==='new-york'?565:480;
  return {scale,x:Math.max(0,Math.min(scene.width-w,focus-w/2)),y:Math.max(0,Math.min(scene.height-h,scene.height*.61-h*.55))};
 }
 function flash(s,t,reduced){
  if(reduced||s.stage!=='banquet-city')return 0;
  return t>=1.75&&t<1.9?.18*(1-(t-1.75)/.15):0;
 }
 function shake(s,t,reduced){
  return !reduced&&s.stage==='banquet-city'&&t>=1.75&&t<2.4?2*(1-(t-1.75)/.65):0;
 }
 window.V5_BANQUET_FINALE={scenes,shots,stage,camera,flash,shake,cityNames:cities.map(([,name])=>name),meteorSheet:'assets/effects/meteor.png'};
})();
