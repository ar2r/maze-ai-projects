// Debug overlay for development

export class DebugOverlay {
  private element: HTMLElement | null = null;
  private visible: boolean = false;

  constructor() {
    this.element = document.getElementById('debug-overlay');
  }

  toggle(): void {
    if (!this.element) {
      this.createElement();
    }

    this.visible = !this.visible;
    if (this.element) {
      this.element.classList.toggle('hidden', !this.visible);
    }
  }

  private createElement(): void {
    this.element = document.createElement('div');
    this.element.id = 'debug-overlay';
    this.element.className = 'hidden';
    document.body.appendChild(this.element);
  }

  update(data: Record<string, any>): void {
    if (!this.element || !this.visible) return;

    this.element.innerHTML = Object.entries(data)
      .map(([key, value]) => `<div>${key}: ${value}</div>`)
      .join('');
  }
}