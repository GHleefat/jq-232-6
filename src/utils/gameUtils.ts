import type {
  Cell,
  GameState,
  Mower,
  PathPoint,
  ScoreResult,
  Direction,
  OptimalPathResult,
  PathComparison,
  DecorationType,
} from "../types/game";

export const GRID_ROWS = 16;
export const GRID_COLS = 20;
export const CELL_SIZE = 36;

export const DECORATION_INFO: Record<
  DecorationType,
  { name: string; emoji: string; color: string }
> = {
  flowerbed: { name: "花坛", emoji: "🌷", color: "#E91E63" },
  swing: { name: "秋千", emoji: "🎠", color: "#9C27B0" },
  bench: { name: "长椅", emoji: "🪑", color: "#795548" },
  fountain: { name: "喷泉", emoji: "⛲", color: "#2196F3" },
  tree: { name: "小树", emoji: "🌳", color: "#388E3C" },
  lamp: { name: "路灯", emoji: "💡", color: "#FFC107" },
};

export function createInitialGrid(): {
  grid: Cell[][];
  totalGrassCells: number;
  startX: number;
  startY: number;
} {
  const grid: Cell[][] = [];
  let totalGrassCells = 0;

  for (let y = 0; y < GRID_ROWS; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < GRID_COLS; x++) {
      row.push({
        type: "grass",
        grassHeight: 2 + Math.floor(Math.random() * 2),
        mowedRow: null,
        mowedCol: null,
      });
      totalGrassCells++;
    }
    grid.push(row);
  }

  const flowerPatterns = [
    { x: 3, y: 2, w: 3, h: 2 },
    { x: 14, y: 3, w: 3, h: 2 },
    { x: 8, y: 11, w: 4, h: 2 },
    { x: 2, y: 8, w: 2, h: 2 },
  ];

  flowerPatterns.forEach(({ x, y, w, h }) => {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < GRID_COLS && ny >= 0 && ny < GRID_ROWS) {
          if (grid[ny][nx].type === "grass") {
            grid[ny][nx].type = "flower";
            totalGrassCells--;
          }
        }
      }
    }
  });

  for (let x = 0; x < GRID_COLS; x++) {
    const y = 6;
    if (x < 6 || x > 11) {
      if (grid[y][x].type === "grass") {
        grid[y][x].type = "path";
        totalGrassCells--;
      }
    }
  }

  for (let y = 0; y < GRID_ROWS; y++) {
    const x = 10;
    if (y < 3 || y > 8) {
      if (grid[y][x].type === "grass") {
        grid[y][x].type = "path";
        totalGrassCells--;
      }
    }
  }

  let startX = 0;
  let startY = 0;
  outer: for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      if (grid[y][x].type === "grass") {
        startX = x;
        startY = y;
        break outer;
      }
    }
  }

  return { grid, totalGrassCells, startX, startY };
}

export function createInitialState(): GameState {
  const { grid, totalGrassCells, startX, startY } = createInitialGrid();
  const mower: Mower = {
    x: startX,
    y: startY,
    direction: "right",
  };

  const path: PathPoint[] = [{ x: startX, y: startY, direction: "right" }];

  const optimalPath = computeOptimalPath(grid, startX, startY);

  const initialGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
  if (initialGrid[startY][startX].type === "grass") {
    initialGrid[startY][startX].type = "mowed";
    initialGrid[startY][startX].grassHeight = 0;
    initialGrid[startY][startX].mowedRow = startY;
    initialGrid[startY][startX].mowedCol = startX;
  }

  return {
    grid: initialGrid,
    mower,
    startTime: Date.now(),
    elapsedTime: 0,
    completed: false,
    totalGrassCells,
    mowedCells: 1,
    path,
    mode: "playing",
    showOptimalPath: false,
    optimalPath,
    selectedDecoration: null,
  };
}

export function canMoveTo(grid: Cell[][], x: number, y: number): boolean {
  if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) return false;
  const cell = grid[y][x];
  return cell.type !== "flower" && cell.type !== "path";
}

export function getDirectionDelta(direction: Direction): {
  dx: number;
  dy: number;
} {
  switch (direction) {
    case "up":
      return { dx: 0, dy: -1 };
    case "down":
      return { dx: 0, dy: 1 };
    case "left":
      return { dx: -1, dy: 0 };
    case "right":
      return { dx: 1, dy: 0 };
  }
}

export function calculateNeatness(path: PathPoint[]): number {
  if (path.length < 2) return 100;

  let straightSegments = 0;
  const totalSegments = path.length - 1;

  for (let i = 1; i < path.length; i++) {
    if (path[i].direction === path[i - 1].direction) {
      straightSegments++;
    }
  }

  return Math.round((straightSegments / totalSegments) * 100);
}

export function calculateTurns(path: PathPoint[]): number {
  if (path.length < 2) return 0;
  let turns = 0;
  for (let i = 1; i < path.length; i++) {
    if (path[i].direction !== path[i - 1].direction) {
      turns++;
    }
  }
  return turns;
}

function isWalkable(grid: Cell[][], x: number, y: number): boolean {
  if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) return false;
  const cell = grid[y][x];
  return cell.type !== "flower" && cell.type !== "path";
}

function bfsPath(
  grid: Cell[][],
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): { x: number; y: number; direction: Direction }[] | null {
  const queue: {
    x: number;
    y: number;
    path: { x: number; y: number; direction: Direction }[];
  }[] = [{ x: fromX, y: fromY, path: [] }];
  const visited = new Set<string>();
  visited.add(`${fromX},${fromY}`);

  const directions: Direction[] = ["right", "down", "left", "up"];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.x === toX && current.y === toY) {
      return current.path;
    }
    for (const d of directions) {
      const { dx, dy } = getDirectionDelta(d);
      const nx = current.x + dx;
      const ny = current.y + dy;
      const key = `${nx},${ny}`;
      if (!visited.has(key) && isWalkable(grid, nx, ny)) {
        visited.add(key);
        queue.push({
          x: nx,
          y: ny,
          path: [...current.path, { x: nx, y: ny, direction: d }],
        });
      }
    }
  }
  return null;
}

export function computeOptimalPath(
  grid: Cell[][],
  startX: number,
  startY: number,
): OptimalPathResult {
  const path: PathPoint[] = [{ x: startX, y: startY, direction: "right" }];
  const visited = new Set<string>();
  visited.add(`${startX},${startY}`);

  let currentX = startX;
  let currentY = startY;
  let direction: Direction = "right";

  const grassCells: { x: number; y: number }[] = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      if (isWalkable(grid, x, y)) {
        grassCells.push({ x, y });
      }
    }
  }

  const totalToVisit = grassCells.length;

  while (visited.size < totalToVisit) {
    const { dx, dy } = getDirectionDelta(direction);
    const nextX = currentX + dx;
    const nextY = currentY + dy;
    const key = `${nextX},${nextY}`;

    if (
      nextX >= 0 &&
      nextX < GRID_COLS &&
      nextY >= 0 &&
      nextY < GRID_ROWS &&
      !visited.has(key) &&
      isWalkable(grid, nextX, nextY)
    ) {
      path.push({ x: nextX, y: nextY, direction });
      visited.add(key);
      currentX = nextX;
      currentY = nextY;
    } else {
      const order: Direction[] = ["right", "down", "left", "up"];
      let found = false;
      for (const d of order) {
        if (d === direction) continue;
        const delta = getDirectionDelta(d);
        const nx = currentX + delta.dx;
        const ny = currentY + delta.dy;
        const nkey = `${nx},${ny}`;
        if (
          nx >= 0 &&
          nx < GRID_COLS &&
          ny >= 0 &&
          ny < GRID_ROWS &&
          !visited.has(nkey) &&
          isWalkable(grid, nx, ny)
        ) {
          direction = d;
          found = true;
          break;
        }
      }
      if (!found) {
        let nearest: { x: number; y: number; dist: number } | null = null;
        for (const gc of grassCells) {
          const gkey = `${gc.x},${gc.y}`;
          if (!visited.has(gkey)) {
            const dist = Math.abs(gc.x - currentX) + Math.abs(gc.y - currentY);
            if (!nearest || dist < nearest.dist) {
              nearest = { x: gc.x, y: gc.y, dist };
            }
          }
        }
        if (!nearest) break;
        const route = bfsPath(grid, currentX, currentY, nearest.x, nearest.y);
        if (route && route.length > 0) {
          for (const step of route) {
            path.push(step);
            visited.add(`${step.x},${step.y}`);
            direction = step.direction;
          }
          currentX = nearest.x;
          currentY = nearest.y;
        } else {
          break;
        }
      }
    }
  }

  return {
    path,
    totalSteps: path.length,
    turns: calculateTurns(path),
  };
}

export function comparePaths(
  userPath: PathPoint[],
  optimalPath: OptimalPathResult,
): PathComparison {
  const userSteps = userPath.length;
  const userTurns = calculateTurns(userPath);
  const optimalSteps = optimalPath.totalSteps;
  const optimalTurns = optimalPath.turns;

  const stepRatio = optimalSteps / Math.max(1, userSteps);
  const turnRatio = optimalTurns / Math.max(1, userTurns);
  const efficiency = Math.round(
    Math.min(100, (stepRatio * 0.6 + turnRatio * 0.4) * 100),
  );

  return {
    optimalSteps,
    userSteps,
    optimalTurns,
    userTurns,
    efficiency,
  };
}

export function calculateScore(state: GameState): ScoreResult {
  const completion = Math.round(
    (state.mowedCells / state.totalGrassCells) * 100,
  );
  const neatness = calculateNeatness(state.path);
  const time = Math.round(state.elapsedTime / 1000);

  const timeScore = Math.max(0, 100 - Math.floor(time / 3));
  let total = Math.round(completion * 0.4 + neatness * 0.35 + timeScore * 0.25);

  let pathComparison: PathComparison | undefined;
  if (state.optimalPath) {
    pathComparison = comparePaths(state.path, state.optimalPath);
    total = Math.round(total * 0.7 + pathComparison.efficiency * 0.3);
  }

  let grade = "D";
  if (total >= 90) grade = "S";
  else if (total >= 80) grade = "A";
  else if (total >= 70) grade = "B";
  else if (total >= 60) grade = "C";

  return { time, completion, neatness, total, grade, pathComparison };
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function canPlaceDecoration(
  grid: Cell[][],
  x: number,
  y: number,
): boolean {
  if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) return false;
  const cell = grid[y][x];
  return cell.type === "mowed" && !cell.decoration;
}

export function placeDecoration(
  grid: Cell[][],
  x: number,
  y: number,
  decoration: DecorationType,
): Cell[][] {
  if (!canPlaceDecoration(grid, x, y)) return grid;
  const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
  newGrid[y][x].decoration = decoration;
  return newGrid;
}

export function removeDecoration(
  grid: Cell[][],
  x: number,
  y: number,
): Cell[][] {
  if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) return grid;
  const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
  if (newGrid[y][x].decoration) {
    delete newGrid[y][x].decoration;
  }
  return newGrid;
}
