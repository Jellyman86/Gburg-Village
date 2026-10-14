// Scene-pixel coordinates from the upper-left. Opaque scenery has collision.
window.TOWN={id:'kentlands',name:'Kentlands Market Square',width:1536,height:1024,
 image:V8_ART.url('scene.plaza'),bounds:{left:55,top:275,right:1475,bottom:984},spawn:{x:768,y:865},
 obstacles:[
 {x:0,y:0,w:584,h:261},{x:663,y:0,w:755,h:267},
 {x:278,y:395,w:260,h:345},{x:1003,y:396,w:252,h:347},
 {x:599,y:450,w:144,h:285},{x:794,y:450,w:146,h:285},
 {x:605,y:734,w:115,h:38},{x:817,y:734,w:110,h:38},
 {x:70,y:283,w:85,h:62},{x:205,y:284,w:67,h:64},{x:393,y:281,w:60,h:66},
 {x:786,y:280,w:69,h:69},{x:991,y:281,w:66,h:65},{x:1155,y:279,w:64,h:68},{x:1320,y:280,w:65,h:68},
 {x:1280,y:436,w:67,h:65},{x:1283,y:534,w:65,h:57},{x:1314,y:618,w:60,h:74},
 {x:137,y:421,w:78,h:78},{x:138,y:543,w:65,h:76},{x:208,y:554,w:67,h:89},
 {x:110,y:646,w:69,h:68},{x:30,y:793,w:130,h:139},{x:231,y:819,w:126,h:112},
 {x:1181,y:811,w:128,h:119},{x:1325,y:796,w:147,h:141},
 {x:170,y:918,w:218,h:57},{x:1155,y:916,w:214,h:61},
 {x:395,y:892,w:20,h:75},{x:439,y:940,w:35,h:37},{x:1071,y:941,w:34,h:35},{x:1121,y:891,w:19,h:78},
 {x:550,y:682,w:21,h:78},{x:962,y:682,w:20,h:78},{x:962,y:388,w:17,h:67},
 {x:530,y:207,w:17,h:59},{x:688,y:202,w:19,h:62},{x:481,y:737,w:23,h:33},{x:1020,y:738,w:25,h:34}
 ],
 landmarks:[
 {id:'plaza',name:'The family meeting spot',x:768,y:866,radius:60,text:'A little piece of your everyday walk, made into a world of its own. Choose a family member above and explore the square together.'},
 {id:'banquet',name:'Under the Lights · Celebrate',x:768,y:760,radius:56,event:'banquet'},
 {id:'vasilis',name:'Vasili’s Kitchen',x:433,y:770,radius:62,text:'The familiar navy awning, warm brick, and a table waiting after a walk. The storefront is a landmark in this first outdoor map; interiors can come next.'},
 {id:'fiveguys',name:'Five Guys',x:1167,y:767,radius:60,text:'A stop beside the green. The paths connect around the restaurants and up through the middle of the square.'},
 {id:'green',name:'The green & string lights',x:768,y:562,radius:55,text:'A quiet pocket of green between the shops, with chairs, flowers, and strings of lights. This narrow brick path leads back to Center Point Way.'},
 {id:'java',name:'Java Nation',x:304,y:274,radius:60,text:'Coffee on the corner, flowers along the sidewalk, and the rest of the afternoon ahead.'},
 {id:'market',name:'Market Square',x:906,y:280,radius:60,text:'The other side of Center Point Way. This map is a playful interpretation of your reference pictures, built for exploring with the family.'}
 ]};
