param([switch]$ValidateOnly,[switch]$Rebuild)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
public static class CombatArt {
 class Part {public Rectangle Box;public System.Collections.Generic.List<int> Pixels;}
 static System.Collections.Generic.List<Part> Parts(Bitmap image,Rectangle region){
  int w=region.Width,h=region.Height;var mask=new bool[w*h];var result=new System.Collections.Generic.List<Part>();
  for(int y=0;y<h;y++)for(int x=0;x<w;x++)mask[y*w+x]=image.GetPixel(region.X+x,region.Y+y).A>0;
  for(int start=0;start<mask.Length;start++){
   if(!mask[start])continue;var pixels=new System.Collections.Generic.List<int>();pixels.Add(start);mask[start]=false;
   int l=w,t=h,r=0,b=0;
   for(int q=0;q<pixels.Count;q++){
    int x=pixels[q]%w,y=pixels[q]/w;l=Math.Min(l,x);t=Math.Min(t,y);r=Math.Max(r,x);b=Math.Max(b,y);
    for(int dy=-1;dy<=1;dy++)for(int dx=-1;dx<=1;dx++){
     int nx=x+dx,ny=y+dy;if(nx<0||nx>=w||ny<0||ny>=h)continue;int next=ny*w+nx;
     if(mask[next]){mask[next]=false;pixels.Add(next);}
    }
   }
   result.Add(new Part{Box=Rectangle.FromLTRB(region.X+l,region.Y+t,region.X+r+1,region.Y+b+1),Pixels=pixels});
  }
  result.Sort((a,b)=>b.Pixels.Count.CompareTo(a.Pixels.Count));return result;
 }
 public static Rectangle[] Poses(string file,int top,int height,int count){
  using(var image=Read(file)){
   var parts=Parts(image,new Rectangle(0,top,image.Width,height));
   if(parts.Count<count)throw new Exception("Not enough distinct poses: "+file);
   parts=parts.GetRange(0,count);parts.Sort((a,b)=>a.Box.Left.CompareTo(b.Box.Left));return parts.ConvertAll(p=>p.Box).ToArray();
  }
 }
 static void MainPart(Bitmap image){
  var parts=Parts(image,new Rectangle(0,0,image.Width,image.Height));if(parts.Count==0)throw new Exception("Empty pose");
  var keep=new bool[image.Width*image.Height];foreach(int pixel in parts[0].Pixels)keep[pixel]=true;
  for(int y=0;y<image.Height;y++)for(int x=0;x<image.Width;x++)if(!keep[y*image.Width+x])image.SetPixel(x,y,Color.Transparent);
 }
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
  Atlas(source,destination,cells,fw,fh,cols,maxW,maxH,false);
 }
 public static void Atlas(string source,string destination,int[,] cells,int fw,int fh,int cols,int maxW,int maxH,bool mainOnly){
  using(var image=Read(source))using(var output=new Bitmap(fw*cols,fh*(cells.GetLength(0)/cols),PixelFormat.Format32bppArgb))using(var g=Painter(output)){
   var boxes=new Rectangle[cells.GetLength(0)];var pieces=new Bitmap[boxes.Length];double scale=Double.MaxValue;
   try{
    for(int i=0;i<boxes.Length;i++){
     pieces[i]=image.Clone(new Rectangle(cells[i,0],cells[i,1],cells[i,2],cells[i,3]),PixelFormat.Format32bppArgb);
     if(mainOnly)MainPart(pieces[i]);boxes[i]=Bounds(pieces[i],new Rectangle(0,0,pieces[i].Width,pieces[i].Height));
     scale=Math.Min(scale,Math.Min((double)maxW/boxes[i].Width,(double)maxH/boxes[i].Height));
    }
    for(int i=0;i<boxes.Length;i++){int w=(int)Math.Round(boxes[i].Width*scale),h=(int)Math.Round(boxes[i].Height*scale);
     g.DrawImage(pieces[i],new Rectangle(i%cols*fw+(fw-w)/2,i/cols*fh+fh-4-h,w,h),boxes[i],GraphicsUnit.Pixel);
    }output.Save(destination,ImageFormat.Png);
   }finally{foreach(var piece in pieces)if(piece!=null)piece.Dispose();}
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
$sources=@('Compy Sprites.png','Towel Whip Sprites.png','Hamburger Sprite.png','Concept art for cutscenes\Dinosaur-Infested School Bus Sprite Sheet.png','Dilophosaurus - Sprites.png','Ankylosaurus.png','Gernade Sprite.png','Barney Sprites.png','Rosie Sprites.png')
$hashes=@{};foreach($name in $sources){$hashes[$name]=(Get-FileHash -LiteralPath (Join-Path $inbox $name)).Hash}
foreach($folder in @('dinosaurs','items','gimmicks','companions','characters')){if(!$ValidateOnly){New-Item -ItemType Directory -Path (Join-Path $assets $folder) -Force | Out-Null}}
$compy=Join-Path $assets 'dinosaurs\compy.png';$towel=Join-Path $assets 'items\towel-whip.png'
$burger=Join-Path $assets 'items\hamburger.png';$bus=Join-Path $assets 'gimmicks\bus.png'
$dilo=Join-Path $assets 'dinosaurs\dilophosaurus.png';$anky=Join-Path $assets 'dinosaurs\ankylosaurus.png'
$grenade=Join-Path $assets 'items\grenade.png';$grenadeIcon=Join-Path $assets 'items\grenade-icon.png'
$jeffSource=Join-Path $root 'v4\assets\characters\jeff.png';$jeff=Join-Path $assets 'characters\jeff.png'
$jeffHash=(Get-FileHash $jeffSource).Hash
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
 if($Rebuild -or !(Test-Path $dilo)){
  $bands=@(0,215,400,574,795,1002,1200,1402);$cells=New-Object 'int[,]' 28,4;$source=Join-Path $inbox $sources[4]
  for($r=0;$r -lt 7;$r++){$boxes=[CombatArt]::Poses($source,$bands[$r],($bands[$r+1]-$bands[$r]),4);for($c=0;$c -lt 4;$c++){$i=$r*4+$c;$b=$boxes[$c];$cells[$i,0]=$b.X;$cells[$i,1]=$b.Y;$cells[$i,2]=$b.Width;$cells[$i,3]=$b.Height}}
  [CombatArt]::Atlas($source,$dilo,$cells,128,128,4,116,92,$true)
 }
 if($Rebuild -or !(Test-Path $anky)){
  $cells=New-Object 'int[,]' 32,4
  $rows=@(@(0,175,80,265,440,615,800),@(350,140,25,295,540,775,1030),@(490,150,20,270,515,755,1020),@(175,175,80,265,440,615,800))
  for($r=0;$r -lt 8;$r++){for($c=0;$c -lt 4;$c++){$s=$rows[$r%4];$i=$r*4+$c;$cells[$i,0]=$s[$c+2];$cells[$i,1]=$s[0];$cells[$i,2]=$s[$c+3]-$s[$c+2];$cells[$i,3]=$s[1]}}
  [CombatArt]::Atlas((Join-Path $inbox $sources[5]),$anky,$cells,128,128,4,116,92)
 }
 if($Rebuild -or !(Test-Path $grenade)){
  $cells=New-Object 'int[,]' 8,4
  for($r=0;$r -lt 2;$r++){for($c=0;$c -lt 4;$c++){$i=$r*4+$c;$left=[int][Math]::Floor($c*443.5);$cells[$i,0]=$left;$cells[$i,1]=$r*443;$cells[$i,2]=[Math]::Min(444,(1774-$left));$cells[$i,3]=443}}
  [CombatArt]::Atlas((Join-Path $inbox $sources[6]),$grenade,$cells,64,64,4,56,56)
 }
 if($Rebuild -or !(Test-Path $grenadeIcon)){
  $cells=New-Object 'int[,]' 1,4;$cells[0,0]=0;$cells[0,1]=0;$cells[0,2]=443;$cells[0,3]=443
  [CombatArt]::Atlas((Join-Path $inbox $sources[6]),$grenadeIcon,$cells,64,64,1,48,52)
 }
 foreach($dog in @(@('barney','Barney Sprites.png'),@('rosie','Rosie Sprites.png'))){
  $output=Join-Path $assets ('companions\'+$dog[0]+'-poses.png')
  if($Rebuild -or !(Test-Path $output)){
   $source=Join-Path $inbox $dog[1]
   $cells=New-Object 'int[,]' 5,4
   for($i=0;$i -lt 5;$i++){
    $cells[$i,0]=@(0,362,0,0,362)[$i];$cells[$i,1]=@(1650,1650,1778,1900,1900)[$i];$cells[$i,2]=362;$cells[$i,3]=@(128,128,138,116,116)[$i]
   }
   [CombatArt]::Atlas($source,$output,$cells,64,64,5,40,30,$true)
  }
 }
 if($Rebuild -or !(Test-Path $jeff)){Copy-Item -LiteralPath $jeffSource -Destination $jeff}
}
[CombatArt]::Validate($compy,64,64,4,6);[CombatArt]::Validate($towel,96,64,8,1)
[CombatArt]::Validate($burger,64,64,1,1);[CombatArt]::Validate($bus,256,128,5,1)
[CombatArt]::Validate($dilo,128,128,4,7);[CombatArt]::Validate($anky,128,128,4,8)
[CombatArt]::Validate($grenade,64,64,4,2);[CombatArt]::Validate($grenadeIcon,64,64,1,1)
foreach($dog in @('barney','rosie')){[CombatArt]::Validate((Join-Path $assets ('companions\'+$dog+'-poses.png')),64,64,5,1)}
[CombatArt]::Validate($jeff,64,64,4,8)
if((Get-FileHash $jeffSource).Hash -ne $jeffHash){throw 'Original Jeff sheet changed during processing.'}
if((Get-FileHash $jeff).Hash -ne $jeffHash){throw 'V6 Jeff does not match the supplied cleaned sheet; use -Rebuild to intentionally refresh derivatives.'}
foreach($name in $sources){if((Get-FileHash -LiteralPath (Join-Path $inbox $name)).Hash -ne $hashes[$name]){throw "Original changed during processing: $name"}}
Write-Output 'Source hashes unchanged. Existing processed art is preserved unless -Rebuild is explicit.'
