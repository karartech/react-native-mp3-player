# react-native-mp3-player

React Native audio player with **reliable iOS background playback**, media controls, queue management, and React hooks. Built for music and podcast apps. Independent package; no dependency on upstream track-player repos.

> **For maintainers / new Cursor chats:** See **[HANDOFF.md](./HANDOFF.md)** for project history, what was done, and how to work in this repo.

[![npm version](https://img.shields.io/npm/v/react-native-mp3-player.svg)](https://www.npmjs.com/package/react-native-mp3-player)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)

## Features

- **Background playback (iOS & Android)** – Audio continues when the app is in the background or the screen is locked. No patches required; compatible with current Xcode and Android 14/15.
- **iOS** – Uses `AVAudioSession` with `.longFormAudio` and interruption handling; lock screen and Control Center work natively.
- **Android** – Uses Media3 `MediaLibraryService` with `foregroundServiceType="mediaPlayback"`; system media notification, lock screen, and Android Auto are supported.
- **Multi-platform** – Android, iOS, Windows.
- **Media controls** – Lock screen, notification, Bluetooth, Android Auto.
- **Queue & playback** – Add, remove, reorder tracks; play, pause, seek, repeat, crossfade (where supported).
- **React hooks** – `useProgress`, `usePlaybackState`, `useActiveTrack`, `useIsPlaying`, and more.
- **Streaming** – Local files and remote URLs.
- **Input validation** – Clear errors when tracks or options are invalid.

## Installation

```bash
npm install react-native-mp3-player
```

Link native projects (see [React Native docs](https://reactnative.dev/docs/linking-libraries-ios)).

### iOS background playback

For audio to continue when the app is backgrounded or the screen is locked (and to avoid the ~50 second cutoff), you must:

1. **Enable Background Modes → Audio** (or “Audio, AirPlay, and Picture in Picture”) in your app’s Xcode project: select your target → **Signing & Capabilities** → **+ Capability** → **Background Modes** → check **Audio**.
2. The package configures **AVAudioSession** (category `.playback` with options for Bluetooth, AirPlay, ducking) and handles **interruptions** and **background transitions** so that playback can continue when the app is backgrounded.
3. **Lock screen and Control Center** controls (play, pause, seek, 15-second skip) are handled **natively**, so they work even when the JavaScript thread is suspended (e.g. screen locked). When the app returns to the foreground, events are emitted so your UI stays in sync.
4. **Now Playing widget:** The package sets and updates **MPNowPlayingInfoCenter** as soon as a track is loaded (title, artist, duration, elapsed, rate, artwork) and keeps it updated every second during playback. When you pause, the widget shows the track as paused (rate 0), not "Not Playing". Now playing info is only cleared when there is no current track (e.g. after `reset()`).

### Android background playback

The package is built for **Android 14+** compatibility and works when the app is in the background or the screen is off:

1. **Foreground service:** The library declares `FOREGROUND_SERVICE_MEDIA_PLAYBACK` and uses `android:foregroundServiceType="mediaPlayback"` on the playback service, as required since Android 14. No extra setup in your app is needed.
2. **Media3 / ExoPlayer:** Playback runs in a **MediaLibraryService** (Media3), which correctly starts as a foreground service with type `mediaPlayback`, so background playback and the media notification are allowed by the system.
3. **Media controls:** The service is advertised via **MediaSessionService** and **MediaLibraryService** so the system media notification, lock screen, Bluetooth, and Android Auto can discover and control playback.
4. **Target SDK:** The library compiles with `compileSdkVersion` 35 and defaults to `targetSdkVersion` 34. Your app can override these via `react-native-mp3-player`’s build extras if needed. **Android 15:** Do not start the media service from a `BOOT_COMPLETED` receiver; the platform no longer allows that for media playback.

## Quick start

```javascript
import TrackPlayer from 'react-native-mp3-player';

const start = async () => {
  await TrackPlayer.setupPlayer({});

  await TrackPlayer.add({
    id: 'track-1',
    url: 'https://example.com/audio.mp3',
    title: 'Track Title',
    artist: 'Artist Name',
    artwork: 'https://example.com/artwork.png',
  });

  await TrackPlayer.play();
};
start();
```

Register a playback service so remote events (play, pause, next, etc.) are handled:

```javascript
import TrackPlayer, { Event } from 'react-native-mp3-player';
import PlaybackService from './PlaybackService';

TrackPlayer.registerPlaybackService(() => PlaybackService);
```

## API overview

- **Lifecycle:** `setupPlayer(options?, background?)`, `registerPlaybackService(factory)`, `reset()`
- **Queue:** `add()`, `load()`, `remove()`, `skip()`, `skipToNext()`, `skipToPrevious()`, `setQueue()`, `getQueue()`, **`getActiveTrack()`** (current track), `getActiveTrackIndex()`
- **Playback:** `play()`, `pause()`, `stop()`, `seekTo()`, `seekBy()`, `setVolume()`, `setRate()`, `setRepeatMode()`
- **State & progress:** **`getPlaybackState()`** (returns `{ state }`; use this, not `getState`), **`getProgress()`** (returns `{ position, duration, buffered }` in seconds), **`getPosition()`** and **`getDuration()`** (convenience wrappers around `getProgress()`), `getVolume()`, `getRate()`
- **Events:** `addEventListener(event, listener)` – see `Event` enum. Listen for `Event.PlaybackState` so the UI stays in sync when the user taps play/pause.
- **Hooks:** **`useProgress(updateInterval?, background?)`** (interval in **milliseconds**; e.g. `useProgress(250)` = every 250 ms), `usePlaybackState()`, `useActiveTrack()`, `useIsPlaying()`, `useTrackPlayerEvents()`, etc.

**Setup options** (e.g. in `setupPlayer` / `updateOptions`): `iosCategory` (e.g. `'playback'`), `iosCategoryOptions` (e.g. `['allowAirPlay','allowBluetooth','duckOthers']`), `autoHandleInterruptions`, `autoUpdateMetadata`, `waitForBuffer`, `minBuffer` / buffer-related options, `forwardJumpInterval` / `backwardJumpInterval` (seconds, e.g. 15), `progressUpdateEventInterval` (seconds). Types and options are in the package TypeScript definitions.

## Example app

From the repo root:

```bash
npm install
npm run build
npm run example
```

See [example/README.md](./example/README.md) for running the example app.

## Documentation

- [NOTICE](./NOTICE) – Attribution and license.
- [LICENSE](./LICENSE) – Apache-2.0.

## License

Apache-2.0. See [LICENSE](./LICENSE) and [NOTICE](./NOTICE).
