import { useState, useEffect, useCallback, useRef } from "react";
import type { GameState, Direction, DecorationType } from "../types/game";
import {
  createInitialState,
  canMoveTo,
  getDirectionDelta,
  calculateScore,
  formatTime,
  placeDecoration as placeDecoUtil,
  removeDecoration as removeDecoUtil,
  canPlaceDecoration,
} from "../utils/gameUtils";
import type { ScoreResult } from "../types/game";

export function useGameLogic() {
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialState(),
  );
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!gameState.completed && gameState.mode === "playing") {
      timerRef.current = window.setInterval(() => {
        setGameState((prev) => ({
          ...prev,
          elapsedTime: Date.now() - prev.startTime,
        }));
      }, 100);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState.completed, gameState.mode]);

  const moveMower = useCallback((direction: Direction) => {
    setGameState((prev) => {
      if (prev.completed || prev.mode !== "playing") return prev;

      const { dx, dy } = getDirectionDelta(direction);
      const newX = prev.mower.x + dx;
      const newY = prev.mower.y + dy;

      if (!canMoveTo(prev.grid, newX, newY)) {
        return {
          ...prev,
          mower: { ...prev.mower, direction },
        };
      }

      const newGrid = prev.grid.map((row) => row.map((cell) => ({ ...cell })));
      let newMowedCells = prev.mowedCells;

      const targetCell = newGrid[newY][newX];
      if (targetCell.type === "grass") {
        newGrid[newY][newX] = {
          ...targetCell,
          type: "mowed",
          grassHeight: 0,
          mowedRow: newY,
          mowedCol: newX,
        };
        newMowedCells++;
      }

      const newPath = [...prev.path, { x: newX, y: newY, direction }];
      const isCompleted = newMowedCells >= prev.totalGrassCells;

      return {
        ...prev,
        grid: newGrid,
        mower: { x: newX, y: newY, direction },
        mowedCells: newMowedCells,
        path: newPath,
        completed: isCompleted,
        mode: isCompleted ? "completed" : prev.mode,
        elapsedTime: isCompleted
          ? Date.now() - prev.startTime
          : prev.elapsedTime,
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setGameState(createInitialState());
  }, []);

  const toggleOptimalPath = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      showOptimalPath: !prev.showOptimalPath,
    }));
  }, []);

  const enterGardenMode = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      mode: "garden",
      completed: true,
    }));
  }, []);

  const exitGardenMode = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      mode: prev.completed ? "completed" : "playing",
      selectedDecoration: null,
    }));
  }, []);

  const selectDecoration = useCallback((decoration: DecorationType | null) => {
    setGameState((prev) => ({
      ...prev,
      selectedDecoration: decoration,
    }));
  }, []);

  const handleCanvasClick = useCallback((x: number, y: number) => {
    setGameState((prev) => {
      if (prev.mode !== "garden") return prev;

      const cell = prev.grid[y]?.[x];
      if (!cell) return prev;

      if (cell.decoration) {
        return {
          ...prev,
          grid: removeDecoUtil(prev.grid, x, y),
        };
      }

      if (prev.selectedDecoration && canPlaceDecoration(prev.grid, x, y)) {
        return {
          ...prev,
          grid: placeDecoUtil(prev.grid, x, y, prev.selectedDecoration),
        };
      }

      return prev;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.mode === "garden") return;

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          moveMower("up");
          break;
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          moveMower("down");
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault();
          moveMower("left");
          break;
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault();
          moveMower("right");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moveMower, gameState.mode]);

  const score: ScoreResult | null =
    gameState.completed || gameState.mode === "garden"
      ? calculateScore(gameState)
      : null;

  return {
    gameState,
    score,
    moveMower,
    resetGame,
    formattedTime: formatTime(gameState.elapsedTime),
    completionPercent: Math.round(
      (gameState.mowedCells / gameState.totalGrassCells) * 100,
    ),
    toggleOptimalPath,
    enterGardenMode,
    exitGardenMode,
    selectDecoration,
    handleCanvasClick,
  };
}
