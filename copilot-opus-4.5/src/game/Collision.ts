import { MazeData, PlayerState, CollisionResult, Wall } from '../utils/types';
import { COLLISION_EPSILON, WALL_SLIDE_FACTOR } from '../utils/constants';

/**
 * Handles collision detection between player and maze walls
 * Uses AABB collision with wall segments
 */
export class CollisionSystem {
  private maze: MazeData;
  private cellSize: number;
  private wallThickness: number;

  constructor(maze: MazeData, cellSize: number, wallThickness: number) {
    this.maze = maze;
    this.cellSize = cellSize;
    this.wallThickness = wallThickness;
  }

  /** Check and resolve collision for player movement */
  checkCollision(
    player: PlayerState,
    newX: number,
    newY: number
  ): CollisionResult {
    let hitCount = 0;
    let finalX = newX;
    let finalY = newY;
    const radius = player.radius + COLLISION_EPSILON;

    // Get the cells the player could be touching
    const minCellX = Math.max(0, Math.floor((newX - radius) / this.cellSize));
    const maxCellX = Math.min(this.maze.width - 1, Math.floor((newX + radius) / this.cellSize));
    const minCellY = Math.max(0, Math.floor((newY - radius) / this.cellSize));
    const maxCellY = Math.min(this.maze.height - 1, Math.floor((newY + radius) / this.cellSize));

    // Check collision with outer boundaries
    const mazeWidth = this.maze.width * this.cellSize;
    const mazeHeight = this.maze.height * this.cellSize;

    if (finalX - radius < 0) {
      finalX = radius;
      hitCount++;
    }
    if (finalX + radius > mazeWidth) {
      finalX = mazeWidth - radius;
      hitCount++;
    }
    if (finalY - radius < 0) {
      finalY = radius;
      hitCount++;
    }
    if (finalY + radius > mazeHeight) {
      finalY = mazeHeight - radius;
      hitCount++;
    }

    // Check collision with each relevant cell's walls
    for (let cy = minCellY; cy <= maxCellY; cy++) {
      for (let cx = minCellX; cx <= maxCellX; cx++) {
        const cell = this.maze.cells[cy][cx];
        const cellLeft = cx * this.cellSize;
        const cellTop = cy * this.cellSize;
        const cellRight = cellLeft + this.cellSize;
        const cellBottom = cellTop + this.cellSize;

        // Check each wall
        const wallHalf = this.wallThickness / 2;

        // North wall
        if (cell.walls & Wall.NORTH) {
          const result = this.checkWallCollision(
            finalX, finalY, radius,
            cellLeft - wallHalf, cellTop - wallHalf,
            cellRight + wallHalf, cellTop + wallHalf
          );
          if (result.hit) {
            finalY = result.newY;
            hitCount++;
          }
        }

        // South wall
        if (cell.walls & Wall.SOUTH) {
          const result = this.checkWallCollision(
            finalX, finalY, radius,
            cellLeft - wallHalf, cellBottom - wallHalf,
            cellRight + wallHalf, cellBottom + wallHalf
          );
          if (result.hit) {
            finalY = result.newY;
            hitCount++;
          }
        }

        // West wall
        if (cell.walls & Wall.WEST) {
          const result = this.checkWallCollision(
            finalX, finalY, radius,
            cellLeft - wallHalf, cellTop - wallHalf,
            cellLeft + wallHalf, cellBottom + wallHalf
          );
          if (result.hit) {
            finalX = result.newX;
            hitCount++;
          }
        }

        // East wall
        if (cell.walls & Wall.EAST) {
          const result = this.checkWallCollision(
            finalX, finalY, radius,
            cellRight - wallHalf, cellTop - wallHalf,
            cellRight + wallHalf, cellBottom + wallHalf
          );
          if (result.hit) {
            finalX = result.newX;
            hitCount++;
          }
        }
      }
    }

    return {
      collided: hitCount > 0,
      newX: finalX,
      newY: finalY,
      hitCount: Math.min(hitCount, 1), // Count as single hit per frame
    };
  }

  /** Check collision with a wall segment (AABB) */
  private checkWallCollision(
    px: number,
    py: number,
    radius: number,
    wallLeft: number,
    wallTop: number,
    wallRight: number,
    wallBottom: number
  ): { hit: boolean; newX: number; newY: number } {
    // Find closest point on wall to circle center
    const closestX = Math.max(wallLeft, Math.min(px, wallRight));
    const closestY = Math.max(wallTop, Math.min(py, wallBottom));

    // Calculate distance
    const dx = px - closestX;
    const dy = py - closestY;
    const distSq = dx * dx + dy * dy;

    if (distSq < radius * radius) {
      // Collision! Push player out
      const dist = Math.sqrt(distSq);
      if (dist > 0) {
        const overlap = radius - dist;
        const nx = dx / dist;
        const ny = dy / dist;
        return {
          hit: true,
          newX: px + nx * overlap * WALL_SLIDE_FACTOR,
          newY: py + ny * overlap * WALL_SLIDE_FACTOR,
        };
      } else {
        // Player is exactly on the wall center, push up
        return {
          hit: true,
          newX: px,
          newY: py - radius,
        };
      }
    }

    return { hit: false, newX: px, newY: py };
  }

  /** Check if player reached the end zone */
  checkWin(player: PlayerState): boolean {
    const endCenterX = (this.maze.end.x + 0.5) * this.cellSize;
    const endCenterY = (this.maze.end.y + 0.5) * this.cellSize;
    const dx = player.x - endCenterX;
    const dy = player.y - endCenterY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const threshold = this.cellSize * 0.4;

    return dist < threshold;
  }
}
