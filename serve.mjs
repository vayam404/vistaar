// Zero-dependency static server. The mic needs localhost or https — file:// will not work.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const PORT = 5173;
const TYPES = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css',
                '.svg':'image/svg+xml', '.json':'application/json' };

createServer(async (req, res) => {
  const path = req.url.split('?')[0];
  const file = join(import.meta.dirname, path === '/' ? 'index.html' : path.replace(/^\/+/, ''));
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
  }
}).listen(PORT, () => console.log(`Vistaar → http://localhost:${PORT}`));
