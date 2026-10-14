const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..','..'),selected=name=>!process.env.V8_TEST_SUITES||process.env.V8_TEST_SUITES.split(',').includes(name);
const server=http.createServer((req,res)=>{
 try{
  let url=decodeURIComponent(req.url.split('?')[0]);if(url.endsWith('/'))url+='index.html';
  const file=path.resolve(root,'.'+url);if(!file.startsWith(root+path.sep))throw new Error('Invalid path');
  res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.html':'text/html','.json':'application/json','.webmanifest':'application/manifest+json'})[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
 }catch(error){res.statusCode=404;res.end(error.message);}
});
function check(name){return new Function('require',fs.readFileSync(path.join(__dirname,name+'-checks.js'),'utf8'))(require);}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
  for(const options of [{width:1280,height:900},{width:390,height:844,touch:true},{width:844,height:390,touch:true}]
   .filter(o=>!process.env.V8_TEST_LAYOUTS||process.env.V8_TEST_LAYOUTS.split(',').includes(o.width+'x'+o.height))){
   const context=await browser.newContext({viewport:{width:options.width,height:options.height},hasTouch:!!options.touch,isMobile:!!options.touch});
   try{
    const page=await context.newPage();await page.goto((process.env.V8_TEST_ORIGIN||'http://127.0.0.1:'+server.address().port)+'/v8/');
    const storyPattern='**/v8/src/story-events.js*';
    await page.route(storyPattern,async route=>{
     const response=await route.fetch(),source=await response.text();
     await route.fulfill({response,body:source.replace('const completed=new Set();',"const completed=new Set(['awakening','connor','family','montage']);").replace('started=false','started=true')+'\nV5_EVENTS.check=()=>{};\n'});
    });
    const config={...options,artifactDir:process.env.V8_ARTIFACT_DIR};
    if(selected('world'))console.log(JSON.stringify(await check('world')(page,config)));
    if(selected('hawaii'))console.log(JSON.stringify(await check('hawaii')(page,config)));
    if(selected('scenes'))console.log(JSON.stringify(await check('scenes')(page,config)));
    if(selected('music'))console.log(JSON.stringify(await check('music')(page,config)));
    if(selected('studio')&&!options.touch)console.log(JSON.stringify(await check('studio')(page,config)));
    if(selected('danger'))console.log(JSON.stringify(await check('danger')(page,config)));
    await page.unroute(storyPattern);
    if(selected('combat'))console.log(JSON.stringify(await check('combat')(page,config)));
   }finally{await context.close();}
  }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
