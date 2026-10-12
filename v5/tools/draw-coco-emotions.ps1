param([string]$PreviewPath)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
public static class CocoEmotionArt {
 static readonly Color Skin=ColorTranslator.FromHtml("#fca563");
 static readonly Color Light=ColorTranslator.FromHtml("#ffb073");
 static readonly Color Shade=ColorTranslator.FromHtml("#dc6128");
 static readonly Color Outline=ColorTranslator.FromHtml("#3a2018");
 static readonly Color Mouth=ColorTranslator.FromHtml("#451a18");
 static readonly Color Tongue=ColorTranslator.FromHtml("#e47772");
 static void Pixel(Bitmap b,int x,int y,Color c){b.SetPixel(x,y,c);}
 static void Box(Bitmap b,int x,int y,int w,int h,Color c){
  for(int a=x;a<x+w;a++)for(int v=y;v<y+h;v++)Pixel(b,a,v,c);
 }
 static void MouthPose(Bitmap b,int frame,bool surprise){
  Box(b,30,37,3,2,Skin);
  if(surprise){
   Pixel(b,31,37,Mouth);
   if(frame>0){
    Box(b,30,38,3,1,Mouth);Pixel(b,31,39,Tongue);
   }else Pixel(b,31,38,Mouth);
   Pixel(b,28,36,ColorTranslator.FromHtml("#e58768"));
   Pixel(b,35,36,ColorTranslator.FromHtml("#e58768"));
  }else if(frame==0){
   Pixel(b,31,38,ColorTranslator.FromHtml("#c66b4e"));
   Pixel(b,32,38,ColorTranslator.FromHtml("#c66b4e"));
  }else{
   Box(b,31,37,2,1,Mouth);
   if(frame==2){Box(b,30,38,3,1,Mouth);Pixel(b,31,38,Tongue);}
  }
 }
 static void RaisedHands(Bitmap b,int frame){
  // Retain the patterned dress; remove only the old lowered-arm silhouettes.
  for(int y=42;y<=48;y++)for(int x=22;x<=39;x++){
   if(x>25&&x<37)continue;
   var color=b.GetPixel(x,y);
   if(x==37&&(color.R-color.B<90||color.R-color.G<40))continue;
   Pixel(b,x,y,Color.Transparent);
  }
  int high=frame==0?1:0;
  for(int side=0;side<2;side++){
   for(int y=40;y<=42;y++){
    int x=side==0?24:37;
    Box(b,x,y,2,1,Outline);Pixel(b,side==0?25:37,y,Shade);
   }
   for(int y=37+high;y<=40+high;y++){
    int x=side==0?24:36;
    Box(b,x,y,3,1,Outline);
    Pixel(b,side==0?25:37,y,Skin);
   }
   Pixel(b,side==0?25:37,36+high,Outline);
   Pixel(b,side==0?25:37,37+high,Light);
   Pixel(b,side==0?26:36,38+high,Skin);
   Pixel(b,side==0?26:36,39+high,Light);
  }
 }
 static void WideEyes(Bitmap b,int frame){
  Pixel(b,28,32,Outline);Pixel(b,35,32,Outline);
  if(frame==2){
   Pixel(b,27,33,Outline);Pixel(b,28,33,Outline);
   Pixel(b,34,33,Outline);Pixel(b,35,33,Outline);
   Pixel(b,27,34,ColorTranslator.FromHtml("#fff0d9"));
   Pixel(b,28,34,Outline);
   Pixel(b,34,34,Outline);Pixel(b,35,34,ColorTranslator.FromHtml("#fff0d9"));
  }else{
   Pixel(b,27,33,ColorTranslator.FromHtml("#fff0d9"));
   Pixel(b,28,33,Outline);Pixel(b,29,33,Skin);
   Pixel(b,27,34,ColorTranslator.FromHtml("#fff0d9"));Pixel(b,28,34,Outline);
   Pixel(b,34,33,Outline);Pixel(b,35,33,ColorTranslator.FromHtml("#fff0d9"));
   Pixel(b,34,34,Outline);Pixel(b,35,34,ColorTranslator.FromHtml("#fff0d9"));
  }
 }
 static void Validate(Bitmap atlas,Bitmap source){
  for(int cell=0;cell<6;cell++){
   int left=cell%3*64,top=cell/3*64;
   for(int y=0;y<64;y++)for(int x=0;x<64;x++){
    Color pixel=atlas.GetPixel(left+x,top+y);
    if(y>=49&&pixel.ToArgb()!=source.GetPixel(64+x,y).ToArgb())throw new Exception("Feet or lower-body alignment changed.");
    if((x<19||x>41||y<20||y>59)&&pixel.A!=0)throw new Exception("Unexpected pixels outside the sprite silhouette.");
   }
   for(int earlier=0;earlier<cell;earlier++){
    bool different=false;
    for(int y=0;y<64&&!different;y++)for(int x=0;x<64;x++){
     if(atlas.GetPixel(left+x,top+y).ToArgb()!=atlas.GetPixel(earlier%3*64+x,earlier/3*64+y).ToArgb()){different=true;break;}
    }
    if(!different)throw new Exception("Duplicate expression frame.");
   }
  }
 }
 public static void Draw(string source,string destination,string preview){
  using(var sheet=new Bitmap(source)){
   if(sheet.Width!=256||sheet.Height!=256)throw new Exception("Unexpected Coco walking-sheet dimensions.");
   using(var atlas=new Bitmap(192,128,PixelFormat.Format32bppArgb)){
    for(int row=0;row<2;row++)for(int frame=0;frame<3;frame++){
     using(var cell=sheet.Clone(new Rectangle(64,0,64,64),PixelFormat.Format32bppArgb)){
      if(row==1){RaisedHands(cell,frame);WideEyes(cell,frame);}
      MouthPose(cell,frame,row==1);
      for(int y=0;y<64;y++)for(int x=0;x<64;x++)atlas.SetPixel(frame*64+x,row*64+y,cell.GetPixel(x,y));
     }
    }
    Validate(atlas,sheet);atlas.Save(destination,ImageFormat.Png);
    if(!String.IsNullOrEmpty(preview)){
     using(var contact=new Bitmap(960,740,PixelFormat.Format32bppArgb))
     using(var g=Graphics.FromImage(contact))
     using(var font=new Font("Consolas",14,FontStyle.Bold)){
      g.Clear(ColorTranslator.FromHtml("#16233c"));
      g.InterpolationMode=InterpolationMode.NearestNeighbor;g.PixelOffsetMode=PixelOffsetMode.Half;
      for(int row=0;row<2;row++)for(int frame=0;frame<3;frame++){
       int x=frame*320,y=row*370;
       g.DrawString((row==0?"TALK":"SURPRISED")+" / "+(frame+1),font,Brushes.LightGoldenrodYellow,x+15,y+10);
       g.DrawImage(atlas,new Rectangle(x,y+34,320,320),new Rectangle(frame*64,row*64,64,64),GraphicsUnit.Pixel);
      }
      contact.Save(preview,ImageFormat.Png);
     }
    }
   }
  }
 }
}
'@
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$source = Join-Path $root 'assets\characters\coco\sheets\walk_4dir.png'
$destination = Join-Path $root 'v5\assets\characters\coco-emotions.png'
New-Item -ItemType Directory -Force -Path (Split-Path $destination -Parent) | Out-Null
[CocoEmotionArt]::Draw($source, $destination, $PreviewPath)
Write-Output "Created $destination (192x128; 64x64 cells; talking then surprised)."
