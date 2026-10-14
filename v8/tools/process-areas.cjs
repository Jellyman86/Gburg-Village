const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright');
const root=path.resolve(__dirname,'..','..'),v8=path.resolve(__dirname,'..');
const defs=require(path.resolve(process.argv.find(a=>a.startsWith('--defs='))?.slice(7)||path.join(v8,'src','hawaii.js'))).defs;
const check=process.argv.includes('--check'),rebuild=process.argv.includes('--rebuild');
const manifest=path.join(v8,'data','area-art.json'),previous=fs.existsSync(manifest)?JSON.parse(fs.readFileSync(manifest,'utf8')):{};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
 try{
  const page=await browser.newPage(),results={...previous};
  for(const def of defs){
   const source=path.join(root,'art inbox',def.source),output=path.resolve(v8,def.image),bytes=fs.readFileSync(source),sourceHash=hash(bytes);
   if(!output.startsWith(path.join(v8,'assets','scenes')+path.sep))throw new Error('Area output must stay in V8 scene assets');
   if(check&&!fs.existsSync(output))throw new Error('Missing derivative: '+def.id);
   const input=check?fs.readFileSync(output):bytes;
   const result=await page.evaluate(async({base64,mime,width,height,encode})=>{
    const img=new Image();img.src='data:'+mime+';base64,'+base64;await img.decode();
    if(img.naturalWidth!==width||img.naturalHeight!==height)throw new Error('Area image dimension mismatch');
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);
    if(!ctx.getImageData(width/2,height/2,1,1).data[3])throw new Error('Empty area center');
    if(!encode)return {width,height};
    const url=canvas.toDataURL('image/webp',.95);
    if(!url.startsWith('data:image/webp;'))throw new Error('WebP encoding unavailable');
    return {width,height,base64:url.split(',')[1]};
   },{base64:input.toString('base64'),mime:check?'image/webp':'image/png',width:def.width,height:def.height,encode:!check});
   if(check){
    if(previous[def.id]?.sourceHash!==sourceHash||previous[def.id]?.outputHash!==hash(input))throw new Error('Art provenance mismatch: '+def.id);
   }else{
    const processed=Buffer.from(result.base64,'base64');
    if(fs.existsSync(output)&&!rebuild&&hash(fs.readFileSync(output))!==hash(processed))throw new Error('Derivative differs; review before --rebuild: '+def.id);
    fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,processed);
    results[def.id]={source:def.source,sourceHash,output:def.image,outputHash:hash(processed),width:result.width,height:result.height};
   }
   if(hash(fs.readFileSync(source))!==sourceHash)throw new Error('Original changed: '+def.id);
   console.log((check?'PASS ':'Imported ')+def.id);
  }
  if(!check)fs.writeFileSync(manifest,JSON.stringify(results,null,2)+'\n');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
