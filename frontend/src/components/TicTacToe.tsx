import React from "react";
import type { GameStateDTO, Cell } from "@/types";

interface TicTacToeProps {
  game: GameStateDTO;
  onMove: (cellIndex: number) => void;
  isActive?: boolean;
}

export default function TicTacToe({ game, onMove, isActive = true }: TicTacToeProps) {
  const { winner, is_draw, board, id } = game;

  if (!board || !id) return null;

  return (
    <div
      className={`relative w-64 h-64 border-4 rounded ${
        isActive ? "border-yellow-400 ring-4 ring-yellow-300" : "border-gray-400 opacity-60"
      }`}
    >
      {/* Grid of cells */}
      <div className="grid grid-cols-3 gap-1 w-full h-full">
        {board.map((cell: Cell, i: number) => (
          <button
            key={`${id}-${i}`}
            className={`aspect-square w-full flex items-center justify-center text-3xl font-bold border border-gray-400 box-border focus:outline-none bg-white ${
              cell === "X" ? "text-red-600" : cell === "O" ? "text-blue-600" : "text-black"
            }`}
            onClick={() => onMove(i)}
            disabled={!isActive || !!cell || !!winner || is_draw}
          >
            {cell}
          </button>
        ))}
      </div>

      {/* Winner overlay */}
      {winner && (
        <div
          className="absolute inset-0 flex items-center justify-center text-5xl font-bold text-black bg-yellow-200 bg-opacity-50 pointer-events-none rounded"
        >
          {winner} Wins
        </div>
      )}

      {/* Draw overlay */}
      {is_draw && !winner && (
        <div
          className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-gray-800 bg-gray-200 bg-opacity-60 pointer-events-none rounded"
        >
          Draw
        </div>
      )}
    </div>
  );
}
