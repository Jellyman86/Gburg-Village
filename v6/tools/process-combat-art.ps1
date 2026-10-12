param([switch]$ValidateOnly,[switch]$Rebuild)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
public static class CombatArt {
 static Bitmap Read(string file){
  var image=new Bitmap(file);
  for(int y=0;y<image.Height;y++)for(int x=0;x<image.Width;x++){
   var c=image.GetPixel(x,y);image.SetPixel(x,y,c.A<210?Color.Transparent:Color.FromArgb(255,c.R,c.G,c.B));
  }
  return image;
 }
 static Rectangle Bounds(Bitmap image,Rectangle cell){
  int l=cell.Right,t=cell.Bottom,r=-1,b=-1;
  for(int y=cell.Top;y<cell.Bottom;y++)for(int x=cell.Left;x<cell.Right;x++){
   if(image.GetPixel(x,y).A==0)continue;l=Math.Min(l,x);t=Math.Min(t,y);r=Math.Max(r,x);b=Math.Max(b,y);
  }
  if(r<l)throw new Exception("Empty art crop: "+cell);
  return Rectangle.FromLTRB(l,t,r+1,b+1);
 }
 static Graphics Painter(Bitmap output){
  var g=Graphics.FromImage(output);g.Clear(Color.Transparent);g.InterpolationMode=InterpolationMode.NearestNeighbor;
  g.PixelOffsetMode=PixelOffsetMode.Half;g.CompositingMode=CompositingMode.SourceCopy;return g;
 }
 public static void Atlas(string source,string destination,int[,] cells,int fw,int fh,int cols,int maxW,int maxH){
  using(var image=Read(source))using(var output=new Bitmap(fw*cols,fh*(cells.GetLength(0)/cols),PixelFormat.Format32bppArgb))using(var g=Painter(output)){
   var boxes=new Rectangle[cells.GetLength(0)];double scale=Double.MaxValue;
   for(int i=0;i<boxes.Length;i++){boxes[i]=Bounds(image,new Rectangle(cells[i,0],cells[i,1],cells[i,2],cells[i,3]));scale=Math.Min(scale,Math.Min((double)maxW/boxes[i].Width,(double)maxH/boxes[i].Height));}
   for(int i=0;i<boxes.Length;i++){int w=(int)Math.Round(boxes[i].Width*scale),h=(int)Math.Round(boxes[i].Height*scale);
    g.DrawImage(image,new Rectangle(i%cols*fw+(fw-w)/2,i/cols*fh+fh-4-h,w,h),boxes[i],GraphicsUnit.Pixel);
   }output.Save(destination,ImageFormat.Png);
  }
 }
 public static void Towel(string source,string destination){
  int[,] cells={{80,60,360,380,175,335},{460,60,435,390,650,340},{900,60,430,390,1060,340},{1335,60,439,400,1470,340},
   {15,475,485,370,135,735},{505,475,400,375,650,735},{925,475,400,375,1040,720},{1355,475,419,375,1475,715}};
  using(var image=Read(source))using(var output=new Bitmap(768,64,PixelFormat.Format32bppArgb))using(var g=Painter(output)){
   for(int i=0;i<8;i++){
    var box=new Rectangle(cells[i,0],cells[i,1],cells[i,2],cells[i,3]);
    var dest=new RectangleF(i*96+12+(box.Left-cells[i,4])*.14f,40+(box.Top-cells[i,5])*.14f,box.Width*.14f,box.Height*.14f);
    g.SetClip(new Rectangle(i*96,0,96,64));g.DrawImage(image,dest,box,GraphicsUnit.Pixel);g.ResetClip();
   }output.Save(destination,ImageFormat.Png);
  }
 }
 public static void Validate(string file,int fw,int fh,int cols,int rows){
  using(var image=new Bitmap(file)){
   if(image.Width!=fw*cols||image.Height!=fh*rows)throw new Exception("Bad atlas size: "+file);
   if(image.GetPixel(0,0).A!=0)throw new Exception("Missing transparent padding: "+file);
   for(int r=0;r<rows;r++)for(int c=0;c<cols;c++)Bounds(image,new Rectangle(c*fw,r*fh,fw,fh));
   Console.WriteLine(System.IO.Path.GetFileName(file)+" "+image.Width+"x"+image.Height+" transparent, "+cols*rows+" nonempty frames");
  }
 }
}
'@
$root=Split-Path (Split-Path $PSScriptRoot)
$inbox=Join-Path $root 'art inbox';$assets=Join-Path $root 'v6\assets'
$sources=@('Compy Sprites.png','Towel Whip Sprites.png','Hamburger Sprite.png','Concept art for cutscenes\Dinosaur-Infested School Bus Sprite Sheet.png')
$hashes=@{};foreach($name in $sources){$hashes[$name]=(Get-FileHash -LiteralPath (Join-Path $inbox $name)).Hash}
foreach($folder in @('dinosaurs','items','gimmicks')){if(!$ValidateOnly){New-Item -ItemType Directory -Path (Join-Path $assets $folder) -Force | Out-Null}}
$compy=Join-Path $assets 'dinosaurs\compy.png';$towel=Join-Path $assets 'items\towel-whip.png'
$burger=Join-Path $assets 'items\hamburger.png';$bus=Join-Path $assets 'gimmicks\bus.png'
if(!$ValidateOnly){
 if($Rebuild -or !(Test-Path $compy)){
  $bands=@(0,295,550,790,1030,1270,1536);$cells=New-Object 'int[,]' 24,4
  for($r=0;$r -lt 6;$r++){for($c=0;$c -lt 4;$c++){$i=$r*4+$c;$cells[$i,0]=$c*256;$cells[$i,1]=$bands[$r];$cells[$i,2]=256;$cells[$i,3]=$bands[$r+1]-$bands[$r]}}
  [CombatArt]::Atlas((Join-Path $inbox $sources[0]),$compy,$cells,64,64,4,58,48)
 }
 if($Rebuild -or !(Test-Path $towel)){[CombatArt]::Towel((Join-Path $inbox $sources[1]),$towel)}
 if($Rebuild -or !(Test-Path $burger)){
  $cells=New-Object 'int[,]' 1,4;$cells[0,0]=0;$cells[0,1]=0;$cells[0,2]=418;$cells[0,3]=627
  [CombatArt]::Atlas((Join-Path $inbox $sources[2]),$burger,$cells,64,64,1,56,56)
 }
 if($Rebuild -or !(Test-Path $bus)){
  $cells=New-Object 'int[,]' 5,4
  for($i=0;$i -lt 5;$i++){
   $left=[int][Math]::Floor($i*354.8)
   $cells[$i,0]=$left;$cells[$i,1]=552;$cells[$i,2]=[Math]::Min(355,(1774-$left));$cells[$i,3]=170
  }
  [CombatArt]::Atlas((Join-Path $inbox $sources[3]),$bus,$cells,256,128,5,244,110)
 }
}
[CombatArt]::Validate($compy,64,64,4,6);[CombatArt]::Validate($towel,96,64,8,1)
[CombatArt]::Validate($burger,64,64,1,1);[CombatArt]::Validate($bus,256,128,5,1)
foreach($name in $sources){if((Get-FileHash -LiteralPath (Join-Path $inbox $name)).Hash -ne $hashes[$name]){throw "Original changed during processing: $name"}}
Write-Output 'Source hashes unchanged. Existing processed art is preserved unless -Rebuild is explicit.'
