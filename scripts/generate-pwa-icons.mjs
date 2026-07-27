import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function makePng(width, height, drawPixel) {
  const lineSize = width * 4 + 1;
  const buffer = Buffer.alloc(lineSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * lineSize;
    buffer[rowOffset] = 0; // Filter type 0

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawPixel(x, y, width, height);
      buffer[pixelOffset] = r;
      buffer[pixelOffset + 1] = g;
      buffer[pixelOffset + 2] = b;
      buffer[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(buffer);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crcVal = zlib.crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crcVal >>> 0, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

// Distance point to line segment for lightning bolt rendering
function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

// Draw QuizFlash Icon Pixel
function drawIconPixel(x, y, width, height, isMaskable = false) {
  // Normalize coordinates to [-1, 1]
  const nx = (x / width) * 2 - 1;
  const ny = (y / height) * 2 - 1;

  // Background gradient: Indigo (#4f46e5) to Purple (#7c3aed)
  const tGradient = (ny + 1) / 2;
  let bgR = Math.round(79 * (1 - tGradient) + 124 * tGradient);
  let bgG = Math.round(70 * (1 - tGradient) + 58 * tGradient);
  let bgB = Math.round(229 * (1 - tGradient) + 237 * tGradient);

  // Rounded rect mask for non-maskable icons
  if (!isMaskable) {
    const cornerRadius = 0.35;
    const dx = Math.max(0, Math.abs(nx) - (1 - cornerRadius));
    const dy = Math.max(0, Math.abs(ny) - (1 - cornerRadius));
    const cornerDist = Math.hypot(dx, dy);
    if (cornerDist > cornerRadius) {
      return [0, 0, 0, 0]; // Transparent outside rounded corner
    }
  }

  // Draw Card 1 (Background card tilted slightly)
  const card1CenterX = 0.05;
  const card1CenterY = -0.05;
  const card1W = 0.55;
  const card1H = 0.65;
  const inCard1 = Math.abs(nx - card1CenterX) < card1W && Math.abs(ny - card1CenterY) < card1H;

  // Draw Card 2 (Front card)
  const card2CenterX = -0.05;
  const card2CenterY = 0.05;
  const card2W = 0.55;
  const card2H = 0.65;
  const inCard2 = Math.abs(nx - card2CenterX) < card2W && Math.abs(ny - card2CenterY) < card2H;

  // Lightning Bolt Segments (Center of card 2)
  const lightningPath = [
    [0.1, -0.25],
    [-0.15, 0.05],
    [0.02, 0.05],
    [-0.08, 0.35],
    [0.2, -0.02],
    [0.02, -0.02],
    [0.1, -0.25]
  ];

  // Point in polygon check for lightning bolt
  let inLightning = false;
  const lx = nx - card2CenterX;
  const ly = ny - card2CenterY;

  for (let i = 0, j = lightningPath.length - 1; i < lightningPath.length; j = i++) {
    const xi = lightningPath[i][0], yi = lightningPath[i][1];
    const xj = lightningPath[j][0], yj = lightningPath[j][1];
    const intersect = ((yi > ly) !== (yj > ly)) && (lx < (xj - xi) * (ly - yi) / (yj - yi) + xi);
    if (intersect) inLightning = !inLightning;
  }

  if (inLightning) {
    // Glowing Amber/Yellow lightning bolt (#fbbf24)
    return [251, 191, 36, 255];
  }

  if (inCard2) {
    // Front card: semi-transparent white/glassmorphism
    const isBorder = (Math.abs(lx) > card2W - 0.03 || Math.abs(ly) > card2H - 0.03);
    if (isBorder) return [255, 255, 255, 230];
    return [255, 255, 255, 180];
  }

  if (inCard1) {
    // Back card border
    const l1x = nx - card1CenterX;
    const l1y = ny - card1CenterY;
    const isBorder1 = (Math.abs(l1x) > card1W - 0.03 || Math.abs(l1y) > card1H - 0.03);
    if (isBorder1) return [255, 255, 255, 150];
    return [255, 255, 255, 90];
  }

  // Base background
  return [bgR, bgG, bgB, 255];
}

const iconsDir = path.join(process.cwd(), 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('Generating PWA Icons...');

fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), makePng(192, 192, (x, y, w, h) => drawIconPixel(x, y, w, h, false)));
console.log('Generated icon-192.png');

fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), makePng(512, 512, (x, y, w, h) => drawIconPixel(x, y, w, h, false)));
console.log('Generated icon-512.png');

fs.writeFileSync(path.join(iconsDir, 'maskable-icon-512.png'), makePng(512, 512, (x, y, w, h) => drawIconPixel(x, y, w, h, true)));
console.log('Generated maskable-icon-512.png');

fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), makePng(180, 180, (x, y, w, h) => drawIconPixel(x, y, w, h, true)));
console.log('Generated apple-touch-icon.png');

console.log('All icons generated successfully!');
