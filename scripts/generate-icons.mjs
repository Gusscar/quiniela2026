import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '../public');

// SVG icon: dark navy bg + green ring + ⚽ soccer ball
function makeSvg(size) {
  const r = size / 2;
  const ring = size * 0.06;
  const fontSize = size * 0.52;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <radialGradient id="bg" cx="40%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#132238"/>
      <stop offset="100%" stop-color="#080f1a"/>
    </radialGradient>
  </defs>
  <!-- Background circle -->
  <circle cx="${r}" cy="${r}" r="${r}" fill="url(#bg)"/>
  <!-- Green ring -->
  <circle cx="${r}" cy="${r}" r="${r - ring / 2}" fill="none" stroke="#22c55e" stroke-width="${ring}"/>
  <!-- Soccer ball emoji centered -->
  <text
    x="${r}"
    y="${r + fontSize * 0.35}"
    text-anchor="middle"
    font-size="${fontSize}"
    font-family="Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif"
  >⚽</text>
</svg>`.trim();
}

async function generate(size, filename) {
  const svg = Buffer.from(makeSvg(size));
  await sharp(svg).png().toFile(resolve(publicDir, filename));
  console.log(`✓ ${filename} (${size}×${size})`);
}

await generate(192, 'icon-192.png');
await generate(512, 'icon-512.png');
console.log('Icons generated in /public');
