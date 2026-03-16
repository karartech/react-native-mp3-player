import { useState, useEffect } from 'react';

import { setupPlayer, registerPlaybackService } from '../trackPlayer';
import type { PlayerOptions } from '../interfaces/PlayerOptions';
import type { ServiceHandler } from '../interfaces/ServiceHandler';

export interface UseSetupPlayerOptions {
  /** Options passed to setupPlayer(). Omit to use defaults. */
  options?: PlayerOptions;
  /** Whether to set up for background playback. Default false. */
  background?: boolean;
  /** Optional playback service factory. If provided, registerPlaybackService() is called with it. */
  serviceFactory?: () => ServiceHandler;
}

/**
 * Sets up the player once and returns whether it is ready.
 * Use at app root (e.g. in a provider) so that mini players and screens can rely on isPlayerReady.
 *
 * On Android, if setup is called while the app is in the background, the native module may reject
 * with 'android_cannot_setup_player_in_background'. This hook retries until the app is in the
 * foreground and setup succeeds, so the same code works on both iOS and Android.
 *
 * @returns isPlayerReady – true once setupPlayer() (and optional service) has completed successfully.
 */
export function useSetupPlayer(
  hookOptions: UseSetupPlayerOptions = {},
): boolean {
  const { options = {}, background = false, serviceFactory } = hookOptions;
  const [isPlayerReady, setPlayerReady] = useState(false);

  useEffect(() => {
    let unmounted = false;

    const run = async () => {
      if (serviceFactory) {
        registerPlaybackService(serviceFactory);
      }

      const doSetup = async (): Promise<string | null> => {
        try {
          await setupPlayer(options, background);
          return null;
        } catch (err) {
          return (err as Error & { code?: string }).code ?? null;
        }
      };

      let code: string | null = null;
      do {
        code = await doSetup();
        if (unmounted) return;
        if (code === 'android_cannot_setup_player_in_background') {
          await new Promise<void>((resolve) => setTimeout(resolve, 100));
        }
      } while (code === 'android_cannot_setup_player_in_background');

      if (unmounted || code != null) return;
      setPlayerReady(true);
    };

    run();
    return () => {
      unmounted = true;
    };
  }, []);

  return isPlayerReady;
}
