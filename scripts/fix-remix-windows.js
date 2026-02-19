import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const resolveFileUrlPath = path.join(rootDir, 'node_modules', '@remix-run', 'dev', 'dist', 'vite', 'resolve-file-url.js');

if (fs.existsSync(resolveFileUrlPath)) {
  console.log('Patching @remix-run/dev/dist/vite/resolve-file-url.js for Windows ESM support...');
  let content = fs.readFileSync(resolveFileUrlPath, 'utf8');

  const target = 'let normalizedPath = vite$1.normalizePath(filePath);';
  const patch = `
  let normalizedPath = vite$1.normalizePath(filePath);

  // On Windows, if the path starts with a drive letter, it must be a file:/// URL for ESM
  if (process.platform === 'win32' && /^[a-zA-Z]:/.test(normalizedPath)) {
    return 'file:///' + normalizedPath;
  }
`;

  if (!content.includes("process.platform === 'win32'")) {
    content = content.replace(target, patch);
    fs.writeFileSync(resolveFileUrlPath, content);
    console.log('Successfully patched resolve-file-url.js');
  } else {
    console.log('resolve-file-url.js already patched or contains fix.');
  }
} else {
  console.error('Could not find resolve-file-url.js to patch.');
}
