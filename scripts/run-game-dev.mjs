#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { constants as osConstants } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import readline from 'node:readline/promises';

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = '3000';
const FORBIDDEN_PASSTHROUGH_PREFIXES = [
  '--host',
  '--port',
  '--strictPort',
];
const FORBIDDEN_PASSTHROUGH_ARGS = new Set(['-p']);

function npmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function printUsage() {
  console.log('Usage:');
  console.log('  npm run game [name|index]');
  console.log('  npm run games');
  console.log('  npm run games -- --prompt-after-list');
  console.log('  npm run game -- [name|index] -- --open=false');
}

function splitCliArgs(argv) {
  const passthroughMarkerIndex = argv.indexOf('--');
  if (passthroughMarkerIndex === -1) {
    return { options: argv, passthrough: [] };
  }

  return {
    options: argv.slice(0, passthroughMarkerIndex),
    passthrough: argv.slice(passthroughMarkerIndex + 1),
  };
}

function validatePassthroughArgs(args) {
  for (const arg of args) {
    if (FORBIDDEN_PASSTHROUGH_ARGS.has(arg)) {
      throw new Error(`Argument "${arg}" is not allowed. Port and host are fixed.`);
    }

    for (const prefix of FORBIDDEN_PASSTHROUGH_PREFIXES) {
      if (arg === prefix || arg.startsWith(`${prefix}=`)) {
        throw new Error(`Argument "${arg}" is not allowed. Port and host are fixed.`);
      }
    }
  }
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function discoverGames(rootDir) {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  const games = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) {
      continue;
    }

    const packagePath = path.join(rootDir, entry.name, 'package.json');
    if (!(await pathExists(packagePath))) {
      continue;
    }

    try {
      const pkgRaw = await fs.readFile(packagePath, 'utf8');
      const pkg = JSON.parse(pkgRaw);
      if (pkg?.scripts && typeof pkg.scripts.dev === 'string') {
        games.push(entry.name);
      }
    } catch {
      console.warn(`[warn] Skipping "${entry.name}" because package.json is invalid.`);
    }
  }

  return games.sort((a, b) => a.localeCompare(b));
}

function printGameList(games) {
  console.log(`[select] Available games (${games.length}):`);
  for (let index = 0; index < games.length; index += 1) {
    console.log(`  ${index + 1}. ${games[index]}`);
  }
}

async function promptForGame(games, options = {}) {
  const {
    allowEmpty = false,
    printList = true,
    promptText = `[select] Enter game number (1-${games.length}): `,
  } = options;
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on('SIGINT', () => {
    rl.close();
    console.log('\n[select] Cancelled.');
    process.exit(130);
  });

  try {
    if (printList) {
      printGameList(games);
    }

    while (true) {
      const answer = (await rl.question(promptText)).trim();

      if (allowEmpty && answer === '') {
        return null;
      }

      const selectedIndex = Number.parseInt(answer, 10);

      if (
        Number.isInteger(selectedIndex) &&
        selectedIndex >= 1 &&
        selectedIndex <= games.length
      ) {
        return games[selectedIndex - 1];
      }

      const shownValue = answer === '' ? '(empty)' : answer;
      console.error(
        `[select] Invalid choice "${shownValue}". Enter a number from 1 to ${games.length}.`,
      );
    }
  } finally {
    rl.close();
  }
}

async function shouldInstallDependencies(gameDir) {
  const nodeModulesPath = path.join(gameDir, 'node_modules');

  try {
    const stat = await fs.stat(nodeModulesPath);
    if (!stat.isDirectory()) {
      return true;
    }

    const entries = await fs.readdir(nodeModulesPath);
    return entries.length === 0;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return true;
    }
    throw error;
  }
}

function signalToExitCode(signal) {
  const signalNumber = osConstants.signals[signal];
  if (typeof signalNumber !== 'number') {
    return 1;
  }
  return 128 + signalNumber;
}

async function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      ...options,
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('exit', (code, signal) => {
      if (signal) {
        resolve(signalToExitCode(signal));
        return;
      }
      resolve(code ?? 1);
    });
  });
}

async function runDevServer(gameDir, passthroughArgs) {
  const devArgs = [
    'run',
    'dev',
    '--',
    '--host',
    DEFAULT_HOST,
    '--port',
    DEFAULT_PORT,
    '--strictPort',
    ...passthroughArgs,
  ];

  return new Promise((resolve, reject) => {
    const child = spawn(npmCommand(), devArgs, {
      cwd: gameDir,
      stdio: 'inherit',
      detached: false,
    });

    const forwardSigint = () => {
      child.kill('SIGINT');
    };
    const forwardSigterm = () => {
      child.kill('SIGTERM');
    };

    const cleanup = () => {
      process.off('SIGINT', forwardSigint);
      process.off('SIGTERM', forwardSigterm);
    };

    process.on('SIGINT', forwardSigint);
    process.on('SIGTERM', forwardSigterm);

    child.on('error', (error) => {
      cleanup();
      reject(error);
    });

    child.on('exit', (code, signal) => {
      cleanup();
      if (signal) {
        resolve(signalToExitCode(signal));
        return;
      }
      resolve(code ?? 1);
    });
  });
}

async function main() {
  const { options, passthrough } = splitCliArgs(process.argv.slice(2));

  if (options.includes('--help') || options.includes('-h')) {
    printUsage();
    return;
  }

  validatePassthroughArgs(passthrough);

  const rootDir = process.cwd();
  const games = await discoverGames(rootDir);
  let selectedGame;

  if (games.length === 0) {
    console.error('[select] No game folders with a "dev" script were found.');
    process.exit(1);
  }

  if (options.includes('--list')) {
    printGameList(games);
    if (options.includes('--prompt-after-list')) {
      selectedGame = await promptForGame(games, {
        allowEmpty: true,
        printList: false,
        promptText: `[select] Enter game number (1-${games.length}) or press Enter to exit: `,
      });
      if (!selectedGame) {
        console.log('[select] No game selected.');
        return;
      }
    } else {
      return;
    }
  }

  const firstArg = options.find(opt => !opt.startsWith('-'));

  if (!selectedGame && firstArg) {
    // Try as index
    const index = Number.parseInt(firstArg, 10);
    if (Number.isInteger(index) && index >= 1 && index <= games.length) {
      selectedGame = games[index - 1];
    } else if (games.includes(firstArg)) {
      // Try as name
      selectedGame = firstArg;
    } else {
      console.error(`[error] Invalid game selection: "${firstArg}"`);
      printGameList(games);
      process.exit(1);
    }
  } else if (!selectedGame) {
    selectedGame = await promptForGame(games);
  }

  const selectedGameDir = path.join(rootDir, selectedGame);

  console.log(`[select] Selected: ${selectedGame}`);
  console.log(`[url] http://${DEFAULT_HOST}:${DEFAULT_PORT}`);

  if (await shouldInstallDependencies(selectedGameDir)) {
    console.log(`[install] Installing dependencies for "${selectedGame}"...`);
    const installCode = await runCommand(npmCommand(), ['install'], {
      cwd: selectedGameDir,
    });
    if (installCode !== 0) {
      console.error(`[install] "npm install" failed with exit code ${installCode}.`);
      process.exit(installCode);
    }
  } else {
    console.log('[install] Dependencies already installed.');
  }

  console.log(`[run] Starting "${selectedGame}" in foreground mode...`);
  const devExitCode = await runDevServer(selectedGameDir, passthrough);
  process.exit(devExitCode);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[error] ${message}`);
  process.exit(1);
});
