#!/usr/bin/env node
// Gburg Studio server: serves the repository read-only on localhost and accepts document saves from the studio pages.
//   npm run studio   →  http://127.0.0.1:5181/v8/studio/
// Every editable document is registered below with its data file, a validator and a build step. Saves write only
// those files (atomically, with a revision check) and then regenerate the derived src/*-data.js file.
'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');

const root=path.resolve(__dirname,'..'),port=Number(process.env.GBURG_STUDIO_PORT||5181);
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('GBURG_STUDIO_PORT must be between 1 and 65535.');
const token=crypto.randomBytes(24).toString('hex');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg'};
// Reload a tool module on every use so a long-running studio never validates against stale scene or art definitions.
const fresh=name=>{const file=path.join(__dirname,name);delete require.cache[require.resolve(file)];return require(file);};

const documents={
 geometry:{
  path:require('./geometry.cjs').dataPath,label:'v8/data/scene-geometry.json',
  validate(data){const tool=fresh('geometry.cjs'),context=tool.loadScenes();context.V8_GEOMETRY.validate(data,context.SCENES);},
  build(){fresh('geometry.cjs').build({quiet:true});},
  summary:data=>Object.keys(data.scenes).length+' scene override(s)'
 },
 sprites:{
  path:require('./sprites.cjs').dataPath,label:'v8/data/sprites.json',
  validate(data){fresh('sprites.cjs').validate(data);},
  build(){fresh('sprites.cjs').build({quiet:true});},
  summary:data=>Object.keys(data.characters).length+' character(s)'
 }
};
const describe=()=>Object.fromEntries(Object.entries(documents).map(([name,doc])=>[name,{label:doc.label}]));
const read=doc=>{const bytes=fs.readFileSync(doc.path);return {data:JSON.parse(bytes.toString('utf8')),revision:hash(bytes)};};
function reply(res,status,data){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));}

async function saveDocument(req,res,name,doc,expected){
 if(req.headers.origin!=='http://'+expected||req.headers['x-studio-token']!==token||req.headers['content-type']!=='application/json'){reply(res,403,{error:'Save requires the local studio page and its session token.'});return;}
 const chunks=[];let size=0;
 for await(const chunk of req){size+=chunk.length;if(size>8*1024*1024){reply(res,413,{error:'Document exceeds 8 MB.'});return;}chunks.push(chunk);}
 let request;
 try{
  request=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if(!request||typeof request.revision!=='string')throw new Error('A saved revision is required.');
  doc.validate(request.data);
 }catch(error){reply(res,400,{error:error.message});return;}
 if(read(doc).revision!==request.revision){reply(res,409,{error:doc.label+' changed on disk since you loaded it. Copy your JSON, reload the studio, then save again.'});return;}
 const bytes=JSON.stringify(request.data,null,1)+'\n',temporary=doc.path+'.'+crypto.randomBytes(8).toString('hex')+'.tmp';
 try{fs.writeFileSync(temporary,bytes,{flag:'wx'});fs.renameSync(temporary,doc.path);}
 finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
 doc.build();
 console.log(`Saved ${name} (${doc.summary(request.data)}) → ${doc.label} at ${new Date().toLocaleTimeString()}`);
 reply(res,200,{data:request.data,revision:hash(bytes)});
}

const server=http.createServer(async(req,res)=>{
 const expected='127.0.0.1:'+port;
 try{
  if(req.headers.host!==expected){reply(res,403,{error:'Use the studio URL printed by the launcher.'});return;}
  if(req.headers.origin&&req.headers.origin!=='http://'+expected){reply(res,403,{error:'Cross-origin studio requests are not allowed.'});return;}
  const url=new URL(req.url,'http://'+expected);
  if(url.pathname==='/api/studio'){reply(res,200,{documents:describe(),token});return;}
  const match=/^\/api\/doc\/([a-z-]+)$/.exec(url.pathname);
  if(match){
   const name=match[1],doc=documents[name];
   if(!doc){reply(res,404,{error:'Unknown studio document: '+name+'. Known: '+Object.keys(documents).join(', ')});return;}
   if(req.method==='GET'){reply(res,200,{...read(doc),token,label:doc.label});return;}
   if(req.method!=='POST'){reply(res,405,{error:'Use GET or POST.'});return;}
   await saveDocument(req,res,name,doc,expected);return;
  }
  if(req.method!=='GET'&&req.method!=='HEAD'){reply(res,405,{error:'Static files are read-only.'});return;}
  let name=decodeURIComponent(url.pathname);if(name.endsWith('/'))name+='index.html';
  const file=path.resolve(root,'.'+name);
  if(!file.startsWith(root+path.sep)||name.split('/').some(part=>part.startsWith('.'))){reply(res,403,{error:'Forbidden'});return;}
  let bytes;
  try{bytes=fs.readFileSync(file);}catch(error){if(error.code==='ENOENT'||error.code==='EISDIR'){res.writeHead(404);res.end('Not found');return;}throw error;}
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});
  res.end(req.method==='HEAD'?undefined:bytes);
 }catch(error){console.error('Studio request failed:',error);if(!res.headersSent)reply(res,500,{error:error.message});else res.end();}
});
server.on('error',error=>{console.error('Could not start Gburg Studio:',error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`Gburg Studio: http://127.0.0.1:${port}/v8/studio/\nGame preview:  http://127.0.0.1:${port}/v8/\nKeep this window open. Save writes ${Object.values(documents).map(d=>d.label).join(' / ')}; commit and push to publish.`));
