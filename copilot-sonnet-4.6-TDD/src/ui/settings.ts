/**
 * Settings screen — sound, vibration, control mode.
 * Reads/writes AppSettings and syncs to UI elements.
 */

import type { AppSettings } from '../types';
import { isTouchDevice } from '../utils';

export class SettingsScreen {
  private readonly el           = document.getElementById('screen-settings')!;
  private readonly soundToggle  = document.getElementById('setting-sound')!   as HTMLInputElement;
  private readonly vibrToggle   = document.getElementById('setting-vibration')! as HTMLInputElement;
  private readonly vibrRow      = document.getElementById('row-vibration')!;
  private readonly ctrlBtns     = document.querySelectorAll('#ctrl-mode button');
  private readonly closeBtn     = document.getElementById('btn-settings-close')!;

  private onClose:  (() => void) | null = null;
  private onChange: ((s: AppSettings) => void) | null = null;

  constructor() {
    // Hide vibration row on desktop
    if (!isTouchDevice()) {
      this.vibrRow.style.display = 'none';
    }

    this.closeBtn.addEventListener('click', () => this.onClose?.());

    this.soundToggle.addEventListener('change', () => this.emitChange());
    this.vibrToggle.addEventListener('change',  () => this.emitChange());

    this.ctrlBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.ctrlBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.emitChange();
      });
    });
  }

  show(settings: AppSettings): void {
    this.el.classList.remove('hidden');
    this.soundToggle.checked = settings.sound;
    this.vibrToggle.checked  = settings.vibration;
    this.ctrlBtns.forEach(btn => {
      const isActive = (btn as HTMLElement).dataset.mode === settings.controlMode;
      btn.classList.toggle('active', isActive);
    });
  }

  hide(): void {
    this.el.classList.add('hidden');
  }

  setOnClose(fn: () => void):              void { this.onClose  = fn; }
  setOnChange(fn: (s: AppSettings) => void): void { this.onChange = fn; }

  private emitChange(): void {
    const settings = this.readCurrent();
    this.onChange?.(settings);
  }

  private readCurrent(): AppSettings {
    let controlMode: 'mouse' | 'keyboard' = 'mouse';
    this.ctrlBtns.forEach(btn => {
      if (btn.classList.contains('active')) {
        const m = (btn as HTMLElement).dataset.mode;
        if (m === 'mouse' || m === 'keyboard') controlMode = m;
      }
    });

    return {
      sound:       this.soundToggle.checked,
      vibration:   this.vibrToggle.checked,
      controlMode,
    };
  }
}
