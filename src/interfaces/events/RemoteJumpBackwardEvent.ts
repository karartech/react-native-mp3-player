export interface RemoteJumpBackwardEvent {
  /**
   * The number of seconds to jump backward.
   * May be missing on Android
   * See https://rntp.dev/docs/api/events#remotejumpbackward
   **/
  interval?: number;
}
