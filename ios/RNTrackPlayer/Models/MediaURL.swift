//
//  MediaURL.swift
//  RNTrackPlayer
//
//  Created by David Chavez on 12.08.17.
//  Copyright © 2017 David Chavez. All rights reserved.
//

import Foundation
import React

struct MediaURL {
    let value: URL
    let isLocal: Bool
    private let originalObject: Any

    init?(object: Any?) {
        guard let object = object else { return nil }
        originalObject = object

        if let localObject = object as? [String: Any] {
            guard let urlString = localObject["uri"] as? String ?? localObject["url"] as? String else {
                return nil
            }
            var url = urlString

            if let bundleName = localObject["bundle"] as? String {
                url = String(format: "%@.bundle/%@", bundleName, url)
            }

            isLocal = !url.lowercased().hasPrefix("http")
            value = RCTConvert.nsurl(url)
        } else if let url = object as? String {
            isLocal = url.lowercased().hasPrefix("file://")
            value = RCTConvert.nsurl(url)
        } else {
            // RN asset module IDs (numbers) must be resolved to { uri } in JS before reaching native.
            return nil
        }
    }
}
