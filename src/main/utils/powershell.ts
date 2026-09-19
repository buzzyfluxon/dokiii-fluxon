import { execFile, ChildProcess } from 'child_process';

const activeProcesses = new Set<ChildProcess>();
let activeCount = 0;
const MAX_CONCURRENT = 1;

export function killAllPowerShell(): void {
  for (const proc of activeProcesses) {
    try {
      if (proc.pid) {
        execFile('taskkill', ['/pid', String(proc.pid), '/f', '/t'], () => {});
      }
      proc.kill('SIGKILL');
    } catch (_) {}
  }
  activeProcesses.clear();
  activeCount = 0;
}

export function runPowerShell(script: string, timeoutMs = 4500): Promise<string> {
  if (activeCount >= MAX_CONCURRENT) {
    return Promise.resolve('');
  }
  activeCount++;

  return new Promise((resolve) => {
    let timer: NodeJS.Timeout | null = null;
    let proc: ChildProcess | null = null;
    let settled = false;

    const finalize = (output: string) => {
      if (settled) return;
      settled = true;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (proc) {
        activeProcesses.delete(proc);
      }
      activeCount = Math.max(0, activeCount - 1);
      resolve(output);
    };

    const killProc = () => {
      if (!proc) return;
      try {
        if (proc.pid) {
          execFile('taskkill', ['/pid', String(proc.pid), '/f', '/t'], () => {});
        }
        proc.kill('SIGKILL');
      } catch (_) {}
    };

    timer = setTimeout(() => {
      killProc();
      finalize('');
    }, timeoutMs);

    try {
      proc = execFile(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-Command', script],
        { encoding: 'utf8', maxBuffer: 1024 * 1024 * 2 },
        (error, stdout) => {
          if (settled) return;
          const result = stdout ? stdout.trim() : (error ? '' : '');
          finalize(result);
        }
      );

      if (proc) {
        activeProcesses.add(proc);
        proc.on('error', () => {
          killProc();
          finalize('');
        });
      } else {
        finalize('');
      }
    } catch (_) {
      finalize('');
    }
  });
}
