import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM,VirtualConsole} from 'jsdom';
import {collections,safeUrl,publicContent,validateContent} from '../lib/content-schema.js';
const seed=JSON.parse(await readFile(new URL('../data/content.json',import.meta.url),'utf8'));
const source=(await readFile(new URL('../script.js',import.meta.url),'utf8')).replace(/^\uFEFF/,'').replace(/^import[^;]+;/,'const {collections,safeUrl}=window.schema;');
async function render(file,query='',data=publicContent(seed)){
 const html=await readFile(new URL('../'+file,import.meta.url),'utf8');
 const dom=new JSDOM(html,{url:'http://academy.test/'+(file==='index.html'?'':file)+query,runScripts:'outside-only',virtualConsole:new VirtualConsole()});
 dom.window.schema={collections,safeUrl};dom.window.fetch=async()=>({ok:true,json:async()=>structuredClone({content:data})});dom.window.open=()=>{};
 dom.window.eval(source);await new Promise(resolve=>setTimeout(resolve,5));
 assert.equal(dom.window.document.getElementById('load-status').textContent,'','Page content rendered without an error');return dom;
}
test('home has academy content and navigation, with no fee table or blog articles',async()=>{
 const dom=await render('index.html'),d=dom.window.document;
 assert.ok(d.querySelector('#about-text').textContent.includes('Insights Academy'));
 assert.equal(d.querySelectorAll('.course-card').length,6);assert.equal(d.querySelectorAll('.feature-card').length,6);
 assert.equal(d.querySelector('.fee-table'),null);assert.equal(d.querySelector('.blog-card'),null);
 assert.equal(d.querySelector('#nav [data-page=fees]').getAttribute('href'),'/fee-structure.html');
 assert.equal(d.querySelector('#nav [data-page=blogs]').getAttribute('href'),'/blogs.html');
 const menu=d.querySelector('.menu-toggle');menu.click();assert.equal(menu.getAttribute('aria-expanded'),'true');menu.click();assert.equal(menu.getAttribute('aria-expanded'),'false');dom.window.close();
});
test('fee page displays the eight supplied rows only in its dedicated table',async()=>{const dom=await render('fee-structure.html'),d=dom.window.document;assert.equal(d.querySelectorAll('#fee-rows tr').length,8);assert.ok(d.querySelector('#fee-rows').textContent.includes('Rs. 1,500'));assert.equal(d.querySelector('#nav [aria-current=page]').textContent,'Fee Structure');dom.window.close();});
test('blogs support search, categories, and full article routes',async()=>{
 const dom=await render('blogs.html'),d=dom.window.document;assert.equal(d.querySelectorAll('.blog-card').length,3);
 d.querySelector('#blog-search').value='matric';d.querySelector('#blog-search').dispatchEvent(new dom.window.Event('input'));assert.equal(d.querySelectorAll('.blog-card').length,1);assert.ok(d.querySelector('.blog-info h2').textContent.includes('matric'));
 d.querySelector('#blog-search').value='';d.querySelector('#blog-search').dispatchEvent(new dom.window.Event('input'));
 [...d.querySelectorAll('#blog-categories button')].find(b=>b.textContent==='For parents').click();assert.equal(d.querySelectorAll('.blog-card').length,1);assert.ok(d.querySelector('.blog-info h2').textContent.includes('reading'));dom.window.close();
 const article=await render('blog.html','?post=study-routine-for-evening-learners');assert.ok(article.window.document.querySelector('#article h1').textContent.includes('routine'));assert.equal(article.window.document.querySelectorAll('.article-body p').length,4);article.window.close();
 const missing=await render('blog.html','?post=missing');assert.ok(missing.window.document.querySelector('#article h1').textContent.includes('not found'));missing.window.close();
});
test('programme filters show the appropriate classes without fee amounts',async()=>{const dom=await render('programs.html','?level=matric'),d=dom.window.document;assert.equal(d.querySelectorAll('.class-card').length,2);assert.ok(!d.querySelector('#program-list').textContent.includes('Rs.'));d.querySelector('[data-level=all]').click();assert.equal(d.querySelectorAll('.class-card').length,13);dom.window.close();});
test('scholarships and position-holder pages have useful empty states',async()=>{for(const file of ['scholarships.html','position-holders.html']){const dom=await render(file);assert.ok(dom.window.document.querySelector('main').textContent.includes('Contact') || dom.window.document.querySelector('main').textContent.includes('contact'));dom.window.close();}});
test('old content remains valid and blog slugs must be unique',()=>{const old=structuredClone(seed);for(const key of ['blogs','features','courses'])delete old[key];assert.deepEqual(validateContent(old).blogs,[]);const duplicate=structuredClone(seed);duplicate.blogs.push({...duplicate.blogs[0]});assert.throws(()=>validateContent(duplicate),/duplicate blog/);});
test('blog article text is escaped instead of interpreted as HTML',async()=>{const data=publicContent(seed);data.blogs[0].body='<img src=x onerror=alert(1)>\n\nSafe paragraph';const dom=await render('blog.html','?post='+data.blogs[0].slug,data);assert.equal(dom.window.document.querySelector('.article-body img'),null);assert.ok(dom.window.document.querySelector('.article-body').textContent.includes('<img'));dom.window.close();});
