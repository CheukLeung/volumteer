package com.android17.volumemixer

import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.android17.volumemixer.ui.theme.VolumeMixerTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Ensure overlay permission is granted for the floating mixer panel
        checkOverlayPermission()

        setContent {
            VolumeMixerTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MixerDashboardScreen(
                        onLaunchOverlay = { startOverlayService() }
                    )
                }
            }
        }
    }

    private fun checkOverlayPermission() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(this)) {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:$packageName")
                )
                startActivityForResult(intent, OVERLAY_PERMISSION_REQ_CODE)
                Toast.makeText(
                    this, 
                    "Please enable 'Draw over other apps' to support floating volume controls!", 
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }

    private fun startOverlayService() {
        var canDraw = true
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            canDraw = Settings.canDrawOverlays(this)
        }
        if (canDraw) {
            val intent = Intent(this, VolumeOverlayService::class.java)
            startService(intent)
        } else {
            checkOverlayPermission()
        }
    }

    companion object {
        private const val OVERLAY_PERMISSION_REQ_CODE = 5469
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MixerDashboardScreen(onLaunchOverlay: () -> Unit) {
    val context = LocalContext.current
    val audioManager = remember { context.getSystemService(Context.AUDIO_SERVICE) as AudioManager }
    val maxVol = remember { audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC) }
    
    var masterVolume by remember { mutableStateOf((audioManager.getStreamVolume(AudioManager.STREAM_MUSIC).toFloat() / maxVol) * 100) }
    var isMuted by remember { mutableStateOf(audioManager.isStreamMute(AudioManager.STREAM_MUSIC)) }

    fun updateVolume(vol: Float) {
        masterVolume = vol
        val streamVol = ((vol / 100) * maxVol).toInt()
        audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, streamVol, AudioManager.FLAG_SHOW_UI)
    }

    fun toggleMute() {
        isMuted = !isMuted
        audioManager.adjustStreamVolume(
            AudioManager.STREAM_MUSIC,
            if (isMuted) AudioManager.ADJUST_MUTE else AudioManager.ADJUST_UNMUTE,
            AudioManager.FLAG_SHOW_UI
        )
    }

    val appList = remember {
        mutableStateListOf<AppVolumeConfig>().apply {
            addAll(
                listOf(
                    AppVolumeConfig("Spotify", "Music", "inherit", 0f, 0f, 70, false, true, true),
                    AppVolumeConfig("YouTube", "Video", "relative", -15f, 0f, 55, false, true, true),
                    AppVolumeConfig("PUBG Mobile", "Game", "absolute", 0f, 40f, 40, false, true, true),
                    AppVolumeConfig("Chat Messenger", "Notification", "always-mute", 0f, 0f, 0, true, true, false)
                )
            )
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Volume Mixer", fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF6750A4),
                    titleContentColor = Color.White
                )
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Master Controls Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFF7F2FA))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        "Master System Volume",
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 16.sp,
                        color = Color(0xFF6750A4)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = if (isMuted) "MUTED" else "${masterVolume.toInt()}%",
                            modifier = Modifier.width(64.dp),
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                        Slider(
                            value = masterVolume,
                            onValueChange = { updateVolume(it) },
                            valueRange = 0f..100f,
                            modifier = Modifier.weight(1f),
                            enabled = !isMuted
                        )
                        Button(
                            onClick = { toggleMute() },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isMuted) Color.Red else Color(0xFF6750A4)
                            )
                        ) {
                            Text(if (isMuted) "Unmute" else "Mute")
                        }
                    }
                }
            }

            // Quick Floating Launcher Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFEADDFF))
            ) {
                Row(
                    modifier = Modifier.padding(16.dp).fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Floating Mixer HUD", fontWeight = FontWeight.Bold)
                        Text("Control per-app volume over other apps.", fontSize = 11.sp, color = Color.Gray)
                    }
                    Button(onClick = onLaunchOverlay) {
                        Text("Trigger HUD")
                    }
                }
            }

            Text("Active App Mixer", fontWeight = FontWeight.Bold, fontSize = 14.sp)

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.weight(1f)
            ) {
                items(appList) { app ->
                    AppVolumeRuleRow(app, masterVolume, onUpdate = {})
                }
            }
        }
    }
}

data class AppVolumeConfig(
    val name: String,
    val category: String,
    val rule: String,
    val relativeValue: Float,
    val absoluteValue: Float,
    var userVolume: Int,
    var isMuted: Boolean,
    var isActive: Boolean,
    var isPlaying: Boolean
)

@Composable
fun AppVolumeRuleRow(app: AppVolumeConfig, masterVol: Float, onUpdate: () -> Unit) {
    var volume by remember { mutableStateOf(app.userVolume.toFloat()) }
    var muted by remember { mutableStateOf(app.isMuted) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = CardDefaults.outlinedCardBorder()
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(app.name, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    Text("Rule: ${app.rule.uppercase()}", fontSize = 10.sp, color = Color(0xFF6750A4), fontFamily = FontFamily.Monospace)
                }
                Switch(
                    checked = !muted,
                    onCheckedChange = { muted = !it; app.isMuted = muted; onUpdate() }
                )
            }
            if (!muted) {
                Slider(
                    value = volume,
                    onValueChange = { volume = it; app.userVolume = it.toInt(); onUpdate() },
                    valueRange = 0f..100f
                )
            }
        }
    }
}
