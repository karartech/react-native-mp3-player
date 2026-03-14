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

Link native projects (see [React Native docs](https://reactnative.dev/docs/linking-libraries-ios)). On iOS, enable **Background Modes → Audio** in your app capabilities.

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
- **Queue:** `add()`, `load()`, `remove()`, `skip()`, `skipToNext()`, `skipToPrevious()`, `setQueue()`, `getQueue()`, `getActiveTrack()`, `getActiveTrackIndex()`
- **Playback:** `play()`, `pause()`, `stop()`, `seekTo()`, `seekBy()`, `setVolume()`, `setRate()`, `setRepeatMode()`
- **State:** `getPlaybackState()`, `getProgress()`, `getVolume()`, `getRate()`
- **Events:** `addEventListener(event, listener)` – see `Event` enum.
- **Hooks:** `useProgress()`, `usePlaybackState()`, `useActiveTrack()`, `useIsPlaying()`, `useTrackPlayerEvents()`, etc.

Types and options are in the package TypeScript definitions.

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
