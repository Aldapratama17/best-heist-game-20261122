import { Palette, drawRect, drawText, drawCircle, drawCircleStroke, drawGlow } from './render.js';

export class HUD {
  constructor() {
    this.alarmLabel = 'ALARM';
  }

  render(ctx, alarm, thief, timer, difficulty) {
    this.drawAlarmMeter(ctx, alarm);
    this.drawTimer(ctx, timer);
    this.drawCoins(ctx, thief.coins);
    this.drawDifficulty(ctx, difficulty);
    this.drawControls(ctx);
  }

  drawAlarmMeter(ctx, alarm) {
    const barW = 280;
    const barH = 18;
    const x = (1180 - barW) / 2;
    const y = 12;
    
    drawRect(ctx, x - 2, y - 2, barW + 4, barH + 4, Palette.hudBg);
    drawRect(ctx, x, y, barW, barH, Palette.wall);
    
    const fillW = (barW * alarm.level) / 100;
    const colorKey = alarm.getColor();
    const color = Palette[colorKey];
    drawRect(ctx, x, y, fillW, barH, color);
    
    drawText(ctx, this.alarmLabel, x + 8, y + 1, 12, Palette.textDim);
    drawText(ctx, `${alarm.getPercent()}%`, x + barW - 48, y + 1, 12, Palette.hudFg, 'right');
  }

  drawTimer(ctx, time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 100);
    const text = `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    drawText(ctx, text, 1160, 12, 14, Palette.hudFg, 'right');
  }

  drawCoins(ctx, coins) {
    const startX = 12;
    const y = 12;
    const spacing = 22;
    const r = 8;
    
    drawText(ctx, 'COINS', startX, y - 2, 10, Palette.textDim);
    
    for (let i = 0; i < 3; i++) {
      const cx = startX + i * spacing + r;
      const filled = i < coins;
      drawCircle(ctx, cx, y + 8, r, filled ? Palette.coin : Palette.wall);
      drawCircleStroke(ctx, cx, y + 8, r, filled ? Palette.coin : Palette.textDim);
    }
  }

  drawDifficulty(ctx, difficulty) {
    drawText(ctx, `HEAT ${difficulty}`, 1160, 34, 10, Palette.hudAccent, 'right');
  }

  drawControls(ctx) {
    const text = 'WASD/Arrows: Move  |  Shift: Crouch  |  Click: Throw Coin';
    drawText(ctx, text, 590, 635, 11, Palette.textDim, 'center');
  }
}

export function drawTitleScreen(ctx, time) {
  drawRect(ctx, 0, 0, 1180, 660, Palette.floor);
  
  for (let x = 0; x < 1180; x += 40) {
    drawRect(ctx, x, 0, 1, 660, Palette.floorGrid);
  }
  for (let y = 0; y < 660; y += 40) {
    drawRect(ctx, 0, y, 1180, 1, Palette.floorGrid);
  }
  
  const glowIntensity = 0.5 + Math.sin(time * 2) * 0.15;
  drawGlow(ctx, 590, 200, 180, `rgba(255, 215, 0, ${glowIntensity})`);
  
  drawText(ctx, 'VAULTLIGHT', 590, 160, 56, Palette.loot, 'center');
  drawText(ctx, 'A Top-Down Heist', 590, 230, 18, Palette.textDim, 'center');
  
  drawText(ctx, 'WASD / Arrows — Move', 590, 310, 16, Palette.text, 'center');
  drawText(ctx, 'Shift — Crouch (slower, harder to detect)', 590, 340, 16, Palette.text, 'center');
  drawText(ctx, 'Mouse Click — Throw Noise Coin (3)', 590, 370, 16, Palette.text, 'center');
  drawText(ctx, 'Steal the Sunstone Opal and reach the Exit', 590, 410, 14, Palette.textDim, 'center');
  
  const pressAlpha = 0.5 + Math.sin(time * 4) * 0.4;
  drawText(ctx, 'Press Enter to Begin', 590, 500, 22, `rgba(232, 220, 200, ${pressAlpha})`, 'center');
}

export function drawWinScreen(ctx, time, finalTime) {
  drawRect(ctx, 0, 0, 1180, 660, Palette.floor);
  
  const glowIntensity = 0.6 + Math.sin(time * 1.5) * 0.2;
  drawGlow(ctx, 590, 220, 200, `rgba(60, 255, 100, ${glowIntensity})`);
  
  drawText(ctx, 'HEIST COMPLETE', 590, 180, 48, '#3cff64', 'center');
  drawText(ctx, `Time: ${formatTime(finalTime)}`, 590, 260, 28, Palette.hudFg, 'center');
  drawText(ctx, 'The Sunstone Opal is yours.', 590, 310, 16, Palette.textDim, 'center');
  
  const pressAlpha = 0.5 + Math.sin(time * 3) * 0.4;
  drawText(ctx, 'Press Enter for Next Heat Level', 590, 420, 20, `rgba(232, 220, 200, ${pressAlpha})`, 'center');
}

export function drawCaughtScreen(ctx, time) {
  drawRect(ctx, 0, 0, 1180, 660, Palette.floor);
  
  const pulse = 0.5 + Math.sin(time * 6) * 0.5;
  drawGlow(ctx, 590, 220, 180, `rgba(255, 60, 40, ${pulse * 0.4})`);
  
  drawText(ctx, 'CAUGHT', 590, 200, 56, '#ef4444', 'center');
  drawText(ctx, 'The alarm triggered. The reserve is on lockdown.', 590, 280, 16, Palette.textDim, 'center');
  
  const pressAlpha = 0.5 + Math.sin(time * 4) * 0.4;
  drawText(ctx, 'Press Enter to Retry', 590, 380, 22, `rgba(232, 220, 200, ${pressAlpha})`, 'center');
}

function formatTime(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  const ms = Math.floor((t % 1) * 100);
  return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}
