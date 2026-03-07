#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { createReadStream, existsSync, watch } from 'node:fs';
import { mkdir, readFile, stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();
const showcaseDir = path.join(rootDir, 'showcase');
const builtGamesDir = path.join(rootDir, 'site-dist', 'games');
const manifestPath = path.join(rootDir, 'games.manifest.json');
const host = '127.0.0.1';
const port = Number(process.env.PORT || 3000);

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.ico', 'image/x-icon'],
]);

const sseClients = new Set();
const screenshotMap = new Map();
let liveManifest = [];
let notifyTimer = null;

function nodeCommand() {
  return process.execPath;
}

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function getManifestUpdatedAt(game) {
  if (typeof game.updatedAt !== 'string' || Number.isNaN(Date.parse(game.updatedAt))) {
    throw new Error(`Game "${game.slug}" is missing a valid updatedAt timestamp in games.manifest.json`);
  }
  return game.updatedAt;
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(`${JSON.stringify(payload, null, 2)}\n`);
}

function sendText(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end(payload);
}

async function fileExists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

function injectLiveReload(html) {
  const clientScript = `
<script>
(() => {
  const source = new EventSource('/__live_reload');
  source.addEventListener('reload', () => window.location.reload());
})();
</script>`;

  if (html.includes('</body>')) {
    return html.replace('</body>', `${clientScript}\n</body>`);
  }
  return `${html}\n${clientScript}`;
}

async function loadManifest() {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  screenshotMap.clear();

  liveManifest = await Promise.all(manifest.map(async (game) => {
    let screenshot = null;
    if (game.screenshot) {
      const extension = path.extname(game.screenshot) || '.png';
      const route = `/__screenshots/${game.slug}${extension}`;
      screenshotMap.set(route, path.join(rootDir, game.screenshot));
      screenshot = route;
    }

    return {
      ...game,
      route: `/games/${game.slug}/`,
      updatedAt: getManifestUpdatedAt(game),
      screenshot,
    };
  }));
}

function getContentType(filePath) {
  return contentTypes.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream';
}

function serveFile(response, filePath) {
  response.writeHead(200, { 'Content-Type': getContentType(filePath) });
  createReadStream(filePath).pipe(response);
}

async function runInitialBuild() {
  await mkdir(path.join(rootDir, 'site-dist'), { recursive: true });

  return new Promise((resolve, reject) => {
    const child = spawn(nodeCommand(), ['./scripts/build-site.mjs'], {
      cwd: rootDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        CI: '1',
      },
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Initial site build failed with exit code ${code ?? 1}`));
    });
  });
}

function notifyReload() {
  for (const client of sseClients) {
    client.write('event: reload\ndata: reload\n\n');
  }
}

function scheduleReload() {
  clearTimeout(notifyTimer);
  notifyTimer = setTimeout(async () => {
    try {
      await loadManifest();
      notifyReload();
    } catch (error) {
      console.error(`[dev] Failed to refresh manifest: ${error.message}`);
    }
  }, 80);
}

function watchFile(targetPath) {
  watch(targetPath, () => {
    scheduleReload();
  });
}

function handleSse(request, response) {
  response.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });
  response.write('\n');
  sseClients.add(response);
  request.on('close', () => {
    sseClients.delete(response);
  });
}

async function handleRequest(request, response) {
  const url = new URL(request.url || '/', `http://${host}:${port}`);
  const pathname = decodeURIComponent(url.pathname);

  if (pathname === '/__live_reload') {
    handleSse(request, response);
    return;
  }

  if (pathname === '/games.manifest.json') {
    sendJson(response, 200, liveManifest);
    return;
  }

  if (screenshotMap.has(pathname)) {
    const screenshotPath = screenshotMap.get(pathname);
    if (await fileExists(screenshotPath)) {
      serveFile(response, screenshotPath);
      return;
    }
    sendText(response, 404, 'Screenshot not found');
    return;
  }

  if (pathname.startsWith('/games/')) {
    const relativePath = pathname.replace(/^\/games\//, '');
    const candidatePath = path.join(builtGamesDir, relativePath);
    const fallbackPath = path.join(candidatePath, 'index.html');

    if (await fileExists(candidatePath)) {
      const fileInfo = await stat(candidatePath);
      if (fileInfo.isFile()) {
        serveFile(response, candidatePath);
        return;
      }
    }

    if (await fileExists(fallbackPath)) {
      serveFile(response, fallbackPath);
      return;
    }

    sendText(response, 404, 'Game build not found. Re-run npm run site:build.');
    return;
  }

  if (pathname === '/' || pathname === '/index.html') {
    const html = injectLiveReload(await readFile(path.join(showcaseDir, 'index.html'), 'utf8'));
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(html);
    return;
  }

  const showcaseAssetPath = path.join(showcaseDir, pathname.slice(1));
  if (showcaseAssetPath.startsWith(showcaseDir) && (await fileExists(showcaseAssetPath))) {
    serveFile(response, showcaseAssetPath);
    return;
  }

  sendText(response, 404, 'Not found');
}

await runInitialBuild();
await loadManifest();

watchFile(manifestPath);
watchFile(path.join(showcaseDir, 'index.html'));
watchFile(path.join(showcaseDir, 'main.js'));
watchFile(path.join(showcaseDir, 'styles.css'));

const server = http.createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    console.error(`[dev] ${error.stack || error.message}`);
    sendText(response, 500, 'Internal server error');
  });
});

server.listen(port, host, () => {
  console.log(`[dev] Showcase UI: http://${host}:${port}`);
  console.log('[dev] Live reload watches showcase/* and games.manifest.json');
});
