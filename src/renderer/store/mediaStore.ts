import { create } from 'zustand';
import type { MediaInfo } from '../types/widget';
import { PROFILE, rc } from '../profile';

interface MediaStoreState {
  mediaInfo: MediaInfo | null;
  position: number;
  duration: number;
  fetchMedia: () => Promise<void>;
  controlMedia: (action: 'play-pause' | 'next' | 'previous') => Promise<void>;
  seekMedia: (position: number) => void;
}

export const useMediaStore = create<MediaStoreState>((set, get) => {
  let isMounted = true;
  let pollTimeout: NodeJS.Timeout | null = null;
  let secondTimer: NodeJS.Timeout | null = null;
  let pollingEnabled = true;
  let tickEnabled = true;
  let lastSignature = '';

  const tickSecond = () => {
    if (!tickEnabled) return;
    const { mediaInfo, position, duration } = get();
    if (mediaInfo?.isPlaying) {
      if (duration > 0 && position >= duration) {
        return;
      }
      rc('media.set.fromTick');
      set({ position: position + 1 });
    }
  };

  const scheduleNextPoll = (intervalMs: number) => {
    if (pollTimeout) clearTimeout(pollTimeout);
    pollTimeout = setTimeout(() => {
      fetchMediaInternal();
    }, intervalMs);
  };

  const fetchMediaInternal = async () => {
    try {
      if (!window.electronAPI?.getMediaInfo) return;
      if (!pollingEnabled) return;
      rc('media.poll.requests');
      const info = await window.electronAPI.getMediaInfo();
      if (!isMounted) return;
      const signature = info
        ? `${info.title}|${info.artist}|${info.isPlaying}|${info.appName}|${info.albumArt ? info.albumArt.length : 0}`
        : 'null';
      const infoUnchanged = signature === lastSignature;
      if (PROFILE) {
        rc(infoUnchanged ? 'media.poll.payloadUnchanged' : 'media.poll.payloadChanged');
        rc('media.poll.albumArtChars', info?.albumArt ? info.albumArt.length : 0);
      }
      lastSignature = signature;

      if (info?.isPlaying) {
        if (!secondTimer) {
          secondTimer = setInterval(tickSecond, 1000);
        }
      } else {
        if (secondTimer) {
          clearInterval(secondTimer);
          secondTimer = null;
        }
      }

      rc('media.set.fromPoll');
      set((state) => {
        const nextPos = info?.position !== undefined ? info.position : state.position;
        const nextDur = info?.duration !== undefined ? info.duration : state.duration;
        return {
          mediaInfo: infoUnchanged ? state.mediaInfo : info,
          position: nextPos,
          duration: nextDur,
        };
      });

      const nextInterval = info?.isPlaying ? 3000 : 8000;
      scheduleNextPoll(nextInterval);
    } catch {
      scheduleNextPoll(8000);
    }
  };

  fetchMediaInternal();

  if (PROFILE) {
    (window as any).__profMedia = {
      set: (polling: boolean, tick: boolean) => {
        pollingEnabled = polling;
        tickEnabled = tick;
        if (pollTimeout) {
          clearTimeout(pollTimeout);
          pollTimeout = null;
        }
        if (polling) {
          fetchMediaInternal();
        }
      },
    };
  }

  return {
    mediaInfo: null,
    position: 0,
    duration: 0,
    fetchMedia: async () => {
      await fetchMediaInternal();
    },
    controlMedia: async (action: 'play-pause' | 'next' | 'previous') => {
      try {
        if (window.electronAPI?.mediaControl) {
          await window.electronAPI.mediaControl(action);
        }
      } catch {}
      setTimeout(() => {
        fetchMediaInternal();
      }, 350);
    },
    seekMedia: (pos: number) => {
      set({ position: pos });
      try {
        if (window.electronAPI?.mediaSeek) {
          window.electronAPI.mediaSeek(pos);
        }
      } catch {}
    },
  };
});
