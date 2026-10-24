import {collections,safeUrl} from './lib/content-schema.js';
const $=id=>document.getElementById(id);
const page=document.body.dataset.page || 'home';
const esc=value=>String(value || '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const set=(id,value)=>{if($(id))$(id).textContent=value || '';};
const external=(url,label,cls='')=>safeUrl(url)?`<a class="${cls}" href="${esc(safeUrl(url))}" target="_blank" rel="noopener">${esc(label)} ↗</a>`:'';
const photo=(url,label,cls='')=>safeUrl(url)?`<img class="${cls}" loading="lazy" src="${esc(safeUrl(url))}" alt="${esc(label)}">`:'';
const paths=[
 '<path d="M4 7h7l2 2h7v12H4z"/><path d="M9 4v6m-3-3h6"/>',
 '<path d="M4 5h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-3H4zM22 5h-6a3 3 0 0 0-3 3v14a4 4 0 0 1 4-3h5z"/>',
 '<path d="M6 3v4m14-4v4M3 10h20M4 5h18v18H4zM8 14h3m4 0h3M8 18h3"/>',
 '<path d="M13 3 2 9l11 6 11-6zM6 12v6c5 4 9 4 14 0v-6M24 9v10"/>',
 '<path d="M8 3h10v6c0 7-10 7-10 0zM8 5H4v3c0 4 4 4 5 4M18 5h4v3c0 4-4 4-5 4M13 15v6m-5 1h10"/>',
 '<path d="M4 4h18v14H4zM9 23h8M13 18v5M8 9h10m-10 4h7"/>'
];
const icon=(n=0)=>`<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[n%paths.length]}</svg>`;
const paragraph=text=>String(text || '').split(/\n\s*\n/).filter(Boolean).map(p=>`<p>${esc(p).replace(/\n/g,'<br>')}</p>`).join('');
const slug=row=>row.slug || row.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
let content,settings={},programs=[],blogCategory='All topics';
set('year',new Date().getFullYear());
const menu=document.querySelector('.menu-toggle'),nav=$('nav');
menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'×':'☰';});
nav.addEventListener('click',e=>{if(e.target.closest('a')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='☰';}});
for(const a of nav.querySelectorAll('[data-page]'))if(a.dataset.page===(page==='article'?'blogs':page))a.setAttribute('aria-current','page');
document.addEventListener('keydown',e=>{if(e.key==='Escape'){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='☰';document.querySelector('.program-menu').open=false;}});
const levels={all:'All classes',juniors:'KG & Prep',primary:'Primary',middle:'Middle',matric:'Matric',intermediate:'Intermediate'};
function levelFor(p){const n=Number(p.title.match(/\d+/)?.[0]);return !n?'juniors':n<=5?'primary':n<=8?'middle':n<=10?'matric':'intermediate';}
function renderPrograms(level='all'){
 const rows=level==='all'?programs:programs.filter(p=>levelFor(p)===level);
 $('program-list').innerHTML=rows.map((p,i)=>`<article class="content-card class-card"><span class="card-icon">${icon(i)}</span><span class="eyebrow">EVENING COACHING</span><h2>${esc(p.title)}</h2><p>${esc(p.subjects || 'Contact us to confirm subjects for this class.')}</p><dl>${[['Class hours',p.timings || settings.hours],['Curriculum',p.board || settings.board],['Batch size',p.batchSize],['Duration',p.duration]].filter(([,v])=>v).map(([k,v])=>`<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl><a class="text-link" href="/?class=${encodeURIComponent(p.title)}#admissions">Inquire about this class ↗</a><a class="small-link" href="/fee-structure.html">View fee structure →</a></article>`).join('') || '<p class="empty-state">Contact us for class availability in this group.</p>';
 for(const b of $('class-filters').querySelectorAll('button')){b.classList.toggle('active',b.dataset.level===level);b.setAttribute('aria-pressed',String(b.dataset.level===level));}
}
function blogCard(row,index){return `<article class="blog-card"><a class="blog-cover cover-${index%3}" href="/blog.html?post=${encodeURIComponent(slug(row))}" tabindex="-1" aria-hidden="true">${photo(row.image,'')}<span>${icon(index)}<small>${esc(row.category || 'INSIGHTS JOURNAL')}</small><strong>${esc(row.title)}</strong></span></a><div class="blog-info"><div class="blog-meta"><span>${esc(row.category || 'Study notes')}</span>${row.date?`<span>${esc(row.date)}</span>`:''}</div><h2><a href="/blog.html?post=${encodeURIComponent(slug(row))}">${esc(row.title)}</a></h2><p>${esc(row.excerpt)}</p><a class="text-link" href="/blog.html?post=${encodeURIComponent(slug(row))}">Read article →</a></div></article>`;}
function renderBlogs(){
 const query=$('blog-search').value.trim().toLowerCase();
 const rows=content.blogs.filter(b=>(blogCategory==='All topics'||b.category===blogCategory)&&`${b.title} ${b.excerpt} ${b.body}`.toLowerCase().includes(query));
 $('blog-list').innerHTML=rows.map(blogCard).join('') || '<div class="empty-state"><h2>No articles found.</h2><p>Try another search or browse all topics.</p></div>';
 set('blog-count',`${rows.length} article${rows.length===1?'':'s'}`);
 for(const b of $('blog-categories').querySelectorAll('button')){b.classList.toggle('active',b.textContent===blogCategory);b.setAttribute('aria-pressed',String(b.textContent===blogCategory));}
}
const resultCard=row=>`<article class="content-card result-card">${photo(row.image,row.name)}<span class="card-icon">${icon(4)}</span><strong class="result-marks">${esc(row.marks)}</strong><h3>${esc(row.name)}</h3><p>${esc([row.class,row.year].filter(Boolean).join(' · '))}</p></article>`;
function sectionRows(key,template){
 if(!$(key+'-list'))return;
 $(key+'-section').hidden=!content[key].length;
 $(key+'-list').innerHTML=content[key].map(template).join('');
}
function render(data){
 content={...data};for(const key of Object.keys(collections))content[key] ||= [];
 settings=content.settings;programs=content.programs;
 const titles={home:'Evening Coaching',fees:'Fee Structure',blogs:'Blogs',article:'Article',programs:'Programmes',results:'Position Holders',scholarships:'Scholarships'};
 document.title=`${titles[page]} | ${settings.name}`;
 document.querySelector('meta[name="description"]').content=settings.intro || settings.name;
 set('footer-name',settings.name);set('footer-address',settings.address || 'Call us for directions and to arrange your visit.');
 for(const a of document.querySelectorAll('.header-phone')){a.textContent=settings.phone;a.href=`tel:${settings.phone}`;a.hidden=!settings.phone;}
 for(const el of document.querySelectorAll('.header-hours'))el.textContent=settings.hours;
 const portalUrl=safeUrl(settings.portalUrl);
 const portalLink=nav.querySelector('.nav-portal') || document.querySelector('footer .portal-link') || document.createElement('a');
 portalLink.classList.add('nav-cta','nav-portal');
 portalLink.textContent='Student Portal ↗';
 portalLink.target='_blank';
 portalLink.rel='noopener';
 nav.insertBefore(portalLink,nav.querySelector('.nav-cta'));
 document.querySelector('#admissions .portal-link')?.closest('p')?.remove();
 for(const el of document.querySelectorAll('.portal-link')){el.hidden=!portalUrl;if(portalUrl)el.href=portalUrl;}
 const email=document.querySelector('.footer-email');email.textContent=settings.email;email.href=`mailto:${settings.email}`;email.hidden=!settings.email;
 $('social-links').innerHTML=['facebook','instagram','youtube'].map(k=>external(settings[k],k[0].toUpperCase()+k.slice(1))).join('');
 $('map-link').hidden=!safeUrl(settings.mapUrl);if(!$('map-link').hidden)$('map-link').href=safeUrl(settings.mapUrl);
 $('whatsapp-float').hidden=!settings.whatsapp;$('whatsapp-float').href=`https://wa.me/${settings.whatsapp}`;
 if(page==='home'){
  $('hero-title').innerHTML=esc(settings.tagline).replace(/success/i,'<em>$&</em>');set('hero-intro',settings.intro);set('hero-meta',`${settings.classRange} · ${settings.hours}`);
  $('hero-image').src=safeUrl(settings.heroImage) || '/assets/academy-hero-v2.png';
  set('about-range',settings.classRange);set('about-hours',settings.hours);$('about-text').innerHTML=paragraph(settings.about);set('admissions-text',settings.admissions);
  $('course-list').innerHTML=content.courses.map((c,i)=>`<a class="course-card" href="/programs.html?level=${Object.hasOwn(levels,c.level)?c.level:'all'}"><span class="card-icon">${icon(i)}</span><span><h3>${esc(c.title)}</h3><p>${esc(c.subtitle)}</p></span><span class="arrow">↗</span></a>`).join('');
  $('features-section').hidden=!content.features.length;$('features-list').innerHTML=content.features.map((f,i)=>`<article class="feature-card"><span class="card-icon">${icon(i)}</span><h3>${esc(f.title)}</h3><p>${esc(f.text)}</p></article>`).join('');
  $('news-section').hidden=!content.announcements.length;
  $('news-list').innerHTML=content.announcements.map(a=>`<details class="news-item"><summary><span>${esc(a.title)}</span><span class="news-more">View details +</span></summary><div><p>${esc(a.text)}</p>${a.date?`<p class="small">${esc(a.date)}</p>`:''}${external(a.url,'More information','text-link')}</div></details>`).join('');
  sectionRows('teachers',r=>`<article class="content-card">${photo(r.image,r.name)}<h3>${esc(r.name)}</h3><span class="eyebrow">${esc(r.subject)}</span><p>${esc(r.qualification)}</p><p>${esc(r.experience)}</p></article>`);
  sectionRows('results',resultCard);
  sectionRows('reviews',r=>`<article class="content-card review-card"><span class="quote">“</span><blockquote>${esc(r.quote)}</blockquote><b>${esc(r.name)}</b><p>${esc(r.role)}</p></article>`);
  sectionRows('gallery',r=>`<figure class="content-card">${photo(r.image,r.title)}<figcaption>${esc(r.title)}</figcaption></figure>`);
  sectionRows('resources',r=>`<article class="content-card"><h3>${esc(r.title)}</h3><p>${esc(r.text)}</p>${external(r.url,'Open resource','text-link')}</article>`);
  sectionRows('faqs',r=>`<details class="faq-item"><summary>${esc(r.question)}</summary><p>${esc(r.answer)}</p></details>`);
  $('interest').innerHTML='<option value="">Choose your class</option>'+programs.map(p=>`<option>${esc(p.title)}</option>`).join('')+'<option>Other / admission question</option>';
  const chosen=new URLSearchParams(window.__ACADEMY_PREVIEW_SEARCH__ ?? location.search).get('class');if(chosen)$('interest').value=chosen;
 }
 if(page==='fees')$('fee-rows').innerHTML=content.fees.map(r=>`<tr><th scope="row">${esc(r.program)}</th><td>${esc(r.class)}</td><td>${esc(r.tuition)}</td><td>${esc(r.stationery)}</td></tr>`).join('') || '<tr><td colspan="4">Contact our admissions team for current fee details.</td></tr>';
 if(page==='programs'){
  $('class-filters').innerHTML=Object.entries(levels).map(([key,label])=>`<button class="filter-chip" type="button" data-level="${key}" aria-pressed="false">${label}</button>`).join('');
  const requested=new URLSearchParams(window.__ACADEMY_PREVIEW_SEARCH__ ?? location.search).get('level');renderPrograms(Object.hasOwn(levels,requested)?requested:'all');
  set('class-hours-note',`Academy hours: ${settings.hours}. Confirm your individual class schedule with the academy.`);
 }
 if(page==='blogs'){
  $('blog-categories').innerHTML=['All topics',...new Set(content.blogs.map(r=>r.category).filter(Boolean))].map(c=>`<button class="filter-chip" type="button" aria-pressed="false">${esc(c)}</button>`).join('');renderBlogs();
 }
 if(page==='article'){
  const requested=new URLSearchParams(window.__ACADEMY_PREVIEW_SEARCH__ ?? location.search).get('post');const row=content.blogs.find(r=>slug(r)===requested);
  if(!row){$('article').innerHTML='<div class="empty-state"><h1>Article not found.</h1><p>This article may be unavailable.</p><a class="button teal" href="/blogs.html">Browse blogs →</a></div>';document.title='Article not found | '+settings.name;}
  else{document.title=row.title+' | '+settings.name;document.querySelector('meta[name="description"]').content=row.excerpt;$('article').innerHTML=`<a class="text-link" href="/blogs.html">← Back to blogs</a><div class="blog-meta"><span>${esc(row.category || 'Study notes')}</span>${row.date?`<span>${esc(row.date)}</span>`:''}</div><h1>${esc(row.title)}</h1><p class="article-intro">${esc(row.excerpt)}</p>${photo(row.image,row.title,'article-image')}<div class="article-body">${paragraph(row.body)}</div><a class="button teal" href="/blogs.html">More from the blog →</a>`;}
 }
 if(page==='scholarships')$('scholarship-text').innerHTML=paragraph(settings.scholarship || 'Contact Insights Academy to ask about any current scholarships or discounts, eligibility requirements, and application details. Our team can explain the options available for your class.');
 if(page==='results'){$('all-results').innerHTML=content.results.map(resultCard).join('');$('results-empty').hidden=!!content.results.length;}
}
$('class-filters')?.addEventListener('click',e=>{const b=e.target.closest('button');if(b)renderPrograms(b.dataset.level);});
$('blog-search')?.addEventListener('input',renderBlogs);
$('blog-categories')?.addEventListener('click',e=>{const b=e.target.closest('button');if(b){blogCategory=b.textContent;renderBlogs();}});
$('admission-form')?.addEventListener('submit',e=>{
 e.preventDefault();if(!settings.whatsapp){set('form-help','Please call or email the academy to inquire.');return;}
 const text=['Hello '+settings.name+', I would like to ask about admissions.','Name: '+$('student-name').value.trim(),'Phone/email: '+$('student-contact').value.trim(),'Class: '+$('interest').value,$('message').value.trim()].filter(Boolean).join('\n');
 window.open(`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(text)}`,'_blank','noopener,noreferrer');
});
async function load(){
 try{const response=await fetch('/api/content',{cache:'no-store'});if(!response.ok)throw Error('Unavailable');const result=await response.json();if(result.content){render(result.content);return;}}
 catch{set('load-status','Live updates are temporarily unavailable. Showing the academy’s saved information.');}
 const response=await fetch('/data/content.json');if(!response.ok)throw Error('Content unavailable');const data=await response.json();for(const key of Object.keys(collections))data[key]=(data[key] || []).filter(r=>r.published);render(data);
}
load().catch(()=>set('load-status','Academy details could not be loaded. Please call +92 322 4103315 for assistance.'));
