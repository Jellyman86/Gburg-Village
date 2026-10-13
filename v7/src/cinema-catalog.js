(() => {
 'use strict';
 const shot=(seconds,stage,scene,camera,speaker,text,extra={})=>({seconds,stage,scene,camera,speaker,text,...extra});
 const room=[300,225,1],kitchen=[455,235,1],field=[480,345,1],pool=[390,835,1];
 const catalog={
  awakening:[
   shot(3,'wake','cocoRoom',room,'coco','What was that strange rumble?',{cue:'rumble'}),
   shot(3,'peek','cocoRoom',room,'coco',"I'm going to peek to see if there's anything outside."),
   shot(3,'window','cocoRoom',[255,170,1],'coco','A DINOSAUR?!',{cue:'roar',shake:true}),
   shot(3,'alarm','cocoRoom',room,'coco','I NEED TO FIND CONNOR!')
  ],
  connor:[
   shot(3,'tablet','connorRoom',room,'coco',"CONNOR! THERE'S DINOSAURS!"),
   shot(3,'tablet','connorRoom',room,'connor',"That's not possible, Coco."),
   shot(3,'connor-roar','connorRoom',room,'connor',"...Okay. Let's get Dad.",{cue:'roar',shake:true}),
   shot(2,'connor-join','connorRoom',room,'connor',"I'm coming with you!")
  ],
  family:[
   shot(3,'family-approach','house',kitchen,'coco','Mom? Dad? Did you hear that?'),
   shot(3,'family','house',kitchen,'jason','Is that the TV? Somebody turn down the dinosaur channel.'),
   shot(3,'family','house',kitchen,'peachy','The internet is down. Of course it is.'),
   shot(3,'family-head','house',kitchen,'coco','Dad! Mom! LOOK OUTSIDE!',{cue:'rumble'}),
   shot(3,'coffee','house',kitchen,'peachy','AAAAH! Jason, your coffee!',{cue:'roar',cues:[[.25,'scream'],[.9,'splash']],shake:true}),
   shot(2,'family-join','house',kitchen,'jason',"Stay together. We're getting everyone to Market Square.")
  ],
  montage:[
   shot(4,'soccer-panic','recreation',field,'ari','THAT IS NOT THE GOALIE!',{cue:'roar'}),
   shot(4,'swim-panic','recreation',pool,'chris',"...I picked the wrong day to swim."),
   shot(4,'wrestle','district',[1615,1045,1],'vito',"Hang on... I've got a situation here.",{cue:'rumble'}),
   shot(2,'band-panic','rockband',[288,230,1],'mark','Power is out! That was NOT our drum solo.'),
   shot(2,'tennis-panic','recreation',[700,590,1],'kate',"Adam! That's not a tennis ball!"),
   shot(2,'street-panic','neighborhood',[480,800,1],'jaime','Phones are down too! Brie, stay off the road!'),
   shot(3,'shops-panic','district',[1600,770,1],'coco','No electricity. No internet. We have to find our friends ourselves.'),
   shot(3,'gather','plaza',[760,850,1],'coco',"We'll rescue everyone, then gather at Market Square. Nobody gets left behind!")
  ],
  gathering:[
   shot(3,'reunion','plaza',[760,870,1],'coco',"Everyone's here. All fourteen of us! You're safe now."),
   shot(3,'reunion','plaza',[760,870,1],'jason',"Five Guys is ready. Gary said he'd keep an eye on things."),
   shot(3,'reunion','plaza',[760,870,1],'coco','Wait. Where is Gary going?')
  ],
  'gary-talk':[
   shot(3,'gary-talk','hq',[200,350,1],'gary',"I've got supplies and water. You get the neighbors somewhere safe."),
   shot(3,'gary-talk','hq',[200,350,1],'gary',"I'll handle the big stuff when everyone's accounted for.")
  ],
  gary:window.V5_GARY_FINALE.shots,
  banquet:window.V5_BANQUET_FINALE.shots
 };
 const friends={
  jeff:{scene:'recreation',camera:field,stage:'soccer',line:'The dinosaur stole our ball. That is absolutely a red card.',reply:"Come with us, Jeff. We'll get everyone somewhere safe."},
  ari:{scene:'recreation',camera:field,stage:'soccer',line:"Next time, I'm checking the goalie for claws.",reply:"We need your footwork, Ari. Let's go!"},
  chris:{scene:'recreation',camera:pool,stage:'swim',line:'I was promised a quiet lap swim. Not flying reptiles.',reply:'Time to get out, Chris. We need you on dry land!'},
  jaime:{scene:'recreation',camera:[100,350,1],stage:'skate',line:'I can outrun them. Stopping is the tricky part!',reply:"Skate with us, Jaime. We'll watch the corners."},
  mark:{scene:'rockband',camera:[288,240,1],stage:'band',line:"No power, no Rock Band. Guess we're going acoustic.",reply:'Save the encore, Mark. Our friends need us.'},
  stephanie:{scene:'rockband',camera:[288,240,1],stage:'band',line:'I can scream louder than that dinosaur. Want a demonstration?',reply:"Let's save your voice for the rescue, Stephanie!"},
  adam:{scene:'neighborhood',camera:[330,780,1],stage:'tennis',x:330,y:780,line:"That thing ate the tennis ball. I'm calling a let.",reply:'Game postponed, Adam. Come help us find everyone.'},
  kate:{scene:'neighborhood',camera:[680,820,1],stage:'tennis',x:680,y:820,line:'I prefer doubles without a prehistoric opponent.',reply:"You're on our team now, Kate. Let's move!"},
  brie:{scene:'neighborhood',camera:[480,800,1],stage:'yoga',line:'Breathe in. Breathe out. Ignore the enormous dinosaur.',reply:"That's impressive, Brie. Can we do the next pose somewhere safer?"},
  vito:{scene:'district',camera:[1615,1045,1],stage:'throw',line:'Oh boy, that was a tough one.',reply:'Remind me not to arm-wrestle you, Vito. Come with us!'}
 };
 for(const [id,f] of Object.entries(friends)){
  catalog['recruit-'+id]=[
   shot(id==='vito'?5:3,f.stage,f.scene,f.camera,id,id==='vito'?'Just... one... more... heave!':f.line,{friend:id,cues:id==='vito'?[[3,'throw']]:[]}),
   shot(3,f.stage==='throw'?'throw-after':f.stage,f.scene,f.camera,id,id==='vito'?f.line:f.reply,{friend:id,interlocutor:id!=='vito'}),
   ...(id==='vito'?[shot(3,'throw-after',f.scene,f.camera,'coco',f.reply,{friend:id})]:[])
  ];
 }
 for(const [id,shots] of Object.entries(catalog)){
  catalog[id]=Object.freeze({shots:Object.freeze(shots.map(s=>Object.freeze(s))),duration:shots.reduce((n,s)=>n+s.seconds,0)});
 }
 window.V5_CINEMA_CATALOG={catalog:Object.freeze(catalog),friends};
})();
