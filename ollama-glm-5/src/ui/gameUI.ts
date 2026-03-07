// Game HUD UI

export class GameUI {
  private hudElement: HTMLElement;
  private levelDisplay: HTMLElement;
  private timerDisplay: HTMLElement;
  private startTime: number = 0;
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.hudElement = document.getElementById('game-ui')!;
    this.levelDisplay = document.getElementById('level-display')!;
    this.timerDisplay = document.getElementById('timer-display')!;
  }

  show(): void {
    this.hudElement.classList.remove('hidden');
  }

  hide(): void {
    this.hudElement.classList.add('hidden');
  }

  setLevel(level: number): void {
    this.levelDisplay.textContent = `Level: ${level}`;
  }

  startTimer(): void {
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      this.updateTimer();
    }, 100);
  }

  stopTimer(): number {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    return Date.now() - this.startTime;
  }

  private updateTimer(): void {
    const elapsed = Date.now() - this.startTime;
    this.timerDisplay.textContent = this.formatTime(elapsed);
  }

  formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  reset(): void {
    this.stopTimer();
    this.timerDisplay.textContent = '00:00';
  }
}