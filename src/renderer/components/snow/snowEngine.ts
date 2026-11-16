import type { SnowDesktopState } from '../../types/electron';

export type SnowIntensity = 'low' | 'medium' | 'high';

export interface SnowSettings {
  enabled: boolean;
  intensity: SnowIntensity;
  snowballs: boolean;
  onWindows: boolean;
}

const COL = 4;
const GRAVITY = 1500;
const TAU = Math.PI * 2;
const MAX_FLAKES = 200;
const FLAKES_BY_INTENSITY: Record<SnowIntensity, number> = { low: 70, medium: 120, high: 190 };
const LAYER_SIZE = [1.3, 2.1, 3.1];
const LAYER_SPEED = [36, 60, 90];
const LAYER_SWAY = [9, 15, 22];
const LAYER_ALPHA = [0.55, 0.78, 0.96];
const DEPOSIT_PROFILE = [3.4, 2.7, 1.7, 0.85, 0.35];
const MAX_BALLS = 5;
const MAX_SNOWMEN = 3;
const FRAME_MIN_MS = 15;

interface Span {
  lo: number;
  hi: number;
}

interface Surface {
  key: string;
  kind: 'ground' | 'dom' | 'win';
  x1: number;
  x2: number;
  y: number;
  tx1: number;
  tx2: number;
  ty: number;
  spans: Span[];
  targetSpans: Span[];
  pile: Float32Array;
  maxH: number;
  peak: number;
  fade: number;
  fadeTarget: number;
  alive: boolean;
  seen: number;
  isDock: boolean;
  el: HTMLElement | null;
}

interface DragState {
  ox: number;
  oy: number;
  samples: { t: number; x: number; y: number }[];
}

interface Body {
  kind: 'ball' | 'man';
  id: number;
  el: HTMLDivElement;
  x: number;
  by: number;
  r: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  grow: number;
  drag: DragState | null;
  grounded: boolean;
  restOn: Body | null;
  radii: number[];
  lastTx: number;
  lastTy: number;
  lastScale: number;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

const smooth = (v: number) => {
  const c = v < 0 ? 0 : v > 1 ? 1 : v;
  return c * c * (3 - 2 * c);
};

export class SnowEngine {
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private width = 1920;
  private height = 1080;
  private settings: SnowSettings = { enabled: false, intensity: 'medium', snowballs: true, onWindows: true };
  private desktopVisible = true;
  private running = false;
  private raf = 0;
  private lastTs = 0;
  private time = 0;
  private frame = 0;
  private emaDt = 0.0167;
  private slowFrames = 0;
  private qualityScale = 1;
  private unsubscribe: (() => void) | null = null;
  private resizeHandler = () => this.resize();
  private visibilityHandler = () => this.evaluate();

  private fx = new Float32Array(MAX_FLAKES);
  private fy = new Float32Array(MAX_FLAKES);
  private fp = new Float32Array(MAX_FLAKES);
  private fv = new Float32Array(MAX_FLAKES);
  private fl = new Uint8Array(MAX_FLAKES);
  private flakeCount = 0;

  private ground: Surface | null = null;
  private domSurfaces = new Map<HTMLElement, Surface>();
  private winSurfaces = new Map<string, Surface>();
  private active: Surface[] = [];
  private domEls: HTMLElement[] = [];
  private domRefreshAt = 0;
  private relaxTick = 0;

  private bodies: Body[] = [];
  private nextId = 1;
  private spawnIn = rand(10, 20);
  private stackTimers = new Map<number, number>();
  private ignoreHeld = 0;

  private spanLo = 0;
  private spanHi = 0;
  private xs: number[] = [];
  private ys: number[] = [];

  attach(container: HTMLElement, canvas: HTMLCanvasElement) {
    this.detach();
    this.container = container;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
    for (const b of this.bodies) container.appendChild(b.el);
    window.addEventListener('resize', this.resizeHandler);
    document.addEventListener('visibilitychange', this.visibilityHandler);
    this.unsubscribe =
      window.electronAPI?.onSnowDesktopState?.((state) => this.applyDesktopState(state)) || null;
    this.syncTracker();
    this.evaluate();
  }

  detach() {
    this.stopLoop();
    window.removeEventListener('resize', this.resizeHandler);
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    this.unsubscribe?.();
    this.unsubscribe = null;
    try {
      window.electronAPI?.setSnowActive?.(false);
    } catch (_) {}
    for (const b of this.bodies) b.el.remove();
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.releaseIgnore(true);
  }

  configure(next: SnowSettings) {
    const prev = this.settings;
    this.settings = { ...next };
    if (!next.enabled) {
      this.clearWorld();
    } else {
      if (!next.snowballs && prev.snowballs) this.clearBodies();
      if (!next.onWindows && prev.onWindows) this.clearWindowSurfaces();
      this.flakeCount = Math.round(FLAKES_BY_INTENSITY[next.intensity] * this.areaScale() * this.qualityScale);
      this.flakeCount = Math.max(30, Math.min(MAX_FLAKES, this.flakeCount));
      for (let i = 0; i < this.flakeCount; i++) {
        if (this.fl[i] === 0 && this.fy[i] === 0 && this.fx[i] === 0) this.spawnFlake(i, true);
      }
    }
    this.syncTracker();
    this.evaluate();
  }

  applyDesktopState(state: SnowDesktopState) {
    this.desktopVisible = Boolean(state?.visible);
    if (this.settings.onWindows && this.desktopVisible) {
      const seen = new Set<string>();
      for (const e of state.windows || []) {
        seen.add(e.id);
        let s = this.winSurfaces.get(e.id);
        if (!s) {
          s = this.makeSurface(`win:${e.id}`, 'win', 8);
          s.x1 = e.x;
          s.x2 = e.x + e.w;
          s.y = e.y;
          s.fade = 0;
          this.winSurfaces.set(e.id, s);
        }
        s.tx1 = e.x;
        s.tx2 = e.x + e.w;
        s.ty = e.y;
        s.alive = true;
        s.fadeTarget = 1;
        s.targetSpans = e.spans.map(([a, b]) => ({ lo: a - e.x + 8, hi: b - e.x - 8 }));
      }
      for (const [id, s] of this.winSurfaces) {
        if (!seen.has(id)) {
          s.alive = false;
          s.fadeTarget = 0;
        }
      }
    } else if (!this.desktopVisible) {
      this.clearWindowSurfaces();
    }
    this.evaluate();
  }

  private areaScale() {
    return Math.max(0.5, Math.min(1.6, (this.width * this.height) / (1920 * 1080)));
  }

  private resize() {
    this.width = Math.max(320, window.innerWidth || 1920);
    this.height = Math.max(240, window.innerHeight || 1080);
    if (this.canvas) {
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }
    this.ensureGround();
    if (this.settings.enabled) this.configure(this.settings);
  }

  private syncTracker() {
    try {
      window.electronAPI?.setSnowActive?.(Boolean(this.container && this.settings.enabled));
    } catch (_) {}
  }

  private evaluate() {
    const should =
      Boolean(this.container && this.canvas) &&
      this.settings.enabled &&
      this.desktopVisible &&
      !(typeof document !== 'undefined' && document.hidden);
    if (this.container) this.container.style.display = this.settings.enabled && this.desktopVisible ? '' : 'none';
    if (should && !this.running) this.startLoop();
    if (!should && this.running) {
      this.stopLoop();
      this.ctx?.clearRect(0, 0, this.width, this.height);
      this.releaseIgnore(true);
    }
  }

  private startLoop() {
    this.running = true;
    this.lastTs = 0;
    this.raf = requestAnimationFrame(this.loop);
  }

  private stopLoop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private loop = (ts: number) => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.loop);
    if (this.lastTs && ts - this.lastTs < FRAME_MIN_MS) return;
    const rawDt = this.lastTs ? (ts - this.lastTs) / 1000 : 0.0167;
    this.lastTs = ts;
    const dt = Math.min(rawDt, 0.05);
    this.trackPerformance(rawDt);
    this.step(dt);
    this.render();
  };

  private trackPerformance(rawDt: number) {
    this.emaDt = this.emaDt * 0.94 + Math.min(rawDt, 0.1) * 0.06;
    if (this.emaDt > 0.026) this.slowFrames++;
    else this.slowFrames = Math.max(0, this.slowFrames - 2);
    if (this.slowFrames > 120 && this.qualityScale > 0.4) {
      this.qualityScale = Math.max(0.4, this.qualityScale * 0.8);
      this.slowFrames = 0;
      this.flakeCount = Math.max(30, Math.round(this.flakeCount * 0.8));
    }
  }

  private makeSurface(key: string, kind: Surface['kind'], maxH: number): Surface {
    return {
      key,
      kind,
      x1: 0,
      x2: 0,
      y: 0,
      tx1: 0,
      tx2: 0,
      ty: 0,
      spans: [{ lo: 0, hi: 0 }],
      targetSpans: [{ lo: 0, hi: 0 }],
      pile: new Float32Array(2),
      maxH,
      peak: 0,
      fade: 1,
      fadeTarget: 1,
      alive: true,
      seen: 0,
      isDock: false,
      el: null,
    };
  }

  private ensureGround() {
    if (!this.ground) {
      this.ground = this.makeSurface('ground', 'ground', 5);
    }
    const g = this.ground;
    g.x1 = g.tx1 = 0;
    g.x2 = g.tx2 = this.width;
    g.y = g.ty = this.height;
    g.spans = [{ lo: 0, hi: this.width }];
    g.targetSpans = g.spans;
    g.fade = g.fadeTarget = 1;
    this.ensurePile(g);
  }

  private ensurePile(s: Surface) {
    const cols = Math.max(2, Math.ceil((s.x2 - s.x1) / COL) + 1);
    if (s.pile.length === cols) return;
    const next = new Float32Array(cols);
    const old = s.pile;
    if (old.length > 2) {
      for (let i = 0; i < cols; i++) {
        const src = cols > 1 ? (i * (old.length - 1)) / (cols - 1) : 0;
        const i0 = Math.floor(src);
        const i1 = Math.min(old.length - 1, i0 + 1);
        const f = src - i0;
        next[i] = old[i0] * (1 - f) + old[i1] * f;
      }
    }
    s.pile = next;
  }

  private heightAt(s: Surface, x: number): number {
    const idx = (x - s.x1) / COL;
    const i0 = Math.floor(idx);
    if (i0 < 0 || i0 >= s.pile.length - 1) return 0;
    const f = idx - i0;
    const raw = s.pile[i0] * (1 - f) + s.pile[i0 + 1] * f;
    if (!this.spanAt(s, x)) return 0;
    const d = Math.min(x - this.spanLo, this.spanHi - x) / 14;
    return raw * (d >= 1 ? 1 : d <= 0 ? 0 : d * (2 - d));
  }

  private spanAt(s: Surface, x: number): boolean {
    for (let i = 0; i < s.spans.length; i++) {
      const sp = s.spans[i];
      const lo = s.x1 + sp.lo;
      const hi = s.x1 + sp.hi;
      if (x >= lo && x <= hi) {
        this.spanLo = lo;
        this.spanHi = hi;
        return true;
      }
    }
    return false;
  }

  private deposit(s: Surface, x: number) {
    const idx = Math.round((x - s.x1) / COL);
    const p = s.pile;
    for (let k = -4; k <= 4; k++) {
      const i = idx + k;
      if (i < 0 || i >= p.length) continue;
      const v = DEPOSIT_PROFILE[Math.abs(k)];
      p[i] += v * Math.max(0, 1 - p[i] / s.maxH);
    }
  }

  private relax(s: Surface) {
    const p = s.pile;
    let peak = 0;
    for (let i = 1; i < p.length - 1; i++) {
      p[i] += (p[i - 1] + p[i + 1] - 2 * p[i]) * 0.18;
    }
    for (let i = 0; i < p.length; i++) {
      if (p[i] > peak) peak = p[i];
    }
    s.peak = peak;
  }

  private spawnFlake(i: number, initial: boolean) {
    const layer = Math.random() < 0.5 ? 0 : Math.random() < 0.6 ? 1 : 2;
    this.fl[i] = layer;
    this.fx[i] = Math.random() * this.width;
    this.fy[i] = initial ? Math.random() * this.height : -6 - Math.random() * 60;
    this.fp[i] = Math.random() * TAU;
    this.fv[i] = LAYER_SPEED[layer] * rand(0.85, 1.2);
  }

  private refreshDomList() {
    this.domEls = Array.from(
      document.querySelectorAll<HTMLElement>('.dock-container, .desktop-widget-container:not(.is-bare)')
    );
  }

  private syncDom() {
    const frame = this.frame;
    for (let i = 0; i < this.domEls.length; i++) {
      const el = this.domEls[i];
      if (!el.isConnected) continue;
      if (el.classList.contains('auto-hide') && !el.classList.contains('visible')) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 30 || r.height < 20 || r.top < 12 || r.top > this.height - 6) continue;
      let s = this.domSurfaces.get(el);
      const isDock = el.classList.contains('dock-container');
      if (!s) {
        s = this.makeSurface('dom', 'dom', isDock ? 10 : 9);
        s.isDock = isDock;
        s.el = el;
        s.fade = 0;
        this.domSurfaces.set(el, s);
      }
      s.x1 = s.tx1 = r.left;
      s.x2 = s.tx2 = r.right;
      s.y = s.ty = r.top;
      const inset = Math.min(20, r.width * 0.16);
      s.spans[0].lo = inset;
      s.spans[0].hi = r.width - inset;
      s.seen = frame;
      s.alive = true;
      this.ensurePile(s);
      s.fadeTarget = isDock && el.matches(':hover') ? 0 : 1;
    }
    for (const [el, s] of this.domSurfaces) {
      if (s.seen !== frame) {
        s.alive = false;
        s.fadeTarget = 0;
        if (s.fade < 0.03 || !el.isConnected) this.domSurfaces.delete(el);
      }
    }
  }

  private syncWindows(dt: number) {
    const k = 1 - Math.exp(-dt * 20);
    for (const [id, s] of this.winSurfaces) {
      s.x1 += (s.tx1 - s.x1) * k;
      s.x2 += (s.tx2 - s.x2) * k;
      s.y += (s.ty - s.y) * k;
      s.spans = s.targetSpans;
      this.ensurePile(s);
      if (!s.alive && s.fade < 0.03) this.winSurfaces.delete(id);
    }
  }

  private collectActive() {
    const list = this.active;
    list.length = 0;
    if (this.ground) list.push(this.ground);
    for (const s of this.domSurfaces.values()) if (s.alive) list.push(s);
    for (const s of this.winSurfaces.values()) if (s.alive) list.push(s);
  }

  private topAt(s: Surface, x: number): number | null {
    if (!this.spanAt(s, x)) return null;
    return s.y - this.heightAt(s, x) * 0.7;
  }

  private step(dt: number) {
    this.frame++;
    this.time += dt;
    if (!this.ground) this.ensureGround();
    if (this.frame >= this.domRefreshAt) {
      this.refreshDomList();
      this.domRefreshAt = this.frame + 20;
    }
    this.syncDom();
    this.syncWindows(dt);
    for (const s of this.domSurfaces.values()) s.fade += (s.fadeTarget - s.fade) * Math.min(1, dt * 9);
    for (const s of this.winSurfaces.values()) s.fade += (s.fadeTarget - s.fade) * Math.min(1, dt * 6);
    this.collectActive();

    const wind = Math.sin(this.time * 0.13) * 10;
    const n = Math.min(this.flakeCount, MAX_FLAKES);
    const surfaces = this.active;
    for (let i = 0; i < n; i++) {
      const layer = this.fl[i];
      const prevY = this.fy[i];
      const newY = prevY + this.fv[i] * dt;
      const x =
        this.fx[i] +
        (Math.sin(this.time * 0.9 + this.fp[i]) * LAYER_SWAY[layer] * 0.6 + wind * (0.4 + layer * 0.3)) * dt;
      this.fx[i] = x;
      this.fy[i] = newY;
      let hit: Surface | null = null;
      let hitTop = Infinity;
      for (let j = 0; j < surfaces.length; j++) {
        const s = surfaces[j];
        const top = this.topAt(s, x);
        if (top === null) continue;
        if (prevY < top && newY >= top && top < hitTop) {
          hitTop = top;
          hit = s;
        }
      }
      if (hit) {
        this.deposit(hit, x);
        this.spawnFlake(i, false);
        continue;
      }
      if (newY > this.height + 8 || x < -20 || x > this.width + 20) this.spawnFlake(i, false);
    }

    this.relaxTick++;
    if (this.relaxTick % 2 === 0) {
      for (let j = 0; j < surfaces.length; j++) this.relax(surfaces[j]);
    }

    this.stepBodies(dt);
    this.maybeSpawnBall(dt);
  }

  private supportFor(b: Body, prevBy: number): { y: number; ball: Body | null; slide: number } {
    let best = Infinity;
    let ball: Body | null = null;
    let slide = 0;
    const surfaces = this.active;
    for (let i = 0; i < surfaces.length; i++) {
      const top = this.topAt(surfaces[i], b.x);
      if (top === null) continue;
      if (prevBy <= top + 6 && top < best) {
        best = top;
        ball = null;
        slide = 0;
      }
    }
    if (b.kind === 'ball') {
      for (const o of this.bodies) {
        if (o === b || o.kind !== 'ball' || o.drag || o.grow < 1 || o.restOn === b) continue;
        const dx = b.x - o.x;
        const sum = b.r + o.r;
        const ad = Math.abs(dx);
        if (ad >= sum * 0.98) continue;
        const cyO = o.by - o.r;
        const targetBy = cyO - Math.sqrt(sum * sum - dx * dx) + b.r;
        if (prevBy <= targetBy + 6 && targetBy < best) {
          best = targetBy;
          ball = o;
          slide = ad > sum * 0.5 ? (dx >= 0 ? 1 : -1) : 0;
        }
      }
    }
    return { y: best, ball, slide };
  }

  private stepBodies(dt: number) {
    for (const b of this.bodies) {
      if (b.grow < 1) b.grow = Math.min(1, b.grow + dt / 1.3);
      if (b.drag) {
        b.grounded = false;
        b.restOn = null;
        continue;
      }
      const prevBy = b.by;
      b.vy += GRAVITY * dt;
      b.by += b.vy * dt;
      b.x += b.vx * dt;
      const half = b.w / 2;
      if (b.x < half) {
        b.x = half;
        b.vx = Math.abs(b.vx) * 0.3;
      } else if (b.x > this.width - half) {
        b.x = this.width - half;
        b.vx = -Math.abs(b.vx) * 0.3;
      }
      const sup = this.supportFor(b, prevBy);
      if (b.by >= sup.y) {
        b.by = sup.y;
        if (b.vy > 260) b.vy = -b.vy * 0.22;
        else b.vy = 0;
        b.grounded = b.vy === 0;
        b.restOn = sup.ball && sup.slide === 0 && b.vy === 0 ? sup.ball : null;
        if (sup.slide !== 0) b.vx += sup.slide * 700 * dt;
        b.vx *= Math.pow(0.03, dt);
      } else {
        b.grounded = false;
        b.restOn = null;
        b.vx *= Math.pow(0.55, dt);
      }
      if (Math.abs(b.vx) < 2 && b.grounded) b.vx = 0;
      if (b.by > this.height + 200) {
        b.by = this.height;
        b.vy = 0;
      }
    }
    this.separateBalls();
    this.checkStacks(dt);
  }

  private separateBalls() {
    const list = this.bodies;
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (a.kind !== 'ball' || a.drag) continue;
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        if (b.kind !== 'ball' || b.drag) continue;
        if (a.restOn === b || b.restOn === a) continue;
        const dy = Math.abs(a.by - a.r - (b.by - b.r));
        const dx = b.x - a.x;
        const sum = a.r + b.r;
        if (dy < sum * 0.55 && Math.abs(dx) < sum * 0.92) {
          const push = (sum * 0.92 - Math.abs(dx)) * 0.5;
          const dir = dx >= 0 ? 1 : -1;
          a.x -= dir * push;
          b.x += dir * push;
        }
      }
    }
  }

  private checkStacks(dt: number) {
    const next = new Map<number, number>();
    const balls = this.bodies.filter((b) => b.kind === 'ball');
    if (balls.length >= 3) {
      for (const c of balls) {
        if (c.drag || !c.grounded || c.restOn || c.grow < 1) continue;
        const m = balls.find((o) => o.restOn === c && !o.drag);
        if (!m) continue;
        const t = balls.find((o) => o.restOn === m && !o.drag);
        if (!t) continue;
        const elapsed = (this.stackTimers.get(c.id) || 0) + dt;
        next.set(c.id, elapsed);
        if (elapsed > 0.45) {
          this.mergeSnowman(c, m, t);
          next.delete(c.id);
          break;
        }
      }
    }
    this.stackTimers = next;
  }

  private maybeSpawnBall(dt: number) {
    if (!this.settings.snowballs) return;
    this.spawnIn -= dt;
    if (this.spawnIn > 0) return;
    this.spawnIn = rand(30, 70);
    const balls = this.bodies.filter((b) => b.kind === 'ball').length;
    const men = this.bodies.filter((b) => b.kind === 'man').length;
    if (balls >= MAX_BALLS || balls + men * 3 >= 9) return;
    const candidates = this.active.filter((s) => {
      if (s.kind === 'ground' || s.peak < 2.5 || s.fade < 0.8) return false;
      return s.spans.some((sp) => sp.hi - sp.lo >= 70);
    });
    const r = rand(13, 25);
    if (candidates.length) {
      const s = candidates[Math.floor(Math.random() * candidates.length)];
      const sp = s.spans.find((p) => p.hi - p.lo >= 70) || s.spans[0];
      const x = s.x1 + rand(sp.lo + r + 4, sp.hi - r - 4);
      const top = this.topAt(s, x);
      if (top !== null) {
        this.createBall(x, top, r, 0);
        return;
      }
    }
    this.createBall(rand(80, this.width - 80), this.height - 4, r, 0);
  }

  private createBall(x: number, by: number, r: number, grow: number): Body {
    const el = document.createElement('div');
    el.className = 'snow-body snow-ball';
    el.style.width = `${r * 2}px`;
    el.style.height = `${r * 2}px`;
    const body: Body = {
      kind: 'ball',
      id: this.nextId++,
      el,
      x,
      by,
      r,
      w: r * 2,
      h: r * 2,
      vx: 0,
      vy: 0,
      grow,
      drag: null,
      grounded: false,
      restOn: null,
      radii: [r],
      lastTx: NaN,
      lastTy: NaN,
      lastScale: NaN,
    };
    this.bodies.push(body);
    this.container?.appendChild(el);
    this.bindBody(body);
    return body;
  }

  private mergeSnowman(c: Body, m: Body, t: Body) {
    const radii = [c.r, m.r, t.r].sort((a, b) => b - a);
    const x = c.x;
    const by = c.by;
    this.removeBody(c);
    this.removeBody(m);
    this.removeBody(t);
    if (this.bodies.filter((b) => b.kind === 'man').length >= MAX_SNOWMEN) {
      const oldest = this.bodies.find((b) => b.kind === 'man');
      if (oldest) this.removeBody(oldest);
    }
    const [A, B, C] = radii;
    const cyA = -A;
    const cyB = cyA - (A + B) * 0.84;
    const cyC = cyB - (B + C) * 0.84;
    const bodyH = -(cyC - C);
    const hatH = C * 1.15;
    const armSpan = B * 1.5;
    const wTotal = Math.max(2 * A, 2 * B + 2 * armSpan * 0.8) + 8;
    const hTotal = bodyH + hatH;
    const el = document.createElement('div');
    el.className = 'snow-body snowman';
    el.style.width = `${wTotal}px`;
    el.style.height = `${hTotal}px`;
    const inner = document.createElement('div');
    inner.className = 'snowman-inner';
    el.appendChild(inner);
    const cx = wTotal / 2;
    const baseY = hTotal;
    const circle = (cy: number, r: number) => {
      const d = document.createElement('div');
      d.className = 'snowman-part';
      d.style.width = `${r * 2}px`;
      d.style.height = `${r * 2}px`;
      d.style.left = `${cx - r}px`;
      d.style.top = `${baseY + cy - r}px`;
      inner.appendChild(d);
      return d;
    };
    const piece = (cls: string, css: Partial<CSSStyleDeclaration>) => {
      const d = document.createElement('div');
      d.className = cls;
      Object.assign(d.style, css);
      inner.appendChild(d);
      return d;
    };
    const armLen = B * 1.15;
    for (const side of [-1, 1]) {
      piece('snowman-arm', {
        width: `${armLen}px`,
        left: `${cx + side * B * 0.82 - (side === -1 ? armLen : 0)}px`,
        top: `${baseY + cyB - B * 0.2}px`,
        transformOrigin: side === -1 ? 'right center' : 'left center',
        transform: `rotate(${side * -28}deg)`,
      });
    }
    circle(cyA, A);
    circle(cyB, B);
    circle(cyC, C);
    const eye = Math.max(2, C * 0.13);
    for (const side of [-1, 1]) {
      piece('snowman-eye', {
        width: `${eye}px`,
        height: `${eye}px`,
        left: `${cx + side * C * 0.34 - eye / 2}px`,
        top: `${baseY + cyC - C * 0.22}px`,
      });
    }
    const th = Math.max(2, C * 0.17);
    piece('snowman-nose', {
      left: `${cx - 1}px`,
      top: `${baseY + cyC - th / 2 + C * 0.06}px`,
      borderLeftWidth: `${C * 0.62}px`,
      borderTopWidth: `${th}px`,
      borderBottomWidth: `${th}px`,
    });
    piece('snowman-scarf', {
      width: `${C * 1.55}px`,
      height: `${Math.max(4, C * 0.34)}px`,
      left: `${cx - C * 0.775}px`,
      top: `${baseY + cyC + C * 0.72}px`,
    });
    piece('snowman-scarf-tail', {
      width: `${Math.max(4, C * 0.3)}px`,
      height: `${C * 0.8}px`,
      left: `${cx + C * 0.32}px`,
      top: `${baseY + cyC + C * 0.8}px`,
    });
    const btn = Math.max(2.5, B * 0.12);
    for (let i = -1; i <= 1; i++) {
      piece('snowman-eye', {
        width: `${btn}px`,
        height: `${btn}px`,
        left: `${cx - btn / 2}px`,
        top: `${baseY + cyB + i * B * 0.42 - btn / 2}px`,
      });
    }
    piece('snowman-hat-rim', {
      width: `${C * 1.7}px`,
      height: `${Math.max(4, C * 0.3)}px`,
      left: `${cx - C * 0.85}px`,
      top: `${baseY + cyC - C * 0.86}px`,
    });
    piece('snowman-hat', {
      left: `${cx - C * 0.78}px`,
      top: `${baseY + cyC - C * 0.86 - hatH * 0.92}px`,
      borderLeftWidth: `${C * 0.78}px`,
      borderRightWidth: `${C * 0.78}px`,
      borderBottomWidth: `${hatH * 0.95}px`,
    });
    const pom = Math.max(4, C * 0.32);
    piece('snowman-pom', {
      width: `${pom}px`,
      height: `${pom}px`,
      left: `${cx + C * 0.1}px`,
      top: `${baseY + cyC - C * 0.86 - hatH * 0.92 - pom * 0.4}px`,
    });
    const body: Body = {
      kind: 'man',
      id: this.nextId++,
      el,
      x,
      by,
      r: A,
      w: wTotal,
      h: hTotal,
      vx: 0,
      vy: 0,
      grow: 1,
      drag: null,
      grounded: true,
      restOn: null,
      radii,
      lastTx: NaN,
      lastTy: NaN,
      lastScale: NaN,
    };
    this.bodies.push(body);
    this.container?.appendChild(el);
    this.bindBody(body);
  }

  private dismantle(man: Body) {
    const [A, B, C] = man.radii;
    const x = man.x;
    const by = man.by;
    this.removeBody(man);
    const parts = [A, B, C];
    let lift = 0;
    parts.forEach((r, i) => {
      const ball = this.createBall(x + (i - 1) * 6, by - lift, r, 1);
      ball.vy = -340 - i * 60;
      ball.vx = (i - 1) * 150 + rand(-30, 30);
      lift += r * 1.6;
    });
  }

  private removeBody(b: Body) {
    const i = this.bodies.indexOf(b);
    if (i >= 0) this.bodies.splice(i, 1);
    b.el.remove();
    for (const o of this.bodies) if (o.restOn === b) o.restOn = null;
  }

  private clearBodies() {
    for (const b of this.bodies) b.el.remove();
    this.bodies = [];
    this.stackTimers.clear();
    this.releaseIgnore(true);
  }

  private clearWindowSurfaces() {
    this.winSurfaces.clear();
  }

  private clearWorld() {
    this.clearBodies();
    this.clearWindowSurfaces();
    this.domSurfaces.clear();
    if (this.ground) this.ground.pile.fill(0);
    this.flakeCount = 0;
    this.fx.fill(0);
    this.fy.fill(0);
    this.ctx?.clearRect(0, 0, this.width, this.height);
  }

  private holdIgnore() {
    this.ignoreHeld++;
    try {
      window.electronAPI?.setIgnoreMouseEvents(false);
    } catch (_) {}
  }

  private releaseIgnore(force = false) {
    if (force) this.ignoreHeld = 0;
    else this.ignoreHeld = Math.max(0, this.ignoreHeld - 1);
    if (this.ignoreHeld === 0) {
      try {
        window.electronAPI?.setIgnoreMouseEvents(true, true);
      } catch (_) {}
    }
  }

  private bindBody(b: Body) {
    const el = b.el;
    let hovering = false;
    el.addEventListener('pointerenter', () => {
      if (hovering) return;
      hovering = true;
      this.holdIgnore();
    });
    el.addEventListener('pointerleave', () => {
      if (!hovering || b.drag) return;
      hovering = false;
      this.releaseIgnore();
    });
    el.addEventListener('pointerdown', (e: PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      try {
        el.setPointerCapture(e.pointerId);
      } catch (_) {}
      if (!hovering) {
        hovering = true;
        this.holdIgnore();
      }
      b.drag = { ox: e.clientX - b.x, oy: e.clientY - b.by, samples: [{ t: performance.now(), x: e.clientX, y: e.clientY }] };
      b.vx = 0;
      b.vy = 0;
      el.classList.add('is-dragging');
    });
    el.addEventListener('pointermove', (e: PointerEvent) => {
      const d = b.drag;
      if (!d) return;
      const half = b.w / 2;
      b.x = Math.max(half, Math.min(this.width - half, e.clientX - d.ox));
      b.by = Math.max(b.h, Math.min(this.height, e.clientY - d.oy));
      const now = performance.now();
      d.samples.push({ t: now, x: e.clientX, y: e.clientY });
      while (d.samples.length > 2 && now - d.samples[0].t > 120) d.samples.shift();
    });
    const release = (e: PointerEvent) => {
      const d = b.drag;
      if (!d) return;
      b.drag = null;
      el.classList.remove('is-dragging');
      try {
        el.releasePointerCapture(e.pointerId);
      } catch (_) {}
      const first = d.samples[0];
      const last = d.samples[d.samples.length - 1];
      const span = Math.max(16, last.t - first.t) / 1000;
      b.vx = Math.max(-1600, Math.min(1600, (last.x - first.x) / span));
      b.vy = Math.max(-1600, Math.min(1600, (last.y - first.y) / span));
      const rect = el.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
      if (!inside && hovering) {
        hovering = false;
        this.releaseIgnore();
      }
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    if (b.kind === 'man') {
      el.addEventListener('dblclick', () => this.dismantle(b));
    }
    el.addEventListener('lostpointercapture', () => {
      if (hovering && !b.drag && !el.matches(':hover')) {
        hovering = false;
        this.releaseIgnore();
      }
    });
  }

  private render() {
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.clearRect(0, 0, this.width, this.height);
    const n = Math.min(this.flakeCount, MAX_FLAKES);
    for (let layer = 0; layer < 3; layer++) {
      ctx.fillStyle = `rgba(255,255,255,${LAYER_ALPHA[layer]})`;
      ctx.beginPath();
      const size = LAYER_SIZE[layer];
      for (let i = 0; i < n; i++) {
        if (this.fl[i] !== layer) continue;
        const x = this.fx[i];
        const y = this.fy[i];
        ctx.moveTo(x + size, y);
        ctx.arc(x, y, size, 0, TAU);
      }
      ctx.fill();
    }
    for (const s of this.active) this.drawPile(ctx, s);
    this.updateBodies();
  }

  private tracePile(ctx: CanvasRenderingContext2D, s: Surface, lo: number, hi: number, lift: number) {
    const xs = this.xs;
    const ys = this.ys;
    let n = 0;
    for (let x = lo; x < hi; x += COL) {
      const t = Math.min(x - lo, hi - x) / 14;
      const taper = t >= 1 ? 1 : t <= 0 ? 0 : t * (2 - t);
      const idx = (x - s.x1) / COL;
      const i0 = Math.max(0, Math.min(s.pile.length - 2, Math.floor(idx)));
      const f = Math.max(0, Math.min(1, idx - i0));
      const h = (s.pile[i0] * (1 - f) + s.pile[i0 + 1] * f) * taper;
      xs[n] = x;
      ys[n] = s.y - h - lift;
      n++;
    }
    xs[n] = hi;
    ys[n] = s.y - lift;
    n++;
    if (n < 3) return false;
    const base = s.y + 1.5;
    ctx.beginPath();
    ctx.moveTo(xs[0], base);
    ctx.lineTo(xs[0], ys[0]);
    for (let i = 1; i < n - 1; i++) {
      ctx.quadraticCurveTo(xs[i], ys[i], (xs[i] + xs[i + 1]) / 2, (ys[i] + ys[i + 1]) / 2);
    }
    ctx.lineTo(xs[n - 1], ys[n - 1]);
    ctx.lineTo(xs[n - 1], base);
    ctx.closePath();
    return true;
  }

  private drawPile(ctx: CanvasRenderingContext2D, s: Surface) {
    if (s.fade < 0.03 || s.peak < 0.25) return;
    ctx.globalAlpha = Math.min(1, s.fade);
    for (let i = 0; i < s.spans.length; i++) {
      const lo = Math.max(s.x1, s.x1 + s.spans[i].lo);
      const hi = Math.min(s.x2, s.x1 + s.spans[i].hi);
      if (hi - lo < 14) continue;
      if (this.tracePile(ctx, s, lo, hi, 0)) {
        ctx.fillStyle = 'rgba(176,200,232,0.95)';
        ctx.fill();
      }
      if (this.tracePile(ctx, s, lo, hi, 1.3)) {
        ctx.fillStyle = 'rgba(248,251,255,0.98)';
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  private updateBodies() {
    for (const b of this.bodies) {
      const tx = Math.round((b.x - b.w / 2) * 10) / 10;
      const ty = Math.round((b.by - b.h) * 10) / 10;
      const scale = b.kind === 'ball' ? 0.15 + 0.85 * smooth(b.grow) : 1;
      if (tx === b.lastTx && ty === b.lastTy && scale === b.lastScale) continue;
      b.lastTx = tx;
      b.lastTy = ty;
      b.lastScale = scale;
      b.el.style.transform =
        scale === 1 ? `translate3d(${tx}px, ${ty}px, 0)` : `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    }
  }
}

let sharedEngine: SnowEngine | null = null;

export const getSnowEngine = (): SnowEngine => {
  if (!sharedEngine) sharedEngine = new SnowEngine();
  return sharedEngine;
};
