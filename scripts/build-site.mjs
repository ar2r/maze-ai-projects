#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();
const outputDir = path.join(rootDir, 'site-dist');
const manifestPath = path.join(rootDir, 'games.manifest.json');
const showcaseDir = path.join(rootDir, 'showcase');
const showcaseAssetsDir = path.join(outputDir, 'assets');
const screenshotOutputDir = path.join(showcaseAssetsDir, 'screenshots');
const gamesOutputDir = path.join(outputDir, 'games');

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

function npmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function getManifestUpdatedAt(game) {
  if (typeof game.updatedAt !== 'string' || Number.isNaN(Date.parse(game.updatedAt))) {
    throw new Error(`Game "${game.slug}" is missing a valid updatedAt timestamp in games.manifest.json`);
  }
  return game.updatedAt;
}

async function pathExists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
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
      reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code ?? 1}`));
    });
  });
}

async function buildGame(game) {
  const gameDir = path.join(rootDir, game.slug);
  const outDir = path.relative(gameDir, path.join(gamesOutputDir, game.slug));
  console.log(`[build] ${game.slug}`);
  await run(npmCommand(), ['run', 'build', '--', '--base=./', `--outDir=${outDir}`], gameDir);
}

async function copyShowcase() {
  await cp(showcaseDir, outputDir, {
    recursive: true,
  });
}

function contentHash(buffer) {
  return createHash('sha256').update(buffer).digest('hex').slice(0, 10);
}

async function fingerprintShowcaseAssets() {
  const htmlFiles = ['index.html', 'play.html'];
  const assetFiles = ['main.js', 'viewer.js', 'styles.css'];
  const assetHashes = new Map();

  for (const filename of assetFiles) {
    const filePath = path.join(outputDir, filename);
    if (!(await pathExists(filePath))) {
      continue;
    }
    assetHashes.set(filename, contentHash(await readFile(filePath)));
  }

  for (const htmlFile of htmlFiles) {
    const htmlPath = path.join(outputDir, htmlFile);
    if (!(await pathExists(htmlPath))) {
      continue;
    }

    let html = await readFile(htmlPath, 'utf8');
    for (const [filename, hash] of assetHashes) {
      html = html.replaceAll(`./${filename}`, `./${filename}?v=${hash}`);
    }
    await writeFile(htmlPath, html, 'utf8');
  }
}

async function copyScreenshot(game) {
  if (!game.screenshot) {
    return null;
  }

  const sourcePath = path.join(rootDir, game.screenshot);
  if (!(await pathExists(sourcePath))) {
    return null;
  }

  const extension = path.extname(sourcePath) || '.png';
  const filename = `${game.slug}${extension}`;
  const targetPath = path.join(screenshotOutputDir, filename);
  await cp(sourcePath, targetPath);
  return `assets/screenshots/${filename}`;
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await mkdir(showcaseAssetsDir, { recursive: true });
await mkdir(screenshotOutputDir, { recursive: true });
await mkdir(gamesOutputDir, { recursive: true });

await copyShowcase();
await fingerprintShowcaseAssets();

const runtimeManifest = [];

for (const game of manifest) {
  await buildGame(game);
  const screenshot = await copyScreenshot(game);
  runtimeManifest.push({
    ...game,
    route: `/games/${game.slug}/`,
    updatedAt: getManifestUpdatedAt(game),
    screenshot: screenshot ? `./${toPosix(screenshot)}` : null,
  });
}

await writeFile(
  path.join(outputDir, 'games.manifest.json'),
  `${JSON.stringify(runtimeManifest, null, 2)}\n`,
  'utf8',
);

console.log(`[done] Unified site available in ${path.relative(rootDir, outputDir)}`);
