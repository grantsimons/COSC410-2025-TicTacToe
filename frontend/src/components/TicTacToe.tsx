import React from "react";
import type { GameStateDTO, Cell } from "@/types";

interface TicTacToeProps {
  game: GameStateDTO;
  onMove: (cellIndex: number) => void;
  isActive?: boolean;
}

export default function TicTacToe({ game, onMove, isActive }: TicTacToeProps) {
  const { winner, is_draw } = game;

  return (
    <div
      className={`relative w-64 h-64 border-2 ${
        isActive ? "border-yellow-400 ring-4 ring-yellow-300" : "border-black opacity-60"
      }`}
    >
      <div className="grid grid-cols-3 gap-1 w-full h-full">
        {game.board.map((cell: Cell, i: number) => (
          <button
            key={i}
            className="aspect-square w-full flex items-center justify-center text-3xl font-bold border border-gray-400 box-border focus:outline-none"
            onClick={() => onMove(i)}
            disabled={!isActive || !!cell || !!winner || is_draw}
          >
            {cell}
          </button>
        ))}
      </div>

      {winner && (
        <div
          className={`absolute inset-0 flex items-center justify-center text-white text-5xl font-bold ${
            winner === "X" ? "bg-red-500" : "bg-blue-500"
          }`}
        >
          {winner}
        </div>
      )}

      {is_draw && !winner && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-700 text-4xl font-bold bg-gray-300">
          Draw
        </div>
      )}
    </div>
  );
}
