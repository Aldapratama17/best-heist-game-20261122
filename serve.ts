import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
};

const server = createServer((req, res) => {
  let path = req.url?.split('?')[0] || '/';
  if (path === '/') path = '/index.html';
  
  const filePath = join(__dirname, 'game', path.slice(1));
  
  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  
  const ext = extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';
  
  try {
    const data = readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache' });
    res.end(data);
  } catch {
    res.writeHead(500);
    res.end('Server error');
  }
});

server.listen(8080, () => {
  console.log('Vaultlight server running at http://localhost:8080');
});
