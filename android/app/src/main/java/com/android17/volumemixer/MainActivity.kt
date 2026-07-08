package com.android17.volumemixer

import android.content.Intent
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
    var masterVolume by remember { mutableStateOf(70f) }
    var isMuted by remember { mutableStateOf(false) }

    val appList = remember {
        listOf(
            AppVolumeConfig("Spotify", "Music", "inherit", 0f, 0f),
            AppVolumeConfig("YouTube", "Video", "relative", -15f, 0f),
            AppVolumeConfig("PUBG Mobile", "Game", "absolute", 0f, 40f),
            AppVolumeConfig("Chat Messenger", "Notification", "always-mute", 0f, 0f)
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Android 17 Volume Mixer", fontWeight = FontWeight.Bold) },
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
                            onValueChange = { masterVolume = it },
                            valueRange = 0f..100f,
                            modifier = Modifier.weight(1f),
                            enabled = !isMuted
                        )
                        Button(
                            onClick = { isMuted = !isMuted },
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
                        Text("Interactive Floating HUD", fontWeight = FontWeight.Bold)
                        Text("Float the mixer sliders over other background apps.", fontSize = 11.sp, color = Color.Gray)
                    }
                    Button(onClick = onLaunchOverlay) {
                        Text("Trigger HUD")
                    }
                }
            }

            Text("Configured Per-App Startup Rules", fontWeight = FontWeight.Bold, fontSize = 14.sp)

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.weight(1f)
            ) {
                items(appList) { app ->
                    AppVolumeRuleRow(app, masterVolume)
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
    val absoluteValue: Float
)

@Composable
fun AppVolumeRuleRow(app: AppVolumeConfig, masterVol: Float) {
    val calculatedVol = when (app.rule) {
        "inherit" -> masterVol.toInt()
        "relative" -> (masterVol + app.relativeValue).coerceIn(0f, 100f).toInt()
        "absolute" -> app.absoluteValue.toInt()
        "always-mute" -> 0
        else -> masterVol.toInt()
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = CardDefaults.outlinedCardBorder()
    ) {
        Row(
            modifier = Modifier.padding(12.dp).fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(app.name, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                Text("Rule: ${app.rule.uppercase()}", fontSize = 10.sp, color = Color(0xFF6750A4), fontFamily = FontFamily.Monospace)
            }
            Box(
                modifier = Modifier
                    .background(Color(0xFFEADDFF), RoundedCornerShape(8.dp))
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Text(
                    text = if (calculatedVol == 0) "MUTE" else "$calculatedVol%",
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    fontFamily = FontFamily.Monospace,
                    color = Color(0xFF21005D)
                )
            }
        }
    }
}
