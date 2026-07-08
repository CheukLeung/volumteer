package com.android17.volumemixer

import android.content.Intent
import android.media.AudioManager
import android.os.Build
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService
import androidx.annotation.RequiresApi

@RequiresApi(Build.VERSION_CODES.N)
class VolumeTileService : TileService() {

    override fun onStartListening() {
        super.onStartListening()
        updateTileState()
    }

    private fun updateTileState() {
        val audioManager = getSystemService(AUDIO_SERVICE) as AudioManager
        val isMuted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            audioManager.isStreamMute(AudioManager.STREAM_MUSIC)
        } else {
            false
        }

        val tile = qsTile ?: return
        tile.state = if (isMuted) Tile.STATE_INACTIVE else Tile.STATE_ACTIVE
        tile.label = if (isMuted) "Mixer: MUTED" else "Mixer: ACTIVE"
        tile.updateTile()
    }

    override fun onClick() {
        super.onClick()
        val audioManager = getSystemService(AUDIO_SERVICE) as AudioManager
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val isCurrentlyMuted = audioManager.isStreamMute(AudioManager.STREAM_MUSIC)
            // Toggle stream mute state dynamically
            audioManager.adjustStreamVolume(
                AudioManager.STREAM_MUSIC,
                if (isCurrentlyMuted) AudioManager.ADJUST_UNMUTE else AudioManager.ADJUST_MUTE,
                0
            )
        }
        updateTileState()
    }
}
