
import { rayRectIntersect } from './render.js';

export class Camera {
  constructor(config) {
    this.x = config.x;
    this.y = config.y;
    this.baseAngle = config.angle;
    this.angle = config.angle;
    this.range = config.range;
    this.fov = config.fov;
    this.speed = config.speed;
    this.radius = 10;
    this.sweepDir = 1;
    this.detected = false;
    this.detectionTimer = 0;
  }

  update(dt, thief, walls, audio) {
    this.angle += this.speed * this.sweepDir * dt;
    
    const sweepRange = this.fov * 1.5;
    const minAngle = this.baseAngle - sweepRange / 2;
    const maxAngle = this.baseAngle + sweepRange / 2;
    
    if (this.angle >= maxAngle) {
      this.angle = maxAngle;
      this.sweepDir = -1;
    } else if (this.angle <= minAngle) {
      this.angle = minAngle;
      this.sweepDir = 1;
    }
    
    this.detected = this.checkVision(thief, walls);
    
    if (this.detected) {
      this.detectionTimer = 0.5;
      audio?.playAlert();
    } else {
      this.detectionTimer = Math.max(0, this.detectionTimer - dt);
    }
  }

  checkVision(thief, walls) {
    const dx = thief.x - this.x;
    const dy = thief.y - this.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist > this.range) return false;
    
    const angleToThief = Math.atan2(dy, dx);
    let diff = angleToThief - this.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    
    if (Math.abs(diff) > this.fov / 2) return false;
    
    const detectionRadius = thief.getDetectionRadius();
    if (detectionRadius < 10 && dist > this.range * 0.5) {
      return false;
    }
    
    for (const wall of walls) {
      const hitDist = rayRectIntersect(this.x, this.y, angleToThief, wall.x, wall.y, wall.w, wall.h);
      if (hitDist !== null && hitDist < dist - 5) {
        return false;
      }
    }
    
    return true;
  }

  getConeColor() {
    return this.detected || this.detectionTimer > 0 ? 'cameraConeSpotted' : 'cameraCone';
  }

  reset(config) {
    this.x = config.x;
    this.y = config.y;
    this.baseAngle = config.angle;
    this.angle = config.angle;
    this.range = config.range;
    this.fov = config.fov;
    this.speed = config.speed;
    this.detected = false;
    this.detectionTimer = 0;
    this.sweepDir = 1;
  }
}
