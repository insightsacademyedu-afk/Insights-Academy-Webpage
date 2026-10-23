const frame=document.getElementById('preview');
const select=document.getElementById('page-select');
const allowed=new Set(['/','/index.html','/programs.html','/fee-structure.html','/blogs.html','/blog.html','/scholarships.html','/position-holders.html']);
let current=select.value,sequence=0;
async function load(){
 const token=++sequence,status=document.getElementById('status');
 try{
  const response=await fetch('/api/admin/content',{cache:'no-store'});const data=await response.json();if(!response.ok)throw Error(data.error);if(!data.content)throw Error('Save a draft first.');
  const url=new URL(current,location.origin);if(!allowed.has(url.pathname))throw Error('This page is not available in preview.');
  const source=await fetch(url.pathname);if(!source.ok)throw Error('Preview page unavailable.');const html=await source.text();
  const content=structuredClone(data.content);for(const key of Object.keys(content)){if(Array.isArray(content[key]))content[key]=content[key].filter(row=>row.published);}
  const payload=JSON.stringify({content,search:url.search}).replace(/</g,'\\u003c');
  const inject=`<base href="/"><script id="draft-content" type="application/json">${payload}<\/script><script src="/admin/preview-bridge.js"><\/script>`;
  if(token!==sequence)return;
  frame.onload=()=>{if(url.hash)frame.contentDocument.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView();};
  frame.srcdoc=html.replace('<head>','<head>'+inject);status.textContent='Showing saved draft';
 }catch(e){status.textContent=e.message;}
}
window.addEventListener('message',event=>{
 if(event.source!==frame.contentWindow || event.origin!==location.origin || event.data?.type!=='academy-draft-navigate')return;
 try{const url=new URL(event.data.url,location.origin);if(url.origin!==location.origin || !allowed.has(url.pathname))return;current=url.pathname+url.search+url.hash;
 if(![...select.options].some(o=>o.value===current)){const option=new Option(url.pathname==='/blog.html'?'Article preview':'Selected page',current);select.add(option);}select.value=current;load();}catch{}
});
document.getElementById('refresh').onclick=load;
select.onchange=()=>{current=select.value;load();};load();
