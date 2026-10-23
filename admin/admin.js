import {settingsFields,collections,validateContent} from '/lib/content-schema.js';
const $=id=>document.getElementById(id);
let content,version=0,section='settings',dirty=false;
const status=(message,error=false)=>{$('status').textContent=message;$('status').className=error?'error':'success';};
async function api(path,options={}) {
 const response=await fetch('/api/'+path,{...options,headers:options.body instanceof FormData?{}:{'Content-Type':'application/json',...options.headers}});
 let data;try{data=await response.json();}catch{throw new Error('The server is unavailable. Check the Cloudflare setup in README.');}
 if(!response.ok){if(response.status===401 && path!=='login'){ resetPasswordPanel();$('workspace').hidden=true;$('login-form').hidden=false; }throw new Error(data.error || 'Request failed.');}
 return data;
}
function changed(){dirty=true;$('save-state').textContent='Unsaved changes';}
function field(key,label,value,update) {
 const wrap=document.createElement('label');wrap.className='editor-field';const title=document.createElement('span');title.textContent=label;wrap.append(title);
 const input=document.createElement(['intro','about','admissions','scholarship','text','answer','quote','excerpt','body'].includes(key)?'textarea':'input');input.value=value || '';input.maxLength=5000;if(input.tagName==='TEXTAREA')input.rows=4;
 input.addEventListener('input',()=>{update(input.value);changed();});wrap.append(input);
 if(key==='image' || key==='heroImage') {
  const upload=document.createElement('input');upload.type='file';upload.accept='image/jpeg,image/png,image/webp';upload.setAttribute('aria-label','Upload '+label);
  upload.addEventListener('change',async()=>{if(!upload.files[0])return;const file=upload.files[0];if(file.size>5*1024*1024){status('Images must be 5 MB or smaller.',true);return;}const data=new FormData();data.append('file',file);upload.disabled=true;try{const result=await api('admin/upload',{method:'POST',body:data});input.value=result.url;update(result.url);changed();status('Photo uploaded. Save and publish your content to show it on the website.');}catch(e){status(e.message,true);}finally{upload.disabled=false;}});wrap.append(upload);
 }
 return wrap;
}
function checkbox(label,value,update){const wrap=document.createElement('label');wrap.className='checkbox';const input=document.createElement('input');input.type='checkbox';input.checked=value;input.addEventListener('change',()=>{update(input.checked);changed();});wrap.append(input,document.createTextNode(label));return wrap;}
function draw(){
 $('tabs').replaceChildren();
 for(const [key,label] of [['settings','Academy details'],...Object.entries(collections).map(([key,c])=>[key,c.label])]) {
  const b=document.createElement('button');b.type='button';b.textContent=label;b.className='filter-chip'+(key===section?' active':'');b.setAttribute('aria-pressed',key===section);b.onclick=()=>{section=key;draw();};$('tabs').append(b);
 }
 const editor=$('editor');editor.replaceChildren();const h=document.createElement('h2');h.textContent=section==='settings'?'Academy details':collections[section].label;editor.append(h);
 if(section==='settings'){
  const grid=document.createElement('div');grid.className='editor-grid';for(const [key,label] of Object.entries(settingsFields))grid.append(field(key,label,content.settings[key],value=>content.settings[key]=value));editor.append(grid);return;
 }
 const config=collections[section];
 content[section].forEach((row,index)=>{
  const card=document.createElement('fieldset');const legend=document.createElement('legend');legend.textContent=`Entry ${index+1}`;card.append(legend);
  card.append(checkbox('Show on website',row.published,value=>row.published=value));
  if(['results','reviews'].includes(section))card.append(checkbox('I have permission to publish this student result or review (and photo, if any).',row.consent,value=>row.consent=value));
  const grid=document.createElement('div');grid.className='editor-grid';for(const [key,label] of Object.entries(config.fields))grid.append(field(key,label,row[key],value=>row[key]=value));card.append(grid);
  const controls=document.createElement('div');controls.className='entry-controls';
  for(const [label,action,disabled] of [['Move up',()=>{[content[section][index-1],content[section][index]]=[row,content[section][index-1]];},index===0],['Move down',()=>{[content[section][index],content[section][index+1]]=[content[section][index+1],row];},index===content[section].length-1],['Remove entry',()=>{if(confirm('Remove this entry from the draft?'))content[section].splice(index,1);},false]]) {
   const b=document.createElement('button');b.type='button';b.textContent=label;b.disabled=disabled;b.className='filter-chip';b.onclick=()=>{action();changed();draw();};controls.append(b);
  }card.append(controls);editor.append(card);
 });
 const add=document.createElement('button');add.type='button';add.className='button button-quiet';add.textContent='+ Add entry';add.onclick=()=>{if(content[section].length>=100){status('Maximum 100 entries per section.',true);return;}content[section].push({published:false,...Object.fromEntries(Object.keys(config.fields).map(k=>[k,'']))});changed();draw();};editor.append(add);
}
async function openWorkspace(){
 const data=await api('admin/content');content=data.content;
 if(!content){const response=await fetch('/data/content.json');if(!response.ok)throw new Error('Could not load initial content.');content=await response.json();}
 for(const key of Object.keys(collections)) content[key] ||= [];
 version=data.version;dirty=false;$('workspace').hidden=false;$('login-form').hidden=true;$('save-state').textContent=data.publishedAt?'Last published: '+new Date(data.publishedAt).toLocaleString():'No dashboard updates published yet';draw();status('Signed in. Choose a section to edit.');
}
$('login-form').addEventListener('submit',async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;try{await api('login',{method:'POST',body:JSON.stringify({password:$('password').value})});$('password').value='';await openWorkspace();}catch(e){status(e.message,true);}finally{b.disabled=false;}});
$('editor').addEventListener('submit',e=>e.preventDefault());
async function save(){const clean=validateContent(content);const result=await api('admin/content',{method:'PUT',body:JSON.stringify({content:clean,version})});version=result.version;dirty=false;$('save-state').textContent='Draft saved';status('Draft saved. Preview or publish when ready.');}
async function busy(action){const controls=['save','publish','preview','logout','change-password','password-submit'].map($);controls.forEach(b=>b.disabled=true);$('editor').inert=true;$('password-settings').inert=true;try{await action();}catch(e){status(e.message,true);}finally{controls.forEach(b=>b.disabled=false);$('editor').inert=false;$('password-settings').inert=false;}}
$('save').onclick=()=>busy(save);
$('publish').onclick=()=>busy(async()=>{await save();await api('admin/publish',{method:'POST',body:JSON.stringify({version})});status('Published. Your updates are now live on the website.');$('save-state').textContent='Published '+new Date().toLocaleTimeString();});
$('preview').onclick=()=>{const win=window.open('/admin/preview.html','_blank');busy(async()=>{await save();if(win)win.location.reload();else status('Draft saved. Allow popups to open the preview.');});};
$('logout').onclick=()=>busy(async()=>{if(dirty&&!confirm('Discard unsaved changes and sign out?'))return;await api('logout',{method:'POST',body:'{}'});resetPasswordPanel();dirty=false;content=null;$('workspace').hidden=true;$('login-form').hidden=false;status('Signed out.');});
function resetPasswordPanel(){
 $('password-form').reset();$('password-settings').hidden=true;$('change-password').setAttribute('aria-expanded','false');$('password-status').textContent='';
}
$('change-password').onclick=()=>{
 if(!$('password-settings').hidden){resetPasswordPanel();return;}
 $('password-settings').hidden=false;$('change-password').setAttribute('aria-expanded','true');$('current-password').focus();
};
$('password-cancel').onclick=resetPasswordPanel;
$('password-form').addEventListener('submit',event=>{
 event.preventDefault();const note=$('password-status');note.className='error';
 if(dirty){note.textContent='Save your content draft before changing your password.';return;}
 if($('new-password').value!==$('confirm-password').value){note.textContent='The new passwords do not match.';return;}
 const input={currentPassword:$('current-password').value,newPassword:$('new-password').value,confirmPassword:$('confirm-password').value};
 busy(async()=>{
  try{
   await api('admin/password',{method:'POST',body:JSON.stringify(input)});
   resetPasswordPanel();content=null;$('workspace').hidden=true;$('login-form').hidden=false;$('password').value='';
   status('Password updated. Sign in with your new password from now on.');$('password').focus();
  }catch(error){note.textContent=error.message;if($('workspace').hidden)status(error.message,true);}
 });
});
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
openWorkspace().catch(e=>{if(e.message!=='Please sign in.')status(e.message,true);});
