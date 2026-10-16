import { useEffect, useState } from 'react';

const memory = new Map<string, string>();
const isRemote = (url: string) => /^https?:/i.test(url);

export const useCachedImage = (url?: string | null): string | null => {
  const [src, setSrc] = useState<string | null>(() => {
    if (!url) return null;
    if (!isRemote(url)) return url;
    return memory.get(url) || null;
  });

  useEffect(() => {
    if (!url) {
      setSrc(null);
      return;
    }
    if (!isRemote(url)) {
      setSrc(url);
      return;
    }
    const hit = memory.get(url);
    if (hit) {
      setSrc(hit);
      return;
    }
    let alive = true;
    const finish = (value: string) => {
      memory.set(url, value);
      if (alive) setSrc(value);
    };
    const request = window.electronAPI?.cacheImage?.(url);
    if (!request) {
      finish(url);
    } else {
      request.then((result) => finish(result || url)).catch(() => finish(url));
    }
    return () => {
      alive = false;
    };
  }, [url]);

  return src;
};

export default useCachedImage;
