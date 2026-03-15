//
//  MediaInfoController.swift
//  SwiftAudio
//
//  Created by Jørgen Henrichsen on 15/03/2018.
//

import Foundation
import MediaPlayer
#if canImport(UIKit)
import UIKit
#endif

public class NowPlayingInfoController: NowPlayingInfoControllerProtocol {
    private let lock = NSLock()
    private var infoQueue: DispatchQueueType = DispatchQueue(
        label: "NowPlayingInfoController.infoQueue",
        attributes: .concurrent
    )

    private(set) var info: [String: Any] = [:]
    private(set) var infoCenter: NowPlayingInfoCenter
    
    public required init() {
        infoCenter = MPNowPlayingInfoCenter.default()
    }

    /// Used for testing purposes.
    public required init(dispatchQueue: DispatchQueueType, infoCenter: NowPlayingInfoCenter) {
        infoQueue = dispatchQueue
        self.infoCenter = infoCenter
    }
    
    public required init(infoCenter: NowPlayingInfoCenter = MPNowPlayingInfoCenter.default()) {
        self.infoCenter = infoCenter
    }
    
    public func set(keyValues: [NowPlayingInfoKeyValue]) {
        lock.lock()
        keyValues.forEach { keyValue in
            self.info[keyValue.getKey()] = keyValue.getValue()
        }
        let snapshot = self.info
        lock.unlock()
        pushToCenter(snapshot)
    }

    public func setWithoutUpdate(keyValues: [NowPlayingInfoKeyValue]) {
        lock.lock()
        keyValues.forEach { keyValue in
            self.info[keyValue.getKey()] = keyValue.getValue()
        }
        lock.unlock()
    }
    
    public func set(keyValue: NowPlayingInfoKeyValue) {
        lock.lock()
        self.info[keyValue.getKey()] = keyValue.getValue()
        let snapshot = self.info
        lock.unlock()
        pushToCenter(snapshot)
    }

    public func setPlaybackValuesSync(duration: TimeInterval, elapsed: TimeInterval, rate: Double) {
        lock.lock()
        self.info[MPMediaItemPropertyPlaybackDuration] = NSNumber(value: duration)
        self.info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = NSNumber(value: elapsed)
        self.info[MPNowPlayingInfoPropertyPlaybackRate] = NSNumber(value: rate)
        let snapshot = self.info
        lock.unlock()
        if Thread.isMainThread {
            infoCenter.nowPlayingInfo = snapshot
        } else {
            DispatchQueue.main.sync { [weak self] in
                self?.infoCenter.nowPlayingInfo = snapshot
            }
        }
    }

    /// Push the current info dictionary to MPNowPlayingInfoCenter synchronously on main so the lock screen widget appears immediately.
    /// Ensures remote control events are enabled before setting info so the lock screen works on first play (not only after stop → play again).
    public func pushToCenterSync() {
        lock.lock()
        let snapshot = self.info
        lock.unlock()
        if Thread.isMainThread {
            #if canImport(UIKit)
            UIApplication.shared.beginReceivingRemoteControlEvents()
            #endif
            infoCenter.nowPlayingInfo = snapshot
        } else {
            DispatchQueue.main.sync { [weak self] in
                #if canImport(UIKit)
                UIApplication.shared.beginReceivingRemoteControlEvents()
                #endif
                self?.infoCenter.nowPlayingInfo = snapshot
            }
        }
    }

    private func update() {
        lock.lock()
        let snapshot = self.info
        lock.unlock()
        pushToCenter(snapshot)
    }

    private func pushToCenter(_ snapshot: [String: Any]) {
        if Thread.isMainThread {
            infoCenter.nowPlayingInfo = snapshot
        } else {
            DispatchQueue.main.async { [weak self] in
                self?.infoCenter.nowPlayingInfo = snapshot
            }
        }
    }
    
    public func clear() {
        lock.lock()
        self.info = [:]
        lock.unlock()
        if Thread.isMainThread {
            infoCenter.nowPlayingInfo = nil
        } else {
            DispatchQueue.main.async { [weak self] in
                self?.infoCenter.nowPlayingInfo = nil
            }
        }
    }
    
}
