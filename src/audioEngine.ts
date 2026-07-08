/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppConfig } from './types';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private trackGains: Record<string, GainNode> = {};
  private activeOscillators: Record<string, any[]> = {};
  private schedulerTimer: any = null;
  private currentStep = 0;
  private initialized = false;

  public start() {
    if (this.initialized) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);

      // Create tracks
      this.createTrack('music');
      this.createTrack('video');
      this.createTrack('game');
      this.createTrack('chat');

      // Start the sequencer loop for generative sound
      this.startSequencer();
      this.initialized = true;
      console.log('AudioEngine started successfully!');
    } catch (e) {
      console.error('Failed to initialize AudioEngine', e);
    }
  }

  private createTrack(id: string) {
    if (!this.ctx || !this.masterGain) return;
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, this.ctx.currentTime); // start silent until update
    gainNode.connect(this.masterGain);
    this.trackGains[id] = gainNode;
  }

  public updateVolumes(apps: AppConfig[], masterVolume: number, isMasterMuted: boolean) {
    if (!this.ctx || !this.masterGain) return;

    // Apply master volume/mute
    const targetMasterGain = isMasterMuted ? 0 : masterVolume / 100;
    this.masterGain.gain.setTargetAtTime(targetMasterGain, this.ctx.currentTime, 0.05);

    // Apply per-app gains
    apps.forEach((app) => {
      const gainNode = this.trackGains[app.id];
      if (!gainNode) return;

      // Calculate the specific gain for this app
      let targetVolume = 0;
      if (app.isPlaying && !app.isMuted) {
        targetVolume = app.userVolume / 100;
      } else {
        targetVolume = 0;
      }

      // Smooth transition to avoid pops
      gainNode.gain.setTargetAtTime(targetVolume, this.ctx.currentTime, 0.05);
    });
  }

  private startSequencer() {
    if (!this.ctx) return;

    this.schedulerTimer = setInterval(() => {
      if (!this.ctx || this.ctx.state === 'suspended') return;
      const time = this.ctx.currentTime;

      // Muzic track loop: arpeggiator
      // Muzic is always playing if active, schedules notes on 16th steps
      this.playMusicStep(time, this.currentStep);

      // ViewTube track loop: beat
      this.playVideoStep(time, this.currentStep);

      // RetroQuest track loop: occasional noise or laser
      if (Math.random() < 0.1) {
        this.playGameSFX(time);
      }

      this.currentStep = (this.currentStep + 1) % 16;
    }, 150); // 150ms per step (~100 BPM)
  }

  private playMusicStep(time: number, step: number) {
    const musicGain = this.trackGains['music'];
    if (!musicGain || !this.ctx) return;

    // Muzic app plays C Major chord notes
    const notes = [130.81, 164.81, 196.00, 261.63, 329.63, 392.00, 523.25, 392.00]; // C3, E3, G3, C4, E4, G4, C5, G4
    const note = notes[step % notes.length];

    // Play on steps: 0, 2, 4, 6, 8, 10, 12, 14 (8th notes)
    if (step % 2 === 0) {
      const osc = this.ctx.createOscillator();
      const nodeGain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note, time);

      nodeGain.gain.setValueAtTime(0.12, time);
      nodeGain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

      osc.connect(nodeGain);
      nodeGain.connect(musicGain);

      osc.start(time);
      osc.stop(time + 0.3);
    }
  }

  private playVideoStep(time: number, step: number) {
    const videoGain = this.trackGains['video'];
    if (!videoGain || !this.ctx) return;

    // Video plays a low kick-bass on 0, 4, 8, 12 and snare-like click on 8, 12
    if (step % 4 === 0) {
      // Bass Kick
      const osc = this.ctx.createOscillator();
      const nodeGain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(45, time + 0.15);

      nodeGain.gain.setValueAtTime(0.2, time);
      nodeGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

      osc.connect(nodeGain);
      nodeGain.connect(videoGain);

      osc.start(time);
      osc.stop(time + 0.2);
    }

    if (step % 8 === 4) {
      // Soft snare/hat click (noise-like)
      const osc = this.ctx.createOscillator();
      const nodeGain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, time);
      osc.frequency.exponentialRampToValueAtTime(300, time + 0.08);

      nodeGain.gain.setValueAtTime(0.08, time);
      nodeGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

      osc.connect(nodeGain);
      nodeGain.connect(videoGain);

      osc.start(time);
      osc.stop(time + 0.1);
    }
  }

  private playGameSFX(time: number) {
    const gameGain = this.trackGains['game'];
    if (!gameGain || !this.ctx) return;

    const osc = this.ctx.createOscillator();
    const nodeGain = this.ctx.createGain();

    // Laser sweep or jump beep
    const types: OscillatorType[] = ['sawtooth', 'triangle', 'square'];
    osc.type = types[Math.floor(Math.random() * types.length)];
    const startFreq = 200 + Math.random() * 600;
    const endFreq = startFreq + (Math.random() > 0.5 ? 400 : -150);

    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.18);

    nodeGain.gain.setValueAtTime(0.05, time);
    nodeGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

    osc.connect(nodeGain);
    nodeGain.connect(gameGain);

    osc.start(time);
    osc.stop(time + 0.22);
  }

  public playChatNotification() {
    if (!this.ctx || !this.initialized) return;
    const chatGain = this.trackGains['chat'];
    if (!chatGain) return;

    const time = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const nodeGain = this.ctx.createGain();

    // Pleasant double ping notification
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, time); // C5
    osc1.frequency.setValueAtTime(659.25, time + 0.08); // E5

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(783.99, time); // G5
    osc2.frequency.setValueAtTime(987.77, time + 0.08); // B5

    nodeGain.gain.setValueAtTime(0.15, time);
    nodeGain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc1.connect(nodeGain);
    osc2.connect(nodeGain);
    nodeGain.connect(chatGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.4);
    osc2.stop(time + 0.4);
  }

  public stop() {
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
    }
    if (this.ctx) {
      this.ctx.close();
    }
    this.initialized = false;
  }
}

export const audioEngine = new AudioEngine();
