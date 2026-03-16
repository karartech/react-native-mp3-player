/**
 * Persistent mini audio player in liquid glass style, sitting just above LiquidGlassTabBar.
 * Uses shared LiquidGlassPill + liquidGlassTheme so it always matches the tab bar design.
 */
import { useSegments } from 'expo-router';
import { Pause, Play, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Image,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLiquidGlassTheme } from '../constants/liquidGlassTheme';
import Typography, { Text } from '../constants/typography';
import { useAudioPlayerOptional } from '../contexts/AudioPlayerContext';
import LiquidGlassPill from './LiquidGlassPill';

// Match tab bar pill area so mini player sits right above it (LiquidGlassTabBar uses ~72 + insets)
const TAB_PILL_HEIGHT = 72;
const EXIT_ANIMATION_DURATION = 220;

export default function GlobalMiniPlayer() {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const theme = useLiquidGlassTheme();
  const player = useAudioPlayerOptional();

  const [isExiting, setIsExiting] = useState(false);
  const [exitSnapshot, setExitSnapshot] = useState(null);
  /** When true, bar is hidden even if there is a track; cleared when user plays again so bar reopens without rediscovery */
  const [dismissed, setDismissed] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const playerRef = useRef(player);
  playerRef.current = player;

  // Show as soon as there is a track (including while loading).
  // Hide on screens that have their own in-screen player (book-view, surah, supplications, etc.) so we don't double-show.
  // When dismissed, hide the bar but keep track in context so it reopens as soon as user plays again (no rediscovery needed).
  const firstSegment = Array.isArray(segments) ? segments[0] : null;
  const isBookView = Array.isArray(segments) && segments.includes('book-view');
  const hideOnThisScreen =
    isBookView ||
    firstSegment === 'quran' ||
    firstSegment === 'supplications' ||
    firstSegment === 'salah-supplications' ||
    firstSegment === 'daily-dua';
  const hasTrack = player?.hasTrack;
  const isPlayerReady = player?.isPlayerReady;
  const shouldShow =
    !hideOnThisScreen &&
    isPlayerReady &&
    hasTrack &&
    !dismissed;

  // As soon as user plays again, clear dismissed so the bar reopens (avoids relying on track rediscovery)
  useEffect(() => {
    if (player?.isPlaying && dismissed) {
      setDismissed(false);
    }
  }, [player?.isPlaying, dismissed]);

  // When a new track is loaded (hasTrack just became true) and we were dismissed, reopen the bar so it shows for the new track
  const prevHasTrackRef = useRef(!!hasTrack);
  useEffect(() => {
    const hadTrack = prevHasTrackRef.current;
    prevHasTrackRef.current = !!hasTrack;
    if (hasTrack && !hadTrack && dismissed) {
      setDismissed(false);
    }
  }, [hasTrack, dismissed]);

  // If track is cleared elsewhere (e.g. stop() from another path), reset dismissed so next track can show the bar
  useEffect(() => {
    if (!hasTrack && dismissed) {
      setDismissed(false);
    }
  }, [hasTrack, dismissed]);

  // When user navigates FROM a hide screen (e.g. book view) TO a show screen (e.g. Home), sync from native and ensure bar can show (iOS widget may be correct while React state was stale).
  const prevHideOnThisScreenRef = useRef(hideOnThisScreen);
  useEffect(() => {
    const wasHiding = prevHideOnThisScreenRef.current;
    prevHideOnThisScreenRef.current = hideOnThisScreen;
    if (!wasHiding || hideOnThisScreen || isExiting || !isPlayerReady) return;
    // Just transitioned to a screen where we can show the bar (e.g. left book view) – sync from native and clear dismissed so bar appears if there's a track
    setDismissed(false);
    player?.refreshActiveTrack?.();
    player?.refreshPlaybackState?.();
    const t1 = setTimeout(() => playerRef.current?.refreshActiveTrack?.(), 80);
    const t2 = setTimeout(() => playerRef.current?.refreshPlaybackState?.(), 80);
    const t3 = setTimeout(() => playerRef.current?.refreshActiveTrack?.(), 250);
    const t4 = setTimeout(() => playerRef.current?.refreshActiveTrack?.(), 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [hideOnThisScreen, isExiting, isPlayerReady, player?.refreshActiveTrack, player?.refreshPlaybackState]);

  // When user lands on a screen where the mini player could show (e.g. Home), sync so we pick up any track loaded from Quran/book view etc.
  useEffect(() => {
    if (hideOnThisScreen || isExiting || !isPlayerReady) return;
    player?.refreshActiveTrack?.();
    player?.refreshPlaybackState?.();
    // If we don't have a track yet, burst sync so we discover track added from another screen (e.g. user played from book view then navigated to Home)
    if (!hasTrack) {
      const t1 = setTimeout(() => playerRef.current?.refreshActiveTrack?.(), 100);
      const t2 = setTimeout(() => playerRef.current?.refreshActiveTrack?.(), 350);
      const t3 = setTimeout(() => playerRef.current?.refreshActiveTrack?.(), 700);
      const t4 = setTimeout(() => playerRef.current?.refreshActiveTrack?.(), 1200);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run when route/screen changes
  }, [hideOnThisScreen, isExiting, isPlayerReady]);

  // When bar is dismissed but we still have a track, poll playback state on every screen so we detect "play again" from Quran/supplications etc. and reopen the bar
  useEffect(() => {
    if (!dismissed || !hasTrack || !isPlayerReady) return;
    const interval = setInterval(() => {
      playerRef.current?.refreshActiveTrack?.();
      playerRef.current?.refreshPlaybackState?.();
    }, 350);
    return () => clearInterval(interval);
  }, [dismissed, hasTrack, isPlayerReady]);

  // When mini player is visible, refresh track and playback state so icon and metadata are correct
  useEffect(() => {
    if (!shouldShow || isExiting) return;
    player?.refreshActiveTrack?.();
    player?.refreshPlaybackState?.();
  }, [shouldShow, isExiting, player?.refreshActiveTrack, player?.refreshPlaybackState]);

  // Keep rendering during exit animation so we can animate out gracefully
  const shouldRender = shouldShow || isExiting;

  const runExitAnimation = useCallback(() => {
    opacity.setValue(1);
    translateY.setValue(0);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: EXIT_ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 16,
        duration: EXIT_ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setIsExiting(false);
        setExitSnapshot(null);
        setDismissed(true);
        // Stop and clear track so the next play is a fresh start; context will rediscover via notifyGlobalPlayer + polling
        playerRef.current?.stop?.();
      }
    });
  }, [opacity, translateY]);

  useEffect(() => {
    if (isExiting) {
      runExitAnimation();
    }
  }, [isExiting, runExitAnimation]);

  const handleClose = useCallback(() => {
    if (isExiting) return;
    const snapshot = {
      trackTitle: player?.trackTitle ?? null,
      trackArtist: player?.trackArtist ?? null,
      trackArtwork: player?.trackArtwork ?? null,
    };
    setExitSnapshot(snapshot);
    setIsExiting(true);
    player?.closeFullScreen?.();
    player?.pause?.(); // Pause audio; do NOT call stop() so track stays in context and bar can reopen when user plays again
  }, [isExiting, player?.trackTitle, player?.trackArtist, player?.trackArtwork, player?.closeFullScreen, player?.pause]);

  if (!shouldRender) return null;

  const {
    isPlaying,
    isLoadingAudio,
    trackTitle,
    trackArtist,
    trackArtwork,
    togglePlayPause,
    openFullScreen,
  } = player ?? {};

  // Use snapshot when exiting (player state is cleared)
  const displayTitle = exitSnapshot?.trackTitle ?? trackTitle ?? 'Now Playing';
  const displayArtist = exitSnapshot?.trackArtist ?? trackArtist ?? '';
  const displayArtwork = exitSnapshot?.trackArtwork ?? trackArtwork;

  const textColor = theme.unselectedColor;
  // When on a tab screen, sit just above the liquid glass tab bar; on stack screens use safe area only
  const isOnTabScreen = Array.isArray(segments) && segments[0] === '(tabs)';
  const bottomOffset = isOnTabScreen
    ? TAB_PILL_HEIGHT + (Platform.OS === 'android' ? insets.bottom : Math.max(insets.bottom, 12)) + 12
    : 24 + insets.bottom;

  // Same default image as the full-screen track player (dua/full-screen artwork)
  const { DEFAULT_QURAN_ARTWORK_URL } = require('../constants/audioArtwork');
  const artworkSource = { uri: DEFAULT_QURAN_ARTWORK_URL };

  const content = (
    <>
      <Image source={artworkSource} style={styles.miniArtwork} />
      <View style={styles.miniTextWrap}>
        <Text style={[styles.miniTitle, { color: textColor }]} numberOfLines={1}>
          {displayTitle}
        </Text>
        <Text style={[styles.miniArtist, { color: textColor, opacity: 0.85 }]} numberOfLines={1}>
          {displayArtist}
        </Text>
      </View>
      {!isExiting && (
        <>
          <TouchableOpacity
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={(e) => {
              e.stopPropagation();
              if (!isLoadingAudio) togglePlayPause();
            }}
            style={styles.miniPlayButton}
            disabled={isLoadingAudio}
          >
            {isLoadingAudio ? (
              <ActivityIndicator size="small" color={textColor} />
            ) : isPlaying ? (
              <Pause size={24} color={textColor} />
            ) : (
              <Play size={24} color={textColor} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={handleClose}
            style={styles.closeButton}
            accessibilityLabel="Close player and stop audio"
          >
            <X size={22} color={textColor} strokeWidth={2.5} />
          </TouchableOpacity>
        </>
      )}
    </>
  );

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { bottom: bottomOffset },
        { opacity, transform: [{ translateY }] },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={isExiting ? undefined : openFullScreen}
        style={styles.pillTouchable}
        disabled={isExiting}
      >
        <LiquidGlassPill paddingHorizontal={14} paddingVertical={8} contentStyle={styles.miniBarRow}>
          {content}
        </LiquidGlassPill>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 99,
  },
  pillTouchable: {
    width: '100%',
    minHeight: 56,
  },
  miniBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    flex: 1,
  },
  miniArtwork: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  miniTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  miniTitle: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 15,
    color: '#fff',
  },
  miniArtist: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 13,
    marginTop: 2,
  },
  miniPlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  closeButton: {
    padding: 8,
  },
});
