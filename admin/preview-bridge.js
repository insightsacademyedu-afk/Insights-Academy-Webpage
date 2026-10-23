const payload=JSON.parse(document.getElementById('draft-content').textContent);
window.__ACADEMY_PREVIEW_SEARCH__=payload.search || '';
const nativeFetch=window.fetch.bind(window);
window.fetch=(input,options)=>input==='/api/content'?Promise.resolve(new Response(JSON.stringify({content:payload.content}),{headers:{'Content-Type':'application/json'}})):nativeFetch(input,options);
document.addEventListener('click',event=>{
 const link=event.target.closest('a');if(!link || link.target==='_blank')return;
 const url=new URL(link.href,location.href);
 if(url.origin===location.origin && ['/','/index.html','/programs.html','/fee-structure.html','/blogs.html','/blog.html','/scholarships.html','/position-holders.html'].includes(url.pathname)){
  event.preventDefault();window.parent.postMessage({type:'academy-draft-navigate',url:url.pathname+url.search+url.hash},location.origin);
 }
});
