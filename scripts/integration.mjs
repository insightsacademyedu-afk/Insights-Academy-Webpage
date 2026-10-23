import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const base='http://localhost:8788';
let cookie='';
async function request(path,method='GET',body){const r=await fetch(base+'/api/'+path,{method,headers:{Origin:base,'Content-Type':'application/json',Cookie:cookie},...(body?{body:JSON.stringify(body)}:{})});return r;}
const home=await fetch(base);assert.equal(home.status,200);assert.ok((await home.text()).includes('About Us'));
assert.equal((await request('admin/content')).status,401);
assert.equal((await request('login','POST',{password:'wrong'})).status,401);
const vars=await readFile('.dev.vars','utf8');const password=vars.match(/^ADMIN_PASSWORD=(.+)$/m)[1].trim();
const login=await request('login','POST',{password});assert.equal(login.status,200);cookie=login.headers.get('set-cookie').split(';')[0];assert.ok(login.headers.get('set-cookie').includes('HttpOnly'));
let state=await (await request('admin/content')).json();
const content=JSON.parse(await readFile('data/content.json','utf8'));content.programs[0].monthlyFee='PKR 2,500';content.announcements=[{title:'Unpublished test',published:false}];
let r=await request('admin/content','PUT',{content,version:state.version});assert.equal(r.status,200);state=await r.json();
assert.equal((await request('admin/content','PUT',{content,version:state.version-1})).status,409);
r=await request('content');const before=await r.json();assert.ok(!before.content || before.content.programs[0].monthlyFee!=='PKR 2,500');
assert.equal((await request('admin/publish','POST',{version:state.version})).status,200);
const after=await (await request('content')).json();assert.equal(after.content.programs[0].monthlyFee,'PKR 2,500');assert.ok(!after.content.announcements.some(r=>r.title==='Unpublished test'));
const form=new FormData();form.append('file',new Blob([await readFile('assets/insights-academy-mark.png')],{type:'image/png'}),'logo.png');
r=await fetch(base+'/api/admin/upload',{method:'POST',headers:{Origin:base,Cookie:cookie},body:form});assert.equal(r.status,200);const upload=await r.json();assert.equal((await fetch(base+upload.url)).status,200);
const invalid=new FormData();invalid.append('file',new Blob(['<script>bad</script>'],{type:'image/png'}),'fake.png');assert.equal((await fetch(base+'/api/admin/upload',{method:'POST',headers:{Origin:base,Cookie:cookie},body:invalid})).status,400);
// Restore confirmed academy information after local fixture checks.
const original=JSON.parse(await readFile('data/content.json','utf8'));
r=await request('admin/content','PUT',{content:original,version:state.version});state=await r.json();assert.equal(r.status,200);assert.equal((await request('admin/publish','POST',{version:state.version})).status,200);
assert.equal((await request('logout','POST',{})).status,200);assert.equal((await request('admin/content')).status,401);
console.log('Local integration passed: sign-in, protected editing, draft isolation, stale-save conflict, publishing, image storage, image validation, logout.');
