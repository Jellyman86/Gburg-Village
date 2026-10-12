// Separate maps keep artwork detailed without a giant world texture.
(() => {
 const rects=(list,w,h)=>list.map(([x,y,rw,rh])=>({x:x*w/1000,y:y*h/1000,w:rw*w/1000,h:rh*h/1000}));
 const make=(id,name,w,h,paths,ports,hint)=>({id,name,width:w,height:h,image:`../v2/assets/${id}.webp`,bounds:{left:0,top:0,right:w,bottom:h},spawn:{x:w/2,y:h/2},obstacles:[],walkable:rects(paths,w,h),landmarks:ports.map(([id,name,x,y,to,tx,ty])=>({id,name,x:x*w/1000,y:y*h/1000,radius:55,to,arrival:[tx,ty]})),hint});
 const plaza=window.TOWN;plaza.id='plaza';plaza.hint='Go north to the roundabout, or east to Main Street. Use Go at a gold marker.';
 plaza.landmarks.push({id:'to-district',name:'Shops & Main Street →',x:1415,y:780,radius:58,to:'district',arrival:[435,630]});
 plaza.landmarks.push({id:'to-north',name:'North street · Market & roundabout ↑',x:620,y:300,radius:48,to:'north',arrival:[499,954]});
 window.SCENES={plaza,
 north:make('north','North Market · Meteor Roundabout',1536,1536,
 [[458,0,81,1000],[0,181,1000,70],[20,641,440,29],[534,650,84,34],[614,686,205,32],[610,659,39,64],[804,674,29,54]],
 [['to-plaza','↓ Starting town',499,954,'plaza',620/1536*1000,310/1024*1000]],
 'Head north to the meteor crater. Follow the road around it, or explore the café alley to the east.'),
 district:make('district','Shops & Main Street',3256,1086,
 [[20,246,620,75],[415,275,38,725],[25,615,450,65],[20,945,960,48],[625,0,25,375],[430,313,550,63],[950,305,35,665],[640,315,30,675],[430,665,540,65]],
 [['to-plaza','← Family meeting spot',435,630,'plaza',1415/1536*1000,780/1024*1000],['to-neighborhood','Main Street → Home',895,966,'neighborhood',120,870]],
 'Follow Main Street east toward Home, or west to Market Square.'),
 neighborhood:make('neighborhood','Main Street · Home',1254,1254,
 [[85,705,72,280],[88,925,817,54],[837,682,67,293],[199,255,590,48],[196,265,82,360],[218,610,555,61],[729,266,66,405],[112,649,140,70],[772,647,96,80],[682,229,55,63]],
 [['to-district','← Main Street shops',120,870,'district',895,966],['to-house','Dinosaur house · Enter',713,276,'house',120,900],['to-recreation','Courts & pool →',865,880,'recreation',895,880]],
 'Follow the loop to the green dinosaur. Go at its front steps enters the house.'),
 recreation:make('recreation','Lakelands · Courts & Pool',1254,1254,
 [[48,125,61,848],[72,945,865,39],[888,570,42,405],[845,150,90,430],[105,125,775,44],[528,154,41,240],[207,344,657,43],[207,353,34,207],[230,515,578,45],[231,547,24,205],[405,545,30,208],[231,736,200,26],[614,543,26,44],[825,548,36,184],[224,905,660,69]],
 [['to-neighborhood','↑ Main Street · Home',80,148,'neighborhood',865,890]],
 'Explore the courts, pool and playground. The top-left street returns to Home; reach shops through Home.'),
 house:make('house','Home · Living floor',1448,1086,
 [[200,825,615,65],[198,548,88,330],[260,790,280,99],[505,524,58,328],[515,360,68,210],[510,291,130,90],[519,127,36,232],[215,330,303,35],[387,125,31,238],[162,299,257,61],[199,339,38,213],[540,826,420,49],[537,686,46,183]],
 [['to-neighborhood','Front door · Go outside',120,940,'neighborhood',713,276]],
 'Home! Walk through the living floor. The front door returns to the neighborhood.')};
 const north=SCENES.north;
 north.image='../v3/assets/north-market.png';
 north.walkableEllipses=[{x:499/1000*1536,y:203/1000*1536,rx:168/1000*1536,ry:101/1000*1536}];
 north.blockedEllipses=[{x:499/1000*1536,y:203/1000*1536,rx:96/1000*1536,ry:67/1000*1536}];
 north.overlay={image:'../v3/assets/meteor-crater.png',x:587,y:200,w:360,h:205,source:[130,180,1300,670]};
 north.landmarks.push({id:'meteor',name:'The meteor crater',x:767,y:437,radius:55,text:'It landed right in the roundabout! Something prehistoric crawled out. Keep to the road around the broken island.'});
 const recreation=SCENES.recreation;
 recreation.walkable.push({x:320,y:280,w:310,h:125},{x:615,y:290,w:80,h:87});
 recreation.obstacles.push({x:409,y:414,w:44,h:25},{x:647,y:320,w:21,h:63});
 recreation.landmarks.push({id:'soccer',name:'Jeff & Ari · Soccer field',x:490,y:385,radius:65,text:'Jeff and Ari are passing a soccer ball on the lawn beside the playground. Open Party to play as either friend.'});
 recreation.landmarks.push({id:'dogs',name:'Barney & Rosie · Northeast street',x:1125,y:360,radius:80,text:'You found Barney and Rosie on the northeast street! They are sniffing around and happy to see you.'});
 recreation.hint='Jeff and Ari play soccer left of the playground. Find Barney and Rosie on the northeast street; the top-left street returns to Home.';
 const house=SCENES.house;
 house.width=724;house.height=543;house.indoor=true;house.bounds={left:0,top:0,right:724,bottom:543};
 house.walkable=house.walkable.map(o=>({x:o.x/2,y:o.y/2,w:o.w/2,h:o.h/2}));
 house.landmarks=house.landmarks.map(o=>({...o,x:o.x/2,y:o.y/2,radius:42}));
 house.walkable.push(...[
  [55,395,85,130],[42,190,70,235],[140,300,545,185],[375,140,255,77],
  [375,200,38,200],[140,168,240,30],[140,115,148,77]
 ].map(([x,y,w,h])=>({x,y,w,h})));
 house.obstacles=[{x:245,y:308,w:65,h:78},{x:475,y:346,w:68,h:45}];
 house.landmarks.push({id:'upstairs',name:'Upstairs · Bedrooms',x:90,y:420,radius:44,to:'upstairs',arrival:[495,900]});
 house.landmarks.push({id:'sword',name:'Japanese sword · Pick up',x:390,y:307.5,radius:42,pickup:'sword'});
 function interior(id,name,width,height,image,walkable,obstacles,landmarks,hint){
  SCENES[id]={id,name,width,height,image,bounds:{left:0,top:0,right:width,bottom:height},spawn:{x:width/2,y:height*.8},
   indoor:true,walkable:walkable.map(([x,y,w,h])=>({x,y,w,h})),obstacles:obstacles.map(([x,y,w,h])=>({x,y,w,h})),landmarks,hint};
 }
 interior('upstairs','Dino house · Upstairs',600,450,'../v4/assets/scenes/upstairs.png',[[211,195,189,157],[274,149,64,62],[240,340,114,110]],[],[
  {id:'coco-room',name:"Coco's room",x:382,y:233,radius:45,to:'cocoRoom',arrival:[210,880]},
  {id:'connor-room',name:"Connor's room · Next door",x:239,y:206,radius:45,to:'connorRoom',arrival:[180,810]},
  {id:'downstairs',name:'Downstairs · Living room',x:297,y:412,radius:44,to:'house',arrival:[152,810]}
 ],"Coco and Connor's rooms are next to each other. Stairs lead to the living floor.");
 interior('cocoRoom',"Dino house · Coco's room",600,450,'../v4/assets/scenes/coco-room.png',
  [[85,210,450,200],[165,140,130,80],[85,290,90,120]],[[340,150,180,165]],[
   {id:'hall',name:"Hallway · Connor is next door",x:126,y:396,radius:42,to:'upstairs',arrival:[620,555]}
  ],"Find Connor next door. Look at the gold door marker to enter the upstairs hallway.");
 interior('connorRoom',"Dino house · Connor's room",600,450,'../v4/assets/scenes/connor-room.png',
  [[85,220,465,190],[105,180,105,70]],[[220,165,165,145]],[
   {id:'hall',name:'Upstairs hallway',x:108,y:365,radius:42,to:'upstairs',arrival:[430,555]}
  ],'Talk to Connor, then head downstairs to find Peachy and Jason.');
 interior('rockband','Rock Band house · Mark & Stephanie',576,324,'../v4/assets/scenes/rockband.png',
  [[45,160,490,140],[80,135,370,35]],[[235,190,145,50]],[
   {id:'outside',name:'Outside · East of the pool',x:70,y:200,radius:42,to:'recreation',arrival:[945,670]}
  ],'Talk to Mark and Stephanie. The door leads to the street on the right side of the recreation map.');
 recreation.landmarks.push({id:'rockband-house',name:'Rock Band house · Enter →',x:1185,y:840,radius:48,to:'rockband',arrival:[180,650]});
 recreation.walkable.push({x:1140,y:780,w:70,h:140});
 recreation.walkable.push({x:280,y:650,w:45,h:90},{x:275,y:700,w:37,h:244},{x:1030,y:640,w:44,h:128});
 recreation.walkable.push({x:513,y:640,w:47,h:96},{x:290,y:696,w:745,h:44});
 recreation.landmarks.push({id:'pool-gate',name:'Pool gate · Open',x:533,y:690,radius:35,text:'The gate between the courts and pool is open! Walk down onto the deck. Chris is beside the lap pool; the water remains off limits.'});
 recreation.obstacles.push({x:315,y:744,w:86,h:175},{x:846,y:720,w:103,h:107},{x:557,y:754,w:391,h:76},{x:948,y:812,w:25,h:63},{x:573,y:852,w:118,h:54});
 recreation.hint+=' Rock Band is on the right/east street. Walk over a door diamond or click/tap it to travel.';
 SCENES.house.hint='Explore the Dino house. A Japanese sword lies in the central hallway. Look nearby to pick it up; the front door leads outside.';
 function road(scene,id,zones,arrival,arrivalDirection,position){
  const portal=SCENES[scene].landmarks.find(l=>l.id===id);
  Object.assign(portal,{roads:zones,arrival,arrivalDirection},position);
 }
 road('plaza','to-district',[{x:1395,y:700,w:40,h:96,direction:'right'}],[447,630],'right');
 road('plaza','to-north',[{x:584,y:280,w:79,h:32,direction:'up'}],[499,930],'up');
 road('north','to-plaza',[{x:703,y:1450,w:125,h:40,direction:'down'}],[620/1536*1000,335/1024*1000],'down');
 const district=SCENES.district;
 district.bounds.left=1400;
 district.viewBounds={...district.bounds};
 district.obstacles.push({x:2370,y:798,w:886,h:288});
 road('district','to-plaza',[{x:1408,y:267,w:32,h:811,direction:'left'}],[895,762],'left');
 road('district','to-neighborhood',[{x:2330,y:1020,w:40,h:58,direction:'right'}],[120,905],'up',{x:2350,y:1049});
 road('neighborhood','to-district',[{x:106,y:1180,w:91,h:35,direction:'down'}],[700,966],'left',{x:150,y:1195});
 recreation.walkable.push({x:60,y:75,w:77,h:125});
 road('neighborhood','to-recreation',[{x:1049,y:1180,w:85,h:35,direction:'down'}],[80,125],'down',{x:1085,y:1195});
 road('recreation','to-neighborhood',[{x:60,y:100,w:77,h:30,direction:'up'}],[865,890],'up',{x:100,y:115,name:'↑ Main Street · Home'});
 plaza.hint='Follow the gold road arrows north to the roundabout or east to Main Street. Crossing the road exit travels automatically; diamonds remain clickable.';
 district.hint='Go west to Market Square, or take the bottom-right road to Home Neighborhood. Courts & Pool is reached through Home. Follow gold road arrows; there is no need to hit a diamond.';
 SCENES.neighborhood.hint='The south-left road leads to Main Street shops; the south-right road leads to Courts & Pool. Follow the loop to the green dinosaur and its front-door diamond.';
 recreation.hint='The top-left/northwest road is the only outdoor exit: it returns to Home Neighborhood. Reach Main Street shops through Home. Rock Band is on the right/east street. The pool gate is open.';
})();
