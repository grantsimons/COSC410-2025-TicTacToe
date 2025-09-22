import React from "react";
import type { GameStateDTO } from "@/App"; // 👈 re-use central type

interface TicTacToeProps {
  game: GameStateDTO;
  onMove: (cellIndex: number) => void;
}

export default function TicTacToe({ game, onMove }: TicTacToeProps) {
  return (
    <div className="grid grid-cols-3 gap-1 w-32 h-32 border-2 border-black">
      {game.board.map((cell, i) => (
        <button
          key={i}
          className="flex items-center justify-center w-10 h-10 border border-gray-400 text-lg font-bold"
          onClick={() => onMove(i)}
          disabled={!!cell || !!game.winner || game.is_draw}
        >
          {cell}
        </button>
      ))}
    </div>
  );
}
