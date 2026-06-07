import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Route, Flower2, X } from "lucide-react";
import type { DecorationType, GameMode } from "../types/game";
import { DECORATION_INFO } from "../utils/gameUtils";

interface ControlTipsProps {
  onMove?: (direction: "up" | "down" | "left" | "right") => void;
  showOptimalPath?: boolean;
  onToggleOptimalPath?: () => void;
  mode?: GameMode;
  selectedDecoration?: DecorationType | null;
  onSelectDecoration?: (decoration: DecorationType | null) => void;
  onExitGarden?: () => void;
}

const DECORATION_TYPES: DecorationType[] = [
  "flowerbed",
  "swing",
  "bench",
  "fountain",
  "tree",
  "lamp",
];

export function ControlTips({
  onMove,
  showOptimalPath,
  onToggleOptimalPath,
  mode = "playing",
  selectedDecoration,
  onSelectDecoration,
  onExitGarden,
}: ControlTipsProps) {
  const handleClick = (direction: "up" | "down" | "left" | "right") => {
    onMove?.(direction);
  };

  if (mode === "garden") {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-purple-800 flex items-center gap-2">
            <Flower2 className="w-5 h-5" />
            庭院设计
          </h3>
          <button
            onClick={onExitGarden}
            className="p-2 hover:bg-purple-100 rounded-xl transition-colors"
            title="退出设计模式"
          >
            <X className="w-5 h-5 text-purple-600" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          选择装饰物后点击空地放置，点击已有装饰可移除
        </p>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {DECORATION_TYPES.map((type) => {
            const info = DECORATION_INFO[type];
            const isSelected = selectedDecoration === type;
            return (
              <button
                key={type}
                onClick={() => onSelectDecoration?.(isSelected ? null : type)}
                className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                  isSelected
                    ? "bg-purple-500 text-white shadow-md scale-105"
                    : "bg-purple-50 hover:bg-purple-100 text-gray-700"
                }`}
              >
                <span className="text-2xl">{info.emoji}</span>
                <span className="text-xs font-medium">{info.name}</span>
              </button>
            );
          })}
        </div>

        {selectedDecoration && (
          <div className="bg-purple-50 rounded-xl p-3 text-center">
            <p className="text-sm text-purple-700">
              已选择：<span className="font-bold">{DECORATION_INFO[selectedDecoration].name}</span>
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-green-100">
      <h3 className="text-lg font-bold text-green-800 mb-4 text-center">操作说明</h3>

      <div className="grid grid-cols-3 gap-2 max-w-[180px] mx-auto mb-5">
        <div></div>
        <button
          onClick={() => handleClick("up")}
          className="w-12 h-12 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-xl flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95 mx-auto"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <div></div>
        <button
          onClick={() => handleClick("left")}
          className="w-12 h-12 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-xl flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95 mx-auto"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleClick("down")}
          className="w-12 h-12 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-xl flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95 mx-auto"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleClick("right")}
          className="w-12 h-12 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-xl flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95 mx-auto"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {onToggleOptimalPath && (
        <button
          onClick={onToggleOptimalPath}
          className={`w-full mb-4 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-all ${
            showOptimalPath
              ? "bg-amber-500 text-white shadow-md"
              : "bg-amber-50 hover:bg-amber-100 text-amber-700"
          }`}
        >
          <Route className="w-5 h-5" />
          {showOptimalPath ? "隐藏最优路径" : "显示最优路径"}
        </button>
      )}

      <div className="space-y-2 text-sm text-gray-600">
        <p className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-green-500 rounded-sm"></span>
          草地：需要修剪
        </p>
        <p className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-green-800 rounded-sm"></span>
          已修剪：深浅交替纹路
        </p>
        <p className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-sm bg-gradient-to-br from-pink-500 to-orange-400"></span>
          花坛：不可进入
        </p>
        <p className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-sm bg-amber-700"></span>
          小路：不可进入
        </p>
        <p className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-sm bg-amber-400/70"></span>
          最优路径参考线
        </p>
      </div>

      <p className="mt-4 text-xs text-gray-400 text-center">
        使用方向键或 WASD 控制割草机
      </p>
    </div>
  );
}
