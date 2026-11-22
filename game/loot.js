export class Loot {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 16;
    this.collected = false;
    this.glowPhase = 0;
    this.sparkleTimer = 0;
    this.sparkles = [];
    for (let i = 0; i < 8; i++) {
      this.sparkles.push({
        angle: (i / 8) * Math.PI * 2,
        radius: 20 + Math.random() * 10,
        speed: 0.5 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  update(dt) {
    this.glowPhase += dt * 2;
    this.sparkleTimer += dt;
    
    for (const s of this.sparkles) {
      s.angle += s.speed * dt;
      s.phase += dt * 3;
    }
  }

  checkPickup(thief) {
    if (this.collected) return false;
    const dx = thief.x - this.x;
    const dy = thief.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < this.radius + thief.radius) {
      this.collected = true;
      return true;
    }
    return false;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.collected = false;
    this.glowPhase = 0;
    this.sparkleTimer = 0;
  }
}
