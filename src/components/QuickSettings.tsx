/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, VolumeX, Sliders, Maximize2, Minimize2, 
  Wifi, Bluetooth, Moon, Sun, ShieldAlert, BatteryCharging, Sparkles 
} from 'lucide-react';

interface QuickSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  masterVolume: number;
  isMasterMuted: boolean;
  onMasterVolumeChange: (vol: number) => void;
  onToggleMasterMute: () => void;
  onOpenDetailedMixer: () => void;
  tileSize: '1x1' | '2x1';
  onTileSizeChange: (size: '1x1' | '2x1') => void;
}

export const QuickSettings: React.FC<QuickSettingsProps> = ({
  isOpen,
  onClose,
  masterVolume,
  isMasterMuted,
  onMasterVolumeChange,
  onToggleMasterMute,
  onOpenDetailedMixer,
  tileSize,
  onTileSizeChange,
}) => {
  const [isPressing, setIsPressing] = useState(false);
  const pressTimeout = useRef<any>(null);
  const progressInterval = useRef<any>(null);
  const [pressProgress, setPressProgress] = useState(0);

  // Simulate hold/long press
  const handlePressStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsPressing(true);
    setPressProgress(0);

    const startTime = Date.now();
    const duration = 600; // 600ms hold

    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setPressProgress(progress);
    }, 20);

    pressTimeout.current = setTimeout(() => {
      onOpenDetailedMixer();
      onClose(); // Close drawer when overlay opens
      handlePressEnd();
    }, duration);
  };

  const handlePressEnd = () => {
    setIsPressing(false);
    setPressProgress(0);
    if (pressTimeout.current) clearTimeout(pressTimeout.current);
    if (progressInterval.current) clearInterval(progressInterval.current);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="quick-settings-panel"
          initial={{ y: '-100%' }}
          animate={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="absolute inset-x-0 top-0 bottom-12 z-40 bg-[#FDF7FF]/96 border-b border-[#EADDFF] rounded-b-[40px] p-6 flex flex-col text-[#1C1B1F] backdrop-blur-md shadow-[0_16px_48px_rgba(103,80,164,0.12)]"
        >
          {/* Top Bar inside drawer */}
          <div className="flex justify-between items-center mb-6 mt-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
              <Sparkles className="w-4 h-4 text-[#6750A4] animate-pulse" />
              Android 17 system_control
            </div>
            <div className="text-xs font-mono text-slate-500">
              10:17 AM • Sunday
            </div>
          </div>

          {/* Quick Tiles Grid */}
          <div className="flex-1 grid grid-cols-4 gap-3 overflow-y-auto pr-1">
            
            {/* Standard Android Tiles */}
            <div className="col-span-2 h-16 bg-[#6750A4]/10 border border-[#EADDFF]/40 text-[#6750A4] rounded-2xl p-3 flex items-center gap-3 cursor-pointer">
              <div className="p-2 bg-[#6750A4]/15 rounded-xl">
                <Wifi className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-medium leading-none mb-1">Wi-Fi</span>
                <span className="text-[10px] text-[#6750A4]/80 font-mono leading-none">Connected</span>
              </div>
            </div>

            <div className="col-span-2 h-16 bg-white border border-slate-100 hover:bg-[#FDF7FF] text-slate-700 rounded-2xl p-3 flex items-center gap-3 cursor-pointer shadow-sm transition">
              <div className="p-2 bg-slate-50 text-slate-500 rounded-xl">
                <Bluetooth className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-medium leading-none mb-1">Bluetooth</span>
                <span className="text-[10px] text-slate-400 font-mono leading-none">On</span>
              </div>
            </div>

            <div className="col-span-2 h-16 bg-white border border-slate-100 hover:bg-[#FDF7FF] text-slate-700 rounded-2xl p-3 flex items-center gap-3 cursor-pointer shadow-sm transition">
              <div className="p-2 bg-slate-50 text-slate-500 rounded-xl">
                <Moon className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-medium leading-none mb-1">Do Not Disturb</span>
                <span className="text-[10px] text-slate-400 font-mono leading-none">Off</span>
              </div>
            </div>

            <div className="col-span-2 h-16 bg-white border border-slate-100 hover:bg-[#FDF7FF] text-slate-700 rounded-2xl p-3 flex items-center gap-3 cursor-pointer shadow-sm transition">
              <div className="p-2 bg-slate-50 text-amber-600 rounded-xl">
                <BatteryCharging className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-medium leading-none mb-1">Battery Saver</span>
                <span className="text-[10px] text-amber-600/80 font-mono leading-none">84% • Charging</span>
              </div>
            </div>

            {/* MAIN APP VOLUME MIXER TILE SECTION */}
            <div className="col-span-4 mt-2">
              <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-[11px] font-semibold tracking-wider text-slate-500 font-mono flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-[#6750A4]" />
                  APP VOLUME MIXER TILE
                </span>
                
                {/* Tile Size Toggler (Simulating Dynamic System Drag) */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 p-0.5 rounded-lg shadow-sm">
                  <button
                    id="tile-size-1x1"
                    onClick={() => onTileSizeChange('1x1')}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                      tileSize === '1x1' 
                        ? 'bg-[#6750A4] text-white font-medium' 
                        : 'text-slate-500 hover:text-[#6750A4]'
                    }`}
                  >
                    1x1 Size
                  </button>
                  <button
                    id="tile-size-2x1"
                    onClick={() => onTileSizeChange('2x1')}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                      tileSize === '2x1' 
                        ? 'bg-[#6750A4] text-white font-medium' 
                        : 'text-slate-500 hover:text-[#6750A4]'
                    }`}
                  >
                    2x1 Size
                  </button>
                </div>
              </div>

              {/* TILE RENDER */}
              <div className="relative">
                {tileSize === '1x1' ? (
                  /* 1x1 Tile */
                  <div className="grid grid-cols-2 gap-3">
                    <div 
                      id="volume-tile-1x1"
                      className={`relative overflow-hidden h-20 rounded-2xl border flex flex-col justify-between p-3 select-none transition ${
                        isMasterMuted 
                          ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm' 
                          : 'bg-[#EADDFF]/40 border-[#EADDFF] text-[#6750A4] shadow-sm'
                      }`}
                    >
                      {/* Hold progress ring/bar overlay */}
                      {isPressing && (
                        <div 
                          className="absolute bottom-0 left-0 h-1 bg-[#6750A4]/30 transition-all duration-75"
                          style={{ width: `${pressProgress}%` }}
                        />
                      )}

                      <div className="flex justify-between items-start">
                        <div 
                          className="p-1.5 bg-white/60 hover:bg-white/80 rounded-lg cursor-pointer transition shadow-sm text-[#6750A4]"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleMasterMute();
                          }}
                        >
                          {isMasterMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </div>
                        <span className="text-[10px] font-mono opacity-80">Tile Mute</span>
                      </div>

                      <div 
                        className="text-left cursor-pointer grow flex flex-col justify-end"
                        onMouseDown={handlePressStart}
                        onMouseUp={handlePressEnd}
                        onMouseLeave={handlePressEnd}
                        onTouchStart={handlePressStart}
                        onTouchEnd={handlePressEnd}
                        title="Hold to open detailed mixer"
                      >
                        <span className="text-xs font-semibold leading-tight block truncate">App Audio</span>
                        <span className="text-[9px] font-mono opacity-60 block leading-none">Hold for Mixer</span>
                      </div>
                    </div>

                    {/* Left over grid element explaining actions */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-2.5 flex flex-col justify-center text-left shadow-sm">
                      <span className="text-[10px] text-slate-500 leading-normal block">
                        💡 <strong className="text-[#6750A4]">1x1 Behavior:</strong> Single-click the speaker icon to toggle mute/unmute. 
                        Hold card to open detailed mixer overlay.
                      </span>
                    </div>
                  </div>
                ) : (
                  /* 2x1 Tile */
                  <div 
                    id="volume-tile-2x1"
                    className={`relative overflow-hidden h-24 rounded-2xl border p-4 select-none flex flex-col justify-between transition ${
                      isMasterMuted 
                        ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm' 
                        : 'bg-[#EADDFF]/30 border-[#EADDFF]/50 text-[#6750A4] shadow-sm'
                    }`}
                  >
                    {/* Hold progress bar */}
                    {isPressing && (
                      <div 
                        className="absolute bottom-0 left-0 h-1 bg-[#6750A4]/30 transition-all duration-75"
                        style={{ width: `${pressProgress}%` }}
                      />
                    )}

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                        <button
                          id="tile-2x1-mute-btn"
                          onClick={onToggleMasterMute}
                          className="p-2 bg-white/60 hover:bg-white/80 active:scale-95 rounded-xl transition shadow-sm text-[#6750A4] cursor-pointer"
                        >
                          {isMasterMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                        <div 
                          className="flex flex-col text-left cursor-pointer"
                          onMouseDown={handlePressStart}
                          onMouseUp={handlePressEnd}
                          onMouseLeave={handlePressEnd}
                          onTouchStart={handlePressStart}
                          onTouchEnd={handlePressEnd}
                        >
                          <span className="text-xs font-semibold leading-none mb-1">App Volume Mixer</span>
                          <span className="text-[9px] font-mono text-slate-500 leading-none">Hold for granular controls</span>
                        </div>
                      </div>

                      <span className="text-xs font-mono font-bold">
                        {isMasterMuted ? 'MUTED' : `${masterVolume}%`}
                      </span>
                    </div>

                    {/* Master volume slider */}
                    <div className="mt-3 flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={isMasterMuted ? 0 : masterVolume}
                        onChange={(e) => onMasterVolumeChange(Number(e.target.value))}
                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#6750A4]"
                        disabled={isMasterMuted}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Quick helper action for desktop click testing */}
              <div className="mt-3 flex justify-center gap-2">
                <button
                  id="hold-tile-helper"
                  onClick={() => {
                    onOpenDetailedMixer();
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-white border border-[#EADDFF] hover:bg-[#FDF7FF] text-xs font-mono text-[#6750A4] rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-[#6750A4]" />
                  Quick Simulator Hold Trigger
                </button>
              </div>

            </div>
          </div>

          {/* Swipe indicator bar at bottom */}
          <div 
            className="w-16 h-1 bg-slate-200 rounded-full mx-auto mt-4 cursor-pointer hover:bg-slate-300 transition" 
            onClick={onClose} 
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
