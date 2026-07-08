/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StartupRule = 'inherit' | 'relative' | 'absolute' | 'always-mute';

export interface AppConfig {
  id: string;
  name: string;
  category: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind bg color class
  rule: StartupRule;
  relativeValue: number; // percentage offset e.g., -20% or +10%
  absoluteValue: number; // specific volume e.g., 50%
  isActive: boolean; // Is currently running / has audio output
  isPlaying: boolean; // Is currently playing sound
  userVolume: number; // Current volume slider position (0-100)
  isMuted: boolean; // Individually muted by user
}

export interface SystemState {
  masterVolume: number; // 0-100
  isMasterMuted: boolean;
  preMuteSnapshot: Record<string, boolean>; // app.id -> isMuted before master mute
  apps: AppConfig[];
}

export interface AudioTrackInfo {
  id: string;
  name: string;
  frequency: number;
  type: OscillatorType;
  tempo?: number;
}
