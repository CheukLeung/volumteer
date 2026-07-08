/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Sliders, Volume2, Info, RefreshCw, Smartphone, Sparkles, 
  Settings, BookOpen, Terminal, ArrowUpRight, HelpCircle
} from 'lucide-react';
import { AppConfig, SystemState } from './types';
import { INITIAL_APPS, calculateAppVolume } from './utils';
import { audioEngine } from './audioEngine';
import { AndroidPhone } from './components/AndroidPhone';
import { AndroidCodeExporter } from './components/AndroidCodeExporter';

export default function App() {
  const [masterVolume, setMasterVolume] = useState(70);
  const [isMasterMuted, setIsMasterMuted] = useState(false);
  const [preMuteSnapshot, setPreMuteSnapshot] = useState<Record<string, boolean>>({});
  const [apps, setApps] = useState<AppConfig[]>(INITIAL_APPS);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [logs, setLogs] = useState<{ id: string; text: string; time: string }[]>([]);

  // Push helper logs
  const addLog = (text: string) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    setLogs(prev => [{ id: Math.random().toString(), text, time: timeStr }, ...prev.slice(0, 15)]);
  };

  // Add initial log
  useEffect(() => {
    addLog("📱 Android 17 Audio System Simulator ready");
    addLog("💡 Tip: Click 'Unlock & Start Sound Engine' on the phone screen to enable audio output");
  }, []);

  // Web Audio connection initializer
  const handleInitializeAudio = () => {
    if (!audioInitialized) {
      audioEngine.start();
      setAudioInitialized(true);
      addLog("🔊 Android Audio HAL initialized successfully");
      addLog("⚡ Web Audio API synthesis context created");
      
      // Sync volume with hardware
      audioEngine.updateVolumes(apps, masterVolume, isMasterMuted);
    }
  };

  // Handle master volume changes
  const handleMasterVolumeChange = (newVol: number) => {
    setMasterVolume(newVol);
    addLog(`🔊 System Master Volume set to ${newVol}%`);

    const updatedApps = apps.map(app => {
      // Recalculate app target volume based on its rule
      const calc = calculateAppVolume(app.rule, newVol, app.relativeValue, app.absoluteValue);
      
      if (app.isActive) {
        if (app.rule === 'inherit') {
          addLog(`  ↳ ${app.name}: Inheriting master -> ${calc.volume}%`);
        } else if (app.rule === 'relative') {
          addLog(`  ↳ ${app.name}: Relative offset (${app.relativeValue >= 0 ? '+' : ''}${app.relativeValue}%) -> ${calc.volume}%`);
        } else if (app.rule === 'absolute') {
          addLog(`  ↳ ${app.name}: Absolute lock -> ${calc.volume}%`);
        } else if (app.rule === 'always-mute') {
          addLog(`  ↳ ${app.name}: Always-mute rule remains active -> 0%`);
        }
      }

      return {
        ...app,
        userVolume: calc.volume,
        isMuted: app.rule === 'always-mute' ? true : app.isMuted
      };
    });

    setApps(updatedApps);
    audioEngine.updateVolumes(updatedApps, newVol, isMasterMuted);
  };

  // Handle master mute toggle (Snapshots and undoes muting)
  const handleToggleMasterMute = () => {
    const newMuteState = !isMasterMuted;
    setIsMasterMuted(newMuteState);

    if (newMuteState) {
      // Save current individual app mutes
      const snapshot: Record<string, boolean> = {};
      apps.forEach(app => {
        snapshot[app.id] = app.isMuted;
      });
      setPreMuteSnapshot(snapshot);
      addLog("🔇 System Master Muted (Snapshot of app mutes saved)");

      audioEngine.updateVolumes(apps, masterVolume, true);
    } else {
      // Restore pre-mute state (undo muting)
      addLog("🔊 System Master Unmuted (Restoring prior per-app states)");
      
      const restoredApps = apps.map(app => {
        const wasMuted = preMuteSnapshot[app.id] ?? app.isMuted;
        if (wasMuted !== app.isMuted) {
          addLog(`  ↳ ${app.name}: Restored to ${wasMuted ? 'Muted' : 'Unmuted'}`);
        }
        return {
          ...app,
          isMuted: wasMuted
        };
      });

      setApps(restoredApps);
      audioEngine.updateVolumes(restoredApps, masterVolume, false);
    }
  };

  // Handle granular individual volume slide
  const handleAppVolumeChange = (id: string, newVol: number) => {
    const updatedApps = apps.map(app => {
      if (app.id === id) {
        addLog(`🎚️ Per-App mixer: ${app.name} set to ${newVol}%`);
        
        let relativeValue = app.relativeValue;
        let absoluteValue = app.absoluteValue;

        if (app.rule === 'relative') {
          relativeValue = newVol - masterVolume;
          addLog(`  ↳ Auto-realigned relative offset to ${relativeValue >= 0 ? '+' : ''}${relativeValue}%`);
        } else if (app.rule === 'absolute') {
          absoluteValue = newVol;
          addLog(`  ↳ Auto-realigned absolute value to ${absoluteValue}%`);
        }

        return {
          ...app,
          userVolume: newVol,
          relativeValue,
          absoluteValue
        };
      }
      return app;
    });

    setApps(updatedApps);
    audioEngine.updateVolumes(updatedApps, masterVolume, isMasterMuted);
  };

  // Handle individual app mute toggle
  const handleToggleAppMute = (id: string) => {
    const updatedApps = apps.map(app => {
      if (app.id === id) {
        const newMute = !app.isMuted;
        addLog(`${newMute ? '🔇' : '🔊'} App Mute: ${app.name} set to ${newMute ? 'Muted' : 'Unmuted'} (without pausing background playback)`);
        return {
          ...app,
          isMuted: newMute
        };
      }
      return app;
    });

    setApps(updatedApps);
    audioEngine.updateVolumes(updatedApps, masterVolume, isMasterMuted);
  };

  // Handle rules configuration from settings
  const handleUpdateAppConfig = (updatedApp: AppConfig) => {
    const updatedApps = apps.map(app => (app.id === updatedApp.id ? updatedApp : app));
    setApps(updatedApps);
    addLog(`⚙️ Startup rule modified for ${updatedApp.name} -> rule: ${updatedApp.rule}`);
    audioEngine.updateVolumes(updatedApps, masterVolume, isMasterMuted);
  };

  // Handle active playback simulation
  const handleToggleAppPlayback = (id: string) => {
    const updatedApps = apps.map(app => {
      if (app.id === id) {
        const newPlaying = !app.isPlaying;
        const newActive = newPlaying ? true : app.isActive;

        addLog(`${newPlaying ? '▶️' : '⏸️'} App background playback: ${app.name} set to ${newPlaying ? 'PLAYING' : 'STOPPED'}`);
        
        let userVolume = app.userVolume;
        let isMuted = app.isMuted;
        
        if (newPlaying) {
          const calc = calculateAppVolume(app.rule, masterVolume, app.relativeValue, app.absoluteValue);
          userVolume = calc.volume;
          isMuted = calc.isMuted;
          addLog(`  ↳ Applying Startup Rules: "${app.rule}" -> Vol: ${userVolume}% (Muted: ${isMuted})`);
        }

        return {
          ...app,
          isPlaying: newPlaying,
          isActive: newActive,
          userVolume,
          isMuted
        };
      }
      return app;
    });

    setApps(updatedApps);
    audioEngine.updateVolumes(updatedApps, masterVolume, isMasterMuted);
  };

  // Trigger test ringtone alert
  const handleTriggerNotification = () => {
    audioEngine.playChatNotification();
    addLog("🔔 Triggered Chat Messenger notification alert sound");
  };

  // Quick reset helper
  const handleResetSimulator = () => {
    setMasterVolume(70);
    setIsMasterMuted(false);
    setPreMuteSnapshot({});
    const resetApps = INITIAL_APPS.map(app => ({
      ...app,
      userVolume: calculateAppVolume(app.rule, 70, app.relativeValue, app.absoluteValue).volume,
      isMuted: app.rule === 'always-mute'
    }));
    setApps(resetApps);
    addLog("🔄 Reset simulator to factory defaults");
    if (audioInitialized) {
      audioEngine.updateVolumes(resetApps, 70, false);
    }
  };

  return (
    <div id="app-root" className="min-h-screen bg-[#F8F9FF] text-[#1C1B1F] flex flex-col antialiased font-sans">
      
      {/* Dynamic Header */}
      <header className="border-b border-[#EADDFF]/50 bg-white/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#6750A4]/10 rounded-2xl text-[#6750A4] shadow-sm flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h1 className="text-lg font-semibold tracking-tight text-[#1C1B1F] flex items-center gap-2">
                Android 17 Volume Mixer
                <span className="text-[10px] bg-[#6750A4]/10 text-[#6750A4] px-2 py-0.5 rounded-full font-mono font-medium">
                  v17 Beta
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 font-mono">Simultaneous Multi-Track Audio Controller</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="reset-sim-btn"
              onClick={handleResetSimulator}
              className="px-4 py-2 bg-[#6750A4]/5 hover:bg-[#6750A4]/10 text-[#6750A4] active:scale-95 text-xs font-semibold rounded-xl transition flex items-center gap-2 border border-[#6750A4]/10 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Sandbox
            </button>
            <span className="text-xs bg-white border border-[#EADDFF]/40 px-3 py-2 rounded-xl text-slate-500 font-mono">
              Local Time: 10:17 AM
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Android 17 Phone Simulator Container (Col-5) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col items-center">
          <div className="bg-white/90 border border-[#EADDFF]/30 p-6 rounded-[56px] shadow-[0_16px_48px_-16px_rgba(103,80,164,0.08)] w-full max-w-[400px] backdrop-blur-sm">
            <AndroidPhone
              apps={apps}
              masterVolume={masterVolume}
              isMasterMuted={isMasterMuted}
              onMasterVolumeChange={handleMasterVolumeChange}
              onToggleMasterMute={handleToggleMasterMute}
              onAppVolumeChange={handleAppVolumeChange}
              onToggleAppMute={handleToggleAppMute}
              onUpdateAppConfig={handleUpdateAppConfig}
              onToggleAppPlayback={handleToggleAppPlayback}
              onTriggerNotification={handleTriggerNotification}
              onInitializeAudio={handleInitializeAudio}
              audioInitialized={audioInitialized}
            />
          </div>
        </div>

        {/* Right Side: Information Panel, Interactive Guides, and HAL Logs (Col-7) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          
          {/* Audio Engine Permissions Banner */}
          {!audioInitialized && (
            <div className="bg-[#6750A4]/5 border border-[#6750A4]/10 rounded-3xl p-5 flex items-start gap-4 text-left shadow-sm">
              <div className="p-3 bg-[#6750A4]/10 text-[#6750A4] rounded-2xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h4 className="font-semibold text-[#1C1B1F] text-sm">Action Required: Initialize Audio Simulator</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Browser security protocols block dynamic audio playback until you perform a direct gesture. Click the **Unlock & Start Sound Engine** button on the phone lock screen to activate beautiful synth ambient, beats, and game effects that demonstrate per-app muting and relative sliders in real-time.
                </p>
              </div>
            </div>
          )}

          {/* Core Simulator Controls Quick Drawer (Convenience shortcuts) */}
          <div className="bg-white border border-[#EADDFF]/30 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.01)] space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <HelpCircle className="w-5 h-5 text-[#6750A4]" />
              <h3 className="font-semibold text-[#1C1B1F] text-sm">Interactive Sandbox Shortcuts</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              <button
                id="sh-vol-up"
                onClick={() => {
                  handleMasterVolumeChange(Math.min(100, masterVolume + 5));
                  addLog("Shortcut: Master Volume +5%");
                }}
                className="p-3.5 bg-[#FDF7FF] hover:bg-[#EADDFF]/20 border border-[#EADDFF]/50 rounded-2xl text-xs font-medium text-slate-800 transition active:scale-95 cursor-pointer"
              >
                🔊 Hardware Vol +
              </button>
              <button
                id="sh-vol-down"
                onClick={() => {
                  handleMasterVolumeChange(Math.max(0, masterVolume - 5));
                  addLog("Shortcut: Master Volume -5%");
                }}
                className="p-3.5 bg-[#FDF7FF] hover:bg-[#EADDFF]/20 border border-[#EADDFF]/50 rounded-2xl text-xs font-medium text-slate-800 transition active:scale-95 cursor-pointer"
              >
                🔉 Hardware Vol -
              </button>
              <button
                id="sh-trigger-alert"
                onClick={handleTriggerNotification}
                className="p-3.5 bg-[#FDF7FF] hover:bg-[#EADDFF]/20 border border-[#EADDFF]/50 rounded-2xl text-xs font-medium text-slate-800 transition active:scale-95 cursor-pointer"
              >
                🔔 Test Chat Notification
              </button>
              <button
                id="sh-toggle-mute"
                onClick={handleToggleMasterMute}
                className={`p-3.5 border rounded-2xl text-xs font-medium transition active:scale-95 cursor-pointer ${
                  isMasterMuted 
                    ? 'bg-rose-50 border-rose-200 text-rose-700' 
                    : 'bg-[#FDF7FF] hover:bg-[#EADDFF]/20 border-[#EADDFF]/50 text-slate-800'
                }`}
              >
                🔇 Toggle Master Mute
              </button>
            </div>
          </div>

          {/* Android Studio Native Project Exporter */}
          <AndroidCodeExporter />

          {/* Android 17 Audio HAL Terminal Logs (Simulating OS Intents) */}
          <div className="bg-[#131217] text-slate-200 rounded-3xl p-5 border border-[#EADDFF]/20 shadow-lg space-y-3">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
              <div className="flex items-center gap-2 text-xs font-mono font-medium text-slate-400">
                <Terminal className="w-4 h-4 text-[#D0BCFF]" />
                SYSTEM AUDIOMANAGER SERVICE LOGS (INTENT_REVERBERATOR)
              </div>
              <span className="text-[10px] bg-slate-900/60 border border-slate-800 px-2 py-0.5 rounded font-mono text-slate-500">
                Listening...
              </span>
            </div>

            <div className="h-44 overflow-y-auto font-mono text-[11px] space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 text-left leading-normal">
                  <span className="text-slate-600 shrink-0 select-none">[{log.time}]</span>
                  <span className={
                    log.text.includes('Master Volume') || log.text.includes('Master Muted') || log.text.includes('Unmuted')
                      ? 'text-[#D0BCFF] font-medium' 
                      : log.text.startsWith('  ↳') 
                        ? 'text-slate-400 pl-3' 
                        : 'text-slate-300'
                  }>
                    {log.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Architectural System Explainer */}
          <div className="bg-white border border-[#EADDFF]/30 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.01)] text-left">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <BookOpen className="w-5 h-5 text-[#6750A4]" />
              <h3 className="font-semibold text-[#1C1B1F] text-sm">Simultaneous Audio Routing: How It Works</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 leading-relaxed">
              <div className="space-y-3">
                <p>
                  <strong className="text-slate-800">1. Individual App Audio Nodes:</strong><br />
                  In Android 17, background apps running simultaneously maintain their active audio pipelines without pausing. Instead of a single system hardware channel, each app is assigned a dedicated <code className="bg-slate-100 text-slate-850 px-1 py-0.5 rounded font-mono text-[10px]">AudioTrackGainNode</code> connected to the Master routing output.
                </p>
                <p>
                  <strong className="text-slate-800">2. The 1x1 vs 2x1 Quick Settings Tile:</strong><br />
                  The Quick Settings tile supports adaptive sizes. The <strong className="text-slate-800">1x1 tile</strong> offers a toggle that mutes all apps immediately but preserves individual pre-mute configurations. The <strong className="text-slate-800">2x1 tile</strong> embeds a dynamic master slider to shift the system volume ceiling proportionally.
                </p>
              </div>

              <div className="space-y-3">
                <p>
                  <strong className="text-slate-800">3. Master Relative Scaling:</strong><br />
                  When the Master Volume shifts, the active apps recalculate their resulting gains. Apps using the <strong className="text-slate-800">Relative Offset rule</strong> scale symmetrically (e.g. -20% below master), while <strong className="text-slate-800">Absolute Lock</strong> apps remain constant unless master volume reaches zero.
                </p>
                <p>
                  <strong className="text-slate-800">4. Granular Mixer Overlay:</strong><br />
                  Holding the Quick Tile or clicking the mixer button on the standard slider overlay triggers a system-wide advanced overlay, showing all active audio-generating apps side-by-side with instant mute capabilities.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-[#EADDFF]/40 bg-white py-6 mt-12 text-center text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto px-6">
          Android 17 Per-App Audio Management Interface Simulator • Built with React & Web Audio API
        </div>
      </footer>

    </div>
  );
}
