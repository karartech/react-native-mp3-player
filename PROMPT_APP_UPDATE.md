# Prompt: Implement react-native-mp3-player package update (useSetupPlayer + useMiniPlayer)

**Use this prompt when asking an AI to update your React Native app to use the new `react-native-mp3-player` APIs for a global mini player that works on both iOS and Android.**

---

## Context

- **Package:** `react-native-mp3-player` (npm), updated with:
  - **`useSetupPlayer(options?)`** – Runs `setupPlayer()` once and returns `isPlayerReady`. On Android it retries if the app was in the background, so the same code works on both platforms.
  - **`useMiniPlayer()`** – Returns everything needed for a global mini player bar: `hasTrack`, `isPlayerReady` (must be provided separately from `useSetupPlayer`), `isPlaying`, `isLoadingAudio`, `track`, `trackTitle`, `trackArtist`, `trackArtwork`, `togglePlayPause`, `pause`, `stop`, `refreshActiveTrack`, `refreshPlaybackState`.

- **Goal:** Wire the app so the global mini player (e.g. `GlobalMiniPlayer.js`) uses these hooks and works cross-platform. Prefer using the package’s `useSetupPlayer` and `useMiniPlayer` where they replace custom logic; keep app-specific behavior (e.g. `openFullScreen`, `closeFullScreen`, navigation, which screens hide the bar) in the app.

---

## What to do

1. **Upgrade the package**  
   Bump `react-native-mp3-player` to the new version (e.g. `npm install react-native-mp3-player@latest` or the specific version you published).

2. **Player setup (app root)**  
   Where the player is currently set up (e.g. in a provider or root layout):
   - Use **`useSetupPlayer({ options?, background?, serviceFactory? })`** from `react-native-mp3-player`.
   - Pass your existing `setupPlayer` options and playback service factory if you have them.
   - Expose **`isPlayerReady`** from this hook (e.g. via context or by rendering children only when `isPlayerReady` is true).

3. **Audio player context (if you have one)**  
   If the app has an `AudioPlayerContext` (or similar) that currently:
   - Tracks `hasTrack`, `isPlaying`, `isLoadingAudio`, `trackTitle`, `trackArtist`, `trackArtwork`, and provides `togglePlayPause`, `pause`, `stop`, `refreshActiveTrack`, `refreshPlaybackState`:
   - Refactor so that context gets **`isPlayerReady`** from `useSetupPlayer()` (or from the same place you run setup) and gets the rest from **`useMiniPlayer()`** (or keep building that shape from `useActiveTrack` + `usePlaybackState` + `useIsPlaying` + imperative `TrackPlayer` calls, if you prefer).
   - Ensure the context still exposes **`openFullScreen`** and **`closeFullScreen`** (or equivalent) as app-defined callbacks (e.g. navigation to full-screen player route; close = pause + navigate back or dismiss).

4. **Global mini player component**  
   The component that renders the persistent mini bar (e.g. `GlobalMiniPlayer.js`):
   - Should keep using the same interface from context: `hasTrack`, `isPlayerReady`, `isPlaying`, `isLoadingAudio`, `trackTitle`, `trackArtist`, `trackArtwork`, `togglePlayPause`, `openFullScreen`, `closeFullScreen`, `pause`, `stop`, `refreshActiveTrack`, `refreshPlaybackState`.
   - No change required to the component’s props/context shape if the context is updated to source its data from `useSetupPlayer` + `useMiniPlayer` (and app-specific navigation).

5. **Platform behavior**  
   Do not add `Platform.OS` branches for “mini player” logic unless necessary. The package is intended to behave the same on iOS and Android for these APIs.

---

## Summary for the AI

- **Package:** `react-native-mp3-player` with `useSetupPlayer` and `useMiniPlayer`.
- **Tasks:** Upgrade package; use `useSetupPlayer` at app root for `isPlayerReady`; feed mini player state from `useMiniPlayer()` (or equivalent) via existing context; keep `openFullScreen`/`closeFullScreen` and screen-visibility rules in the app.
- **Result:** Global mini player works on both iOS and Android using the new hooks, with minimal app-specific code.
