param([switch]$ValidateOnly,[switch]$Rebuild)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Collections.Generic;
public static class WorldArt {
 static Graphics Paint(Bitmap b) {
  var g=Graphics.FromImage(b);g.Clear(Color.Transparent);
  g.InterpolationMode=InterpolationMode.NearestNeighbor;g.PixelOffsetMode=PixelOffsetMode.Half;
  g.CompositingMode=CompositingMode.SourceCopy;return g;
 }
 public static void Crop(string source,string output,int x,int y,int w,int h,int width,int height) {
  using(var b=new Bitmap(source))using(var result=new Bitmap(width,height))using(var g=Paint(result)){
   g.DrawImage(b,new Rectangle(0,0,width,height),new Rectangle(x,y,w,h),GraphicsUnit.Pixel);
   result.Save(output,ImageFormat.Png);
  }
 }
 static bool Checker(Color c){return Math.Max(c.R,Math.Max(c.G,c.B))-Math.Min(c.R,Math.Min(c.G,c.B))<22&&c.R>150;}
 static void ClearOutside(Bitmap b){
  int w=b.Width,h=b.Height;var seen=new bool[w*h];var queue=new Queue<int>();
  Action<int> add=i=>{if(!seen[i]&&(b.GetPixel(i%w,i/w).A<210||Checker(b.GetPixel(i%w,i/w)))){seen[i]=true;queue.Enqueue(i);}};
  for(int x=0;x<w;x++){add(x);add((h-1)*w+x);}for(int y=0;y<h;y++){add(y*w);add(y*w+w-1);}
  while(queue.Count>0){int i=queue.Dequeue(),x=i%w,y=i/w;b.SetPixel(x,y,Color.Transparent);
   if(x>0)add(i-1);if(x<w-1)add(i+1);if(y>0)add(i-w);if(y<h-1)add(i+w);
  }
 }
 public static void Plane(string source,string output){
  using(var b=new Bitmap(source))using(var result=new Bitmap(512,256))using(var g=Paint(result)){
   for(int row=0;row<2;row++)for(int col=0;col<4;col++){
    var region=new Rectangle(128+col*253,row==0?55:235,267,row==0?150:175);
    using(var pose=b.Clone(region,PixelFormat.Format32bppArgb)){
     ClearOutside(pose);int l=pose.Width,t=pose.Height,r=-1,bot=-1;
     for(int y=0;y<pose.Height;y++)for(int x=0;x<pose.Width;x++)if(pose.GetPixel(x,y).A>0){l=Math.Min(l,x);t=Math.Min(t,y);r=Math.Max(r,x);bot=Math.Max(bot,y);}
     if(r<l)throw new Exception("Empty plane pose");
     double scale=Math.Min(108.0/(r-l+1),84.0/(bot-t+1));int dw=(int)Math.Round((r-l+1)*scale),dh=(int)Math.Round((bot-t+1)*scale);
     g.DrawImage(pose,new Rectangle(col*128+(128-dw)/2,row*128+(128-dh)/2,dw,dh),Rectangle.FromLTRB(l,t,r+1,bot+1),GraphicsUnit.Pixel);
    }
   }result.Save(output,ImageFormat.Png);
  }
 }
 public static void Atlas(string source,string output,int[] crops,int cellW,int cellH,int cols){
  int count=crops.Length/4;
  using(var b=new Bitmap(source))using(var result=new Bitmap(cols*cellW,((count+cols-1)/cols)*cellH))using(var g=Paint(result)){
   for(int i=0;i<count;i++)g.DrawImage(b,new Rectangle(i%cols*cellW,i/cols*cellH,cellW,cellH),new Rectangle(crops[i*4],crops[i*4+1],crops[i*4+2],crops[i*4+3]),GraphicsUnit.Pixel);
   result.Save(output,ImageFormat.Png);
  }
 }
 static int Terrain(Color c){
  if(c.B>c.R*1.2&&c.B>c.G*.98)return c.G>155?1:0;
  if(c.R>190&&c.G>195&&c.B>185)return 5;
  if(c.R>155&&c.G>90&&c.B<c.R*.72)return 3;
  if(c.G>c.R*1.06&&c.G>c.B*1.12)return c.G<115?4:2;
  return 6;
 }
 public static string[] Grid(string source,int cols,int rows){
  using(var b=new Bitmap(source)){var output=new string[rows];
   for(int y=0;y<rows;y++){var line=new char[cols];for(int x=0;x<cols;x++){
    var counts=new int[7];for(int sy=1;sy<=5;sy++)for(int sx=1;sx<=5;sx++)
     counts[Terrain(b.GetPixel(Math.Min(b.Width-1,(int)((x+sx/6.0)*b.Width/cols)),Math.Min(b.Height-1,(int)((y+sy/6.0)*b.Height/rows))))]++;
    int choice=0;for(int i=1;i<7;i++)if(counts[i]>counts[choice])choice=i;line[x]=(char)('0'+choice);
   }output[y]=new string(line);}return output;
  }
 }
 public static void Icon(string source,string output){
  using(var b=new Bitmap(source)){
   int l=b.Width,t=b.Height,r=-1,bot=-1;
   for(int y=0;y<b.Height;y++)for(int x=0;x<b.Width;x++){
    if(b.GetPixel(x,y).A<210){b.SetPixel(x,y,Color.Transparent);continue;}
    l=Math.Min(l,x);t=Math.Min(t,y);r=Math.Max(r,x);bot=Math.Max(bot,y);
   }
   if(r<l)throw new Exception("Empty NYC icon");
   using(var result=new Bitmap(128,128))using(var g=Paint(result)){
    double scale=Math.Min(120.0/(r-l+1),120.0/(bot-t+1));int w=(int)Math.Round((r-l+1)*scale),h=(int)Math.Round((bot-t+1)*scale);
    g.DrawImage(b,new Rectangle((128-w)/2,124-h,w,h),Rectangle.FromLTRB(l,t,r+1,bot+1),GraphicsUnit.Pixel);result.Save(output,ImageFormat.Png);
   }
  }
 }
 public static void Validate(string file,int width,int height,int cellW,int cellH,bool transparent){
  using(var b=new Bitmap(file)){
   if(b.Width!=width||b.Height!=height)throw new Exception("Unexpected dimensions: "+file);
   if(transparent&&b.GetPixel(0,0).A!=0)throw new Exception("Background was not cleared: "+file);
   for(int cy=0;cy<height;cy+=cellH)for(int cx=0;cx<width;cx+=cellW){
    bool found=false;for(int y=cy;y<Math.Min(cy+cellH,height)&&!found;y++)for(int x=cx;x<Math.Min(cx+cellW,width);x++)if(b.GetPixel(x,y).A>0){found=true;break;}
    if(!found)throw new Exception("Empty cell in "+file);
   }
  }
 }
}
'@
$root=Split-Path $PSScriptRoot -Parent
$inbox=Join-Path (Split-Path $root -Parent) 'art inbox'
$out=Join-Path $root 'assets\world'
$names=@('World Map picture.png','World Map Tiles.png','NYC Tiles.png','Gburg Village Tiles.png','Plane Sprites.png','NYC World Map Sprite.png')
$before=$names | ForEach-Object {Get-FileHash (Join-Path $inbox $_)}
if(-not $ValidateOnly){
 New-Item -ItemType Directory $out -Force | Out-Null
 $jobs=@(
  @{file='terrain.png';run={param($p) [WorldArt]::Atlas((Join-Path $inbox 'World Map Tiles.png'),$p,[int[]]@(40,40,192,192,855,35,192,192,1390,35,192,192,590,300,192,192,320,590,192,192,1410,310,192,192,1160,585,192,192),32,32,7)}},
  @{file='overview.png';run={param($p) [WorldArt]::Crop((Join-Path $inbox 'World Map picture.png'),$p,0,0,1448,1086,1024,768)}},
  @{file='plane.png';run={param($p) [WorldArt]::Plane((Join-Path $inbox 'Plane Sprites.png'),$p)}},
  @{file='nyc-icon.png';run={param($p) [WorldArt]::Icon((Join-Path $inbox 'NYC World Map Sprite.png'),$p)}},
  @{file='nyc-ground.png';run={param($p) [WorldArt]::Atlas((Join-Path $inbox 'Gburg Village Tiles.png'),$p,[int[]]@(10,10,40,40,250,255,55,55,570,330,55,55,400,400,55,55),32,32,4)}},
  @{file='nyc-buildings.png';run={param($p) [WorldArt]::Atlas((Join-Path $inbox 'NYC Tiles.png'),$p,[int[]]@(0,315,280,285,320,315,245,285,578,315,248,285,840,315,265,285),256,256,4)}},
  @{file='nyc-park.png';run={param($p) [WorldArt]::Crop((Join-Path $inbox 'NYC Tiles.png'),$p,0,625,265,400,256,384)}}
 )
 foreach($job in $jobs){
  $path=Join-Path $out $job.file
  if($Rebuild -or -not(Test-Path $path)){& $job.run $path;Write-Output "Exported $($job.file)"}else{Write-Output "Preserved $($job.file)"}
 }
 $grid=Join-Path $root 'data\world-grid.json'
 if($Rebuild -or -not(Test-Path $grid)){
  $data=@{version=1;tileSize=32;cols=128;rows=96;terrain=@('ocean','shallows','grass','sand','forest','snow','mountain');cells=[WorldArt]::Grid((Join-Path $inbox 'World Map picture.png'),128,96)}
  [IO.File]::WriteAllText($grid,($data|ConvertTo-Json -Depth 5),[Text.UTF8Encoding]::new($false))
 }
}
foreach($entry in @(
 @('terrain.png',224,32,32,32,$false),@('overview.png',1024,768,1024,768,$false),
 @('plane.png',512,256,128,128,$true),@('nyc-icon.png',128,128,128,128,$true),
 @('nyc-ground.png',128,32,32,32,$false),@('nyc-buildings.png',1024,256,256,256,$false),
 @('nyc-park.png',256,384,256,384,$false)
)){
 [WorldArt]::Validate((Join-Path $out $entry[0]),$entry[1],$entry[2],$entry[3],$entry[4],$entry[5])
 Write-Output "Validated $($entry[0]) $($entry[1])x$($entry[2])"
}
$after=$names | ForEach-Object {Get-FileHash (Join-Path $inbox $_)}
if(Compare-Object $before $after -Property Path,Hash){throw 'Source artwork changed'}
Write-Output 'Original artwork hashes unchanged. Existing derivatives require explicit -Rebuild.'
