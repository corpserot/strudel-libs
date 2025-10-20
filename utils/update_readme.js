import * as lib from '../lib.mjs';
import fs from 'fs';

const url = 'https://cdn.jsdelivr.net/gh/corpserot/strudel-libs/lib.min.mjs';
const import_content = `var { ${Object.getOwnPropertyNames(lib).join(', ')} } = await import('${url}');`;

const path = './README.md'
let readme = fs.readFileSync(path, 'utf8');
const pattern = /(<!-- IMPORT-GUIDE -->\s*```js\s*)([\s\S]*?)(\s*```)/;
const content = readme.replace(pattern, `$1${import_content}$3`);
fs.writeFileSync(path, content, 'utf8');