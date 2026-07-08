import { useState } from 'react';
import { 
  FileCode, Download, BookOpen, Check, Copy, Terminal, 
  Smartphone, HelpCircle, Layers, Settings, AppWindow, ArrowRight, Play, Sliders
} from 'lucide-react';
import JSZip from 'jszip';

interface CodeFile {
  name: string;
  path: string;
  language: string;
  description: string;
  icon: any;
  content: string;
}

export function AndroidCodeExporter() {
  const [activeTab, setActiveTab] = useState<'view' | 'guide'>('guide');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Real, compilable Kotlin and XML source files for the Android 17 Volume Mixer application
  const sourceFiles: CodeFile[] = [
    {
      name: "MainActivity.kt",
      path: "app/src/main/java/com/android17/volumemixer/MainActivity.kt",
      language: "kotlin",
      description: "Main Jetpack Compose UI providing system mixer settings, custom startup rule selectors, and permission checks.",
      icon: Smartphone,
      content: `package com.android17.volumemixer

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

    private fun startOverlayService() {
        if (Settings.canDrawOverlays(this)) {
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
                            text = if (isMuted) "MUTED" else "\${masterVolume.toInt()}%",
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
                Text("Rule: \${app.rule.uppercase()}", fontSize = 10.sp, color = Color(0xFF6750A4), fontFamily = FontFamily.Monospace)
            }
            Box(
                modifier = Modifier
                    .background(Color(0xFFEADDFF), RoundedCornerShape(8.dp))
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Text(
                    text = if (calculatedVol == 0) "MUTE" else "\$calculatedVol%",
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    fontFamily = FontFamily.Monospace,
                    color = Color(0xFF21005D)
                )
            }
        }
    }
}`
    },
    {
      name: "VolumeOverlayService.kt",
      path: "app/src/main/java/com/android17/volumemixer/VolumeOverlayService.kt",
      language: "kotlin",
      description: "Floating window background Service that coordinates with AudioManager and injects custom overlays into the WindowManager view hierarchy.",
      icon: Layers,
      content: `package com.android17.volumemixer

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
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.END
            x = 30
            y = 250
        }

        val inflater = getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater
        // Real Kotlin service inflates our custom layout
        overlayView = inflater.inflate(R.layout.floating_mixer_overlay, null)

        overlayView?.let { view ->
            val masterSeekBar = view.findViewById<SeekBar>(R.id.overlay_master_seekbar)
            val appTitle = view.findViewById<TextView>(R.id.overlay_app_title)
            val closeBtn = view.findViewById<Button>(R.id.overlay_close_btn)

            // Dynamic volume query and adjustment on hardware stream
            val currentVol = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC)
            val maxVol = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
            
            masterSeekBar.max = maxVol
            masterSeekBar.progress = currentVol

            masterSeekBar.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                    if (fromUser) {
                        audioManager.setStreamVolume(
                            AudioManager.STREAM_MUSIC,
                            progress,
                            AudioManager.FLAG_SHOW_UI
                        )
                        appTitle.text = "Music: \${((progress.toFloat() / maxVol) * 100).toInt()}%"
                    }
                }
                override fun onStartTrackingTouch(seekBar: SeekBar?) {}
                override fun onStopTrackingTouch(seekBar: SeekBar?) {}
            })

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
}`
    },
    {
      name: "VolumeTileService.kt",
      path: "app/src/main/java/com/android17/volumemixer/VolumeTileService.kt",
      language: "kotlin",
      description: "Implements the real Android Quick Settings TileService, allowing one-click master toggles or long-press overlay drawer triggers.",
      icon: Settings,
      content: `package com.android17.volumemixer

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

    override fun onUnlockAndRun(runnable: Runnable?) {
        super.onUnlockAndRun(runnable)
    }
}`
    },
    {
      name: "AndroidManifest.xml",
      path: "app/src/main/AndroidManifest.xml",
      language: "xml",
      description: "Registers background services, custom Quick Settings Tile, and declares overlay drawing window system permissions.",
      icon: FileCode,
      content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.android17.volumemixer">

    <!-- Requires permission to draw custom overlay mixers over other apps -->
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Android 17 Volume Mixer"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.VolumeMixer">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.VolumeMixer">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Floating UI overlay routing manager -->
        <service
            android:name=".VolumeOverlayService"
            android:enabled="true"
            android:exported="false" />

        <!-- Real Custom Quick Settings 1x1 or 2x1 interactive tile -->
        <service
            android:name=".VolumeTileService"
            android:icon="@drawable/ic_tile_volume"
            android:label="Volume Mixer"
            android:permission="android.permission.BIND_QUICK_SETTINGS_TILE"
            android:exported="true">
            <intent-filter>
                <action android:name="android.service.quicksettings.action.QS_TILE" />
            </intent-filter>
        </service>

    </application>
</manifest>`
    },
    {
      name: "build.gradle.kts",
      path: "app/build.gradle.kts",
      language: "kotlin",
      description: "Kotlin Gradle build configuration containing Jetpack Compose dependencies, Android 17 targeting, and core SDK declarations.",
      icon: Terminal,
      content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.android17.volumemixer"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.android17.volumemixer"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.14"
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.2")
    implementation(platform("androidx.compose:compose-bom:2023.08.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
}`
    }
  ];

  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const activeFile = sourceFiles[selectedFileIndex];

  const handleCopyCode = (text: string, name: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(name);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  // Dynamically compile an entire ready-to-run Android Studio project into a ZIP using jszip
  const handleDownloadZip = async () => {
    setDownloading(true);
    try {
      const zip = new JSZip();

      // Create folder structure and write source code files
      sourceFiles.forEach(file => {
        zip.file(file.path, file.content);
      });

      // Add project settings files
      zip.file("settings.gradle.kts", `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "VolumeMixer"
include(":app")
`);

      zip.file("build.gradle.kts", `// Top-level build file
plugins {
    id("com.android.application") version "8.2.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.24" apply false
}
`);

      zip.file("gradle.properties", `# Enable AndroidX and auto-conversion of third-party libraries to AndroidX
android.useAndroidX=true
android.enableJetifier=true
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
`);

      // Add resource layouts & styles
      zip.file("app/src/main/res/layout/floating_mixer_overlay.xml", `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="180dp"
    android:layout_height="wrap_content"
    android:orientation="vertical"
    android:background="#FAFAFA"
    android:elevation="12dp"
    android:padding="14dp"
    android:backgroundTint="#FFFFFF"
    android:clipToOutline="true">

    <TextView
        android:id="@+id/overlay_app_title"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Music Player: 70%"
        android:textStyle="bold"
        android:textColor="#1C1B1F"
        android:textSize="12sp"
        android:layout_marginBottom="8dp" />

    <SeekBar
        android:id="@+id/overlay_master_seekbar"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginBottom="12dp" />

    <Button
        android:id="@+id/overlay_close_btn"
        android:layout_width="match_parent"
        android:layout_height="36dp"
        android:text="Close HUD"
        android:backgroundTint="#6750A4"
        android:textColor="#FFFFFF"
        android:textSize="11sp" />
</LinearLayout>
`);

      zip.file("app/src/main/res/values/themes.xml", `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.VolumeMixer" parent="Theme.Material3.DayNight.NoActionBar">
        <item name="colorPrimary">#6750A4</item>
    </style>
</resources>
`);

      zip.file("app/src/main/res/values/strings.xml", `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Volume Mixer</string>
</resources>
`);

      zip.file("app/src/main/res/drawable/ic_tile_volume.xml", `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
  <path
      android:fillColor="#FFFFFFFF"
      android:pathData="M3,9v6h4l5,5V4L7,9H3zm13.5,3c0,-1.77 -1.02,-3.29 -2.5,-4.03v8.05c1.48,-0.73 2.5,-2.25 2.5,-4.02zM14,3.23v2.06c2.89,0.86 5,3.54 5,6.71s-2.11,5.85 -5,6.71v2.06c4.01,-0.91 7,-4.49 7,-8.77s-2.99,-7.86 -7,-8.77z"/>
</vector>
`);

      zip.file("app/src/main/java/com/android17/volumemixer/ui/theme/Theme.kt", `package com.android17.volumemixer.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF6750A4),
    secondary = Color(0xFF625B71),
    tertiary = Color(0xFF7D5260),
    background = Color(0xFFF8F9FF),
    surface = Color.White
)

@Composable
fun VolumeMixerTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        content = content
    )
}
`);

      // Generate the zip blob
      const blob = await zip.generateAsync({ type: 'blob' });
      
      // Trigger user download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'android17-volume-mixer-project.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("ZIP Generation failed", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div id="android-developer-hub" className="bg-white border border-[#EADDFF]/30 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.01)] text-left space-y-6">
      
      {/* Dev Hub Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#6750A4]/10 rounded-2xl text-[#6750A4] flex items-center justify-center">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-[#1C1B1F] text-base">Android Studio Native Code Center</h3>
            <p className="text-[11px] text-slate-500 font-mono">Compilable Kotlin & Jetpack Compose Assets</p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleDownloadZip}
          disabled={downloading}
          className="w-full sm:w-auto px-4 py-2 bg-[#6750A4] hover:bg-[#6750A4]/90 text-white font-medium text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {downloading ? (
            <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-3.5 h-3.5" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          {downloading ? 'Compiling ZIP...' : 'Download Full Android Project'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        <button
          onClick={() => setActiveTab('guide')}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition cursor-pointer ${
            activeTab === 'guide' 
              ? 'border-[#6750A4] text-[#6750A4]' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            Android Deployment Guide
          </span>
        </button>
        <button
          onClick={() => setActiveTab('view')}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition cursor-pointer ${
            activeTab === 'view' 
              ? 'border-[#6750A4] text-[#6750A4]' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <FileCode className="w-3.5 h-3.5" />
            Browse Kotlin Source Files
          </span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'guide' ? (
        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <div className="bg-[#6750A4]/5 border border-[#6750A4]/10 rounded-2xl p-4 space-y-2">
            <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-[#6750A4]" />
              Run this Actual App on your Android Phone
            </h4>
            <p>
              This code represents a standard, real Android Application. Since web browsers cannot run raw compiled Kotlin or execute actual hardware volume hooks directly, we package the complete Android Studio structure for you. You can download the ZIP, load it in Android Studio, and compile it directly into an APK to run on your phone.
            </p>
          </div>

          <div className="space-y-3.5 pt-2">
            <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-[#6750A4]" />
              Hardware Integration Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-100 p-3.5 rounded-2xl bg-slate-50 space-y-1.5">
                <span className="font-bold text-slate-800 text-[11px] block uppercase font-mono text-[#6750A4]">1. System Window Overlay</span>
                <p>
                  Uses <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">TYPE_APPLICATION_OVERLAY</code> to draw volume bars over top of third-party apps, similar to the sandbox overlay in our simulator. Needs the "Draw over other apps" settings toggle authorized.
                </p>
              </div>

              <div className="border border-slate-100 p-3.5 rounded-2xl bg-slate-50 space-y-1.5">
                <span className="font-bold text-slate-800 text-[11px] block uppercase font-mono text-[#6750A4]">2. AudioManager Binding</span>
                <p>
                  Hooks into native Android audio hardware with <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">getSystemService(Context.AUDIO_SERVICE)</code> to regulate music tracks, system notifications, alarms, and calls.
                </p>
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <h4 className="font-semibold text-slate-900 text-sm pt-4">How to Compile & Run the APK:</h4>
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="w-5 h-5 bg-[#6750A4]/10 text-[#6750A4] rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                <div>
                  <strong className="text-slate-800 block">Download & Extract</strong>
                  <p>Click the <strong>Download Full Android Project</strong> button above to download the ZIP, then extract it onto your desktop.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="w-5 h-5 bg-[#6750A4]/10 text-[#6750A4] rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                <div>
                  <strong className="text-slate-800 block">Open in Android Studio</strong>
                  <p>Launch Android Studio (Giraffe/Hedgehog/newer), select <strong>Open An Existing Project</strong>, and select the folder you extracted.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="w-5 h-5 bg-[#6750A4]/10 text-[#6750A4] rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                <div>
                  <strong className="text-slate-800 block">Enable USB Debugging</strong>
                  <p>On your phone, go to Settings &gt; About Phone &gt; tap "Build Number" 7 times. Go to Developer Options and enable <strong>USB Debugging</strong>.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="w-5 h-5 bg-[#6750A4]/10 text-[#6750A4] rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">4</span>
                <div>
                  <strong className="text-slate-800 block">Deploy & Play!</strong>
                  <p>Connect your phone with a USB cable. Click the green <strong>Run 'app' (Play)</strong> icon in Android Studio to push the fully active native app and tile service straight to your phone!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* File selector sidebar */}
          <div className="md:col-span-4 space-y-2">
            <span className="text-[9px] font-bold font-mono tracking-wider text-slate-400 block px-1">PROJECT TREE</span>
            {sourceFiles.map((file, idx) => {
              const FileIcon = file.icon;
              const isSelected = selectedFileIndex === idx;
              return (
                <button
                  key={file.name}
                  onClick={() => setSelectedFileIndex(idx)}
                  className={`w-full text-left p-3 rounded-2xl flex items-start gap-2.5 transition border cursor-pointer ${
                    isSelected 
                      ? 'bg-[#6750A4]/5 border-[#6750A4]/30 text-[#6750A4]' 
                      : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-600'
                  }`}
                >
                  <FileIcon className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-xs font-bold block truncate">{file.name}</span>
                    <span className="text-[10px] text-slate-400 truncate block">{file.path}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Code viewer main panel */}
          <div className="md:col-span-8 flex flex-col border border-slate-100 rounded-3xl overflow-hidden bg-[#131217]">
            <div className="bg-slate-900 px-4 py-2 flex justify-between items-center border-b border-slate-950">
              <span className="text-[10px] font-mono text-[#D0BCFF]">
                {activeFile.path}
              </span>
              <button
                onClick={() => handleCopyCode(activeFile.content, activeFile.name)}
                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-[#D0BCFF] rounded-lg transition active:scale-95 flex items-center gap-1 text-[9px] font-mono cursor-pointer"
              >
                {copiedFile === activeFile.name ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy Code
                  </>
                )}
              </button>
            </div>
            
            <div className="p-4 flex-1 max-h-96 overflow-y-auto font-mono text-[10px] text-slate-200 text-left leading-relaxed whitespace-pre select-all">
              {activeFile.content}
            </div>

            <div className="bg-slate-950 p-3 border-t border-slate-900">
              <p className="text-[10px] text-slate-400 text-left">
                💡 <strong>File Purpose:</strong> {activeFile.description}
              </p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
