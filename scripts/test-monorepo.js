import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

function isInRemixMonorepo() {
  try {
    let devPath = path.dirname(require.resolve("@remix-run/node/package.json"));
    let devParentDir = path.basename(path.resolve(devPath, ".."));
    console.log('devPath:', devPath);
    console.log('devParentDir:', devParentDir);
    return devParentDir === "packages";
  } catch (e) {
    console.log('Error:', e.message);
    return false;
  }
}

console.log('isInRemixMonorepo:', isInRemixMonorepo());
