// Input abstraction

export interface MovementInput {
  x: number; // -1 to 1
  y: number; // -1 to 1
}

export interface InputHandler {
  getMovement(): MovementInput;
  destroy(): void;
  reset(): void;
}