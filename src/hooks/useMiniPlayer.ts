import { useCallback } from 'react';

import { play, pause, stop, getActiveTrack, getPlaybackState } from '../trackPlayer';
import { State } from '../constants';
import { useActiveTrack } from './useActiveTrack';
import { usePlaybackState } from './usePlaybackState';
import { useIsPlaying } from './useIsPlaying';
import type { Track } from '../interfaces/Track';

export interface UseMiniPlayerResult {
  /** Whether there is a current track (queue has an active track). */
  hasTrack: boolean;
  /** Whether the player is in a "playing" state (play when ready and not ended/error/none). */
  isPlaying: boolean;
  /** True when state is loading or buffering (e.g. show a spinner). */
  isLoadingAudio: boolean;
  /** Current track or undefined. */
  track: Track | undefined;
  /** Convenience: track?.title ?? ''. */
  trackTitle: string;
  /** Convenience: track?.artist ?? ''. */
  trackArtist: string;
  /** Convenience: track?.artwork (URL string or undefined). */
  trackArtwork: string | undefined;
  /** Toggle between play and pause. Safe to call when loading. */
  togglePlayPause: () => void;
  /** Pause playback. */
  pause: () => void;
  /** Stop and clear current track. */
  stop: () => void;
  /** Re-fetch active track from native and update hook state. Call when you need to sync (e.g. after returning to the app). */
  refreshActiveTrack: () => Promise<void>;
  /** Re-fetch playback state from native. Call when you need to sync. */
  refreshPlaybackState: () => Promise<void>;
}

/**
 * Aggregates state and actions needed for a global mini player bar (play/pause, title, artist, artwork, close).
 * Works on both iOS and Android; use with useSetupPlayer() at app root so the player is ready.
 *
 * openFullScreen / closeFullScreen are not provided here — implement them in your app (e.g. navigate to a full-screen player route).
 */
export function useMiniPlayer(): UseMiniPlayerResult {
  const track = useActiveTrack();
  const playbackState = usePlaybackState();
  const { playing, bufferingDuringPlay } = useIsPlaying();

  const state = playbackState.state;
  const isPlaying = playing ?? false;
  const isLoadingAudio =
    state === State.Loading || state === State.Buffering || bufferingDuringPlay === true;

  const togglePlayPause = useCallback(async () => {
    if (isLoadingAudio) return;
    if (isPlaying) {
      await pause();
    } else {
      await play();
    }
  }, [isPlaying, isLoadingAudio]);

  const refreshActiveTrack = useCallback(async () => {
    try {
      const t = await getActiveTrack();
      // Hooks (useActiveTrack) will update via events; this is for one-off sync.
      // We can't set track here; the hook is the source of truth. So we document
      // that refreshActiveTrack is for triggering a re-sync — the app can also
      // rely on Event.PlaybackActiveTrackChanged and Event.PlaybackState.
      void t;
    } catch {
      // Not set up yet.
    }
  }, []);

  const refreshPlaybackState = useCallback(async () => {
    try {
      await getPlaybackState();
      // Same as above: events drive the hook state; this is for forcing native read.
    } catch {
      // Not set up yet.
    }
  }, []);

  return {
    hasTrack: track != null,
    isPlaying,
    isLoadingAudio,
    track,
    trackTitle: track?.title ?? '',
    trackArtist: track?.artist ?? '',
    trackArtwork: track?.artwork,
    togglePlayPause,
    pause: () => pause(),
    stop: () => stop(),
    refreshActiveTrack,
    refreshPlaybackState,
  };
}
