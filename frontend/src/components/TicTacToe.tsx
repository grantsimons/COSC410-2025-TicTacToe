import React from "react";
import type { GameStateDTO } from "@/App";

interface TicTacToeProps {
  game: GameStateDTO;
  onMove: (cellIndex: number) => void;
}

export default function TicTacToe({ game, onMove }: TicTacToeProps) {
  const { winner, is_draw } = game;

  return (
    <div className="relative w-64 h-64 border-2 border-black">
      {/* Board grid */}
      <div className="grid grid-cols-3 gap-1 w-full h-full">
        {game.board.map((cell, i) => (
          <button
            key={i}
            className="aspect-square w-full
              flex items-center justify-center
              text-3xl font-bold
              border border-gray-400
              box-border
              focus:outline-none"
            onClick={() => onMove(i)}
            disabled={!!cell || !!winner || is_draw}
          >
            {cell}
          </button>
        ))}
      </div>

      {/* Overlay if winner exists */}
      {winner && (
        <div
          className={`absolute inset-0 flex items-center justify-center text-white text-5xl font-bold 
            ${winner === "X" ? "bg-red-500" : "bg-blue-500"}`}
        >
          {winner}
        </div>
      )}

      {/* Overlay if game is a draw */}
      {is_draw && !winner && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-700 text-4xl font-bold bg-gray-300">
          Draw
        </div>
      )}
    </div>
  );
}
