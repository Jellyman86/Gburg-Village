const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..','..');
const selected=name=>!process.env.V6_TEST_SUITES||process.env.V6_TEST_SUITES.split(',').includes(name);
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
  const openingCheck=new Function(fs.readFileSync(path.join(__dirname,'opening-checks.js'),'utf8'))();
  const emotionCheck=new Function(fs.readFileSync(path.join(__dirname,'emotion-checks.js'),'utf8'))();
  const combatCheck=new Function(fs.readFileSync(path.join(__dirname,'combat-checks.js'),'utf8'))();
  const dangerCheck=new Function(fs.readFileSync(path.join(__dirname,'danger-checks.js'),'utf8'))();
  for(const options of [
   {width:1280,height:900,cinema:true},
   {width:390,height:844,touch:true},
   {width:844,height:390,touch:true}
  ].filter(options=>!process.env.V6_TEST_LAYOUTS||process.env.V6_TEST_LAYOUTS.split(',').includes(`${options.width}x${options.height}`))){
   const context=await browser.newContext({viewport:{width:options.width,height:options.height},hasTouch:!!options.touch,isMobile:!!options.touch});
   try{
    const page=await context.newPage();
    if(process.env.V6_TEST_ORIGINAL_STAGING==='1')await page.route('**/v6/data/scene-edits.json*',route=>route.fulfill({json:{version:1,scenes:{}}}));
    await page.goto(`http://127.0.0.1:${server.address().port}/v6/`);
    // Core regression fixtures begin after the opening; the chapter suite below uses real story state.
    const storyPattern='**/v6/src/story-events.js*';
    await page.route(storyPattern,async route=>{
     const response=await route.fetch(),source=await response.text();
     await route.fulfill({response,body:source.replace('const completed=new Set();',"const completed=new Set(['awakening','connor','family','montage']);")
      .replace('started=false','started=true')+"\nV5_EVENTS.check=()=>{};\n"});
    });
    if(selected('core'))console.log(JSON.stringify(await check(page,options)));
    if(selected('display'))console.log(JSON.stringify(await displayCheck(page,options)));
    if(selected('recreation'))console.log(JSON.stringify(await recreationCheck(page,{screenshotPath:process.env.V4_ARTIFACT_DIR?path.join(process.env.V4_ARTIFACT_DIR,`recreation-${options.width}x${options.height}.png`):undefined})));
    if(selected('content'))console.log(JSON.stringify(await contentCheck(page,{touch:options.touch,artifactDir:process.env.V4_ARTIFACT_DIR})));
    if(selected('intro'))console.log(JSON.stringify(await introCheck(page,{...options,artifactDir:process.env.V4_ARTIFACT_DIR})));
    if(selected('navigation'))console.log(JSON.stringify(await navigationCheck(page,{...options,artifactDir:process.env.V4_ARTIFACT_DIR})));
    if(selected('danger'))console.log(JSON.stringify(await dangerCheck(page,{...options,artifactDir:process.env.V4_ARTIFACT_DIR})));
    await page.unroute(storyPattern);
    if(selected('opening'))console.log(JSON.stringify(await openingCheck(page,{...options,artifactDir:process.env.V4_ARTIFACT_DIR})));
    if(selected('chapter'))console.log(JSON.stringify(await chapterCheck(page,{...options,artifactDir:process.env.V4_ARTIFACT_DIR})));
    if(selected('emotions'))console.log(JSON.stringify(await emotionCheck(page,{...options,artifactDir:process.env.V4_ARTIFACT_DIR})));
    if(selected('combat'))console.log(JSON.stringify(await combatCheck(page,{...options,artifactDir:process.env.V4_ARTIFACT_DIR})));
   }finally{await context.close();}
  }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
