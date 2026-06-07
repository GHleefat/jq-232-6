import { useGameLogic } from "../hooks/useGameLogic";
import { GameCanvas } from "./GameCanvas";
import { ControlTips } from "./ControlTips";
import { StatusBar } from "./StatusBar";
import { CompletionPanel } from "./CompletionPanel";
import { Leaf } from "lucide-react";

export function GameContainer() {
  const {
    gameState,
    score,
    moveMower,
    resetGame,
    formattedTime,
    completionPercent,
    toggleOptimalPath,
    enterGardenMode,
    exitGardenMode,
    selectDecoration,
    handleCanvasClick,
  } = useGameLogic();

  return (
    <div className={`min-h-screen py-6 px-4 transition-colors duration-500 ${
      gameState.mode === "garden"
        ? "bg-gradient-to-br from-purple-100 via-fuchsia-50 to-pink-100"
        : "bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100"
    }`}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <div className={`inline-flex items-center gap-2 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border mb-4 ${
            gameState.mode === "garden"
              ? "bg-white/80 border-purple-200"
              : "bg-white/80 border-green-200"
          }`}>
            <Leaf className={`w-6 h-6 ${
              gameState.mode === "garden" ? "text-purple-600" : "text-green-600"
            }`} />
            <h1 className={`text-3xl font-black bg-clip-text text-transparent ${
              gameState.mode === "garden"
                ? "bg-gradient-to-r from-purple-600 to-fuchsia-600"
                : "bg-gradient-to-r from-green-600 to-emerald-600"
            }`}>
              {gameState.mode === "garden" ? "庭院设计师" : "快乐割草机"}
            </h1>
            <Leaf className={`w-6 h-6 ${
              gameState.mode === "garden" ? "text-purple-600" : "text-green-600"
            }`} />
          </div>
          <p className={`font-medium ${
            gameState.mode === "garden"
              ? "text-purple-700/80"
              : "text-green-700/80"
          }`}>
            {gameState.mode === "garden"
              ? "用精美的装饰物点缀你的完美庭院 🌸"
              : "推着割草机走出整齐纹路，享受修剪的极致舒适感 🌿"}
          </p>
        </div>

        <div className="mb-5">
          <StatusBar
            time={formattedTime}
            completion={completionPercent}
            mode={gameState.mode}
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
          <div className="flex-shrink-0">
            <GameCanvas
              gameState={gameState}
              onCellClick={gameState.mode === "garden" ? handleCanvasClick : undefined}
            />
          </div>

          <div className="w-full lg:w-64">
            <ControlTips
              onMove={moveMower}
              showOptimalPath={gameState.showOptimalPath}
              onToggleOptimalPath={toggleOptimalPath}
              mode={gameState.mode}
              selectedDecoration={gameState.selectedDecoration}
              onSelectDecoration={selectDecoration}
              onExitGarden={exitGardenMode}
            />
          </div>
        </div>

        <div className={`mt-6 text-center text-sm ${
          gameState.mode === "garden"
            ? "text-purple-700/60"
            : "text-green-700/60"
        }`}>
          {gameState.mode === "garden" ? (
            <p>💡 小提示：选择装饰物后点击草地放置，再次点击可移除装饰</p>
          ) : (
            <p>💡 小提示：尽量保持直线行驶，可以获得更高的整齐度评分哦！</p>
          )}
        </div>
      </div>

      {gameState.mode === "completed" && score && (
        <CompletionPanel
          score={score}
          onRestart={resetGame}
          onEnterGarden={enterGardenMode}
        />
      )}
    </div>
  );
}
