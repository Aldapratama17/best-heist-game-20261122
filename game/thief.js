import { clampToRoom, rectsIntersect } from './level.js';

export class Thief {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 14;
    this.speed = 160;
    this.crouchSpeed = 70;
    this.crouching = false;
    this.detectionRadius = 18;
    this.crouchDetectionRadius = 8;
    this.coins = 3;
    this.coinCooldown = 0;
    this.lastMoveAngle = 0;
    this.hasLoot = false;
    this.lootTimer = 0;
  }

  update(dt, input, walls) {
    this.coinCooldown = Math.max(0, this.coinCooldown - dt);
    
    let moveX = 0;
    let moveY = 0;
    
    if (input.left) moveX -= 1;
    if (input.right) moveX += 1;
    if (input.up) moveY -= 1;
    if (input.down) moveY += 1;
    
    const moving = moveX !== 0 || moveY !== 0;
    
    if (moving) {
      const len = Math.hypot(moveX, moveY);
      moveX /= len;
      moveY /= len;
      this.lastMoveAngle = Math.atan2(moveY, moveX);
    }
    
    const speed = this.crouching ? this.crouchSpeed : this.speed;
    const newX = this.x + moveX * speed * dt;
    const newY = this.y + moveY * speed * dt;
    
    const futureRect = {
      x: newX - this.radius,
      y: newY - this.radius,
      w: this.radius * 2,
      h: this.radius * 2
    };
    
    let blocked = false;
    for (const wall of walls) {
      if (rectsIntersect(futureRect, wall)) {
        blocked = true;
        break;
      }
    }
    
    if (!blocked) {
      this.x = newX;
      this.y = newY;
    } else {
      const futureRectX = { x: newX - this.radius, y: this.y - this.radius, w: this.radius * 2, h: this.radius * 2 };
      let blockedX = false;
      for (const wall of walls) {
        if (rectsIntersect(futureRectX, wall)) { blockedX = true; break; }
      }
      if (!blockedX) this.x = newX;
      
      const futureRectY = { x: this.x - this.radius, y: newY - this.radius, w: this.radius * 2, h: this.radius * 2 };
      let blockedY = false;
      for (const wall of walls) {
        if (rectsIntersect(futureRectY, wall)) { blockedY = true; break; }
      }
      if (!blockedY) this.y = newY;
    }
    
    const clamped = clampToRoom(this.x, this.y, this.radius);
    this.x = clamped.x;
    this.y = clamped.y;
    
    if (this.hasLoot) {
      this.lootTimer += dt;
    }
  }

  setCrouch(crouching) {
    this.crouching = crouching;
  }

  throwCoin() {
    if (this.coins > 0 && this.coinCooldown <= 0) {
      this.coins--;
      this.coinCooldown = 0.5;
      return {
        x: this.x + Math.cos(this.lastMoveAngle) * 30,
        y: this.y + Math.sin(this.lastMoveAngle) * 30
      };
    }
    return null;
  }

  getDetectionRadius() {
    return this.crouching ? this.crouchDetectionRadius : this.detectionRadius;
  }

  pickupLoot() {
    this.hasLoot = true;
    this.lootTimer = 0;
  }

  atExit(exitRect) {
    const dx = this.x - (exitRect.x + exitRect.w / 2);
    const dy = this.y - (exitRect.y + exitRect.h / 2);
    return Math.hypot(dx, dy) < 40;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.crouching = false;
    this.coins = 3;
    this.coinCooldown = 0;
    this.hasLoot = false;
    this.lootTimer = 0;
  }
}
