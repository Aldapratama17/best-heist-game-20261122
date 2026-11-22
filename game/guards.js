import { rayRectIntersect } from './render.js';

export class Guard {
  constructor(patrol, difficulty = 1) {
    this.x = patrol.x;
    this.y = patrol.y;
    this.waypoints = patrol.waypoints.map(wp => ({ x: wp[0], y: wp[1] }));
    this.currentWaypoint = 0;
    this.speed = 70 * difficulty;
    this.radius = 12;
    this.coneRange = 200;
    this.coneFov = Math.PI / 3;
    this.coneAngle = 0;
    this.targetConeAngle = 0;
    this.suspicion = 0;
    this.suspicionTarget = 0;
    this.alerted = false;
    this.investigating = false;
    this.investigateTarget = null;
    this.investigateTimer = 0;
    this.patrolPauseTimer = 0;
    this.lastSeenThief = null;
    this.turnSpeed = 4;
    this.suspicionRiseSpeed = 2.5;
    this.suspicionFallSpeed = 1.2;
    this.idleTurnTimer = 0;
    this.idleTurnTarget = 0;
  }

  update(dt, thief, walls, audio) {
    const obstacles = walls;
    
    if (this.investigating) {
      this.handleInvestigate(dt, obstacles);
      this.updateConeAngle(dt);
      return;
    }
    
    if (this.patrolPauseTimer > 0) {
      this.patrolPauseTimer -= dt;
      this.updateConeTowardsWaypoint();
      this.updateConeAngle(dt);
      return;
    }
    
    const targetWp = this.waypoints[this.currentWaypoint];
    const dx = targetWp.x - this.x;
    const dy = targetWp.y - this.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist < 10) {
      this.currentWaypoint = (this.currentWaypoint + 1) % this.waypoints.length;
      this.patrolPauseTimer = 0.8 + Math.random() * 0.5;
      this.idleTurnTimer = this.patrolPauseTimer;
      const nextWp = this.waypoints[this.currentWaypoint];
      this.idleTurnTarget = Math.atan2(nextWp.y - this.y, nextWp.x - this.x);
      return;
    }
    
    const moveAngle = Math.atan2(dy, dx);
    const newX = this.x + Math.cos(moveAngle) * this.speed * dt;
    const newY = this.y + Math.sin(moveAngle) * this.speed * dt;
    
    const futureRect = { x: newX - this.radius, y: newY - this.radius, w: this.radius * 2, h: this.radius * 2 };
    let blocked = false;
    for (const wall of obstacles) {
      if (this.rectsIntersect(futureRect, wall)) {
        blocked = true;
        break;
      }
    }
    
    if (!blocked) {
      this.x = newX;
      this.y = newY;
    } else {
      this.currentWaypoint = (this.currentWaypoint + 1) % this.waypoints.length;
      return;
    }
    
    this.targetConeAngle = moveAngle;
    this.updateConeAngle(dt);
    this.updateSuspicion(dt, thief, obstacles);
  }

  handleInvestigate(dt, obstacles) {
    if (!this.investigateTarget) {
      this.investigating = false;
      return;
    }
    
    const dx = this.investigateTarget.x - this.x;
    const dy = this.investigateTarget.y - this.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist < 15) {
      this.investigating = false;
      this.investigateTarget = null;
      this.investigateTimer = 2 + Math.random() * 2;
      this.patrolPauseTimer = this.investigateTimer;
      this.suspicion = Math.max(this.suspicion, 0.3);
      return;
    }
    
    const moveAngle = Math.atan2(dy, dx);
    const newX = this.x + Math.cos(moveAngle) * this.speed * 0.7 * dt;
    const newY = this.y + Math.sin(moveAngle) * this.speed * 0.7 * dt;
    
    const futureRect = { x: newX - this.radius, y: newY - this.radius, w: this.radius * 2, h: this.radius * 2 };
    let blocked = false;
    for (const wall of obstacles) {
      if (this.rectsIntersect(futureRect, wall)) {
        blocked = true;
        break;
      }
    }
    
    if (!blocked) {
      this.x = newX;
      this.y = newY;
    } else {
      this.investigating = false;
      this.investigateTarget = null;
      return;
    }
    
    this.targetConeAngle = moveAngle;
    this.updateConeAngle(dt);
    this.investigateTimer -= dt;
    if (this.investigateTimer <= 0) {
      this.investigating = false;
      this.investigateTarget = null;
    }
  }

  updateConeAngle(dt) {
    let diff = this.targetConeAngle - this.coneAngle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    
    const maxTurn = this.turnSpeed * dt;
    if (Math.abs(diff) <= maxTurn) {
      this.coneAngle = this.targetConeAngle;
    } else {
      this.coneAngle += Math.sign(diff) * maxTurn;
    }
    
    while (this.coneAngle > Math.PI) this.coneAngle -= Math.PI * 2;
    while (this.coneAngle < -Math.PI) this.coneAngle += Math.PI * 2;
  }

  updateConeTowardsWaypoint() {
    if (this.idleTurnTimer > 0) {
      this.targetConeAngle = this.idleTurnTarget;
      this.idleTurnTimer = Math.max(0, this.idleTurnTimer - 1/60);
    } else {
      const targetWp = this.waypoints[this.currentWaypoint];
      const dx = targetWp.x - this.x;
      const dy = targetWp.y - this.y;
      this.targetConeAngle = Math.atan2(dy, dx);
    }
  }

  updateSuspicion(dt, thief, obstacles) {
    const canSee = this.checkVision(thief, obstacles);
    const detectionRadius = thief.getDetectionRadius();
    const dx = thief.x - this.x;
    const dy = thief.y - this.y;
    const dist = Math.hypot(dx, dy);
    
    if (canSee && dist < this.coneRange) {
      this.suspicionTarget = 1;
      this.lastSeenThief = { x: thief.x, y: thief.y };
      if (!this.alerted) {
        this.alerted = true;
        audio?.playAlert();
      }
    } else if (this.alerted && this.lastSeenThief) {
      const dxLast = this.lastSeenThief.x - this.x;
      const dyLast = this.lastSeenThief.y - this.y;
      const distLast = Math.hypot(dxLast, dyLast);
      if (distLast < this.coneRange * 1.5) {
        this.suspicionTarget = Math.max(this.suspicionTarget, 0.6);
        this.targetConeAngle = Math.atan2(dyLast, dxLast);
      } else {
        this.suspicionTarget = Math.max(this.suspicionTarget, 0.3);
      }
    } else if (dist < detectionRadius * 2.5) {
      this.suspicionTarget = Math.max(this.suspicionTarget, 0.25);
    } else {
      this.suspicionTarget = 0;
    }
    
    const riseSpeed = this.alerted ? this.suspicionRiseSpeed * 1.5 : this.suspicionRiseSpeed;
    const fallSpeed = this.suspicionFallSpeed;
    
    if (this.suspicionTarget > this.suspicion) {
      this.suspicion += (this.suspicionTarget - this.suspicion) * riseSpeed * dt;
    } else {
      this.suspicion += (this.suspicionTarget - this.suspicion) * fallSpeed * dt;
    }
    
    this.suspicion = Math.max(0, Math.min(1, this.suspicion));
    
    if (this.suspicion < 0.1) {
      this.alerted = false;
      this.lastSeenThief = null;
    }
  }

  checkVision(thief, obstacles) {
    const dx = thief.x - this.x;
    const dy = thief.y - this.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist > this.coneRange) return false;
    
    const angleToThief = Math.atan2(dy, dx);
    let diff = angleToThief - this.coneAngle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    
    if (Math.abs(diff) > this.coneFov / 2) return false;
    
    const detectionRadius = thief.getDetectionRadius();
    if (detectionRadius < 10 && dist > this.coneRange * 0.7) {
      return false;
    }
    
    for (const wall of obstacles) {
      const hitDist = rayRectIntersect(this.x, this.y, angleToThief, wall.x, wall.y, wall.w, wall.h);
      if (hitDist !== null && hitDist < dist - 5) {
        return false;
      }
    }
    
    return true;
  }

  lureTo(x, y) {
    if (!this.investigating && this.suspicion < 0.8) {
      this.investigating = true;
      this.investigateTarget = { x, y };
      this.investigateTimer = 5;
    }
  }

  getConeColor() {
    if (this.suspicion > 0.7) return 'guardConeSpotted';
    if (this.suspicion > 0.35) return 'guardConeAlert';
    return 'guardCone';
  }

  rectsIntersect(r1, r2) {
    return r1.x < r2.x + r2.w &&
           r1.x + r1.w > r2.x &&
           r1.y < r2.y + r2.h &&
           r1.y + r1.h > r2.y;
  }

  reset(patrol, difficulty = 1) {
    this.x = patrol.x;
    this.y = patrol.y;
    this.currentWaypoint = 0;
    this.speed = 70 * difficulty;
    this.suspicion = 0;
    this.suspicionTarget = 0;
    this.alerted = false;
    this.investigating = false;
    this.investigateTarget = null;
    this.investigateTimer = 0;
    this.patrolPauseTimer = 0;
    this.lastSeenThief = null;
    this.coneAngle = 0;
    this.targetConeAngle = 0;
    this.idleTurnTimer = 0;
  }
}
