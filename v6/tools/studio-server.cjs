const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),vm=require('node:vm');
const edits=require('..\\src\\scene-edits.js');
function createStudioServer({root=path.resolve(__dirname,'..','..'),dataPath=path.join(root,'v6','data','scene-edits.json')}={}){
 const context={window:null};context.window=context;vm.createContext(context);
 for(const file of ['action-art','characters','gary-finale','banquet-finale','cinema-catalog']){
  vm.runInContext(fs.readFileSync(path.join(root,'v6','src',file+'.js'),'utf8'),context,{filename:file+'.js'});
 }
 const token=crypto.randomBytes(24).toString('hex'),hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
 const read=()=>{
  const bytes=fs.readFileSync(dataPath),data=JSON.parse(bytes.toString('utf8'));
  edits.validate(data,context.V5_CINEMA_CATALOG.catalog,context.CHARACTERS);
  return {data,revision:hash(bytes)};
 };
 read();
 function reply(res,status,data){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
 const server=http.createServer(async(req,res)=>{
  const expected='127.0.0.1:'+server.address().port;
  if(req.headers.host!==expected){reply(res,403,{error:'Use the studio URL printed by the launcher.'});return;}
  if(req.headers.origin&&req.headers.origin!=='http://'+expected){reply(res,403,{error:'Cross-origin studio requests are not allowed.'});return;}
  try{
   const url=new URL(req.url,'http://'+expected);
   if(url.pathname==='/api/studio'){
    if(req.method==='GET'){reply(res,200,{...read(),token});return;}
    if(req.method!=='POST'){reply(res,405,{error:'Use GET or POST.'});return;}
    if(req.headers.origin!=='http://'+expected||req.headers['x-studio-token']!==token||req.headers['content-type']!=='application/json'){
     reply(res,403,{error:'Save requires the local studio page and its session token.'});return;
    }
    const chunks=[];let size=0;
    for await(const chunk of req){size+=chunk.length;if(size>131072){reply(res,413,{error:'Scene settings exceed 128 KB.'});return;}chunks.push(chunk);}
    const body=Buffer.concat(chunks).toString('utf8');
    let request;
    try{
     request=JSON.parse(body);
     if(!request||typeof request.revision!=='string')throw new Error('A saved revision is required.');
     edits.validate(request.data,context.V5_CINEMA_CATALOG.catalog,context.CHARACTERS);
    }catch(error){reply(res,400,{error:error.message});return;}
    const previous=read();
    if(previous.revision!==request.revision){reply(res,409,{error:'Scene settings changed on disk. Export your draft, then reload saved settings before saving again.'});return;}
    const bytes=JSON.stringify(request.data,null,2)+'\n',temporary=dataPath+'.'+crypto.randomBytes(8).toString('hex')+'.tmp';
    try{
     fs.writeFileSync(temporary,bytes,{flag:'wx'});
     fs.renameSync(temporary,dataPath);
    }finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
    console.log('Saved V6 scene settings at '+new Date().toISOString());
    reply(res,200,{data:request.data,revision:hash(bytes)});return;
   }
   if(req.method!=='GET'&&req.method!=='HEAD'){reply(res,405,{error:'Static files are read-only.'});return;}
   let relative=decodeURIComponent(url.pathname).replace(/^\/+/,'');
   if(!relative)relative='v6/studio/';
   if(relative.endsWith('/'))relative+='index.html';
   const file=path.resolve(root,...relative.split('/')),inside=file.startsWith(root+path.sep);
   const allowed=/^(v6\/(?!tools\/|tests\/)|assets\/|v[2345]\/assets\/)/.test(relative);
   if(!inside||!allowed||relative.includes('\\')||relative.split('/').some(part=>part.startsWith('.'))){reply(res,403,{error:'That file is outside the studio runtime.'});return;}
   let bytes;
   try{bytes=fs.readFileSync(relative==='v6/data/scene-edits.json'?dataPath:file);}catch(error){if(error.code==='ENOENT'||error.code==='EISDIR'){reply(res,404,{error:'File not found.'});return;}throw error;}
   const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'};
   res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
   res.end(req.method==='HEAD'?undefined:bytes);
  }catch(error){console.error('Studio request failed:',error);if(!res.headersSent)reply(res,500,{error:'Studio request failed: '+error.message});else res.end();}
 });
 return server;
}
if(require.main===module){
 const port=Number(process.env.GBURG_STUDIO_PORT||5176);
 if(!Number.isInteger(port)||port<1||port>65535)throw new Error('GBURG_STUDIO_PORT must be between 1 and 65535.');
 const server=createStudioServer();
 server.on('error',error=>{console.error('Could not start Gburg Studio:',error.message);process.exitCode=1;});
 server.listen(port,'127.0.0.1',()=>console.log('Gburg Studio: http://127.0.0.1:'+port+'/v6/studio/\nKeep this terminal open. Save writes only v6\\data\\scene-edits.json; publishing remains a separate step.'));
}
module.exports={createStudioServer};
