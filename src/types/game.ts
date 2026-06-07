export type CellType = 'grass' | 'flower' | 'path' | 'mowed';

export type Direction = 'up' | 'down' | 'left' | 'right';

export type DecorationType = 'flowerbed' | 'swing' | 'bench' | 'fountain' | 'tree' | 'lamp';

export interface Cell {
  type: CellType;
  grassHeight: number;
  mowedRow: number | null;
  mowedCol: number | null;
  decoration?: DecorationType;
}

export interface Mower {
  x: number;
  y: number;
  direction: Direction;
}

export interface PathPoint {
  x: number;
  y: number;
  direction: Direction;
}

export interface OptimalPathResult {
  path: PathPoint[];
  totalSteps: number;
  turns: number;
}

export interface PathComparison {
  optimalSteps: number;
  userSteps: number;
  optimalTurns: number;
  userTurns: number;
  efficiency: number;
}

export type GameMode = 'playing' | 'completed' | 'garden';

export interface GameState {
  grid: Cell[][];
  mower: Mower;
  startTime: number;
  elapsedTime: number;
  completed: boolean;
  totalGrassCells: number;
  mowedCells: number;
  path: PathPoint[];
  mode: GameMode;
  showOptimalPath: boolean;
  optimalPath: OptimalPathResult | null;
  selectedDecoration: DecorationType | null;
}

export interface ScoreResult {
  time: number;
  completion: number;
  neatness: number;
  total: number;
  grade: string;
  pathComparison?: PathComparison;
}
