import { app, ipcMain, BrowserWindow, screen, powerMonitor } from 'electron';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export const PROFILE = process.env.DOKIII_PROFILE === '1';
const PHASES = process.env.DOKIII_PROFILE_PHASES === '1';
const WINDOW_S = Number(process.env.DOKIII_PROFILE_WINDOW_S) || (PHASES ? 30 : 60);
const WARMUP_S = Number(process.env.DOKIII_PROFILE_WARMUP_S) || 20;
const SAMPLE_MS = 5000;

const logDir = process.env.DOKIII_PROFILE_DIR || path.join(process.env.APPDATA || os.tmpdir(), 'dokiii');
const logPath = path.join(logDir, 'profile.log');

const counters = new Map<string, number>();
const cpuSamples = new Map<number, { type: string; name: string; sum: number; n: number; mem: number }>();
let windowStart = Date.now();
let started = false;

function write(line: string) {
  try {
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(logPath, line + '\n');
  } catch {}
}

export function pcount(name: string, n = 1) {
  if (!PROFILE) return;
  counters.set(name, (counters.get(name) || 0) + n);
}

export function psTag(script: string): string {
  if (script.includes('TryGetMediaPropertiesAsync')) return 'media-info';
  if (script.includes('TryChangePlaybackPositionAsync')) return 'media-seek';
  if (script.includes('keybd_event')) return 'media-key';
  if (script.includes('DokiiiAudio')) return 'audio';
  if (script.includes('Win32_Battery')) return 'battery';
  if (script.includes('NameSpace(10)')) return 'recycle-count';
  if (script.includes('Clear-RecycleBin')) return 'recycle-empty';
  return 'other';
}

function byteSize(v: unknown): number {
  if (v === undefined || v === null) return 0;
  if (typeof v === 'string') return v.length;
  try {
    return JSON.stringify(v).length;
  } catch {
    return 0;
  }
}

export function instrumentIpc() {
  if (!PROFILE) return;
  const original = ipcMain.handle.bind(ipcMain);
  (ipcMain as any).handle = (channel: string, listener: (...a: any[]) => any) =>
    original(channel, async (event: any, ...args: any[]) => {
      const t0 = performance.now();
      const result = await listener(event, ...args);
      pcount(`ipc.${channel}.calls`);
      pcount(`ipc.${channel}.wallMs`, performance.now() - t0);
      pcount(`ipc.${channel}.resultChars`, byteSize(result));
      return result;
    });
}

function sampleCpu() {
  try {
    for (const m of app.getAppMetrics()) {
      const cur = cpuSamples.get(m.pid) || { type: m.type, name: m.name || '', sum: 0, n: 0, mem: 0 };
      cur.sum += m.cpu.percentCPUUsage;
      cur.n += 1;
      cur.mem = m.memory.workingSetSize;
      cpuSamples.set(m.pid, cur);
    }
  } catch {}
}

async function flush(label: string, win: BrowserWindow | null) {
  const seconds = (Date.now() - windowStart) / 1000;
  const cores = os.cpus().length;
  const perMin = 60 / Math.max(1, seconds);

  const procs = [...cpuSamples.entries()]
    .map(([pid, s]) => {
      const corePct = s.sum / Math.max(1, s.n);
      return {
        pid,
        type: s.type,
        name: s.name,
        corePct: Number(corePct.toFixed(1)),
        taskMgrPct: Number((corePct / cores).toFixed(1)),
        workingSetMB: Number((s.mem / 1024).toFixed(1)),
      };
    })
    .sort((a, b) => b.corePct - a.corePct);

  const totalTaskMgrPct = Number(procs.reduce((acc, p) => acc + p.taskMgrPct, 0).toFixed(1));

  const mainPerMin: Record<string, number> = {};
  for (const [k, v] of counters) {
    mainPerMin[k] = Number((v * perMin).toFixed(1));
  }

  let rendererPerMin: Record<string, number> | null = null;
  if (win && !win.isDestroyed()) {
    try {
      const r = await win.webContents.executeJavaScript('window.__profFlush ? window.__profFlush() : null');
      if (r) {
        rendererPerMin = {};
        for (const k of Object.keys(r)) {
          const unscaled = k.startsWith('pct.') || k.startsWith('avg.');
          rendererPerMin[k] = Number((r[k] * (unscaled ? 1 : perMin)).toFixed(1));
        }
      }
    } catch {}
  }

  write(
    JSON.stringify({
      t: new Date().toISOString(),
      label,
      seconds: Number(seconds.toFixed(1)),
      cores,
      totalTaskMgrPct,
      procs,
      mainPerMin,
      rendererPerMin,
    })
  );

  counters.clear();
  cpuSamples.clear();
  windowStart = Date.now();
}

interface Phase {
  label: string;
  css?: string;
  polling?: boolean;
  tick?: boolean;
}

const CSS_EQ_HALO = '.halo-wave-bar{animation:none !important}';
const CSS_EQ_DOCK = '.playing-bar{animation:none !important}';
const CSS_EQ = CSS_EQ_HALO + CSS_EQ_DOCK;
const CSS_TRANSITION = '.media-progress-fill,.halo-exp-seekfill,.widgetpod-progress-fill{transition:none !important}';
const CSS_BACKDROP = '*{backdrop-filter:none !important;-webkit-backdrop-filter:none !important}';
const CSS_FLOOR = CSS_EQ + CSS_TRANSITION + CSS_BACKDROP;

const ABLATE: Phase[] = [
  { label: 'baseline' },
  { label: 'equalizer-off', css: CSS_EQ },
  { label: 'baseline' },
  { label: 'position-tick-off', tick: false },
  { label: 'baseline' },
  { label: 'progress-transition-off', css: CSS_TRANSITION },
  { label: 'baseline' },
  { label: 'backdrop-filter-off', css: CSS_BACKDROP },
  { label: 'baseline' },
  { label: 'media-polling-off', polling: false },
  { label: 'baseline' },
  { label: 'all-off', css: CSS_FLOOR, polling: false, tick: false },
];

const ISOLATE: Phase[] = [
  { label: 'floor', css: CSS_FLOOR, polling: false, tick: false },
  { label: 'only-halo-equalizer+backdrop', css: CSS_EQ_DOCK + CSS_TRANSITION + '*:not(.halo-pill){backdrop-filter:none !important;-webkit-backdrop-filter:none !important}', polling: false, tick: false },
  { label: 'only-halo-equalizer-no-backdrop', css: CSS_EQ_DOCK + CSS_TRANSITION + CSS_BACKDROP, polling: false, tick: false },
  { label: 'only-dock-equalizer+backdrop', css: CSS_EQ_HALO + CSS_TRANSITION, polling: false, tick: false },
  { label: 'only-dock-equalizer-no-backdrop', css: CSS_EQ_HALO + CSS_TRANSITION + CSS_BACKDROP, polling: false, tick: false },
  { label: 'only-progress-transition+tick', css: CSS_EQ, polling: false, tick: true },
  { label: 'only-tick-no-transition', css: CSS_EQ + CSS_TRANSITION, polling: false, tick: true },
  { label: 'only-polling', css: CSS_FLOOR, polling: true, tick: false },
  { label: 'floor', css: CSS_FLOOR, polling: false, tick: false },
];

const PHASE_LIST = process.env.DOKIII_PROFILE_PHASE_SET === 'isolate' ? ISOLATE : ABLATE;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function setMediaFlags(win: BrowserWindow, polling: boolean, tick: boolean) {
  try {
    await win.webContents.executeJavaScript(
      `window.__profMedia && window.__profMedia.set(${polling}, ${tick})`
    );
  } catch {}
}

async function runPhases(getWindow: () => BrowserWindow | null) {
  for (const phase of PHASE_LIST) {
    const win = getWindow();
    if (!win || win.isDestroyed()) return;
    let cssKey: string | null = null;
    if (phase.css) {
      try {
        cssKey = await win.webContents.insertCSS(phase.css);
      } catch {}
    }
    await setMediaFlags(win, phase.polling !== false, phase.tick !== false);
    windowStart = Date.now();
    cpuSamples.clear();
    counters.clear();
    try {
      await win.webContents.executeJavaScript('window.__profFlush && window.__profFlush()');
    } catch {}
    await sleep(WINDOW_S * 1000);
    await flush(phase.label, win);
    if (cssKey) {
      try {
        await win.webContents.removeInsertedCSS(cssKey);
      } catch {}
    }
  }
  const win = getWindow();
  if (win && !win.isDestroyed()) await setMediaFlags(win, true, true);
  write(JSON.stringify({ t: new Date().toISOString(), label: 'phases-complete' }));
}

async function logEnvironment() {
  let gpuDevices: unknown = null;
  let glRenderer: unknown = null;
  try {
    const info: any = await app.getGPUInfo('basic');
    gpuDevices = (info?.gpuDevice || []).map((d: any) => ({
      vendorId: d.vendorId,
      deviceId: d.deviceId,
      active: d.active,
      driverVendor: d.driverVendor,
      driverVersion: d.driverVersion,
    }));
    glRenderer = info?.auxAttributes?.glRenderer ?? null;
  } catch {}

  let onBattery: boolean | null = null;
  try {
    onBattery = powerMonitor.isOnBatteryPower();
  } catch {}

  write(
    JSON.stringify({
      t: new Date().toISOString(),
      label: 'environment',
      os: process.getSystemVersion(),
      cpuModel: os.cpus()[0]?.model,
      cores: os.cpus().length,
      gpuFeatureStatus: app.getGPUFeatureStatus(),
      gpuDevices,
      glRenderer,
      onBattery,
      displays: screen.getAllDisplays().map((d) => ({
        size: d.size,
        scaleFactor: d.scaleFactor,
        refreshHz: d.displayFrequency,
        workArea: d.workArea,
        primary: d.id === screen.getPrimaryDisplay().id,
      })),
    })
  );
}

export function startProfiler(getWindow: () => BrowserWindow | null) {
  if (!PROFILE || started) return;
  started = true;
  write(
    JSON.stringify({
      t: new Date().toISOString(),
      label: 'profiler-start',
      platform: process.platform,
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      cores: os.cpus().length,
      windowS: WINDOW_S,
      phases: PHASES,
    })
  );

  setTimeout(() => {
    try {
      app.getAppMetrics();
    } catch {}
    void logEnvironment();
    setInterval(sampleCpu, SAMPLE_MS);
    if (PHASES) {
      void runPhases(getWindow);
    } else {
      windowStart = Date.now();
      cpuSamples.clear();
      counters.clear();
      setInterval(() => {
        void flush('live', getWindow());
      }, WINDOW_S * 1000);
    }
  }, WARMUP_S * 1000);
}
