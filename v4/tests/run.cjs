const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..','..');
const server=http.createServer((req,res)=>{
 try{
  let url=decodeURIComponent(req.url.split('?')[0]);if(url.endsWith('/'))url+='index.html';
  const file=path.resolve(root,'.'+url);
  if(!file.startsWith(root+path.sep))throw new Error('Invalid path');
  const types={'.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.html':'text/html','.webmanifest':'application/manifest+json'};
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
 }catch(error){res.statusCode=404;res.end(error.message);}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
  const check=new Function(fs.readFileSync(path.join(__dirname,'checks.js'),'utf8'))();
  const displayCheck=new Function(fs.readFileSync(path.join(__dirname,'display-checks.js'),'utf8'))();
  const recreationCheck=new Function(fs.readFileSync(path.join(__dirname,'recreation-checks.js'),'utf8'))();
  const contentCheck=new Function(fs.readFileSync(path.join(__dirname,'content-checks.js'),'utf8'))();
  const introCheck=new Function(fs.readFileSync(path.join(__dirname,'intro-checks.js'),'utf8'))();
  const chapterCheck=new Function(fs.readFileSync(path.join(__dirname,'chapter-checks.js'),'utf8'))();
  const navigationCheck=new Function(fs.readFileSync(path.join(__dirname,'navigation-checks.js'),'utf8'))();
  for(const options of [
   {width:1280,height:900,cinema:true},
   {width:390,height:844,touch:true},
   {width:844,height:390,touch:true}
  ]){
   const context=await browser.newContext({viewport:{width:options.width,height:options.height},hasTouch:!!options.touch,isMobile:!!options.touch});
   try{
    const page=await context.newPage();await page.goto(`http://127.0.0.1:${server.address().port}/v4/`);
    console.log(JSON.stringify(await check(page,options)));
    console.log(JSON.stringify(await displayCheck(page,options)));
    console.log(JSON.stringify(await recreationCheck(page,{screenshotPath:process.env.V4_ARTIFACT_DIR?path.join(process.env.V4_ARTIFACT_DIR,`recreation-${options.width}x${options.height}.png`):undefined})));
    console.log(JSON.stringify(await contentCheck(page,{touch:options.touch,artifactDir:process.env.V4_ARTIFACT_DIR})));
    console.log(JSON.stringify(await introCheck(page,{...options,artifactDir:process.env.V4_ARTIFACT_DIR})));
    console.log(JSON.stringify(await chapterCheck(page,{...options,artifactDir:process.env.V4_ARTIFACT_DIR})));
    console.log(JSON.stringify(await navigationCheck(page,{...options,artifactDir:process.env.V4_ARTIFACT_DIR})));
   }finally{await context.close();}
  }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
