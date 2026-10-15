// Playable destinations: New York (4 zones), Paris (4 zones), Egypt, Italy, the Philippines and Japan.
// Same definition format as hawaii.js (see areas.js). Coordinates are artwork pixels; trace refinements live in
// data/scene-geometry.json (Gburg Studio), which overrides these first-pass shapes scene by scene.
((root)=>{
 'use strict';
 const W=1448,H=1086,ITALY={width:1536,height:1024};
 const arrival=(x,y,dims={width:W,height:H})=>[x/dims.width*1000,y/dims.height*1000];
 // Return to the world map: just south of the destination marker (matches Hawaii's 0.75-tile offset).
 const earth=(col,row)=>[(col+.5)*32/4096*1000,((row+.5)*32+40)/3072*1000];
 const portal=(id,name,x,y,to,tx,ty,direction,road,dims)=>({id,name,x,y,radius:42,to,
  arrival:to==='world'?[tx,ty]:arrival(tx,ty,dims),arrivalDirection:direction,roads:[road]});
 const rect=(x,y,w,h,direction)=>({x,y,w,h,direction});
 const zone=(def)=>({width:W,height:H,...def});

 const defs=[
  // ---- New York ------------------------------------------------------------------------------------------------
  zone({id:'nyc-central',name:'New York · Fountain Plaza',art:'scene.nyc-central',region:'New York',music:'nyc',worldSite:'nyc',spawn:{x:720,y:930},
   paths:[],
   polygons:[[[650,110],[790,110],[800,260],[900,300],[1010,340],[1100,400],[1300,470],[1420,500],[1420,610],[1330,670],[1180,660],[1100,720],[1060,800],[1040,960],[980,1030],[470,1030],[400,960],[390,820],[340,720],[330,665],[200,650],[40,630],[30,500],[100,430],[260,410],[420,350],[520,290],[640,260]]],
   obstacles:[],blockedPolygons:[[[590,520],[640,455],[760,440],[850,470],[870,540],[830,600],[720,615],[620,600]],[[560,680],[860,680],[860,830],[560,830]]],
   exits:[
    portal('nyc-earth','↓ Earth · Return to your jet',720,1015,'world',...earth(36,29),'down',rect(640,1002,160,22,'down')),
    portal('nyc-north','↑ North · Brooklyn Bridge Promenade',715,135,'nyc-north',723,950,'up',rect(650,112,140,22,'up')),
    portal('nyc-east','East · Park Pond →',1395,560,'nyc-east',150,540,'right',rect(1385,520,20,90,'right')),
    portal('nyc-west','← West · Broadway',55,520,'nyc-west',1330,570,'left',rect(30,470,20,110,'left'))
   ],
   points:[{id:'nyc-fountain',name:'Fountain · Central plaza',x:730,y:640,radius:50,text:'The fountain keeps splashing at night. The bridge lights glow to the north, the park lies east and Broadway is to the west. The south steps lead back to your jet.'}],
   enemies:[{kind:'compy',x:520,y:520},{kind:'compy',x:960,y:500}],
   hint:'North: waterfront and bridge. East: park pond. West: Broadway. South steps return to Earth. Fountain, hotel and benches are solid.'}),
  zone({id:'nyc-north',name:'New York · Brooklyn Bridge Promenade',art:'scene.nyc-north',region:'New York',music:'nyc',worldSite:'nyc',spawn:{x:723,y:950},
   paths:[],
   polygons:[[[30,570],[120,440],[330,400],[480,470],[560,590],[600,780],[470,760],[300,700],[130,660]],[[560,590],[620,545],[830,545],[900,590],[1020,590],[1020,770],[840,860],[830,1050],[600,1050],[600,860],[470,760]],[[1020,560],[1240,500],[1400,480],[1410,640],[1330,690],[1150,740],[1020,770]]],
   obstacles:[],blockedPolygons:[],
   exits:[portal('promenade-central','↓ Fountain Plaza',723,1020,'nyc-central',715,300,'down',rect(640,1015,170,22,'down'))],
   points:[{id:'nyc-bridge',name:'Brooklyn Bridge · Overlook',x:723,y:590,radius:50,text:'The bridge and skyline glitter across the water. The railings are solid; the stairs south return to Fountain Plaza.'}],
   enemies:[{kind:'compy',x:520,y:660},{kind:'compy',x:1000,y:640}],
   hint:'The south stairs return to Fountain Plaza. Stay on the promenade; the river is not walkable.'}),
  zone({id:'nyc-east',name:'New York · Park Pond',art:'scene.nyc-east',region:'New York',music:'nyc',worldSite:'nyc',spawn:{x:150,y:540},
   paths:[],
   polygons:[[[30,480],[220,420],[420,330],[590,330],[640,250],[800,250],[900,360],[1100,400],[1300,440],[1380,640],[1160,800],[960,920],[760,990],[560,880],[440,780],[240,700],[120,620],[30,600]]],
   obstacles:[],blockedPolygons:[[[700,560],[960,560],[1130,720],[1000,840],[760,720]]],
   exits:[portal('park-central','← Fountain Plaza',60,535,'nyc-central',1330,560,'left',rect(35,495,20,80,'left'))],
   points:[{id:'nyc-gazebo',name:'Park gazebo',x:1220,y:500,radius:48,text:'A quiet gazebo beside the pond, with the skyline glowing over the trees. Paths and bridges are walkable; the water is not.'}],
   enemies:[{kind:'compy',x:520,y:520},{kind:'dilophosaurus',x:1100,y:520}],
   hint:'The west crosswalk returns to Fountain Plaza. Follow the paths around the pond; water is solid.'}),
  zone({id:'nyc-west',name:'New York · Broadway',art:'scene.nyc-west',region:'New York',music:'nyc',worldSite:'nyc',spawn:{x:1330,y:570},
   paths:[],
   polygons:[[[60,420],[200,420],[420,330],[700,300],[1000,310],[1250,330],[1440,450],[1440,640],[1280,700],[1120,780],[960,940],[760,980],[560,940],[430,820],[240,700],[120,640]]],
   obstacles:[],blockedPolygons:[[[600,300],[760,300],[760,430],[600,430]],[[700,480],[780,480],[780,560],[700,560]]],
   exits:[portal('broadway-central','Fountain Plaza →',1405,570,'nyc-central',130,520,'right',rect(1390,525,20,90,'right'))],
   points:[{id:'nyc-broadway',name:'Broadway · Neon lights',x:700,y:640,radius:50,text:'Billboards, taxis and a statue in the middle of the square. Broadway never sleeps, even during a dinosaur invasion.'}],
   enemies:[{kind:'compy',x:520,y:640},{kind:'dilophosaurus',x:980,y:640}],
   hint:'The east crosswalk returns to Fountain Plaza. Taxis and the statue are solid; the sidewalks are walkable.'}),

  // ---- Paris ---------------------------------------------------------------------------------------------------
  zone({id:'paris-central',name:'Paris · Fountain Square',art:'scene.paris-central',region:'Paris',music:'paris',worldSite:'paris',spawn:{x:735,y:930},
   paths:[],
   polygons:[[[660,200],[800,200],[900,300],[1100,400],[1360,500],[1420,560],[1260,640],[1160,720],[1040,800],[1000,900],[1000,1050],[470,1050],[470,900],[420,800],[330,720],[200,640],[30,610],[30,500],[100,470],[400,400],[560,300]]],
   obstacles:[],blockedPolygons:[[[580,440],[730,400],[880,440],[890,560],[730,610],[590,560]]],
   exits:[
    portal('paris-earth','↓ Earth · Return to your jet',735,1025,'world',...earth(63,25),'down',rect(660,1015,160,22,'down')),
    portal('paris-north','↑ North · Eiffel Gardens',735,215,'paris-north',705,985,'up',rect(660,200,150,20,'up')),
    portal('paris-east','East · Seine Bridge →',1380,540,'paris-east',90,610,'right',rect(1370,500,20,90,'right')),
    portal('paris-west','← West · Arc de Triomphe',70,560,'paris-west',1310,560,'left',rect(40,515,22,90,'left'))
   ],
   points:[{id:'paris-fountain',name:'Fountain · Place centrale',x:735,y:640,radius:50,text:'Bonjour! The fountain sparkles under the lamps. North are the Eiffel gardens, east the Seine, west the Arc de Triomphe. The south gate returns to your jet.'}],
   enemies:[{kind:'compy',x:520,y:520},{kind:'compy',x:960,y:520}],
   hint:'North: Eiffel gardens. East: the Seine. West: Arc de Triomphe. South gate returns to Earth. The fountain is solid.'}),
  zone({id:'paris-north',name:'Paris · Eiffel Gardens',art:'scene.paris-north',region:'Paris',music:'paris',worldSite:'paris',spawn:{x:705,y:985},
   paths:[],
   polygons:[[[610,1055],[800,1055],[820,880],[900,830],[1180,720],[1300,560],[1160,520],[980,500],[800,380],[700,380],[600,500],[430,520],[290,560],[160,680],[400,830],[600,880]]],
   obstacles:[],blockedPolygons:[[[600,540],[820,540],[840,660],[580,660]]],
   exits:[portal('gardens-central','↓ Fountain Square',705,1030,'paris-central',735,290,'down',rect(610,1020,200,22,'down'))],
   points:[{id:'paris-eiffel',name:'Eiffel Tower · Gardens',x:705,y:440,radius:55,text:'The Eiffel Tower glows above the long gardens and fountains. The basins are solid; the stairs south return to Fountain Square.'}],
   enemies:[{kind:'compy',x:470,y:620},{kind:'dilophosaurus',x:960,y:640}],
   hint:'The south stairs return to Fountain Square. The fountain basins and hedges are solid.'}),
  zone({id:'paris-east',name:'Paris · Seine Bridge',art:'scene.paris-east',region:'Paris',music:'paris',worldSite:'paris',spawn:{x:90,y:610},
   paths:[],
   polygons:[[[30,640],[30,560],[130,500],[320,400],[520,330],[700,290],[760,220],[900,190],[1060,160],[1180,190],[1340,300],[1360,420],[1230,520],[1090,560],[950,550],[830,600],[760,590],[700,700],[600,780],[470,800],[330,740],[190,660]],[[830,590],[1010,640],[1170,680],[1290,700],[1370,720],[1370,830],[1230,860],[1050,900],[900,960],[760,1000],[710,930],[780,800],[820,690]]],
   obstacles:[],blockedPolygons:[],
   exits:[portal('seine-central','← Fountain Square',75,600,'paris-central',1330,540,'left',rect(40,560,22,80,'left'))],
   points:[{id:'paris-notre-dame',name:'Notre-Dame · Seine',x:1000,y:380,radius:50,text:'Notre-Dame rises beside the Seine. The river is not walkable; stay on the quay and the bridge.'}],
   enemies:[{kind:'compy',x:560,y:480},{kind:'dilophosaurus',x:1100,y:440}],
   hint:'The west quay returns to Fountain Square. The river is solid; use the bridge and quays.'}),
  zone({id:'paris-west',name:'Paris · Arc de Triomphe',art:'scene.paris-west',region:'Paris',music:'paris',worldSite:'paris',spawn:{x:1310,y:560},
   paths:[],
   polygons:[[[60,700],[130,590],[100,470],[160,380],[330,370],[380,520],[480,560],[560,430],[680,360],[800,320],[1000,340],[1250,360],[1420,470],[1440,560],[1380,680],[1240,720],[1100,780],[1020,860],[760,870],[620,880],[470,870],[320,820],[200,780]]],
   obstacles:[],blockedPolygons:[[[170,200],[460,200],[470,440],[330,470],[180,440]]],
   exits:[portal('arc-central','Fountain Square →',1415,560,'paris-central',130,540,'right',rect(1400,520,20,90,'right'))],
   points:[{id:'paris-arc',name:'Arc de Triomphe',x:520,y:580,radius:55,text:'The Arc de Triomphe stands over the roundabout. The monument is solid; the cafe streets lead back east to Fountain Square.'}],
   enemies:[{kind:'compy',x:720,y:640},{kind:'dilophosaurus',x:1000,y:640}],
   hint:'The east street returns to Fountain Square. The monument and fountains are solid.'}),

  // ---- Egypt -----------------------------------------------------------------------------------------------------
  zone({id:'egypt',name:'Egypt · Great Pyramid Court',art:'scene.egypt',region:'Egypt',music:'egypt',worldSite:'egypt',spawn:{x:724,y:960},
   paths:[],
   polygons:[[[690,95],[760,95],[770,420],[830,500],[900,610],[1040,640],[1080,700],[1100,880],[980,980],[830,1010],[790,1080],[650,1080],[620,1010],[470,980],[350,880],[370,700],[410,640],[560,610],[620,500],[690,420]]],
   obstacles:[],blockedPolygons:[[[370,700],[500,700],[500,820],[370,820]],[[900,700],[1080,700],[1080,820],[900,820]],[[500,470],[620,470],[620,590],[500,590]],[[830,470],[950,470],[950,590],[830,590]]],
   exits:[portal('egypt-earth','↓ Earth · Return to your jet',724,1060,'world',...earth(73,39),'down',rect(650,1050,150,20,'down'))],
   points:[{id:'egypt-pyramid',name:'Great Pyramid · Stairs',x:724,y:300,radius:55,text:'A long staircase climbs the pyramid between guardian statues. The pools and obelisks are solid; the south steps return to your jet.'}],
   enemies:[{kind:'compy',x:520,y:760},{kind:'dilophosaurus',x:880,y:900},{kind:'ankylosaurus',x:724,y:560}],
   hint:'Climb the pyramid stairs or explore the courts. Pools, statues and obelisks are solid. The south steps return to Earth.'}),

  // ---- Italy -----------------------------------------------------------------------------------------------------
  {id:'italy',name:'Italy · Piazza and Colosseum',art:'scene.italy',width:ITALY.width,height:ITALY.height,region:'Italy',music:'italy',worldSite:'italy',spawn:{x:717,y:960},
   paths:[],
   polygons:[[[690,1015],[750,1015],[760,760],[870,700],[1010,640],[1180,580],[1270,490],[1060,450],[900,500],[880,360],[800,280],[640,330],[560,430],[430,470],[260,480],[240,570],[430,600],[610,640],[690,740]]],
   obstacles:[],blockedPolygons:[[[740,410],[860,410],[860,520],[740,520]]],
   exits:[portal('italy-earth','↓ Earth · Return to your jet',722,1005,'world',...earth(67,31),'down',rect(690,995,70,20,'down'))],
   points:[{id:'italy-colosseum',name:'Colosseum · Roman Forum',x:650,y:340,radius:55,text:'The Colosseum looms above the old streets. Canals, bridges and rooftops are scenery; the road south returns to your jet.'}],
   enemies:[{kind:'compy',x:470,y:520},{kind:'dilophosaurus',x:1000,y:510}],
   hint:'Follow the stone roads and bridges. Water, rooftops and walls are solid. The south road returns to Earth.'},

  // ---- The Philippines ------------------------------------------------------------------------------------------
  zone({id:'philippines',name:'The Philippines · Plaza and Pier',art:'scene.philippines',region:'The Philippines',music:'philippines',worldSite:'philippines',spawn:{x:775,y:1000},
   paths:[],
   polygons:[[[640,200],[740,200],[760,360],[880,400],[1010,460],[1120,500],[1240,560],[1260,700],[1150,780],[1050,880],[900,940],[880,1075],[700,1075],[690,940],[500,890],[360,800],[260,720],[330,590],[460,520],[590,400]],[[640,200],[720,150],[840,200],[900,280],[870,390],[740,380],[650,330]]],
   obstacles:[],blockedPolygons:[[[640,570],[820,570],[820,690],[640,690]]],
   exits:[portal('philippines-earth','↓ Earth · Return to your jet',785,1040,'world',...earth(115,43),'down',rect(700,1032,170,22,'down'))],
   points:[{id:'philippines-plaza',name:'Plaza · Island fiesta',x:735,y:760,radius:55,text:'Fiesta flags, market stalls and a jeepney by the church. The lagoon is not walkable; the south steps return to your jet.'}],
   enemies:[{kind:'compy',x:480,y:640},{kind:'dilophosaurus',x:1020,y:640}],
   hint:'Explore the plaza, market and pier. Water, stalls and the fountain are solid. The south steps return to Earth.'}),

  // ---- Japan -----------------------------------------------------------------------------------------------------
  zone({id:'japan',name:'Japan · Cherry Blossom Plaza',art:'scene.japan',region:'Japan',music:'japan',worldSite:'japan',spawn:{x:780,y:940},
   paths:[],
   polygons:[
    [[760,185],[840,185],[845,330],[930,380],[1010,440],[1100,500],[1130,590],[1020,640],[1030,720],[960,770],[870,800],[845,900],[860,985],[820,1055],[640,1055],[600,985],[740,900],[735,800],[600,780],[560,700],[520,620],[560,480],[600,400],[700,330],[755,330]],
    [[88,362],[322,370],[483,480],[600,470],[600,520],[483,530],[306,485],[88,410]],
    [[95,715],[310,690],[480,700],[620,740],[620,790],[480,790],[310,760],[95,770]],
    [[1000,470],[1100,495],[1240,500],[1310,545],[1310,600],[1240,570],[1100,555],[1000,570]]],
   obstacles:[],blockedPolygons:[
    [[715,455],[830,455],[830,565],[715,565]],[[640,325],[745,325],[745,400],[640,400]],[[900,325],[1045,325],[1045,420],[900,420]],
    [[620,435],[712,435],[712,500],[620,500]],[[822,425],[960,425],[960,500],[822,500]],[[870,570],[1040,570],[1040,670],[870,670]],
    [[637,655],[695,655],[695,690],[637,690]],[[712,690],[741,690],[741,790],[712,790]],[[811,690],[838,690],[838,790],[811,790]],
    [[405,515],[608,515],[608,631],[405,631]],[[195,510],[305,510],[305,700],[195,700]],[[1300,470],[1420,470],[1420,590],[1300,590]]],
   exits:[portal('japan-earth','↓ Earth · Return to your jet',720,1045,'world',...earth(115,33),'down',rect(640,1035,170,20,'down'))],
   points:[{id:'japan-shrine',name:'Shrine · Cherry Blossom Plaza',x:790,y:235,radius:55,text:'Lanterns glow along the shrine steps while cherry petals drift across the plaza. The pagoda, tea houses and water are solid; the torii steps and beach lead back to your jet.'}],
   enemies:[{kind:'compy',x:650,y:730},{kind:'compy',x:920,y:720},{kind:'dilophosaurus',x:930,y:540}],
   hint:'Climb to the shrine, cross the harbor docks or the east bridge. Water, tea houses and the pagoda are solid. The south torii steps return to Earth.'})
 ];
 const hawaii=root.V8_HAWAII;
 root.V8_DESTINATIONS=Object.freeze({defs,all:hawaii?hawaii.defs.concat(defs):defs,width:W,height:H});
 if(typeof module!=='undefined'&&module.exports)module.exports=root.V8_DESTINATIONS;
})(typeof window==='undefined'?globalThis:window);
