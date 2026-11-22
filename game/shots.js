import { Thief } from './thief.js';
import { Guard } from './guards.js';
import { Camera } from './cameras.js';
import { Loot } from './loot.js';
import { Alarm } from './alarm.js';
import { GuardPatrols, CameraPositions, LootPos } from './level.js';
import { SeededRNG } from './rng.js';

export class ShotManager {
  constructor(game) {
    this.game = game;
    this.shotName = null;
    this.seed = 12345;
    this.shotTimer = 0;
    this.frozen = false;
    this.rng = new SeededRNG(this.seed);
  }

  parseParams() {
    const params = new URLSearchParams(window.location.search);
    this.shotName = params.get('shot');
    const seedParam = params.get('seed');
    if (seedParam) this.seed = parseInt(seedParam, 10);
    this.rng = new SeededRNG(this.seed);
    return this.shotName !== null;
  }

  setupShot() {
    if (!this.shotName) return false;
    
    const { thief, guards, cameras, loot, alarm } = this.game;
    
    switch (this.shotName) {
      case 'patrol':
        this.setupPatrolShot(thief, guards, cameras, loot, alarm);
        break;
      case 'loot':
        this.setupLootShot(thief, guards, cameras, loot, alarm);
        break;
      case 'alarm':
        this.setupAlarmShot(thief, guards, cameras, loot, alarm);
        break;
      case 'title':
        this.setupTitleShot();
        break;
      default:
        return false;
    }
    
    this.frozen = false;
    this.shotTimer = 0;
    return true;
  }

  setupPatrolShot(thief, guards, cameras, loot, alarm) {
    thief.reset(590, 330);
    thief.hasLoot = false;
    
    for (let i = 0; i < guards.length; i++) {
      const patrol = GuardPatrols[i];
      guards[i].reset(patrol, this.game.difficulty);
      guards[i].x = patrol.waypoints[1][0];
      guards[i].y = patrol.waypoints[1][1];
      guards[i].currentWaypoint = 1;
      guards[i].coneAngle = Math.atan2(
        patrol.waypoints[2][1] - patrol.waypoints[1][1],
        patrol.waypoints[2][0] - patrol.waypoints[1][0]
      );
      guards[i].suspicion = 0;
      guards[i].alerted = false;
    }
    
    for (let i = 0; i < cameras.length; i++) {
      const config = CameraPositions[i];
      cameras[i].reset(config);
      cameras[i].angle = config.angle + (this.rng.next() - 0.5) * 0.5;
    }
    
    loot.reset(LootPos.x, LootPos.y);
    alarm.reset();
    this.game.timer = 45.5;
    this.game.state = 'playing';
  }

  setupLootShot(thief, guards, cameras, loot, alarm) {
    thief.reset(590, 330);
    thief.hasLoot = false;
    
    for (let i = 0; i < guards.length; i++) {
      const patrol = GuardPatrols[i];
      guards[i].reset(patrol, this.game.difficulty);
      guards[i].x = patrol.waypoints[0][0] + 40;
      guards[i].y = patrol.waypoints[0][1] + 40;
      guards[i].currentWaypoint = 0;
    }
    
    for (let i = 0; i < cameras.length; i++) {
      const config = CameraPositions[i];
      cameras[i].reset(config);
      cameras[i].angle = config.angle + Math.PI / 4;
    }
    
    loot.reset(LootPos.x, LootPos.y);
    loot.glowPhase = 2.5;
    alarm.reset();
    this.game.timer = 22.3;
    this.game.state = 'playing';
  }

  setupAlarmShot(thief, guards, cameras, loot, alarm) {
    thief.reset(400, 300);
    thief.hasLoot = false;
    thief.crouching = false;
    
    for (let i = 0; i < guards.length; i++) {
      const patrol = GuardPatrols[i];
      guards[i].reset(patrol, this.game.difficulty);
    }
    
    guards[0].x = 320;
    guards[0].y = 280;
    guards[0].coneAngle = Math.atan2(thief.y - guards[0].y, thief.x - guards[0].x);
    guards[0].suspicion = 0.95;
    guards[0].alerted = true;
    guards[0].investigating = false;
    
    for (let i = 1; i < guards.length; i++) {
      guards[i].suspicion = 0.2;
    }
    
    for (let i = 0; i < cameras.length; i++) {
      const config = CameraPositions[i];
      cameras[i].reset(config);
    }
    
    cameras[0].angle = Math.atan2(thief.y - cameras[0].y, thief.x - cameras[0].x);
    cameras[0].detected = true;
    cameras[0].detectionTimer = 1;
    
    loot.reset(LootPos.x, LootPos.y);
    alarm.level = 88;
    this.shotTimer = 1.0;
    this.frozen = true;
    this.game.timer = 67.8;
    this.game.state = 'playing';
  }

  setupTitleShot() {
    this.game.state = 'title';
    this.game.timer = 0;
  }

  update(dt) {
    if (!this.shotName) return;
    
    if (!this.frozen) {
      this.shotTimer += dt;
      if (this.shotTimer >= 1.0) {
        this.frozen = true;
      }
    }
  }

  shouldFreeze() {
    return this.frozen;
  }
}
