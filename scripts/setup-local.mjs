import {copyFile,access} from 'node:fs/promises';
try{await access('wrangler.jsonc');}catch{await copyFile('wrangler.example.jsonc','wrangler.jsonc');console.log('Created local-only wrangler.jsonc. Configure real resource IDs before any CLI production deploy.');}
