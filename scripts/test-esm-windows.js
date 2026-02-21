import { pathToFileURL } from 'node:url';
import path from 'node:path';

const winPath = 'C:\\software\\Devonz\\node_modules\\vite\\dist\\node\\index.js';
const invalidUrl = 'file:///' + winPath;
const validUrl = pathToFileURL(winPath).href;

console.log('Invalid URL:', invalidUrl);
console.log('Valid URL:', validUrl);

try {
  console.log('Testing invalid URL...');
  await import(invalidUrl);
} catch (e) {
  console.error('Invalid URL failed:', e.message);
}

try {
  console.log('Testing valid URL...');
  // We don't actually need to load it, just see if it fails with protocol error
  // But vite might be too large, let's try a small file
  await import(validUrl);
} catch (e) {
  console.error('Valid URL result (might be other error):', e.message);
}
