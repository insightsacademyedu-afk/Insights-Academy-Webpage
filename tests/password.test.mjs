import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import {JSDOM,VirtualConsole} from 'jsdom';
import {onRequest} from '../functions/api/[[path]].js';
import {settingsFields,collections,validateContent} from '../lib/content-schema.js';
const schema=await readFile(new URL('../schema.sql',import.meta.url),'utf8');
const bootstrap='initial-owner-bootstrap-password';
const chosen='my own memorable academy password';
function setup(){
 const sqlite=new DatabaseSync(':memory:');sqlite.exec(schema);
 const DB={prepare(sql){return {async first(){return sqlite.prepare(sql).get() || null;},bind(...values){return {
  async first(){return sqlite.prepare(sql).get(...values) || null;},
  async run(){const result=sqlite.prepare(sql).run(...values);return {meta:{changes:Number(result.changes)}};}
 };}};},async batch(statements){sqlite.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());sqlite.exec('COMMIT');return result;}catch(error){sqlite.exec('ROLLBACK');throw error;}}};
 let env={DB,ADMIN_PASSWORD:bootstrap};
 async function call(path,method='GET',data,cookie=''){
  return onRequest({env,params:{path:path.split('/')},request:new Request('https://academy.test/api/'+path,{method,headers:{Origin:'https://academy.test',Cookie:cookie},...(data?{body:JSON.stringify(data)}:{})})});
 }
 async function login(password=bootstrap){const r=await call('login','POST',{password});assert.equal(r.status,200);return r.headers.get('set-cookie').split(';')[0];}
 return {sqlite,DB,call,login,withoutBootstrap(){delete env.ADMIN_PASSWORD;}};
}
test('owner can choose a password; bootstrap password and every existing session are revoked',async()=>{
 const f=setup();try{
  const first=await f.login(),second=await f.login();
  const response=await f.call('admin/password','POST',{currentPassword:bootstrap,newPassword:chosen,confirmPassword:chosen},first);
  assert.equal(response.status,200);assert.ok(response.headers.get('set-cookie').includes('Max-Age=0'));
  const saved=f.sqlite.prepare('SELECT * FROM owner_credentials').get();assert.equal(saved.password_hash.length,64);assert.equal(saved.salt.length,32);assert.equal(saved.version,1);assert.ok(!JSON.stringify(saved).includes(chosen));
  assert.equal((await f.call('admin/content','GET',null,first)).status,401);assert.equal((await f.call('admin/content','GET',null,second)).status,401);
  assert.equal((await f.call('login','POST',{password:bootstrap})).status,401);
  f.withoutBootstrap();const next=await f.login(chosen);assert.equal((await f.call('admin/content','GET',null,next)).status,200);
  const replacement='a different personal owner password';assert.equal((await f.call('admin/password','POST',{currentPassword:chosen,newPassword:replacement,confirmPassword:replacement},next)).status,200);
  assert.equal(f.sqlite.prepare('SELECT version FROM owner_credentials').get().version,2);assert.equal((await f.call('login','POST',{password:chosen})).status,401);await f.login(replacement);
 }finally{f.sqlite.close();}
});
test('visitors cannot set an owner password and incorrect current passwords preserve the session',async()=>{
 const f=setup();try{
  assert.equal((await f.call('admin/password','POST',{currentPassword:bootstrap,newPassword:chosen,confirmPassword:chosen})).status,401);
  const cookie=await f.login();const r=await f.call('admin/password','POST',{currentPassword:'incorrect',newPassword:chosen,confirmPassword:chosen},cookie);assert.equal(r.status,400);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM owner_credentials').get().n,0);assert.equal((await f.call('admin/content','GET',null,cookie)).status,200);
 }finally{f.sqlite.close();}
});
test('weak or mismatched password changes are rejected',async()=>{
 const f=setup();try{const cookie=await f.login();for(const input of [{newPassword:'short',confirmPassword:'short'},{newPassword:chosen,confirmPassword:'different'},{newPassword:'x'.repeat(129),confirmPassword:'x'.repeat(129)}])assert.equal((await f.call('admin/password','POST',{currentPassword:bootstrap,...input},cookie)).status,400);assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM owner_credentials').get().n,0);}finally{f.sqlite.close();}
});
test('current password guesses are throttled on an authenticated session',async()=>{
 const f=setup();try{const cookie=await f.login();for(let i=0;i<5;i++)assert.equal((await f.call('admin/password','POST',{currentPassword:'wrong',newPassword:chosen,confirmPassword:chosen},cookie)).status,400);assert.equal((await f.call('admin/password','POST',{currentPassword:bootstrap,newPassword:chosen,confirmPassword:chosen},cookie)).status,429);}finally{f.sqlite.close();}
});
test('a login already in progress cannot create a session after a password change',async()=>{
 const f=setup();try{
  const original=f.DB.prepare.bind(f.DB);f.DB.prepare=sql=>{const statement=original(sql);if(!sql.startsWith('INSERT INTO sessions'))return statement;return {bind(...args){const bound=statement.bind(...args);return {...bound,async run(){f.sqlite.prepare('INSERT INTO owner_credentials VALUES (1,?,?,100000,1,?)').run('a'.repeat(32),'b'.repeat(64),new Date().toISOString());return bound.run();}};}};};
  const response=await f.call('login','POST',{password:bootstrap});assert.equal(response.status,401);assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM sessions').get().n,0);
 }finally{f.sqlite.close();}
});
const seed=JSON.parse(await readFile(new URL('../data/content.json',import.meta.url),'utf8'));
async function dashboard(){
 const html=await readFile(new URL('../admin/index.html',import.meta.url),'utf8');const source=(await readFile(new URL('../admin/admin.js',import.meta.url),'utf8')).replace(/^import[^;]+;/,'const {settingsFields,collections,validateContent}=window.schema;');
 const dom=new JSDOM(html,{url:'https://academy.test/admin/',runScripts:'outside-only',virtualConsole:new VirtualConsole()});dom.window.schema={settingsFields,collections,validateContent};const calls=[];
 dom.window.fetch=async(url,options={})=>{calls.push({url,options});return {ok:true,json:async()=>url==='/api/admin/content'&&options.method!=='PUT'?{content:structuredClone(seed),version:1}:{ok:true,version:2}};};
 dom.window.eval(source);await new Promise(resolve=>setTimeout(resolve,5));return {dom,calls,d:dom.window.document};
}
test('password panel clears sensitive fields and returns to login after a successful change',async()=>{
 const {dom,d,calls}=await dashboard();try{
  d.getElementById('change-password').click();assert.equal(d.getElementById('password-settings').hidden,false);
  d.getElementById('current-password').value=bootstrap;d.getElementById('new-password').value=chosen;d.getElementById('confirm-password').value=chosen;
  d.getElementById('password-form').dispatchEvent(new dom.window.Event('submit',{cancelable:true}));await new Promise(resolve=>setTimeout(resolve,5));
  assert.ok(calls.some(c=>c.url==='/api/admin/password'));assert.equal(d.getElementById('workspace').hidden,true);assert.equal(d.getElementById('login-form').hidden,false);assert.equal(d.getElementById('new-password').value,'');assert.ok(d.getElementById('status').textContent.includes('Password updated'));
 }finally{dom.window.close();}
});
test('unsaved content must be saved before changing the password',async()=>{
 const {dom,d,calls}=await dashboard();try{
  const input=d.querySelector('#editor input');input.value+=' changed';input.dispatchEvent(new dom.window.Event('input'));d.getElementById('change-password').click();
  d.getElementById('current-password').value=bootstrap;d.getElementById('new-password').value=chosen;d.getElementById('confirm-password').value=chosen;
  d.getElementById('password-form').dispatchEvent(new dom.window.Event('submit',{cancelable:true}));await new Promise(resolve=>setTimeout(resolve,5));
  assert.ok(!calls.some(c=>c.url==='/api/admin/password'));assert.ok(d.getElementById('password-status').textContent.includes('Save your content draft'));
 }finally{dom.window.close();}
});
