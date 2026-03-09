/**
 * Pause screen — shown when game is paused.
 */

export class PauseScreen {
  private readonly el         = document.getElementById('screen-pause')!;
  private readonly resumeBtn  = document.getElementById('btn-resume')!;
  private readonly restartBtn = document.getElementById('btn-restart')!;
  private readonly menuBtn    = document.getElementById('btn-menu-from-pause')!;

  private onResume:  (() => void) | null = null;
  private onRestart: (() => void) | null = null;
  private onMenu:    (() => void) | null = null;

  constructor() {
    this.resumeBtn.addEventListener('click',  () => this.onResume?.());
    this.restartBtn.addEventListener('click', () => this.onRestart?.());
    this.menuBtn.addEventListener('click',    () => this.onMenu?.());

    // ESC key resumes
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.el.classList.contains('hidden')) {
        this.onResume?.();
      }
    });
  }

  show(): void { this.el.classList.remove('hidden'); }
  hide(): void { this.el.classList.add('hidden'); }

  setOnResume(fn: () => void):  void { this.onResume  = fn; }
  setOnRestart(fn: () => void): void { this.onRestart = fn; }
  setOnMenu(fn: () => void):    void { this.onMenu    = fn; }
}
