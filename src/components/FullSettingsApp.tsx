/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Sliders, Volume2, Plus, Minus, Info, 
  Settings, Check, CheckCircle2, ShieldCheck, Power, RefreshCw
} from 'lucide-react';
import { AppConfig, StartupRule } from '../types';
import { AppIcon } from './VolumeOverlays';
import { calculateAppVolume } from '../utils';

interface FullSettingsAppProps {
  apps: AppConfig[];
  masterVolume: number;
  onUpdateAppConfig: (updatedApp: AppConfig) => void;
  onBackToHome: () => void;
  onToggleAppPlayback: (id: string) => void; // Toggle active/inactive in audio engine
}

export const FullSettingsApp: React.FC<FullSettingsAppProps> = ({
  apps,
  masterVolume,
  onUpdateAppConfig,
  onBackToHome,
  onToggleAppPlayback,
}) => {
  const [selectedAppId, setSelectedAppId] = useState<string | null>(apps[0]?.id || null);

  const selectedApp = apps.find(a => a.id === selectedAppId);

  const handleRuleChange = (app: AppConfig, rule: StartupRule) => {
    const updated = { ...app, rule };
    
    // Recalculate based on new rule
    const calc = calculateAppVolume(rule, masterVolume, app.relativeValue, app.absoluteValue);
    updated.userVolume = calc.volume;
    updated.isMuted = calc.isMuted;
    
    onUpdateAppConfig(updated);
  };

  const handleRelativeValueChange = (app: AppConfig, val: number) => {
    const updated = { ...app, relativeValue: Math.max(-100, Math.min(100, val)) };
    if (app.rule === 'relative') {
      const calc = calculateAppVolume('relative', masterVolume, updated.relativeValue, app.absoluteValue);
      updated.userVolume = calc.volume;
    }
    onUpdateAppConfig(updated);
  };

  const handleAbsoluteValueChange = (app: AppConfig, val: number) => {
    const updated = { ...app, absoluteValue: Math.max(0, Math.min(100, val)) };
    if (app.rule === 'absolute') {
      const calc = calculateAppVolume('absolute', masterVolume, app.relativeValue, updated.absoluteValue);
      updated.userVolume = calc.volume;
    }
    onUpdateAppConfig(updated);
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F9FF] text-slate-800 overflow-hidden rounded-[32px] border border-slate-200">
      {/* Settings Header */}
      <div className="px-5 pt-12 pb-4 bg-[#FDF7FF] border-b border-[#EADDFF]/50 flex items-center gap-3 shadow-sm">
        <button
          id="settings-back-btn"
          onClick={onBackToHome}
          className="p-1.5 hover:bg-slate-100 rounded-full transition active:scale-95 text-slate-600 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-base font-semibold leading-tight text-slate-900">System Volume Rules</h2>
          <p className="text-[10px] text-slate-500 font-mono">App Volume Service v17.4</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left column: Apps List */}
        <div className="w-full md:w-5/12 border-b md:border-b-0 md:border-r border-[#EADDFF]/50 bg-[#FDF7FF] overflow-y-auto p-4 space-y-2">
          <div className="text-[10px] font-semibold text-slate-400 font-mono tracking-wider mb-2 px-1">
            ALL INSTALLED APPS ({apps.length})
          </div>

          {apps.map((app) => {
            const isSelected = app.id === selectedAppId;
            const currentVolumeOutput = app.isMuted ? 0 : app.userVolume;

            return (
              <div
                key={app.id}
                id={`app-item-${app.id}`}
                onClick={() => setSelectedAppId(app.id)}
                className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer border transition select-none ${
                  isSelected 
                    ? 'bg-[#6750A4]/10 border-[#6750A4]/30 text-[#6750A4] shadow-sm' 
                    : 'bg-white hover:bg-slate-50 border-slate-100/80 text-slate-700 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-xl shrink-0 ${app.color}`}>
                    <AppIcon name={app.icon} className="w-4 h-4 text-slate-800" />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="text-xs font-semibold truncate text-slate-800">{app.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${app.isActive ? 'bg-[#6750A4] animate-pulse' : 'bg-slate-300'}`} />
                      {app.isActive ? 'Active Audio' : 'Inactive'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded font-mono text-slate-600 font-medium border border-slate-200/50">
                    {app.rule === 'always-mute' ? 'MUTE' : `${currentVolumeOutput}%`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right column: Config Details */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-white">
          {selectedApp ? (
            <div className="space-y-5">
              {/* Selected App Badge */}
              <div className="flex justify-between items-start bg-[#FDF7FF] border border-[#EADDFF]/50 p-4 rounded-3xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${selectedApp.color}`}>
                    <AppIcon name={selectedApp.icon} className="w-6 h-6 text-slate-800" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-slate-950">{selectedApp.name}</h3>
                    <p className="text-xs text-slate-500">{selectedApp.category} Application</p>
                  </div>
                </div>

                {/* Simulated Run/Stop Button */}
                <button
                  id={`toggle-app-playback-${selectedApp.id}`}
                  onClick={() => onToggleAppPlayback(selectedApp.id)}
                  className={`px-3 py-1.5 rounded-xl font-mono text-[10px] font-semibold transition active:scale-95 flex items-center gap-1 cursor-pointer ${
                    selectedApp.isActive 
                      ? 'bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100/50' 
                      : 'bg-[#6750A4]/10 border border-[#EADDFF]/50 text-[#6750A4] hover:bg-[#6750A4]/25'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  {selectedApp.isActive ? 'Simulate Stop' : 'Simulate Sound'}
                </button>
              </div>

              {/* Startup Rule Selector */}
              <div className="space-y-3">
                <label className="text-[11px] font-semibold tracking-wider font-mono text-slate-500 flex items-center gap-1 px-1">
                  <Settings className="w-3.5 h-3.5 text-[#6750A4]" />
                  STARTUP VOLUME RULE
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'inherit', label: 'Inherit Master', desc: 'Syncs with master volume' },
                    { id: 'relative', label: 'Relative Offset', desc: 'Maintains difference to master' },
                    { id: 'absolute', label: 'Absolute Fix', desc: 'Locked to exact level' },
                    { id: 'always-mute', label: 'Always Mute', desc: 'Starts completely silent' },
                  ].map((ruleOpt) => {
                    const isSelected = selectedApp.rule === ruleOpt.id;
                    return (
                      <button
                        key={ruleOpt.id}
                        id={`rule-opt-${ruleOpt.id}`}
                        onClick={() => handleRuleChange(selectedApp, ruleOpt.id as StartupRule)}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                          isSelected 
                            ? 'bg-[#6750A4]/10 border-[#6750A4] text-[#6750A4] shadow-md' 
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 shadow-sm'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full mb-1">
                          <span className="text-xs font-semibold leading-none">{ruleOpt.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#6750A4]" />}
                        </div>
                        <span className="text-[10px] text-slate-500 leading-tight">{ruleOpt.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Param Configuration Box based on rule */}
              {selectedApp.rule === 'relative' && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#FDF7FF] border border-[#EADDFF]/50 p-4 rounded-2xl space-y-3 shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-600">Set Relative Offset</span>
                    <span className={`text-xs font-mono font-bold ${selectedApp.relativeValue >= 0 ? 'text-[#6750A4]' : 'text-rose-500'}`}>
                      {selectedApp.relativeValue >= 0 ? '+' : ''}{selectedApp.relativeValue}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      id="dec-relative-btn"
                      onClick={() => handleRelativeValueChange(selectedApp, selectedApp.relativeValue - 5)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl transition cursor-pointer"
                    >
                      <Minus className="w-4 h-4 text-slate-600" />
                    </button>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      step="5"
                      value={selectedApp.relativeValue}
                      onChange={(e) => handleRelativeValueChange(selectedApp, Number(e.target.value))}
                      className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#6750A4]"
                    />
                    <button
                      id="inc-relative-btn"
                      onClick={() => handleRelativeValueChange(selectedApp, selectedApp.relativeValue + 5)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 italic">
                    With master at <strong className="text-slate-700">{masterVolume}%</strong>, this app will start at <strong className="text-[#6750A4]">{Math.max(0, Math.min(100, masterVolume + selectedApp.relativeValue))}%</strong>.
                  </p>
                </motion.div>
              )}

              {selectedApp.rule === 'absolute' && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#FDF7FF] border border-[#EADDFF]/50 p-4 rounded-2xl space-y-3 shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-600">Set Absolute Volume</span>
                    <span className="text-xs font-mono font-bold text-[#6750A4]">{selectedApp.absoluteValue}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      id="dec-absolute-btn"
                      onClick={() => handleAbsoluteValueChange(selectedApp, selectedApp.absoluteValue - 5)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl transition cursor-pointer"
                    >
                      <Minus className="w-4 h-4 text-slate-600" />
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={selectedApp.absoluteValue}
                      onChange={(e) => handleAbsoluteValueChange(selectedApp, Number(e.target.value))}
                      className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#6750A4]"
                    />
                    <button
                      id="inc-absolute-btn"
                      onClick={() => handleAbsoluteValueChange(selectedApp, selectedApp.absoluteValue + 5)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 italic">
                    This app will always start at <strong className="text-[#6750A4]">{selectedApp.absoluteValue}%</strong> volume, regardless of master changes.
                  </p>
                </motion.div>
              )}

              {/* Status Box */}
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-1 text-left">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">Live Active Output Specs</span>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/50">
                    <div className="text-[9px] text-slate-400 font-mono">Simulated Signal</div>
                    <div className={`text-xs font-semibold ${selectedApp.isActive ? 'text-[#6750A4]' : 'text-slate-400'}`}>
                      {selectedApp.isActive ? 'GEN_ACTIVE' : 'IDLE (No Output)'}
                    </div>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/50">
                    <div className="text-[9px] text-slate-400 font-mono">Current Audio Level</div>
                    <div className="text-xs font-semibold text-[#6750A4]">
                      {selectedApp.isMuted ? 'Muted (0%)' : `${selectedApp.userVolume}%`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Explanation note */}
              <div className="text-xs text-slate-500 bg-slate-50 border border-slate-100 p-3 rounded-2xl flex gap-2 shadow-sm">
                <Info className="w-4 h-4 text-[#6750A4] shrink-0 mt-0.5" />
                <p className="text-left leading-normal text-[11px]">
                  Startup rules dictate what default volume and mute states are applied dynamically to apps when they are launched or when the Android master audio controller initializes.
                </p>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <Sliders className="w-8 h-8 text-slate-300 mb-2" />
              <span className="text-sm">Select an app from the list to configure its rules.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
