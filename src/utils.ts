/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppConfig, StartupRule } from './types';

export const INITIAL_APPS: AppConfig[] = [
  {
    id: 'music',
    name: 'Muzic (Spotify)',
    category: 'Media',
    icon: 'Music',
    color: 'bg-emerald-500 text-white',
    rule: 'inherit',
    relativeValue: 0,
    absoluteValue: 60,
    isActive: true,
    isPlaying: true,
    userVolume: 80,
    isMuted: false,
  },
  {
    id: 'video',
    name: 'ViewTube (Video)',
    category: 'Media',
    icon: 'Youtube',
    color: 'bg-rose-500 text-white',
    rule: 'relative',
    relativeValue: -20, // -20% from master
    absoluteValue: 50,
    isActive: true,
    isPlaying: true,
    userVolume: 60, // calculated later
    isMuted: false,
  },
  {
    id: 'game',
    name: 'RetroQuest (Game)',
    category: 'Gaming',
    icon: 'Gamepad2',
    color: 'bg-indigo-500 text-white',
    rule: 'absolute',
    relativeValue: 0,
    absoluteValue: 35, // Locked to 35% absolute
    isActive: true,
    isPlaying: true,
    userVolume: 35,
    isMuted: false,
  },
  {
    id: 'chat',
    name: 'ChatPing (Messenger)',
    category: 'Communication',
    icon: 'MessageSquare',
    color: 'bg-sky-500 text-white',
    rule: 'inherit',
    relativeValue: 0,
    absoluteValue: 70,
    isActive: true,
    isPlaying: true,
    userVolume: 80,
    isMuted: false,
  },
  {
    id: 'navigation',
    name: 'MapGuide (GPS)',
    category: 'Travel',
    icon: 'Navigation',
    color: 'bg-amber-500 text-white',
    rule: 'relative',
    relativeValue: 15, // +15% from master
    absoluteValue: 75,
    isActive: false,
    isPlaying: false,
    userVolume: 95,
    isMuted: false,
  },
  {
    id: 'fitness',
    name: 'FitRun (Fitness)',
    category: 'Health',
    icon: 'Activity',
    color: 'bg-teal-500 text-white',
    rule: 'always-mute',
    relativeValue: 0,
    absoluteValue: 40,
    isActive: false,
    isPlaying: false,
    userVolume: 0,
    isMuted: true,
  },
  {
    id: 'browser',
    name: 'BrowseGo (Browser)',
    category: 'Utility',
    icon: 'Globe',
    color: 'bg-violet-500 text-white',
    rule: 'inherit',
    relativeValue: 0,
    absoluteValue: 50,
    isActive: false,
    isPlaying: false,
    userVolume: 50,
    isMuted: false,
  },
  {
    id: 'rideshare',
    name: 'CabRide (Uber)',
    category: 'Travel',
    icon: 'Car',
    color: 'bg-slate-700 text-white',
    rule: 'inherit',
    relativeValue: 0,
    absoluteValue: 40,
    isActive: false,
    isPlaying: false,
    userVolume: 40,
    isMuted: false,
  }
];

/**
 * Calculates volume of an app based on master volume and the startup rule setup.
 */
export function calculateAppVolume(
  rule: StartupRule,
  masterVolume: number,
  relativeValue: number,
  absoluteValue: number
): { volume: number; isMuted: boolean } {
  switch (rule) {
    case 'inherit':
      return { volume: masterVolume, isMuted: false };
    case 'relative':
      const relativeVol = Math.max(0, Math.min(100, masterVolume + relativeValue));
      return { volume: relativeVol, isMuted: false };
    case 'absolute':
      return { volume: absoluteValue, isMuted: false };
    case 'always-mute':
      return { volume: 0, isMuted: true };
    default:
      return { volume: masterVolume, isMuted: false };
  }
}
