/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, Volume1, VolumeX, Sliders, Settings, 
  X, Music, Youtube, Gamepad2, MessageSquare, Navigation, 
  Activity, Globe, Car 
} from 'lucide-react';
import { AppConfig } from '../types';

// Dynamic icon resolver
export const AppIcon = ({ name, className = "w-5 h-5" }: { name: string; className?: string }) => {
  switch (name) {
    case 'Music': return <Music className={className} />;
    case 'Youtube': return <Youtube className={className} />;
    case 'Gamepad2': return <Gamepad2 className={className} />;
    case 'MessageSquare': return <MessageSquare className={className} />;
    case 'Navigation': return <Navigation className={className} />;
    case 'Activity': return <Activity className={className} />;
    case 'Globe': return <Globe className={className} />;
    case 'Car': return <Car className={className} />;
    default: return <Volume2 className={className} />;
  }
};

interface NormalVolumeOverlayProps {
  isVisible: boolean;
  masterVolume: number;
  isMasterMuted: boolean;
  onMasterVolumeChange: (vol: number) => void;
  onToggleMasterMute: () => void;
  onOpenDetailedMixer: () => void;
  onClose: () => void;
}

export const NormalVolumeOverlay: React.FC<NormalVolumeOverlayProps> = ({
  isVisible,
  masterVolume,
  isMasterMuted,
  onMasterVolumeChange,
  onToggleMasterMute,
  onOpenDetailedMixer,
  onClose,
}) => {
  // Auto close timer after 4s idle
  React.useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, masterVolume, isMasterMuted, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id="normal-volume-overlay"
          initial={{ opacity: 0, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="absolute top-1/3 right-4 z-40 w-16 bg-[#FDF7FF]/95 border border-[#EADDFF] backdrop-blur-md rounded-2xl p-3 flex flex-col items-center gap-4 shadow-[0_16px_48px_rgba(103,80,164,0.1)] text-slate-800"
        >
          {/* Detailed Mixer Button */}
          <button
            id="open-detailed-mixer-btn"
            onClick={() => {
              onOpenDetailedMixer();
              onClose();
            }}
            className="p-2 bg-[#6750A4]/10 hover:bg-[#6750A4]/20 active:scale-95 rounded-xl transition text-[#6750A4] cursor-pointer"
            title="Open Detailed Volume Mixer"
          >
            <Sliders className="w-5 h-5" />
          </button>

          {/* Master Volume Slider (Vertical) */}
          <div className="h-32 w-4 bg-slate-200 rounded-full relative overflow-hidden flex flex-col justify-end">
            <div 
              className={`w-full transition-all duration-75 ${isMasterMuted ? 'bg-slate-300' : 'bg-[#6750A4]'}`}
              style={{ height: `${isMasterMuted ? 0 : masterVolume}%` }}
            />
            <input
              type="range"
              min="0"
              max="100"
              value={isMasterMuted ? 0 : masterVolume}
              onChange={(e) => onMasterVolumeChange(Number(e.target.value))}
              className="absolute inset-0 opacity-0 cursor-ns-resize"
              style={{ writingMode: 'bt-lr', WebkitAppearance: 'slider-vertical' } as any}
            />
          </div>

          {/* Master Mute Trigger */}
          <button
            id="toggle-master-mute-overlay"
            onClick={onToggleMasterMute}
            className={`p-2 rounded-xl transition active:scale-95 cursor-pointer border ${
              isMasterMuted 
                ? 'bg-rose-50 text-rose-600 border-rose-200' 
                : 'bg-slate-100 hover:bg-slate-200 border-transparent text-slate-600'
            }`}
          >
            {isMasterMuted ? <VolumeX className="w-5 h-5" /> : (masterVolume > 50 ? <Volume2 className="w-5 h-5" /> : <Volume1 className="w-5 h-5" />)}
          </button>

          <span className="text-[10px] font-mono text-slate-500 select-none font-medium">
            {isMasterMuted ? 'MUT' : `${masterVolume}%`}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface DetailedMixerOverlayProps {
  isOpen: boolean;
  masterVolume: number;
  isMasterMuted: boolean;
  apps: AppConfig[];
  onAppVolumeChange: (id: string, vol: number) => void;
  onToggleAppMute: (id: string) => void;
  onMasterVolumeChange: (vol: number) => void;
  onToggleMasterMute: () => void;
  onOpenSettings: () => void;
  onClose: () => void;
}

export const DetailedMixerOverlay: React.FC<DetailedMixerOverlayProps> = ({
  isOpen,
  masterVolume,
  isMasterMuted,
  apps,
  onAppVolumeChange,
  onToggleAppMute,
  onMasterVolumeChange,
  onToggleMasterMute,
  onOpenSettings,
  onClose,
}) => {
  const activeApps = apps.filter(app => app.isActive);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end">
          {/* Click outside backdrop to close */}
          <div className="absolute inset-0" onClick={onClose} />

          {/* Sliding Bottom Sheet */}
          <motion.div
            id="detailed-mixer-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full max-h-[85%] bg-[#FDF7FF] border-t border-[#EADDFF] rounded-t-3xl p-5 flex flex-col shadow-[0_-12px_48px_rgba(103,80,164,0.12)] z-10 text-[#1C1B1F]"
          >
            {/* Drag indicator bar */}
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4 cursor-pointer" onClick={onClose} />

            {/* Header */}
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-slate-900">System Audio Mixer</h3>
                <p className="text-xs text-slate-500">Android 17 Granular Volume Control</p>
              </div>
              <button
                id="close-detailed-mixer-btn"
                onClick={onClose}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Sliders */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
              {/* Master Volume Row */}
              <div className="bg-white border border-[#EADDFF]/50 p-3.5 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium flex items-center gap-2 text-[#6750A4]">
                    <Volume2 className="w-4 h-4" />
                    Master Volume
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    {isMasterMuted ? 'Muted' : `${masterVolume}%`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    id="master-mute-sheet"
                    onClick={onToggleMasterMute}
                    className={`p-2 rounded-xl transition cursor-pointer border ${
                      isMasterMuted 
                        ? 'bg-rose-50 text-rose-600 border-rose-200' 
                        : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200'
                    }`}
                  >
                    {isMasterMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMasterMuted ? 0 : masterVolume}
                    onChange={(e) => onMasterVolumeChange(Number(e.target.value))}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#6750A4]"
                  />
                </div>
              </div>

              <div className="text-xs font-semibold text-slate-400 px-1 mt-4 mb-2 select-none font-mono">
                ACTIVE APPS WITH AUDIO
              </div>

              {activeApps.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm italic">
                  No active apps generating audio.
                </div>
              ) : (
                activeApps.map((app) => {
                  return (
                    <div 
                      key={app.id} 
                      className="bg-white border border-[#EADDFF]/20 p-3.5 rounded-2xl flex flex-col gap-2 hover:border-[#EADDFF]/50 transition shadow-[0_2px_12px_rgba(103,80,164,0.01)]"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg ${app.color}`}>
                            <AppIcon name={app.icon} className="w-4 h-4 text-slate-800" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium leading-tight text-slate-800">{app.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Rule: <span className="text-[#6750A4] capitalize">{app.rule}</span>
                              {app.rule === 'relative' && ` (${app.relativeValue > 0 ? '+' : ''}${app.relativeValue}%)`}
                              {app.rule === 'absolute' && ` (${app.absoluteValue}%)`}
                            </span>
                          </div>
                        </div>

                        {/* Visualizer bars bouncing dynamically */}
                        {app.isPlaying && !app.isMuted && !isMasterMuted && (
                          <div className="flex items-end gap-0.5 h-3 px-2">
                            <span className="w-0.5 bg-[#6750A4] rounded-full animate-bounce h-2" style={{ animationDelay: '0.1s' }} />
                            <span className="w-0.5 bg-[#6750A4] rounded-full animate-bounce h-3" style={{ animationDelay: '0.3s' }} />
                            <span className="w-0.5 bg-[#6750A4] rounded-full animate-bounce h-1" style={{ animationDelay: '0.5s' }} />
                          </div>
                        )}

                        <span className="text-xs font-mono text-slate-500">
                          {app.isMuted ? 'Muted' : `${app.userVolume}%`}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* App specific Mute Button - mutes immediately without pausing app */}
                        <button
                          id={`mute-app-${app.id}`}
                          onClick={() => onToggleAppMute(app.id)}
                          className={`p-2 rounded-xl transition cursor-pointer border ${
                            app.isMuted 
                              ? 'bg-rose-50 text-rose-600 border-rose-200' 
                              : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200'
                          }`}
                          title={`Mute ${app.name}`}
                        >
                          {app.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>

                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={app.isMuted ? 0 : app.userVolume}
                          onChange={(e) => onAppVolumeChange(app.id, Number(e.target.value))}
                          className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#6750A4]"
                          disabled={app.isMuted}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Settings Link Footer */}
            <div className="border-t border-[#EADDFF]/40 pt-4 mt-2">
              <button
                id="more-settings-btn"
                onClick={() => {
                  onOpenSettings();
                  onClose();
                }}
                className="w-full py-3 px-4 bg-[#6750A4] hover:bg-[#6750A4]/90 active:scale-98 text-white rounded-2xl flex items-center justify-center gap-2 text-sm font-medium transition shadow-[0_8px_24px_rgba(103,80,164,0.2)] cursor-pointer"
              >
                <Settings className="w-4 h-4 text-white" />
                More Audio Settings
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
