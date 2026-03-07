// Settings UI

import { Settings } from '../core/types';

export class SettingsUI {
  private settingsElement: HTMLElement;
  private soundCheckbox: HTMLInputElement;
  private vibrationCheckbox: HTMLInputElement;
  private controlSelect: HTMLSelectElement;
  private backBtn: HTMLElement;
  private onSettingsChange: (settings: Settings) => void = () => {};
  private onBack: () => void = () => {};

  constructor() {
    this.settingsElement = document.getElementById('settings')!;
    this.soundCheckbox = document.getElementById('setting-sound') as HTMLInputElement;
    this.vibrationCheckbox = document.getElementById('setting-vibration') as HTMLInputElement;
    this.controlSelect = document.getElementById('setting-control') as HTMLSelectElement;
    this.backBtn = document.getElementById('btn-settings-back')!;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.soundCheckbox.addEventListener('change', () => this.emitChange());
    this.vibrationCheckbox.addEventListener('change', () => this.emitChange());
    this.controlSelect.addEventListener('change', () => this.emitChange());
    this.backBtn.addEventListener('click', () => {
      this.hide();
      this.onBack();
    });
  }

  private emitChange(): void {
    this.onSettingsChange(this.getSettings());
  }

  show(): void {
    this.settingsElement.classList.remove('hidden');
  }

  hide(): void {
    this.settingsElement.classList.add('hidden');
  }

  setSettings(settings: Settings): void {
    this.soundCheckbox.checked = settings.sound;
    this.vibrationCheckbox.checked = settings.vibration;
    this.controlSelect.value = settings.controlMode;
  }

  getSettings(): Settings {
    return {
      sound: this.soundCheckbox.checked,
      vibration: this.vibrationCheckbox.checked,
      controlMode: this.controlSelect.value as 'mouse' | 'follow' | 'joystick'
    };
  }

  setOnChange(callback: (settings: Settings) => void): void {
    this.onSettingsChange = callback;
  }

  setOnBack(callback: () => void): void {
    this.onBack = callback;
  }
}