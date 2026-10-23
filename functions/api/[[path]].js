import { validateContent, publicContent } from '../../lib/content-schema.js';
const json = (body,status=200,headers={}) => Response.json(body,{status,headers:{'Cache-Control':'no-store',...headers}});
const digest = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');
async function equal(a,b) { const x=await digest(a), y=await digest(b); let diff=0; for(let i=0;i<x.length;i++) diff|=x.charCodeAt(i)^y.charCodeAt(i); return diff===0; }
async function authorized(request,db) {
 const token = request.headers.get('Cookie')?.match(/(?:^|;\s*)academy_session=([a-f0-9]{64})(?:;|$)/)?.[1];
 if (!token) return false;
 return !!await db.prepare('SELECT token FROM sessions WHERE token = ? AND expires > ?').bind(await digest(token),Date.now()).first();
}
async function body(request) {
 const raw=await request.text();
 if(raw.length>500000) throw new Error('Content is too large.');
 return JSON.parse(raw);
}
async function record(db,id) {return db.prepare('SELECT body, version, updated_at FROM content WHERE id = ?').bind(id).first();}
export async function onRequest({request,env,params}) {
 const path = Array.isArray(params.path) ? params.path.join('/') : params.path || '';
 const method=request.method;
 try {
  if(path.startsWith('media/') && method==='GET') {
   const key=path.slice(6);
   if(!/^[a-zA-Z0-9.-]+$/.test(key)) return json({error:'Image not found.'},404);
   if(env.MEDIA) {
    const object=await env.MEDIA.get(key);
    if(object) return new Response(object.body,{headers:{'Content-Type':object.httpMetadata?.contentType || 'application/octet-stream','Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});
   }
   if(!env.DB) return json({error:'Image not found.'},404);
   const media=await env.DB.prepare('SELECT content_type, byte_length, chunk_count FROM uploaded_media WHERE id=?').bind(key).first();
   if(!media) return json({error:'Image not found.'},404);
   let index=0;
   const stream=new ReadableStream({async pull(controller) {
    if(index>=media.chunk_count) {controller.close();return;}
    const chunk=await env.DB.prepare('SELECT data FROM media_chunks WHERE media_id=? AND part=?').bind(key,index++).first();
    if(!chunk) {controller.error(new Error('Image data unavailable.'));return;}
    controller.enqueue(new Uint8Array(chunk.data));
   }});
   return new Response(stream,{headers:{'Content-Type':media.content_type,'Content-Length':String(media.byte_length),'Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});
  }
  if(path==='content' && method==='GET') {
   if(!env.DB) return json({content:null});
   const row=await record(env.DB,'published');
   return json({content:row ? publicContent(JSON.parse(row.body)) : null});
  }
  if(!env.DB) return json({error:'The content database is not connected. See README setup instructions.'},503);
  if(method!=='GET') {
   if(request.headers.get('Origin') !== new URL(request.url).origin) return json({error:'Invalid request origin.'},403);
  }
  if(path==='login' && method==='POST') {
   if(!env.ADMIN_PASSWORD || env.ADMIN_PASSWORD.length<16) return json({error:'Owner login is not configured. Set a strong ADMIN_PASSWORD secret of at least 16 characters.'},503);
   const ip=request.headers.get('CF-Connecting-IP') || 'local';
   const now=Date.now();
   await env.DB.prepare('DELETE FROM login_attempts WHERE reset_at < ?').bind(now).run();
   await env.DB.prepare('DELETE FROM sessions WHERE expires < ?').bind(now).run();
   await env.DB.prepare('INSERT INTO login_attempts (ip, attempts, reset_at) VALUES (?,1,?) ON CONFLICT(ip) DO UPDATE SET attempts=attempts+1').bind(ip,now+15*60*1000).run();
   const attempt=await env.DB.prepare('SELECT attempts FROM login_attempts WHERE ip=?').bind(ip).first();
   if(attempt.attempts>5) return json({error:'Too many attempts. Please wait 15 minutes.'},429);
   const input=await body(request);
   if(typeof input.password!=='string' || !await equal(input.password,env.ADMIN_PASSWORD)) return json({error:'Incorrect password.'},401);
   await env.DB.prepare('DELETE FROM login_attempts WHERE ip=?').bind(ip).run();
   const token=Array.from(crypto.getRandomValues(new Uint8Array(32))).map(x=>x.toString(16).padStart(2,'0')).join('');
   await env.DB.prepare('INSERT INTO sessions(token,expires) VALUES (?,?)').bind(await digest(token),now+8*60*60*1000).run();
   const secure=new URL(request.url).protocol==='https:' ? '; Secure' : '';
   return json({ok:true},200,{'Set-Cookie':`academy_session=${token}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=28800${secure}`});
  }
  if(!await authorized(request,env.DB)) return json({error:'Please sign in.'},401);
  if(path==='logout' && method==='POST') {
   const token=request.headers.get('Cookie').match(/academy_session=([a-f0-9]{64})/)[1];
   await env.DB.prepare('DELETE FROM sessions WHERE token=?').bind(await digest(token)).run();
   return json({ok:true},200,{'Set-Cookie':'academy_session=; Path=/api; HttpOnly; SameSite=Strict; Max-Age=0'});
  }
  if(path==='admin/content' && method==='GET') {
   const draft=await record(env.DB,'draft'), published=await record(env.DB,'published');
   return json({content:draft?JSON.parse(draft.body):null,version:draft?.version || 0,publishedAt:published?.updated_at || null});
  }
  if(path==='admin/content' && method==='PUT') {
   const input=await body(request), content=validateContent(input.content);
   const version=Number(input.version);
   if(!Number.isSafeInteger(version) || version<0) return json({error:'Invalid version.'},400);
   const stamp=new Date().toISOString(), serialized=JSON.stringify(content);
   let saved;
   if(version===0) saved=await env.DB.prepare('INSERT OR IGNORE INTO content(id,body,version,updated_at) VALUES (?,?,1,?)').bind('draft',serialized,stamp).run();
   else saved=await env.DB.prepare('UPDATE content SET body=?,version=version+1,updated_at=? WHERE id=? AND version=?').bind(serialized,stamp,'draft',version).run();
   if(!saved.meta.changes) return json({error:'Someone saved another version. Copy your changes, then reload before saving.'},409);
   return json({ok:true,version:version+1});
  }
  if(path==='admin/publish' && method==='POST') {
   const input=await body(request);
   const saved=await env.DB.prepare("INSERT INTO content(id,body,version,updated_at) SELECT 'published',body,version,? FROM content WHERE id='draft' AND version=? ON CONFLICT(id) DO UPDATE SET body=excluded.body,version=excluded.version,updated_at=excluded.updated_at").bind(new Date().toISOString(),input.version).run();
   if(!saved.meta.changes) return json({error:'Save the latest draft before publishing.'},409);
   return json({ok:true});
  }
  if(path==='admin/upload' && method==='POST') {
   if(Number(request.headers.get('Content-Length'))>5*1024*1024+10000) return json({error:'Images must be 5 MB or smaller.'},400);
   const data=await request.formData(), file=data.get('file');
   if(!file || typeof file.arrayBuffer!=='function' || file.size>5*1024*1024 || file.size===0) return json({error:'Choose an image up to 5 MB.'},400);
   const bytes=new Uint8Array(await file.arrayBuffer());
   let type='', extension='';
   if(bytes[0]===255 && bytes[1]===216 && bytes[2]===255) {type='image/jpeg';extension='jpg';}
   if([137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v)) {type='image/png';extension='png';}
   if(String.fromCharCode(...bytes.slice(0,4))==='RIFF' && String.fromCharCode(...bytes.slice(8,12))==='WEBP') {type='image/webp';extension='webp';}
   if(!type) return json({error:'Upload a JPG, PNG or WebP image.'},400);
   const key=`${crypto.randomUUID()}.${extension}`;
   if(env.MEDIA) await env.MEDIA.put(key,bytes,{httpMetadata:{contentType:type}});
   else {
    const chunkSize=256*1024, count=Math.ceil(bytes.length/chunkSize);
    const statements=[env.DB.prepare('INSERT INTO uploaded_media(id,content_type,byte_length,chunk_count,created_at) VALUES (?,?,?,?,?)').bind(key,type,bytes.length,count,new Date().toISOString())];
    for(let part=0;part<count;part++) statements.push(env.DB.prepare('INSERT INTO media_chunks(media_id,part,data) VALUES (?,?,?)').bind(key,part,bytes.slice(part*chunkSize,(part+1)*chunkSize).buffer));
    await env.DB.batch(statements);
   }
   return json({url:`/api/media/${key}`});
  }
  return json({error:'Not found.'},404);
 } catch(error) {
  if(error instanceof SyntaxError || /Invalid|must|maximum|required|Links|WhatsApp|Confirm|Enter|Each field|too large/.test(error.message)) return json({error:error.message},400);
  console.error('Academy API error:',error.message);
  return json({error:'The server could not complete this request. Check database setup and try again.'},500);
 }
}
