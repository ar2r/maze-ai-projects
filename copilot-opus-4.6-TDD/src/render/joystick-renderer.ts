import { COLORS } from './maze-renderer';

/**
 * Render the virtual joystick (shown on touch devices when active).
 */
export function renderJoystick(
  ctx: CanvasRenderingContext2D,
  baseX: number,
  baseY: number,
  knobX: number,
  knobY: number,
  dpr: number,
): void {
  const bx = baseX * dpr;
  const by = baseY * dpr;
  const kx = knobX * dpr;
  const ky = knobY * dpr;
  const baseRadius = 50 * dpr;
  const knobRadius = 20 * dpr;

  ctx.save();

  // Base circle (semi-transparent)
  ctx.fillStyle = COLORS.joystickBase;
  ctx.beginPath();
  ctx.arc(bx, by, baseRadius, 0, Math.PI * 2);
  ctx.fill();

  // Base border
  ctx.strokeStyle = 'rgba(76, 201, 240, 0.4)';
  ctx.lineWidth = 2 * dpr;
  ctx.stroke();

  // Knob
  ctx.fillStyle = COLORS.joystickKnob;
  ctx.beginPath();
  ctx.arc(kx, ky, knobRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
