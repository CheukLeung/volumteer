/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wifi, Battery, ShieldAlert, Sun, Moon, Volume2, VolumeX, Sliders, Settings, 
  Play, Pause, Bell, MessageSquare, Gamepad2, Youtube, Music, Compass, Lock, Unlock, PhoneCall
} from 'lucide-react';
import { AppConfig, StartupRule } from '../types';
import { AppIcon, NormalVolumeOverlay, DetailedMixerOverlay } from './VolumeOverlays';
import { QuickSettings } from './QuickSettings';
import { FullSettingsApp } from './FullSettingsApp';
import { calculateAppVolume } from '../utils';

interface AndroidPhoneProps {
  apps: AppConfig[];
  masterVolume: number;
  isMasterMuted: boolean;
  onMasterVolumeChange: (vol: number) => void;
  onToggleMasterMute: () => void;
  onAppVolumeChange: (id: string, vol: number) => void;
  onToggleAppMute: (id: string) => void;
  onUpdateAppConfig: (updatedApp: AppConfig) => void;
  onToggleAppPlayback: (id: string) => void;
  onTriggerNotification: () => void;
  onInitializeAudio: () => void;
  audioInitialized: boolean;
}

export const AndroidPhone: React.FC<AndroidPhoneProps> = ({
  apps,
  masterVolume,
  isMasterMuted,
  onMasterVolumeChange,
  onToggleMasterMute,
  onAppVolumeChange,
  onToggleAppMute,
  onUpdateAppConfig,
  onToggleAppPlayback,
  onTriggerNotification,
  onInitializeAudio,
  audioInitialized,
}) => {
  // Views inside the phone: 'lock' | 'home' | 'settings'
  const [currentView, setCurrentView] = useState<'lock' | 'home' | 'settings'>('lock');

  // Drawer and Overlay States
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);
  const [isNormalOverlayVisible, setIsNormalOverlayVisible] = useState(false);
  const [isDetailedMixerOpen, setIsDetailedMixerOpen] = useState(false);
  const [tileSize, setTileSize] = useState<'1x1' | '2x1'>('2x1');

  // Lockscreen power toggle state
  const [isPowerOn, setIsPowerOn] = useState(true);

  // Notification notification banner
  const [notificationActive, setNotificationActive] = useState(false);

  const handlePowerButton = () => {
    if (!isPowerOn) {
      setIsPowerOn(true);
      setCurrentView('lock');
    } else {
      setIsPowerOn(false);
    }
  };

  const handleUnlock = () => {
    onInitializeAudio();
    setCurrentView('home');
  };

  const handlePhysicalVolumeUp = () => {
    if (!isPowerOn) return;
    onMasterVolumeChange(Math.min(100, masterVolume + 5));
    setIsNormalOverlayVisible(true);
  };

  const handlePhysicalVolumeDown = () => {
    if (!isPowerOn) return;
    onMasterVolumeChange(Math.max(0, masterVolume - 5));
    setIsNormalOverlayVisible(true);
  };

  const handleNotificationTrigger = () => {
    onTriggerNotification();
    setNotificationActive(true);
    setTimeout(() => setNotificationActive(false), 3000);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Phone outer bezel and physical buttons container */}
      <div className="relative flex items-center justify-center p-4">
        
        {/* Physical Volume Buttons on Left Side */}
        <div className="absolute left-0 top-[28%] flex flex-col gap-3 z-10">
          {/* Vol Up */}
          <button
            id="physical-vol-up"
            onClick={handlePhysicalVolumeUp}
            className="w-1.5 h-14 bg-slate-800 hover:bg-slate-700 active:scale-x-75 border-y border-r border-slate-700 rounded-l-lg transition cursor-pointer"
            title="Physical Volume Up"
          />
          {/* Vol Down */}
          <button
            id="physical-vol-down"
            onClick={handlePhysicalVolumeDown}
            className="w-1.5 h-14 bg-slate-800 hover:bg-slate-700 active:scale-x-75 border-y border-r border-slate-700 rounded-l-lg transition cursor-pointer"
            title="Physical Volume Down"
          />
        </div>

        {/* Physical Power Button on Right Side */}
        <div className="absolute right-0 top-[35%] z-10">
          <button
            id="physical-power-btn"
            onClick={handlePowerButton}
            className="w-1.5 h-16 bg-slate-800 hover:bg-slate-700 active:scale-x-75 border-y border-l border-slate-700 rounded-r-lg transition cursor-pointer"
            title="Physical Power Button"
          />
        </div>

        {/* Phone Body */}
        <div className="w-[360px] h-[720px] bg-[#1C1B1F] border-[6px] border-[#313033] rounded-[48px] shadow-[0_24px_64px_rgba(103,80,164,0.12)] relative overflow-hidden flex flex-col select-none">
          
          {/* Front Camera Notch */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-black rounded-full z-50 flex items-center justify-center">
            <span className="w-1 h-1 bg-[#6750A4] rounded-full" />
          </div>

          {/* SCREEN CONTENT */}
          <div className="relative flex-1 bg-[#F8F9FF] flex flex-col overflow-hidden">
            
            {/* POWER OFF BLACK SCREEN */}
            {!isPowerOn ? (
              <div 
                id="phone-screen-power-off"
                onClick={handlePowerButton}
                className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center cursor-pointer"
              >
                <div className="text-[10px] text-slate-600 font-mono text-center px-4">
                  SCREEN BLACKED OUT<br />
                  <span className="text-slate-700 text-[9px]">Click Right Power Button or tap screen to wake</span>
                </div>
              </div>
            ) : (
              <>
                {/* STATUS BAR */}
                <div 
                  id="phone-status-bar"
                  onClick={() => currentView !== 'lock' && setIsQuickSettingsOpen(true)}
                  className="absolute top-0 inset-x-0 h-9 px-6 pt-2 flex justify-between items-center z-40 text-xs font-mono font-medium text-slate-700 cursor-pointer hover:bg-slate-100/50 transition"
                >
                  <span>10:17</span>
                  <div className="flex items-center gap-1.5">
                    {/* Active audio indicators */}
                    {apps.some(a => a.isActive && a.isPlaying && !a.isMuted) && !isMasterMuted && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6750A4] animate-ping mr-1" />
                    )}
                    {isMasterMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5 text-[#6750A4]" />}
                    <Wifi className="w-3.5 h-3.5 text-slate-600" />
                    <Battery className="w-4 h-4 text-slate-600" />
                    <span className="text-[10px] text-slate-600">84%</span>
                  </div>
                </div>

                {/* NOTIFICATION BANNER */}
                <AnimatePresence>
                  {notificationActive && (
                    <motion.div
                      initial={{ opacity: 0, y: -50 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -50 }}
                      className="absolute top-11 inset-x-3 z-50 bg-white/95 border border-[#EADDFF] rounded-2xl p-3 shadow-[0_8px_24px_rgba(103,80,164,0.08)] flex items-center gap-3 text-slate-800 backdrop-blur-md"
                    >
                      <div className="p-2 bg-sky-100 text-sky-600 rounded-xl">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-xs font-semibold text-slate-900">ChatPing (Messenger)</div>
                        <div className="text-[10px] text-slate-500 truncate">New simulated message ringtone playing!</div>
                      </div>
                      <span className="text-[9px] text-slate-400 shrink-0 font-mono">now</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* VIEW PORTION */}
                <div className="flex-1 relative flex flex-col">
                  
                  {/* VIEW 1: LOCK SCREEN */}
                  {currentView === 'lock' && (
                    <div 
                      id="view-lock-screen"
                      className="absolute inset-0 bg-gradient-to-tr from-[#FAF9FD] via-[#FDF7FF] to-[#FAF9FD] flex flex-col justify-between p-6 pt-16 text-center"
                    >
                      {/* Big clock */}
                      <div className="mt-8">
                        <h1 className="text-5xl font-light tracking-tight text-slate-800">10:17</h1>
                        <p className="text-xs text-slate-500 font-mono mt-1">Sunday, July 5</p>
                      </div>

                      {/* Tap to Wake Lock Button */}
                      <div className="my-auto flex flex-col items-center">
                        <button
                          id="unlock-btn"
                          onClick={handleUnlock}
                          className="w-16 h-16 bg-[#6750A4] text-white rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(103,80,164,0.2)] hover:bg-[#6750A4]/90 transition active:scale-95 group cursor-pointer"
                        >
                          <Unlock className="w-6 h-6 text-white group-hover:scale-110 transition" />
                        </button>
                        <span className="text-xs text-[#6750A4] font-semibold tracking-wide animate-pulse mt-4">
                          Unlock & Start Sound Engine
                        </span>
                        <p className="text-[10px] text-slate-500 max-w-xs mt-2 italic px-4 leading-normal">
                          Requires user tap to grant browser permission to play multiple synth audio tracks.
                        </p>
                      </div>

                      {/* Bottom Slide Up Indicator */}
                      <div className="pb-4">
                        <div className="w-16 h-1 bg-slate-200 rounded-full mx-auto" />
                        <span className="text-[10px] text-slate-400 font-mono mt-2 block">System Sandbox Simulator</span>
                      </div>
                    </div>
                  )}

                  {/* VIEW 2: HOME SCREEN */}
                  {currentView === 'home' && (
                    <div 
                      id="view-home-screen"
                      className="absolute inset-0 bg-gradient-to-b from-[#F9F8FD] via-white to-[#F5F4FA] p-4 pt-12 flex flex-col justify-between text-[#1C1B1F]"
                    >
                      {/* Top pull down drawer trigger */}
                      <div 
                        id="drawer-pull-down"
                        onClick={() => setIsQuickSettingsOpen(true)}
                        className="mx-auto w-12 h-1.5 bg-slate-300 hover:bg-slate-400 rounded-full cursor-pointer transition mb-2"
                        title="Swipe down for Quick Settings"
                      />

                      {/* Widgets & Live Soundboard */}
                      <div className="space-y-4 flex-1 overflow-y-auto pb-4 pr-0.5">
                        {/* Audio Engine Visualizer Widget */}
                        <div className="bg-white border border-[#EADDFF]/50 rounded-3xl p-3.5 shadow-[0_4px_24px_rgba(103,80,164,0.03)]">
                          <div className="flex justify-between items-center mb-2 px-1">
                            <span className="text-[10px] font-semibold font-mono tracking-wider text-slate-500">
                              LIVE AUDIO MIXBOARD
                            </span>
                            <span className="text-[9px] px-2 py-0.5 bg-[#6750A4]/10 text-[#6750A4] font-semibold font-mono rounded-full border border-[#EADDFF]/40">
                              Android 17
                            </span>
                          </div>

                          {/* Sound controllers */}
                          <div className="space-y-2.5">
                            {apps.map((app) => {
                              // Only show music, video, game, chat on Home screen soundboard
                              if (!['music', 'video', 'game', 'chat'].includes(app.id)) return null;

                              return (
                                <div 
                                  key={app.id}
                                  className="flex items-center justify-between bg-[#FDF7FF] border border-[#EADDFF]/20 p-2.5 rounded-2xl"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={`p-1.5 rounded-lg ${app.color}`}>
                                      <AppIcon name={app.icon} className="w-3.5 h-3.5 text-slate-800" />
                                    </div>
                                    <div className="text-left min-w-0">
                                      <span className="text-[11px] font-semibold truncate block text-slate-800">{app.name}</span>
                                      
                                      {/* Audio status line */}
                                      <span className="text-[9px] font-mono text-slate-500 block">
                                        {app.isPlaying && !app.isMuted && !isMasterMuted ? (
                                          <span className="text-[#6750A4] font-semibold flex items-center gap-1">
                                            <span className="w-1 h-1 rounded-full bg-[#6750A4] animate-ping" />
                                            Level: {app.userVolume}%
                                          </span>
                                        ) : app.isMuted ? (
                                          <span className="text-rose-500">Muted ({app.userVolume}%)</span>
                                        ) : 'Paused/Stopped'}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Play/Pause simulation trigger */}
                                  <button
                                    id={`home-toggle-play-${app.id}`}
                                    onClick={() => onToggleAppPlayback(app.id)}
                                    className={`p-1.5 rounded-xl transition cursor-pointer ${
                                      app.isPlaying 
                                        ? 'bg-[#6750A4]/10 hover:bg-[#6750A4]/20 text-[#6750A4]' 
                                        : 'bg-[#6750A4]/5 text-slate-400 hover:text-slate-600'
                                    }`}
                                    title={app.isPlaying ? "Pause Sound" : "Play Sound"}
                                  >
                                    {app.isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Interactive App Launcher Icons Grid */}
                        <div className="grid grid-cols-4 gap-3 mt-4">
                          
                          {/* Audio Settings App Launcher */}
                          <div 
                            id="launch-settings-icon"
                            onClick={() => setCurrentView('settings')}
                            className="flex flex-col items-center gap-1 bg-white border border-[#EADDFF]/20 hover:bg-[#FDF7FF] p-2.5 rounded-2xl cursor-pointer shadow-[0_4px_12px_rgba(103,80,164,0.02)] transition text-slate-800"
                          >
                            <div className="p-3 bg-[#EADDFF] text-[#6750A4] rounded-2xl">
                              <Settings className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-medium truncate w-full text-center">Settings</span>
                          </div>

                          {/* Quick Message Ring trigger icon */}
                          <div 
                            id="launch-chat-trigger"
                            onClick={handleNotificationTrigger}
                            className="flex flex-col items-center gap-1 bg-white border border-[#EADDFF]/20 hover:bg-[#FDF7FF] p-2.5 rounded-2xl cursor-pointer shadow-[0_4px_12px_rgba(103,80,164,0.02)] transition text-slate-800"
                          >
                            <div className="p-3 bg-sky-100 text-sky-600 rounded-2xl relative">
                              <Bell className="w-5 h-5 animate-bounce" />
                              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                            </div>
                            <span className="text-[10px] font-medium truncate w-full text-center">Test Chat</span>
                          </div>

                          {/* Dummy App Map Launcher */}
                          <div 
                            onClick={() => setCurrentView('settings')}
                            className="flex flex-col items-center gap-1 bg-white border border-[#EADDFF]/20 hover:bg-[#FDF7FF] p-2.5 rounded-2xl cursor-pointer shadow-[0_4px_12px_rgba(103,80,164,0.02)] transition text-slate-800"
                          >
                            <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                              <Compass className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-medium truncate w-full text-center">MapGuide</span>
                          </div>

                          {/* Custom Hold Detailed Overlay shortcut icon */}
                          <div 
                            onClick={() => setIsDetailedMixerOpen(true)}
                            className="flex flex-col items-center gap-1 bg-white border border-[#EADDFF]/20 hover:bg-[#FDF7FF] p-2.5 rounded-2xl cursor-pointer shadow-[0_4px_12px_rgba(103,80,164,0.02)] transition text-slate-800"
                          >
                            <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:text-slate-800">
                              <Sliders className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-medium truncate w-full text-center">Mixer Overlay</span>
                          </div>

                        </div>
                      </div>

                      {/* Navigation bar at the bottom */}
                      <div className="flex justify-around items-center h-11 border-t border-[#EADDFF]/30 bg-white/90 backdrop-blur-md -mx-4 -mb-4 px-4">
                        {/* Android Back Button */}
                        <button
                          onClick={() => setIsQuickSettingsOpen(false)}
                          className="text-slate-400 hover:text-[#6750A4] transition p-1 cursor-pointer"
                        >
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
                          </svg>
                        </button>
                        {/* Android Home Button */}
                        <button
                          onClick={() => {
                            setIsQuickSettingsOpen(false);
                            setIsDetailedMixerOpen(false);
                            setCurrentView('home');
                          }}
                          className="text-slate-400 hover:text-[#6750A4] transition p-1 cursor-pointer"
                        >
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />
                        </button>
                        {/* Android Recent Apps Button */}
                        <button
                          onClick={() => {
                            setCurrentView('settings');
                          }}
                          className="text-slate-400 hover:text-[#6750A4] transition p-1 cursor-pointer"
                        >
                          <div className="w-3.5 h-3.5 border-2 border-current rounded-sm" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* VIEW 3: SETTINGS COMPANION APP */}
                  {currentView === 'settings' && (
                    <div className="absolute inset-0 z-10 pt-4">
                      <FullSettingsApp
                        apps={apps}
                        masterVolume={masterVolume}
                        onUpdateAppConfig={onUpdateAppConfig}
                        onBackToHome={() => setCurrentView('home')}
                        onToggleAppPlayback={onToggleAppPlayback}
                      />
                    </div>
                  )}

                </div>

                {/* OVERLAYS MOUNTED INSIDE PHONE CONTAINER */}

                {/* Quick Settings sliding drawer panel */}
                <QuickSettings
                  isOpen={isQuickSettingsOpen}
                  onClose={() => setIsQuickSettingsOpen(false)}
                  masterVolume={masterVolume}
                  isMasterMuted={isMasterMuted}
                  onMasterVolumeChange={onMasterVolumeChange}
                  onToggleMasterMute={onToggleMasterMute}
                  onOpenDetailedMixer={() => setIsDetailedMixerOpen(true)}
                  tileSize={tileSize}
                  onTileSizeChange={setTileSize}
                />

                {/* Normal simple volume bar sliding in */}
                <NormalVolumeOverlay
                  isVisible={isNormalOverlayVisible}
                  masterVolume={masterVolume}
                  isMasterMuted={isMasterMuted}
                  onMasterVolumeChange={onMasterVolumeChange}
                  onToggleMasterMute={onToggleMasterMute}
                  onOpenDetailedMixer={() => setIsDetailedMixerOpen(true)}
                  onClose={() => setIsNormalOverlayVisible(false)}
                />

                {/* Detailed mixer overlay bottom sheet */}
                <DetailedMixerOverlay
                  isOpen={isDetailedMixerOpen}
                  masterVolume={masterVolume}
                  isMasterMuted={isMasterMuted}
                  apps={apps}
                  onAppVolumeChange={onAppVolumeChange}
                  onToggleAppMute={onToggleAppMute}
                  onMasterVolumeChange={onMasterVolumeChange}
                  onToggleMasterMute={onToggleMasterMute}
                  onOpenSettings={() => setCurrentView('settings')}
                  onClose={() => setIsDetailedMixerOpen(false)}
                />
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
