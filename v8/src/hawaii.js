((root)=>{
 'use strict';
 const width=1448,height=1086,arrival=(x,y)=>[x/width*1000,y/height*1000];
 const portal=(id,name,x,y,to,tx,ty,direction,road)=>({id,name,x,y,radius:42,to,
  arrival:to==='world'?[tx,ty]:arrival(tx,ty),arrivalDirection:direction,roads:[road]});
 const rect=(x,y,w,h,direction)=>({x,y,w,h,direction});
 const defs=[
  {id:'hawaii-central',name:'Hawaii · Fountain Plaza',art:'scene.hawaii-central',width,height,
   region:'Hawaii',music:'hawaii',worldSite:'hawaii',spawn:{x:725,y:960},
   paths:[[560,910,330,120],[590,815,275,130],[515,660,80,245],[850,660,85,250],
    [455,585,100,125],[910,585,110,125],[70,470,370,145],[1030,475,235,150],[650,40,145,260]],
   polygons:[[[320,455],[445,325],[620,255],[650,175],[800,175],[835,260],[1000,335],[1120,460],[1100,620],[960,660],[910,600],[540,600],[460,660],[330,620]]],
   obstacles:[[600,405,275,180],[422,318,110,62],[912,318,105,62]],
   blockedPolygons:[[[520,640],[720,578],[930,640],[885,740],[575,740]]],
   exits:[
    portal('hawaii-earth','↓ Earth · Return to your jet',725,995,'world',8.5*32/4096*1000,43.25*32/3072*1000,'down',rect(620,1000,210,20,'down')),
    portal('hawaii-north','↑ North · Scenic Overlook',725,80,'hawaii-north',725,970,'up',rect(665,55,115,20,'up')),
    portal('hawaii-west','← West · Tropical Market',110,540,'hawaii-west',1350,540,'left',rect(85,490,20,100,'left')),
    portal('hawaii-east','East · Waikiki Beach →',1200,545,'hawaii-east',140,520,'right',rect(1205,490,20,110,'right'))
   ],
   points:[{id:'hawaii-fountain',name:'Aloha · Fountain Plaza',x:720,y:340,radius:50,text:'Aloha! The south entrance returns to Earth and your parked jet. Explore the overlook to the north, beach to the east, and market to the west.'}],
   enemies:[{kind:'compy',x:430,y:500},{kind:'compy',x:985,y:515}],
   hint:'South returns to Earth. North: overlook. East: beach. West: market. Walk around the fountain and pavilion; water and planted beds are solid.'},
  {id:'hawaii-west',name:'Hawaii · Tropical Market',art:'scene.hawaii-west',width,height,
   region:'Hawaii',music:'hawaii',worldSite:'hawaii',spawn:{x:1350,y:540},
   paths:[[1250,495,170,110],[600,50,160,260],[540,925,200,120]],
   polygons:[
    [[1290,495],[1190,465],[1050,440],[920,405],[840,350],[785,270],[770,220],[635,220],[660,335],[600,390],[535,450],[590,530],[770,580],[865,515],[990,520],[1120,570],[1280,600]],
    [[535,410],[475,390],[410,425],[330,435],[275,395],[225,395],[250,485],[315,520],[380,590],[465,650],[520,740],[545,820],[540,940],[735,940],[800,860],[830,760],[795,675],[850,570],[770,520],[650,560],[580,490]],
    [[520,560],[545,635],[640,645],[700,680],[745,775],[780,700],[810,620],[740,575],[650,555]]
   ],
   obstacles:[[660,465,155,80],[415,435,100,65],[725,860,120,70]],
   exits:[portal('market-central','Fountain Plaza →',1370,545,'hawaii-central',150,540,'right',rect(1380,505,20,75,'right'))],
   points:[
    {id:'hawaii-market',name:'Surf shops · Tropical Market',x:610,y:405,radius:45,text:'Bright storefronts, surfboards, and dinosaur-sized window shopping. The shops are scenery for this first Hawaii visit; their interiors are not open yet.'},
    {id:'market-south',name:'Market steps · Ocean breeze',x:640,y:970,radius:45,text:'Take a breath and enjoy the view. This is a scenic end of the market, not another exit.'}
   ],
   enemies:[{kind:'compy',x:1020,y:495},{kind:'dilophosaurus',x:485,y:635},{kind:'compy',x:660,y:735}],
   hint:'The east bridge returns to Fountain Plaza. Explore the shop paths and southern steps; buildings, water and planted beds block movement.'},
  {id:'hawaii-east',name:'Hawaii · Waikiki Beach',art:'scene.hawaii-east',width,height,
   region:'Hawaii',music:'hawaii',worldSite:'hawaii',spawn:{x:140,y:520},
   paths:[[75,475,290,90],[575,300,200,95]],
   polygons:[
    [[325,470],[390,420],[480,365],[595,320],[725,300],[865,325],[925,360],[1000,370],[1035,420],[990,490],[895,550],[800,580],[730,665],[625,750],[525,835],[450,815],[395,735],[385,635],[330,565]],
    [[680,335],[700,275],[655,225],[600,225],[550,260],[580,330]],
    [[575,685],[675,660],[825,570],[915,530],[950,565],[820,650],[750,740],[625,800],[540,845],[510,800]]
   ],
   obstacles:[[745,295,130,60],[855,370,105,70],[740,395,112,78],[565,485,120,90],[445,650,130,90],[565,635,105,75]],
   exits:[portal('beach-central','← Fountain Plaza',110,520,'hawaii-central',1160,545,'left',rect(90,490,20,60,'left'))],
   points:[{id:'hawaii-beach',name:'Waikiki · Beach lookout',x:875,y:510,radius:45,text:'Turquoise water, distant Diamond Head, and a few prehistoric beach guests. The skyline is a view, not a walking route; stay on the sand.'}],
   enemies:[{kind:'compy',x:405,y:530},{kind:'compy',x:840,y:550}],
   hint:'The west boardwalk returns to Fountain Plaza. Walk the beach paths between the loungers. Ocean, rocky shoreline and distant skyline are not walkable.'},
  {id:'hawaii-north',name:'Hawaii · Scenic Overlook',art:'scene.hawaii-north',width,height,
   region:'Hawaii',music:'hawaii',worldSite:'hawaii',spawn:{x:725,y:970},
   paths:[[645,880,150,170]],
   polygons:[
    [[620,900],[620,830],[625,735],[690,660],[760,605],[830,530],[850,470],[815,400],[760,390],[705,340],[600,300],[545,265],[525,250],[560,205],[630,180],[745,175],[780,210],[780,265],[710,290],[745,320],[845,350],[870,385],[905,460],[925,525],[890,600],[810,665],[735,725],[700,785],[725,825],[805,880],[800,930]],
    [[740,635],[800,555],[875,520],[975,535],[1070,545],[1160,595],[1190,655],[1075,650],[1020,630],[925,605],[855,640],[815,700]]
   ],
   obstacles:[[675,230,85,40],[535,215,85,43],[1140,565,65,60]],
   exits:[portal('overlook-central','↓ Fountain Plaza',725,1010,'hawaii-central',725,125,'down',rect(670,1015,105,20,'down'))],
   points:[
    {id:'hawaii-overlook',name:'Diamond Head · Scenic Overlook',x:655,y:210,radius:48,text:'A beautiful view over Waikiki and Diamond Head. The winding path and stairs are walkable; railings, cliffs and waterfalls are not.'},
    {id:'overlook-bench',name:'Ocean-view rest stop',x:1075,y:605,radius:42,text:'A quiet lookout. Even the dinosaurs seem to appreciate the ocean breeze.'}
   ],
   enemies:[{kind:'compy',x:700,y:750},{kind:'compy',x:950,y:575}],
   hint:'Follow the winding stairs to the overlook. South returns to Fountain Plaza. Stay inside the railings; cliff faces and waterfalls are solid.'}
 ];
 root.V8_HAWAII=Object.freeze({defs,width,height});
 if(typeof module!=='undefined'&&module.exports)module.exports=root.V8_HAWAII;
})(typeof window==='undefined'?globalThis:window);
