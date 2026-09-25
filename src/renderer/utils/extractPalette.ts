export const FALLBACK_PALETTE = ['#5b6cff', '#9a5bff', '#ff5b96', '#5bd0ff'];

const SAMPLE_SIZE = 28;
const CLUSTER_COUNT = 4;
const KMEANS_ITERATIONS = 5;

let sharedCanvas: HTMLCanvasElement | null = null;

const getCanvas = (): HTMLCanvasElement => {
  if (!sharedCanvas) {
    sharedCanvas = document.createElement('canvas');
    sharedCanvas.width = SAMPLE_SIZE;
    sharedCanvas.height = SAMPLE_SIZE;
  }
  return sharedCanvas;
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = src;
  });

const rgbToHex = (r: number, g: number, b: number): string => {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[clamp(r), clamp(g), clamp(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};

const boostColor = (r: number, g: number, b: number): [number, number, number] => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturationSpread = max - min;
  if (saturationSpread >= 18 || max <= 40 || max >= 235) {
    return [r, g, b];
  }
  const mid = (r + g + b) / 3;
  const boost = 1.22;
  return [mid + (r - mid) * boost, mid + (g - mid) * boost, mid + (b - mid) * boost];
};

export const extractPalette = async (albumArt: string): Promise<string[]> => {
  const img = await loadImage(albumArt);
  const canvas = getCanvas();
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return FALLBACK_PALETTE;

  ctx.clearRect(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

  let pixels: Uint8ClampedArray;
  try {
    pixels = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;
  } catch {
    return FALLBACK_PALETTE;
  }

  const samples: number[][] = [];
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 64) continue;
    samples.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
  }
  if (samples.length === 0) return FALLBACK_PALETTE;

  let centroids: number[][] = Array.from({ length: CLUSTER_COUNT }, (_, i) => {
    const idx = Math.floor((i / CLUSTER_COUNT) * samples.length);
    return [...samples[idx]];
  });
  let assignments = new Array(samples.length).fill(0);

  for (let iter = 0; iter < KMEANS_ITERATIONS; iter++) {
    for (let s = 0; s < samples.length; s++) {
      let best = 0;
      let bestDist = Infinity;
      for (let c = 0; c < centroids.length; c++) {
        const dr = samples[s][0] - centroids[c][0];
        const dg = samples[s][1] - centroids[c][1];
        const db = samples[s][2] - centroids[c][2];
        const dist = dr * dr + dg * dg + db * db;
        if (dist < bestDist) {
          bestDist = dist;
          best = c;
        }
      }
      assignments[s] = best;
    }

    const sums = Array.from({ length: CLUSTER_COUNT }, () => [0, 0, 0, 0]);
    for (let s = 0; s < samples.length; s++) {
      const c = assignments[s];
      sums[c][0] += samples[s][0];
      sums[c][1] += samples[s][1];
      sums[c][2] += samples[s][2];
      sums[c][3] += 1;
    }
    centroids = sums.map((sum, c) => (sum[3] > 0 ? [sum[0] / sum[3], sum[1] / sum[3], sum[2] / sum[3]] : centroids[c]));
  }

  const counts = new Array(CLUSTER_COUNT).fill(0);
  for (const a of assignments) counts[a] += 1;

  const ranked = centroids
    .map((color, i) => ({ color, count: counts[i] }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((entry) => boostColor(entry.color[0], entry.color[1], entry.color[2]))
    .map(([r, g, b]) => rgbToHex(r, g, b));

  if (ranked.length === 0) return FALLBACK_PALETTE;
  while (ranked.length < CLUSTER_COUNT) ranked.push(ranked[ranked.length - 1]);
  return ranked.slice(0, CLUSTER_COUNT);
};
