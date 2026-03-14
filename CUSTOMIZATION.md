# Customizing react-native-mp3-player

This package is an **independent** React Native audio player. You can fork or customize it for your app.

## Package identity

- **Name:** `react-native-mp3-player`
- **API:** `import TrackPlayer from 'react-native-mp3-player'` (same API style as common track-player packages)

Repository URLs in `package.json` are set to **alkarartech/react-native-mp3-player**. If you fork, update `repository`, `bugs`, and `homepage` to your own repo.

## Where to customize

| Area | Location | What you can change |
|------|----------|---------------------|
| **JS/TS API** | `src/trackPlayer.ts` | Default options, validation, behavior |
| **Hooks** | `src/hooks/` | React hooks |
| **Types & constants** | `src/constants/`, `src/interfaces/` | Events, types |
| **Android** | `android/` | MusicService, notification, Media3 session |
| **iOS** | `ios/RNTrackPlayer/` | AVAudioSession, now playing, interruptions |

## iOS background playback

This package configures `AVAudioSession` at setup with `.longFormAudio` and handles interruptions so audio continues in the background. Your app must enable **Background Modes → Audio** (or `audio` in `UIBackgroundModes` in Info.plist).

## Build and test

```bash
npm install
npm run build
npm run example
```

## License and attribution

This project is a derivative work. See [NOTICE](./NOTICE) and [LICENSE](./LICENSE).
