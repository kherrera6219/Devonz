import path from 'node:path';

const root = 'c:\\software\\Devonz';
const file = 'C:\\software\\Devonz\\app\\root.tsx';

const rel = path.relative(root, file);
console.log('root:', root);
console.log('file:', file);
console.log('relative:', rel);
console.log('isAbsolute:', path.isAbsolute(rel));
