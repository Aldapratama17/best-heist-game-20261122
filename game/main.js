import { Game } from './game.js';

const game = new Game();

function loop(time) {
  const dt = Math.min((time - game.lastTime) / 1000, 0.05);
  game.lastTime = time;
  
  game.update(dt);
  game.render();
  
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
