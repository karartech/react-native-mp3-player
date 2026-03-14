export interface RemoteJumpForwardEvent {
  /**
   * The number of seconds to jump forward.
   * May be missing on Android
   * See https://rntp.dev/docs/api/events#remotejumpforward
   **/
  interval?: number;
}
