import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { getProgress, addEventListener } from '../trackPlayer';
import { Event } from '../constants';
import type { Progress } from '../interfaces';
import { useTrackPlayerEvents } from './useTrackPlayerEvents';

const INITIAL_STATE: Progress = {
  position: 0,
  duration: 0,
  buffered: 0,
};

export interface UseProgressOptions {
  /** If true, subscribe to Event.PlaybackProgressUpdated (native-driven) when you set progressUpdateEventInterval in updateOptions. Reduces bridge round-trips vs polling. Default false. */
  useNativeEvents?: boolean;
}

/**
 * Track progress (position, duration, buffered) for the current track.
 * @param updateInterval - Polling interval in ms when not using native events. Default 1000.
 * @param background - Update state when app is in background. Default true. Can affect performance.
 * @param options - useNativeEvents: true to prefer Event.PlaybackProgressUpdated (set progressUpdateEventInterval in updateOptions). Fewer bridge calls.
 */
export function useProgress(
  updateInterval = 1000,
  background = true,
  options: UseProgressOptions = {},
) {
  const [state, setState] = useState<Progress>(INITIAL_STATE);

  useTrackPlayerEvents([Event.PlaybackActiveTrackChanged], () => {
    setState(INITIAL_STATE);
  });

  useEffect(() => {
    let mounted = true;

    const updateFromProgress = (next: Progress) => {
      if (!mounted) return;
      setState((prev) =>
        next.position === prev.position &&
        next.duration === prev.duration &&
        next.buffered === prev.buffered
          ? prev
          : next
      );
    };

    const updateFromBridge = async () => {
      try {
        if (!mounted) return;
        if (!background && AppState.currentState !== 'active') return;
        const next = await getProgress();
        updateFromProgress(next);
      } catch {
        // only throws when player not set up
      }
    };

    let progressSub: { remove: () => void } | null = null;
    if (options.useNativeEvents) {
      progressSub = addEventListener(
        Event.PlaybackProgressUpdated,
        (payload: { position: number; duration: number; buffered: number }) => {
          updateFromProgress({
            position: payload.position,
            duration: payload.duration,
            buffered: payload.buffered,
          });
        },
      );
    }

    const poll = async () => {
      if (options.useNativeEvents) {
        await updateFromBridge();
        if (!mounted) return;
        await new Promise<void>((resolve) =>
          setTimeout(resolve, Math.max(updateInterval * 3, 3000)),
        );
      } else {
        await updateFromBridge();
        if (!mounted) return;
        await new Promise<void>((resolve) =>
          setTimeout(resolve, updateInterval),
        );
      }
      if (!mounted) return;
      poll();
    };

    poll();

    return () => {
      mounted = false;
      progressSub?.remove();
    };
  }, [updateInterval, options?.useNativeEvents ?? false]);

  return state;
}
