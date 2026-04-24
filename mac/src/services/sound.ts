import * as path from 'path';
import { exec } from 'child_process';

const SOUND_FILES: Record<string, string> = {
  'soft-chime': path.join(__dirname, '../../assets/sounds/chime-single.mp3'),
  'piano-note': path.join(__dirname, '../../assets/sounds/chime-single.mp3'),
  'game-clear': path.join(__dirname, '../../assets/sounds/chime-single.mp3'),
  'fanfare-all': path.join(__dirname, '../../assets/sounds/fanfare-all.mp3'),
};

export function playSound(soundId: string): void {
  const file = SOUND_FILES[soundId];
  if (!file) return;
  exec(`afplay "${file}"`, (err) => {
    if (err) console.warn('Sound playback failed:', err.message);
  });
}

export function playSingleRingSound(): void {
  playSound('soft-chime');
}

export function playAllRingsFanfare(): void {
  playSound('fanfare-all');
}
