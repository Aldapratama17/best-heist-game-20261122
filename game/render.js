export const Palette = {
  floor: '#0a0e17',
  floorGrid: '#121824',
  wall: '#1a1f2e',
  wallTop: '#242b3e',
  cover: '#151a28',
  coverTop: '#1e2436',
  thief: '#e8dcc8',
  thiefCrouch: '#c8bca8',
  guard: '#d44a3a',
  guardCone: 'rgba(212, 74, 58, 0.18)',
  guardConeAlert: 'rgba(255, 180, 40, 0.22)',
  guardConeSpotted: 'rgba(255, 60, 40, 0.28)',
  camera: '#3a5a5a',
  cameraCone: 'rgba(50, 200, 200, 0.15)',
  cameraConeSpotted: 'rgba(255, 100, 50, 0.25)',
  loot: '#ffd700',
  lootGlow: 'rgba(255, 215, 0, 0.6)',
  exitGlow: 'rgba(60, 255, 100, 0.5)',
  exitDoor: '#1a3a1a',
  hudBg: 'rgba(10, 14, 23, 0.85)',
  hudFg: '#e8dcc8',
  hudAccent: '#ffd700',
  alarmLow: '#4ade80',
  alarmMid: '#fbbf24',
  alarmHigh: '#ef4444',
  text: '#e8dcc8',
  textDim: '#8a8a9a',
  coin: '#c8b850',
  sparkle: '#fff8c0',
};

export function drawRect(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}

export function drawRectStroke(ctx, x, y, w, h, color, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

export function drawCircle(ctx, x, y, r, fill) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

export function drawCircleStroke(ctx, x, y, r, color, width = 1) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

export function drawCone(ctx, x, y, angle, fov, range, fill) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  const half = fov / 2;
  ctx.arc(x, y, range, angle - half, angle + half);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

export function drawText(ctx, text, x, y, size = 14, color = Palette.text, align = 'left', baseline = 'top') {
  ctx.font = `${size}px 'IBM Plex Mono', 'JetBrains Mono', 'Fira Mono', monospace`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, x, y);
}

export function drawTextStroke(ctx, text, x, y, size = 14, color = Palette.text, strokeColor = '#000', lineWidth = 3) {
  ctx.font = `${size}px 'IBM Plex Mono', 'JetBrains Mono', 'Fira Mono', monospace`;
  ctx.fillStyle = color;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
}

export function drawGlow(ctx, x, y, radius, color) {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
}

export function drawSparkle(ctx, x, y, time, scale = 1) {
  const spikes = 4;
  const outerR = 6 * scale;
  const innerR = 2 * scale;
  const rot = time * 3;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const a = rot + (i / (spikes * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = Palette.sparkle;
  ctx.fill();
}

export function clipConeByWalls(ctx, x, y, angle, fov, range, walls) {
  const half = fov / 2;
  const startAngle = angle - half;
  const endAngle = angle + half;
  const steps = 32;
  const points = [[x, y]];
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const rayAngle = startAngle + (endAngle - startAngle) * t;
    let hitDist = range;
    
    for (const wall of walls) {
      const dist = rayRectIntersect(x, y, rayAngle, wall.x, wall.y, wall.w, wall.h);
      if (dist !== null && dist < hitDist) {
        hitDist = dist;
      }
    }
    
    points.push([x + Math.cos(rayAngle) * hitDist, y + Math.sin(rayAngle) * hitDist]);
  }
  
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
  ctx.closePath();
}

export function rayRectIntersect(ox, oy, angle, rx, ry, rw, rh) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  
  let tmin = -Infinity;
  let tmax = Infinity;
  
  if (Math.abs(dx) < 1e-10) {
    if (ox < rx || ox > rx + rw) return null;
  } else {
    const tx1 = (rx - ox) / dx;
    const tx2 = (rx + rw - ox) / dx;
    tmin = Math.max(tmin, Math.min(tx1, tx2));
    tmax = Math.min(tmax, Math.max(tx1, tx2));
  }
  
  if (Math.abs(dy) < 1e-10) {
    if (oy < ry || oy > ry + rh) return null;
  } else {
    const ty1 = (ry - oy) / dy;
    const ty2 = (ry + rh - oy) / dy;
    tmin = Math.max(tmin, Math.min(ty1, ty2));
    tmax = Math.min(tmax, Math.max(ty1, ty2));
  }
  
  if (tmax >= tmin && tmax >= 0) {
    return Math.max(tmin, 0);
  }
  return null;
}

export function drawConeClipped(ctx, x, y, angle, fov, range, fill, walls) {
  clipConeByWalls(ctx, x, y, angle, fov, range, walls);
  ctx.fillStyle = fill;
  ctx.fill();
}
