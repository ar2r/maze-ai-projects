export type Direction = 0 | 1 | 2 | 3;

export interface Cell {
  walls: [boolean, boolean, boolean, boolean];
  visited: boolean;
}

export interface Maze {
  cols: number;
  rows: number;
  cells: Cell[][];
  start: { x: number; y: number };
  finish: { x: number; y: number };
  seed: number;
  loopChance: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface LevelConfig {
  cols: number;
  rows: number;
  wallThickness: number; // in cell units (0..1)
  loopChance: number;
}

export interface Layout {
  cellSizePx: number;
  offsetX: number;
  offsetY: number;
  wallThickness: number; // in cell units
}

export interface PlayerState {
  pos: Point; // in cell units
  radius: number; // in cell units
}
