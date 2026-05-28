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
        let safeDuration = duration.isFinite && duration >= 0 ? duration : 0
        let safeElapsed = elapsed.isFinite && elapsed >= 0 ? elapsed : 0
        let safeRate = rate.isFinite && rate >= 0 ? rate : 0
        lock.lock()
        self.info[MPMediaItemPropertyPlaybackDuration] = NSNumber(value: safeDuration)
        self.info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = NSNumber(value: safeElapsed)
        self.info[MPNowPlayingInfoPropertyPlaybackRate] = NSNumber(value: safeRate)
        let snapshot = self.info
        lock.unlock()
        applySnapshotOnMain(snapshot)
    }

    /// Push the current info dictionary to MPNowPlayingInfoCenter on the main queue.
    /// Never uses main.sync — avoids deadlocks when called from the React Native bridge queue during play().
    public func pushToCenterSync() {
        lock.lock()
        let snapshot = self.info
        lock.unlock()
        applySnapshotOnMain(snapshot)
    }

    private func applySnapshotOnMain(_ snapshot: [String: Any]) {
        let apply = { [weak self] in
            #if canImport(UIKit)
            UIApplication.shared.beginReceivingRemoteControlEvents()
            #endif
            self?.infoCenter.nowPlayingInfo = snapshot
        }
        if Thread.isMainThread {
            apply()
        } else {
            DispatchQueue.main.async(execute: apply)
        }
    }

    private func update() {
        lock.lock()
        let snapshot = self.info
        lock.unlock()
        pushToCenter(snapshot)
    }

    private func pushToCenter(_ snapshot: [String: Any]) {
        applySnapshotOnMain(snapshot)
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
