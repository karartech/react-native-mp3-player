package com.lovegaoshi.kotlinaudio.player.components

import android.content.Context
import android.os.Build
import androidx.annotation.OptIn
import androidx.media3.common.MediaItem
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DataSource
import androidx.media3.datasource.DataSpec
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.datasource.RawResourceDataSource
import androidx.media3.datasource.cache.CacheDataSource
import androidx.media3.datasource.cache.SimpleCache
import androidx.media3.exoplayer.dash.DashMediaSource
import androidx.media3.exoplayer.dash.DefaultDashChunkSource
import androidx.media3.exoplayer.drm.DrmSessionManagerProvider
import androidx.media3.exoplayer.hls.HlsMediaSource
import androidx.media3.exoplayer.smoothstreaming.DefaultSsChunkSource
import androidx.media3.exoplayer.smoothstreaming.SsMediaSource
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.exoplayer.source.MediaSource
import androidx.media3.exoplayer.source.ProgressiveMediaSource
import androidx.media3.exoplayer.upstream.LoadErrorHandlingPolicy
import androidx.media3.extractor.DefaultExtractorsFactory
import com.lovegaoshi.kotlinaudio.utils.isUriLocalFile
import androidx.core.net.toUri
import timber.log.Timber


@OptIn(UnstableApi::class)
class MediaFactory (
    private val context: Context,
    private val cache: SimpleCache?
) : MediaSource.Factory{

    private val mediaFactory = DefaultMediaSourceFactory(context)

    override fun setDrmSessionManagerProvider(drmSessionManagerProvider: DrmSessionManagerProvider): MediaSource.Factory {
        return mediaFactory.setDrmSessionManagerProvider(drmSessionManagerProvider)
    }

    override fun setLoadErrorHandlingPolicy(loadErrorHandlingPolicy: LoadErrorHandlingPolicy): MediaSource.Factory {
        return mediaFactory.setLoadErrorHandlingPolicy(loadErrorHandlingPolicy)
    }

    override fun getSupportedTypes(): IntArray {
        return mediaFactory.supportedTypes
    }

    override fun createMediaSource(mediaItem: MediaItem): MediaSource {

        val userAgent = mediaItem.mediaMetadata.extras?.getString("user-agent")
        val headers = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            mediaItem.mediaMetadata.extras?.getSerializable("headers", HashMap::class.java)
        } else {
            mediaItem.mediaMetadata.extras?.getSerializable("headers")
        }
        val resourceId = mediaItem.mediaMetadata.extras?.getInt("resource-id")
        // HACK: why are these capitalized?
        val resourceType = mediaItem.mediaMetadata.extras?.getString("type")?.lowercase()
        val uri = mediaItem.mediaMetadata.extras?.getString("uri")!!.toUri()
        val factory: DataSource.Factory = when {
            resourceId != 0 && resourceId != null -> {
                val raw = RawResourceDataSource(context)
                raw.open(DataSpec(uri))
                DataSource.Factory { raw }
            }
            isUriLocalFile(uri) -> {
                DefaultDataSource.Factory(context)
            }
            else -> {
                val tempFactory = DefaultHttpDataSource.Factory().apply {
                    setUserAgent(userAgent)
                    setAllowCrossProtocolRedirects(true)

                    headers?.let {
                        setDefaultRequestProperties(it as HashMap<String, String>)
                    }
                }

                // Only enable caching if cache is actually available
                if (cache != null) {
                    enableCaching(tempFactory)
                } else {
                    tempFactory
                }
            }
        }

        return when (resourceType) {
            "dash" -> createDashSource(mediaItem, factory)
            "hls" -> createHlsSource(mediaItem, factory)
            "smoothstreaming" -> createSsSource(mediaItem, factory)
            else -> createProgressiveSource(mediaItem, factory)
        }
    }

    private fun createDashSource(mediaItem: MediaItem, factory: DataSource.Factory?): MediaSource {
        return DashMediaSource.Factory(DefaultDashChunkSource.Factory(factory!!), factory)
            .createMediaSource(mediaItem)
    }

    private fun createHlsSource(mediaItem: MediaItem, factory: DataSource.Factory?): MediaSource {
        return HlsMediaSource.Factory(factory!!)
            .createMediaSource(mediaItem)
    }

    private fun createSsSource(mediaItem: MediaItem, factory: DataSource.Factory?): MediaSource {
        return SsMediaSource.Factory(DefaultSsChunkSource.Factory(factory!!), factory)
            .createMediaSource(mediaItem)
    }

    private fun createProgressiveSource(
        mediaItem: MediaItem,
        factory: DataSource.Factory
    ): ProgressiveMediaSource {
        return ProgressiveMediaSource.Factory(
            factory, DefaultExtractorsFactory()
                .setConstantBitrateSeekingEnabled(true)
        )
            .createMediaSource(mediaItem)
    }

    private fun enableCaching(factory: DataSource.Factory): DataSource.Factory {
        // Add detailed debugging to understand the NPE
        Timber.tag("RNTP").d("enableCaching called - cache is: ${cache}")
        
        if (cache == null) {
            Timber.tag("RNTP").d("Cache is null in enableCaching, returning original factory")
            return factory
        }
        
        // Validate cache is properly initialized
        try {
            val cacheKeys = cache.keys
            Timber.tag("RNTP").d("Cache appears valid - keys count: ${cacheKeys.size}")
        } catch (e: Exception) {
            Timber.tag("RNTP").e(e, "Cache validation failed, returning original factory")
            return factory
        }
        
        Timber.tag("RNTP").d("Cache is not null, attempting to create CacheDataSource.Factory")
        
        return try {
            val cacheFactory = CacheDataSource.Factory()
            Timber.tag("RNTP").d("Created CacheDataSource.Factory, setting cache")
            
            cacheFactory.setCache(cache)
            Timber.tag("RNTP").d("Set cache successfully, setting upstream factory")
            
            cacheFactory.setUpstreamDataSourceFactory(factory)
            Timber.tag("RNTP").d("Set upstream factory, setting flags")
            
            cacheFactory.setFlags(CacheDataSource.FLAG_IGNORE_CACHE_ON_ERROR)
            Timber.tag("RNTP").d("Cache setup completed successfully")
            
            cacheFactory
        } catch (e: Exception) {
            // If cache setup fails, fall back to original factory
            Timber.tag("RNTP").e(e, "Failed to setup cache at step, using original factory")
            factory
        }
    }
}