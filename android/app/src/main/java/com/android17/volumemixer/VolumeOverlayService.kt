package com.android17.volumemixer

import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.media.AudioManager
import android.os.IBinder
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.SeekBar
import android.widget.TextView
import com.android17.volumemixer.R

class VolumeOverlayService : Service() {

    private lateinit var windowManager: WindowManager
    private var overlayView: View? = null
    private lateinit var audioManager: AudioManager

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
        showFloatingMixerHUD()
    }

    private fun showFloatingMixerHUD() {
        val layoutType = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.END
            x = 30
            y = 250
        }

        val inflater = getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater
        overlayView = inflater.inflate(R.layout.floating_mixer_overlay, null)

        overlayView?.let { view ->
            val appsContainer = view.findViewById<android.widget.LinearLayout>(R.id.apps_container)
            val closeBtn = view.findViewById<Button>(R.id.overlay_close_btn)

            // Mock recent media apps
            val recentApps = listOf("Spotify", "YouTube", "Chrome")
            
            recentApps.forEach { appName ->
                val appRow = LinearLayout(this).apply {
                    orientation = LinearLayout.VERTICAL
                    layoutParams = LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.MATCH_PARENT,
                        LinearLayout.LayoutParams.WRAP_CONTENT
                    ).apply { setMargins(0, 0, 0, 16) }
                }
                
                val title = TextView(this).apply {
                    text = appName
                    textSize = 12f
                    setTextColor(android.graphics.Color.BLACK)
                }
                
                val seekBar = SeekBar(this).apply {
                    max = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
                    progress = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC)
                }
                
                appRow.addView(title)
                appRow.addView(seekBar)
                appsContainer.addView(appRow)
            }

            closeBtn.setOnClickListener {
                stopSelf()
            }

            windowManager.addView(view, params)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        overlayView?.let {
            windowManager.removeView(it)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
