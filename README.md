# react-native-mp3-player

React Native audio player with **reliable iOS background playback**, media controls, queue management, and React hooks. Built for music and podcast apps. Independent package; no dependency on upstream track-player repos.

> **For maintainers / new Cursor chats:** See **[HANDOFF.md](./HANDOFF.md)** for project history, what was done, and how to work in this repo.

[![npm version](https://img.shields.io/npm/v/react-native-mp3-player.svg)](https://www.npmjs.com/package/react-native-mp3-player)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)

## Features

- **iOS background playback** – Audio continues when the app is in the background (no ~50s cutoff). Uses `AVAudioSession` with `.longFormAudio` and interruption handling.
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
- **State:** `getPlaybackState()`, `getProgress()`, `getVolume()`, `getRate()`
- **Events:** `addEventListener(event, listener)` – see `Event` enum.
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
