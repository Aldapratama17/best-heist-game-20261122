export const TileSize = 40;

export const Room = {
  width: 1180,
  height: 660,
  cols: 1180 / 40,
  rows: 660 / 40,
};

export const Walls = [
  { x: 0, y: 0, w: 1180, h: 40 },
  { x: 0, y: 620, w: 1180, h: 40 },
  { x: 0, y: 0, w: 40, h: 660 },
  { x: 1140, y: 0, w: 40, h: 660 },
  { x: 280, y: 160, w: 40, h: 200 },
  { x: 560, y: 80, w: 40, h: 160 },
  { x: 840, y: 160, w: 40, h: 200 },
];

export const Cover = [
  { x: 160, y: 200, w: 80, h: 80, type: 'pedestal' },
  { x: 400, y: 120, w: 120, h: 60, type: 'planter' },
  { x: 640, y: 300, w: 100, h: 100, type: 'pedestal' },
  { x: 920, y: 200, w: 80, h: 80, type: 'pedestal' },
  { x: 200, y: 480, w: 120, h: 60, type: 'planter' },
  { x: 520, y: 440, w: 100, h: 100, type: 'pedestal' },
  { x: 860, y: 480, w: 120, h: 60, type: 'planter' },
];

export const VaultDoor = { x: 550, y: 0, w: 80, h: 40 };
export const ExitDoor = { x: 550, y: 620, w: 80, h: 40 };

export const LootPos = { x: 590, y: 330 };

export const GuardPatrols = [
  { x: 200, y: 180, waypoints: [[200, 180], [200, 460], [460, 460], [460, 180]] },
  { x: 700, y: 120, waypoints: [[700, 120], [980, 120], [980, 380], [700, 380]] },
  { x: 980, y: 500, waypoints: [[980, 500], [700, 500], [700, 580], [980, 580]] },
];

export const CameraPositions = [
  { x: 400, y: 40, angle: Math.PI / 2, range: 280, fov: Math.PI / 3, speed: 0.35 },
  { x: 780, y: 40, angle: Math.PI / 2, range: 280, fov: Math.PI / 3, speed: 0.4 },
  { x: 1100, y: 330, angle: Math.PI, range: 240, fov: Math.PI / 4, speed: 0.3 },
];

export function getAllObstacles() {
  return [...Walls, ...Cover.map(c => ({ x: c.x, y: c.y, w: c.w, h: c.h }))];
}

export function pointInRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

export function rectsIntersect(r1, r2) {
  return r1.x < r2.x + r2.w &&
         r1.x + r1.w > r2.x &&
         r1.y < r2.y + r2.h &&
         r1.y + r1.h > r2.y;
}

export function clampToRoom(x, y, radius = 0) {
  return {
    x: Math.max(40 + radius, Math.min(1140 - radius, x)),
    y: Math.max(40 + radius, Math.min(620 - radius, y))
  };
}
