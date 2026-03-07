// Collision detection and resolution

import { Maze, Player, Position, CollisionResult } from './types';

export class CollisionSystem {
  private wallThickness: number = 4;

  checkPlayerWallCollision(player: Player, maze: Maze): CollisionResult {
    const result: CollisionResult = {
      collided: false,
      correctionX: 0,
      correctionY: 0,
      wallHit: false
    };

    // Get all cells that might intersect with player
    const minCellX = Math.max(0, Math.floor((player.x - player.radius) / maze.cellSize));
    const maxCellX = Math.min(maze.width - 1, Math.floor((player.x + player.radius) / maze.cellSize));
    const minCellY = Math.max(0, Math.floor((player.y - player.radius) / maze.cellSize));
    const maxCellY = Math.min(maze.height - 1, Math.floor((player.y + player.radius) / maze.cellSize));

    let totalCorrectionX = 0;
    let totalCorrectionY = 0;
    let wallHit = false;

    for (let cy = minCellY; cy <= maxCellY; cy++) {
      for (let cx = minCellX; cx <= maxCellX; cx++) {
        const cell = maze.cells[cy][cx];
        const cellX = cx * maze.cellSize;
        const cellY = cy * maze.cellSize;

        // Check each wall
        if (cell.walls.north) {
          const correction = this.checkWallCollision(
            player, cellX, cellY, cellX + maze.cellSize, cellY, 'horizontal'
          );
          if (correction.hit) {
            wallHit = true;
            totalCorrectionY = Math.max(totalCorrectionY, correction.correction);
          }
        }

        if (cell.walls.south) {
          const correction = this.checkWallCollision(
            player, cellX, cellY + maze.cellSize, cellX + maze.cellSize, cellY + maze.cellSize, 'horizontal'
          );
          if (correction.hit) {
            wallHit = true;
            totalCorrectionY = Math.min(totalCorrectionY, correction.correction);
          }
        }

        if (cell.walls.west) {
          const correction = this.checkWallCollision(
            player, cellX, cellY, cellX, cellY + maze.cellSize, 'vertical'
          );
          if (correction.hit) {
            wallHit = true;
            totalCorrectionX = Math.max(totalCorrectionX, correction.correction);
          }
        }

        if (cell.walls.east) {
          const correction = this.checkWallCollision(
            player, cellX + maze.cellSize, cellY, cellX + maze.cellSize, cellY + maze.cellSize, 'vertical'
          );
          if (correction.hit) {
            wallHit = true;
            totalCorrectionX = Math.min(totalCorrectionX, correction.correction);
          }
        }
      }
    }

    // Check boundary walls
    const boundaryCorrection = this.checkBoundaryCollision(player, maze);
    if (boundaryCorrection.hit) {
      wallHit = true;
      totalCorrectionX += boundaryCorrection.correctionX;
      totalCorrectionY += boundaryCorrection.correctionY;
    }

    if (wallHit) {
      result.collided = true;
      result.wallHit = true;
      result.correctionX = totalCorrectionX;
      result.correctionY = totalCorrectionY;
    }

    return result;
  }

  private checkWallCollision(
    player: Player,
    x1: number, y1: number,
    x2: number, y2: number,
    orientation: 'horizontal' | 'vertical'
  ): { hit: boolean; correction: number } {
    // For horizontal wall (y is constant), for vertical wall (x is constant)
    if (orientation === 'horizontal') {
      const wallY = y1;
      if (Math.abs(player.y - wallY) < player.radius + this.wallThickness / 2) {
        if (player.x >= Math.min(x1, x2) - player.radius && player.x <= Math.max(x1, x2) + player.radius) {
          const penetration = player.radius + this.wallThickness / 2 - Math.abs(player.y - wallY);
          if (player.y < wallY) {
            return { hit: true, correction: -penetration };
          } else {
            return { hit: true, correction: penetration };
          }
        }
      }
    } else {
      const wallX = x1;
      if (Math.abs(player.x - wallX) < player.radius + this.wallThickness / 2) {
        if (player.y >= Math.min(y1, y2) - player.radius && player.y <= Math.max(y1, y2) + player.radius) {
          const penetration = player.radius + this.wallThickness / 2 - Math.abs(player.x - wallX);
          if (player.x < wallX) {
            return { hit: true, correction: -penetration };
          } else {
            return { hit: true, correction: penetration };
          }
        }
      }
    }

    return { hit: false, correction: 0 };
  }

  private checkBoundaryCollision(player: Player, maze: Maze): { hit: boolean; correctionX: number; correctionY: number } {
    let correctionX = 0;
    let correctionY = 0;
    let hit = false;

    const mazeWidth = maze.width * maze.cellSize;
    const mazeHeight = maze.height * maze.cellSize;

    if (player.x - player.radius < 0) {
      correctionX = -(player.x - player.radius);
      hit = true;
    }
    if (player.x + player.radius > mazeWidth) {
      correctionX = mazeWidth - player.x - player.radius;
      hit = true;
    }
    if (player.y - player.radius < 0) {
      correctionY = -(player.y - player.radius);
      hit = true;
    }
    if (player.y + player.radius > mazeHeight) {
      correctionY = mazeHeight - player.y - player.radius;
      hit = true;
    }

    return { hit, correctionX, correctionY };
  }

  resolveCollision(player: Player, collision: CollisionResult): Position {
    return {
      x: player.x + collision.correctionX,
      y: player.y + collision.correctionY
    };
  }

  // Check if player reached the exit
  checkWin(player: Player, maze: Maze): boolean {
    const dx = player.x - maze.endX;
    const dy = player.y - maze.endY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < player.radius + maze.cellSize / 3;
  }
}