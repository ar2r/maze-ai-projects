import { Maze, Direction } from './MazeGenerator';
import { Rect, Vec2, clamp } from '../utils/math';

export class PhysicsEngine {
  private maze: Maze;
  private cellSize: number;
  private wallThickness: number;

  constructor(maze: Maze, cellSize: number, wallThickness: number) {
    this.maze = maze;
    this.cellSize = cellSize;
    this.wallThickness = wallThickness;
  }

  // Resolve collision for a circle at (x, y) with radius r
  // Returns the corrected position
  public resolveCollision(pos: Vec2, r: number): Vec2 {
    let newPos = { ...pos };

    // Determine which cell we are in
    const cellX = Math.floor(newPos.x / this.cellSize);
    const cellY = Math.floor(newPos.y / this.cellSize);

    // Check cells around the player (3x3 grid) to handle corners/edges
    // Actually, just checking current cell's walls and neighbors might be enough?
    // Let's check the current cell and its immediate neighbors.

    const range = 1;
    for (let dy = -range; dy <= range; dy++) {
      for (let dx = -range; dx <= range; dx++) {
        const cx = cellX + dx;
        const cy = cellY + dy;

        if (cx >= 0 && cx < this.maze.width && cy >= 0 && cy < this.maze.height) {
            this.resolveCellCollision(newPos, r, cx, cy);
        }
      }
    }
    
    // Bounds check (outer edges of the maze world)
    newPos.x = clamp(newPos.x, r, this.maze.width * this.cellSize - r);
    newPos.y = clamp(newPos.y, r, this.maze.height * this.cellSize - r);

    return newPos;
  }

  private resolveCellCollision(pos: Vec2, r: number, cx: number, cy: number) {
    const cell = this.maze.grid[cy][cx];
    const x = cx * this.cellSize;
    const y = cy * this.cellSize;
    const s = this.cellSize;
    const w = this.wallThickness; // Half thickness actually? No, let's treat walls as blocks.

    // Walls are "between" cells? Or are walls "inside" the cell structure?
    // In our maze gen, walls are abstract.
    // Let's define physical walls:
    // If a cell has a North wall, there is a rect at the top edge.
    // But walls are shared. N wall of (x,y) is S wall of (x,y-1).
    // To avoid duplication, we can only check N and W walls of every cell, 
    // plus S wall of last row and E wall of last column.
    
    // Easier approach: Check walls of the specific cell 'cell' we are iterating.
    // If 'cell' has N wall, create a rect for it and collide.

    const wallDepth = w; // Thickness of the wall visual

    if (cell.walls & Direction.N) {
       this.collideWithRect(pos, r, { x: x, y: y, w: s, h: wallDepth });
    }
    if (cell.walls & Direction.S) {
       this.collideWithRect(pos, r, { x: x, y: y + s - wallDepth, w: s, h: wallDepth });
    }
    if (cell.walls & Direction.W) {
       this.collideWithRect(pos, r, { x: x, y: y, w: wallDepth, h: s });
    }
    if (cell.walls & Direction.E) {
       this.collideWithRect(pos, r, { x: x + s - wallDepth, y: y, w: wallDepth, h: s });
    }
    
    // Also need to handle "corners" if walls are thin lines. 
    // If walls are thick blocks (like in Pacman), the above is good.
    // Let's assume walls have thickness.
  }

  private collideWithRect(pos: Vec2, r: number, rect: Rect) {
    // Closest point on rect to circle center
    const closestX = clamp(pos.x, rect.x, rect.x + rect.w);
    const closestY = clamp(pos.y, rect.y, rect.y + rect.h);

    const dx = pos.x - closestX;
    const dy = pos.y - closestY;
    const distSq = dx * dx + dy * dy;

    if (distSq < r * r && distSq > 0) {
      const dist = Math.sqrt(distSq);
      const overlap = r - dist;
      
      // Normalize
      const nx = dx / dist;
      const ny = dy / dist;

      // Push back
      pos.x += nx * overlap;
      pos.y += ny * overlap;
    }
  }
}
