# Project handoff: react-native-mp3-player

**Purpose of this file:** Bring a new Cursor chat (or any AI) up to speed. Read this first when working in this repo.

---

## What this project is

**react-native-mp3-player** is an **independent** React Native audio player package. It is **not** a dependency on the official react-native-track-player or @jamsch/react-native-track-player; it’s a standalone npm package you can publish and maintain.

- **Package name:** `react-native-mp3-player`
- **GitHub (owner):** `alkarartech`
- **Repo URL:** https://github.com/alkarartech/react-native-mp3-player  
- **Local folder:** `/Users/hidar313/NPM Projects/react-native-mp3-player`

---

## Where it came from (lineage)

1. **Original:** [doublesymmetry/react-native-track-player](https://github.com/doublesymmetry/react-native-track-player) (Apache-2.0).
2. **Fork used as base:** [jamsch/react-native-track-player](https://github.com/jamsch/react-native-track-player), **APM branch** (published as [@jamsch/react-native-track-player](https://www.npmjs.com/package/@jamsch/react-native-track-player)). That fork adds crossfade, Android Auto, and other fixes; it was in active development while upstream was quiet.
3. **This project:** The codebase in this folder was **cloned from jamsch’s APM branch**, then **rebranded and hardened** into an independent package. Attribution is in **NOTICE** and **LICENSE**; there is no runtime dependency on jamsch or doublesymmetry.

---

## What was done (summary of changes)

### 1. Rebrand and independence

- **package.json:** Name set to `react-native-mp3-player`, version `1.0.0`, description updated. `repository`, `bugs`, and `homepage` point to `https://github.com/alkarartech/react-native-mp3-player`.
- **NOTICE:** Added to credit both doublesymmetry and jamsch; states this is an independent derivative under Apache-2.0.
- **LICENSE:** Apache-2.0 kept; short copyright/derivative note added at the top.
- **Podspec:** Renamed to `react-native-mp3-player.podspec` and uses the new package name.
- **Example app:** Uses `react-native-mp3-player` (dependency `"file:.."`) and imports from `'react-native-mp3-player'`; no references to upstream package names in imports.

### 2. iOS background playback

To fix audio stopping on iOS when the app goes to background (e.g. ~50 second cutoff):

- **ios/RNTrackPlayer/RNTrackPlayer.swift:**
  - Import **AVFoundation**.
  - Default **sessionCategoryPolicy** set to **`.longFormAudio`** so iOS treats the app as long-form audio.
  - **configureAudioSessionForBackgroundPlayback()** added and called from **setupPlayer()**: sets category, mode, policy, options, and calls **AVAudioSession.setActive(true)** so the session is active from setup.
  - When the user doesn’t set **iosCategoryPolicy** and category is `.playback`, policy is forced to **`.longFormAudio`**.
  - In **configureAudioSession()**, when starting playback, **setActive(true)** is called.
  - **autoHandleInterruptions** defaults to **true** so playback resumes after system interruptions.

The **app** must enable **Background Modes → Audio** (or `UIBackgroundModes` → `audio` in Info.plist).

### 3. Android “Session ID must be unique” mitigation

- **android/.../MusicService.kt:** Media session id changed from a fixed string to **`rntp_media_session_${Process.myPid()}`** so each process gets a unique id. This reduces the “Session ID must be unique” crash after aggressive OS kill (e.g. on Oppo/Xiaomi).

### 4. JS API validation and robustness

- **src/trackPlayer.ts:**
  - **setupPlayer(options, background):** Validates `options` is a plain object or undefined; throws a clear error otherwise.
  - **add(tracks):** Validates each track is a non-null object with at least **`url`** or **`id`**; throws with index and a prefixed message (`react-native-mp3-player: ...`).
  - **load(track):** Same validation for a single track.

### 5. Tooling and docs

- **Scripts:** All use **npm** (e.g. `npm run build`, `npm run prepare`, `npm run example`). No yarn in scripts.
- **README.md:** Standalone: install, quick start, API overview, license/attribution. No dependency on upstream docs.
- **CUSTOMIZATION.md:** How to customize and publish; points to NOTICE/LICENSE.
- **react-native.config.js:** Added for React Native autolinking.

---

## Project layout (important paths)

| What | Where |
|------|--------|
| Package config | `package.json` |
| Attribution | `NOTICE`, `LICENSE` |
| JS/TS API | `src/trackPlayer.ts`, `src/index.ts` |
| Hooks, constants, interfaces | `src/hooks/`, `src/constants/`, `src/interfaces/` |
| Native spec (codegen) | `specs/` |
| iOS implementation | `ios/RNTrackPlayer/` (Swift), `ios/SwiftAudioEx/` (vendored) |
| Android implementation | `android/src/main/java/com/doublesymmetry/trackplayer/`, and `.../lovegaoshi/kotlinaudio/` (vendored) |
| Example app | `example/` (depends on root via `"react-native-mp3-player": "file:.."`) |
| Podspec | `react-native-mp3-player.podspec` |

---

## Commands (from repo root)

```bash
npm install
npm run build          # or: npm run prepare
npm run example        # start Metro for the example app
npm run pods           # cd example/ios && pod install
```

Run the example app on a device/simulator from the `example/` directory (e.g. `npx react-native run-ios` or `run-android` inside `example/`).

---

## Before publishing to npm

1. Ensure **repository**, **bugs**, and **homepage** in **package.json** point to **alkarartech/react-native-mp3-player** (already set).
2. Run **`npm run build`** and commit the **lib/** output if you ship compiled JS.
3. Test the example app (iOS and Android).
4. Use **`npm publish`** (or your preferred publish flow).

---

## References (for context only; no runtime dependency)

- [Official react-native-track-player issues](https://github.com/doublesymmetry/react-native-track-player/issues) – many open bugs/features; this package applied fixes where feasible (e.g. session id, validation, iOS background).
- [@jamsch/react-native-track-player](https://www.npmjs.com/package/@jamsch/react-native-track-player) – fork this repo was cloned from (APM branch).

---

*Last updated for folder rename to `react-native-mp3-player` and username **alkarartech**.*
