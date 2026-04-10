import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '../public');

// SVG icon: dark navy bg + gold trophy + green accent ring
function makeSvg(size) {
  const r = size / 2;
  const ring = size * 0.055;
  const s = size / 100; // scale factor

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  <defs>
    <radialGradient id="bg" cx="40%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#1a2d4a"/>
      <stop offset="100%" stop-color="#080f1a"/>
    </radialGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffe066"/>
      <stop offset="40%" stop-color="#ffc107"/>
      <stop offset="100%" stop-color="#e67e00"/>
    </linearGradient>
    <linearGradient id="goldShine" x1="0%" y1="0%" x2="60%" y2="100%">
      <stop offset="0%" stop-color="#fff176"/>
      <stop offset="100%" stop-color="#ffa000"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="1.5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background circle -->
  <circle cx="50" cy="50" r="50" fill="url(#bg)"/>

  <!-- Green accent ring -->
  <circle cx="50" cy="50" r="${50 - ring / 2}" fill="none" stroke="#22c55e" stroke-width="${ring}"/>

  <!-- Trophy cup body -->
  <path d="M34 20 Q32 36 36 42 Q40 48 50 50 Q60 48 64 42 Q68 36 66 20 Z"
        fill="url(#gold)" filter="url(#glow)"/>

  <!-- Trophy cup shine -->
  <path d="M38 22 Q36 34 39 40 Q43 46 50 48"
        fill="none" stroke="url(#goldShine)" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>

  <!-- Left handle -->
  <path d="M34 24 Q24 24 24 32 Q24 40 34 40"
        fill="none" stroke="url(#gold)" stroke-width="3.5" stroke-linecap="round"/>

  <!-- Right handle -->
  <path d="M66 24 Q76 24 76 32 Q76 40 66 40"
        fill="none" stroke="url(#gold)" stroke-width="3.5" stroke-linecap="round"/>

  <!-- Stem -->
  <rect x="46" y="50" width="8" height="10" rx="1" fill="url(#gold)"/>

  <!-- Base plate -->
  <rect x="37" y="60" width="26" height="5" rx="2.5" fill="url(#gold)"/>

  <!-- Base bottom -->
  <rect x="40" y="64" width="20" height="3" rx="1.5" fill="#e67e00" opacity="0.8"/>

  <!-- Stars around trophy -->
  <circle cx="28" cy="22" r="1.8" fill="#ffe066" opacity="0.9"/>
  <circle cx="72" cy="22" r="1.4" fill="#ffe066" opacity="0.7"/>
  <circle cx="25" cy="52" r="1.2" fill="#ffe066" opacity="0.5"/>
  <circle cx="75" cy="48" r="1.6" fill="#ffe066" opacity="0.6"/>
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
