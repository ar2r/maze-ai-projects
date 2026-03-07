// Main menu UI

export class Menu {
  private menuElement: HTMLElement;
  private startBtn: HTMLElement;
  private continueBtn: HTMLElement;
  private settingsBtn: HTMLElement;
  private onStart: () => void = () => {};
  private onContinue: () => void = () => {};
  private onSettings: () => void = () => {};

  constructor() {
    this.menuElement = document.getElementById('menu')!;
    this.startBtn = document.getElementById('btn-start')!;
    this.continueBtn = document.getElementById('btn-continue')!;
    this.settingsBtn = document.getElementById('btn-settings')!;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.startBtn.addEventListener('click', () => {
      this.hide();
      this.onStart();
    });

    this.continueBtn.addEventListener('click', () => {
      this.hide();
      this.onContinue();
    });

    this.settingsBtn.addEventListener('click', () => {
      this.onSettings();
    });
  }

  show(hasSave: boolean): void {
    this.menuElement.classList.remove('hidden');
    if (hasSave) {
      this.continueBtn.classList.remove('hidden');
    } else {
      this.continueBtn.classList.add('hidden');
    }
  }

  hide(): void {
    this.menuElement.classList.add('hidden');
  }

  setOnStart(callback: () => void): void {
    this.onStart = callback;
  }

  setOnContinue(callback: () => void): void {
    this.onContinue = callback;
  }

  setOnSettings(callback: () => void): void {
    this.onSettings = callback;
  }
}