import { ipcMain, BrowserWindow, screen } from 'electron';

interface ScreenRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface TrackedWindow {
  id: string;
  rect: ScreenRect;
}

interface NativeApi {
  listWindows: (ownPid: number) => { windows: TrackedWindow[]; covering: boolean[] } | null;
}

export interface SnowWindowEdge {
  id: string;
  x: number;
  y: number;
  w: number;
  spans: [number, number][];
}

export interface SnowDesktopState {
  visible: boolean;
  windows: SnowWindowEdge[];
}

const GW_HWNDNEXT = 2;
const GWL_EXSTYLE = -20;
const WS_EX_TOOLWINDOW = 0x00000080;
const WS_EX_NOACTIVATE = 0x08000000;
const WS_EX_TRANSPARENT = 0x00000020;
const DWMWA_CLOAKED = 14;
const DWMWA_EXTENDED_FRAME_BOUNDS = 9;
const IGNORED_CLASSES = new Set([
  'Progman',
  'WorkerW',
  'Shell_TrayWnd',
  'Shell_SecondaryTrayWnd',
  'NotifyIconOverflowWindow',
  'TopLevelWindowForOverflowXamlIsland',
  'XamlExplorerHostIslandWindow',
  'Windows.UI.Core.CoreWindow',
  'ApplicationFrameInputSinkWindow',
]);
const MIN_WINDOW_WIDTH = 120;
const MIN_WINDOW_HEIGHT = 60;
const MAX_WALK = 600;

let nativeApi: NativeApi | null | undefined;

function loadNative(): NativeApi | null {
  if (nativeApi !== undefined) return nativeApi;
  nativeApi = null;
  if (process.platform !== 'win32') return nativeApi;
  try {
    const koffi = require('koffi');
    const user32 = koffi.load('user32.dll');
    const dwm = koffi.load('dwmapi.dll');

    const GetTopWindow = user32.func('void *GetTopWindow(void *hWnd)');
    const GetWindow = user32.func('void *GetWindow(void *hWnd, uint32_t uCmd)');
    const IsWindowVisible = user32.func('bool IsWindowVisible(void *hWnd)');
    const IsIconic = user32.func('bool IsIconic(void *hWnd)');
    const IsZoomed = user32.func('bool IsZoomed(void *hWnd)');
    const GetWindowLongW = user32.func('int32_t GetWindowLongW(void *hWnd, int nIndex)');
    const GetWindowTextLengthW = user32.func('int GetWindowTextLengthW(void *hWnd)');
    const GetClassNameW = user32.func('int GetClassNameW(void *hWnd, _Out_ uint16_t *lpClassName, int nMaxCount)');
    const GetWindowThreadProcessId = user32.func(
      'uint32_t GetWindowThreadProcessId(void *hWnd, _Out_ uint32_t *lpdwProcessId)'
    );
    const GetWindowRect = user32.func('bool GetWindowRect(void *hWnd, _Out_ int32_t *lpRect)');
    const DwmGetFrameBounds = dwm.func(
      'int32_t DwmGetWindowAttribute(void *hwnd, uint32_t dwAttribute, _Out_ int32_t *pvAttribute, uint32_t cbAttribute)'
    );
    const DwmGetCloaked = dwm.func(
      'int32_t DwmGetWindowAttribute(void *hwnd, uint32_t dwAttribute, _Out_ uint32_t *pvAttribute, uint32_t cbAttribute)'
    );

    const classBuf = new Uint16Array(256);
    const pidBuf = new Uint32Array(1);
    const rectBuf = new Int32Array(4);
    const cloakBuf = new Uint32Array(1);

    const readClassName = (hwnd: unknown): string => {
      classBuf.fill(0);
      const len = GetClassNameW(hwnd, classBuf, classBuf.length);
      if (!len || len <= 0) return '';
      return String.fromCharCode.apply(null, Array.from(classBuf.subarray(0, len)));
    };

    const readRect = (hwnd: unknown): ScreenRect | null => {
      rectBuf.fill(0);
      const hr = DwmGetFrameBounds(hwnd, DWMWA_EXTENDED_FRAME_BOUNDS, rectBuf, 16);
      if (hr !== 0) {
        rectBuf.fill(0);
        if (!GetWindowRect(hwnd, rectBuf)) return null;
      }
      return { left: rectBuf[0], top: rectBuf[1], right: rectBuf[2], bottom: rectBuf[3] };
    };

    const addressOf = (hwnd: unknown, fallback: number): string => {
      try {
        if (typeof koffi.address === 'function') return String(koffi.address(hwnd));
      } catch (_) {}
      return `w${fallback}`;
    };

    nativeApi = {
      listWindows: (ownPid: number) => {
        const windows: TrackedWindow[] = [];
        const covering: boolean[] = [];
        let hwnd = GetTopWindow(null);
        let guard = 0;
        while (hwnd && guard < MAX_WALK) {
          guard++;
          const current = hwnd;
          hwnd = GetWindow(current, GW_HWNDNEXT);
          try {
            if (!IsWindowVisible(current) || IsIconic(current)) continue;
            cloakBuf.fill(0);
            if (DwmGetCloaked(current, DWMWA_CLOAKED, cloakBuf, 4) === 0 && cloakBuf[0] !== 0) continue;
            const exStyle = GetWindowLongW(current, GWL_EXSTYLE) >>> 0;
            if (exStyle & (WS_EX_TOOLWINDOW | WS_EX_NOACTIVATE | WS_EX_TRANSPARENT)) continue;
            pidBuf[0] = 0;
            GetWindowThreadProcessId(current, pidBuf);
            if (pidBuf[0] === ownPid) continue;
            if (GetWindowTextLengthW(current) <= 0) continue;
            if (IGNORED_CLASSES.has(readClassName(current))) continue;
            const rect = readRect(current);
            if (!rect) continue;
            if (rect.right - rect.left < MIN_WINDOW_WIDTH || rect.bottom - rect.top < MIN_WINDOW_HEIGHT) continue;
            windows.push({ id: addressOf(current, guard), rect });
            covering.push(Boolean(IsZoomed(current)));
          } catch (_) {}
        }
        return { windows, covering };
      },
    };
  } catch (_) {
    nativeApi = null;
  }
  return nativeApi;
}

function subtractSpans(spans: [number, number][], from: number, to: number): [number, number][] {
  const out: [number, number][] = [];
  for (const [a, b] of spans) {
    if (to <= a || from >= b) {
      out.push([a, b]);
      continue;
    }
    if (from > a) out.push([a, from]);
    if (to < b) out.push([to, b]);
  }
  return out;
}

export function registerSnowHandlers(getMainWindow: () => BrowserWindow | null) {
  let active = false;
  let timer: NodeJS.Timeout | null = null;
  let lastPayload = '';
  let lastChangeAt = 0;

  const toLocal = (rect: ScreenRect, originX: number, originY: number) => {
    const dip = screen.screenToDipRect(null, {
      x: rect.left,
      y: rect.top,
      width: rect.right - rect.left,
      height: rect.bottom - rect.top,
    });
    return {
      left: dip.x - originX,
      top: dip.y - originY,
      right: dip.x + dip.width - originX,
      bottom: dip.y + dip.height - originY,
    };
  };

  const compute = (win: BrowserWindow): SnowDesktopState => {
    if (win.isDestroyed() || !win.isVisible() || win.isMinimized()) {
      return { visible: false, windows: [] };
    }
    const api = loadNative();
    if (!api) return { visible: true, windows: [] };
    const bounds = win.getBounds();
    const listing = api.listWindows(process.pid);
    if (!listing) return { visible: true, windows: [] };

    const local: { id: string; r: { left: number; top: number; right: number; bottom: number } }[] = [];
    const area = bounds.width * bounds.height;
    for (let i = 0; i < listing.windows.length; i++) {
      const r = toLocal(listing.windows[i].rect, bounds.x, bounds.y);
      const ix = Math.max(0, Math.min(r.right, bounds.width) - Math.max(r.left, 0));
      const iy = Math.max(0, Math.min(r.bottom, bounds.height) - Math.max(r.top, 0));
      if (ix <= 0 || iy <= 0) continue;
      const coversDesktop = listing.covering[i] ? ix * iy >= area * 0.55 : ix * iy >= area * 0.9;
      if (coversDesktop) return { visible: false, windows: [] };
      local.push({ id: listing.windows[i].id, r });
    }

    const edges: SnowWindowEdge[] = [];
    for (let i = 0; i < local.length; i++) {
      const r = local[i].r;
      if (r.top < 24 || r.top > bounds.height - 60) continue;
      let spans: [number, number][] = [[Math.max(r.left, 0), Math.min(r.right, bounds.width)]];
      for (let j = 0; j < i && spans.length; j++) {
        const above = local[j].r;
        if (above.top <= r.top && above.bottom > r.top) {
          spans = subtractSpans(spans, above.left, above.right);
        }
      }
      spans = spans.filter(([a, b]) => b - a >= 40);
      if (!spans.length) continue;
      edges.push({
        id: local[i].id,
        x: Math.round(r.left),
        y: Math.round(r.top),
        w: Math.round(r.right - r.left),
        spans: spans.map(([a, b]) => [Math.round(a), Math.round(b)] as [number, number]),
      });
    }
    return { visible: true, windows: edges };
  };

  const stop = () => {
    active = false;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    lastPayload = '';
  };

  const tick = () => {
    timer = null;
    if (!active) return;
    const win = getMainWindow();
    let state: SnowDesktopState = { visible: false, windows: [] };
    try {
      if (win && !win.isDestroyed()) state = compute(win);
    } catch (_) {
      state = { visible: true, windows: [] };
    }
    const payload = JSON.stringify(state);
    const now = Date.now();
    if (payload !== lastPayload) {
      lastPayload = payload;
      lastChangeAt = now;
      try {
        if (win && !win.isDestroyed()) win.webContents.send('snow:desktopState', state);
      } catch (_) {}
    }
    const delay = now - lastChangeAt < 1500 ? 110 : 380;
    timer = setTimeout(tick, delay);
  };

  ipcMain.handle('snow:setActive', (_, value: boolean) => {
    if (Boolean(value) === active) return;
    if (!value) {
      stop();
      return;
    }
    active = true;
    lastPayload = '';
    lastChangeAt = Date.now();
    if (!timer) tick();
  });

  return stop;
}
