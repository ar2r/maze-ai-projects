/**
 * Control hint — small overlay showing active input method instructions.
 */

import { isTouchDevice } from '../utils';

export class ControlHint {
  private readonly el = document.getElementById('control-hint')!;

  show(mode: 'mouse' | 'keyboard' | 'touch'): void {
    const messages: Record<string, string> = {
      mouse:    'Move mouse to navigate',
      keyboard: 'WASD / Arrow keys',
      touch:    'Use joystick ↙',
    };
    this.el.textContent = messages[mode] ?? '';
    this.el.classList.remove('hidden');

    // Auto-hide after 4 seconds
    setTimeout(() => this.hide(), 4000);
  }

  hide(): void {
    this.el.classList.add('hidden');
  }

  autoDetectAndShow(controlMode: 'mouse' | 'keyboard'): void {
    if (isTouchDevice()) {
      this.show('touch');
    } else {
      this.show(controlMode);
    }
  }
}
