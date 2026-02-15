export interface JoystickVector {
  x: number;
  y: number;
  magnitude: number;
  active: boolean;
}

export class VirtualJoystick {
  private element: HTMLElement;
  private stick: HTMLElement;
  private pointerId: number | null = null;
  private center = { x: 0, y: 0 };
  private radius = 40;
  private vector: JoystickVector = { x: 0, y: 0, magnitude: 0, active: false };

  constructor(element: HTMLElement) {
    this.element = element;
    const stick = element.querySelector<HTMLElement>('.joystick-stick');
    if (!stick) throw new Error('Joystick stick element missing');
    this.stick = stick;

    this.element.addEventListener('pointerdown', (event) => this.onDown(event));
    this.element.addEventListener('pointermove', (event) => this.onMove(event));
    this.element.addEventListener('pointerup', (event) => this.onUp(event));
    this.element.addEventListener('pointercancel', (event) => this.onUp(event));
  }

  setEnabled(enabled: boolean): void {
    this.element.classList.toggle('hidden', !enabled);
    if (!enabled) {
      this.reset();
    } else {
      this.updateBounds();
    }
  }

  getVector(): JoystickVector {
    return this.vector;
  }

  updateBounds(): void {
    const rect = this.element.getBoundingClientRect();
    this.center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    this.radius = Math.max(30, rect.width * 0.36);
  }

  private onDown(event: PointerEvent): void {
    if (this.element.classList.contains('hidden')) return;
    this.pointerId = event.pointerId;
    this.element.setPointerCapture(event.pointerId);
    this.updateBounds();
    this.vector.active = true;
    this.updateVector(event.clientX, event.clientY);
    event.preventDefault();
  }

  private onMove(event: PointerEvent): void {
    if (this.pointerId !== event.pointerId) return;
    this.updateVector(event.clientX, event.clientY);
    event.preventDefault();
  }

  private onUp(event: PointerEvent): void {
    if (this.pointerId !== event.pointerId) return;
    this.pointerId = null;
    this.reset();
  }

  private updateVector(x: number, y: number): void {
    const dx = x - this.center.x;
    const dy = y - this.center.y;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, this.radius);
    const nx = dist === 0 ? 0 : dx / dist;
    const ny = dist === 0 ? 0 : dy / dist;
    this.vector = {
      x: nx * (clamped / this.radius),
      y: ny * (clamped / this.radius),
      magnitude: clamped / this.radius,
      active: true
    };
    this.stick.style.transform = `translate(${nx * clamped}px, ${ny * clamped}px)`;
  }

  private reset(): void {
    this.vector = { x: 0, y: 0, magnitude: 0, active: false };
    this.stick.style.transform = 'translate(0, 0)';
  }
}
