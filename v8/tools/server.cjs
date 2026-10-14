const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..','..'),port=Number(process.env.GBURG_V8_PORT||5180);
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid GBURG_V8_PORT');
const server=http.createServer((req,res)=>{
 try{
  let name=decodeURIComponent(req.url.split('?')[0]);if(name.endsWith('/'))name+='index.html';
  const file=path.resolve(root,'.'+name);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end('Read-only game server');return;}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');
  res.setHeader('Cache-Control','no-cache');
  const content=fs.readFileSync(file);res.end(req.method==='HEAD'?undefined:content);
 }catch(error){
  if(error.code==='ENOENT'){res.writeHead(404);res.end('Not found');return;}
  console.error('V8 local request failed:',error);res.writeHead(500);res.end('Could not read this game file');
 }
});
server.on('error',error=>{console.error('V8 server failed:',error);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log('V8 ready: http://127.0.0.1:'+port+'/v8/ (read-only)'));
