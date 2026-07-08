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
        val intent = Intent(this, VolumeOverlayService::class.java)
        // Need to check if running, but for now let's just start/stop
        // Simple way is to stop if running, start if not
        // A better way is using a broadcast, but this is a quick fix.
        startService(intent)
        
        // Update tile state
        updateTileState()
    }
}
