const iterations=100000;
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const bytes=value=>Uint8Array.from(value.match(/.{2}/g),b=>parseInt(b,16));
const text=value=>new TextEncoder().encode(value);
function same(a,b){if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
async function derive(password,salt,count){
 const key=await crypto.subtle.importKey('raw',text(password),'PBKDF2',false,['deriveBits']);
 return hex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:bytes(salt),iterations:count,hash:'SHA-256'},key,256)));
}
export async function credential(db){return await db.prepare('SELECT salt,password_hash,iterations,version FROM owner_credentials WHERE id=1').first();}
export async function verifyPassword(password,saved,bootstrap){
 if(typeof password!=='string' || password.length>128)return false;
 if(saved){
  if(!/^[a-f0-9]{32}$/.test(saved.salt) || !/^[a-f0-9]{64}$/.test(saved.password_hash) || saved.iterations!==iterations)return false;
  return same(await derive(password,saved.salt,saved.iterations),saved.password_hash);
 }
 if(!bootstrap || bootstrap.length<16)return false;
 const hash=async value=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',text(value))));
 return same(await hash(password),await hash(bootstrap));
}
export async function makeCredential(password){
 const salt=hex(crypto.getRandomValues(new Uint8Array(16)));
 return {salt,password_hash:await derive(password,salt,iterations),iterations};
}
export async function allowAttempt(db,key){
 const now=Date.now();
 await db.prepare('DELETE FROM login_attempts WHERE reset_at < ?').bind(now).run();
 await db.prepare('INSERT INTO login_attempts (ip,attempts,reset_at) VALUES (?,1,?) ON CONFLICT(ip) DO UPDATE SET attempts=attempts+1').bind(key,now+15*60*1000).run();
 const attempt=await db.prepare('SELECT attempts FROM login_attempts WHERE ip=?').bind(key).first();
 return attempt.attempts<=5;
}
