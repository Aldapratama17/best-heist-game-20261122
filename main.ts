import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR || '/output';
const NO_SHOTS = process.env.MAIN_RUN_NO_SHOTS === '1';

function main() {
  const gameSrc = join(__dirname, 'game');
  const gameDest = join(OUTPUT_DIR, 'game');
  const shotsSrc = join(__dirname, 'screenshots');
  const shotsDest = join(OUTPUT_DIR, 'screenshots');
  
  mkdirSync(OUTPUT_DIR, { recursive: true });
  
  if (existsSync(gameSrc)) {
    cpSync(gameSrc, gameDest, { recursive: true });
  }
  
  if (!NO_SHOTS) {
    if (!existsSync(shotsSrc)) {
      throw new Error('screenshots/ directory missing (set MAIN_RUN_NO_SHOTS=1 to skip)');
    }
    cpSync(shotsSrc, shotsDest, { recursive: true });
  } else {
    // Create minimal placeholder screenshots for buildDossier when NO_SHOTS=1
    mkdirSync(shotsDest, { recursive: true });
    const placeholder = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    writeFileSync(join(shotsDest, 'cover.png'), placeholder);
    writeFileSync(join(shotsDest, 'patrol.png'), placeholder);
    writeFileSync(join(shotsDest, 'loot.png'), placeholder);
    writeFileSync(join(shotsDest, 'alarm.png'), placeholder);
  }
  
  const dossierBytes = buildDossier(OUTPUT_DIR, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  });
  
  writeFileSync(join(OUTPUT_DIR, 'dossier.json'), dossierBytes);
  console.log(`Wrote dossier.json to ${OUTPUT_DIR}`);
}

main();
