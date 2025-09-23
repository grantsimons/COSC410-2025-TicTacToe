"use client";
import { useEffect, useState } from "react";
import TicTacToe from "@/components/TicTacToe";
import type { GameStateDTO, Player, Cell } from "./types";

export default function App() {
  const [games, setGames] = useState<GameStateDTO[]>([]);
  const [status, setStatus] = useState("Loading...");
  const [activeBoard, setActiveBoard] = useState<number | null>(null);

  useEffect(() => {
    resetAll();
  }, []);

  // Reset all 9 boards by creating them on backend
  async function resetAll() {
    const newGames: GameStateDTO[] = [];
    for (let i = 0; i < 9; i++) {
      const res = await fetch("http://localhost:8000/tictactoe/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starting_player: "X" }), // default to X
      });
      const game: GameStateDTO = await res.json();

      // Optional: force empty board for frontend display
      game.board = Array(9).fill(null);
      game.winner = null;
      game.is_draw = false;

      newGames.push(game);
    }
    setGames(newGames);
    setStatus("X's turn");
    setActiveBoard(null);
  }

  // Handle move: call backend, update frontend
  async function handleMove(boardIndex: number, cellIndex: number) {
    if (activeBoard !== null && activeBoard !== boardIndex) return;

    const game = games[boardIndex];
    if (game.winner || game.board[cellIndex]) return;

    try {
      const res = await fetch(`http://localhost:8000/tictactoe/${game.id}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index: cellIndex }),
      });
      if (!res.ok) throw new Error("Move failed");

      const updatedGame: GameStateDTO = await res.json();

      const updatedGames = [...games];
      updatedGames[boardIndex] = updatedGame;
      setGames(updatedGames);

      // Update global status from backend
      setStatus(updatedGame.status);

      // Determine next active board
      let nextActiveBoard: number | null = cellIndex;
      const targetBoard = updatedGames[nextActiveBoard];
      if (targetBoard?.winner || targetBoard?.is_draw) {
        nextActiveBoard = null; // free choice if board is won/drawn
      }
      setActiveBoard(nextActiveBoard);
    } catch (err) {
      console.error("Move failed:", err);
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4 p-4">
      <h1 className="text-2xl font-bold">{status}</h1>

      <button
        onClick={resetAll}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        New Game
      </button>

      <div className="grid grid-cols-3 gap-4 mt-4">
        {games.map((game, i) => (
          <TicTacToe
            key={i}
            game={game}
            onMove={(cellIndex) => handleMove(i, cellIndex)}
            isActive={activeBoard === null || activeBoard === i}
          />
        ))}
      </div>
    </div>
  );
}
