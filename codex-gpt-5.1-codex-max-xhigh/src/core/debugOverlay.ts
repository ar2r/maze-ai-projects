export type DebugStats = {
  fps: number;
  seed: number;
  grid: string;
  player: { x: number; y: number };
  collisions: number;
};

export class DebugOverlay {
  private el: HTMLDivElement;
  private enabled: boolean;

  constructor(root: HTMLElement, enabled: boolean) {
    this.enabled = enabled;
    this.el = document.createElement('div');
    this.el.id = 'debug-overlay';
    if (enabled) root.appendChild(this.el);
  }

  setEnabled(value: boolean) {
    if (this.enabled === value) return;
    this.enabled = value;
    if (value) {
      document.body.appendChild(this.el);
    } else if (this.el.parentElement) {
      this.el.parentElement.removeChild(this.el);
    }
  }

  render(stats: DebugStats) {
    if (!this.enabled) return;
    const { fps, seed, grid, player, collisions } = stats;
    this.el.textContent = `FPS: ${fps.toFixed(1)}\nSeed: ${seed}\nGrid: ${grid}\nPlayer: ${player.x.toFixed(2)}, ${player.y.toFixed(2)}\nCollisions: ${collisions}`;
  }
}
