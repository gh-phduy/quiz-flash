import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const nextBin = path.join(rootDir, 'node_modules', 'next', 'dist', 'bin', 'next');
const openNextBin = path.join(rootDir, 'node_modules', '@opennextjs', 'cloudflare', 'dist', 'cli', 'index.js');

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env,
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run(process.execPath, [nextBin, 'build']);

if (process.platform === 'win32') {
  console.warn('Skipping opennextjs-cloudflare build on Windows. Run the build step in WSL or CI for the Cloudflare bundle.');
  process.exit(0);
}

run(process.execPath, [openNextBin, 'build', '--skipNextBuild']);
