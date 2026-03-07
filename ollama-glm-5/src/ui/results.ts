// Results screen UI

import { GameUI } from './gameUI';

export class Results {
  private resultsElement: HTMLElement;
  private resultTime: HTMLElement;
  private resultHits: HTMLElement;
  private resultBest: HTMLElement;
  private nextBtn: HTMLElement;
  private retryBtn: HTMLElement;
  private menuBtn: HTMLElement;
  private onNext: () => void = () => {};
  private onRetry: () => void = () => {};
  private onMenu: () => void = () => {};

  private gameUI: GameUI;

  constructor(gameUI: GameUI) {
    this.gameUI = gameUI;
    this.resultsElement = document.getElementById('results')!;
    this.resultTime = document.getElementById('result-time')!;
    this.resultHits = document.getElementById('result-hits')!;
    this.resultBest = document.getElementById('result-best')!;
    this.nextBtn = document.getElementById('btn-next')!;
    this.retryBtn = document.getElementById('btn-retry')!;
    this.menuBtn = document.getElementById('btn-menu')!;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.nextBtn.addEventListener('click', () => {
      this.hide();
      this.onNext();
    });

    this.retryBtn.addEventListener('click', () => {
      this.hide();
      this.onRetry();
    });

    this.menuBtn.addEventListener('click', () => {
      this.hide();
      this.onMenu();
    });
  }

  show(time: number, hits: number, bestTime: number | null, isLastLevel: boolean): void {
    this.resultsElement.classList.remove('hidden');
    this.resultTime.textContent = this.gameUI.formatTime(time);
    this.resultHits.textContent = hits.toString();
    this.resultBest.textContent = bestTime ? this.gameUI.formatTime(bestTime) : '--:--';

    if (isLastLevel) {
      this.nextBtn.textContent = 'Game Complete!';
      this.nextBtn.classList.add('disabled');
    } else {
      this.nextBtn.textContent = 'Next Level';
      this.nextBtn.classList.remove('disabled');
    }
  }

  hide(): void {
    this.resultsElement.classList.add('hidden');
  }

  setOnNext(callback: () => void): void {
    this.onNext = callback;
  }

  setOnRetry(callback: () => void): void {
    this.onRetry = callback;
  }

  setOnMenu(callback: () => void): void {
    this.onMenu = callback;
  }
}