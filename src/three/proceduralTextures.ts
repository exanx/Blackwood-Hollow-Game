import * as THREE from 'three';

function makeCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function finalizeTexture(
  canvas: HTMLCanvasElement,
  repeatX: number,
  repeatY: number,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createMarbleTileTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(256, 256);
  ctx.fillStyle = '#14171f';
  ctx.fillRect(0, 0, 256, 256);

  const half = 128;
  const tiles = [
    [0, 0, '#181c26'],
    [half, 0, '#2a2d36'],
    [0, half, '#2a2d36'],
    [half, half, '#181c26'],
  ] as const;

  for (const [x, y, base] of tiles) {
    ctx.fillStyle = base;
    ctx.fillRect(x, y, half, half);

    // Subtle stone veins
    ctx.strokeStyle = 'rgba(200, 210, 225, 0.08)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 20);
    ctx.lineTo(x + 68, y + 64);
    ctx.lineTo(x + 114, y + 96);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, half - 2, half - 2);
  }

  return finalizeTexture(canvas, 5, 5, maxAnisotropy);
}

export function createWoodPlankTexture(maxAnisotropy: number, darkTone = false): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(256, 256);
  ctx.fillStyle = darkTone ? '#1a1410' : '#261b14';
  ctx.fillRect(0, 0, 256, 256);

  const plankHeight = 32;
  for (let row = 0; row < 8; row++) {
    const y = row * plankHeight;
    const shade = (row % 3) * 4 - 4;
    const r = (darkTone ? 28 : 42) + shade;
    const g = (darkTone ? 20 : 29) + shade;
    const b = (darkTone ? 16 : 21) + shade;
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, y + 1, 256, plankHeight - 2);

    // Grain streaks
    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
    ctx.lineWidth = 1;
    for (let s = 0; s < 4; s++) {
      const gy = y + 6 + s * 6;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(256, gy + ((row + s) % 2 === 0 ? 2 : -2));
      ctx.stroke();
    }

    // Staggered plank vertical joint
    const jointX = ((row * 97) % 220) + 18;
    ctx.fillStyle = '#0c0907';
    ctx.fillRect(jointX, y, 2, plankHeight);
    ctx.fillRect(0, y, 256, 2);
  }

  return finalizeTexture(canvas, 4, 4, maxAnisotropy);
}

export function createDamaskWallTexture(
  maxAnisotropy: number,
  baseHex: string,
  accentHex: string,
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(256, 256);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  // Subtle vertical stripes
  ctx.fillStyle = accentHex;
  for (let x = 0; x < 256; x += 32) {
    ctx.fillRect(x, 0, 12, 256);
  }

  // Geometric Victorian diamond motif
  ctx.strokeStyle = 'rgba(212, 175, 110, 0.08)';
  ctx.lineWidth = 1.5;
  for (let y = 32; y < 256; y += 64) {
    for (let x = 32; x < 256; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, y - 18);
      ctx.lineTo(x + 14, y);
      ctx.lineTo(x, y + 18);
      ctx.lineTo(x - 14, y);
      ctx.closePath();
      ctx.stroke();
    }
  }

  return finalizeTexture(canvas, 4, 2, maxAnisotropy);
}

export function createStoneFlagTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(256, 256);
  ctx.fillStyle = '#14171c';
  ctx.fillRect(0, 0, 256, 256);

  const blocks = [
    [2, 2, 122, 80],
    [128, 2, 126, 80],
    [2, 86, 80, 82],
    [86, 86, 168, 82],
    [2, 172, 146, 82],
    [152, 172, 102, 82],
  ];
  blocks.forEach(([x, y, w, h], i) => {
    const tone = 24 + (i % 3) * 5;
    ctx.fillStyle = `rgb(${tone}, ${tone + 4}, ${tone + 10})`;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(8, 10, 14, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
  });

  return finalizeTexture(canvas, 4, 4, maxAnisotropy);
}

export function createLunarFrescoTexture(
  revealed: boolean,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 256);
  ctx.fillStyle = '#181a20';
  ctx.fillRect(0, 0, 512, 256);

  // Stone plaster border
  ctx.strokeStyle = '#2d313d';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, 492, 236);

  // Subtle decorative stars
  ctx.fillStyle = revealed ? 'rgba(130, 185, 255, 0.65)' : 'rgba(120, 125, 138, 0.14)';
  for (let i = 0; i < 36; i++) {
    const sx = 32 + ((i * 73) % 448);
    const sy = 28 + ((i * 41) % 200);
    ctx.fillRect(sx, sy, 2, 2);
  }

  // Three lunar discs: Waning Crescent, Total Eclipse, Blood Moon
  const centers = [116, 256, 396];
  centers.forEach((cx, idx) => {
    const cy = 128;
    const r = 42;

    if (!revealed) {
      ctx.strokeStyle = 'rgba(150, 155, 170, 0.14)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }

    // Phosphor glow ring
    const grad = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 1.45);
    grad.addColorStop(0, idx === 2 ? 'rgba(195, 58, 62, 0.55)' : 'rgba(110, 178, 255, 0.55)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.45, 0, Math.PI * 2);
    ctx.fill();

    if (idx === 0) {
      // Waning Crescent
      ctx.fillStyle = '#a8d5ff';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#181a20';
      ctx.beginPath();
      ctx.arc(cx + 15, cy - 4, r * 0.88, 0, Math.PI * 2);
      ctx.fill();
    } else if (idx === 1) {
      // Total Eclipse
      ctx.strokeStyle = '#9ac8ff';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#090b10';
      ctx.beginPath();
      ctx.arc(cx, cy, r - 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Blood Moon
      ctx.fillStyle = '#b9383c';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e88b8d';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });

  if (revealed) {
    ctx.fillStyle = '#cfe5ff';
    ctx.font = '600 16px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('I. WANING CRESCENT', 116, 206);
    ctx.fillText('II. TOTAL ECLIPSE', 256, 206);
    ctx.fillText('III. BLOOD MOON', 396, 206);
  } else {
    ctx.fillStyle = 'rgba(160, 165, 175, 0.25)';
    ctx.font = 'italic 15px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('The pigment is too faint for bare eyes...', 256, 212);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createPortraitTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(256, 384);
  const bg = ctx.createLinearGradient(0, 0, 0, 384);
  bg.addColorStop(0, '#1b1718');
  bg.addColorStop(1, '#0d0b0d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 256, 384);

  // Victorian coat silhouette
  ctx.fillStyle = '#14131a';
  ctx.beginPath();
  ctx.moveTo(42, 384);
  ctx.lineTo(74, 224);
  ctx.lineTo(182, 224);
  ctx.lineTo(214, 384);
  ctx.closePath();
  ctx.fill();

  // Cravat
  ctx.fillStyle = '#b9b09f';
  ctx.beginPath();
  ctx.moveTo(116, 224);
  ctx.lineTo(140, 224);
  ctx.lineTo(128, 282);
  ctx.closePath();
  ctx.fill();

  // Pale angular low-poly face
  ctx.fillStyle = '#8b8378';
  ctx.beginPath();
  ctx.moveTo(128, 86);
  ctx.lineTo(164, 120);
  ctx.lineTo(156, 190);
  ctx.lineTo(128, 214);
  ctx.lineTo(100, 190);
  ctx.lineTo(92, 120);
  ctx.closePath();
  ctx.fill();

  // Shadowed hollow eyes
  ctx.fillStyle = '#070709';
  ctx.beginPath();
  ctx.arc(112, 146, 8, 0, Math.PI * 2);
  ctx.arc(144, 146, 8, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(128, 128);
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 62);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
  grad.addColorStop(0.65, 'rgba(0, 0, 0, 0.22)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
