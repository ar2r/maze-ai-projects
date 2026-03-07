import type { SettingsState } from '../game/types';
import type { ScreenRefs } from './screens';

interface UiActions {
  startNewGame: () => void;
  continueGame: () => void;
  pauseToggle: () => void;
  restartLevel: () => void;
  resumeGame: () => void;
  nextLevel: () => void;
  retryLevel: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  backToMenu: () => void;
  updateSettings: (patch: Partial<SettingsState>) => void;
}

export function bindUi(refs: ScreenRefs, actions: UiActions): void {
  refs.startButton.addEventListener('click', actions.startNewGame);
  refs.continueButton.addEventListener('click', actions.continueGame);
  refs.pauseButton.addEventListener('click', actions.pauseToggle);
  refs.resumeButton.addEventListener('click', actions.resumeGame);
  refs.nextButton.addEventListener('click', actions.nextLevel);
  refs.retryButton.addEventListener('click', actions.retryLevel);
  refs.closeSettingsButton.addEventListener('click', actions.closeSettings);

  refs.openSettingsButtons.forEach((button) => {
    button.addEventListener('click', actions.openSettings);
  });
  refs.restartButtons.forEach((button) => {
    button.addEventListener('click', actions.restartLevel);
  });
  refs.backToMenuButtons.forEach((button) => {
    button.addEventListener('click', actions.backToMenu);
  });

  refs.soundToggle.addEventListener('change', () => {
    actions.updateSettings({ soundEnabled: refs.soundToggle.checked });
  });
  refs.vibrationToggle.addEventListener('change', () => {
    actions.updateSettings({ vibrationEnabled: refs.vibrationToggle.checked });
  });
  refs.debugToggle.addEventListener('change', () => {
    actions.updateSettings({ debugEnabled: refs.debugToggle.checked });
  });
}
