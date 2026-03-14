//
//  NowPlayingInfoControllerProtocol.swift
//  SwiftAudio
//
//  Created by Jørgen Henrichsen on 28/02/2019.
//

import Foundation
import MediaPlayer


public protocol NowPlayingInfoControllerProtocol {
    
    init()
    
    init(infoCenter: NowPlayingInfoCenter)
    
    func set(keyValue: NowPlayingInfoKeyValue)
    
    func set(keyValues: [NowPlayingInfoKeyValue])
    
    func setWithoutUpdate(keyValues: [NowPlayingInfoKeyValue])
    
    func clear()
    
    /// Optional: push playback values to the system synchronously on main (e.g. so play/pause widget updates before returning). Default merges and calls set() (async).
    func setPlaybackValuesSync(duration: TimeInterval, elapsed: TimeInterval, rate: Double)

    /// Push the current info dictionary to MPNowPlayingInfoCenter synchronously on main so the lock screen widget appears immediately (e.g. on first track load).
    func pushToCenterSync()
}

extension NowPlayingInfoControllerProtocol {
    public func setPlaybackValuesSync(duration: TimeInterval, elapsed: TimeInterval, rate: Double) {
        set(keyValues: [
            MediaItemProperty.duration(duration),
            NowPlayingInfoProperty.elapsedPlaybackTime(elapsed),
            NowPlayingInfoProperty.playbackRate(rate)
        ])
    }

    public func pushToCenterSync() {}
}
