param([switch]$Inspect)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Collections.Generic;
public static class VillageArt {
 public static Rectangle Bounds(Bitmap image, Rectangle cell) {
  int left=cell.Right,top=cell.Bottom,right=-1,bottom=-1;
  for(int y=cell.Top;y<cell.Bottom;y++)for(int x=cell.Left;x<cell.Right;x++){
   if(image.GetPixel(x,y).A<128)continue;
   left=Math.Min(left,x);top=Math.Min(top,y);right=Math.Max(right,x);bottom=Math.Max(bottom,y);
  }
  if(right<left)throw new Exception("Empty sprite cell: "+cell);
  return Rectangle.FromLTRB(left,top,right+1,bottom+1);
 }
 public static void Inspect(string path) {
  using(var image=new Bitmap(path)){
   var rows=new List<string>();int start=-1;
   for(int y=0;y<=image.Height;y++){
    int count=0;if(y<image.Height)for(int x=0;x<image.Width;x++)if(image.GetPixel(x,y).A>=128)count++;
    if(count>=10&&start<0)start=y;
    if(count<10&&start>=0){if(y-start>10)rows.Add(start+"-"+(y-1));start=-1;}
   }
   Console.WriteLine(System.IO.Path.GetFileName(path)+": "+String.Join(", ",rows));
  }
 }
 public static void Atlas(string source,string destination,int[,] cells,int frameWidth,int frameHeight,int rows,int maxWidth,int maxHeight) {
  using(var image=new Bitmap(source))using(var result=new Bitmap(frameWidth*4,frameHeight*rows,PixelFormat.Format32bppArgb)){
   var boxes=new Rectangle[cells.GetLength(0)];double scale=Double.MaxValue;
   for(int i=0;i<boxes.Length;i++){
    boxes[i]=Bounds(image,new Rectangle(cells[i,0],cells[i,1],cells[i,2],cells[i,3]));
    scale=Math.Min(scale,Math.Min((double)maxWidth/boxes[i].Width,(double)maxHeight/boxes[i].Height));
   }
   using(var g=Graphics.FromImage(result)){
    g.Clear(Color.Transparent);g.InterpolationMode=InterpolationMode.NearestNeighbor;g.PixelOffsetMode=PixelOffsetMode.Half;
    for(int i=0;i<boxes.Length;i++){
     int row=i/3,col=i%3,w=(int)Math.Round(boxes[i].Width*scale),h=(int)Math.Round(boxes[i].Height*scale);
     // Three supplied phases become [phase 0, phase 1, phase 2, phase 1].
     int target=col==2?2:col;
     g.DrawImage(image,new Rectangle(target*frameWidth+(frameWidth-w)/2,row*frameHeight+frameHeight-4-h,w,h),boxes[i],GraphicsUnit.Pixel);
     if(col==1)g.DrawImage(image,new Rectangle(3*frameWidth+(frameWidth-w)/2,row*frameHeight+frameHeight-4-h,w,h),boxes[i],GraphicsUnit.Pixel);
    }
   }
   result.Save(destination,ImageFormat.Png);
  }
 }
 public static void Portrait(string source,string destination) {
  using(var image=new Bitmap(source))using(var result=new Bitmap(128,128,PixelFormat.Format32bppArgb))using(var g=Graphics.FromImage(result)){
   g.Clear(Color.Transparent);g.InterpolationMode=InterpolationMode.NearestNeighbor;g.PixelOffsetMode=PixelOffsetMode.Half;
   g.DrawImage(image,0,0,128,128);result.Save(destination,ImageFormat.Png);
  }
 }
 public static void Scene(string source,string destination) {
  Map(source,destination,960,540);
 }
 public static void Map(string source,string destination,int width,int height) {
  using(var image=new Bitmap(source))using(var result=new Bitmap(width,height,PixelFormat.Format32bppArgb))using(var g=Graphics.FromImage(result)){
   g.InterpolationMode=InterpolationMode.NearestNeighbor;g.PixelOffsetMode=PixelOffsetMode.Half;
   g.DrawImage(image,0,0,width,height);result.Save(destination,ImageFormat.Png);
  }
 }
 static void Pixel(Graphics g,string color,int x,int y,int w,int h) {
  using(var brush=new SolidBrush(ColorTranslator.FromHtml(color)))g.FillRectangle(brush,x,y,w,h);
 }
 public static void Instruments(string destination) {
  using(var result=new Bitmap(256,64,PixelFormat.Format32bppArgb))using(var g=Graphics.FromImage(result)){
   g.Clear(Color.Transparent);
   for(int frame=0;frame<2;frame++){
    int x=frame*64;
    Pixel(g,"#172332",x+22,8,9,41);Pixel(g,"#ae794c",x+24,10,5,34);
    Pixel(g,"#172332",x+18,3,17,10);Pixel(g,"#d6ad69",x+20,5,13,6);
    Pixel(g,"#172332",x+13,33,27,23);Pixel(g,"#172332",x+17,29,19,31);
    string color=frame==0?"#b94549":"#3876a3";
    Pixel(g,color,x+15,36,23,17);Pixel(g,color,x+19,32,15,25);
    Pixel(g,frame==0?"#ec8570":"#79b9d0",x+17,37,6,14);
    Pixel(g,"#e8d9b0",x+26,32,9,16);Pixel(g,"#283748",x+22,37,11,3);
    Pixel(g,"#283748",x+22,44,11,3);Pixel(g,"#c9d2d5",x+22,52,11,2);
    for(int i=0;i<4;i++)Pixel(g,"#efdb9e",x+24+i,12,1,40);
    for(int i=0;i<5;i++)Pixel(g,"#514942",x+24,15+i*4,5,1);
    Pixel(g,"#f6e4b5",x+34,49,2,2);Pixel(g,"#f6e4b5",x+34,53,2,2);
    Pixel(g,"#9bc15f",x+24,19,2,2);Pixel(g,"#e6bd4d",x+26,23,2,2);
   }
   Pixel(g,"#172332",145,10,17,18);Pixel(g,"#829eaa",147,12,13,14);
   Pixel(g,"#e5edf1",149,13,9,2);Pixel(g,"#344654",149,17,9,2);
   Pixel(g,"#344654",149,21,9,2);Pixel(g,"#172332",150,27,7,28);
   Pixel(g,"#718991",152,29,3,23);Pixel(g,"#c5d5d9",151,34,5,3);
   Pixel(g,"#172332",207,12,5,41);Pixel(g,"#deb77c",208,13,3,39);
   Pixel(g,"#172332",229,8,5,45);Pixel(g,"#f0d3a1",230,9,3,43);
   result.Save(destination,ImageFormat.Png);
  }
 }
 public static void Icon(string source,string destination,Rectangle cell) {
  using(var image=new Bitmap(source))using(var result=new Bitmap(64,64,PixelFormat.Format32bppArgb))using(var g=Graphics.FromImage(result)){
   var box=Bounds(image,cell);double scale=Math.Min(56.0/box.Width,56.0/box.Height);
   int w=(int)Math.Round(box.Width*scale),h=(int)Math.Round(box.Height*scale);
   g.Clear(Color.Transparent);g.InterpolationMode=InterpolationMode.NearestNeighbor;g.PixelOffsetMode=PixelOffsetMode.Half;
   g.DrawImage(image,new Rectangle((64-w)/2,(64-h)/2,w,h),box,GraphicsUnit.Pixel);result.Save(destination,ImageFormat.Png);
  }
 }
}
'@
$root = Split-Path (Split-Path $PSScriptRoot)
$inbox = Join-Path $root 'art inbox'
if ($Inspect) {
 foreach ($name in @('Ari Sprites.png','Jeff Sprites.png','Chris Sprites.png','Jamie Sprites.png','Barney Sprites.png','Rosie Sprites.png')) {
  [VillageArt]::Inspect((Join-Path $inbox $name))
 }
 return
}
function Cells($rows) {
 $result=New-Object 'int[,]' ($rows.Count*3),4
 for($r=0;$r -lt $rows.Count;$r++){
  for($c=0;$c -lt 3;$c++){
   $i=$r*3+$c
   $result[$i,0]=$rows[$r][0]+$c*$rows[$r][2]
   $result[$i,1]=$rows[$r][1]
   $result[$i,2]=$rows[$r][2]
   $result[$i,3]=$rows[$r][3]
  }
 }
 return ,$result
}
$assets=Join-Path $root 'v4\assets'
foreach($folder in @('characters','companions','items','portraits','scenes','dinosaurs')){
 New-Item -ItemType Directory -Path (Join-Path $assets $folder) -Force | Out-Null
}
# Recipes use measured alpha row gaps and visually verified down/up/left/right poses.
$recipes=@{
 ari=@(@(145,0,145,131),@(145,250,145,122),@(145,370,145,124),@(145,131,145,119),
       @(145,494,145,122),@(145,725,145,126),@(145,851,145,124),@(145,616,145,109))
 jeff=@(@(20,20,106,195),@(20,215,106,200),@(382,215,106,200),@(382,20,106,195),
        @(20,415,106,199),@(20,615,106,195),@(382,615,106,195),@(382,415,106,199))
 chris=@(@(15,20,104,185),@(15,205,104,181),@(395,205,104,181),@(395,20,104,185),
         @(15,386,104,185),@(15,571,104,179),@(395,571,104,179),@(395,386,104,185))
 jaime=@(@(232,0,175,119),@(232,230,175,113),@(232,343,175,114),@(232,119,175,111),
         @(232,457,175,110),@(232,679,175,111),@(232,791,175,110),@(232,567,175,112))
}
$sources=@{ari='Ari Sprites.png';jeff='Jeff Sprites.png';chris='Chris Sprites.png';jaime='Jamie Sprites.png'}
foreach($id in $recipes.Keys){
 [VillageArt]::Atlas((Join-Path $inbox $sources[$id]),(Join-Path $assets "characters\$id.png"),(Cells $recipes[$id]),64,64,8,56,56)
}
foreach($id in @('barney','rosie')){
 if($id -eq 'barney'){
  $rows=@(@(133,0,170,145),@(35,288,210,120),@(35,408,210,127),@(133,145,170,143),
          @(133,535,170,150),@(35,831,210,131),@(35,962,210,120),@(133,685,170,146))
 }else{
  $rows=@(@(190,0,120,150),@(100,300,175,131),@(100,431,175,130),@(190,150,120,150),
          @(190,561,120,145),@(100,855,175,132),@(100,987,175,132),@(190,706,120,149))
 }
 [VillageArt]::Atlas((Join-Path $inbox ($id.Substring(0,1).ToUpper()+$id.Substring(1)+' Sprites.png')),(Join-Path $assets "companions\$id.png"),(Cells $rows),64,64,8,40,30)
}
foreach($id in @('ari','jeff','adam','kate','brie','vito','mark','stephanie')){
 $name=if($id -eq 'stephanie'){'Steph'}else{$id.Substring(0,1).ToUpper()+$id.Substring(1)}
 [VillageArt]::Portrait((Join-Path $inbox ($name+' Portrait.png')),(Join-Path $assets "portraits\$id.png"))
}
[VillageArt]::Scene((Join-Path $inbox 'Scene - Rockband Area.png'),(Join-Path $assets 'scenes\rockband.png'))
[VillageArt]::Map((Join-Path $inbox "Scene - Coco's Room.png"),(Join-Path $assets 'scenes\coco-room.png'),600,450)
[VillageArt]::Map((Join-Path $inbox "Scene - Connor's Room.png"),(Join-Path $assets 'scenes\connor-room.png'),600,450)
[VillageArt]::Map((Join-Path $inbox 'Scene - Dino House Upstairs Hallway.png'),(Join-Path $assets 'scenes\upstairs.png'),600,450)
[VillageArt]::Instruments((Join-Path $assets 'items\band-instruments.png'))
$dinoRows=@{
 trex=@(0,174,361,523,685,847,1008)
 raptor=@(0,203,407,567,750,924,1105)
 triceratops=@(0,209,412,589,763,934,1105)
 pterodactyl=@(0,250,490,730,960)
}
$dinoSources=@{trex='Trex sprites.png';raptor='Raptor Sprites.png';triceratops='Triceratops Sprites.png';pterodactyl='pterodactyl Sprites.png'}
foreach($id in $dinoRows.Keys){
 $bands=$dinoRows[$id];$rows=@()
 $order=if($id -eq 'pterodactyl'){@(0,2,3,1,0,2,3,1)}else{@(0,2,3,1,0,4,5,1)}
 foreach($r in $order){$height=$bands[$r+1]-$bands[$r];$rows+=,@(0,$bands[$r],241,$height)}
 [VillageArt]::Atlas((Join-Path $inbox $dinoSources[$id]),(Join-Path $assets "dinosaurs\$id.png"),(Cells $rows),128,128,8,104,84)
}
[VillageArt]::Icon((Join-Path $inbox 'Sword Sprite.png'),(Join-Path $assets 'items\sword.png'),[System.Drawing.Rectangle]::new(630,10,200,200))
[VillageArt]::Atlas((Join-Path $inbox 'Sword Action shots (I think).png'),(Join-Path $assets 'items\sword-slash.png'),(Cells (,@(0,0,418,160))),64,64,1,56,38)
[VillageArt]::Atlas((Join-Path $inbox 'Chris Sprites.png'),(Join-Path $assets 'characters\chris-swim.png'),(Cells @(@(0,1510,240,140),@(0,1650,240,169),@(0,1819,240,154),@(0,1973,240,179))),64,64,4,56,36)
Write-Output 'Processed V4 walking/idle atlases, swim poses, portraits, dogs and sword art. Originals unchanged.'
