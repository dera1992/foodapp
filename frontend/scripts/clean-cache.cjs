const fs = require('fs');
const path = require('path');

const root = process.cwd();
const targets = ['.next', path.join('node_modules', '.cache')];

for (const target of targets) {
  const fullPath = path.join(root, target);
  if (!fs.existsSync(fullPath)) continue;

  try {
    fs.rmSync(fullPath, { recursive: true, force: true });
    process.stdout.write(`[clean-cache] removed ${target}\n`);
  } catch (error) {
    process.stderr.write(`[clean-cache] failed to remove ${target}: ${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.exitCode !== 1) {
  process.stdout.write('[clean-cache] done\n');
}

