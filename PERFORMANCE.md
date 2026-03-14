# Performance and optimization

This document describes how to get the best speed and lowest overhead from **react-native-mp3-player**, and what the package does internally to reduce work.

---

## 1. Progress updates (fewer bridge calls)

### Prefer native-driven progress when possible

- **Set `progressUpdateEventInterval`** in `updateOptions()` (in **seconds**, e.g. `1` for every second). The native layer will then emit `Event.PlaybackProgressUpdated` at that interval instead of you polling.
- **Use `useProgress(intervalMs, background, { useNativeEvents: true })`** so the hook subscribes to `PlaybackProgressUpdated` and updates state from events. You still get a slow fallback poll (e.g. every 3 s) for drift. This reduces bridge round-trips compared to polling every second.

Example:

```ts
// In your setup / updateOptions:
await TrackPlayer.updateOptions({
  capabilities: [...],
  progressUpdateEventInterval: 1, // seconds; native emits every 1 s
});

// In your component:
const progress = useProgress(1000, true, { useNativeEvents: true });
```

- **Avoid** using a very small `updateInterval` in `useProgress` (e.g. 250 ms) without `useNativeEvents: true`; that causes 4+ `getProgress()` bridge calls per second. If you need smooth progress, set `progressUpdateEventInterval` to 0.25 and use `useNativeEvents: true` with a fallback poll of ~2–3 s.

---

## 2. iOS: Now Playing and progress tick

- When **`progressUpdateEventInterval`** is set and ≤ 1 second, the native progress tick also updates **MPNowPlayingInfoCenter** (elapsed/duration). A separate 1-second timer is not used in that case, so there is only one periodic task instead of two.
- When `progressUpdateEventInterval` is 0 or &gt; 1 s, a dedicated 1-second timer runs to keep the lock screen / Control Center widget in sync.

---

## 3. Batch and debounce in your app

- **Seeking:** If the user drags a slider, debounce or throttle `seekTo()` (e.g. at most one call every 200–300 ms) so you don’t flood the bridge.
- **Metadata:** Prefer a single `updateNowPlayingMetadata()` or `updateMetadataForTrack()` with all fields instead of multiple small updates.
- **Queue changes:** Prefer `setQueue()` or a single `add()` with multiple tracks over many small `add()` calls when building a queue.

---

## 4. Buffer and streaming (setup options)

- Use **`minBuffer`**, **`maxBuffer`**, **`playBuffer`** (and Android equivalents where supported) to tune buffering. Larger buffers can reduce stalling on slow networks but use more memory; smaller values can reduce memory and startup time for short clips.
- For **local files**, you typically need minimal buffering; the default or small values are usually enough.

---

## 5. Android

- **Progress:** When `progressUpdateEventInterval` is set, the service uses a single coroutine/flow to emit progress at that interval. No change needed on your side; avoid polling with `getProgress()` at a higher rate than the native interval if you can use `Event.PlaybackProgressUpdated` and `useProgress(..., { useNativeEvents: true })` instead.
- **Service:** Playback runs in a Media3 `MediaLibraryService`; the system manages the process. Avoid doing heavy work on the JS thread while playback is active so the bridge can process events promptly.

---

## 6. General

- **Events vs polling:** Prefer `addEventListener(Event.PlaybackState, ...)` and similar for state changes instead of repeatedly calling `getPlaybackState()` in a loop.
- **Cleanup:** Remove event listeners and cancel any app-side timers when components unmount or when the player is reset, so the bridge and native side aren’t doing work for inactive UI.
- **Single source of truth:** Use one place (e.g. one context or hook) to drive progress and playback state so you don’t have multiple subscribers or timers doing the same work.

---

## Summary

| Goal                     | Recommendation                                                                 |
|--------------------------|-------------------------------------------------------------------------------|
| Fewer bridge calls       | Set `progressUpdateEventInterval` and use `useProgress(..., { useNativeEvents: true })`. |
| Smoother progress UI     | Use native events (e.g. interval 0.25–1 s) + `useNativeEvents: true`; avoid very fast polling. |
| Less duplicate work (iOS)| Use `progressUpdateEventInterval` ≤ 1 s so one tick drives both progress and Now Playing. |
| Responsive seek UI       | Throttle/debounce `seekTo()` while the user drags the slider.                |
| Lower memory / faster start | Tune buffer options for your use case (streaming vs local).               |
