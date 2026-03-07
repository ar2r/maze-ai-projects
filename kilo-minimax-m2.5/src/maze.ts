export interface Cell {
  x: number;
  y: number;
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
  visited: boolean;
}

export interface Maze {
  cells: Cell[][];
  width: number;
  height: number;
  startCell: Cell;
  endCell: Cell;
}

function getSeed(level: number, timestamp: number): number {
  return level * 12345 + timestamp;
}

function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

function shuffle<T>(array: T[], random: () => number): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getGridSize(level: number): number {
  return Math.min(5 + Math.floor(level * 0.8), 25);
}

export function generateMaze(level: number, timestamp: number = Date.now()): Maze {
  const gridSize = getGridSize(level);
  const width = gridSize;
  const height = gridSize;

  const cells: Cell[][] = [];
  for (let y = 0; y < height; y++) {
    cells[y] = [];
    for (let x = 0; x < width; x++) {
      cells[y][x] = {
        x,
        y,
        walls: { top: true, right: true, bottom: true, left: true },
        visited: false
      };
    }
  }

  const seed = getSeed(level, timestamp);
  const random = seededRandom(seed);

  const stack: Cell[] = [];
  const startCell = cells[0][0];
  startCell.visited = true;
  stack.push(startCell);

  const directions = [
    { dx: 0, dy: -1, wall: 'top' as const, opposite: 'bottom' as const },
    { dx: 1, dy: 0, wall: 'right' as const, opposite: 'left' as const },
    { dx: 0, dy: 1, wall: 'bottom' as const, opposite: 'top' as const },
    { dx: -1, dy: 0, wall: 'left' as const, opposite: 'right' as const }
  ];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors: { cell: Cell; dir: typeof directions[0] }[] = [];

    for (const dir of directions) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && !cells[ny][nx].visited) {
        neighbors.push({ cell: cells[ny][nx], dir });
      }
    }

    if (neighbors.length > 0) {
      const shuffled = shuffle(neighbors, random);
      const next = shuffled[0];
      current.walls[next.dir.wall] = false;
      next.cell.walls[next.dir.opposite] = false;
      next.cell.visited = true;
      stack.push(next.cell);
    } else {
      stack.pop();
    }
  }

  const endCell = cells[height - 1][width - 1];

  return { cells, width, height, startCell, endCell };
}

export function verifyMazeConnectivity(maze: Maze): boolean {
  const visited = new Set<string>();
  const queue: Cell[] = [maze.startCell];
  visited.add(`${maze.startCell.x},${maze.startCell.y}`);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === maze.endCell) return true;

    const neighbors = getAccessibleNeighbors(current, maze);
    for (const neighbor of neighbors) {
      const key = `${neighbor.x},${neighbor.y}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push(neighbor);
      }
    }
  }

  return false;
}

function getAccessibleNeighbors(cell: Cell, maze: Maze): Cell[] {
  const neighbors: Cell[] = [];
  const { x, y, walls } = cell;

  if (!walls.top && y > 0) neighbors.push(maze.cells[y - 1][x]);
  if (!walls.bottom && y < maze.height - 1) neighbors.push(maze.cells[y + 1][x]);
  if (!walls.left && x > 0) neighbors.push(maze.cells[y][x - 1]);
  if (!walls.right && x < maze.width - 1) neighbors.push(maze.cells[y][x + 1]);

  return neighbors;
}
