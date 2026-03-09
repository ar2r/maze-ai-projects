/**
 * Menu screen — handles the main menu (Start, Continue, Settings).
 */

export class MenuScreen {
  private readonly el           = document.getElementById('screen-menu')!;
  private readonly startBtn     = document.getElementById('btn-start')!;
  private readonly continueBtn  = document.getElementById('btn-continue')! as HTMLButtonElement;
  private readonly settingsBtn  = document.getElementById('btn-settings-open')!;

  private onStart:    (() => void) | null = null;
  private onContinue: (() => void) | null = null;
  private onSettings: (() => void) | null = null;

  constructor() {
    this.startBtn.addEventListener('click', () => this.onStart?.());
    this.continueBtn.addEventListener('click', () => this.onContinue?.());
    this.settingsBtn.addEventListener('click', () => this.onSettings?.());
  }

  show(hasSave: boolean): void {
    this.el.classList.remove('hidden');
    (this.continueBtn as HTMLButtonElement).disabled = !hasSave;
  }

  hide(): void {
    this.el.classList.add('hidden');
  }

  setOnStart(fn: () => void):    void { this.onStart = fn; }
  setOnContinue(fn: () => void): void { this.onContinue = fn; }
  setOnSettings(fn: () => void): void { this.onSettings = fn; }
}
