const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Clean destination
const dest = path.join(__dirname, '../electron/standalone');
if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true, force: true });
}
fs.mkdirSync(dest, { recursive: true });

// Copy standalone
const source = path.join(__dirname, '../.next/standalone');
if (fs.existsSync(source)) {
  console.log('Copying standalone build...');
  execSync(`cp -R ${source}/* ${dest}`);
} else {
  console.error('Standalone build not found');
  process.exit(1);
}

// Copy static
const staticDest = path.join(dest, '.next/static');
const staticSource = path.join(__dirname, '../.next/static');
fs.mkdirSync(staticDest, { recursive: true });
console.log('Copying static assets...');
execSync(`cp -R ${staticSource}/* ${staticDest}`);

// Copy public
const publicDest = path.join(dest, 'public');
const publicSource = path.join(__dirname, '../public');
if (fs.existsSync(publicSource)) {
    console.log('Copying public assets...');
    fs.mkdirSync(publicDest, { recursive: true });
    execSync(`cp -R ${publicSource}/* ${publicDest}`);
}

console.log('Prepared Electron standalone files successfully');
