export class Alarm {
  constructor() {
    this.level = 0;
    this.maxLevel = 100;
    this.decayRate = 8;
    this.riseRate = 35;
  }

  update(dt, guards, cameras, thief) {
    let detected = false;
    
    for (const guard of guards) {
      if (guard.suspicion > 0.7) {
        detected = true;
        break;
      }
      if (guard.suspicion > 0.3) {
        this.level += this.riseRate * 0.3 * dt;
      }
    }
    
    for (const camera of cameras) {
      if (camera.detected) {
        detected = true;
        break;
      }
      if (camera.detectionTimer > 0) {
        this.level += this.riseRate * 0.5 * dt;
      }
    }
    
    if (detected) {
      this.level += this.riseRate * dt;
    }
    
    if (!detected) {
      this.level = Math.max(0, this.level - this.decayRate * dt);
    }
    
    this.level = Math.max(0, Math.min(this.maxLevel, this.level));
  }

  isMaxed() {
    return this.level >= this.maxLevel;
  }

  getPercent() {
    return Math.round(this.level);
  }

  getColor() {
    if (this.level < 33) return 'alarmLow';
    if (this.level < 66) return 'alarmMid';
    return 'alarmHigh';
  }

  reset() {
    this.level = 0;
  }
}
