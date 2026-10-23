import { mkdir, cp, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
const root=resolve('.');
const output=resolve(root,'dist');
if(dirname(output)!==root || output===root) throw new Error('Build output must be the dist subdirectory of this project.');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of ['index.html','fee-structure.html','programs.html','blogs.html','blog.html','scholarships.html','position-holders.html','site.css','style.css','academy-theme.css','dynamic.css','script.js','assets','_headers','_routes.json','admin','data','lib/content-schema.js']) {
  await cp(resolve(root,file), resolve(output,file), { recursive: true });
}
console.log('Public files built in dist/ (server source and secrets excluded).');
