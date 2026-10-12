param(
 [string]$PreviewPath,
 [switch]$ValidateOnly,
 [switch]$RebuildGaryWalk
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.IO;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Collections.Generic;
public static class V5StoryArt {
 public static Bitmap Read(string path, int threshold) {
  var image = new Bitmap(path);
  // The yoga upload has a low-alpha glow, not an opaque background. Keep its
  // nearly opaque pixel silhouettes, including dark hair/shirt/black outlines.
  for(int y=0;y<image.Height;y++) for(int x=0;x<image.Width;x++) {
   Color c=image.GetPixel(x,y);
   image.SetPixel(x,y,c.A<threshold?Color.Transparent:Color.FromArgb(255,c.R,c.G,c.B));
  }
  return image;
 }
 public static Rectangle Bounds(Bitmap image,Rectangle cell) {
  int l=cell.Right,t=cell.Bottom,r=-1,b=-1;
  for(int y=cell.Top;y<cell.Bottom;y++) for(int x=cell.Left;x<cell.Right;x++) {
   if(image.GetPixel(x,y).A==0)continue;
   l=Math.Min(l,x);t=Math.Min(t,y);r=Math.Max(r,x);b=Math.Max(b,y);
  }
  if(r<l)throw new Exception("Empty source cell "+cell);
  return Rectangle.FromLTRB(l,t,r+1,b+1);
 }
 static Graphics GraphicsFor(Bitmap image) {
  var g=Graphics.FromImage(image);
  g.Clear(Color.Transparent);
  g.InterpolationMode=InterpolationMode.NearestNeighbor;
  g.PixelOffsetMode=PixelOffsetMode.Half;
  g.CompositingMode=CompositingMode.SourceCopy;
  return g;
 }
 static Bitmap Cell(Bitmap source,Rectangle rect) {
  var image=new Bitmap(rect.Width,rect.Height,PixelFormat.Format32bppArgb);
  using(var g=GraphicsFor(image))g.DrawImage(source,new Rectangle(0,0,rect.Width,rect.Height),rect,GraphicsUnit.Pixel);
  var seen=new bool[rect.Width*rect.Height];
  var components=new List<List<Point>>();
  var edges=new List<bool>();
  int largest=-1;
  for(int y=0;y<image.Height;y++)for(int x=0;x<image.Width;x++) {
   int index=y*image.Width+x;
   if(seen[index]||image.GetPixel(x,y).A==0)continue;
   var points=new List<Point>();var queue=new Queue<Point>();bool edge=false;
   queue.Enqueue(new Point(x,y));seen[index]=true;
   while(queue.Count>0) {
    Point p=queue.Dequeue();points.Add(p);
    if(p.X==0||p.Y==0||p.X==image.Width-1||p.Y==image.Height-1)edge=true;
    for(int dy=-1;dy<=1;dy++)for(int dx=-1;dx<=1;dx++) {
     int nx=p.X+dx,ny=p.Y+dy;
     if(nx<0||ny<0||nx>=image.Width||ny>=image.Height)continue;
     int ni=ny*image.Width+nx;
     if(seen[ni]||image.GetPixel(nx,ny).A==0)continue;
     seen[ni]=true;queue.Enqueue(new Point(nx,ny));
    }
   }
   if(largest<0||points.Count>components[largest].Count)largest=components.Count;
   components.Add(points);edges.Add(edge);
  }
  if(largest<0)throw new Exception("Empty cell "+rect);
  if(edges[largest]) {
   var crossings=new HashSet<Point>();
   foreach(Point p in components[largest]) {
    for(int dy=-1;dy<=1;dy++)for(int dx=-1;dx<=1;dx++) {
     int nx=p.X+dx,ny=p.Y+dy;
     if(nx>=0&&ny>=0&&nx<image.Width&&ny<image.Height)continue;
     int sx=rect.Left+nx,sy=rect.Top+ny;
     if(sx>=0&&sy>=0&&sx<source.Width&&sy<source.Height&&source.GetPixel(sx,sy).A>0)
      crossings.Add(new Point(sx,sy));
    }
   }
   // A few uploaded rows touch at their black outline (notably Ari's hair
   // against the preceding shoes); the measured row seam is intentional.
   if(crossings.Count>12) {
    Point sample=Point.Empty;foreach(Point p in crossings){sample=p;break;}
    throw new Exception("Main sprite crosses source crop "+rect+" ("+crossings.Count+" pixels, e.g. "+sample+")");
   }
  }
  // The densely packed sheets have neighboring arms/glow/stars intruding into
  // rectangular crops. Remove only disconnected fragments cut by a crop edge.
  for(int i=0;i<components.Count;i++)if(edges[i]&&i!=largest)
   foreach(Point p in components[i])image.SetPixel(p.X,p.Y,Color.Transparent);
  return image;
 }
 public static void Clip(string source,string destination,int[,] cells,int fw,int fh,
                         int footX,int footY,double scale,int threshold,int[,] anchors) {
  using(var image=Read(source,threshold))
  using(var output=new Bitmap(fw*cells.GetLength(0),fh,PixelFormat.Format32bppArgb))
  using(var g=GraphicsFor(output)) {
   for(int i=0;i<cells.GetLength(0);i++) {
    var rect=new Rectangle(cells[i,0],cells[i,1],cells[i,2],cells[i,3]);
    using(var cell=Cell(image,rect)) {
     var box=Bounds(cell,new Rectangle(0,0,cell.Width,cell.Height));
     double ax=anchors==null?(box.Left+box.Right)/2.0:anchors[i,0]-rect.Left;
     double ay=anchors==null?box.Bottom:anchors[i,1]-rect.Top;
     int x=footX+(int)Math.Round((box.Left-ax)*scale);
     int y=footY+(int)Math.Round((box.Top-ay)*scale);
     int w=(int)Math.Round(box.Width*scale),h=(int)Math.Round(box.Height*scale);
     if(x<0||y<0||x+w>fw||y+h>fh)
      throw new Exception(Path.GetFileName(destination)+" clips frame "+i+" at "+x+","+y+" "+w+"x"+h);
     g.DrawImage(cell,new Rectangle(i*fw+x,y,w,h),box,GraphicsUnit.Pixel);
    }
   }
   output.Save(destination,ImageFormat.Png);
  }
 }
 public static void Pose(string source,string destination,int stature) {
  using(var image=Read(source,128)) {
   var box=Bounds(image,new Rectangle(0,0,image.Width,image.Height));
   Clip(source,destination,new int[,]{{0,0,image.Width,image.Height}},64,64,32,60,
        (double)stature/box.Height,128,null);
  }
 }
 public static void Idle(string source,string destination) {
  using(var image=new Bitmap(source))
  using(var output=new Bitmap(64,64,PixelFormat.Format32bppArgb))
  using(var g=GraphicsFor(output)) {
   g.DrawImage(image,new Rectangle(0,0,64,64),new Rectangle(0,0,64,64),GraphicsUnit.Pixel);
   output.Save(destination,ImageFormat.Png);
  }
 }
 public static void Walk(string source,string destination,int[,] cells) {
  using(var image=Read(source,128))
  using(var output=new Bitmap(256,512,PixelFormat.Format32bppArgb))
  using(var g=GraphicsFor(output)) {
   double scale=56.0/164;
   for(int row=0;row<8;row++) for(int frame=0;frame<3;frame++) {
    int i=row*3+frame;
    var box=Bounds(image,new Rectangle(cells[i,0],cells[i,1],cells[i,2],cells[i,3]));
    int w=(int)Math.Round(box.Width*scale),h=(int)Math.Round(box.Height*scale);
    if(w>60||h>60)throw new Exception("Walking frame exceeds contract");
    g.DrawImage(image,new Rectangle(frame*64+32-w/2,row*64+60-h,w,h),box,GraphicsUnit.Pixel);
   }
   g.Flush();
   // Exact pixel copy avoids GDI+ resampling phase changes at a later column.
   for(int row=0;row<8;row++)for(int y=0;y<64;y++)for(int x=0;x<64;x++)
    output.SetPixel(192+x,row*64+y,output.GetPixel(64+x,row*64+y));
   output.Save(destination,ImageFormat.Png);
  }
 }
 public static void Portrait(string source,string destination) {
  using(var image=Read(source,128))
  using(var output=new Bitmap(128,128,PixelFormat.Format32bppArgb))
  using(var g=GraphicsFor(output)) {
   g.DrawImage(image,new Rectangle(0,0,128,128),new Rectangle(0,0,image.Width,image.Height),GraphicsUnit.Pixel);
   output.Save(destination,ImageFormat.Png);
  }
 }
 public static void Validate(string path,int fw,int fh,int frames,int rows,bool distinct) {
  using(var image=new Bitmap(path)) {
   if(image.Width!=fw*frames||image.Height!=fh*rows)throw new Exception("Dimensions: "+path);
   int transparent=0,opaque=0;
   var hashes=new HashSet<ulong>();
   for(int row=0;row<rows;row++) for(int frame=0;frame<frames;frame++) {
    ulong hash=14695981039346656037UL;
    for(int y=0;y<fh;y++)for(int x=0;x<fw;x++){
     Color c=image.GetPixel(frame*fw+x,row*fh+y);
     if(c.A==0)transparent++;else if(c.A==255)opaque++;else throw new Exception("Soft alpha: "+path);
     unchecked{hash^=(uint)c.ToArgb();hash*=1099511628211UL;}
    }
    Bounds(image,new Rectangle(frame*fw,row*fh,fw,fh));
    hashes.Add(hash);
   }
   if(transparent==0||opaque==0)throw new Exception("Alpha contract: "+path);
   if(distinct&&hashes.Count<Math.Min(frames,3))throw new Exception("Duplicate action frames: "+path);
   if(frames==4&&rows==8) {
    for(int row=0;row<8;row++)for(int y=0;y<fh;y++)for(int x=0;x<fw;x++)
     if(image.GetPixel(fw+x,row*fh+y).ToArgb()!=image.GetPixel(3*fw+x,row*fh+y).ToArgb())
      throw new Exception("Walking replay must be exactly 0,1,2,1: "+path);
   }
   Console.WriteLine(Path.GetFileName(path)+" "+image.Width+"x"+image.Height+
                     " alpha=0/255 distinct="+hashes.Count+" bytes="+new FileInfo(path).Length);
  }
 }
 public static void Preview(string path,string[] files) {
  int width=768,height=files.Length*100;
  using(var output=new Bitmap(width,height,PixelFormat.Format32bppArgb))
  using(var g=Graphics.FromImage(output)) {
   g.Clear(Color.FromArgb(52,61,72));
   g.InterpolationMode=InterpolationMode.NearestNeighbor;g.PixelOffsetMode=PixelOffsetMode.Half;
   for(int i=0;i<files.Length;i++)using(var image=new Bitmap(files[i])) {
    g.DrawString(Path.GetFileName(files[i]),SystemFonts.DefaultFont,Brushes.White,4,i*100+3);
    double scale=Math.Min(2.0,Math.Min(760.0/image.Width,76.0/image.Height));
    g.DrawImage(image,new Rectangle(4,i*100+21,(int)(image.Width*scale),(int)(image.Height*scale)));
   }
   output.Save(path,ImageFormat.Png);
  }
 }
}
'@
$root = Split-Path (Split-Path $PSScriptRoot)
$inbox = Join-Path $root 'art inbox'
$assets = Join-Path $root 'v5\assets'
foreach ($folder in @('characters','dinosaurs','portraits')) {
 New-Item -ItemType Directory -Force -Path (Join-Path $assets $folder) | Out-Null
}
$checks = New-Object 'System.Collections.Generic.List[object]'
function Cells($rows) {
 if ($rows[0] -isnot [array]) { $rows=,$rows }
 $cells = New-Object 'int[,]' ($rows.Count * 3),4
 for ($r=0;$r -lt $rows.Count;$r++) {
  for ($c=0;$c -lt 3;$c++) {
   $i=$r*3+$c
   $cells[$i,0]=$rows[$r][0]+$c*$rows[$r][2]
   $cells[$i,1]=$rows[$r][1]
   $cells[$i,2]=$rows[$r][2]
   $cells[$i,3]=$rows[$r][3]
  }
 }
 return ,$cells
}
function Rects($values) {
 if ($values[0] -isnot [array]) { $values=,$values }
 $result = New-Object 'int[,]' $values.Count,4
 for ($i=0;$i -lt $values.Count;$i++) {
  for ($j=0;$j -lt 4;$j++) { $result[$i,$j]=$values[$i][$j] }
 }
 return ,$result
}
function Anchors($values) {
 $result = New-Object 'int[,]' $values.Count,2
 for ($i=0;$i -lt $values.Count;$i++) {
  $result[$i,0]=$values[$i][0];$result[$i,1]=$values[$i][1]
 }
 return ,$result
}
function Clip($name,$source,$cells,$scale,[int]$width=64,[int]$height=64,
              [int]$footX=32,[int]$footY=60,[int]$threshold=128,$anchors=$null,[bool]$distinct=$true) {
 $path = Join-Path $assets "characters\$name.png"
 if (!$ValidateOnly) {
  [V5StoryArt]::Clip((Join-Path $inbox $source),$path,$cells,$width,$height,$footX,$footY,$scale,$threshold,$anchors)
 }
 $checks.Add(@($path,$width,$height,$cells.GetLength(0),1,$distinct))
}
# Single uploaded reaction poses remain single frames; no artificial animation.
$poses=@(
 @('connor','Connor Shocked Sprite.png',44),
 @('jason','Jason Shocked - Sprite.png',52),
 @('peachy','Peachy Shocked Sprite.png',49),
 @('mark','Mark Surpised Sprite.png',55),
 @('stephanie','Stephanie Shocked Sprite.png',54),
 @('vito','Vito Suprised Sprite.png',56)
)
foreach ($pose in $poses) {
 $id=$pose[0]
 $surprised=Join-Path $assets "characters\$id-surprised.png"
 $talk=Join-Path $assets "characters\$id-talk.png"
 if (!$ValidateOnly) {
  [V5StoryArt]::Pose((Join-Path $inbox $pose[1]),$surprised,$pose[2])
  [V5StoryArt]::Idle((Join-Path $root "assets\characters\$id\sheets\walk_4dir.png"),$talk)
 }
 $checks.Add(@($surprised,64,64,1,1,$false))
 $checks.Add(@($talk,64,64,1,1,$false))
}
# Row/cell coordinates are from visual inspection, not filename-based guesses.
# Chris is the blue-trunk swimmer; Jaime is the gray-haired headphone skater.
Clip 'jeff-talk' 'Jeff Sprites.png' (Rects @(@(125,1200,145,182),@(300,1200,140,182),@(455,1200,150,182))) (56.0/175)
Clip 'jeff-surprised' 'Jeff Sprites.png' (Rects @(@(120,1380,125,175),@(275,1380,165,175),@(470,1380,135,175))) (56.0/175)
Clip 'jeff-hurt' 'Jeff Sprites.png' (Cells @(@(107,1560,179,180))) (56.0/175)
Clip 'jeff-win' 'Jeff Sprites.png' (Rects @(@(100,1740,165,210),@(280,1740,150,210),@(450,1740,180,210))) (54.0/175)
Clip 'jeff-interact' 'Jeff Sprites.png' (Rects @(@(360,1950,175,200),@(535,1950,175,200))) (56.0/175)
Clip 'ari-talk' 'Ari Sprites.png' (Cells @(@(155,1340,145,113))) (56.0/125)
Clip 'ari-surprised' 'Ari Sprites.png' (Rects @(@(154,1453,145,123),@(299,1453,145,123),@(444,1453,145,127))) (56.0/125)
Clip 'ari-hurt' 'Ari Sprites.png' (Rects @(@(153,1567,145,106),@(298,1574,145,99),@(443,1583,145,90))) (56.0/125)
Clip 'ari-interact' 'Ari Sprites.png' (Rects @(@(160,1670,125,103),@(300,1670,125,103))) (56.0/125)
Clip 'ari-kick' 'Ari Sprites.png' (Cells @(@(140,1880,160,98))) (56.0/125)
Clip 'ari-win' 'Ari Sprites.png' (Cells @(@(145,2077,150,95))) (56.0/125)
Clip 'chris-talk' 'Chris Sprites.png' (Cells @(@(14,940,107,186))) (56.0/164)
Clip 'chris-surprised' 'Chris Sprites.png' (Cells @(@(381,940,108,186))) (56.0/164)
Clip 'chris-hurt' 'Chris Sprites.png' (Rects @(@(12,1130,118,190),@(130,1130,118,190),@(235,1130,140,190))) (56.0/164)
Clip 'chris-win' 'Chris Sprites.png' (Cells @(@(370,1130,116,190))) (56.0/164)
Clip 'chris-interact' 'Chris Sprites.png' (Rects @(@(425,1320,115,180),@(555,1320,130,180))) (56.0/164)
Clip 'jaime-talk' 'Jamie Sprites.png' (Cells @(@(235,1015,175,119))) (54.0/106)
Clip 'jaime-surprised' 'Jamie Sprites.png' (Cells @(@(235,1135,175,120))) (56.0/106)
Clip 'jaime-hurt' 'Jamie Sprites.png' (Cells @(@(235,1255,175,111))) (56.0/106)
Clip 'jaime-win' 'Jamie Sprites.png' (Cells @(@(235,1350,175,129))) (56.0/106)
Clip 'jaime-phone' 'Jamie Sprites.png' (Rects @(@(235,1543,175,76),@(410,1543,175,76))) (56.0/106)
Clip 'jaime-skate' 'Jamie Sprites.png' (Cells @(@(232,791,175,110))) (56.0/106)
Clip 'brie-yoga' 'Brie Yoga Sprite.png' (Cells @(@(210,60,435,450))) (52.0/415) 64 64 32 60 230 $null $false
Clip 'brie-stand' 'Brie Yoga Sprite.png' (Cells @(@(210,530,435,450))) (52.0/415) 64 64 32 60 230
$brieTalk=Join-Path $assets 'characters\brie-talk.png'
if (!$ValidateOnly) {
 [V5StoryArt]::Idle((Join-Path $root 'assets\characters\brie\sheets\walk_4dir.png'),$brieTalk)
}
$checks.Add(@($brieTalk,64,64,1,1,$false))
# Shared scaling is based on Vito's supplied upright HUMAN, never dino bounds.
# Measured human foot positions keep the actor fixed while the dino is thrown.
$vito='Vito Fighting Dinosaur - Cinematic Sprite Only.png'
Clip 'vito-wrestle' $vito (Rects @(@(0,110,460,215),@(460,110,460,215),@(920,110,410,215))) (56.0/183) 192 128 64 120 128 (Anchors @(@(105,310),@(595,310),@(1018,310)))
Clip 'vito-throw' $vito (Rects @(@(0,325,440,330),@(440,325,500,330),@(940,325,390,330),@(0,655,455,250),@(455,655,520,250),@(975,655,355,250))) (56.0/183) 192 128 64 120 128 (Anchors @(@(169,646),@(642,646),@(1090,646),@(155,890),@(563,890),@(1090,890)))
Clip 'vito-recover' $vito (Rects @(@(0,920,445,250),@(445,920,445,250),@(890,920,440,250))) (56.0/183) 192 128 64 120 128 (Anchors @(@(224,1152),@(674,1152),@(1114,1152)))
$gary='Gary Sprites.png'
$s=56.0/164
Clip 'gary-talk' $gary (Rects @(@(15,1105,120,190),@(135,1105,120,190),@(245,1105,155,190))) $s
Clip 'gary-surprised' $gary (Rects @(@(381,1105,110,190),@(491,1105,110,190),@(590,1105,125,190))) $s
Clip 'gary-hurt' $gary (Rects @(@(10,1295,115,205),@(135,1295,120,205),@(240,1295,135,205))) $s
Clip 'gary-win' $gary (Rects @(@(375,1290,110,210),@(480,1290,120,210),@(575,1290,140,210))) $s 64 80 32 76
Clip 'gary-sit' $gary (Rects @(@(0,1500,185,160))) $s 64 64 32 60 128 $null $false
Clip 'gary-drink' $gary (Rects @(@(185,1500,180,160))) $s 64 64 32 60 128 $null $false
Clip 'gary-interact' $gary (Rects @(@(375,1500,170,160),@(545,1500,175,160))) $s
Clip 'gary-attack' $gary (Rects @(@(0,1660,185,166),@(185,1660,280,166),@(465,1660,259,166))) $s 128 64 32 60 128 (Anchors @(@(76,1826),@(259,1826),@(542,1826)))
Clip 'gary-special' $gary (Rects @(@(0,1790,215,202),@(215,1790,205,202),@(420,1790,304,202))) $s 128 80 40 72 128 (Anchors @(@(103,1989),@(318,1989),@(498,1989)))
Clip 'gary-unique' $gary (Rects @(@(85,1992,195,180),@(280,1992,160,180),@(440,1992,170,180))) $s
# Front-facing running poses, without mixing directions in one animation.
Clip 'gary-run' $gary (Cells @(@(15,744,110,183))) $s
$walk=Join-Path $assets 'characters\gary-walk.png'
if (!$ValidateOnly -and (!(Test-Path $walk) -or $RebuildGaryWalk)) {
 $rows=@(@(15,20,110,176),@(15,196,110,182),@(380,20,110,176),@(380,196,110,182),
         @(15,378,110,185),@(15,563,110,181),@(380,563,110,181),@(380,378,110,185))
 [V5StoryArt]::Walk((Join-Path $inbox $gary),$walk,(Cells $rows))
} elseif (!$ValidateOnly) {
 Write-Output 'Preserving hand-cleaned Gary walking sheet. -RebuildGaryWalk explicitly replaces it from the original upload.'
}
$checks.Add(@($walk,64,64,4,8,$false))
$portrait=Join-Path $assets 'portraits\gary.png'
if (!$ValidateOnly) { [V5StoryArt]::Portrait((Join-Path $inbox 'Gary Portrait.png'),$portrait) }
$checks.Add(@($portrait,128,128,1,1,$false))
$window=Join-Path $assets 'dinosaurs\window-head.png'
if (!$ValidateOnly) {
 [V5StoryArt]::Clip((Join-Path $inbox 'Dinosaur Window Head.png'),$window,
                   (Cells @(@(0,0,724,724))),192,192,96,182,0.27,128,$null)
}
$checks.Add(@($window,192,192,3,1,$true))
foreach ($check in $checks) {
 [V5StoryArt]::Validate($check[0],$check[1],$check[2],$check[3],$check[4],$check[5])
}
if ($PreviewPath) {
 New-Item -ItemType Directory -Force -Path $PreviewPath | Out-Null
 $files=@($checks | ForEach-Object { $_[0] })
 for ($i=0;$i -lt $files.Count;$i+=12) {
  $end=[Math]::Min($i+11,$files.Count-1)
  [V5StoryArt]::Preview((Join-Path $PreviewPath "story-derivatives-$([int]($i/12)).png"),[string[]]$files[$i..$end])
 }
}
