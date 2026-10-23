export const settingsFields = {
 name:'Academy name', heroImage:'Homepage banner photo URL', hours:'Academy hours', classRange:'Classes offered (short label)', tagline:'Hero heading', intro:'Hero introduction', about:'Our story', board:'Board / curriculum', phone:'Phone (international format)', whatsapp:'WhatsApp (digits only)', email:'Email', address:'Full address', mapUrl:'Google Maps link', portalUrl:'Student portal URL', facebook:'Facebook URL', instagram:'Instagram URL', youtube:'YouTube URL', scholarship:'Scholarship / discount policy', admissions:'Admissions process',
};
export const collections = {
 programs:{label:'Classes & fees',fields:{title:'Class name',subjects:'Subjects',timings:'Timings / days',batchSize:'Batch size',duration:'Duration',monthlyFee:'Monthly fee',admissionFee:'Admission fee',installments:'Installment policy',board:'Board / curriculum'}},
 fees:{label:'Fee structure',fields:{program:'Program',class:'Class / study group',tuition:'Tuition fee',stationery:'Stationery charges'}},
 courses:{label:'Homepage courses',fields:{title:'Course title',subtitle:'Subtitle',level:'Class filter: juniors, primary, middle, matric, intermediate, or all'}},
 blogs:{label:'Blogs',fields:{title:'Article title',slug:'URL slug (letters, numbers, hyphens)',category:'Category',date:'Publication date',excerpt:'Short introduction',body:'Article text',image:'Cover photo URL'}},
 features:{label:'Homepage features',fields:{title:'Feature title',text:'Description'}},
 announcements:{label:'Announcements',fields:{title:'Title',text:'Details',date:'Date / session',url:'Optional link'}},
 teachers:{label:'Teachers',fields:{name:'Name',qualification:'Qualification',subject:'Subject',experience:'Experience',image:'Photo URL'}},
 results:{label:'Results & toppers',fields:{name:'Student name',class:'Class / board',marks:'Marks / grade',year:'Year',image:'Photo URL'}},
 reviews:{label:'Parent & student reviews',fields:{name:'Name',role:'Parent / student',quote:'Review'}},
 faqs:{label:'FAQs',fields:{question:'Question',answer:'Answer'}},
 gallery:{label:'Gallery',fields:{title:'Caption / image description',image:'Photo URL'}},
 resources:{label:'Test series & resources',fields:{title:'Title',text:'Description',url:'Resource URL'}},
};
export function safeUrl(value) {
 if (!value) return '';
 if (/^\/api\/media\/[a-zA-Z0-9.-]+$/.test(value)) return value;
 try { const u = new URL(value); return ['https:','http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; }
}
export function validateContent(input) {
 if (!input || typeof input !== 'object' || !input.settings) throw new Error('Invalid content.');
 const result = {settings:{}};
 function field(value, key) {
  if (value === undefined) return '';
  if (typeof value !== 'string' || value.length > 5000) throw new Error('Each field must contain text of 5,000 characters or fewer.');
  const text = value.trim();
  if ((key === 'url' || key === 'image' || key === 'heroImage' || key.endsWith('Url') || ['facebook','instagram','youtube'].includes(key)) && text && !safeUrl(text)) throw new Error('Links must be full http or https URLs, or uploaded media paths.');
  return text;
 }
 for (const key of Object.keys(settingsFields)) result.settings[key] = field(input.settings[key],key);
 if (!result.settings.name) throw new Error('Academy name is required.');
 if (result.settings.whatsapp && !/^\d{10,15}$/.test(result.settings.whatsapp)) throw new Error('WhatsApp needs 10–15 digits in international format.');
 if (result.settings.phone && !/^\+?[\d ()-]{7,25}$/.test(result.settings.phone)) throw new Error('Enter a valid phone number.');
 for (const [key,config] of Object.entries(collections)) {
  if (['fees','blogs','features','courses'].includes(key) && input[key] === undefined) input = {...input,[key]:[]};
  if (!Array.isArray(input[key]) || input[key].length > 100) throw new Error(`${config.label}: maximum 100 entries.`);
  result[key] = input[key].map(row => {
   if (!row || typeof row !== 'object') throw new Error('Invalid entry.');
   const clean = {published:row.published === true};
   for (const name of Object.keys(config.fields)) clean[name] = field(row[name],name);
   if (clean.published && !clean[Object.keys(config.fields)[0]]) throw new Error(`${config.label}: a title or name is required for visible entries.`);
   if (key === 'blogs') {
    clean.slug = clean.slug || clean.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    if (clean.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(clean.slug)) throw new Error('Invalid blog URL slug. Use lowercase letters, numbers and hyphens.');
    if (clean.published && (!clean.slug || !clean.body)) throw new Error('Blog URL slug and article text are required before publishing.');
   }
   if (['results','reviews'].includes(key)) {
    clean.consent = row.consent === true;
    if (clean.published && !clean.consent) throw new Error('Confirm permission before publishing student results or reviews.');
   }
   return clean;
  });
 }
 const slugs=result.blogs.filter(r=>r.published).map(r=>r.slug);
 if(new Set(slugs).size!==slugs.length) throw new Error('Invalid duplicate blog URL slug. Each published article needs its own slug.');
 return result;
}
export function publicContent(content) {
 const clean = validateContent(content);
 for (const key of Object.keys(collections)) clean[key] = clean[key].filter(row=>row.published).map(({published,consent,...row})=>row);
 return clean;
}
