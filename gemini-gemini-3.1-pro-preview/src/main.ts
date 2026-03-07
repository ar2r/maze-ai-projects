import { GameEngine } from './game/GameEngine';
import { UI } from './game/UI';

interface Progress {
  level: number;
  bestTimes: Record<number, number>;
}

class App {
  private engine: GameEngine;
  private ui: UI;
  private progress: Progress;

  constructor() {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    const uiContainer = document.getElementById('ui-overlay') as HTMLElement;

    this.progress = this.loadProgress();
    
    this.engine = new GameEngine(canvas, (time, collisions) => this.handleWin(time, collisions));
    
    this.ui = new UI(uiContainer, {
      onStart: () => this.startGame(),
      onNext: () => this.nextLevel(),
      onRetry: () => this.startGame()
    });

    this.ui.showMenu(this.progress.level, this.progress.bestTimes[this.progress.level] || null);
    
    this.loop();
  }

  private loadProgress(): Progress {
    const saved = localStorage.getItem('maze-progress');
    return saved ? JSON.parse(saved) : { level: 1, bestTimes: {} };
  }

  private saveProgress() {
    localStorage.setItem('maze-progress', JSON.stringify(this.progress));
  }

  private startGame() {
    this.ui.clear();
    this.engine.initLevel(this.progress.level);
  }

  private nextLevel() {
    this.progress.level++;
    this.saveProgress();
    this.startGame();
  }

  private handleWin(time: number, collisions: number) {
    const currentBest = this.progress.bestTimes[this.progress.level];
    if (!currentBest || time < currentBest) {
      this.progress.bestTimes[this.progress.level] = time;
    }
    this.saveProgress();
    this.ui.showWin(time, collisions);
  }

  private loop() {
    this.engine.update();
    this.engine.render();
    requestAnimationFrame(() => this.loop());
  }
}

new App();
