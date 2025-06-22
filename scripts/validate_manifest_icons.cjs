const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, '../public/manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

let valid = true;

(manifest.icons || []).forEach(icon => {
  const src = icon.src;
  if (!src || src.startsWith('data:')) {
    console.error(`Invalid src for icon: ${src}`);
    valid = false;
    return;
  }
  if (!src.startsWith('icons/')) {
    console.error(`Icon not in icons folder: ${src}`);
    valid = false;
  }
  const iconPath = path.join(__dirname, '../public', src);
  if (!fs.existsSync(iconPath)) {
    console.error(`Missing file: ${src}`);
    valid = false;
  } else {
    const stats = fs.statSync(iconPath);
    if (stats.size === 0) {
      console.error(`Empty file: ${src}`);
      valid = false;
    }
  }
});

if (!valid) {
  console.error('Manifest validation failed');
  process.exit(1);
}

console.log('Manifest icons validated');

