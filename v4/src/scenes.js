// V3 scenes. Separate maps keep artwork detailed without a giant world texture.
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
 [['to-plaza','← Family meeting spot',435,630,'plaza',1415/1536*1000,780/1024*1000],['to-neighborhood','Main Street → Home',895,966,'neighborhood',120,870],['to-recreation','Walk to the courts & pool',535,966,'recreation',80,870]],
 'Follow Main Street along the bottom toward Home, or the courts and pool.'),
 neighborhood:make('neighborhood','Main Street · Home',1254,1254,
 [[85,705,72,280],[88,925,817,54],[837,682,67,293],[199,255,590,48],[196,265,82,360],[218,610,555,61],[729,266,66,405],[112,649,140,70],[772,647,96,80],[682,229,55,63]],
 [['to-district','← Main Street shops',120,870,'district',895,966],['to-house','Dinosaur house · Enter',713,276,'house',285,863],['to-recreation','Courts & pool →',865,880,'recreation',80,870]],
 'Follow the loop to the green dinosaur. Go at its front steps enters the house.'),
 recreation:make('recreation','Lakelands · Courts & Pool',1254,1254,
 [[48,125,61,848],[72,945,865,39],[888,570,42,405],[845,150,90,430],[105,125,775,44],[528,154,41,240],[207,344,657,43],[207,353,34,207],[230,515,578,45],[231,547,24,205],[405,545,30,208],[231,736,200,26],[614,543,26,44],[825,548,36,184],[224,905,660,69]],
 [['to-district','← Main Street shops',80,870,'district',535,966]],
 'Explore the paths beside the courts and pools. Main Street leads back to the shops.'),
 house:make('house','Home · Living floor',1448,1086,
 [[200,825,615,65],[198,548,88,330],[260,790,280,99],[505,524,58,328],[515,360,68,210],[510,291,130,90],[519,127,36,232],[215,330,303,35],[387,125,31,238],[162,299,257,61],[199,339,38,213],[540,826,420,49],[537,686,46,183]],
 [['to-neighborhood','Front door · Go outside',285,863,'neighborhood',713,276]],
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
 recreation.hint='Jeff and Ari play soccer left of the playground. Find Barney and Rosie on the northeast street; Main Street leads back to the shops.';
 SCENES.house.landmarks.push({id:'sword',name:'Japanese sword · Pick up',x:780,y:615,radius:42,pickup:'sword'});
 SCENES.house.hint='Explore the Dino house. A Japanese sword lies in the central hallway. Look nearby to pick it up; the front door leads outside.';
})();
