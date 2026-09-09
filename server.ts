import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const hasProductionBuild = existsSync(join(__dirname, '.next', 'routes-manifest.json'));
const isProd = process.env.NODE_ENV === 'production';
const dev = !isProd || !hasProductionBuild;
const hostname = '0.0.0.0';
const port = 3000;

const app = next({ dev, hostname, port, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port} (dev=${dev})`);
    });
}).catch((err) => {
  console.error('Failed to prepare Next.js server:', err);
  process.exit(1);
});
