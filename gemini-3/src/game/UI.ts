export class UI {
  private container: HTMLElement;
  private onStart: () => void;
  private onNext: () => void;
  private onRetry: () => void;

  constructor(
    container: HTMLElement, 
    callbacks: { onStart: () => void; onNext: () => void; onRetry: () => void }
  ) {
    this.container = container;
    this.onStart = callbacks.onStart;
    this.onNext = callbacks.onNext;
    this.onRetry = callbacks.onRetry;
  }

  public showMenu(level: number, bestTime: number | null) {
    this.container.innerHTML = `
      <div class="menu-card">
        <h1>Neon Maze</h1>
        <p>Current Level: ${level}</p>
        ${bestTime ? `<p>Best Time: ${bestTime.toFixed(2)}s</p>` : ''}
        <button class="btn" id="start-btn">${level === 1 ? 'START GAME' : 'CONTINUE'}</button>
        <button class="btn" id="settings-btn">SETTINGS</button>
      </div>
    `;
    document.getElementById('start-btn')?.addEventListener('click', () => this.onStart());
    document.getElementById('settings-btn')?.addEventListener('click', () => this.showSettings());
  }

  public showSettings() {
    const isDebug = document.getElementById('debug-overlay')?.style.display !== 'none';
    this.container.innerHTML = `
      <div class="menu-card">
        <h1>Settings</h1>
        <button class="btn" id="toggle-debug">DEBUG OVERLAY: ${isDebug ? 'ON' : 'OFF'}</button>
        <button class="btn" id="reset-progress">RESET PROGRESS</button>
        <button class="btn" id="back-btn">BACK</button>
      </div>
    `;
    
    document.getElementById('toggle-debug')?.addEventListener('click', () => {
        const overlay = document.getElementById('debug-overlay')!;
        overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
        this.showSettings();
    });

    document.getElementById('reset-progress')?.addEventListener('click', () => {
        localStorage.clear();
        location.reload();
    });

    document.getElementById('back-btn')?.addEventListener('click', () => {
        const progress = JSON.parse(localStorage.getItem('maze-progress') || '{"level": 1, "bestTimes": {}}');
        this.showMenu(progress.level, progress.bestTimes[progress.level] || null);
    });
  }

  public showWin(time: number, collisions: number) {
    this.container.innerHTML = `
      <div class="menu-card">
        <h1 style="color: var(--finish-color)">LEVEL CLEAR!</h1>
        <div style="margin: 1rem 0; text-align: left; display: inline-block;">
            <p>Time: <b>${time.toFixed(2)}s</b></p>
            <p>Collisions: <b>${collisions}</b></p>
        </div>
        <button class="btn" id="next-btn">NEXT LEVEL</button>
        <button class="btn" id="retry-btn">RETRY</button>
      </div>
    `;
    document.getElementById('next-btn')?.addEventListener('click', () => this.onNext());
    document.getElementById('retry-btn')?.addEventListener('click', () => this.onRetry());
  }

  public clear() {
    this.container.innerHTML = '';
  }
}
