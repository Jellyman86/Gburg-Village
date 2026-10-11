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
foreach($folder in @('characters','companions','items','portraits')){
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
foreach($id in @('ari','jeff')){
 [VillageArt]::Portrait((Join-Path $inbox ($id.Substring(0,1).ToUpper()+$id.Substring(1)+' Portrait.png')),(Join-Path $assets "portraits\$id.png"))
}
[VillageArt]::Icon((Join-Path $inbox 'Sword Sprite.png'),(Join-Path $assets 'items\sword.png'),[System.Drawing.Rectangle]::new(630,10,200,200))
[VillageArt]::Atlas((Join-Path $inbox 'Sword Action shots (I think).png'),(Join-Path $assets 'items\sword-slash.png'),(Cells (,@(0,0,418,160))),64,64,1,56,38)
[VillageArt]::Atlas((Join-Path $inbox 'Chris Sprites.png'),(Join-Path $assets 'characters\chris-swim.png'),(Cells @(@(0,1510,240,140),@(0,1650,240,169),@(0,1819,240,154),@(0,1973,240,179))),64,64,4,56,36)
Write-Output 'Processed V4 walking/idle atlases, swim poses, portraits, dogs and sword art. Originals unchanged.'
