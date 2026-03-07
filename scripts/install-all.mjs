#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();
const manifestPath = path.join(rootDir, 'games.manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

function npmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

async function hasPackageLock(gameDir) {
  try {
    const lockPath = path.join(gameDir, 'package-lock.json');
    const info = await stat(lockPath);
    return info.isFile();
  } catch {
    return false;
  }
}

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
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

for (const game of manifest) {
  const gameDir = path.join(rootDir, game.slug);
  const installMode = (await hasPackageLock(gameDir)) ? 'ci' : 'install';
  console.log(`[install] ${game.slug} (${installMode})`);
  await run(npmCommand(), [installMode], gameDir);
}
