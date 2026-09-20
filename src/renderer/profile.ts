import { useLayoutEffect } from 'react';

export const PROFILE = new URLSearchParams(window.location.search).get('profile') === '1';

let counts: Record<string, number> = {};
let animSamples: Record<string, number> = {};
let animTotal = 0;
let runningSum = 0;

export function rc(name: string, n = 1) {
  if (!PROFILE) return;
  counts[name] = (counts[name] || 0) + n;
}

export function useRenderProfile(name: string) {
  const start = PROFILE ? performance.now() : 0;
  useLayoutEffect(() => {
    if (!PROFILE) return;
    rc(`render.${name}`);
    rc(`render.${name}.renderCommitMs`, performance.now() - start);
  });
}

function animName(a: Animation): string {
  if (a instanceof CSSAnimation) return `animation:${a.animationName}`;
  if (a instanceof CSSTransition) return `transition:${a.transitionProperty}`;
  return 'other';
}

function sampleAnimations() {
  const running = document.getAnimations().filter((a) => a.playState === 'running');
  animTotal += 1;
  runningSum += running.length;
  const seen = new Set<string>();
  for (const a of running) seen.add(animName(a));
  seen.forEach((n) => {
    animSamples[n] = (animSamples[n] || 0) + 1;
  });
}

export function initRendererProfile() {
  if (!PROFILE) return;

  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        rc('longtask.count');
        rc('longtask.ms', e.duration);
      }
    }).observe({ entryTypes: ['longtask'] });
  } catch {}

  setInterval(sampleAnimations, 500);

  (window as any).__profFlush = () => {
    const out: Record<string, number> = { ...counts };
    if (animTotal > 0) {
      out['avg.animationsRunning'] = Number((runningSum / animTotal).toFixed(2));
      for (const k of Object.keys(animSamples)) {
        out[`pct.${k}`] = Number(((animSamples[k] / animTotal) * 100).toFixed(0));
      }
    }
    counts = {};
    animSamples = {};
    animTotal = 0;
    runningSum = 0;
    return out;
  };
}
