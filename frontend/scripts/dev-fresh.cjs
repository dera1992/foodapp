const { execSync, spawn } = require('child_process');
const path = require('path');

const root = process.cwd();
const cleanScript = path.join(root, 'scripts', 'clean-cache.cjs');
const port = 3000;

function killProcessOnPort(targetPort) {
  try {
    const output = execSync('netstat -ano -p tcp', { encoding: 'utf8' });
    const lines = output.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (!trimmed.includes(`:${targetPort}`)) continue;
      if (!trimmed.includes('LISTENING')) continue;
      const parts = trimmed.split(/\s+/);
      const pid = Number.parseInt(parts[parts.length - 1], 10);
      if (!Number.isFinite(pid)) continue;
      try {
        process.kill(pid, 'SIGTERM');
        process.stdout.write(`[dev:fresh] stopped process ${pid} on port ${targetPort}\n`);
      } catch {
        // no-op
      }
    }
  } catch {
    process.stdout.write('[dev:fresh] could not inspect active TCP listeners, continuing\n');
  }
}

killProcessOnPort(port);
execSync(`node "${cleanScript}"`, { stdio: 'inherit' });

const child = spawn('npx', ['next', 'dev', '--turbopack'], {
  cwd: root,
  stdio: 'inherit',
  shell: true
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

