import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const resolveFileUrlPath = path.join(rootDir, 'node_modules', '@remix-run', 'dev', 'dist', 'vite', 'resolve-file-url.js');

if (fs.existsSync(resolveFileUrlPath)) {
  console.log('Patching @remix-run/dev/dist/vite/resolve-file-url.js for Windows ESM support...');
  let content = fs.readFileSync(resolveFileUrlPath, 'utf8');

  const target = 'return path__namespace.posix.join("/@fs", vite$1.normalizePath(filePath));';
  const patch = `
    let normalizedPath = vite$1.normalizePath(filePath);
    if (process.platform === 'win32' && /^[a-zA-Z]:/.test(normalizedPath)) {
      return 'file:///' + normalizedPath;
    }
    return path__namespace.posix.join("/@fs", normalizedPath);
  `;

  if (!content.includes("process.platform === 'win32'")) {
    const originalContent = content;
    content = content.replace(target, patch);
    if (content === originalContent) {
        console.error('Failed to patch resolve-file-url.js: Target string not found.');
    } else {
        fs.writeFileSync(resolveFileUrlPath, content);
        console.log('Successfully patched resolve-file-url.js');
    }
    console.log('Successfully patched resolve-file-url.js');
  } else {
    console.log('resolve-file-url.js already patched or contains fix.');
  }
} else {
  console.error('Could not find resolve-file-url.js to patch.');
}
