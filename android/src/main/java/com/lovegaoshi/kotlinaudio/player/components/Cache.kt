package com.lovegaoshi.kotlinaudio.player.components

import android.content.Context
import androidx.media3.common.util.UnstableApi
import androidx.media3.database.DatabaseProvider
import androidx.media3.database.StandaloneDatabaseProvider
import androidx.media3.datasource.cache.LeastRecentlyUsedCacheEvictor
import androidx.media3.datasource.cache.SimpleCache
import timber.log.Timber
import java.io.File

@UnstableApi
object Cache {
    @Volatile
    private var instance: SimpleCache? = null

    fun initCache(context: Context, size: Long): SimpleCache {
        Timber.tag("RNTP").d("initCache called with size: $size")
        
        return instance ?: synchronized(this) {
            instance ?: try {
                val cacheDir = File(context.cacheDir, "APM")
                Timber.tag("RNTP").d("Creating cache directory: ${cacheDir.absolutePath}")
                
                if (!cacheDir.exists()) {
                    val created = cacheDir.mkdirs()
                    Timber.tag("RNTP").d("Cache directory created: $created")
                }
                
                val db: DatabaseProvider = StandaloneDatabaseProvider(context)
                Timber.tag("RNTP").d("Created database provider")
                
                val evictor = LeastRecentlyUsedCacheEvictor(size)
                Timber.tag("RNTP").d("Created cache evictor with size: $size")
                
                val cache = SimpleCache(cacheDir, evictor, db)
                Timber.tag("RNTP").d("Created SimpleCache successfully")
                
                instance = cache
                cache
            } catch (e: Exception) {
                Timber.tag("RNTP").e(e, "Failed to create cache")
                throw e
            }
        }
    }
}