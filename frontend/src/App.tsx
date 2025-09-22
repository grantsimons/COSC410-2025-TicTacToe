"use client";
import { useEffect, useState } from "react";
import TicTacToe from "@/components/TicTacToe";

// ----- DTO types -----
export type Player = "X" | "O";
export type Cell = Player | null;

export type GameStateDTO = {
  id: string;
  board: Cell[];
  current_player: Player;
  winner: Player | null;
  is_draw: boolean;
  status: string;
};

export default function App() {
  const [games, setGames] = useState<GameStateDTO[]>([]);
  const [status, setStatus] = useState("Loading...");

  // Initialize all boards
  useEffect(() => {
    resetAll();
  }, []);

  // Reset all 9 boards
  async function resetAll() {
    const newGames: GameStateDTO[] = [];
    for (let i = 0; i < 9; i++) {
      const res = await fetch("http://localhost:8000/tictactoe/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starting_player: "X" }),
      });
      newGames.push(await res.json());
    }
    setGames(newGames);
    setStatus("X's turn");
  }

  // Handle move on a board
  async function handleMove(boardIndex: number, cellIndex: number) {
    const game = games[boardIndex];
    if (game.winner || game.board[cellIndex]) return;

    const res = await fetch(
      `http://localhost:8000/tictactoe/${game.id}/move`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index: cellIndex }),
      }
    );
    const updatedGame = await res.json();

    // Update the board
    const updatedGames = [...games];
    updatedGames[boardIndex] = updatedGame;
    setGames(updatedGames);

    // Update global status
    if (updatedGame.winner) setStatus(`${updatedGame.winner} Wins!`);
    else if (updatedGame.is_draw) setStatus("Draw");
    else setStatus(`${updatedGame.current_player}'s turn`);
  }

  return (
    <div className="flex flex-col items-center space-y-4 p-4">
      {/* Global status */}
      <h1 className="text-2xl font-bold">{status}</h1>

      {/* New Game button */}
      <button
        onClick={resetAll}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        New Game
      </button>

      {/* 9-board grid */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        {games.map((game, i) => (
          <TicTacToe
            key={game.id}
            game={game}
            onMove={(cellIndex) => handleMove(i, cellIndex)}
          />
        ))}
      </div>
    </div>
  );
}
