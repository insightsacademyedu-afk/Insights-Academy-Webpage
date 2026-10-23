import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {onRequest} from '../functions/api/[[path]].js';
const schema=await readFile(new URL('../schema.sql',import.meta.url),'utf8');
const image=await readFile(new URL('../assets/academy-hero-v2.png',import.meta.url));
function storage(){
 const sqlite=new DatabaseSync(':memory:');sqlite.exec(schema);
 const DB={prepare(sql){return {bind(...values){const args=values.map(v=>v instanceof ArrayBuffer?new Uint8Array(v):v);return {
  async first(){const row=sqlite.prepare(sql).get(...args);if(!row)return null;return Object.fromEntries(Object.entries(row).map(([k,v])=>[k,v instanceof Uint8Array?Array.from(v):v]));},
  async run(){const r=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}};}
 };}};},async batch(statements){sqlite.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());sqlite.exec('COMMIT');return result;}catch(error){sqlite.exec('ROLLBACK');throw error;}}};
 const token='a'.repeat(64);sqlite.prepare('INSERT INTO sessions VALUES (?,?)').run(createHash('sha256').update(token).digest('hex'),Date.now()+10000);
 return {DB,token,sqlite};
}
test('database-only photo storage returns an identical image across multiple chunks',async()=>{
 const {DB,token,sqlite}=storage();
 try{
  const form=new FormData();form.append('file',new Blob([image],{type:'image/png'}),'banner.png');
  const upload=await onRequest({env:{DB},params:{path:['admin','upload']},request:new Request('https://academy.test/api/admin/upload',{method:'POST',headers:{Origin:'https://academy.test',Cookie:'academy_session='+token},body:form})});
  assert.equal(upload.status,200);const {url}=await upload.json();assert.ok(sqlite.prepare('SELECT COUNT(*) AS n FROM media_chunks').get().n>1);
  const response=await onRequest({env:{DB},params:{path:['media',url.split('/').pop()]},request:new Request('https://academy.test'+url)});
  assert.equal(response.status,200);assert.equal(response.headers.get('Content-Type'),'image/png');assert.equal(Number(response.headers.get('Content-Length')),image.length);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()),image);
  const missing=await onRequest({env:{DB},params:{path:['media','missing.png']},request:new Request('https://academy.test/api/media/missing.png')});assert.equal(missing.status,404);
 }finally{sqlite.close();}
});
