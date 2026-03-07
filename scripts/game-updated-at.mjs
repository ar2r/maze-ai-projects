import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'site-dist',
  'coverage',
]);

const SOURCE_DIRS = ['src', 'tests', 'test'];
const IGNORED_FILE_PATTERNS = [
  /\.tsbuildinfo$/i,
  /^vite\.config\./i,
  /^vitest\.config\./i,
  /^tsconfig(\..+)?\.json$/i,
  /^package(-lock)?\.json$/i,
  /^README/i,
  /^QUICKSTART/i,
  /^TEST_PLAN/i,
  /^PROJECT_SUMMARY/i,
  /^FILES_OVERVIEW/i,
  /\.md$/i,
];

function shouldIgnoreFile(fileName) {
  return IGNORED_FILE_PATTERNS.some((pattern) => pattern.test(fileName));
}

async function walkLatestMtime(targetPath, options = {}) {
  const info = await stat(targetPath);
  let latestMtimeMs = info.mtimeMs;
  let fileCount = info.isDirectory() ? 0 : 1;

  if (!info.isDirectory()) {
    return { latestMtimeMs, fileCount };
  }

  const entries = await readdir(targetPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && IGNORED_DIRS.has(entry.name)) {
      continue;
    }
    if (entry.isFile() && options.ignoreFiles !== false && shouldIgnoreFile(entry.name)) {
      continue;
    }

    const entryPath = path.join(targetPath, entry.name);
    const result = await walkLatestMtime(entryPath, options);
    if (result.latestMtimeMs > latestMtimeMs) {
      latestMtimeMs = result.latestMtimeMs;
    }
    fileCount += result.fileCount;
  }

  return { latestMtimeMs, fileCount };
}

export async function getGameUpdatedAt(rootDir, slug) {
  const gameDir = path.join(rootDir, slug);

  for (const sourceDir of SOURCE_DIRS) {
    const sourcePath = path.join(gameDir, sourceDir);
    try {
      const result = await walkLatestMtime(sourcePath, { ignoreFiles: false });
      if (result.fileCount > 0) {
        return new Date(result.latestMtimeMs).toISOString();
      }
    } catch {
      // Ignore missing source directories and try the next strategy.
    }
  }

  const fallback = await walkLatestMtime(gameDir, { ignoreFiles: true });
  return new Date(fallback.latestMtimeMs).toISOString();
}
