param([switch]$ValidateOnly,[switch]$Rebuild)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Collections.Generic;
public static class TerrainArt {
 static readonly int[] tops={14,95,183,268,353,438,526,611,695};
 static readonly int[] heights={81,88,85,85,85,88,85,84,86};
 static Graphics Paint(Bitmap b){
  var g=Graphics.FromImage(b);g.Clear(Color.Transparent);
  g.InterpolationMode=InterpolationMode.NearestNeighbor;g.PixelOffsetMode=PixelOffsetMode.Half;
  g.CompositingMode=CompositingMode.SourceCopy;return g;
 }
 static Bitmap Tile(Bitmap source,int col,int row){
  var tile=new Bitmap(32,32);
  using(var g=Paint(tile))g.DrawImage(source,new Rectangle(0,0,32,32),
   new Rectangle((int)Math.Round(19+col*83.75)+2,tops[row]+2,80,heights[row]-4),GraphicsUnit.Pixel);
  for(int y=0;y<32;y++)for(int x=0;x<32;x++){
   var c=tile.GetPixel(x,y);if(c.A<128)throw new Exception("Hole in terrain crop "+col+","+row+" at "+x+","+y);
   tile.SetPixel(x,y,Color.FromArgb(255,c.R,c.G,c.B));
  }return tile;
 }
 static bool Foreground(Color c,int material){
  if(material==0)return c.G>c.R*1.06&&c.G>c.B*1.12;
  if(material==1)return c.R>155&&c.G>90&&c.B<c.R*.72;
  return c.R>190&&c.G>195&&c.B>185;
 }
 static int Join(Bitmap tile,int material,bool vertical,int column){
  for(int i=0;i<32;i++)if(Foreground(tile.GetPixel(vertical?column:i,vertical?i:column),material))return i;
  throw new Exception("Missing terrain transition endpoint.");
 }
 static int Remap(int value,double from,double to){
  double result=value<=to?value*from/to:from+(value-to)*(31-from)/(31-to);
  return Math.Max(0,Math.Min(31,(int)Math.Round(result)));
 }
 static Bitmap Edge(Bitmap source,int col,int row,int material,bool rotate){
  using(var raw=Tile(source,col,row)){
   if(rotate)raw.RotateFlip(RotateFlipType.Rotate180FlipNone);
   var edge=new Bitmap(32,32);int left=Join(raw,material,true,0),right=Join(raw,material,true,31);
   for(int x=0;x<32;x++){
    int shore=Join(raw,material,true,x);double offset=(16-left)*(1-x/31.0)+(16-right)*x/31.0;
    double target=Math.Max(1,Math.Min(30,shore+offset));
    for(int y=0;y<32;y++)edge.SetPixel(x,y,raw.GetPixel(x,Remap(y,shore,target)));
   }return edge;
  }
 }
 static Bitmap Corner(Bitmap source,int col,int row,int material,bool mirror){
  using(var raw=Tile(source,col,row)){
   if(mirror)raw.RotateFlip(RotateFlipType.RotateNoneFlipX);
   int top=Join(raw,material,true,31),side=Join(raw,material,false,31);
   var corner=new Bitmap(32,32);
   for(int y=0;y<32;y++)for(int x=0;x<32;x++)corner.SetPixel(x,y,raw.GetPixel(Remap(x,side,16),Remap(y,top,16)));
   return corner;
  }
 }
 static Bitmap Inner(Bitmap foreground,Bitmap background,bool coast){
  var result=new Bitmap(32,32);
  for(int y=0;y<32;y++)for(int x=0;x<32;x++){
   double distance=Math.Sqrt(x*x+y*y);
   Color c=distance<16?background.GetPixel(x,y):foreground.GetPixel(x,y);
   if(coast&&distance>=14&&distance<16)c=Color.FromArgb(191,221,235);
   if(coast&&distance>=16&&distance<18)c=Color.FromArgb(214,193,145);
   result.SetPixel(x,y,c);
  }return result;
 }
 static Bitmap Feature(Bitmap source,Rectangle crop){
  var tile=new Bitmap(32,32);
  using(var g=Paint(tile))g.DrawImage(source,new Rectangle(0,0,32,32),crop,GraphicsUnit.Pixel);
  var seen=new bool[1024];var largest=new List<int>();
  for(int i=0;i<1024;i++){
   if(seen[i]||tile.GetPixel(i%32,i/32).A<128)continue;
   var part=new List<int>();var q=new Queue<int>();q.Enqueue(i);seen[i]=true;
   while(q.Count>0){
    int p=q.Dequeue(),x=p%32,y=p/32;part.Add(p);
    foreach(int next in new[]{x>0?p-1:-1,x<31?p+1:-1,y>0?p-32:-1,y<31?p+32:-1}){
     if(next>=0&&!seen[next]&&tile.GetPixel(next%32,next/32).A>=128){seen[next]=true;q.Enqueue(next);}
    }
   }if(part.Count>largest.Count)largest=part;
  }
  if(largest.Count<20)throw new Exception("Empty terrain feature.");
  var keep=new bool[1024];foreach(int i in largest)keep[i]=true;
  for(int y=0;y<32;y++)for(int x=0;x<32;x++){
   var c=tile.GetPixel(x,y);tile.SetPixel(x,y,keep[y*32+x]?Color.FromArgb(255,c.R,c.G,c.B):Color.Transparent);
  }return tile;
 }
 public static void Export(string input,string bases,string transitions,string features,string coasts){
  using(var source=new Bitmap(input)){
   if(source.Width!=1254||source.Height!=1254)throw new Exception("Unexpected source sheet dimensions.");
   int[] columns={0,3,5,8,6,11,5,1,6,7,9,10,12,11};
   using(var atlas=new Bitmap(columns.Length*32,32))using(var g=Paint(atlas)){
    for(int i=0;i<columns.Length;i++)using(var tile=Tile(source,columns[i],0))g.DrawImageUnscaled(tile,i*32,0);
    atlas.Save(bases,ImageFormat.Png);
   }
   using(var atlas=new Bitmap(128,160))using(var g=Paint(atlas)){
    for(int row=0;row<5;row++){
     int material=row<3?row:row-2,baseCol=material==0?5:material==1?8:11;
     int edgeRow=row<3?1+row*2:row==3?7:8,cornerRow=row<3?2+row*2:edgeRow;
     using(var ground=Tile(source,baseCol,0))
     using(var water=Tile(source,row<3?0:5,0))
     using(var edge=Edge(source,row<3?0:1,edgeRow,material,row<3))
     using(var corner=Corner(source,row<3?4:0,cornerRow,material,row<3))
     using(var inner=Inner(ground,water,row<3)){
      g.DrawImageUnscaled(ground,0,row*32);g.DrawImageUnscaled(edge,32,row*32);
      g.DrawImageUnscaled(corner,64,row*32);g.DrawImageUnscaled(inner,96,row*32);
     }
    }atlas.Save(transitions,ImageFormat.Png);
    using(var overlay=new Bitmap(128,96)){
     for(int y=0;y<96;y++)for(int x=0;x<128;x++){
      var c=atlas.GetPixel(x,y);bool clear=x>=32&&Foreground(c,y/32);
      if(clear){
       for(int dy=-2;dy<=2&&clear;dy++)for(int dx=-2;dx<=2;dx++){
        int nx=x+dx,ny=y+dy;
        if(nx<0||nx>=128||ny<0||ny>=96||nx/32!=x/32||ny/32!=y/32)continue;
        var near=atlas.GetPixel(nx,ny);
        if(near.B>near.R*1.2&&near.B>near.G*.98){clear=false;break;}
       }
      }
      overlay.SetPixel(x,y,clear?Color.Transparent:c);
     }
     overlay.Save(coasts,ImageFormat.Png);
    }
   }
   var crops=new[]{
    new Rectangle(112,790,88,86),new Rectangle(267,789,100,90),new Rectangle(632,792,98,94),new Rectangle(1075,809,140,126),
    new Rectangle(94,1044,78,78),new Rectangle(175,1044,101,95),new Rectangle(284,1044,110,95),new Rectangle(785,1045,100,85)
   };
   using(var atlas=new Bitmap(256,32))using(var g=Paint(atlas)){
    for(int i=0;i<crops.Length;i++)using(var tile=Feature(source,crops[i]))g.DrawImageUnscaled(tile,i*32,0);
    atlas.Save(features,ImageFormat.Png);
   }
  }
 }
 public static void Validate(string file,int width,int height,bool opaque){
  using(var image=new Bitmap(file)){
   if(image.Width!=width||image.Height!=height)throw new Exception("Invalid atlas dimensions: "+file);
   for(int y=0;y<height;y++)for(int x=0;x<width;x++){
    int a=image.GetPixel(x,y).A;
    if(opaque?a!=255:a!=0&&a!=255)throw new Exception("Unexpected pixel alpha in "+file);
   }
   for(int col=0;col<width/32;col++)for(int row=0;row<height/32;row++){
    bool found=false;
    for(int y=row*32;y<(row+1)*32&&!found;y++)for(int x=col*32;x<(col+1)*32;x++)if(image.GetPixel(x,y).A>0){found=true;break;}
    if(!found)throw new Exception("Empty atlas frame in "+file);
   }
  }
 }
}
'@
$root=Split-Path $PSScriptRoot -Parent
$source=Join-Path (Split-Path $root -Parent) 'art inbox\World Map Tileset V4.png'
$before=(Get-FileHash $source).Hash
$out=Join-Path $root 'assets\world'
$bases=Join-Path $out 'terrain-v2.png'
$transitions=Join-Path $out 'transitions-v2.png'
$features=Join-Path $out 'features-v2.png'
$coasts=Join-Path $out 'coasts-v2.png'
if(-not $ValidateOnly){
 $missing=@($bases,$transitions,$features,$coasts) | Where-Object {-not(Test-Path $_)}
 if($Rebuild -or $missing){
  [TerrainArt]::Export($source,$bases,$transitions,$features,$coasts)
  Write-Output 'Exported V7 terrain bases, fitted transitions and cleaned features.'
 }else{Write-Output 'Preserved existing V7 terrain derivatives.'}
}
[TerrainArt]::Validate($bases,448,32,$true)
[TerrainArt]::Validate($transitions,128,160,$true)
[TerrainArt]::Validate($features,256,32,$false)
[TerrainArt]::Validate($coasts,128,96,$false)
if((Get-FileHash $source).Hash -ne $before){throw 'Original artwork changed.'}
Write-Output 'PASS: dimensions, opaque ground/transitions, binary-alpha nonempty features; original unchanged.'
