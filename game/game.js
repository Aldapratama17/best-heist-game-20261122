import { Thief } from './thief.js';
import { Guard } from './guards.js';
import { Camera } from './cameras.js';
import { Loot } from './loot.js';
import { Alarm } from './alarm.js';
import { ShotManager } from './shots.js';
import { input } from './input.js';
import { audio } from './audio.js';
import { Room, Walls, Cover, VaultDoor, ExitDoor, LootPos, GuardPatrols, CameraPositions, getAllObstacles } from './level.js';
import { Palette, drawRect, drawCircle, drawGlow, drawSparkle, drawConeClipped, drawRectStroke, drawCircleStroke } from './render.js';
import { HUD, drawTitleScreen, drawWinScreen, drawCaughtScreen } from './hud.js';

export class Game {
  constructor() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = 1180;
    this.canvas.height = 660;
    
    this.state = 'title';
    this.timer = 0;
    this.difficulty = 1;
    this.shotManager = new ShotManager(this);
    
    this.walls = getAllObstacles();
    
    this.thief = new Thief(Room.width / 2, Room.height / 2);
    this.guards = GuardPatrols.map(p => new Guard(p, this.difficulty));
    this.cameras = CameraPositions.map(c => new Camera(c));
    this.loot = new Loot(LootPos.x, LootPos.y);
    this.alarm = new Alarm();
    this.hud = new HUD();
    
    this.shotActive = this.shotManager.parseParams();
    if (this.shotActive) {
      this.shotManager.setupShot();
    }
    
    this.lastTime = performance.now();
    this.frameCount = 0;
  }

  update(dt) {
    this.frameCount++;
    
    if (this.shotActive) {
      this.shotManager.update(dt);
      if (this.shotManager.shouldFreeze()) {
        return;
      }
    }
    
    const movement = input.getMovement();
    
    switch (this.state) {
      case 'title':
        if (movement.enter) {
          this.startGame();
        }
        break;
        
      case 'playing':
        this.updatePlaying(dt, movement);
        break;
        
      case 'won':
        if (movement.enter) {
          this.nextLevel();
        }
        break;
        
      case 'caught':
        if (movement.enter) {
          this.restart();
        }
        break;
    }
    
    this.timer += dt;
  }

  updatePlaying(dt, movement) {
    this.thief.setCrouch(movement.crouch);
    this.thief.update(dt, movement, this.walls);
    
    const click = input.consumeClick();
    if (click) {
      const rect = this.canvas.getBoundingClientRect();
      const coinPos = this.thief.throwCoin();
      if (coinPos) {
        audio.playCoin();
        for (const guard of this.guards) {
          guard.lureTo(coinPos.x, coinPos.y);
        }
      }
    }
    
    for (const guard of this.guards) {
      guard.update(dt, this.thief, this.walls, audio);
    }
    
    for (const camera of this.cameras) {
      camera.update(dt, this.thief, this.walls, audio);
    }
    
    this.loot.update(dt);
    
    if (!this.loot.collected && this.loot.checkPickup(this.thief)) {
      this.thief.pickupLoot();
      audio.playWin();
    }
    
    this.alarm.update(dt, this.guards, this.cameras, this.thief);
    
    if (this.alarm.isMaxed()) {
      this.state = 'caught';
      audio.playCaught();
      return;
    }
    
    if (this.thief.hasLoot && this.thief.atExit(ExitDoor)) {
      this.state = 'won';
      audio.playWin();
    }
  }

  startGame() {
    this.state = 'playing';
    this.timer = 0;
    this.resetEntities();
    audio.setEnabled(true);
    audio.resume();
  }

  nextLevel() {
    this.difficulty++;
    this.state = 'playing';
    this.timer = 0;
    this.resetEntities();
  }

  restart() {
    this.state = 'playing';
    this.timer = 0;
    this.resetEntities();
  }

  resetEntities() {
    this.thief.reset(Room.width / 2, Room.height / 2);
    
    for (let i = 0; i < this.guards.length; i++) {
      this.guards[i].reset(GuardPatrols[i], this.difficulty);
    }
    
    for (let i = 0; i < this.cameras.length; i++) {
      this.cameras[i].reset(CameraPositions[i]);
    }
    
    this.loot.reset(LootPos.x, LootPos.y);
    this.alarm.reset();
  }

  render() {
    const ctx = this.ctx;
    
    this.drawBackground(ctx);
    this.drawWalls(ctx);
    this.drawCover(ctx);
    this.drawVaultDoor(ctx);
    this.drawExitDoor(ctx);
    
    for (const camera of this.cameras) {
      this.drawCamera(ctx, camera);
    }
    
    for (const guard of this.guards) {
      this.drawGuard(ctx, guard);
    }
    
    this.drawLoot(ctx);
    this.drawThief(ctx);
    
    this.hud.render(ctx, this.alarm, this.thief, this.timer, this.difficulty);
    
    switch (this.state) {
      case 'title':
        drawTitleScreen(ctx, this.timer);
        break;
      case 'won':
        drawWinScreen(ctx, this.timer, this.timer);
        break;
      case 'caught':
        drawCaughtScreen(ctx, this.timer);
        break;
    }
  }

  drawBackground(ctx) {
    drawRect(ctx, 0, 0, Room.width, Room.height, Palette.floor);
    
    ctx.strokeStyle = Palette.floorGrid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 40; x < Room.width; x += 40) {
      ctx.moveTo(x + 0.5, 40);
      ctx.lineTo(x + 0.5, Room.height - 40);
    }
    for (let y = 40; y < Room.height; y += 40) {
      ctx.moveTo(40, y + 0.5);
      ctx.lineTo(Room.width - 40, y + 0.5);
    }
    ctx.stroke();
  }

  drawWalls(ctx) {
    for (const wall of Walls) {
      drawRect(ctx, wall.x, wall.y, wall.w, wall.h, Palette.wall);
      drawRect(ctx, wall.x, wall.y, wall.w, 4, Palette.wallTop);
    }
  }

  drawCover(ctx) {
    for (const c of Cover) {
      drawRect(ctx, c.x, c.y, c.w, c.h, Palette.cover);
      drawRect(ctx, c.x, c.y, c.w, 6, Palette.coverTop);
      
      if (c.type === 'pedestal') {
        drawRect(ctx, c.x + 10, c.y + 10, c.w - 20, c.h - 20, Palette.wall);
      }
    }
  }

  drawVaultDoor(ctx) {
    drawRect(ctx, VaultDoor.x, VaultDoor.y, VaultDoor.w, VaultDoor.h, '#2a1a1a');
    drawRect(ctx, VaultDoor.x + 10, VaultDoor.y + 8, VaultDoor.w - 20, 12, '#3a2a2a');
    drawRectStroke(ctx, VaultDoor.x, VaultDoor.y, VaultDoor.w, VaultDoor.h, '#4a3a3a');
  }

  drawExitDoor(ctx) {
    drawRect(ctx, ExitDoor.x, ExitDoor.y, ExitDoor.w, ExitDoor.h, Palette.exitDoor);
    drawRect(ctx, ExitDoor.x + 10, ExitDoor.y + 8, ExitDoor.w - 20, 12, '#2a4a2a');
    drawGlow(ctx, ExitDoor.x + ExitDoor.w / 2, ExitDoor.y + ExitDoor.h / 2, 60, Palette.exitGlow);
  }

  drawCamera(ctx, camera) {
    drawConeClipped(ctx, camera.x, camera.y, camera.angle, camera.fov, camera.range, Palette[camera.getConeColor()], this.walls);
    
    drawCircle(ctx, camera.x, camera.y, camera.radius, Palette.camera);
    drawCircleStroke(ctx, camera.x, camera.y, camera.radius, '#2a4a4a');
    
    const lensX = camera.x + Math.cos(camera.angle) * (camera.radius + 2);
    const lensY = camera.y + Math.sin(camera.angle) * (camera.radius + 2);
    drawCircle(ctx, lensX, lensY, 3, camera.detected ? '#ff6432' : '#4affff');
  }

  drawGuard(ctx, guard) {
    const coneColor = Palette[guard.getConeColor()];
    drawConeClipped(ctx, guard.x, guard.y, guard.coneAngle, guard.coneFov, guard.coneRange, coneColor, this.walls);
    
    drawCircle(ctx, guard.x, guard.y, guard.radius, Palette.guard);
    drawCircleStroke(ctx, guard.x, guard.y, guard.radius, '#8a2a1a');
    
    const eyeOffset = 4;
    const eyeX = guard.x + Math.cos(guard.coneAngle) * eyeOffset;
    const eyeY = guard.y + Math.sin(guard.coneAngle) * eyeOffset;
    drawCircle(ctx, eyeX, eyeY, 2, guard.alerted ? '#ffb828' : '#fff');
    
    if (guard.suspicion > 0.3) {
      const markSize = 6 + guard.suspicion * 8;
      drawCircleStroke(ctx, guard.x, guard.y - guard.radius - 8, markSize, 
        guard.suspicion > 0.7 ? '#ef4444' : '#fbbf24', 2);
    }
  }

  drawThief(ctx) {
    const color = this.thief.crouching ? Palette.thiefCrouch : Palette.thief;
    drawCircle(ctx, this.thief.x, this.thief.y, this.thief.radius, color);
    drawCircleStroke(ctx, this.thief.x, this.thief.y, this.thief.radius, '#8a7a6a');
    
    if (this.thief.crouching) {
      drawCircle(ctx, this.thief.x, this.thief.y, this.thief.crouchDetectionRadius, 'rgba(200, 188, 168, 0.15)');
    }
    
    if (this.thief.hasLoot) {
      drawGlow(ctx, this.thief.x, this.thief.y, 30, 'rgba(255, 215, 0, 0.3)');
      drawSparkle(ctx, this.thief.x, this.thief.y - 18, this.timer, 0.7);
    }
  }

  drawLoot(ctx) {
    if (this.loot.collected) return;
    
    drawGlow(ctx, this.loot.x, this.loot.y, 50, Palette.lootGlow);
    drawCircle(ctx, this.loot.x, this.loot.y, this.loot.radius, Palette.loot);
    drawCircleStroke(ctx, this.loot.x, this.loot.y, this.loot.radius, '#b89600', 2);
    
    for (const s of this.loot.sparkles) {
      const sx = this.loot.x + Math.cos(s.angle) * s.radius;
      const sy = this.loot.y + Math.sin(s.angle) * s.radius;
      const alpha = 0.5 + Math.sin(s.phase) * 0.5;
      drawCircle(ctx, sx, sy, 2, `rgba(255, 248, 192, ${alpha})`);
    }
  }
}
